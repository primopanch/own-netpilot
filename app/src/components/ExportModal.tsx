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
  FolderArchive,
  ExternalLink
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1220] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header with Free / No-Paywall badge */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0d182e] via-[#0f172a] to-[#0d182e] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Download size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Exportar a Cisco Packet Tracer
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-sm">
                  <ShieldCheck size={13} /> 100% Gratuito · Sin Paywall
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Empaqueta la topología lógica, enlaces y comandos Cisco IOS para ejecución directa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Highlight Banner */}
        <div className="px-6 py-3 bg-cyan-950/20 border-b border-cyan-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-cyan-200">
            <Sparkles size={15} className="text-cyan-400" />
            <span>Topología activa: <strong className="text-white">{topology.name}</strong></span>
            <span className="text-cyan-600">•</span>
            <span>{topology.devices.length} dispositivos</span>
            <span className="text-cyan-600">•</span>
            <span>{topology.links.length} conexiones cableadas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadPktFile(topology)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Download size={14} />
              Descargar .PKT
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs transition-all active:scale-95"
            >
              <FolderArchive size={14} className="text-cyan-400" />
              {isExportingZip ? 'Comprimiendo...' : 'Descargar ZIP Completo'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-[#090d16]">
          <button
            onClick={() => setActiveTab('pkt')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'pkt'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode size={15} />
            Archivo .PKT Directo
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'devices'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={15} />
            Comandos IOS por Equipo ({topology.devices.length})
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'script'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={15} />
            Script Packet Tracer (.pts)
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'table'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table size={15} />
            Tabla de Direccionamiento
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* TAB 1: .PKT Direct */}
          {activeTab === 'pkt' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode size={16} className="text-cyan-400" />
                    Paquete Binario Cisco Packet Tracer (.pkt)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Este archivo empaqueta la topología lógica, las coordenadas de los equipos en el canvas, los enlaces cableados y los scripts de configuración IOS iniciales en un archivo comprimido zlib compatible con Packet Tracer.
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono bg-black/40 p-3 rounded-lg border border-slate-800/80">
                    <div>• Compatibilidad: Cisco Packet Tracer 7.x, 8.x, 9.x</div>
                    <div>• Formato: Contenedor Binario PT5 zlib estructurado</div>
                    <div>• Dispositivos incluidos: {topology.devices.map(d => d.name).join(', ')}</div>
                  </div>
                  <button
                    onClick={() => downloadPktFile(topology)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    <Download size={18} />
                    Descargar Archivo .PKT Ahora
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package size={16} className="text-emerald-400" />
                    Paquete Completo de Laboratorio (.ZIP)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Si prefieres máxima flexibilidad para tus clases o estudio de CCNA, descarga el archivo comprimido que incluye los scripts individuales por cada router y switch, la guía en texto y la tabla de IPs.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Archivo <strong>.pkt</strong> de topología
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Archivos <strong>.cfg</strong> individuales para cada router y switch
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Script maestro de aprovisionamiento rápido
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Tabla de direccionamiento en formato <strong>CSV</strong>
                    </li>
                  </ul>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isExportingZip}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm transition-all"
                  >
                    <FolderArchive size={18} className="text-cyan-400" />
                    {isExportingZip ? 'Generando Paquete...' : 'Descargar Todo en ZIP'}
                  </button>
                </div>
              </div>

              {/* Instructions on how to use */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
                  ¿Cómo usar los archivos en Cisco Packet Tracer?
                </h4>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
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
              {/* Device Selector Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
                {topology.devices.map((dev, idx) => (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDeviceIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedDeviceIndex === idx
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
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
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {currentDevice.name}
                        <span className="text-xs font-mono text-cyan-400">({currentDevice.model})</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Pega estos comandos directamente en el modo privilegiado (CLI) del dispositivo.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(currentDevice.iosConfig, currentDevice.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                      >
                        {copiedKey === currentDevice.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {copiedKey === currentDevice.id ? 'Copiado al portapapeles' : 'Copiar Comandos'}
                      </button>
                      <button
                        onClick={() => handleDownloadSingleCfg(currentDevice.name, currentDevice.iosConfig)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 text-xs font-medium text-cyan-300 transition-colors"
                      >
                        <Download size={14} />
                        Descargar .cfg
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 rounded-xl bg-black/80 border border-slate-800 text-xs font-mono text-emerald-400 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed terminal-scroll">
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
                  <h4 className="text-sm font-bold text-white">
                    Script de Automatización Packet Tracer (.pts)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Permite inyectar los comandos mediante el motor de scripting interno de Cisco Packet Tracer.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(generatePacketTracerScript(topology), 'pts')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  {copiedKey === 'pts' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedKey === 'pts' ? 'Copiado' : 'Copiar Script PTS'}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-black/80 border border-slate-800 text-xs font-mono text-cyan-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed terminal-scroll">
                {generatePacketTracerScript(topology)}
              </pre>
            </div>
          )}

          {/* TAB 4: Addressing Table */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Tabla de Direccionamiento IP y Asignación de Interfaces
                  </h4>
                  <p className="text-xs text-slate-400">
                    Esquema completo de direccionamiento para verificación de laboratorio.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(generateAddressingTableCsv(topology), 'csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  {copiedKey === 'csv' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedKey === 'csv' ? 'Copiado CSV' : 'Copiar CSV'}
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-cyan-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Dispositivo</th>
                      <th className="px-4 py-3">Interfaz</th>
                      <th className="px-4 py-3">Dirección IP</th>
                      <th className="px-4 py-3">Máscara de Subred</th>
                      <th className="px-4 py-3">VLAN</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {topology.devices.flatMap(dev =>
                      dev.interfaces.map((iface, iIdx) => (
                        <tr key={`${dev.id}-${iIdx}`} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-white">{dev.name}</td>
                          <td className="px-4 py-2.5 text-cyan-300">{iface.name}</td>
                          <td className="px-4 py-2.5">{iface.ipAddress || '—'}</td>
                          <td className="px-4 py-2.5 text-slate-400">{iface.subnetMask || '—'}</td>
                          <td className="px-4 py-2.5 text-purple-400">{iface.vlan ? `VLAN ${iface.vlan}` : '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
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
        <div className="px-6 py-3.5 bg-[#090d16] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Generado localmente en tu navegador sin enviar datos a servidores externos.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
