import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getServices, resetServiceKey } from '../api';
import { useAuth } from '../context/AuthContext';
import { LiveTerminal } from '../components/LiveTerminal';
import { HistoricalLogs } from '../components/HistoricalLogs';
import { IntegrationGuide } from '../components/IntegrationGuide';
import { WebhookManager } from '../components/WebhookManager';
import { LogAnalytics } from '../components/LogAnalytics';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Terminal, History, PlayCircle, Code2, BarChart3, Bell } from 'lucide-react';
import { ApiKeyDisplay } from '../components/ApiKeyDisplay';

type Tab = 'live' | 'history' | 'sdk' | 'analytics' | 'alerts';

export const ServiceLogsPage: React.FC = () => {
  const { serviceName } = useParams<{ serviceName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiKey = searchParams.get('key') || '';
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('live');

  const handleResetKey = async () => {
    if (!token) return;
    
    const confirmed = window.confirm(`Are you sure you want to reset the API Key for "${serviceName}"? Existing services using the old key will stop being able to ingest logs.`);
    
    if (confirmed) {
      try {
        const services = await getServices(token);
        const service = services.find((s: any) => s.name === serviceName);
        
        if (service) {
          const updated = await resetServiceKey(token, service._id);
          setSearchParams({ key: updated.secret_key });
        }
      } catch (err: any) {
        alert(`Failed to reset key: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4 md:space-y-6 max-w-7xl mx-auto w-full px-3 md:px-4 py-2 md:py-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 py-2 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/services')} className="shrink-0 h-8 w-8 md:h-9 md:w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{serviceName}</h1>
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${activeTab === 'live' ? 'bg-green-500/10 text-green-600 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'live' ? 'bg-green-500' : 'bg-muted-foreground'}`} /> <span className="hidden xs:inline">{activeTab === 'live' ? 'Live' : 'History'}</span>
              </span>
            </div>
            <p className="text-muted-foreground text-[10px] md:text-xs flex items-center gap-2 mt-0.5">
              <Terminal className="w-3 h-3" /> {activeTab === 'live' ? 'Real-time telemetry' : 'Database archives'}
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-auto md:min-w-[300px]">
          <ApiKeyDisplay 
            apiKey={apiKey} 
            variant="compact" 
            onReset={handleResetKey}
          />
        </div>
      </header>

      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-full w-full sm:w-fit border overflow-x-auto no-scrollbar scroll-smooth">
        <Button 
          variant={activeTab === 'live' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('live')}
          className="rounded-full gap-1.5 md:gap-2 px-3 md:px-4 whitespace-nowrap text-[10px] md:text-sm flex-grow sm:flex-grow-0"
        >
          <PlayCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Live
        </Button>
        <Button 
          variant={activeTab === 'history' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('history')}
          className="rounded-full gap-1.5 md:gap-2 px-3 md:px-4 whitespace-nowrap text-[10px] md:text-sm flex-grow sm:flex-grow-0"
        >
          <History className="w-3.5 h-3.5 md:w-4 md:h-4" /> Filtered
        </Button>
        <Button 
          variant={activeTab === 'sdk' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('sdk')}
          className="rounded-full gap-1.5 md:gap-2 px-3 md:px-4 whitespace-nowrap text-[10px] md:text-sm flex-grow sm:flex-grow-0"
        >
          <Code2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> SDK
        </Button>
        <Button 
          variant={activeTab === 'analytics' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('analytics')}
          className="rounded-full gap-1.5 md:gap-2 px-3 md:px-4 whitespace-nowrap text-[10px] md:text-sm flex-grow sm:flex-grow-0"
        >
          <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Stats
        </Button>
        <Button 
          variant={activeTab === 'alerts' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('alerts')}
          className="rounded-full gap-1.5 md:gap-2 px-3 md:px-4 whitespace-nowrap text-[10px] md:text-sm flex-grow sm:flex-grow-0"
        >
          <Bell className="w-3.5 h-3.5 md:w-4 md:h-4" /> Alerts
        </Button>
      </div>

      <div className="flex flex-col space-y-6 md:space-y-8">
        <main className="w-full overflow-hidden">
          {activeTab === 'live' && <LiveTerminal filterService={serviceName} apiKey={apiKey} />}
          {activeTab === 'history' && <HistoricalLogs apiKey={apiKey} serviceName={serviceName || ''} />}
          {activeTab === 'sdk' && <IntegrationGuide apiKey={apiKey} serviceName={serviceName || ''} />}
          {activeTab === 'analytics' && <LogAnalytics serviceName={serviceName || ''} />}
          {activeTab === 'alerts' && <WebhookManager serviceName={serviceName || ''} />}
        </main>
      </div>
    </div>
  );
};
