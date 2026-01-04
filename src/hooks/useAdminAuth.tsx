import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  user_id: string;
}

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  adminProfile: AdminProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch admin profile
  const fetchAdminProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, email, user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setAdminProfile(data);
        setIsAdmin(true);
      } else {
        setAdminProfile(null);
        setIsAdmin(false);
      }
    } catch {
      setAdminProfile(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (newSession?.user) {
          setTimeout(() => {
            fetchAdminProfile(newSession.user.id);
          }, 0);
        } else {
          setAdminProfile(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchAdminProfile(existingSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // const signIn = async (email: string, password: string) => {
  //   try {
  //     const { error } = await supabase.auth.signInWithPassword({
  //       email,
  //       password,
  //     });
      
  //     if (error) {
  //       return { error: new Error(error.message) };
  //     }
      
  //     return { error: null };
  //   } catch (err) {
  //     return { error: err as Error };
  //   }
  // };


  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // 1️⃣ Ambil data admin + password_hash
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, email, user_id, password_hash')
        .eq('email', email)
        .single();

      if (error || !data) {
        return { error: new Error('Email atau password salah') };
      }

      // 2️⃣ Hash password input
      const encoder = new TextEncoder();
      const buf = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(password + 'campus_salt_key_2024')
      );
      const inputHash = Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 3️⃣ Cocokkan dengan password_hash di DB
      if (inputHash !== data.password_hash) {
        return { error: new Error('Email atau password salah') };
      }

      // 4️⃣ SET STATE SEPERTI LOGIN LAMA (COMPAT MODE)
      setUser({
        id: data.id,
        email: data.email,
      } as User);

      setSession({
        user: {
          id: data.id,
          email: data.email,
        },
      } as Session);

      setAdminProfile({
        id: data.id,
        name: data.name,
        email: data.email,
        user_id: data.user_id,
      });

      setIsAdmin(true);

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    } finally {
      setIsLoading(false);
    }
  };


  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/admin/dashboard`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        return { error: new Error(authError.message) };
      }

      if (!authData.user) {
        return { error: new Error('Registrasi gagal. Silakan coba lagi.') };
      }

      // Create admin profile (trigger will auto-assign role)
      const { error: profileError } = await supabase
        .from('admins')
        .insert({
          user_id: authData.user.id,
          name,
          email,
          password_hash: 'supabase_auth', // Not used, just for compatibility
        });

      if (profileError) {
        // If profile creation fails, still return success as auth was created
        console.error('Profile creation error:', profileError);
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAdminProfile(null);
    setIsAdmin(false);
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        return { error: new Error(error.message) };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      
      if (error) {
        return { error: new Error(error.message) };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        adminProfile,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        updatePassword,
        resetPassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
