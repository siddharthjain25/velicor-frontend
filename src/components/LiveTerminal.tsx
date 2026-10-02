import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Terminal, Trash2, Activity, Wifi, WifiOff, Zap, Play, Pause, Search, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { searchLogs } from '../api';

interface LiveTerminalProps {
  filterService?: string;
  apiKey?: string;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ filterService, apiKey }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [accumulatedLogs, setAccumulatedLogs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [logsPerSec, setLogsPerSec] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const logCountRef = useRef(0);
  const lastTsRef = useRef<string | null>(null);
  const isPausedRef = useRef(false);

  // Sync ref to avoid stale closures in WS/polling callbacks
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogsPerSec(logCountRef.current);
      logCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isIntentionalClose = false;
    let reconnectTimeout: number | null = null;
    let pollingInterval: number | null = null;

    const startPolling = () => {
      if (pollingInterval) return;
      setIsPolling(true);
      console.log('Switching to polling mode (Vercel/Serverless Fallback)');
      
      const poll = async () => {
        if (!apiKey) return;
        try {
          const results = await searchLogs(apiKey, {
            limit: 50,
            start_ts: lastTsRef.current || new Date(Date.now() - 5000).toISOString()
          });

          if (results && results.length > 0) {
            const newLogs = results.filter((log: any) => 
              !lastTsRef.current || new Date(log.timestamp) > new Date(lastTsRef.current)
            );

            if (newLogs.length > 0) {
              const newLogsWithId = newLogs.map((log: any) => ({
                ...log,
                _client_id: log._client_id || Math.random().toString(36).substring(2, 9)
              }));
              logCountRef.current += newLogsWithId.length;
              setAccumulatedLogs(prev => [...newLogsWithId, ...prev.slice(0, 100 - newLogsWithId.length)]);
              if (!isPausedRef.current) {
                setLogs(prev => [...newLogsWithId, ...prev.slice(0, 100 - newLogsWithId.length)]);
              }
              lastTsRef.current = newLogsWithId[0].timestamp;
            }
          }
        } catch (err) {
          console.error('Polling failed', err);
        }
      };

      poll();
      pollingInterval = window.setInterval(poll, 2500);
    };

    const connect = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (isPolling) return;

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
      const protocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
      const wsUrl = apiKey ? `${protocol}//${host}/api/v1/live?api_key=${apiKey}` : `${protocol}//${host}/api/v1/live`;
      
      try {
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          if (isIntentionalClose) {
            socket.close();
            return;
          }
          setIsConnected(true);
          setIsPolling(false);
          console.log('Connected to live stream');
        };
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (filterService && data.service_name !== filterService) return;
          logCountRef.current += 1;
          
          const logWithId = {
            ...data,
            _client_id: data._client_id || Math.random().toString(36).substring(2, 9)
          };
          setAccumulatedLogs(prev => [logWithId, ...prev.slice(0, 99)]);
          if (!isPausedRef.current) {
            setLogs(prev => [logWithId, ...prev.slice(0, 99)]);
          }
          lastTsRef.current = data.timestamp;
        };
        
        socket.onclose = (event) => {
          setIsConnected(false);
          if (!isIntentionalClose) {
            if (event.code === 1006 || window.location.hostname.includes('vercel.app')) {
              startPolling();
            } else {
              console.log('Disconnected from live stream, reconnecting...');
              reconnectTimeout = window.setTimeout(connect, 3000);
            }
          }
        };

        socket.onerror = () => {
          if (!isIntentionalClose) startPolling();
        };
        
        socketRef.current = socket;
      } catch (e) {
        startPolling();
      }
    };

    connect();

    return () => {
      isIntentionalClose = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollingInterval) clearInterval(pollingInterval);
      socketRef.current?.close();
    };
  }, [filterService, apiKey]);

  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);

  const clearLogs = () => {
    setLogs([]);
    setAccumulatedLogs([]);
  };

  const handleTogglePause = () => {
    if (isPaused) {
      // Unpausing: sync visible logs with the accumulated buffer
      setAccumulatedLogs(current => {
        setLogs(current);
        return current;
      });
    }
    setIsPaused(!isPaused);
  };

  // Perform client-side filter matching (supports Regex and Substring)
  const filteredLogs = logs.filter(log => {
    if (!filterText) return true;
    try {
      const regex = new RegExp(filterText, 'i');
      return (
        regex.test(log.message) || 
        regex.test(log.level) || 
        (log.service_name && regex.test(log.service_name))
      );
    } catch (e) {
      const lowerQuery = filterText.toLowerCase();
      return (
        log.message.toLowerCase().includes(lowerQuery) ||
        log.level.toLowerCase().includes(lowerQuery) ||
        (log.service_name && log.service_name.toLowerCase().includes(lowerQuery))
      );
    }
  });

  const bufferedCount = Math.max(0, accumulatedLogs.length - logs.length);

  return (
    <Card className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-250px)] min-h-[500px] md:min-h-[600px] shadow-sm border-muted overflow-hidden">
      <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4">
        
        {/* Title & Connection Status */}
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" /> 
              Live Telemetry
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/5 gap-1.5 px-2">
                  <Wifi className="w-3 h-3" /> <span className="hidden xs:inline">STREAMING</span>
                </Badge>
              ) : isPolling ? (
                <Badge variant="outline" className="border-blue-500/50 text-blue-500 bg-blue-500/5 gap-1.5 px-2">
                  <Zap className="w-3 h-3" /> <span className="hidden xs:inline">FAST POLLING</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/5 gap-1.5 px-2">
                  <WifiOff className="w-3 h-3" /> <span className="hidden xs:inline">OFFLINE</span>
                </Badge>
              )}
              <Badge variant="secondary" className="font-mono text-[10px]">{logsPerSec} logs/s</Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-xs">Real-time authenticated ingestion</CardDescription>
        </div>

        {/* Live Controls (Pause, Search Filter, Clear) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Regex Search Input */}
          <div className="relative flex-grow sm:flex-grow-0 min-w-0">
            <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-muted-foreground/60" />
            <Input 
              placeholder="Filter regex (e.g. error|auth)..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-8.5 pl-9 pr-4 text-xs rounded-full bg-zinc-950/40 border-border/40 focus:border-primary/50 transition-all font-mono min-w-full sm:min-w-[220px]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Pause/Play Button */}
            <Button 
              onClick={handleTogglePause}
              variant={isPaused ? "secondary" : "outline"} 
              size="sm" 
              className="h-8.5 text-xs font-bold rounded-full gap-1.5 border-muted flex-grow sm:flex-grow-0 cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" /> 
                  Resume {bufferedCount > 0 && <span className="ml-0.5 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[9px] font-black">{bufferedCount}</span>}
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" /> 
                  Pause Stream
                </>
              )}
            </Button>

            {/* Clear Button */}
            <Button 
              onClick={clearLogs} 
              variant="ghost" 
              size="sm" 
              className="h-8.5 text-xs font-bold text-muted-foreground hover:text-destructive rounded-full border border-muted flex-grow sm:flex-grow-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Clear
            </Button>
          </div>
        </div>

      </CardHeader>
      
      <CardContent className="p-0 border-t flex-grow overflow-hidden bg-[#0a0a0a]">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-3 md:p-4 font-mono text-[10px] md:text-xs space-y-1.5 scroll-smooth animate-in fade-in"
        >
          {filteredLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3 animate-pulse">
              <Activity className="w-8 h-8" />
              <span className="uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-[10px] md:text-sm">
                {filterText ? "No Matching Logs" : "Awaiting Ingestion..."}
              </span>
            </div>
          )}
          {filteredLogs.map((log, i) => {
            const logId = log._client_id || `${log.timestamp}-${i}`;
            const isExpanded = expandedLogId === logId;
            const isoTime = log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString();
            
            let levelBadgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            if (log.level) {
              const lvl = log.level.toUpperCase();
              if (lvl.includes("ERR") || lvl.includes("FAIL") || lvl.includes("CRIT") || lvl.includes("FATAL")) {
                levelBadgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
              } else if (lvl.includes("WARN")) {
                levelBadgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              } else if (lvl.includes("DEB")) {
                levelBadgeColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
              }
            }
            
            return (
              <div key={logId} className="border border-zinc-800/60 bg-[#0f1117] hover:bg-[#151923] rounded-sm transition-all overflow-hidden mb-1 font-mono text-[11px] leading-relaxed">
                <div 
                  onClick={() => toggleExpand(logId)}
                  className="flex items-start gap-2.5 px-3 py-2 cursor-pointer select-none group"
                >
                  <ChevronRight className={`w-3.5 h-3.5 mt-0.5 text-zinc-500 group-hover:text-zinc-300 transform transition-transform ${isExpanded ? 'rotate-90 text-amber-400' : ''}`} />
                  
                  <span className="text-amber-500/90 font-medium shrink-0">
                    {isoTime}
                  </span>

                  <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold border rounded-xs shrink-0 ${levelBadgeColor}`}>
                    {log.level || 'INFO'}
                  </span>

                  {log.service_name && (
                    <span className="text-emerald-400/80 bg-emerald-950/30 px-1.5 py-0.2 text-[9px] rounded-xs shrink-0 border border-emerald-500/20">
                      [{log.service_name}]
                    </span>
                  )}

                  <span className="text-zinc-200 flex-grow break-all pr-2">{log.message}</span>
                  
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <span className="text-[9px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-xs shrink-0">
                      {Object.keys(log.metadata).length} fields
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-3 bg-[#0a0c10] border-t border-zinc-800/60 text-zinc-300 space-y-2 animate-in slide-in-from-top-1 duration-150">
                    <div className="text-[9px] uppercase font-bold text-amber-500 tracking-wider">CloudWatch Log Insights Fields</div>
                    <div className="bg-[#12151e] border border-zinc-800/80 rounded-sm p-2.5 space-y-1 text-[10.5px]">
                      <div className="flex items-start">
                        <span className="text-cyan-400 font-medium w-32 shrink-0">@timestamp</span>
                        <span className="text-zinc-200">{isoTime}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-cyan-400 font-medium w-32 shrink-0">@message</span>
                        <span className="text-zinc-200 break-all">{log.message}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-cyan-400 font-medium w-32 shrink-0">@logGroup</span>
                        <span className="text-zinc-200">/velicor/{log.service_name || 'default'}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-cyan-400 font-medium w-32 shrink-0">@logStream</span>
                        <span className="text-zinc-200">{log.service_name || 'default'}_stream</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-cyan-400 font-medium w-32 shrink-0">@level</span>
                        <span className="text-zinc-200">{log.level}</span>
                      </div>
                      {log.status_code !== undefined && log.status_code !== null && (
                        <div className="flex items-start">
                          <span className="text-cyan-400 font-medium w-32 shrink-0">@statusCode</span>
                          <span className={log.status_code >= 400 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{log.status_code}</span>
                        </div>
                      )}
                      {log.metadata && typeof log.metadata === 'object' && Object.entries(log.metadata).map(([k, v]) => (
                        <div key={k} className="flex items-start">
                          <span className="text-cyan-400 font-medium w-32 shrink-0">{k}</span>
                          <span className="text-zinc-300 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
