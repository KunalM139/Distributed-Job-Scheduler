import { useState } from 'react';
import api from '../services/api';
import usePolling from '../hooks/usePolling';

export default function WorkersPage() {
  const [now, setNow] = useState(Date.now());

  // Live tick for "X seconds ago" — runs every 1 s
  useState(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  });

  const fetchWorkers = async () => {
    const res = await api.get('/api/workers');
    return res.data.data;
  };

  const { data: workers, loading } = usePolling(fetchWorkers, 10_000, ['WORKER_REGISTERED', 'WORKER_HEARTBEAT', 'WORKER_OFFLINE']);

  const timeAgo = (ts) => {
    if (!ts) return '-- offline --';
    const seconds = Math.floor((now - new Date(ts).getTime()) / 1000);
    if (seconds < 0) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const list = workers ?? [];
  const total = list.length;
  
  // A worker is active if it's 'online' and last heartbeat was < 45s ago
  // 'inactive' if 'online' but > 45s ago
  // 'dead' if 'offline'
  let activeCount = 0;
  let inactiveCount = 0;
  let deadCount = 0;

  list.forEach((w) => {
    if (w.status === 'offline') {
      deadCount++;
    } else {
      const hbAge = w.last_heartbeat_at ? Math.floor((now - new Date(w.last_heartbeat_at).getTime()) / 1000) : null;
      if (hbAge !== null && hbAge > 45) {
        inactiveCount++;
      } else {
        activeCount++;
      }
    }
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 bg-background min-h-screen text-on-surface selection:bg-primary/20 selection:text-on-surface">
      {/* Page Header Meta */}
      <div>
        <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface mb-1">Workers</h2>
        <p className="text-on-surface-variant text-[14px]">Monitor worker availability and heartbeat status.</p>
      </div>

      {/* Summary Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant shadow-sm">
          <p className="text-[12px] uppercase tracking-widest font-semibold text-outline mb-1">Total Workers</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-on-surface leading-tight">{total}</span>
            <span className="text-outline text-[12px]">nodes</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant shadow-sm">
          <p className="text-[12px] uppercase tracking-widest font-semibold text-outline mb-1">Active Workers</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-primary leading-tight">{activeCount}</span>
            <span className="text-primary/70 text-[12px]">healthy</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant shadow-sm">
          <p className="text-[12px] uppercase tracking-widest font-semibold text-outline mb-1">Inactive Workers</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-tertiary leading-tight">{inactiveCount}</span>
            <span className="text-tertiary/70 text-[12px]">standby</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant shadow-sm">
          <p className="text-[12px] uppercase tracking-widest font-semibold text-outline mb-1">Dead Workers</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-error leading-tight">{deadCount}</span>
            <span className="text-error/70 text-[12px]">unresponsive</span>
          </div>
        </div>
      </div>

      {/* Monitoring Grid Header */}
      <div className="flex items-center justify-between mt-2">
        <h3 className="text-[16px] font-semibold text-on-surface">Worker Nodes</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold hover:bg-surface-container-high hover:text-on-surface transition-colors">
            Filter: All Nodes
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold hover:bg-surface-container-high hover:text-on-surface transition-colors">
            Sort: Heartbeat
          </button>
        </div>
      </div>

      {/* Grid / Empty State */}
      {loading && list.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant animate-pulse">
              <div className="h-4 w-3/4 bg-surface-container-high rounded mb-2"></div>
              <div className="h-3 w-1/4 bg-surface-container-high rounded mb-4"></div>
              <div className="h-8 w-full bg-surface-container-high/50 rounded"></div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 mt-4 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest/30">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.38-.564.48-.885M11.42 15.17l-4.593 4.593a2.652 2.652 0 01-3.75 0 2.652 2.652 0 010-3.75l4.593-4.593M11.42 15.17l3.053-2.492c.266-.217.564-.38.885-.48M10.58 14.23L5.42 9.07M10.58 14.23c.266-.217.564-.38.885-.48m-2.145-8.21c-.266.217-.564.38-.885.48M12 12a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          </div>
          <h4 className="text-[16px] font-semibold text-on-surface mb-1">No workers registered</h4>
          <p className="text-on-surface-variant text-[14px] mb-6 text-center max-w-sm">
            No distributed nodes are currently connected to the cluster. Start one with <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface">npm run worker</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          {list.map((w) => {
            const isOffline = w.status === 'offline';
            const hbAge = w.last_heartbeat_at ? Math.floor((now - new Date(w.last_heartbeat_at).getTime()) / 1000) : null;
            const isStale = hbAge !== null && hbAge > 45;

            // Determine derived state
            let derivedState = 'active'; // 'active', 'inactive', 'dead'
            if (isOffline) derivedState = 'dead';
            else if (isStale) derivedState = 'inactive';

            const borderColor = 
              derivedState === 'active' ? 'hover:border-primary' :
              derivedState === 'inactive' ? 'hover:border-tertiary' : 
              'hover:border-error';

            const textHover = 
              derivedState === 'active' ? 'group-hover:text-primary' :
              derivedState === 'inactive' ? 'group-hover:text-tertiary' : 
              'group-hover:text-error';

            const badgeBg = 
              derivedState === 'active' ? 'bg-primary/10 border-primary/20' :
              derivedState === 'inactive' ? 'bg-tertiary/10 border-tertiary/20' : 
              'bg-error/10 border-error/20';
            
            const dotColor = 
              derivedState === 'active' ? 'bg-primary animate-pulse' :
              derivedState === 'inactive' ? 'bg-tertiary' : 
              'bg-error';

            const badgeText = 
              derivedState === 'active' ? 'text-primary' :
              derivedState === 'inactive' ? 'text-tertiary' : 
              'text-error';

            return (
              <div key={w.id} className={`bg-surface-container-lowest p-4 rounded-lg border border-outline-variant transition-all group cursor-pointer ${borderColor}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col pr-2">
                    <span className={`font-mono text-[13px] text-on-surface font-semibold transition-colors truncate ${textHover}`}>
                      {w.hostname}
                    </span>
                    <span className="text-[10px] text-outline uppercase tracking-widest font-semibold mt-0.5 truncate">
                      ID: {w.id.split('-')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className={`flex items-center shrink-0 gap-1.5 px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                    <span className={`text-[10px] uppercase font-semibold tracking-wide ${badgeText}`}>
                      {derivedState}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-outline-variant/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-outline uppercase tracking-widest font-semibold">Last Heartbeat</span>
                    <span className={`text-[12px] font-mono ${derivedState === 'dead' ? 'text-error' : 'text-on-surface'}`}>
                      {timeAgo(w.last_heartbeat_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-outline uppercase tracking-widest font-semibold">Registered At</span>
                    <span className="text-[12px] text-on-surface-variant font-mono">
                      {new Date(w.registered_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
