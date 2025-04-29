import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LogIn, LogOut, User } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, logout, isLoading, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleHomeClick = () => {
    if (isAuthenticated && userRole) {
      navigate(userRole === 'designer' ? '/designer-projects' : '/knitter-projects');
    } else {
      navigate('/');
    }
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
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={handleHomeClick}
                    className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-[48px]"
                  >
                    <Home className="w-4 h-4" />
                    Hjem
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-[48px]"
                      >
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {user?.user_metadata?.full_name || user?.email}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem className="text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {userRole === 'designer' ? 'Designer' : 'Strikker'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        onClick={logout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logg ut
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <Button
                variant="default"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-neutralsblack rounded-[48px] px-4 py-2 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="font-text-base text-neutralswhite text-[length:var(--text-base-font-size)] tracking-[var(--text-base-letter-spacing)] leading-[var(--text-base-line-height)] [font-style:var(--text-base-font-style)]">
                  Logg inn
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};