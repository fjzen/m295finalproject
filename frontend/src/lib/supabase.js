import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Returns the current user with linked employee and backend role, or null if not logged in.
 * If logged in but no user_account / employee link: returns user with employee: null, role: null.
 * UI must show blocking error when user exists but employee is null (spec: no fallback user).
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  try {
    const { data: userAccount, error: accountError } = await supabase
      .from('user_account')
      .select('*, employee(*)')
      .eq('supabase_user_id', user.id)
      .maybeSingle();

    if (accountError || !userAccount) {
      return { ...user, employee: null, role: null };
    }

    return {
      ...user,
      employee: userAccount.employee ?? null,
      role: userAccount.employee?.role ?? null,
    };
  } catch {
    return { ...user, employee: null, role: null };
  }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

