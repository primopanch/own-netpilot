import React from 'react';
import { NetworkTopology } from '../types/network';
import { InteractiveTopology } from './InteractiveTopology';
import { Download, Layers, ShieldCheck, X } from 'lucide-react';
import { downloadPktFile } from '../utils/packetTracerExporter';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0c1220] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Visualizador de Topología de Red</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {topology.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              <Download size={14} />
              Exportar a .pkt
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Full Interactive Canvas */}
        <div className="flex-1 p-4 bg-[#080c14] overflow-hidden">
          <InteractiveTopology topology={topology} compact={false} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Topología sincronizada con el exportador Packet Tracer</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Cerrar Vista
          </button>
        </div>

      </div>
    </div>
  );
};
