import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Terminal, KeyRound, User, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await apiLogin(username, password);
      login(data.access_token);
      navigate('/services');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[75vh] px-4 py-8 overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-border/60 bg-[#0d1117]/85 backdrop-blur-md rounded-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center pt-8 pb-2">
          <div className="bg-primary p-2.5 rounded-xl mb-3 shadow-lg shadow-primary/10">
            <Terminal className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> Secure Gatekeeper
          </div>
        </div>

        <CardHeader className="space-y-1.5 pt-0">
          <CardTitle className="text-2xl text-center font-black tracking-tight text-white">Sign In</CardTitle>
          <CardDescription className="text-center text-xs text-muted-foreground max-w-xs mx-auto">
            Provide your authentication key credentials to access the telemetry console
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-4 pt-2">
          {error && (
            <div className="p-3.5 text-xs font-semibold text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 flex gap-2 items-start animate-in shake duration-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground/60" /> Username
              </label>
              <Input 
                type="text" 
                placeholder="johndoe"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground/60" /> Password
                </label>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-3 h-11 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? "Validating Token..." : "Access Console"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground pb-8 pt-2">
          New terminal user?{" "}
          <Link to="/register" className="font-bold text-primary hover:underline underline-offset-4 transition-colors">
            Create account
          </Link>
        </CardFooter>

      </Card>
    </div>
  );
};
