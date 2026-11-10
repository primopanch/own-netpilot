import React, { useState, useEffect } from 'react';
import { 
  NetworkTopology, 
  ChatMessage, 
  ContextFile, 
  ApiSettings 
} from './types/network';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { TopologyViewerModal } from './components/TopologyViewerModal';
import { VerificationPortal } from './components/VerificationPortal';
import { generateDefaultTopology } from './utils/packetTracerExporter';
import { sendToClaude } from './utils/claudeApi';

const DEFAULT_SETTINGS: ApiSettings = {
  provider: 'anthropic',
  apiKey: '',
  model: 'claude-3-5-sonnet-20241022',
  baseUrl: 'https://api.anthropic.com/v1/messages',
  deepseekApiKey: '',
  deepseekModel: 'deepseek-chat',
  deepseekBaseUrl: 'https://api.deepseek.com',
  dangerouslyAllowBrowser: true,
  temperature: 0.2,
  maxTokens: 4000,
};

export function App() {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return window.location.search.includes('app=true') || window.location.hash.includes('app');
  });

  // 1. Settings state with localStorage persistence
  const [settings, setSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('netpilot_anthropic_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Active topology
  const [currentTopology, setCurrentTopology] = useState<NetworkTopology>(() => generateDefaultTopology());

  // 3. Context files
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);

  // 4. Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTopologyModalOpen, setIsTopologyModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 5. Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_msg',
      role: 'assistant',
      content: `### ¡Bienvenido a NetPilot AI Copilot para Cisco Packet Tracer!

Soy tu copiloto de ingeniería de redes especializado en Cisco IOS. Puedo ayudarte a:
- **Diseñar topologías de red** completas (VLANs, Trunking 802.1Q, OSPF, EIGRP, DHCP, NAT).
- **Generar y explicar comandos Cisco IOS** paso a paso de forma didáctica.
- **Adjuntar diagramas o capturas** en el panel lateral para analizarlos con visión artificial.
- **Exportar directamente a Packet Tracer (.pkt / Scripts)** de forma 100% gratuita y sin muros de pago.
- **Soporte Multi-Modelo**: Conecta tu clave de **Anthropic (Claude 3.5 Sonnet)** o **DeepSeek (V3 / R1 Reasoner)** guardadas localmente.

He preparado como ejemplo activo la topología de **Inter-VLAN Routing (Router-on-a-Stick)**. Puedes inspeccionarla en el visor o hacer clic en **"Exportar .PKT"** para probar la descarga directa.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      topology: generateDefaultTopology()
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: ApiSettings) => {
    setSettings(newSettings);
    localStorage.setItem('netpilot_anthropic_settings', JSON.stringify(newSettings));
  };

  // Add context files
  const handleAddFiles = (newFiles: ContextFile[]) => {
    setContextFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setContextFiles(prev => prev.filter(f => f.id !== id));
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFiles: contextFiles.length > 0 ? [...contextFiles] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      
      const response = await sendToClaude({
        userPrompt: text,
        chatHistory: history,
        contextFiles: contextFiles,
        settings: settings
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        topology: response.topology
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (response.topology) {
        setCurrentTopology(response.topology);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `Error al procesar la solicitud: ${err.message || 'Error desconocido'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load predefined template
  const handleLoadTemplate = (templateId: string) => {
    let prompt = '';
    if (templateId === 'vlan') {
      prompt = 'Explica y diseña una solución de Inter-VLAN Routing (Router-on-a-Stick) con VLAN 10 (Ventas) y VLAN 20 (Ingeniería), switch 2960 con enlace troncal y router Cisco 2911 con subinterfaces.';
    } else if (templateId === 'ospf') {
      prompt = 'Diseña un escenario de enrutamiento OSPFv2 Multi-Área con dos routers Cisco 2911 (R1 y R2) conectados por GigabitEthernet punto a punto en Área 0 con interfaces pasivas y IDs fijos.';
    } else if (templateId === 'dhcp') {
      prompt = 'Configura un Router Cisco 2911 como servidor DHCP para la red 192.168.10.0/24, excluyendo las primeras 10 IPs para servidores y asignando gateway y DNS.';
    } else if (templateId === 'nat') {
      prompt = 'Diseña una configuración de NAT con Sobrecarga (PAT) en router Cisco IOS para conectar la red LAN privada 192.168.1.0/24 a Internet a través de la interfaz WAN GigabitEthernet0/0/1.';
    } else if (templateId === 'etherchannel') {
      prompt = 'Genera la configuración de EtherChannel con protocolo LACP (802.3ad) entre dos switches Cisco 2960 agrupando las interfaces FastEthernet0/1 y FastEthernet0/2 en el Port-Channel 1 en modo trunk.';
    }

    if (prompt) {
      handleSendMessage(prompt);
      setIsSidebarOpen(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentTopology(generateDefaultTopology());
  };

  if (!isVerified) {
    return <VerificationPortal onVerified={() => setIsVerified(true)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F9F9F8] text-[#18181B] font-sans">
      
      {/* Top Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
        topology={currentTopology}
        onToggleTopologyView={() => setIsTopologyModalOpen(true)}
        isTopologyViewOpen={isTopologyModalOpen}
        onBackToVerification={() => setIsVerified(false)}
      />

      {/* Main Workspace (Sidebar + Chat Area) */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          contextFiles={contextFiles}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          topology={currentTopology}
          onLoadTemplate={handleLoadTemplate}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          contextFiles={contextFiles}
          onOpenContextUpload={() => setIsSidebarOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onSelectPrompt={handleSendMessage}
        />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        topology={currentTopology}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <TopologyViewerModal
        isOpen={isTopologyModalOpen}
        onClose={() => setIsTopologyModalOpen(false)}
        topology={currentTopology}
        onOpenExport={() => setIsExportOpen(true)}
      />

    </div>
  );
}

export default App;
