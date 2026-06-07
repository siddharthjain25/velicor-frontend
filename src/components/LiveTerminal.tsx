import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Terminal, Trash2, ShieldCheck, Activity, Wifi, WifiOff, Zap, Play, Pause, Search } from 'lucide-react';
import { Badge } from './ui/Badge';
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
            ).reverse();

            if (newLogs.length > 0) {
              logCountRef.current += newLogs.length;
              setAccumulatedLogs(prev => [...prev.slice(-(100 - newLogs.length)), ...newLogs]);
              if (!isPausedRef.current) {
                setLogs(prev => [...prev.slice(-(100 - newLogs.length)), ...newLogs]);
              }
              lastTsRef.current = newLogs[newLogs.length - 1].timestamp;
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
          
          setAccumulatedLogs(prev => [...prev.slice(-99), data]);
          if (!isPausedRef.current) {
            setLogs(prev => [...prev.slice(-99), data]);
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
          {filteredLogs.map((log, i) => (
            <div key={i} className="flex flex-col xs:flex-row gap-2 xs:gap-4 hover:bg-white/5 p-1.5 rounded transition-colors group relative items-start xs:items-center">
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-muted-foreground/40 select-none text-[9px] md:text-[10px] font-semibold w-12">
                  {new Date(log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="min-w-[50px] md:min-w-[55px] inline-block">
                  <Badge variant={getBadgeVariant(log.level)} className="text-[8.5px] uppercase font-black px-1.5 py-0.5 border-none shadow-none leading-none select-none">
                    {log.level}
                  </Badge>
                </span>
              </div>
              <span className="text-gray-300 flex-grow break-all leading-relaxed">{log.message}</span>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="hidden sm:group-hover:block ml-auto opacity-40">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
