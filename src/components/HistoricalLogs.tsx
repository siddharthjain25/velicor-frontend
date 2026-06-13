import React, { useState } from 'react';
import { searchLogs, type LogEntry } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Search, Calendar, Filter, Clock, Hash, Database, ChevronDown, ChevronUp, AlertCircle, Info, Bug, AlertTriangle, Skull, Download } from 'lucide-react';
import { Badge } from './ui/badge';
import { useCustomDialog } from '../context/DialogContext';

interface HistoricalLogsProps {
  apiKey: string;
  serviceName: string;
}

export const HistoricalLogs: React.FC<HistoricalLogsProps> = ({ apiKey, serviceName }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const customDialog = useCustomDialog();
  
  // Filters
  const [level, setLevel] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [keyword, setKeyword] = useState('');
  const [startTs, setStartTs] = useState('');
  const [endTs, setEndTs] = useState('');

  const applyPreset = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    
    // Format to YYYY-MM-DDTHH:mm
    const format = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setEndTs(format(end));
    setStartTs(format(start));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const results = await searchLogs(apiKey, {
        level,
        status_code: statusCode ? parseInt(statusCode) : undefined,
        keyword,
        start_ts: startTs ? new Date(startTs).toISOString() : undefined,
        end_ts: endTs ? new Date(endTs).toISOString() : undefined,
      });
      setLogs(results);
    } catch (err) {
      console.error(err);
      await customDialog.alert({
        title: "Search Failed",
        description: 'Failed to retrieve logs based on search query.',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setLevel('');
    setStatusCode('');
    setKeyword('');
    setStartTs('');
    setEndTs('');
  };

  const getBadgeVariant = (level: string) => {
    switch (level.toUpperCase()) {
      case 'INFO': return 'info';
      case 'WARN': return 'warning';
      case 'ERROR': return 'destructive';
      case 'FATAL': return 'destructive';
      case 'DEBUG': return 'secondary';
      default: return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'INFO': return <Info className="w-3 h-3" />;
      case 'WARN': return <AlertTriangle className="w-3 h-3" />;
      case 'ERROR': return <AlertCircle className="w-3 h-3" />;
      case 'FATAL': return <Skull className="w-3 h-3" />;
      case 'DEBUG': return <Bug className="w-3 h-3" />;
      default: return null;
    }
  };

  const exportJSON = async () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `velicor_logs_${serviceName}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export JSON logs", err);
      await customDialog.alert({
        title: "Export Error",
        description: "Failed to export JSON logs",
      });
    }
  };

  const exportCSV = async () => {
    try {
      const headers = ["Timestamp", "Level", "Status Code", "Message", "Metadata"];
      
      const rows = logs.map(log => {
        const timestamp = log.timestamp || '';
        const level = log.level || '';
        const statusCode = log.status_code !== undefined ? log.status_code : '';
        const message = (log.message || '').replace(/"/g, '""');
        const metadata = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : '';
        
        return [
          `"${timestamp}"`,
          `"${level}"`,
          `"${statusCode}"`,
          `"${message}"`,
          `"${metadata}"`
        ].join(',');
      });
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `velicor_logs_${serviceName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export CSV logs", err);
      await customDialog.alert({
        title: "Export Error",
        description: "Failed to export CSV logs",
      });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-muted shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-border/50 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" /> Archive Search
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Targeting: <code className="text-primary font-bold">logs_{serviceName}</code></CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto">
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-4 md:px-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
              {[0.25, 1, 6, 24, 168].map(h => (
                <Button 
                  key={h} 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => applyPreset(h)}
                  className="rounded-full text-[9px] md:text-[10px] h-7 px-3 font-bold border-muted/50 whitespace-nowrap bg-background"
                >
                  Last {h === 0.25 ? '15m' : h < 24 ? `${h}h` : h === 24 ? '24h' : '7d'}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                  <Filter className="w-3 h-3" /> Severity
                </label>
                <div className="relative group">
                  <select 
                    value={level} 
                    onChange={(e) => setLevel(e.target.value)}
                    className="flex h-10 md:h-11 w-full rounded-full border-2 border-input bg-background/50 px-4 py-2 text-xs md:text-sm ring-offset-background focus-visible:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-background transition-all"
                  >
                    <option value="">All Severities</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="FATAL">FATAL</option>
                    <option value="DEBUG">DEBUG</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 md:top-3.5 w-4 h-4 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-0.5" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                  <Hash className="w-3 h-3" /> Status Code
                </label>
                <Input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 200, 404, 500" 
                  value={statusCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setStatusCode(val);
                  }}
                  className="h-10 md:h-11 rounded-full bg-background/50 border-input shadow-none text-xs md:text-sm"
                />
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                  <Search className="w-3 h-3" /> Keyword
                </label>
                <Input 
                  type="text" 
                  placeholder="Search contents..." 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-10 md:h-11 rounded-full bg-background/50 border-input shadow-none text-xs md:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 p-4 md:p-6 rounded-2xl md:rounded-3xl bg-primary/[0.02] border-2 border-primary/5">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-primary" /> Start Boundary
                </label>
                <Input 
                  type="datetime-local" 
                  value={startTs} 
                  onChange={(e) => setStartTs(e.target.value)} 
                  className="h-11 md:h-12 rounded-full border-2 border-input bg-background focus:border-primary focus:ring-0 transition-all dark:[color-scheme:dark] px-4 font-medium text-xs md:text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                  <Clock className="w-3 h-3 text-primary" /> End Boundary
                </label>
                <Input 
                  type="datetime-local" 
                  value={endTs} 
                  onChange={(e) => setEndTs(e.target.value)} 
                  className="h-11 md:h-12 rounded-full border-2 border-input bg-background focus:border-primary focus:ring-0 transition-all dark:[color-scheme:dark] px-4 font-medium text-xs md:text-sm"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 md:h-12 rounded-full font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] text-xs md:text-sm" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Executing Query...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 stroke-[3px]" /> Run Telemetry Scan
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-muted shadow-lg overflow-hidden min-h-[400px] md:min-h-[500px] rounded-2xl md:rounded-3xl">
        {logs.length > 0 && (
          <CardHeader className="border-b border-border/30 pb-4 px-4 md:px-6 flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-white">Telemetry Results</CardTitle>
              <CardDescription className="text-[10px]">Found {logs.length} entries matching scan criteria</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={exportJSON}
                variant="outline" 
                size="sm" 
                className="h-8 text-[10px] font-bold rounded-full gap-1.5 border-muted hover:bg-primary/5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-primary" /> Export JSON
              </Button>
              <Button 
                onClick={exportCSV}
                variant="outline" 
                size="sm" 
                className="h-8 text-[10px] font-bold rounded-full gap-1.5 border-muted hover:bg-primary/5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-primary" /> Export CSV
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="divide-y divide-border/30">
              {logs.map((log, i) => {
                let levelBorderClass = "border-l-3 border-l-zinc-700/30";
                if (log.level) {
                  const lvl = log.level.toUpperCase();
                  if (lvl.includes("ERR") || lvl.includes("FAIL") || lvl.includes("CRIT") || lvl.includes("FATAL")) {
                    levelBorderClass = "border-l-3 border-l-red-500 bg-red-950/[0.07] hover:bg-red-950/[0.12]";
                  } else if (lvl.includes("WARN")) {
                    levelBorderClass = "border-l-3 border-l-amber-500 bg-amber-950/[0.07] hover:bg-amber-950/[0.12]";
                  } else if (lvl.includes("INFO")) {
                    levelBorderClass = "border-l-3 border-l-blue-500 bg-blue-950/[0.04] hover:bg-blue-950/[0.08]";
                  } else if (lvl.includes("DEB")) {
                    levelBorderClass = "border-l-3 border-l-zinc-500/50 bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08]";
                  }
                }
                
                return (
                  <div 
                    key={i} 
                    className={`group transition-all ${levelBorderClass} ${expandedLog === i ? 'bg-zinc-900/[0.3]' : ''}`}
                  >
                  <div 
                    className="p-3 md:p-4 cursor-pointer flex items-start gap-2 md:gap-4"
                    onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                  >
                    <div className="mt-1 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {expandedLog === i ? <ChevronUp className="w-3 h-3 md:w-4 md:h-4" /> : <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />}
                    </div>
                    <div className="flex-grow space-y-2 overflow-hidden">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <span className="font-mono text-[9px] md:text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                          {new Date(log.timestamp!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <Badge variant={getBadgeVariant(log.level)} className="text-[8px] md:text-[10px] uppercase font-black tracking-tighter px-1.5 md:px-2 py-0.5 border-none shadow-none">
                          <span className="flex items-center gap-1">
                            {getLevelIcon(log.level)}
                            {log.level}
                          </span>
                        </Badge>
                        {log.status_code && (
                          <span className={`font-black px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] ${log.status_code >= 500 ? 'bg-red-500/20 text-red-400' : log.status_code >= 400 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                            {log.status_code}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-100 leading-relaxed text-xs md:text-sm font-medium break-all">{log.message}</div>
                    </div>
                  </div>
                  
                  {expandedLog === i && (
                    <div className="px-6 md:px-12 pb-4 md:pb-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="mt-2 md:mt-3 text-[9px] md:text-[11px] text-blue-400/70 bg-blue-500/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-blue-500/10 overflow-x-auto max-h-[250px] md:max-h-[300px] font-mono">
                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          ) : (
            <div className="py-20 md:py-32 flex flex-col items-center justify-center gap-4 text-muted-foreground italic px-4">
              <Search className="w-10 h-10 md:w-12 md:h-12 opacity-10" />
              <div className="text-center">
                <p className="font-bold text-xs md:text-sm uppercase tracking-widest opacity-30">No Data Captured</p>
                <p className="text-[10px] md:text-xs opacity-20">Adjust filters and execute a new scan</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
