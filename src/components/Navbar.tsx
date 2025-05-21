import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAuth();

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <a
              onClick={handleHomeClick}
              style={{ cursor: 'pointer' }}
              className="hover:opacity-80 transition-opacity block"
            >
              <div>
                <Logo />
              </div>
            </a>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/knitter-projects')}
                className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-[48px]"
              >
                <Home className="w-4 h-4" />
                Strikkeprosjekter
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/designer-projects')}
                className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-[48px]"
              >
                <Home className="w-4 h-4" />
                Designerprosjekter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};