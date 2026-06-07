import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  Terminal, 
  Menu,
  X,
  BookOpen,
  Bell
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Services', path: '/services', icon: LayoutDashboard },
    { name: 'Alerts', path: '/alerts', icon: Bell },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full px-4">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="flex items-center gap-2 transition-all hover:opacity-80">
            <div className="bg-primary p-1.5 rounded-lg">
              <Terminal className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-white">Velicor</span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    isActive(link.path) 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/profile')}
                className={`rounded-full gap-2 px-4 ${isActive('/profile') ? 'bg-primary/10 text-primary' : ''}`}
              >
                <User className="w-4 h-4" /> Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="rounded-full gap-2 px-4 border-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <a 
                href="/#docs" 
                className="text-xs font-bold text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" /> Docs
              </a>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/login')}
                className="rounded-full px-4 font-bold cursor-pointer"
              >
                Sign In
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate('/register')}
                className="rounded-full px-4 font-bold cursor-pointer"
              >
                Get Started
              </Button>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-full cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 p-4 space-y-4 bg-background animate-in slide-in-from-top-2">
          {isAuthenticated ? (
            <>
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive(link.path) 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4 border-t border-border/40 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-xl gap-3 h-12"
                  onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                >
                  <User className="w-5 h-5" /> Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-xl gap-3 h-12 text-destructive border-muted"
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                >
                  <LogOut className="w-5 h-5" /> Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <a 
                href="/#docs" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted"
              >
                <BookOpen className="w-5 h-5" /> Docs
              </a>
              <div className="pt-4 border-t border-border/40 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-xl h-12 border-muted"
                  onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full justify-center rounded-xl h-12 font-bold"
                  onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
