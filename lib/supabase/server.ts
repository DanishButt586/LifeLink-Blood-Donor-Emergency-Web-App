import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Mock Supabase client to prevent application crashes when environment variables are missing.
const mockChain: any = {
  select: () => mockChain,
  insert: () => mockChain,
  update: () => mockChain,
  upsert: () => mockChain,
  delete: () => mockChain,
  eq: () => mockChain,
  neq: () => mockChain,
  order: () => mockChain,
  limit: () => mockChain,
  single: () => Promise.resolve({ data: null, error: null }),
  maybeSingle: () => Promise.resolve({ data: null, error: null }),
  then: (onfulfilled: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled),
};

const mockAuth: any = {
  getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({
    data: {
      subscription: {
        unsubscribe: () => {},
      },
    },
  }),
  signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
  signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
  signOut: () => Promise.resolve({ error: null }),
};

const mockChannel: any = {
  on: () => mockChannel,
  subscribe: () => mockChannel,
};

const mockSupabase = {
  auth: mockAuth,
  from: () => mockChain,
  channel: () => mockChannel,
  removeChannel: () => Promise.resolve(),
};

/**
 * Supabase client for use in Server Components, Route Handlers, and Server Actions.
 * Falls back to a mock client if environment variables are not configured.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return mockSupabase as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no request context — safe to
            // ignore when middleware is also refreshing the session.
          }
        },
      },
    },
  );
}
