import { NextResponse } from "next/server";

// Dynamic fetch helper with retry logic for rate limits (429) or transient unavailable states (503)
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, delay = 1000): Promise<Response> {
  const response = await fetch(url, options);
  if ((response.status === 429 || response.status === 503) && retries > 0) {
    console.warn(`AI Service returned ${response.status}. Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
  return response;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI Assistant is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request payload: messages array is required." },
        { status: 400 }
      );
    }

    // 1. Filter out the static client welcome messages to prevent starting with 'model' or bloating tokens
    const filteredMessages = messages.filter((m: any) => m.role === "user" || m.content !== "welcome");

    // 2. Strict alternating sequence generator starting with 'user' for safety
    const cleanHistory: any[] = [];
    let nextExpectedRole = "user";

    for (const msg of filteredMessages) {
      const isOaiOrAnthropic = apiKey.trim().startsWith("sk-");
      const msgRole = msg.role === "user" ? "user" : (isOaiOrAnthropic ? "assistant" : "model");
      const normalizedRole = msg.role === "user" ? "user" : "model";

      if (normalizedRole === nextExpectedRole && msg.content?.trim()) {
        cleanHistory.push({
          role: msgRole,
          parts: [{ text: msg.content.trim() }],
          content: msg.content.trim() // For Anthropic payload mapping
        });
        nextExpectedRole = nextExpectedRole === "user" ? "model" : "user";
      }
    }

    // Fallback: If no valid history could be formed, start with a fallback prompt
    if (cleanHistory.length === 0 || cleanHistory[0].role !== "user") {
      return NextResponse.json(
        { error: "Conversation must begin with a user query." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are the LifeLink Donation Assistant, a helpful and careful assistant embedded in a Pakistani blood donor network app. Your ONLY job is to answer questions about blood donation eligibility, general safety, preparation before/after donating, and how the LifeLink app works. Guidelines you must follow:
1. Give general, widely-accepted donation eligibility guidance (e.g., typical minimum age 17-18, minimum weight ~50kg, waiting periods after illness, medication, tattoos, pregnancy, or recent donation — roughly 90 days between whole blood donations).
2. Always clarify you are not a doctor and cannot give a personal medical diagnosis or clearance — for any specific health condition, medication, or symptom the user mentions, advise them to confirm with the blood bank staff or their doctor before donating.
3. Be warm, concise, and reassuring — many users asking are anxious about whether they qualify to help someone in an emergency.
4. If asked about anything unrelated to blood donation or the app, politely redirect back to donation-related topics.
5. Never make up specific statistics, hospital names, or claim to access the user's personal donor record — you only give general guidance.
6. Do NOT use markdown bold asterisks (like **text**). Output clean, clear plain text without any ** symbols.`;

    const key = apiKey.trim();

    if (key.startsWith("sk-or-v1-")) {
      // 1. Call OpenRouter API
      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...cleanHistory.map((m: any) => ({
          role: m.role === "model" ? "assistant" : m.role,
          content: m.content || m.parts?.[0]?.text || "",
        })),
      ];

      const response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://lifelink.app",
          "X-Title": "LifeLink",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        return handleApiError(response.status);
      }

      const responseData = await response.json();
      const assistantReply = responseData.choices?.[0]?.message?.content || "I apologize, but I could not formulate a reply.";

      return NextResponse.json({ reply: assistantReply });
    } else if (key.startsWith("sk-ant-")) {
      // 2. Call Anthropic Messages API
      const formattedMessages = cleanHistory.map((m: any) => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content || m.parts?.[0]?.text || "",
      }));

      const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          system: systemPrompt,
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        return handleApiError(response.status);
      }

      const responseData = await response.json();
      const assistantReply = responseData.content?.[0]?.text || "I apologize, but I could not formulate a reply.";

      return NextResponse.json({ reply: assistantReply });
    } else if (key.startsWith("sk-")) {
      // 3. Call DeepSeek API (OpenAI-compatible)
      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...cleanHistory.map((m: any) => ({
          role: m.role === "model" ? "assistant" : m.role,
          content: m.content || m.parts?.[0]?.text || "",
        })),
      ];

      const response = await fetchWithRetry("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        return handleApiError(response.status);
      }

      const responseData = await response.json();
      const assistantReply = responseData.choices?.[0]?.message?.content || "I apologize, but I could not formulate a reply.";

      return NextResponse.json({ reply: assistantReply });
    } else {
      // 3. Call Google Gemini API
      const formattedContents = cleanHistory.map((m: any) => ({
        role: m.role,
        parts: m.parts,
      }));

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;

      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        }),
      });

      if (!response.ok) {
        return handleApiError(response.status);
      }

      const responseData = await response.json();
      const assistantReply = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I could not formulate a reply.";

      return NextResponse.json({ reply: assistantReply });
    }
  } catch (err: any) {
    console.error("Server API Error in Chat route:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred in the AI Assistant service." },
      { status: 500 }
    );
  }
}

function handleApiError(status: number) {
  console.error("AI Service Error Status:", status);
  if (status === 402) {
    return NextResponse.json(
      { error: "DeepSeek API account has insufficient balance. Please top up your DeepSeek balance or provide an active API key." },
      { status: 402 }
    );
  }
  if (status === 401) {
    return NextResponse.json(
      { error: "Invalid API key provided. Please verify your API key in environment settings." },
      { status: 401 }
    );
  }
  if (status === 429) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few seconds and try again." },
      { status: 429 }
    );
  }
  if (status === 503) {
    return NextResponse.json(
      { error: "The AI service is currently busy. Please try again in a moment." },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { error: "The AI Assistant service responded with an error." },
    { status }
  );
}
