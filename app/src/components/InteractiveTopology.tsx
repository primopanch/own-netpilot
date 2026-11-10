import React, { useState } from 'react';
import { NetworkTopology, NetworkDevice } from '../types/network';
import { Router as RouterIcon, Monitor, HardDrive, Copy, Check } from 'lucide-react';

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

  const getDevicePos = (devId: string) => {
    const dev = topology.devices.find(d => d.id === devId || d.name === devId);
    if (dev) return { x: dev.x, y: dev.y };
    return { x: 200, y: 150 };
  };

  const viewBox = compact ? "0 0 640 420" : "0 0 800 500";

  return (
    <div className={`relative bg-[#FAFAF9] rounded-2xl border border-[#E8E8E5] shadow-soft-sm overflow-hidden ${compact ? 'h-[360px]' : 'h-[500px]'}`}>
      {/* Topology Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2.5 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E8E8E5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#16A34A]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#18181B]">
            Topología Lógica en Tiempo Real
          </h4>
          <span className="text-xs text-[#71717A]">({topology.devices.length} equipos activos)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#52525B] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] font-medium">
            {topology.routingProtocol || 'Cisco IOS'}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg className="w-full h-full select-none" viewBox={viewBox}>
        <defs>
          <pattern id="light-net-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E4E4E0" strokeWidth="0.75" strokeOpacity="0.8" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#light-net-grid)" />

        {/* Links */}
        <g className="links">
          {topology.links.map((link) => {
            const p1 = getDevicePos(link.sourceDevice);
            const p2 = getDevicePos(link.targetDevice);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            const isSerial = link.type === 'serial';
            const strokeColor = isSerial ? '#D97706' : '#2563EB';

            return (
              <g key={link.id} className="transition-all duration-300">
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth={isSerial ? "2" : "2.5"}
                  strokeDasharray={isSerial ? "6 3" : undefined}
                />
                <circle cx={midX} cy={midY} r="3" fill="#16A34A" />

                {/* Interface Labels */}
                <text
                  x={p1.x + (p2.x - p1.x) * 0.25}
                  y={p1.y + (p2.y - p1.y) * 0.25 - 6}
                  fill="#71717A"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {link.sourcePort}
                </text>
                <text
                  x={p1.x + (p2.x - p1.x) * 0.75}
                  y={p1.y + (p2.y - p1.y) * 0.75 + 12}
                  fill="#71717A"
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
                  fill={isSelected ? '#EFF6FF' : '#FFFFFF'}
                  stroke={isSelected ? '#2563EB' : '#D4D4D8'}
                  strokeWidth={isSelected ? "2" : "1.5"}
                  className="transition-all duration-200 group-hover:stroke-[#18181B] group-hover:scale-105 filter drop-shadow-sm"
                />

                {/* Device Icon */}
                {isRouter ? (
                  <g>
                    <circle r="18" fill="#1E293B" />
                    <path
                      d="M -7 -7 L -2 -2 M 7 -7 L 2 -2 M -7 7 L -2 2 M 7 7 L 2 2"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle r="3" fill="#38BDF8" />
                  </g>
                ) : isSwitch ? (
                  <g>
                    <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#1E3A8A" />
                    <path
                      d="M -12 -3 L 12 -3 M 8 -6 L 12 -3 L 8 0 M 12 3 L -12 3 M -8 0 L -12 3 L -8 6"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </g>
                ) : (
                  <g>
                    <rect x="-14" y="-12" width="28" height="20" rx="3" fill="#3F3F46" />
                    <rect x="-10" y="-8" width="20" height="12" fill="#E0F2FE" />
                    <path d="M 0 8 L 0 14 M -8 14 L 8 14" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                )}

                {/* Device Label */}
                <text
                  y={isRouter ? "36" : "34"}
                  fill="#18181B"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {device.name}
                </text>

                {/* Model badge */}
                <text
                  y={isRouter ? "48" : "46"}
                  fill="#71717A"
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
        <div className="absolute right-3 bottom-3 top-12 w-80 bg-[#FFFFFF] border border-[#E8E8E5] rounded-2xl p-4 shadow-soft-xl flex flex-col z-20 animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-[#E8E8E5]">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#F5F5F3] text-[#18181B]">
                  {selectedDev.type === 'router' ? <RouterIcon size={16} /> : selectedDev.type === 'switch' ? <HardDrive size={16} /> : <Monitor size={16} />}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#18181B]">{selectedDev.name}</h3>
                  <p className="text-[11px] text-[#71717A] font-mono">{selectedDev.model}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedDev(null)}
              className="text-[#71717A] hover:text-[#18181B] p-1 rounded-lg hover:bg-[#F5F5F3] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Interfaces List */}
          <div className="mt-3 flex-1 overflow-y-auto pr-1">
            <h4 className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider mb-2">
              Interfaces & Direccionamiento
            </h4>
            <div className="space-y-1.5">
              {selectedDev.interfaces.length > 0 ? (
                selectedDev.interfaces.map((iface, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#FAFAF9] border border-[#E8E8E5] text-xs shadow-soft-sm">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[#18181B] font-semibold">{iface.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${iface.status === 'up' ? 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                        {iface.status.toUpperCase()}
                      </span>
                    </div>
                    {iface.ipAddress && (
                      <div className="mt-1 text-[11px] text-[#52525B] font-mono flex items-center justify-between">
                        <span>IP: {iface.ipAddress}</span>
                        {iface.subnetMask && <span className="text-[#71717A]">{iface.subnetMask}</span>}
                      </div>
                    )}
                    {iface.vlan && (
                      <div className="mt-0.5 text-[10px] text-[#7C3AED]">
                        VLAN {iface.vlan} {iface.description ? `(${iface.description})` : ''}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#71717A] italic">No hay interfaces configuradas aún.</p>
              )}
            </div>

            {/* Cisco IOS Config Preview */}
            {selectedDev.iosConfig && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">
                    Configuración Cisco IOS
                  </span>
                  <button
                    onClick={() => copyConfig(selectedDev.iosConfig)}
                    className="flex items-center gap-1 text-[10px] text-[#18181B] font-medium hover:text-[#52525B] transition-colors"
                  >
                    {copied ? <Check size={12} className="text-[#16A34A]" /> : <Copy size={12} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#18181B] text-[#F4F4F5] text-[10px] font-mono max-h-40 overflow-y-auto whitespace-pre-wrap shadow-soft-sm">
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
