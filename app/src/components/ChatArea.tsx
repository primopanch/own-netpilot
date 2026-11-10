import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ContextFile, NetworkTopology } from '../types/network';
import { InteractiveTopology } from './InteractiveTopology';
import { 
  Send, 
  Terminal, 
  Copy, 
  Check, 
  Paperclip, 
  Download, 
  Sparkles, 
  Bot, 
  User, 
  FileCode, 
  Network,
  ArrowRight
} from 'lucide-react';
import { triggerFileDownload } from '../utils/packetTracerExporter';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  contextFiles: ContextFile[];
  onOpenContextUpload: () => void;
  onOpenExport: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export const ChatArea: React.FC<Props> = ({
  messages,
  onSendMessage,
  isLoading,
  contextFiles,
  onOpenContextUpload,
  onOpenExport,
  onSelectPrompt
}) => {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadDeviceConfig = (deviceName: string, code: string) => {
    triggerFileDownload(code, `${deviceName}_cisco_ios.cfg`, 'text/plain');
  };

  const quickPrompts = [
    {
      title: 'Inter-VLAN con Router-on-a-Stick',
      prompt: 'Diseña una topología de Router-on-a-Stick con un router Cisco 2911 y switch 2960. Configura VLAN 10 (Ventas) y VLAN 20 (Ingeniería) con subinterfaces 802.1Q y servidores DHCP.',
      tag: 'VLANs / 802.1Q'
    },
    {
      title: 'Enrutamiento OSPFv2 Multi-Área',
      prompt: 'Genera la configuración Cisco IOS paso a paso para conectar 2 routers mediante enlace WAN serial/gigabit usando OSPFv2 en Área 0 con IDs de router y interfaces pasivas.',
      tag: 'OSPFv2'
    },
    {
      title: 'Servidor DHCP & Exclusiones',
      prompt: 'Configura un Router Cisco como servidor DHCP para la red 192.168.10.0/24, excluyendo las primeras 10 IPs para servidores y configurando gateway predeterminado y DNS.',
      tag: 'DHCP'
    },
    {
      title: 'NAT Dinámico con Sobrecarga (PAT)',
      prompt: 'Explica y genera los comandos IOS para configurar PAT (Port Address Translation) en un router con interfaz LAN inside y WAN outside con una ACL para salida a Internet.',
      tag: 'NAT / PAT'
    }
  ];

  // Helper to render markdown text with styled codeblocks
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const header = part.substring(3, firstLineEnd).trim();
        const code = part.substring(firstLineEnd + 1, part.length - 3).trim();

        const devMatch = header.match(/\[([A-Za-z0-9_-]+)\]/) || code.match(/hostname\s+([A-Za-z0-9_-]+)/i);
        const deviceName = devMatch ? devMatch[1] : 'Cisco IOS';

        const blockId = `${msgId}-${idx}`;

        return (
          <div key={idx} className="dark-contrast my-3 rounded-xl overflow-hidden border border-[#27272A] bg-[#18181B] shadow-soft-md text-white">
            <div className="px-4 py-2 bg-[#27272A] border-b border-[#3F3F46] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-[#38BDF8]" />
                <span className="text-xs font-mono font-bold text-white">
                  {deviceName}
                </span>
                <span className="text-[10px] text-[#A1A1AA] font-mono">Cisco IOS CLI</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(code, blockId)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#3F3F46] hover:bg-[#52525B] text-[11px] text-white transition-colors"
                >
                  {copiedIndex === blockId ? <Check size={12} className="text-[#4ADE80]" /> : <Copy size={12} />}
                  {copiedIndex === blockId ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadDeviceConfig(deviceName, code)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0F172A] hover:bg-[#1E293B] text-[11px] text-[#38BDF8] border border-[#334155] transition-colors"
                  title="Descargar archivo de configuración"
                >
                  <Download size={12} />
                  .cfg
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs font-mono text-[#F4F4F5] overflow-x-auto whitespace-pre-wrap leading-relaxed selection:bg-[#38BDF8]/30">
              {code}
            </pre>
          </div>
        );
      }

      // Simple paragraphs & headers
      return (
        <div key={idx} className="space-y-2 leading-relaxed text-sm text-[#27272A]">
          {part.split('\n\n').map((paragraph, pIdx) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('### ')) {
              return <h3 key={pIdx} className="text-base font-bold text-[#18181B] mt-3 mb-1">{trimmed.replace('### ', '')}</h3>;
            }
            if (trimmed.startsWith('#### ')) {
              return <h4 key={pIdx} className="text-sm font-semibold text-[#18181B] mt-2 mb-1">{trimmed.replace('#### ', '')}</h4>;
            }
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote key={pIdx} className="p-3 my-2 rounded-xl bg-[#F4F4F5] border-l-4 border-[#18181B] text-xs text-[#52525B]">
                  {trimmed.replace('> ', '')}
                </blockquote>
              );
            }

            return <p key={pIdx} className="whitespace-pre-wrap">{trimmed}</p>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9F9F8] relative overflow-hidden">
      
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* Welcome State when no messages */}
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto py-8 space-y-8 animate-in fade-in duration-300">
            
            {/* Hero banner */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8E8E5] text-[#18181B] text-xs font-medium shadow-soft-sm mb-2">
                <Sparkles size={14} className="text-[#D97706]" />
                Copiloto Inteligente de Redes Cisco
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
                Diseña, Configura y Exporta a <br />
                <span className="text-[#18181B]">
                  Cisco Packet Tracer Sin Paywalls
                </span>
              </h2>
              <p className="text-[#71717A] text-sm max-w-xl mx-auto leading-relaxed">
                Describe tus requerimientos de red, subredes o protocolos. NetPilot generará los comandos IOS paso a paso, dibujará la topología y te permitirá descargar directamente el archivo <strong>.pkt</strong>.
              </p>
            </div>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt(item.prompt)}
                  className="p-4 rounded-xl bg-[#FFFFFF] hover:bg-[#FAFAF9] border border-[#E8E8E5] hover:border-[#D4D4D8] text-left transition-all shadow-soft-sm hover:shadow-soft-md group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
                        {item.tag}
                      </span>
                      <ArrowRight size={14} className="text-[#A1A1AA] group-hover:text-[#18181B] group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-xs font-semibold text-[#18181B] group-hover:text-[#000000] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#71717A] mt-1 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </div>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Messages List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 sm:gap-4 max-w-3xl mx-auto ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="dark-contrast h-8 w-8 rounded-xl bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-soft-sm mt-1">
                <Bot size={17} />
              </div>
            )}

            <div className={`space-y-3 min-w-0 max-w-[88%] sm:max-w-[82%] ${
              msg.role === 'user' ? 'order-first' : ''
            }`}>
              
              {/* Message Bubble */}
              <div className={`p-4 sm:p-5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[#18181B] text-white rounded-tr-none shadow-soft-sm'
                  : 'bg-[#FFFFFF] border border-[#E8E8E5] rounded-tl-none shadow-soft-sm'
              }`}>
                {/* User attached files preview */}
                {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {msg.attachedFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#27272A] text-[11px] font-mono text-[#E4E4E7]">
                        <FileCode size={12} />
                        <span className="truncate max-w-[140px]">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Body */}
                {msg.role === 'assistant' ? (
                  renderMessageContent(msg.content, msg.id)
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>

              {/* Embedded Visual Topology Preview Card if generated in message */}
              {msg.topology && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
                      <Network size={14} />
                      Topología Generada para Packet Tracer
                    </span>
                    <button
                      onClick={onOpenExport}
                      className="flex items-center gap-1 text-xs font-semibold text-[#18181B] hover:text-[#52525B] transition-colors"
                    >
                      <Download size={13} />
                      Exportar a .pkt
                    </button>
                  </div>
                  <InteractiveTopology topology={msg.topology} compact={true} />
                </div>
              )}

              {/* Timestamp */}
              <div className={`text-[10px] text-[#A1A1AA] font-mono px-1 ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {msg.timestamp}
              </div>

            </div>

            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-xl bg-[#FFFFFF] border border-[#E8E8E5] shadow-soft-sm flex items-center justify-center shrink-0 text-[#18181B] mt-1">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="dark-contrast h-8 w-8 rounded-xl bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-soft-sm mt-1">
              <Bot size={17} />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-[#FFFFFF] border border-[#E8E8E5] shadow-soft-sm text-xs text-[#52525B] flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-[#18181B] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#18181B] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#18181B] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Analizando requerimientos de red y generando comandos Cisco IOS...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Area */}
      <div className="p-4 bg-[#FFFFFF] border-t border-[#E8E8E5] shadow-soft-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
          
          {/* Active Context Files Pill Notification */}
          {contextFiles.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F5F3] border border-[#E8E8E5] text-xs text-[#18181B]">
              <Paperclip size={13} className="text-[#71717A]" />
              <span>{contextFiles.length} archivo(s) adjunto(s) en contexto:</span>
              <span className="font-mono text-[11px] text-[#71717A] truncate max-w-xs">
                {contextFiles.map(f => f.name).join(', ')}
              </span>
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-[#FFFFFF] border border-[#D4D4D8] focus-within:border-[#18181B] rounded-2xl p-2 transition-all shadow-soft-sm">
            
            {/* Attachment Button */}
            <button
              type="button"
              onClick={onOpenContextUpload}
              className="p-2 rounded-xl text-[#71717A] hover:text-[#18181B] hover:bg-[#F5F5F3] transition-colors shrink-0"
              title="Adjuntar archivo o topología"
            >
              <Paperclip size={18} />
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Describe tu ejercicio de Packet Tracer o pega un requerimiento de red..."
              className="flex-1 bg-transparent text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none resize-none py-1.5 max-h-40 leading-relaxed font-sans"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium transition-all shadow-soft-sm shrink-0"
              title="Enviar mensaje (Enter)"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] px-2 font-mono">
            <span>Shift + Enter para nueva línea</span>
            <span>NetPilot Cisco IOS Engine</span>
          </div>
        </form>
      </div>

    </div>
  );
};
