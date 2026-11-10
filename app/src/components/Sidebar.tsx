import React, { useRef } from 'react';
import { ContextFile, NetworkTopology } from '../types/network';
import { 
  UploadCloud, 
  Trash2, 
  Layers, 
  Sparkles, 
  Cpu, 
  HardDrive, 
  Monitor, 
  FileCode,
  Network
} from 'lucide-react';

interface Props {
  contextFiles: ContextFile[];
  onAddFiles: (files: ContextFile[]) => void;
  onRemoveFile: (id: string) => void;
  topology: NetworkTopology;
  onLoadTemplate: (templateName: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  contextFiles,
  onAddFiles,
  onRemoveFile,
  topology,
  onLoadTemplate,
  isOpen,
  onCloseMobile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = (fileList: File[]) => {
    const newContextFiles: ContextFile[] = [];

    fileList.forEach(file => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      if (isImg) {
        reader.onload = () => {
          newContextFiles.push({
            id: 'file_' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            content: `[Diagrama de red: ${file.name}]`,
            isImage: true,
            dataUrl: reader.result as string,
            uploadedAt: new Date().toLocaleTimeString(),
          });
          if (newContextFiles.length === fileList.length) {
            onAddFiles(newContextFiles);
          }
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          newContextFiles.push({
            id: 'file_' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            content: (reader.result as string) || '',
            isImage: false,
            uploadedAt: new Date().toLocaleTimeString(),
          });
          if (newContextFiles.length === fileList.length) {
            onAddFiles(newContextFiles);
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const labTemplates = [
    {
      id: 'vlan',
      title: 'Inter-VLAN (Router-on-a-Stick)',
      desc: 'VLANs 10, 20 & 99 con subinterfaces 802.1Q en Cisco 2911 y trunking.',
      badge: 'CCNA Core'
    },
    {
      id: 'ospf',
      title: 'OSPFv2 Multi-Área Backbone',
      desc: 'Enlace WAN punto a punto con máscaras wildcard /30 y áreas OSPF.',
      badge: 'Routing'
    },
    {
      id: 'dhcp',
      title: 'Servidor DHCP & Exclusiones',
      desc: 'Pool dinámico en router con exclusión de IPs estáticas y default-router.',
      badge: 'Services'
    },
    {
      id: 'nat',
      title: 'NAT con Sobrecarga (PAT)',
      desc: 'Traducción de direcciones con ACL estándar y salida WAN hacia Internet.',
      badge: 'Gateway'
    },
    {
      id: 'etherchannel',
      title: 'EtherChannel LACP 802.3ad',
      desc: 'Agrupación de enlaces FastEthernet para redundancia y mayor ancho de banda.',
      badge: 'Switching'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-80 bg-[#F5F5F3] border-r border-[#E8E8E5] flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F5F5F3]">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-[#18181B]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#18181B]">
              Panel de Contexto & Topología
            </h3>
          </div>
          <button 
            onClick={onCloseMobile}
            className="lg:hidden text-[#71717A] hover:text-[#18181B] p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Section 1: Upload Context */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">
                Adjuntar Archivos / Topologías
              </span>
              <span className="text-[10px] text-[#18181B] font-mono font-medium px-1.5 py-0.5 rounded bg-[#EAEAE8]">
                {contextFiles.length} adjuntos
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#D4D4D8] hover:border-[#18181B] bg-[#FFFFFF] rounded-xl p-4 text-center cursor-pointer transition-all shadow-soft-sm group hover:shadow-soft-md"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pkt,.pka,.cfg,.ios,.txt,.json,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud size={22} className="mx-auto text-[#71717A] group-hover:text-[#18181B] transition-colors" />
              <p className="mt-2 text-xs font-medium text-[#18181B]">
                Arrastra diagramas o archivos
              </p>
              <p className="text-[10px] text-[#71717A] mt-0.5">
                .pkt, .cfg, .ios, .txt o imágenes .png/.jpg
              </p>
            </div>

            {/* List of Attached Files */}
            {contextFiles.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {contextFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E8E5] shadow-soft-sm flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {file.isImage ? (
                        <img
                          src={file.dataUrl}
                          alt={file.name}
                          className="h-7 w-7 rounded-lg object-cover border border-[#E8E8E5] shrink-0"
                        />
                      ) : (
                        <div className="p-1.5 rounded-lg bg-[#F5F5F3] text-[#18181B] shrink-0">
                          <FileCode size={14} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#18181B] truncate text-[11px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-[#71717A] font-mono">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveFile(file.id)}
                      className="text-[#A1A1AA] hover:text-[#DC2626] p-1 rounded transition-colors shrink-0"
                      title="Eliminar de contexto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Active Inventory */}
          <div className="space-y-3 pt-2 border-t border-[#E8E8E5]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
                <Network size={14} className="text-[#18181B]" />
                Inventario de Equipos ({topology.devices.length})
              </span>
            </div>

            <div className="space-y-2">
              {topology.devices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E8E5] shadow-soft-sm hover:shadow-soft-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-[#F5F5F3] text-[#18181B]">
                        {dev.type === 'router' ? <Cpu size={13} /> : dev.type === 'switch' ? <HardDrive size={13} /> : <Monitor size={13} />}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-[#18181B]">{dev.name}</span>
                        <span className="text-[10px] text-[#71717A] ml-1.5 font-mono">{dev.model}</span>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                  </div>

                  {/* Device IPs */}
                  <div className="mt-2 pl-6 text-[10px] font-mono text-[#71717A] space-y-0.5">
                    {dev.interfaces.filter(i => i.ipAddress).map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-[#52525B] font-medium">{i.shortName}:</span>
                        <span>{i.ipAddress}</span>
                      </div>
                    ))}
                    {dev.interfaces.filter(i => i.ipAddress).length === 0 && (
                      <div className="text-[#A1A1AA] italic">Capa 2 / Switchport</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Pre-built Cisco Lab Templates */}
          <div className="space-y-3 pt-2 border-t border-[#E8E8E5]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#D97706]" />
                Plantillas de Laboratorio
              </span>
            </div>

            <div className="space-y-2">
              {labTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onLoadTemplate(tpl.id)}
                  className="w-full text-left p-3 rounded-xl bg-[#FFFFFF] hover:bg-[#FAFAF9] border border-[#E8E8E5] hover:border-[#D4D4D8] transition-all group shadow-soft-sm hover:shadow-soft-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#18181B] group-hover:text-[#000000] transition-colors">
                      {tpl.title}
                    </span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-1.5 line-clamp-2 leading-relaxed">
                    {tpl.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 bg-[#F5F5F3] border-t border-[#E8E8E5] text-[11px] text-[#71717A] flex items-center justify-between">
          <span>NetPilot AI Copilot</span>
          <span className="font-mono text-[#18181B] font-medium">v2.4.0-PT</span>
        </div>

      </aside>
    </>
  );
};
