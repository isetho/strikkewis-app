import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
type UserRole = 'designer' | 'knitter' | 'both' | null;

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
  // Always authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // Default user with both roles
  const defaultUser: User = {
    id: 'default-user',
    app_metadata: {},
    user_metadata: { role: 'both' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'default@example.com',
    phone: '',
    role: '',
    updated_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: undefined,
    factors: [],
    identities: [],
    recovery_sent_at: undefined,
    confirmation_sent_at: new Date().toISOString(),
    email_change_sent_at: undefined,
    invited_at: undefined,
    action_link: undefined,
  };
  const [user, setUser] = useState<User | null>(defaultUser);
  const [userRole, setUserRole] = useState<UserRole>('both');

  // Simplified getUserRole that always returns 'both'
  const getUserRole = async (user: User): Promise<UserRole> => {
    return 'both';
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    // No-op - always succeeds
    return;
  };

  const signIn = async (email: string, password: string) => {
    // No-op - always succeeds
    navigate('/');
  };

  const logout = async (): Promise<void> => {
    // No-op - does nothing
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