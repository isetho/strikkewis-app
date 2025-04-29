import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';

const AUTH_ERROR_MESSAGES = {
  'Email rate limit exceeded': 'Please wait a few minutes before trying again',
  'User already registered': 'An account with this email already exists. Please log in instead.',
  'Auth session missing': 'Please check your email to verify your account before logging in. Once verified, you can log in here.',
} as const;

const baseSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const signupSchema = baseSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = baseSchema.extend({
  password: z.string()
});

export const Login = () => {
  const { signIn, signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'none' | 'pending' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'designer' | 'knitter'>('knitter');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setRegistrationStatus('none');
    setValidationErrors({});

    try {
      // Use different validation schemas for login and signup
      const schema = isSignUp ? signupSchema : loginSchema;
      const result = schema.safeParse({ email, password });
      if (!result.success) {
        const errors: { [key: string]: string } = {};
        result.error.issues.forEach(issue => {
          errors[issue.path[0].toString()] = issue.message;
        });
        setValidationErrors(errors);
        return;
      }

      // Check if account is locked
      const { data: isLocked } = await supabase.rpc('is_account_locked', { user_email: email });
      if (isLocked) {
        setError('This account is temporarily locked. Please try again later.');
        return;
      }

      // Check rate limiting
      const { data: isLimited } = await supabase.rpc('is_rate_limited', { user_email: email });
      if (isLimited) {
        setError('Too many login attempts. Please try again in 15 minutes.');
        return;
      }

      if (isSignUp) {
        if (!selectedRole) {
          setError('Please select whether you are a designer or knitter');
          return;
        }
        
        // Check if user already exists
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (existingUser.user) {
          setError('An account with this email already exists. Please log in instead.');
          return;
        }

        try {
          await signUp(email, password, selectedRole);
          setRegistrationStatus('pending');
          setEmail('');
          setPassword('');
          setError(<>Please check your email to verify your account before logging in. Once verified, you can <Link to="/login" className="text-purple500-regular hover:underline">log in here</Link>.</>);
        } catch (err) {
          if (err instanceof Error) {
            // Check for known error messages
            const errorMessage = Object.entries(AUTH_ERROR_MESSAGES).find(
              ([key]) => err.message.includes(key)
            );
            
            if (errorMessage) {
              setError(errorMessage[1]);
            } else {
              setError('An error occurred during registration. Please try again.');
            }
          }
        }
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      if (err instanceof Error) {
        // Check for known error messages
        const errorMessage = Object.entries(AUTH_ERROR_MESSAGES).find(
          ([key]) => err.message.includes(key)
        );
        
        if (errorMessage) {
          setError(errorMessage[1]);
        } else {
          setError('An error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7ff] p-4 sm:p-6 md:p-8">
      <div className="max-w-[640px] mx-auto">
        <h1 className="font-text-5xl text-black mb-8">
          Logg inn eller registrer deg 💜
        </h1>

        <div className="bg-white rounded-xl p-8">
          {isSignUp && <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">Jeg er en...</h2>
            <div className="flex gap-4">
              <button
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  selectedRole === 'designer'
                    ? 'border-purple500-regular bg-purple200-light'
                    : 'border-gray-200 hover:border-purple500-regular'
                }`}
                onClick={() => setSelectedRole('designer')}
              >
                Strikkedesigner
              </button>
              <button
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  selectedRole === 'knitter'
                    ? 'border-purple500-regular bg-purple200-light'
                    : 'border-gray-200 hover:border-purple500-regular'
                }`}
                onClick={() => setSelectedRole('knitter')}
              >
                Strikker
              </button>
            </div>
          </div>}

          {error && (
            <div className="px-4 py-3 rounded-lg mb-6 bg-red-100 border border-red-400 text-red-700">
              {typeof error === 'string' ? error : error}
            </div>
          )}

          {registrationStatus === 'pending' && (
            <div className="px-4 py-3 rounded-lg mb-6 bg-green-100 border border-green-400 text-green-700">
              Registration successful! Please check your email to verify your account.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                E-post
                {validationErrors.email && (
                  <span className="text-red-500 text-xs ml-2">{validationErrors.email}</span>
                )}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 border rounded-lg ${
                  validationErrors.email ? 'border-red-500' : ''
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Passord
                {validationErrors.password && (
                  <span className="text-red-500 text-xs ml-2">{validationErrors.password}</span>
                )}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg ${
                  validationErrors.password ? 'border-red-500' : ''
                }`}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple500-regular text-white p-3 rounded-lg hover:bg-opacity-90 relative"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">
                    {isSignUp ? 'Registrer deg' : 'Logg inn'}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                isSignUp ? 'Registrer deg' : 'Logg inn'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setRegistrationStatus('none');
                setError(null);
                setIsSignUp(!isSignUp);
              }}
              className="w-full text-center text-gray-600 hover:text-gray-900"
            >
              {isSignUp
                ? 'Har du allerede en konto? Logg inn'
                : 'Har du ikke en konto? Registrer deg'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};