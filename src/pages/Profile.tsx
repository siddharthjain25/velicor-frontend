import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe, updateUserProfile, deleteAccount, type User } from '../api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { User as UserIcon, Save, Lock, UserCircle, AlertTriangle, Trash2 } from 'lucide-react';

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
        setMessage({ type: 'error', text: 'Failed to load profile' });
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
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <UserCircle className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">User Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account settings and credentials</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <Card className="border-muted shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Personal Information
            </CardTitle>
            <CardDescription>Update your public identity on the platform</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-bold border ${
                message.type === 'success' 
                  ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid gap-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Username</label>
              <Input value={user?.username || ''} disabled className="bg-muted/50 cursor-not-allowed font-mono" />
              <p className="text-[10px] text-muted-foreground italic">Username cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">First Name</label>
                <Input 
                  placeholder="First name" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Last Name</label>
                <Input 
                  placeholder="Last name" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-4 h-4" /> Security
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">New Password</label>
              <Input 
                type="password" 
                placeholder="Leave blank to keep current" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 shadow-sm overflow-hidden bg-destructive/5">
          <CardHeader className="bg-destructive/10 pb-6">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-destructive/70">Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm">Delete Account</h4>
                <p className="text-xs text-muted-foreground">Permanently remove your account and all associated data</p>
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                className="rounded-full gap-2"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="px-8 h-12 rounded-full font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving Changes...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Profile
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
