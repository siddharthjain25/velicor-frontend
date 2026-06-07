import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, createService, deleteService, resetServiceKey, updateService, type Service } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Server, ChevronRight, Trash2, Clock, Check, Edit2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { ApiKeyDisplay } from '../components/ApiKeyDisplay';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingRetention, setEditingRetention] = useState<string | null>(null);
  const [tempRetention, setTempRetention] = useState<number>(30);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
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
      await updateService(token, serviceId, { retention_days: tempRetention });
      setEditingRetention(null);
      fetchServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteService = async (e: React.MouseEvent, serviceId: string, serviceName: string) => {
    e.stopPropagation();
    if (!token) return;
    
    const confirmed = window.confirm(`Are you sure you want to PERMANENTLY delete the service "${serviceName}"? This will delete all its logs and its Postgres table.`);
    
    if (confirmed) {
      try {
        await deleteService(token, serviceId);
        fetchServices();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleResetServiceKey = async (serviceId: string, serviceName: string) => {
    if (!token) return;
    
    const confirmed = window.confirm(`Are you sure you want to reset the API Key for "${serviceName}"? Existing services using the old key will stop being able to ingest logs.`);
    
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
                <Button type="submit" className="h-11 md:h-12 px-6 md:px-8 font-bold text-xs md:text-sm w-full sm:w-auto rounded-xl cursor-pointer">
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
                        <div className="flex items-center gap-1.5 mt-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        {editingRetention === s._id ? (
                          <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <input 
                              type="number" 
                              className="w-10 bg-transparent text-[10px] font-bold outline-none"
                              value={tempRetention}
                              onChange={(e) => setTempRetention(parseInt(e.target.value))}
                              min="1"
                              max="365"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleUpdateRetention(s._id)}
                              className="p-0.5 hover:text-green-500 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-1 px-2.5 py-1 bg-primary/5 rounded-full hover:bg-primary/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRetention(s._id);
                              setTempRetention(s.retention_days);
                            }}
                          >
                            <Clock className="w-3 h-3 text-primary/60" />
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight text-primary/80">{s.retention_days}D</span>
                            <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 md:h-9 md:w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteService(e, s._id, s.name)}
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
    </div>
  );
};
