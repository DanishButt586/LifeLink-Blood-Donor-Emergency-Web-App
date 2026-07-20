import { createBrowserClient } from "@supabase/ssr";

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
 * Supabase client for use in Client Components.
 * Falls back to a mock client if environment variables are not configured.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return mockSupabase as any;
  }

  return createBrowserClient(url, key);
}
