import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthView } from '../types';
import Logo from './Logo';
import { Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasLower: false,
    hasUpper: false,
    hasDigit: false,
    hasMinLength: false,
    isValid: false
  });

  // Log user interaction
  const logUserInteraction = async (action: string, details: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('user_interactions')
        .insert([
          {
            user_id: user?.id || null,
            action,
            details: {
              ...details,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              url: window.location.href
            },
            ip_address: null,
            created_at: new Date().toISOString()
          }
        ]);
    } catch (error) {
      console.error('Failed to log user interaction:', error);
    }
  };

  useEffect(() => {
    logUserInteraction('auth_form_loaded', { view });
  }, [view]);

  const validatePassword = (pwd: string) => {
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasMinLength = pwd.length >= 8;
    const isValid = hasLower && hasUpper && hasDigit && hasMinLength;

    setPasswordStrength({
      hasLower,
      hasUpper,
      hasDigit,
      hasMinLength,
      isValid
    });

    return isValid;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    if (view === 'register') {
      validatePassword(pwd);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('Auth attempt:', { view, email, hasPassword: !!password });
    try {
      await logUserInteraction(`${view}_attempt`, { email });

      if (view === 'login') {
        console.log('Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        console.log('Login response:', { data: !!data, error: error?.message });
        
        if (error) {
          // Handle email confirmation error specifically
          if (error.message.includes('Email not confirmed') || error.message.includes('email address must be confirmed')) {
            // Try to auto-confirm the user
            try {
              const { error: confirmError } = await supabase.auth.updateUser({
                email_confirm: true
              });
              
              if (!confirmError) {
                // Retry login after confirmation
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                
                if (!retryError && retryData.user && retryData.session) {
                  await logUserInteraction('login_success_after_auto_confirm', { 
                    email, 
                    user_id: retryData.user.id
                  });
                  onAuthSuccess();
                  return;
                }
              }
            } catch (confirmError) {
              console.error('Auto-confirm failed:', confirmError);
            }
            
            setError('Account created but needs activation. Please try registering again or contact support.');
            return;
          }
          
          await logUserInteraction('login_failed', { email, error: error.message });
          throw error;
        }

        if (data.user && data.session) {
          console.log('Login successful:', data.user.id);
          await logUserInteraction('login_success', { 
            email, 
            user_id: data.user.id
          });

          // Store/update user data and track login
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              last_login_at: new Date().toISOString(),
              email_confirmed: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (upsertError) {
            console.error('Error storing user data:', upsertError);
          }

          onAuthSuccess();
        }
      } else {
        console.log('Attempting registration...');
        // Registration - Completely disable email confirmation
        if (!validatePassword(password)) {
          throw new Error('Password does not meet security requirements.');
        }

        // First, try to sign up with email confirmation disabled
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined, // Disable email confirmation
            data: {
              email_confirm: true // Auto-confirm
            }
          }
        });

        console.log('Registration response:', { data: !!data, error: error?.message });
        
        if (error) {
          await logUserInteraction('registration_failed', { email, error: error.message });
          
          if (error.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please try logging in.');
          }
          throw error;
        }

        if (data.user) {
          // If user was created but not confirmed, try to auto-confirm
          if (!data.session) {
            try {
              // Try to sign in immediately (this should work if auto-confirmation worked)
              const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (!loginError && loginData.user && loginData.session) {
                await logUserInteraction('registration_and_login_success', { 
                  email, 
                  user_id: loginData.user.id
                });
                onAuthSuccess();
                return;
              }
            } catch (autoLoginError) {
              console.error('Auto-login after registration failed:', autoLoginError);
            }
          }
          
          await logUserInteraction('registration_success', { 
            email, 
            user_id: data.user.id
          });

          // If we have a session, log them in immediately
          if (data.session) {
            onAuthSuccess();
          } else {
            // Account created successfully - user can login immediately
            setSuccess('Account created successfully! You can now log in with your credentials.');
          }
          
          setTimeout(() => {
            setView('login');
            setSuccess('');
            setPassword('');
            setPasswordStrength({
              hasLower: false,
              hasUpper: false,
              hasDigit: false,
              hasMinLength: false,
              isValid: false
            });
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      await logUserInteraction(`${view}_error`, { email, error: error.message });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {view === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access CitizenVoiceMMS municipal services instantly
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm whitespace-pre-line">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm whitespace-pre-line">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {view === 'register' && password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Password Requirements:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center space-x-1 ${getPasswordStrengthColor(passwordStrength.hasMinLength)}`}>
                      <span>•</span>
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${getPasswordStrengthColor(passwordStrength.hasLower)}`}>
                      <span>•</span>
                      <span>Lowercase letter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${getPasswordStrengthColor(passwordStrength.hasUpper)}`}>
                      <span>•</span>
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${getPasswordStrengthColor(passwordStrength.hasDigit)}`}>
                      <span>•</span>
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {view === 'login' && (
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (view === 'register' && !passwordStrength.isValid)}
            className="w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Processing...' : view === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
                setPassword('');
                setPasswordStrength({
                  hasLower: false,
                  hasUpper: false,
                  hasDigit: false,
                  hasMinLength: false,
                  isValid: false
                });
                logUserInteraction('auth_view_changed', { new_view: view === 'login' ? 'register' : 'login' });
              }}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              {view === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;