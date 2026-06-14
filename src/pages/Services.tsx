import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, createService, deleteService, resetServiceKey, updateService, getMe, type Service, type User } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Server, ChevronRight, Trash2, Clock, Check, Edit2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { ApiKeyDisplay } from '../components/ApiKeyDisplay';
import { OtpInput } from '../components/OtpInput';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '../components/ui/dialog';
import { useCustomDialog } from '../context/DialogContext';

export const ServicesPage: React.FC = () => {
  const customDialog = useCustomDialog();
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingRetention, setEditingRetention] = useState<string | null>(null);
  const [tempRetention, setTempRetention] = useState<number>(30);
  const [retentionUnit, setRetentionUnit] = useState<'days' | 'minutes'>('days');
  const [user, setUser] = useState<User | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FAField, setShow2FAField] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    if (token) {
      getMe(token)
        .then(setUser)
        .catch(err => console.error("Failed to fetch user profile", err));
    }
  }, [token]);

  const fetchServices = async () => {
    if (!token) return;
    try {
      const data = await getServices(token);
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newServiceName) return;
    try {
      await createService(token, newServiceName);
      setNewServiceName('');
      fetchServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateRetention = async (serviceId: string) => {
    if (!token) return;
    try {
      if (retentionUnit === 'minutes') {
        const minutes = Math.max(1, Math.min(525600, tempRetention || 60));
        await updateService(token, serviceId, { retention_minutes: minutes });
      } else {
        const days = Math.max(1, Math.min(365, tempRetention || 30));
        await updateService(token, serviceId, { retention_days: days });
      }
      setEditingRetention(null);
      fetchServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteServiceClick = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    setDeletingService(service);
    setConfirmName('');
    setTwoFactorCode('');
    setDeleteError('');
    setShow2FAField(!!user?.two_factor_enabled);
  };

  const executeDeleteService = async () => {
    if (!token || !deletingService) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteService(token, deletingService._id, show2FAField ? twoFactorCode : undefined);
      setDeletingService(null);
      setConfirmName('');
      setTwoFactorCode('');
      fetchServices();
    } catch (err: any) {
      if (err.message && (err.message.includes("Two-factor") || err.message.includes("403"))) {
        setShow2FAField(true);
        setDeleteError("Two-Factor Authentication (2FA) is required to delete this service. Please provide your 6-digit OTP code below.");
      } else {
        setDeleteError(err.message || 'Failed to delete service');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetServiceKey = async (serviceId: string, serviceName: string) => {
    if (!token) return;
    
    const confirmed = await customDialog.confirm({
      title: "Reset API Key",
      description: `Are you sure you want to reset the API Key for "${serviceName}"? Existing services using the old key will stop being able to ingest logs.`,
      confirmLabel: "Reset Key",
      cancelLabel: "Cancel",
    });
    
    if (confirmed) {
      try {
        await resetServiceKey(token, serviceId);
        fetchServices();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-6 md:space-y-8 max-w-6xl mx-auto w-full px-4 py-4 md:py-8 animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Service Directory</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> Manage and telemetry-provision your cloud infrastructure fleet
          </p>
        </div>
      </header>

      <div className="space-y-8 md:space-y-10">
        {/* Create Service Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Create New Telemetry Service</h2>
          <Card className="shadow-lg border-border/60 bg-[#0d1117]/30 overflow-hidden rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleCreateService} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                  <Input 
                    type="text" 
                    placeholder="Service identifier (e.g. payment-gateway)" 
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    required
                    className="h-11 md:h-12 text-xs md:text-sm bg-zinc-950/50 border-border/40 focus:border-primary/50 transition-all rounded-xl"
                  />
                </div>
                <Button type="submit" className="h-11 md:h-12 px-6 md:px-8 font-bold text-xs md:text-sm w-full sm:w-auto rounded-full cursor-pointer">
                  Deploy Node <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
              {error && <p className="mt-3 text-xs text-red-400 font-semibold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
            </CardContent>
          </Card>
        </section>

        {/* Services Inventory */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Active Services</h2>
            <Badge variant="secondary" className="font-mono text-[10px]">{services.length} Total</Badge>
          </div>

          {loading ? (
            <div className="py-16 md:py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground italic">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="uppercase tracking-widest text-[10px] font-bold">Loading services...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {services.map(s => (
                <Card 
                  key={s._id} 
                  className="group bg-[#0d1117]/35 border-border/60 hover:border-primary/40 transition-all cursor-pointer shadow-sm hover:shadow-xl relative overflow-hidden rounded-2xl"
                  onClick={() => navigate(`/services/${s.name}?key=${s.secret_key}`)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4 md:mb-6">
                      <div className="overflow-hidden mr-2">
                        <span className="font-bold text-lg md:text-xl tracking-tight group-hover:text-primary transition-colors truncate block">{s.name}</span>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active</span>
                          </div>
                          
                          {editingRetention === s._id ? (
                            <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-0.5 border border-border/50 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <input 
                                type="text" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-8 bg-transparent text-[10px] font-bold outline-none text-white font-mono"
                                value={tempRetention || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setTempRetention(val ? parseInt(val) : 0);
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="text-[8px] md:text-[9px] px-1 py-0.25 rounded bg-[#1c2128] border border-border/60 hover:border-primary/40 text-primary font-bold uppercase cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRetentionUnit(prev => prev === 'days' ? 'minutes' : 'days');
                                }}
                              >
                                {retentionUnit === 'days' ? 'D' : 'M'}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateRetention(s._id);
                                }}
                                className="p-0.5 hover:text-green-500 transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-1 px-2 py-0.5 bg-primary/5 rounded-full hover:bg-primary/10 border border-primary/10 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRetention(s._id);
                                if (s.retention_minutes && s.retention_minutes % 1440 !== 0) {
                                  setTempRetention(s.retention_minutes);
                                  setRetentionUnit('minutes');
                                } else {
                                  setTempRetention(s.retention_days);
                                  setRetentionUnit('days');
                                }
                              }}
                            >
                              <Clock className="w-3 h-3 text-primary/60" />
                              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight text-primary/80">
                                {s.retention_minutes && s.retention_minutes % 1440 !== 0 
                                  ? `${s.retention_minutes}M Retention` 
                                  : `${s.retention_days}D Retention`}
                              </span>
                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 md:h-9 md:w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteServiceClick(e, s)}
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </Button>
                        <div className="hidden xs:flex h-8 w-8 rounded-full border border-border/50 items-center justify-center group-hover:bg-primary/5 transition-all">
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-6 md:pt-8 border-t border-muted/50">
                      <ApiKeyDisplay 
                        apiKey={s.secret_key} 
                        label="Ingestion Secret" 
                        onReset={() => handleResetServiceKey(s._id, s.name)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {services.length === 0 && (
                <div className="col-span-full py-12 md:py-16 text-center border-2 border-dashed rounded-2xl border-muted bg-muted/5 flex flex-col items-center justify-center gap-3 px-4">
                  <Server className="w-8 h-8 text-muted-foreground opacity-40" />
                  <p className="text-xs md:text-sm text-muted-foreground font-medium italic">Your infrastructure fleet is currently empty.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <Dialog 
        open={!!deletingService} 
        onOpenChange={(open) => {
          if (!open) {
            setDeletingService(null);
            setConfirmName('');
            setTwoFactorCode('');
            setDeleteError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-[#0d1117]/95 border border-border/80 p-0 overflow-hidden" showCloseButton={false}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-border/40 bg-[#161b22]/30 flex items-center gap-3">
            <div className="p-2 bg-destructive/15 rounded-xl border border-destructive/20 text-destructive">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <DialogTitle className="font-bold text-sm tracking-tight text-white">Delete Telemetry Service</DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">This action is irreversible and permanent.</DialogDescription>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-1 text-[11px] text-red-400/90 leading-relaxed">
              <p className="font-bold text-red-500 flex items-center gap-1.5 uppercase tracking-wide">
                ⚠️ Warning
              </p>
              <p>
                Deleting <strong>{deletingService?.name}</strong> will permanently remove all associated log data, purge all ingested archives, and invalidate the service credentials.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                Confirm Service Name
              </label>
              <p className="text-[10px] text-muted-foreground italic">
                To proceed, please type <span className="font-mono text-white bg-zinc-800 px-1 rounded">{deletingService?.name}</span>:
              </p>
              <Input
                type="text"
                placeholder={deletingService?.name}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="bg-zinc-950/50 border-border/40 focus:border-red-500/50 rounded-xl h-11 text-xs"
              />
            </div>

            {show2FAField && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
                  Two-Factor OTP Code
                </label>
                <p className="text-[10px] text-muted-foreground italic mb-2">
                  Enter the 6-digit verification code from Google Authenticator:
                </p>
                <OtpInput
                  value={twoFactorCode}
                  onChange={setTwoFactorCode}
                  disabled={isDeleting}
                />
              </div>
            )}

            {deleteError && (
              <p className="text-xs text-red-400 font-semibold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {deleteError}
              </p>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 bg-[#161b22]/20 border-t border-border/40 flex justify-end gap-3 -mx-0 -mb-0 rounded-none">
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingService(null);
                setConfirmName('');
                setTwoFactorCode('');
                setDeleteError('');
              }}
              disabled={isDeleting}
              className="rounded-full h-10 px-4 text-xs font-bold text-muted-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeDeleteService}
              disabled={isDeleting || confirmName !== deletingService?.name || (show2FAField && twoFactorCode.length !== 6)}
              className="rounded-full h-10 px-4 text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
