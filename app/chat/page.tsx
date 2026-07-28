"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Trash2,
  HelpCircle,
  ShieldCheck,
  Syringe,
  Scale,
  Clock,
  Network,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { BloodDropWatermark } from "@/components/shared/BloodDropWatermark";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const PRESETS: { question: string; icon: LucideIcon }[] = [
  { question: "Can I donate blood if I got a tattoo recently?", icon: Syringe },
  { question: "What is the minimum weight requirement for donating blood?", icon: Scale },
  { question: "How long should I wait after recovering from a flu?", icon: Clock },
  { question: "How does the matching logic work on LifeLink?", icon: Network },
];

function getInitials(name?: string | null) {
  if (!name) return null;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || null;
}

/** Renders plain text with basic bullet/numbered-list detection, stripping raw markdown asterisks ** so AI replies read cleanly without raw syntax. */
function renderMessageContent(content: string) {
  type Block = { type: "p" | "ul" | "ol"; items: string[] };
  const blocks: Block[] = [];

  const stripFormatting = (str: string) => str.replace(/\*\*/g, "").replace(/__/g, "");

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const bulletMatch = /^[-*•]\s+(.*)/.exec(line);
    const numberedMatch = /^\d+[.)]\s+(.*)/.exec(line);

    if (bulletMatch) {
      const cleanItem = stripFormatting(bulletMatch[1]);
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(cleanItem);
      else blocks.push({ type: "ul", items: [cleanItem] });
    } else if (numberedMatch) {
      const cleanItem = stripFormatting(numberedMatch[1]);
      const last = blocks[blocks.length - 1];
      if (last?.type === "ol") last.items.push(cleanItem);
      else blocks.push({ type: "ol", items: [cleanItem] });
    } else {
      const cleanLine = stripFormatting(line);
      blocks.push({ type: "p", items: [cleanLine] });
    }
  }

  return blocks.map((block, i) => {
    const spacing = i > 0 ? "mt-2" : "";
    if (block.type === "ul") {
      return (
        <ul key={i} className={cn("list-disc space-y-1 pl-4", spacing)}>
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    }
    if (block.type === "ol") {
      return (
        <ol key={i} className={cn("list-decimal space-y-1 pl-4", spacing)}>
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ol>
      );
    }
    return (
      <p key={i} className={spacing}>
        {block.items[0]}
      </p>
    );
  });
}

function PresetCard({
  icon: Icon,
  question,
  onClick,
}: {
  icon: LucideIcon;
  question: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="group flex h-full items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground line-clamp-3">
        {question}
      </span>
    </motion.button>
  );
}

export default function ChatPage() {
  const { showToast } = useToast();
  const { user, profile } = useAuth();

  const userId = user?.id || "guest";
  const storageKey = `lifelink_chat_history_${userId}`;

  const defaultWelcomeMessage: Message = {
    id: "welcome",
    role: "assistant",
    content: "Hello! I am the LifeLink Donation Assistant. Ask me any questions about blood donation eligibility, prep guidelines, safety rules, or how our matching system works in Pakistan. (Please note: I am an AI assistant, not a doctor. Always check with medical staff for official clearance.)",
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([defaultWelcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isLoadedRef = useRef(false);

  // Load user-specific chat history from localStorage on mount or when user session changes
  useEffect(() => {
    isLoadedRef.current = false;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const messagesWithDates = parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(messagesWithDates);
        } else {
          setMessages([defaultWelcomeMessage]);
        }
      } else {
        setMessages([defaultWelcomeMessage]);
      }
    } catch (e) {
      console.error("Failed to load chat history from localStorage", e);
      setMessages([defaultWelcomeMessage]);
    } finally {
      isLoadedRef.current = true;
    }
  }, [storageKey]);

  // Save chat history under user-specific key on message updates (only after initial load completes)
  useEffect(() => {
    if (!isLoadedRef.current) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history to localStorage", e);
    }
  }, [messages, storageKey]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const userInitials = getInitials(profile?.full_name);

  // Auto scroll to bottom of the chat container without scrolling the browser window
  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    // Use instant scroll on initial mount, smooth scroll on updates
    const behavior = messages.length === 1 && !isLoading ? "auto" : "smooth";
    scrollToBottom(behavior);
  }, [messages, isLoading]);

  async function handleSendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch response from assistant.");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      showToast({
        title: "Chat Error",
        description: err.message || "Something went wrong while sending message.",
        variant: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSendMessage(input);
  }

  function clearHistory() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "History cleared. Ask me any questions about blood donation eligibility, preparation, safety, or how LifeLink works.",
        timestamp: new Date(),
      },
    ]);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-60" aria-hidden="true" />
      <BloodDropWatermark className="-right-20 -top-16 rotate-12 scale-[0.55]" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-primary/25 animate-pulse-ring" aria-hidden="true" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                  Ask LifeLink
                </h1>
                <Badge variant="neutral" className="uppercase tracking-wide">
                  AI Assistant
                </Badge>
              </div>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Check blood donation eligibility rules, prep safety, and general
                guidelines — warm, quick answers whenever you need them.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {messages.length > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="self-start sm:self-auto"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-muted-foreground hover:text-danger hover:bg-danger/5 gap-1.5"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Chat
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {/* Presets Sidebar */}
          <div className="hidden md:col-span-1 md:block md:space-y-3">
            <h3 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
              Common Questions
            </h3>
            <p className="text-xs italic text-muted-foreground/80">
              Not sure what to ask? Try one of these.
            </p>
            <div className="flex flex-col gap-2">
              {PRESETS.map((preset) => (
                <PresetCard
                  key={preset.question}
                  icon={preset.icon}
                  question={preset.question}
                  onClick={() => handleSendMessage(preset.question)}
                />
              ))}
            </div>
          </div>

          {/* Chat window */}
          <Card className="flex h-[60vh] flex-col overflow-hidden border-border bg-card/70 shadow-lg ring-1 ring-border/40 backdrop-blur-sm md:col-span-3">
            <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary via-primary/60 to-secondary/60" />

            {/* Messages Scroll Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-5 scrollbar-thin"
              role="log"
              aria-label="Conversation history"
            >
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const isWelcome = message.id === "welcome";
                  const prev = messages[index - 1];
                  const isGrouped = !isWelcome && prev && prev.role === message.role;

                  if (isWelcome) {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mr-auto flex max-w-[92%] gap-3 sm:max-w-[85%]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground shadow-sm">
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="rounded-2xl rounded-tl-sm border border-secondary/25 bg-secondary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
                          {renderMessageContent(message.content)}
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex max-w-[85%] gap-3 sm:max-w-[75%]",
                        isUser ? "ml-auto flex-row-reverse" : "mr-auto",
                        isGrouped ? "mt-1.5" : "mt-4",
                      )}
                    >
                      {isGrouped ? (
                        <div className="w-8 shrink-0" aria-hidden="true" />
                      ) : (
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold shadow-sm",
                            isUser
                              ? "bg-primary/10 text-primary"
                              : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
                          )}
                        >
                          {isUser ? (
                            userInitials ?? <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </span>
                      )}
                      <div
                        className={cn(
                          "bg-grain rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "rounded-tr-sm bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-primary/15"
                            : "rounded-tl-sm border border-border/60 bg-card text-foreground",
                        )}
                      >
                        {renderMessageContent(message.content)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mr-auto mt-4 flex max-w-[75%] items-center gap-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3.5 shadow-sm">
                    <span className="sr-only">Assistant is typing</span>
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 dark:bg-muted-foreground/70"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 dark:bg-muted-foreground/70"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 dark:bg-muted-foreground/70"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Form input */}
            <div className="border-t border-border bg-card p-4">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5">
                <div className="flex flex-1 items-center rounded-full border border-input bg-background pl-1.5 shadow-sm transition-shadow focus-within:border-transparent focus-within:ring-2 focus-within:ring-ring">
                  <Input
                    placeholder="Ask about eligibility, safety, or how matching works..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="border-0 bg-transparent px-2.5 shadow-none focus:ring-0"
                    aria-label="Ask a question about blood donation eligibility"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 w-11 shrink-0 rounded-full p-0"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Mobile presets list */}
        <div className="mt-6 space-y-3 md:hidden">
          <h3 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            Common Questions
          </h3>
          <p className="text-xs italic text-muted-foreground/80">
            Not sure what to ask? Try one of these.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESETS.map((preset) => (
              <PresetCard
                key={preset.question}
                icon={preset.icon}
                question={preset.question}
                onClick={() => handleSendMessage(preset.question)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
