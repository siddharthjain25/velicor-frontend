import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe, updateUserProfile, deleteAccount, setup2FA, enable2FA, disable2FA, generateBackupCodes, type User } from '../api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { User as UserIcon, Lock, UserCircle, AlertTriangle, Trash2, ShieldAlert, ShieldCheck, QrCode } from 'lucide-react';
import { OtpInput } from '../components/OtpInput';

export const Profile: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // 2FA Setup/Disable States
  const [is2FASettingUp, setIs2FASettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [isGeneratingBackupCodes, setIsGeneratingBackupCodes] = useState(false);

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

  const handleUpdatePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const updatedUser = await updateUserProfile(token, {
        first_name: firstName,
        last_name: lastName,
      });
      setUser(updatedUser);
      setMessage({ type: 'success', text: 'Personal information updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update personal information.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (!password.trim()) {
      setMessage({ type: 'error', text: 'Please enter a new password.' });
      return;
    }
    
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must utilize at least 8 characters.' });
      return;
    }
    
    setIsSavingPassword(true);
    setMessage({ type: '', text: '' });
    
    try {
      const updatedUser = await updateUserProfile(token, { password });
      setUser(updatedUser);
      setPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsSavingPassword(false);
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

  const handleStartSetup = async () => {
    if (!token) return;
    setMessage({ type: '', text: '' });
    try {
      const data = await setup2FA(token);
      setSetupSecret(data.secret);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data.provisioning_uri)}`;
      setQrCodeUrl(qrUrl);
      setIs2FASettingUp(true);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to initialize 2FA setup.' });
    }
  };

  const handleEnable2FA = async () => {
    if (!token) return;
    try {
      const result = await enable2FA(token, verificationCode);
      setUser(prev => prev ? { ...prev, two_factor_enabled: true, two_factor_backup_codes_count: 8 } : null);
      setIs2FASettingUp(false);
      setQrCodeUrl('');
      setSetupSecret('');
      setVerificationCode('');
      setBackupCodes(result.backup_codes || []);
      setMessage({ type: 'success', text: 'Two-Factor Authentication enabled successfully!' });
    } catch (err: any) {
      alert(err.message || 'Failed to enable 2FA. Please verify the code.');
    }
  };

  const handleDisable2FA = async () => {
    if (!token) return;
    try {
      await disable2FA(token, verificationCode);
      setUser(prev => prev ? { ...prev, two_factor_enabled: false } : null);
      setIsDisabling(false);
      setVerificationCode('');
      setMessage({ type: 'success', text: 'Two-Factor Authentication disabled successfully.' });
    } catch (err: any) {
      alert(err.message || 'Failed to disable 2FA. Please verify the code.');
    }
  };

  const handleGenerateBackupCodes = async () => {
    if (!token) return;
    try {
      const result = await generateBackupCodes(token, verificationCode);
      setBackupCodes(result.backup_codes || []);
      setIsGeneratingBackupCodes(false);
      setVerificationCode('');
      setUser(prev => prev ? { ...prev, two_factor_backup_codes_count: 8 } : null);
      setMessage({ type: 'success', text: 'New backup recovery codes generated successfully!' });
    } catch (err: any) {
      alert(err.message || 'Failed to generate backup codes. Please verify the code.');
    }
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const content = `VELICOR 2FA BACKUP RECOVERY CODES\n` +
                    `=================================\n` +
                    `Username: ${user?.username || ''}\n` +
                    `Generated at: ${new Date().toLocaleString()}\n\n` +
                    `These codes are single-use. Keep them in a safe place.\n\n` +
                    backupCodes.map((code, idx) => `Code ${idx + 1}: ${code}`).join('\n') +
                    `\n`;
                    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `velicor-backup-codes-${user?.username || 'user'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal Details */}
          <Card className="border-border/60 bg-[#0d1117]/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/40 bg-[#161b22]/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <UserIcon className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription className="text-[11px]">Update your public console identity settings</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePersonalInfo} className="flex-grow flex flex-col justify-between">
              <CardContent className="pt-6 space-y-4">
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
              <div className="p-6 pt-2 border-t border-border/40 bg-[#161b22]/10 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="rounded-xl h-9 px-4 font-bold text-xs cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 2: Security settings */}
          <Card className="border-border/60 bg-[#0d1117]/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/40 bg-[#161b22]/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Lock className="w-4 h-4 text-primary" /> Key Security
              </CardTitle>
              <CardDescription className="text-[11px]">Modify credentials used to enter this account</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePassword} className="flex-grow flex flex-col justify-between">
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">New Password</label>
                  <Input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl h-11 text-xs"
                  />
                  <p className="text-[9px] text-muted-foreground/60 italic">Ensure password utilizes at least 8 characters</p>
                </div>
              </CardContent>
              <div className="p-6 pt-2 border-t border-border/40 bg-[#161b22]/10 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSavingPassword}
                  className="rounded-xl h-9 px-4 font-bold text-xs cursor-pointer"
                >
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Card 3: Two-Factor Authentication (2FA) */}
        <Card className="border-border/60 bg-[#0d1117]/50 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-border/40 bg-[#161b22]/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription className="text-[11px]">Enhance account security using standard TOTP authenticator apps</CardDescription>
              </div>
              <div>
                {user?.two_factor_enabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    INACTIVE
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {backupCodes.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 space-y-4 animate-in slide-in-from-top-2 duration-300 mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Two-Factor Backup Codes
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Please save these backup recovery codes. If you lose access to your authenticator device, you can use these single-use codes to log in and restore access to your account. 
                  <strong> Store them securely (e.g. in your password manager). They will not be shown again.</strong>
                </p>
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950/30 rounded-xl font-mono text-xs font-bold text-center text-white border border-border/40">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="p-2 bg-zinc-900/50 border border-border/40 rounded-lg hover:border-emerald-500/20 transition-all select-all">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'));
                      alert("Backup codes copied to clipboard!");
                    }}
                    className="rounded-xl text-[10px] font-bold h-9 px-3"
                  >
                    Copy Codes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDownloadBackupCodes}
                    className="rounded-xl text-[10px] font-bold h-9 px-3 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-border/60"
                  >
                    Download Codes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBackupCodes([])}
                    className="rounded-xl text-[10px] text-muted-foreground h-9 px-3 cursor-pointer"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
            {user?.two_factor_enabled ? (
              <div className="space-y-4">
                {user?.two_factor_backup_codes_count !== undefined && user.two_factor_backup_codes_count <= 2 && (
                  <div className="p-4 rounded-xl bg-orange-500/[0.03] border border-orange-500/20 flex gap-3 items-start animate-in fade-in duration-300">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">
                        ⚠️ Low Recovery Codes Remaining
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        You have only <strong>{user.two_factor_backup_codes_count}</strong> backup recovery codes left. 
                        Please generate a new set of codes to ensure you can recover your account if you lose access to your authenticator app.
                      </p>
                    </div>
                  </div>
                )}
                {!isDisabling && !isGeneratingBackupCodes ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Your account is protected by Google Authenticator. To log in, you will be required to enter a 6-digit code.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 italic">
                        Lost your codes? You can generate a new set of backup recovery codes here.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 text-primary hover:text-primary-foreground rounded-xl h-10 px-4 font-bold text-xs cursor-pointer"
                        onClick={() => {
                          setIsGeneratingBackupCodes(true);
                          setVerificationCode('');
                        }}
                      >
                        Generate Backup Codes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl h-10 px-4 font-bold text-xs cursor-pointer"
                        onClick={() => {
                          setIsDisabling(true);
                          setVerificationCode('');
                        }}
                      >
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                ) : isGeneratingBackupCodes ? (
                  <div className="p-4 rounded-xl bg-primary/[0.02] border border-primary/10 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="font-bold text-xs text-white">Generate Backup Recovery Codes</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Enter the 6-digit verification code from your authenticator app to generate 8 new backup recovery codes. 
                      <strong> This will invalidate any previous backup recovery codes.</strong>
                    </p>
                    <div className="flex flex-col gap-3 items-start">
                      <OtpInput
                        value={verificationCode}
                        onChange={setVerificationCode}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleGenerateBackupCodes}
                          className="rounded-xl h-10 px-4 font-bold text-xs cursor-pointer disabled:opacity-50"
                          disabled={verificationCode.length !== 6}
                        >
                          Generate Codes
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsGeneratingBackupCodes(false);
                            setVerificationCode('');
                          }}
                          className="rounded-xl h-10 px-4 text-muted-foreground cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-500/[0.02] border border-red-500/10 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="font-bold text-xs text-white">Disable Two-Factor Authentication</h4>
                    <p className="text-[10px] text-muted-foreground">
                      Enter the 6-digit verification code from your authenticator app to disable 2FA protection.
                    </p>
                    <div className="flex flex-col gap-3 items-start">
                      <OtpInput
                        value={verificationCode}
                        onChange={setVerificationCode}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDisable2FA}
                          className="rounded-xl h-10 px-4 font-bold text-xs disabled:opacity-50"
                          disabled={verificationCode.length !== 6}
                        >
                          Confirm Disable
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsDisabling(false);
                            setVerificationCode('');
                          }}
                          className="rounded-xl h-10 px-4 text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!is2FASettingUp ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                      Add an extra layer of security to your account. Scan a QR code using an authenticator app to get started.
                    </p>
                    <Button
                      type="button"
                      onClick={handleStartSetup}
                      className="rounded-xl gap-2 font-bold text-xs h-10 px-4 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" /> Setup Authenticator
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 p-4 rounded-xl bg-zinc-950/30 border border-muted/50 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-center bg-white p-2 rounded-xl h-[176px] w-[176px] shrink-0 border border-zinc-200">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-[160px] h-[160px]" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-xs text-white">Configure Authenticator App</h4>
                        <ol className="list-decimal pl-4 text-[10px] text-muted-foreground space-y-1">
                          <li>Scan the QR code with Google Authenticator or Authy.</li>
                          <li>If you can't scan it, enter this secret key manually: <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-primary font-bold font-mono">{setupSecret}</code></li>
                          <li>Input the 6-digit code generated by the app below to activate 2FA.</li>
                        </ol>
                      </div>
                      <div className="flex flex-col gap-3 items-start">
                        <OtpInput
                          value={verificationCode}
                          onChange={setVerificationCode}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleEnable2FA}
                            className="rounded-xl h-10 px-4 font-bold text-xs cursor-pointer disabled:opacity-50"
                            disabled={verificationCode.length !== 6}
                          >
                            Activate 2FA
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIs2FASettingUp(false);
                              setQrCodeUrl('');
                              setSetupSecret('');
                              setVerificationCode('');
                            }}
                            className="rounded-xl h-10 px-4 text-muted-foreground border border-muted cursor-pointer"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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

      </div>
    </div>
  );
};
