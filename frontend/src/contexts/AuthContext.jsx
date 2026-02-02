import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toSpecRole } from '@/lib/roles';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /** Spec role for UI: ADMIN | MANAGER | WORKER (backend GL/ADMIN/BL/MA mapped here) */
  const role = toSpecRole(user?.role);
  /** User is logged in but has no linked employee (blocking error in UI) */
  const hasLinkedEmployee = !!user?.employee;

  const value = {
    user,
    role,
    hasLinkedEmployee,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/login');
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

