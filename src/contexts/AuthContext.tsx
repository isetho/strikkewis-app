import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
type UserRole = 'designer' | 'knitter' | null;

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole;
  logout: () => Promise<void>;
  user: User | null;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Get role from user metadata first, then fallback to database
  const getUserRole = async (user: User): Promise<UserRole> => {
    // First check metadata
    const metadataRole = user.user_metadata?.role as UserRole;
    if (metadataRole) {
      return metadataRole;
    }

    // Fallback to database lookup
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.roles?.name as UserRole) || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    // Update user metadata with role after signup
    const { error: updateError } = await supabase.auth.updateUser({
      data: { role }
    });

    if (updateError) {
      throw updateError;
    }
    
    // Don't auto sign in - let user verify email first
    return;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw new Error(error.message);
    }
    
    if (data.user) {
      const role = await getUserRole(data.user);
      navigate(role === 'designer' ? '/designer' : '/knitter');
    }
  };

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const role = await getUserRole(session.user);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error initializing auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const previousAuth = isAuthenticated;
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        getUserRole(session.user).then(role => {
          setUserRole(role);
        });
      } else {
        setUserRole(null);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, userRole, logout, user, signUp, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};