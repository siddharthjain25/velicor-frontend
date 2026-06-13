import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { KeyRound, User, AlertCircle, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await apiRegister(username, password, firstName, lastName);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different username.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex items-center justify-center min-h-[75vh] px-4 py-8 overflow-hidden">
        {/* Background Decorative Blurs */}
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        
        <Card className="w-full max-w-md border-emerald-500/20 bg-emerald-500/[0.02] shadow-2xl rounded-2xl relative z-10 p-6 text-center animate-in zoom-in-95 duration-300">
          <CardHeader className="space-y-4">
            <div className="mx-auto bg-emerald-500/10 p-3 rounded-full w-fit">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white font-black tracking-tight">Registration Complete</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-2 max-w-xs mx-auto">
                Your credentials have been safely provisioned. Redirecting to the gatekeeper console...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-[75vh] px-4 py-8 overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-border/60 bg-[#0d1117]/85 backdrop-blur-md rounded-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center pt-8 pb-2">
          <img src="/logo.png" alt="Velicor Logo" className="w-12 h-12 object-contain rounded-xl mb-3 shadow-lg shadow-primary/10" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> System Enrollment
          </div>
        </div>

        <CardHeader className="space-y-1.5 pt-0">
          <CardTitle className="text-2xl text-center font-black tracking-tight text-white">Create Account</CardTitle>
          <CardDescription className="text-center text-xs text-muted-foreground max-w-xs mx-auto">
            Provision dashboard credentials to manage your ingestion nodes
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                  First Name
                </label>
                <Input 
                  type="text" 
                  placeholder="John"
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                  Last Name
                </label>
                <Input 
                  type="text" 
                  placeholder="Doe"
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs"
                />
              </div>
            </div>

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
                className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground/60" /> Password
              </label>
              <div className="relative flex items-center">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-3 h-11 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? "Provisioning..." : "Initialize Profile"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground pb-8 pt-2">
          Already have credentials?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline underline-offset-4 transition-colors">
            Login
          </Link>
        </CardFooter>

      </Card>
    </div>
  );
};
