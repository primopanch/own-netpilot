import React, { useMemo, useState } from 'react';
import { ContextFile, NetworkDevice, NetworkTopology } from '../types/network';
import { buildPktBinary, downloadLabZipPackage, parseCiscoConfig, parsePacketTracerFile, triggerFileDownload } from '../utils/packetTracerExporter';
import { FileCode, FileImage, FolderOpen, Save, Sparkles, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  files: ContextFile[];
  topology: NetworkTopology;
  onTopologyChange: (topology: NetworkTopology) => void;
  onAddFiles: (files: ContextFile[]) => void;
}

export const PacketTracerWorkspaceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  files,
  topology,
  onTopologyChange,
  onAddFiles,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(files[0]?.id || null);
  const [editedConfig, setEditedConfig] = useState(files[0]?.content || '');
  const [notice, setNotice] = useState('');

  const selectedFile = useMemo(() => files.find(file => file.id === selectedId), [files, selectedId]);
  const selectedDevice = topology.devices.find(device => device.name === selectedFile?.name.replace(/\.[^.]+$/, ''));

  if (!isOpen) return null;

  const selectFile = (file: ContextFile) => {
    setSelectedId(file.id);
    setEditedConfig(file.content);
    setNotice('');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.pka')) {
        setNotice('Los archivos .pka nativos de Cisco son actividades propietarias. Puedes importar su captura como imagen o exportar una topología editable desde NetPilot.');
        return;
      }
      if (lowerName.endsWith('.pkt')) {
        const arrayBuffer = await file.arrayBuffer();
        const imported = parsePacketTracerFile(arrayBuffer);
        onTopologyChange(imported);
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        bytes.forEach(byte => { binary += String.fromCharCode(byte); });
        onAddFiles([{
          id: `workspace_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/x-pkt',
          content: `[Topología Packet Tracer importada: ${file.name}]`,
          isImage: false,
          dataUrl: `data:application/x-pkt;base64,${btoa(binary)}`,
          uploadedAt: new Date().toLocaleTimeString(),
        }]);
        setNotice(`Topología importada: ${imported.devices.length} dispositivos y ${imported.links.length} enlaces.`);
      } else {
        const isImage = file.type.startsWith('image/');
        const dataUrl = isImage ? await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
          reader.readAsDataURL(file);
        }) : undefined;
        const text = isImage ? `[Diagrama de red: ${file.name}]` : await file.text();
        const contextFile: ContextFile = {
          id: `workspace_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content: text,
          isImage,
          dataUrl,
          uploadedAt: new Date().toLocaleTimeString(),
        };
        onAddFiles([contextFile]);
        setSelectedId(contextFile.id);
        setEditedConfig(text);
        if (file.name.match(/\.(cfg|ios|txt)$/i)) {
          const device = parseCiscoConfig(text, file.name);
          onTopologyChange({
            ...topology,
            devices: [...topology.devices.filter(item => item.name !== device.name), device],
          });
        }
        setNotice(isImage
          ? `${file.name} añadido. El puente de visión lo preparará para DeepSeek.`
          : `${file.name} añadido al espacio de trabajo.`);
      }
    } catch (error: any) {
      setNotice(error.message || 'No se pudo importar el archivo.');
    }
  };

  const saveConfig = () => {
    if (!selectedFile) return;
    const device = selectedDevice || topology.devices.find(item => item.iosConfig === selectedFile.content);
    if (device) {
      onTopologyChange({
        ...topology,
        devices: topology.devices.map(item => item.id === device.id ? { ...item, iosConfig: editedConfig } : item),
      });
    }
    triggerFileDownload(editedConfig, selectedFile.name, selectedFile.type || 'text/plain');
    setNotice(`Cambios guardados y descargados como ${selectedFile.name}.`);
  };

  const exportTopology = () => {
    const name = topology.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '_') || 'netpilot_lab';
    triggerFileDownload(buildPktBinary(topology), `${name}.pkt`, 'application/x-pkt');
    setNotice('Topología editable exportada como archivo .pkt de NetPilot.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#FFFFFF] dark:bg-[#18181B] border border-[#E8E8E5] dark:border-[#3F3F46] rounded-2xl shadow-soft-xl overflow-hidden flex flex-col text-[#18181B] dark:text-[#F4F4F5]">
        <div className="px-5 py-4 border-b border-[#E8E8E5] dark:border-[#3F3F46] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#38BDF8]" />
              <h2 className="font-bold">Laboratorio de archivos Cisco</h2>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
              Importa, inspecciona, edita y exporta configuraciones y topologías.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#71717A] hover:bg-[#F5F5F3] dark:hover:bg-[#27272A]" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-[#E8E8E5] dark:border-[#3F3F46] flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#18181B] text-white text-xs font-medium cursor-pointer">
            <FolderOpen size={14} /> Importar .pkt, .cfg o imagen
            <input type="file" accept=".pkt,.pka,.cfg,.ios,.txt,image/png,image/jpeg,image/webp" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={exportTopology} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E8E5] dark:border-[#3F3F46] text-xs font-medium">
            <Save size={14} /> Exportar .pkt editable
          </button>
          <button onClick={() => downloadLabZipPackage(topology)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E8E5] dark:border-[#3F3F46] text-xs font-medium">
            Exportar laboratorio ZIP
          </button>
          {notice && <span className="text-xs text-[#15803D] self-center">{notice}</span>}
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="border-r border-[#E8E8E5] dark:border-[#3F3F46] p-3 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] mb-2">Archivos del proyecto</p>
            {files.length === 0 && <p className="text-xs text-[#71717A]">Todavía no hay archivos importados.</p>}
            <div className="space-y-1">
              {files.map(file => (
                <button key={file.id} onClick={() => selectFile(file)} className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${selectedId === file.id ? 'bg-[#F4F4F5] dark:bg-[#27272A]' : 'hover:bg-[#FAFAF9] dark:hover:bg-[#202023]'}`}>
                  {file.isImage ? <FileImage size={14} /> : <FileCode size={14} />}
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="p-4 overflow-y-auto">
            {selectedFile?.isImage && selectedFile.dataUrl ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Imagen de referencia</h3>
                <img src={selectedFile.dataUrl} alt={selectedFile.name} className="max-h-[55vh] max-w-full rounded-xl border border-[#E8E8E5] dark:border-[#3F3F46] object-contain" />
                <p className="text-xs text-[#71717A]">Al enviar esta imagen al chat, NetPilot usará el puente de visión configurado para convertirla en una especificación que DeepSeek pueda interpretar.</p>
              </div>
            ) : selectedFile ? (
              <div className="h-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{selectedFile.name}</h3>
                  {selectedDevice && <span className="text-xs text-[#71717A]">Editando {selectedDevice.name}</span>}
                </div>
                <textarea value={editedConfig} onChange={event => setEditedConfig(event.target.value)} className="flex-1 min-h-[360px] w-full rounded-xl border border-[#D4D4D8] dark:border-[#3F3F46] bg-[#FAFAF9] dark:bg-[#111113] p-4 font-mono text-xs focus:outline-none focus:border-[#38BDF8]" spellCheck={false} />
                <button onClick={saveConfig} className="self-end inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181B] text-white text-xs font-medium">
                  <Save size={14} /> Guardar configuración
                </button>
              </div>
            ) : (
              <div className="h-full min-h-[360px] flex items-center justify-center text-sm text-[#71717A]">
                Selecciona un archivo para editarlo o importa uno nuevo.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
