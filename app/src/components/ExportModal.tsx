import React, { useState } from 'react';
import { NetworkTopology } from '../types/network';
import { 
  downloadPktFile, 
  downloadLabZipPackage, 
  generatePacketTracerScript,
  generateAddressingTableCsv,
  triggerFileDownload 
} from '../utils/packetTracerExporter';
import { 
  Download, 
  FileCode, 
  Package, 
  Table, 
  Check, 
  Copy, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  FolderArchive
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  topology: NetworkTopology;
}

export const ExportModal: React.FC<Props> = ({ isOpen, onClose, topology }) => {
  const [activeTab, setActiveTab] = useState<'pkt' | 'devices' | 'script' | 'table'>('pkt');
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);

  if (!isOpen) return null;

  const currentDevice = topology.devices[selectedDeviceIndex] || topology.devices[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSingleCfg = (devName: string, config: string) => {
    triggerFileDownload(config, `${devName}_cisco_ios.cfg`, 'text/plain');
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadLabZipPackage(topology);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#FFFFFF] border border-[#E8E8E5] rounded-2xl shadow-soft-xl flex flex-col overflow-hidden text-[#18181B]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFFFF] border-b border-[#E8E8E5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F5F5F3] border border-[#E8E8E5] text-[#18181B] shadow-soft-sm">
              <Download size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#18181B]">
                  Exportar a Cisco Packet Tracer
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                  <ShieldCheck size={13} /> 100% Gratuito · Sin Paywall
                </span>
              </div>
              <p className="text-xs text-[#71717A]">
                Empaqueta la topología lógica, enlaces y comandos Cisco IOS para ejecución directa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#18181B] p-2 rounded-xl hover:bg-[#F5F5F3] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Highlight Banner */}
        <div className="px-6 py-3 bg-[#FAFAF9] border-b border-[#E8E8E5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#52525B]">
            <Sparkles size={15} className="text-[#D97706]" />
            <span>Topología activa: <strong className="text-[#18181B]">{topology.name}</strong></span>
            <span className="text-[#D4D4D8]">•</span>
            <span>{topology.devices.length} dispositivos</span>
            <span className="text-[#D4D4D8]">•</span>
            <span>{topology.links.length} conexiones cableadas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadPktFile(topology)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs shadow-soft-sm transition-all active:scale-95"
            >
              <Download size={14} />
              Descargar .PKT
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-[#18181B] font-medium text-xs transition-all shadow-soft-sm active:scale-95"
            >
              <FolderArchive size={14} className="text-[#71717A]" />
              {isExportingZip ? 'Comprimiendo...' : 'Descargar ZIP Completo'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E8E8E5] px-6 bg-[#FFFFFF]">
          <button
            onClick={() => setActiveTab('pkt')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'pkt'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <FileCode size={15} />
            Archivo .PKT Directo
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'devices'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Terminal size={15} />
            Comandos IOS por Equipo ({topology.devices.length})
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'script'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Layers size={15} />
            Script Packet Tracer (.pts)
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'table'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Table size={15} />
            Tabla de Direccionamiento
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-[#FAFAF9]">
          {/* TAB 1: .PKT Direct */}
          {activeTab === 'pkt' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E8E5] shadow-soft-sm space-y-3">
                  <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                    <FileCode size={16} className="text-[#2563EB]" />
                    Paquete Binario Cisco Packet Tracer (.pkt)
                  </h3>
                  <p className="text-xs text-[#52525B] leading-relaxed">
                    Este archivo empaqueta la topología lógica, las coordenadas de los equipos en el canvas, los enlaces cableados y los scripts de configuración IOS iniciales en un archivo comprimido compatible con Packet Tracer.
                  </p>
                  <div className="space-y-1.5 text-xs text-[#71717A] font-mono bg-[#F5F5F3] p-3 rounded-xl border border-[#E8E8E5]">
                    <div>• Compatibilidad: Cisco Packet Tracer 7.x, 8.x, 9.x</div>
                    <div>• Formato: Contenedor Binario PT5 zlib estructurado</div>
                    <div>• Dispositivos incluidos: {topology.devices.map(d => d.name).join(', ')}</div>
                  </div>
                  <button
                    onClick={() => downloadPktFile(topology)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs shadow-soft-sm transition-all"
                  >
                    <Download size={16} />
                    Descargar Archivo .PKT Ahora
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E8E5] shadow-soft-sm space-y-3">
                  <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                    <Package size={16} className="text-[#16A34A]" />
                    Paquete Completo de Laboratorio (.ZIP)
                  </h3>
                  <p className="text-xs text-[#52525B] leading-relaxed">
                    Si prefieres máxima flexibilidad para tus clases o estudio de CCNA, descarga el archivo comprimido que incluye los scripts individuales por cada router y switch, la guía en texto y la tabla de IPs.
                  </p>
                  <ul className="text-xs text-[#52525B] space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="text-[#16A34A]">✓</span> Archivo <strong>.pkt</strong> de topología
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#16A34A]">✓</span> Archivos <strong>.cfg</strong> individuales para cada equipo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#16A34A]">✓</span> Script maestro de aprovisionamiento rápido
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#16A34A]">✓</span> Tabla de direccionamiento en formato <strong>CSV</strong>
                    </li>
                  </ul>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isExportingZip}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-[#18181B] font-medium text-xs transition-all shadow-soft-sm"
                  >
                    <FolderArchive size={16} className="text-[#71717A]" />
                    {isExportingZip ? 'Generando Paquete...' : 'Descargar Todo en ZIP'}
                  </button>
                </div>
              </div>

              {/* Instructions on how to use */}
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E8E5] shadow-soft-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-2">
                  ¿Cómo usar los archivos en Cisco Packet Tracer?
                </h4>
                <ol className="text-xs text-[#52525B] space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Abre <strong>Cisco Packet Tracer</strong> en tu ordenador.</li>
                  <li>Ve al menú <strong>File &gt; Open</strong> y selecciona el archivo <strong>.pkt</strong> descargado.</li>
                  <li>Si prefieres cargar los comandos manualmente en un laboratorio existente, copia los comandos desde la pestaña <strong>"Comandos IOS por Equipo"</strong> y pégalos en la pestaña <strong>CLI</strong> de cada dispositivo.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: Device Configs */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#E8E8E5]">
                {topology.devices.map((dev, idx) => (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDeviceIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      selectedDeviceIndex === idx
                        ? 'bg-[#18181B] text-white shadow-soft-sm'
                        : 'bg-[#FFFFFF] border border-[#E8E8E5] text-[#71717A] hover:text-[#18181B] hover:bg-[#F5F5F3]'
                    }`}
                  >
                    <Terminal size={13} />
                    {dev.name} ({dev.model})
                  </button>
                ))}
              </div>

              {currentDevice && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                        {currentDevice.name}
                        <span className="text-xs font-mono text-[#71717A]">({currentDevice.model})</span>
                      </h4>
                      <p className="text-xs text-[#71717A]">
                        Pega estos comandos directamente en el modo privilegiado (CLI) del dispositivo.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(currentDevice.iosConfig, currentDevice.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-xs font-medium text-[#18181B] transition-colors shadow-soft-sm"
                      >
                        {copiedKey === currentDevice.id ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
                        {copiedKey === currentDevice.id ? 'Copiado al portapapeles' : 'Copiar Comandos'}
                      </button>
                      <button
                        onClick={() => handleDownloadSingleCfg(currentDevice.name, currentDevice.iosConfig)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-medium text-white transition-colors shadow-soft-sm"
                      >
                        <Download size={14} />
                        Descargar .cfg
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 rounded-2xl bg-[#18181B] text-[#F4F4F5] text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-soft-sm">
                    {currentDevice.iosConfig || `# Sin comandos configurados`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Script PTS */}
          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#18181B]">
                    Script de Automatización Packet Tracer (.pts)
                  </h4>
                  <p className="text-xs text-[#71717A]">
                    Permite inyectar los comandos mediante el motor de scripting interno de Cisco Packet Tracer.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(generatePacketTracerScript(topology), 'pts')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-xs font-medium text-[#18181B] transition-colors shadow-soft-sm"
                >
                  {copiedKey === 'pts' ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
                  {copiedKey === 'pts' ? 'Copiado' : 'Copiar Script PTS'}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#18181B] text-[#F4F4F5] text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-soft-sm">
                {generatePacketTracerScript(topology)}
              </pre>
            </div>
          )}

          {/* TAB 4: Addressing Table */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#18181B]">
                    Tabla de Direccionamiento IP y Asignación de Interfaces
                  </h4>
                  <p className="text-xs text-[#71717A]">
                    Esquema completo de direccionamiento para verificación de laboratorio.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(generateAddressingTableCsv(topology), 'csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-xs font-medium text-[#18181B] transition-colors shadow-soft-sm"
                >
                  {copiedKey === 'csv' ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
                  {copiedKey === 'csv' ? 'Copiado CSV' : 'Copiar CSV'}
                </button>
              </div>

              <div className="border border-[#E8E8E5] rounded-2xl overflow-hidden bg-[#FFFFFF] shadow-soft-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F3] text-[#52525B] uppercase font-mono text-[10px] tracking-wider border-b border-[#E8E8E5]">
                    <tr>
                      <th className="px-4 py-3">Dispositivo</th>
                      <th className="px-4 py-3">Interfaz</th>
                      <th className="px-4 py-3">Dirección IP</th>
                      <th className="px-4 py-3">Máscara de Subred</th>
                      <th className="px-4 py-3">VLAN</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8E5] font-mono text-[#18181B]">
                    {topology.devices.flatMap(dev =>
                      dev.interfaces.map((iface, iIdx) => (
                        <tr key={`${dev.id}-${iIdx}`} className="hover:bg-[#FAFAF9] transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-[#18181B]">{dev.name}</td>
                          <td className="px-4 py-2.5 text-[#2563EB]">{iface.name}</td>
                          <td className="px-4 py-2.5">{iface.ipAddress || '—'}</td>
                          <td className="px-4 py-2.5 text-[#71717A]">{iface.subnetMask || '—'}</td>
                          <td className="px-4 py-2.5 text-[#7C3AED]">{iface.vlan ? `VLAN ${iface.vlan}` : '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                              {iface.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#FFFFFF] border-t border-[#E8E8E5] flex items-center justify-between text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            <span>Generado localmente en tu navegador sin enviar datos a servidores externos.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EAEAE8] border border-[#E8E8E5] text-[#18181B] font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
