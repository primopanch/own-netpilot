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
    <header className="h-16 px-4 sm:px-6 bg-[#FFFFFF] border-b border-[#E8E8E5] shadow-soft-sm flex items-center justify-between z-20 shrink-0">
      
      {/* Left: Mobile Menu + NetPilot Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-[#F5F5F3] border border-[#E8E8E5] text-[#52525B] hover:text-[#18181B] hover:bg-[#EAEAE8] transition-colors shadow-soft-sm"
          title="Abrir panel de contexto"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-[#18181B] text-white shadow-soft-sm">
            <Network size={19} className="text-[#38BDF8]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A] border-2 border-white" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-[#18181B] font-sans">
                NetPilot <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F4F4F5] text-[#52525B] font-mono border border-[#E4E4E7]">AI</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D]">
                Cisco Copilot
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-[#71717A]">
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-soft-sm ${
            isTopologyViewOpen
              ? 'bg-[#18181B] text-white border border-[#18181B]'
              : 'bg-[#FFFFFF] border border-[#E8E8E5] text-[#18181B] hover:bg-[#F5F5F3]'
          }`}
          title="Ver o esconder mapa de red"
        >
          <Layers size={14} className={isTopologyViewOpen ? 'text-white' : 'text-[#71717A]'} />
          <span className="hidden sm:inline">Mapa de Red</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isTopologyViewOpen ? 'bg-[#27272A] text-white' : 'bg-[#F4F4F5] text-[#52525B]'}`}>
            {topology.devices.length}
          </span>
        </button>

        {/* API Key Status Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-soft-sm transition-all ${
            isKeyConfigured
              ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D] hover:bg-[#DCFCE7]/60'
              : 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309] hover:bg-[#FDE68A]/60'
          }`}
          title="Configurar claves de IA (Claude / DeepSeek)"
        >
          {isKeyConfigured ? (
            <>
              <ShieldCheck size={14} className="text-[#16A34A]" />
              <span className="hidden sm:inline">{activeModelLabel}</span>
              <span className="text-[10px] opacity-75 font-mono">Activo</span>
            </>
          ) : (
            <>
              <Key size={14} className="text-[#D97706]" />
              <span>{isDeepseek ? 'DeepSeek Key' : 'API Key'}</span>
            </>
          )}
        </button>

        {/* The Big Star: PAYWALL-FREE PACKET TRACER EXPORT BUTTON */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs shadow-soft-sm active:scale-95 transition-all"
        >
          <Download size={14} className="stroke-[2.5]" />
          <span className="hidden xs:inline">Exportar .PKT</span>
          <span className="xs:hidden">Exportar</span>
        </button>

        {/* Verification Portal Return Button */}
        {onBackToVerification && (
          <button
            onClick={onBackToVerification}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-[11px] text-[#52525B] hover:text-[#18181B] transition-colors shadow-soft-sm"
            title="Volver a la pantalla de verificación de seguridad"
          >
            <ShieldCheck size={13} className="text-[#16A34A]" />
            <span>Portal</span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-[#71717A] hover:text-[#18181B] transition-colors shadow-soft-sm"
          title="Nueva conversación / Laboratorio"
        >
          <PlusCircle size={17} />
        </button>

        {/* Settings gear */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-[#71717A] hover:text-[#18181B] transition-colors shadow-soft-sm"
          title="Preferencias"
        >
          <Settings size={17} />
        </button>

      </div>
    </header>
  );
};
