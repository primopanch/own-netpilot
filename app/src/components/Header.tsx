import React from 'react';
import { ApiSettings, NetworkTopology } from '../types/network';
import { 
  Network, 
  Key, 
  Download, 
  Settings, 
  Menu, 
  PlusCircle, 
  ShieldCheck, 
  Activity,
  Layers
} from 'lucide-react';

interface Props {
  settings: ApiSettings;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  topology: NetworkTopology;
  onToggleTopologyView: () => void;
  isTopologyViewOpen: boolean;
  onBackToVerification?: () => void;
}

export const Header: React.FC<Props> = ({
  settings,
  onOpenSettings,
  onOpenExport,
  onToggleSidebar,
  onNewChat,
  topology,
  onToggleTopologyView,
  isTopologyViewOpen,
  onBackToVerification
}) => {
  const isDeepseek = settings.provider === 'deepseek';
  const isKeyConfigured = isDeepseek
    ? Boolean(settings.deepseekApiKey && settings.deepseekApiKey.trim().length > 0)
    : Boolean(settings.apiKey && settings.apiKey.trim().length > 0);
  const activeModelLabel = isDeepseek
    ? (settings.deepseekModel === 'deepseek-reasoner' ? 'DeepSeek R1' : 'DeepSeek V3')
    : 'Claude Sonnet';

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#080d1a]/95 border-b border-slate-800/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
      
      {/* Left: Mobile Menu + NetPilot Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Abrir panel de contexto"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="h-full w-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
              <Network size={20} className="text-cyan-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#080d1a]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1 font-sans">
                NetPilot <span className="text-cyan-400 font-mono text-xs font-semibold">AI</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/70 border border-cyan-800/50 text-cyan-300">
                Cisco Copilot
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              Ingeniería de Redes & Exportador Cisco Packet Tracer
            </p>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Toggle Topology Canvas Button */}
        <button
          onClick={onToggleTopologyView}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isTopologyViewOpen
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Ver o esconder mapa de red"
        >
          <Layers size={14} className={isTopologyViewOpen ? 'text-cyan-400' : 'text-slate-400'} />
          <span className="hidden sm:inline">Mapa de Red</span>
          <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">
            {topology.devices.length}
          </span>
        </button>

        {/* API Key Status Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isKeyConfigured
              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/40'
              : 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-900/40 animate-pulse'
          }`}
          title="Configurar claves de IA (Claude / DeepSeek)"
        >
          {isKeyConfigured ? (
            <>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">{activeModelLabel}</span>
              <span className="text-[10px] opacity-75 font-mono">Activo</span>
            </>
          ) : (
            <>
              <Key size={14} className="text-amber-400" />
              <span>{isDeepseek ? 'DeepSeek Key' : 'API Key'}</span>
            </>
          )}
        </button>

        {/* The Big Star: PAYWALL-FREE PACKET TRACER EXPORT BUTTON */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Download size={14} className="stroke-[2.5]" />
          <span className="hidden xs:inline">Exportar .PKT</span>
          <span className="xs:hidden">Exportar</span>
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Nueva conversación / Laboratorio"
        >
          <PlusCircle size={17} />
        </button>

        {/* Verification Portal Return Button */}
        {onBackToVerification && (
          <button
            onClick={onBackToVerification}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            title="Volver a la pantalla de verificación de seguridad"
          >
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Portal</span>
          </button>
        )}

        {/* Settings gear */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Preferencias"
        >
          <Settings size={17} />
        </button>

      </div>
    </header>
  );
};
