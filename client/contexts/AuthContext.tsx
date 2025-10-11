import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserRegistrationService } from '@/lib/user-registration';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { 
        error: { 
          message: 'Configuration error: Please ensure Supabase is properly set up. Visit /setup for guidance.' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('🚀 Starting comprehensive user registration...');
      
      // Use the comprehensive registration service
      const result = await UserRegistrationService.registerUser({
        email,
        password,
        username,
        fullName: username
      });
      
      if (result.error) {
        console.error('❌ Registration failed:', result.error);
        return { data: null, error: result.error };
      }
      
      console.log('✅ User registration completed successfully');
      if (result.profile) {
        console.log('✅ Profile created:', result.profile.username);
      }
      
      return { 
        data: { user: result.user, session: null },
        error: null 
      };
      
    } catch (err) {
      console.error('❌ Signup process failed:', err);
      return { 
        data: null,
        error: { 
          message: 'Registration failed. Please check your connection and try again.' 
        } 
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}