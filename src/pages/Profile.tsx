import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe, updateUserProfile, deleteAccount, type User } from '../api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { User as UserIcon, Save, Lock, UserCircle, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';

export const Profile: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const userData = await getMe(token);
        setUser(userData);
        setFirstName(userData.first_name || '');
        setLastName(userData.last_name || '');
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Failed to retrieve user profile settings.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
      };
      if (password) updateData.password = password;
      
      const updatedUser = await updateUserProfile(token, updateData);
      setUser(updatedUser);
      setPassword('');
      setMessage({ type: 'success', text: 'Telemetry profile settings synchronized successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Operation failed. Please check inputs.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    
    const confirmed = window.confirm("WARNING: This will PERMANENTLY delete your account and all associated services and logs. This action cannot be undone. Are you sure?");
    
    if (confirmed) {
      const secondConfirmation = window.confirm("Final check: Are you absolutely sure you want to delete your account?");
      if (secondConfirmation) {
        try {
          await deleteAccount(token);
          logout();
          navigate('/register');
        } catch (err: any) {
          setMessage({ type: 'error', text: err.message || 'Failed to delete account' });
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground italic">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="uppercase tracking-widest text-[10px] font-bold">Accessing Profile Store...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex items-center gap-4 py-2 border-b border-border/40">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <UserCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">User Settings</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Manage console credentials and system access tokens</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        
        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal Details */}
          <Card className="border-border/60 bg-[#0d1117]/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/40 bg-[#161b22]/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <UserIcon className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription className="text-[11px]">Update your public console identity settings</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 flex-grow">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Username</label>
                <Input 
                  value={user?.username || ''} 
                  disabled 
                  className="bg-muted/30 cursor-not-allowed font-mono text-xs text-muted-foreground border-border/30 rounded-xl h-11" 
                />
                <p className="text-[9px] text-muted-foreground/60 italic">System identifier cannot be modified</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">First Name</label>
                  <Input 
                    placeholder="First name" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Last Name</label>
                  <Input 
                    placeholder="Last name" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Security settings */}
          <Card className="border-border/60 bg-[#0d1117]/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/40 bg-[#161b22]/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Lock className="w-4 h-4 text-primary" /> Key Security
              </CardTitle>
              <CardDescription className="text-[11px]">Modify credentials used to enter this account</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 flex-grow">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">New Password</label>
                <Input 
                  type="password" 
                  placeholder="Leave blank to preserve current" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs"
                />
                <p className="text-[9px] text-muted-foreground/60 italic">Ensure password utilizes at least 8 characters</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 3: Danger Zone */}
        <Card className="border-red-500/20 bg-red-500/[0.02] shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-red-500/10 bg-red-500/5 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-red-400/70 text-[11px]">Irreversible actions for your credentials</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-xs text-white">Delete Telemetry Account</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Permanently drop user tables, metadata records, and API hooks</p>
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                className="rounded-xl gap-2 font-bold text-xs h-10 px-4 cursor-pointer"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-3.5 h-3.5" /> Decommission Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Action */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="px-8 h-11 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Synchronizing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Configuration
              </span>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
};
