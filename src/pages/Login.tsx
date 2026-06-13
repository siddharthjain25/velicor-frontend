import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin, verify2FALogin, resetPassword } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { KeyRound, User, AlertCircle, Sparkles, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { OtpInput } from '../components/OtpInput';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await apiLogin(username, password);
      if (data.requires_2fa) {
        setTempToken(data.access_token);
        setShow2FA(true);
      } else {
        login(data.access_token);
        navigate('/services');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const codeToSend = useBackupCode ? backupCode : twoFactorCode;
      const data = await verify2FALogin(tempToken, codeToSend);
      login(data.access_token);
      navigate('/services');
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code. Please verify and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    try {
      await resetPassword(username, resetCode, newPassword);
      setSuccessMessage("Password reset successfully! You can now log in with your new credentials.");
      setIsResettingPassword(false);
      setUsername('');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your username and 2FA code.');
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
          <img src="/logo.png" alt="Velicor Logo" className="w-12 h-12 object-contain rounded-xl mb-3 shadow-lg shadow-primary/10" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> Secure Gatekeeper
          </div>
        </div>

        <CardHeader className="space-y-1.5 pt-0">
          <CardTitle className="text-2xl text-center font-black tracking-tight text-white">
            {isResettingPassword ? "Reset Password" : show2FA ? "Two-Factor Auth" : "Sign In"}
          </CardTitle>
          <CardDescription className="text-center text-xs text-muted-foreground max-w-xs mx-auto">
            {isResettingPassword
              ? "Verify credentials with your 2FA OTP or Backup code"
              : show2FA 
                ? "Open your Google Authenticator app and enter the 6-digit verification code" 
                : "Provide your authentication key credentials to access the telemetry console"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-4 pt-2">
          {error && (
            <div className="p-3 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-2 mb-2 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="p-3 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-2 mb-2 animate-in slide-in-from-top-2 duration-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {isResettingPassword ? (
            <form onSubmit={handleResetPassword} className="grid gap-4 animate-in slide-in-from-left-4 duration-300">
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
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground/60" /> 2FA Code / Backup Code
                </label>
                <Input 
                  type="text" 
                  placeholder="123456 or ABCD-1234"
                  value={resetCode} 
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())} 
                  required 
                  className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs font-mono"
                />
                <p className="text-[9px] text-muted-foreground/60 italic leading-relaxed">
                  Provide either your current 6-digit authenticator app code or one of your 9-character backup recovery codes.
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/60" /> New Password
                </label>
                <div className="relative flex items-center">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/60" /> Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-3 h-11 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer" 
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Confirm Password Reset"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setIsResettingPassword(false);
                  setError('');
                  setUsername('');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-center text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-1 font-bold uppercase tracking-wider"
              >
                Back to Login
              </button>
            </form>
          ) : show2FA ? (
            <form onSubmit={handleVerify2FA} className="grid gap-4 animate-in slide-in-from-right-4 duration-300">
              {useBackupCode ? (
                <div className="grid gap-2 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5 mb-1">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground/60" /> Backup Recovery Code
                  </label>
                  <Input 
                    type="text" 
                    placeholder="E3AF-89B2"
                    value={backupCode} 
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())} 
                    required 
                    className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-center font-mono font-bold tracking-wider text-sm"
                  />
                  <p className="text-[9px] text-muted-foreground italic mt-0.5">
                    Entering a backup code will consume it. It cannot be reused.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/60" /> Authenticator Code
                  </label>
                  <OtpInput
                    value={twoFactorCode}
                    onChange={setTwoFactorCode}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full mt-3 h-11 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50" 
                disabled={isLoading || (useBackupCode ? !backupCode.trim() : twoFactorCode.length !== 6)}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="flex flex-col gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setError('');
                    setTwoFactorCode('');
                    setBackupCode('');
                  }}
                  className="text-center text-[10px] text-primary hover:underline transition-all cursor-pointer font-bold uppercase tracking-wider animate-pulse"
                >
                  {useBackupCode ? "Use Authenticator App Code" : "Use a backup recovery code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShow2FA(false);
                    setUseBackupCode(false);
                    setTwoFactorCode('');
                    setBackupCode('');
                    setError('');
                  }}
                  className="text-center text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer font-bold uppercase tracking-wider"
                >
                  Back to credentials
                </button>
              </div>
            </form>
          ) : (
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(true);
                      setSuccessMessage('');
                      setError('');
                      setUsername('');
                      setPassword('');
                    }}
                    className="text-[9px] text-primary hover:underline cursor-pointer font-bold uppercase tracking-wider"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 w-full pr-10"
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
                {isLoading ? "Validating Token..." : "Access Console"}
              </Button>
            </form>
          )}
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
