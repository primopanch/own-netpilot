import React, { useState } from 'react';
import { NetworkTopology, NetworkDevice } from '../types/network';
import { Router as RouterIcon, Server, Monitor, HardDrive, Wifi, ExternalLink, Copy, Check, Terminal } from 'lucide-react';

interface Props {
  topology: NetworkTopology;
  compact?: boolean;
  onSelectDevice?: (device: NetworkDevice) => void;
}

export const InteractiveTopology: React.FC<Props> = ({ topology, compact = false, onSelectDevice }) => {
  const [selectedDev, setSelectedDev] = useState<NetworkDevice | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDeviceClick = (dev: NetworkDevice) => {
    setSelectedDev(dev);
    if (onSelectDevice) {
      onSelectDevice(dev);
    }
  };

  const copyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find link coordinates
  const getDevicePos = (devId: string) => {
    const dev = topology.devices.find(d => d.id === devId || d.name === devId);
    if (dev) return { x: dev.x, y: dev.y };
    return { x: 200, y: 150 };
  };

  const viewBox = compact ? "0 0 640 420" : "0 0 800 500";

  return (
    <div className={`relative bg-[#090d16] rounded-xl border border-slate-800 overflow-hidden ${compact ? 'h-[360px]' : 'h-[500px]'}`}>
      {/* Topology Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2.5 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Topología Lógica en Tiempo Real
          </h4>
          <span className="text-xs text-slate-400">({topology.devices.length} equipos activos)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {topology.routingProtocol || 'Cisco IOS'}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg className="w-full h-full select-none" viewBox={viewBox}>
        <defs>
          {/* Subtle Grid */}
          <pattern id="net-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          {/* Glow filter */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#net-grid)" />

        {/* Links */}
        <g className="links">
          {topology.links.map((link) => {
            const p1 = getDevicePos(link.sourceDevice);
            const p2 = getDevicePos(link.targetDevice);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            const isSerial = link.type === 'serial';
            const strokeColor = isSerial ? '#f59e0b' : '#06b6d4';

            return (
              <g key={link.id} className="transition-all duration-300">
                {/* Outer Glow */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth="4"
                  strokeOpacity="0.15"
                />
                {/* Physical Cable */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth={isSerial ? "2" : "2.5"}
                  strokeDasharray={isSerial ? "6 3" : undefined}
                />
                {/* Link status LED */}
                <circle cx={midX} cy={midY} r="3" fill="#10b981" />

                {/* Interface Labels */}
                <text
                  x={p1.x + (p2.x - p1.x) * 0.25}
                  y={p1.y + (p2.y - p1.y) * 0.25 - 6}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {link.sourcePort}
                </text>
                <text
                  x={p1.x + (p2.x - p1.x) * 0.75}
                  y={p1.y + (p2.y - p1.y) * 0.75 + 12}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {link.targetPort}
                </text>
              </g>
            );
          })}
        </g>

        {/* Devices */}
        <g className="devices">
          {topology.devices.map((device) => {
            const isSelected = selectedDev?.id === device.id;
            const isRouter = device.type === 'router';
            const isSwitch = device.type === 'switch';

            return (
              <g
                key={device.id}
                transform={`translate(${device.x}, ${device.y})`}
                onClick={() => handleDeviceClick(device)}
                className="cursor-pointer group"
              >
                {/* Device Halo / Selection Ring */}
                <circle
                  r={isRouter ? "26" : "24"}
                  fill={isSelected ? '#06b6d4' : '#1e293b'}
                  fillOpacity={isSelected ? "0.25" : "0.5"}
                  stroke={isSelected ? '#22d3ee' : '#334155'}
                  strokeWidth={isSelected ? "2" : "1"}
                  className="transition-all duration-200 group-hover:stroke-cyan-400 group-hover:scale-110"
                />

                {/* Device Icon representation */}
                {isRouter ? (
                  // Cisco Router Symbol (Circle with 4 cross arrows)
                  <g>
                    <circle r="18" fill="#0e7490" stroke="#22d3ee" strokeWidth="1.5" />
                    <path
                      d="M -7 -7 L -2 -2 M 7 -7 L 2 -2 M -7 7 L -2 2 M 7 7 L 2 2"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle r="3" fill="#ffffff" />
                  </g>
                ) : isSwitch ? (
                  // Cisco Switch Symbol (Rounded Rect with parallel dual arrows)
                  <g>
                    <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                    <path
                      d="M -12 -3 L 12 -3 M 8 -6 L 12 -3 L 8 0 M 12 3 L -12 3 M -8 0 L -12 3 L -8 6"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </g>
                ) : (
                  // PC / Host Symbol
                  <g>
                    <rect x="-14" y="-12" width="28" height="20" rx="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                    <rect x="-10" y="-8" width="20" height="12" fill="#06b6d4" fillOpacity="0.3" />
                    <path d="M 0 8 L 0 14 M -8 14 L 8 14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                )}

                {/* Device Label */}
                <text
                  y={isRouter ? "36" : "34"}
                  fill={isSelected ? "#22d3ee" : "#f1f5f9"}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  className="group-hover:fill-cyan-300"
                >
                  {device.name}
                </text>

                {/* Model badge */}
                <text
                  y={isRouter ? "48" : "46"}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {device.model}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Device Inspector Drawer */}
      {selectedDev && (
        <div className="absolute right-3 bottom-3 top-12 w-80 bg-[#0f172a]/95 border border-cyan-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-xl flex flex-col z-20 animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
                  {selectedDev.type === 'router' ? <RouterIcon size={16} /> : selectedDev.type === 'switch' ? <HardDrive size={16} /> : <Monitor size={16} />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedDev.name}</h3>
                  <p className="text-[11px] text-cyan-400 font-mono">{selectedDev.model}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedDev(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Interfaces List */}
          <div className="mt-3 flex-1 overflow-y-auto pr-1">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Interfaces & Direccionamiento
            </h4>
            <div className="space-y-1.5">
              {selectedDev.interfaces.length > 0 ? (
                selectedDev.interfaces.map((iface, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-cyan-300 font-medium">{iface.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${iface.status === 'up' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400'}`}>
                        {iface.status.toUpperCase()}
                      </span>
                    </div>
                    {iface.ipAddress && (
                      <div className="mt-1 text-[11px] text-slate-300 font-mono flex items-center justify-between">
                        <span>IP: {iface.ipAddress}</span>
                        {iface.subnetMask && <span className="text-slate-500">{iface.subnetMask}</span>}
                      </div>
                    )}
                    {iface.vlan && (
                      <div className="mt-0.5 text-[10px] text-purple-400">
                        VLAN {iface.vlan} {iface.description ? `(${iface.description})` : ''}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No hay interfaces configuradas aún.</p>
              )}
            </div>

            {/* Cisco IOS Config Preview */}
            {selectedDev.iosConfig && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Configuración Cisco IOS
                  </span>
                  <button
                    onClick={() => copyConfig(selectedDev.iosConfig)}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[10px] font-mono text-cyan-200/90 max-h-40 overflow-y-auto whitespace-pre-wrap terminal-scroll">
                  {selectedDev.iosConfig}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
