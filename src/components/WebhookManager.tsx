import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Bell, Trash2, Plus, Globe, AlertTriangle, Settings2, Edit2, X, Check } from 'lucide-react';
import { Badge } from './ui/Badge';
import { addWebhook, deleteWebhook, updateWebhook, getWebhooks } from '../api';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

export const WebhookManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["ERROR", "FATAL"]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editLevels, setEditLevels] = useState<string[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchWebhooks();
  }, [token]);

  const fetchWebhooks = async () => {
    if (!token) return;
    try {
      const data = await getWebhooks(token);
      setWebhooks(data || []);
    } catch (err) {
      console.error('Failed to fetch webhooks', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (level: string, isEdit: boolean = false) => {
    const setter = isEdit ? setEditLevels : setSelectedLevels;
    setter(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level) 
        : [...prev, level]
    );
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newUrl || selectedLevels.length === 0) {
      if (selectedLevels.length === 0) alert("Please select at least one log level.");
      return;
    }
    try {
      const nw = await addWebhook(token, { 
        url: newUrl, 
        levels: selectedLevels 
      });
      setWebhooks([...webhooks, nw]);
      setNewUrl('');
      setSelectedLevels(["ERROR", "FATAL"]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateWebhook = async (webhookId: string) => {
    if (!token || !editUrl || editLevels.length === 0) return;
    try {
      await updateWebhook(token, webhookId, { 
        url: editUrl, 
        levels: editLevels 
      });
      setWebhooks(webhooks.map(w => w.id === webhookId ? { ...w, url: editUrl, levels: editLevels } : w));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!token) return;
    try {
      await deleteWebhook(token, webhookId);
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEditing = (webhook: any) => {
    setEditingId(webhook.id);
    setEditUrl(webhook.url);
    setEditLevels(webhook.levels);
  };

  if (loading) return <div className="p-4 text-center text-xs animate-pulse">Loading webhooks...</div>;

  return (
    <Card className="border-muted shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Bell className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <CardTitle>Global Alerting Webhooks</CardTitle>
            <CardDescription>Get notified on Slack/Discord when specific log events occur across any service.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ADD NEW WEBHOOK FORM */}
        {!editingId && (
          <form onSubmit={handleAddWebhook} className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-muted/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" /> Target URL
              </label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://hooks.slack.com/services/..." 
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="text-xs h-9 bg-background"
                />
                <Button type="submit" size="sm" className="shrink-0 h-9 font-bold cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" /> Add Destination
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <Settings2 className="w-3 h-3" /> Trigger Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                      selectedLevels.includes(level)
                        ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                        : 'bg-background border-muted text-muted-foreground hover:border-orange-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Active Destinations</h3>
          {webhooks.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-xl border-muted bg-muted/5">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto opacity-20 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">No Webhooks Configured</p>
            </div>
          )}
          {webhooks.map((webhook) => (
            <div key={webhook.id}>
              {editingId === webhook.id ? (
                <div className="space-y-4 p-4 rounded-2xl bg-orange-500/[0.03] border-2 border-orange-500/20 animate-in zoom-in-95 duration-200">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-orange-400 tracking-widest">Update URL</label>
                      <Input 
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="text-xs h-9 bg-background border-orange-500/30 focus-visible:ring-orange-500"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-orange-400 tracking-widest">Update Levels</label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_LEVELS.map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => toggleLevel(level, true)}
                            className={`px-3 py-0.5 rounded-full text-[9px] font-bold transition-all border cursor-pointer ${
                              editLevels.includes(level)
                                ? 'bg-orange-500 border-orange-600 text-white'
                                : 'bg-background border-muted text-muted-foreground'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="flex gap-2 justify-end pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-8 text-xs cursor-pointer">
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleUpdateWebhook(webhook.id)} className="h-8 text-xs bg-green-600 hover:bg-green-700 font-bold cursor-pointer">
                        <Check className="w-3.5 h-3.5 mr-1" /> Save Changes
                      </Button>
                   </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-card group hover:border-orange-500/30 transition-colors gap-3 overflow-hidden">
                  <div className="flex flex-col gap-1 overflow-hidden min-w-0 flex-grow">
                    <span className="text-[10px] font-mono text-muted-foreground truncate block w-full max-w-[150px] xs:max-w-[220px] sm:max-w-md md:max-w-xl">
                      {webhook.url}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {webhook.levels.map((l: string) => (
                        <Badge key={l} variant="warning" className="text-[8px] py-0 px-2 border-none shadow-none uppercase font-black">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full cursor-pointer"
                      onClick={() => startEditing(webhook)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full cursor-pointer"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-blue-500/[0.02] border border-blue-500/20 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
             <p className="text-[11px] font-bold text-blue-400">Configuration Info</p>
             <p className="text-[10px] text-blue-400/80 leading-relaxed">
               Alerts are dispatched in real-time. Selecting <strong>INFO</strong> or <strong>DEBUG</strong> may result in a high volume of notifications depending on your traffic.
             </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
