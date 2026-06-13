import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { BarChart3 } from 'lucide-react';
import { getServiceStats, getServices } from '../api';
import { useAuth } from '../context/AuthContext';

interface LogAnalyticsProps {
  serviceName: string;
}

export const LogAnalytics: React.FC<LogAnalyticsProps> = ({ serviceName }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState(24);
  const { token } = useAuth();

  useEffect(() => {
    fetchStats();
  }, [serviceName, token, interval]);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const services = await getServices(token);
      const service = services.find((s: any) => s.name === serviceName);
      if (service) {
        const data = await getServiceStats(token, service._id, interval);
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-muted-foreground">Aggregating Metrics...</div>;

  const totalLogs = (Object.values(stats?.levels || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  const errorCount = (stats?.levels?.['ERROR'] || 0) + (stats?.levels?.['FATAL'] || 0);
  const errorRate = totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(1) : 0;

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'bg-red-500';
      case 'FATAL': return 'bg-red-700';
      case 'WARN': return 'bg-yellow-500';
      case 'DEBUG': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
           <BarChart3 className="w-4 h-4 text-primary" /> Traffic Analytics
         </h2>
         <div className="flex gap-1 p-1 bg-muted/50 rounded-lg border w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[1, 6, 24, 168].map(h => (
              <Button 
                key={h} 
                variant={interval === h ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 flex-grow sm:flex-grow-0 text-[9px] px-3 font-bold whitespace-nowrap"
                onClick={() => setInterval(h)}
              >
                {h >= 24 ? `${h/24}D` : `${h}H`}
              </Button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/[0.02] border-primary/10">
          <CardContent className="p-4 md:p-5 space-y-1">
            <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Events</span>
            <div className="text-xl md:text-2xl font-black">{totalLogs.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className={errorCount > 0 ? "bg-red-500/[0.02] border-red-500/10" : "bg-emerald-500/[0.02] border-emerald-500/10"}>
          <CardContent className="p-4 md:p-5 space-y-1">
            <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Error Rate</span>
            <div className={`text-xl md:text-2xl font-black ${errorCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{errorRate}%</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/[0.02] border-blue-500/10">
          <CardContent className="p-4 md:p-5 space-y-1">
            <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Peak Load</span>
            <div className="text-xl md:text-2xl font-black">{Math.max(...(stats?.series || [0]).map((s: any) => s.count)).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Distribution Bar Chart */}
        <Card className="shadow-sm border-muted overflow-hidden">
          <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-sm">Event Distribution</CardTitle>
            <CardDescription className="text-[9px] md:text-[10px]">Log counts by severity level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:px-6 pb-4 md:pb-6">
            {Object.entries(stats?.levels || {}).sort((a: any, b: any) => b[1] - a[1]).map(([level, count]: [any, any]) => (
              <div key={level} className="space-y-1.5">
                <div className="flex justify-between text-[9px] md:text-[10px] font-bold uppercase tracking-tight">
                  <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getLevelColor(level)}`} />
                    {level}
                  </span>
                  <span>{count.toLocaleString()} ({((count / totalLogs) * 100).toFixed(1)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getLevelColor(level)} rounded-full transition-all duration-500`} 
                    style={{ width: `${(count / totalLogs) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Time Series Sparkline (Simulated with SVG) */}
        <Card className="shadow-sm border-muted overflow-hidden">
           <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-sm">Activity Heartbeat</CardTitle>
              <CardDescription className="text-[9px] md:text-[10px]">Ingestion volume over time</CardDescription>
           </CardHeader>
           <CardContent className="p-0 h-[120px] md:h-[150px] relative bg-[#0a0a0a]/30">
              {stats?.series.length > 1 ? (
                <svg className="w-full h-full text-primary" viewBox="0 0 1000 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0 100 ${stats.series.map((s: any, i: number) => `L ${(i / (stats.series.length - 1)) * 1000} ${100 - (s.count / Math.max(...stats.series.map((x: any) => x.count))) * 90}`).join(' ')} L 1000 100 Z`}
                    fill="url(#gradient)"
                  />
                  <path
                    d={`M 0 ${100 - (stats.series[0].count / Math.max(...stats.series.map((x: any) => x.count))) * 90} ${stats.series.map((s: any, i: number) => `L ${(i / (stats.series.length - 1)) * 1000} ${100 - (s.count / Math.max(...stats.series.map((x: any) => x.count))) * 90}`).join(' ')}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-dash"
                  />
                </svg>
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-black opacity-30 tracking-[0.3em]">
                   Insufficient Data Points
                </div>
              )}
           </CardContent>
        </Card>
      </div>
    </div>
  );
};
