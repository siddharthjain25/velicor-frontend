import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { 
  Terminal, 
  ArrowRight, 
  Zap, 
  Bell, 
  Database, 
  Shield, 
  Code2, 
  BookOpen, 
  Activity,
  Cpu,
  Sparkles
} from 'lucide-react';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [markdown, setMarkdown] = useState<string>('');
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'python'>('node');

  // Simulated log streaming in the hero dashboard
  const [simulatedLogs, setSimulatedLogs] = useState<Array<{ time: string; level: string; service: string; msg: string }>>([
    { time: '14:55:01', level: 'INFO', service: 'auth-service', msg: 'User login verification initiated' },
    { time: '14:55:02', level: 'INFO', service: 'auth-service', msg: 'JWT session token issued for user_492' },
    { time: '14:55:03', level: 'WARNING', service: 'gateway-api', msg: 'Rate limiting check taking longer than 15ms' },
  ]);

  useEffect(() => {
    // Fetch documentation markdown
    fetch('/docs/homepage.md')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load docs');
        return res.text();
      })
      .then((text) => {
        setMarkdown(text);
        setLoadingDocs(false);
      })
      .catch((err) => {
        console.error(err);
        setMarkdown('Failed to load integration documentation. Please check back later.');
        setLoadingDocs(false);
      });
  }, []);

  useEffect(() => {
    // Periodically update simulated logs
    const services = ['payment-processor', 'users-db', 'notification-worker', 'gateway-api', 'auth-service'];
    const levels = ['INFO', 'INFO', 'INFO', 'WARNING', 'ERROR'];
    const messages = {
      INFO: [
        'Database connection pool warmed up',
        'Redis cache hit for resource key',
        'Email notification queued for user_301',
        'Payment intent created ($49.00 USD)',
        'Batch flush of 250 logs successfully completed',
      ],
      WARNING: [
        'Slow database query detected: SELECT * FROM users...',
        'Memory usage exceeded 70% in worker instance 2',
        'Network handshake delay: api.external-service.com',
      ],
      ERROR: [
        'SQL connection dropped: Connection timed out',
        'Slack alert webhook failed with status code 503',
        'Failed to parse JSON payload on request body',
      ],
    };

    const interval = setInterval(() => {
      const level = levels[Math.floor(Math.random() * levels.length)] as 'INFO' | 'WARNING' | 'ERROR';
      const service = services[Math.floor(Math.random() * services.length)];
      const msgs = messages[level];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setSimulatedLogs((prev) => [
        ...prev.slice(-4), // Keep last 5
        { time: timeStr, level, service, msg }
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col space-y-20 max-w-7xl mx-auto w-full px-4 py-8 md:py-16">
      
      {/* 1. Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center gap-12 pt-4 lg:pt-10">
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

        <div className="flex-1 space-y-6 text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Velicor Ingestion Protocol v1.4
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-white">
            High-density telemetry. <br />
            <span className="bg-gradient-to-r from-primary via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
              Simplified.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Velicor aggregates logs across all your microservice nodes, indexing them inside high-speed storage engines with instant search and active alerting hooks.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {isAuthenticated ? (
              <Button asChild size="lg" className="font-bold shadow-md cursor-pointer">
                <Link to="/services" className="flex items-center gap-2">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="font-bold shadow-md cursor-pointer">
                  <Link to="/register" className="flex items-center gap-2">
                    Create Free Account <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-muted hover:bg-muted font-bold cursor-pointer">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
            <a 
              href="#docs" 
              className="text-xs font-bold text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 px-4 h-11"
            >
              <BookOpen className="w-4 h-4" /> View Docs
            </a>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-border/40 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>&lt; 5ms Ingestion Latency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-500" />
              <span>Isolated Tables</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Terminal Graphic */}
        <div className="flex-1 w-full lg:max-w-xl relative z-10">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-3xl opacity-30 transform scale-95 pointer-events-none" />
          <div className="border border-border/60 bg-[#0d1117]/85 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden font-mono text-xs text-[#e6edf3]">
            
            {/* Terminal Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#161b22]/70">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-muted-foreground text-[10px] ml-2 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> telemetry_streamer.log
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>
            </div>

            {/* Terminal Logs Content */}
            <div className="p-5 space-y-2.5 min-h-[200px] overflow-hidden text-left">
              {simulatedLogs.map((log, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 leading-relaxed animate-in slide-in-from-bottom-2 duration-300">
                  <span className="text-muted-foreground text-[10px] select-none shrink-0">{log.time}</span>
                  <span className={`text-[10px] font-black uppercase shrink-0 ${
                    log.level === 'ERROR' ? 'text-red-400 bg-red-500/10 px-1 rounded' :
                    log.level === 'WARNING' ? 'text-amber-400 bg-amber-500/10 px-1 rounded' :
                    'text-blue-400 bg-blue-500/10 px-1 rounded'
                  }`}>{log.level}</span>
                  <span className="text-primary/70 font-semibold shrink-0">[{log.service}]</span>
                  <span className="text-muted-foreground break-all">{log.msg}</span>
                </div>
              ))}
            </div>

            {/* Ingestion stats bar */}
            <div className="px-5 py-3.5 border-t border-white/5 bg-[#161b22]/50 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-primary" /> Ingest Rate: ~2,410 logs/sec</span>
              <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-emerald-500" /> Database Status: Nominal</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Features Grid */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Core Architecture</h2>
          <p className="text-3xl font-bold tracking-tight text-white">Engineered for Microservice Ecosystems</p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Velicor operates as a telemetry sidecar or centralized proxy, buffering high-throughput traffic and resolving downstream database constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#090d16]/30 border-muted hover:border-primary/40 transition-all group duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white tracking-tight">Ultra-Fast Pipeline</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Asynchronous event pooling in Python batch-flushes telemetry buffers directly to DB nodes, keeping ingress latency below 5ms.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#090d16]/30 border-muted hover:border-primary/40 transition-all group duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white tracking-tight">Proactive Webhook Alerts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Establish custom query matches. Immediately signal Slack, Discord, or status reporting microservices on critical failures.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#090d16]/30 border-muted hover:border-primary/40 transition-all group duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white tracking-tight">Database Isolation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Velicor partitions data automatically. Each microservice writes to isolated database partitions ensuring logical boundaries.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#090d16]/30 border-muted hover:border-primary/40 transition-all group duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white tracking-tight">Secure Credentials</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Access tokens are hashed and validated with high-speed memory caching, securing ingestion streams without database degradation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Interactive Code Snippet Tabs */}
      <section className="space-y-8 bg-zinc-950/40 p-6 md:p-8 rounded-2xl border border-border/40 relative">
        <div className="absolute top-0 right-[20%] w-[150px] h-[150px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" /> Low-Overhead Integration
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Transmit logs directly over HTTP/1.1 or HTTPS standard sockets.
            </p>
          </div>
          
          <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/40 w-fit">
            <button
              onClick={() => setActiveTab('node')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'node' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Node.js
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'python' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'curl' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              cURL
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden bg-[#0d1117] text-[#e6edf3]">
          {activeTab === 'node' && (
            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-left">
              <p className="text-zinc-500 mb-2">// Node.js - await ensures serverless environments deliver logs before freezing</p>
              <span className="text-[#ff7b72]">const</span> axios = require(<span className="text-[#a5d6ff]">'axios'</span>);<br /><br />
              <span className="text-[#ff7b72]">const</span> logToVelicor = <span className="text-[#ff7b72]">async</span> (level, message, metadata = {}) <span className="text-[#ff7b72]">=&gt;</span> &#123;<br />
              &nbsp;&nbsp;<span className="text-[#ff7b72]">await</span> axios.post(<span className="text-[#a5d6ff]">'https://your-velicor.com/api/v1/ingest'</span>, &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;level, message,<br />
              &nbsp;&nbsp;&nbsp;&nbsp;timestamp: <span className="text-[#ff7b72]">new</span> Date().toISOString(),<br />
              &nbsp;&nbsp;&nbsp;&nbsp;service_name: <span className="text-[#a5d6ff]">'my-service'</span>,<br />
              &nbsp;&nbsp;&nbsp;&nbsp;...metadata<br />
              &nbsp;&nbsp;&#125;, &#123; headers: &#123; <span className="text-[#a5d6ff]">'x-api-key'</span>: <span className="text-[#a5d6ff]">'YOUR_KEY'</span> &#125; &#125;);<br />
              &#125;;
            </div>
          )}
          {activeTab === 'python' && (
            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-left">
              <p className="text-zinc-500 mb-2"># Python - synchronous standard post request</p>
              <span className="text-[#ff7b72]">import</span> requests<br />
              <span className="text-[#ff7b72]">import</span> time<br /><br />
              <span className="text-[#ff7b72]">def</span> <span className="text-[#d2a8ff]">log_to_velicor</span>(level, message, metadata=<span className="text-[#79c0ff]">None</span>):<br />
              &nbsp;&nbsp;&nbsp;&nbsp;payload = &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#a5d6ff]">"level"</span>: level, <span className="text-[#a5d6ff]">"message"</span>: message, <span className="text-[#a5d6ff]">"timestamp"</span>: time.time(),<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#a5d6ff]">"service_name"</span>: <span className="text-[#a5d6ff]">"my-service"</span>, <span className="text-[#a5d6ff]">"metadata"</span>: metadata or &#123;&#125;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;requests.post(<span className="text-[#a5d6ff]">"https://your-velicor.com/api/v1/ingest"</span>, <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;json=payload, headers=&#123;<span className="text-[#a5d6ff]">"x-api-key"</span>: <span className="text-[#a5d6ff]">"YOUR_KEY"</span>&#125;)<br />
            </div>
          )}
          {activeTab === 'curl' && (
            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-left">
              <p className="text-zinc-500 mb-2"># cURL - test logging instantly from shell</p>
              curl -X POST https://your-velicor.com/api/v1/ingest \<br />
              &nbsp;&nbsp;-H <span className="text-[#a5d6ff]">"x-api-key: YOUR_KEY"</span> \<br />
              &nbsp;&nbsp;-H <span className="text-[#a5d6ff]">"Content-Type: application/json"</span> \<br />
              &nbsp;&nbsp;-d <span className="text-[#a5d6ff]">'&#123;"level": "INFO", "message": "Quick check", "service_name": "terminal"&#125;'</span>
            </div>
          )}
        </div>
      </section>

      {/* 4. Markdown Documentation (Edit Easily) */}
      <section id="docs" className="space-y-6 pt-4 border-t border-border/40">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Interactive Integration Guide</h2>
            <p className="text-xs text-muted-foreground">This section is dynamically compiled from Markdown at runtime.</p>
          </div>
        </div>

        <Card className="bg-[#090d16]/30 border-muted shadow-lg overflow-hidden">
          <CardContent className="p-6 md:p-10 text-left">
            {loadingDocs ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-muted-foreground italic">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="uppercase tracking-widest text-[9px] font-bold">Compiling Markdown Docs...</span>
              </div>
            ) : (
              <MarkdownRenderer content={markdown} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* 5. Final CTA Banner */}
      {!isAuthenticated && (
        <section className="bg-gradient-to-r from-[#0d1527] to-[#121c32] rounded-3xl border border-primary/10 p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[80px] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Stream telemetry from your microservices today</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Create an account, register your services, copy your credentials, and watch logs stream instantly. High-throughput diagnostics, zero complexity.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="font-bold shadow-md cursor-pointer">
              <Link to="/register" className="flex items-center gap-2">
                Get Started for Free <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

    </div>
  );
};
