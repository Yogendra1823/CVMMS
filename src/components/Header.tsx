import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppSection } from '../types';
import Logo from './Logo';
import UserProfile from './UserProfile';
import { Home, FileText, Search, MessageCircle, Phone, LogOut, User, Settings } from 'lucide-react';

interface HeaderProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, onSectionChange, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const menuItems = [
    { id: 'home' as AppSection, label: 'Home', icon: Home },
    { id: 'report' as AppSection, label: 'Report Issue', icon: FileText },
    { id: 'track' as AppSection, label: 'Track Complaint', icon: Search },
    { id: 'feedback' as AppSection, label: 'Feedback', icon: MessageCircle },
    { id: 'contact' as AppSection, label: 'Contact', icon: Phone },
  ];

  return (
    <>
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo size="md" />
            
            <nav className="hidden md:flex space-x-8">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition duration-200 ${
                    activeSection === id
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-600 hover:text-blue-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        setShowProfile(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-gray-200 pt-4 pb-2">
            <div className="grid grid-cols-3 gap-2">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition duration-200 ${
                    activeSection === id
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:text-blue-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Header;