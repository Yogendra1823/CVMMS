import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { AppSection } from './types';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import Home from './components/sections/Home';
import ReportIssue from './components/sections/ReportIssue';
import TrackComplaint from './components/sections/TrackComplaint';
import Feedback from './components/sections/Feedback';
import Contact from './components/sections/Contact';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AppSection>('home');

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
            created_at: new Date().toISOString()
          }
        ]);
    } catch (error) {
      console.error('Failed to log user interaction:', error);
    }
  };

  useEffect(() => {
    // Get initial session - no email confirmation check needed
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Handle invalid refresh token errors
      if (error && (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token'))) {
        console.log('Invalid refresh token detected, clearing session...');
        supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('Initial session check:', { hasSession: !!session, hasUser: !!session?.user });
      if (session?.user) {
        setUser(session.user);
        // Store/update user data in our users table
        supabase
          .from('users')
          .upsert({
            id: session.user.id,
            email: session.user.email,
            email_confirmed: true, // Always true since we don't require confirmation
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .then(({ error }) => {
            if (error) console.error('Error storing user data:', error);
          });
        
        logUserInteraction('app_session_restored', { user_id: session.user.id });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes - no email confirmation check needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        console.log('Session data:', { hasSession: !!session, hasUser: !!session?.user });
        
        if (session?.user) {
          setUser(session.user);
          
          // Store/update user data and track login
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              email_confirmed: true, // Always true since we don't require confirmation
              last_login_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (upsertError) {
            console.error('Error storing user data:', upsertError);
          }

          // Log the auth event
          await logUserInteraction(`auth_${event}`, { 
            user_id: session.user.id,
            email: session.user.email 
          });
        } else {
          setUser(null);
          if (event === 'SIGNED_OUT') {
            await logUserInteraction('user_signed_out');
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // User state will be updated by the auth state change listener
    logUserInteraction('auth_success_callback');
  };

  const handleLogout = () => {
    setActiveSection('home');
    logUserInteraction('logout_initiated');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <Home onSectionChange={setActiveSection} />;
      case 'report':
        return <ReportIssue />;
      case 'track':
        return <TrackComplaint />;
      case 'feedback':
        return <Feedback />;
      case 'contact':
        return <Contact />;
      default:
        return <Home onSectionChange={setActiveSection} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CitizenVoiceMMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      <main>
        {renderSection()}
      </main>
    </div>
  );
}

export default App;