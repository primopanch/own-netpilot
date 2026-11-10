import React from 'react';
import { NetworkTopology } from '../types/network';
import { InteractiveTopology } from './InteractiveTopology';
import { Download, Layers, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  topology: NetworkTopology;
  onOpenExport: () => void;
}

export const TopologyViewerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  topology,
  onOpenExport
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#FFFFFF] border border-[#E8E8E5] rounded-2xl shadow-soft-xl flex flex-col overflow-hidden text-[#18181B]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFFFF] border-b border-[#E8E8E5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F5F5F3] border border-[#E8E8E5] text-[#18181B] shadow-soft-sm">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#18181B]">Visualizador de Topología de Red</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#18181B] font-medium border border-[#E4E4E7]">
                  {topology.name}
                </span>
              </div>
              <p className="text-xs text-[#71717A]">
                Haz clic en cualquier router o switch para inspeccionar sus interfaces y comandos IOS.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenExport();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs shadow-soft-sm transition-all"
            >
              <Download size={14} />
              Exportar a .pkt
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#71717A] hover:text-[#18181B] hover:bg-[#F5F5F3] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Full Interactive Canvas */}
        <div className="flex-1 p-4 bg-[#FAFAF9] overflow-hidden">
          <InteractiveTopology topology={topology} compact={false} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FFFFFF] border-t border-[#E8E8E5] flex items-center justify-between text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            <span>Topología sincronizada con el exportador Packet Tracer</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#F5F5F3] hover:bg-[#EAEAE8] border border-[#E8E8E5] text-[#18181B] font-medium transition-colors"
          >
            Cerrar Vista
          </button>
        </div>

      </div>
    </div>
  );
};
