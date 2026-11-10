import React, { useState } from 'react';
import { ApiSettings, AiProvider } from '../types/network';
import { 
  Key, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Cpu, 
  Server, 
  Bot, 
  Zap
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onSaveSettings: (settings: ApiSettings) => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSaveSettings }) => {
  const [provider, setProvider] = useState<AiProvider>(settings.provider || 'anthropic');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState(settings.model || 'claude-3-5-sonnet-20241022');
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || 'https://api.anthropic.com/v1/messages');
  
  // DeepSeek state
  const [deepseekApiKey, setDeepseekApiKey] = useState(settings.deepseekApiKey || '');
  const [deepseekModel, setDeepseekModel] = useState(settings.deepseekModel || 'deepseek-chat');
  const [deepseekBaseUrl, setDeepseekBaseUrl] = useState(settings.deepseekBaseUrl || 'https://api.deepseek.com');

  const [showKey, setShowKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      provider,
      apiKey: apiKey.trim(),
      model,
      baseUrl: baseUrl.trim(),
      deepseekApiKey: deepseekApiKey.trim(),
      deepseekModel,
      deepseekBaseUrl: deepseekBaseUrl.trim(),
    });
    onClose();
  };

  const handleClearKey = (target: 'anthropic' | 'deepseek') => {
    if (target === 'anthropic') {
      setApiKey('');
      onSaveSettings({ ...settings, apiKey: '' });
    } else {
      setDeepseekApiKey('');
      onSaveSettings({ ...settings, deepseekApiKey: '' });
    }
  };

  const testConnection = async () => {
    setTestingStatus('testing');

    if (provider === 'deepseek') {
      if (!deepseekApiKey.trim()) {
        setTestingStatus('error');
        setTestMessage('Por favor introduce tu API Key de DeepSeek antes de probar.');
        return;
      }

      setTestMessage('Conectando con la API de DeepSeek...');
      try {
        let url = deepseekBaseUrl.trim() || 'https://api.deepseek.com';
        if (url.endsWith('/')) url = url.slice(0, -1);
        const endpoint = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: deepseekModel || 'deepseek-chat',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 10,
          })
        });

        if (response.ok) {
          setTestingStatus('success');
          setTestMessage(`¡Conexión exitosa! El modelo de DeepSeek (${deepseekModel}) responde correctamente.`);
        } else {
          const errData = await response.json().catch(() => ({}));
          setTestingStatus('error');
          setTestMessage(errData?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err: any) {
        setTestingStatus('error');
        setTestMessage(`Error de conexión / CORS: ${err.message}.`);
      }
    } else {
      // Anthropic
      if (!apiKey.trim()) {
        setTestingStatus('error');
        setTestMessage('Por favor introduce tu API Key de Anthropic antes de probar.');
        return;
      }

      setTestMessage('Conectando con la API de Anthropic...');
      try {
        const response = await fetch(baseUrl || 'https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: 15,
            messages: [{ role: 'user', content: 'ping' }]
          })
        });

        if (response.ok) {
          setTestingStatus('success');
          setTestMessage('¡Conexión exitosa! La clave de Claude Sonnet es válida y responde correctamente.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          setTestingStatus('error');
          setTestMessage(errorData?.error?.message || `Error HTTP ${response.status}. Revisa si tu clave tiene saldo o formato correcto.`);
        }
      } catch (err: any) {
        setTestingStatus('error');
        setTestMessage(`Error de red / CORS: ${err.message}.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FFFFFF] border border-[#E8E8E5] rounded-2xl shadow-soft-xl overflow-hidden text-[#18181B] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFFFF] border-b border-[#E8E8E5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#F5F5F3] border border-[#E8E8E5] text-[#18181B] shadow-soft-sm">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#18181B]">Configuración de Proveedor & API Keys</h2>
              <p className="text-xs text-[#71717A]">Almacenadas 100% de forma local en tu navegador (localStorage)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#18181B] p-1.5 rounded-lg hover:bg-[#F5F5F3]">✕</button>
        </div>

        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-2 p-2 bg-[#F5F5F3] border-b border-[#E8E8E5] gap-2">
          <button
            type="button"
            onClick={() => {
              setProvider('anthropic');
              setTestingStatus('idle');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              provider === 'anthropic'
                ? 'bg-[#18181B] text-white shadow-soft-sm'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#EAEAE8]'
            }`}
          >
            <Bot size={15} />
            Anthropic (Claude Sonnet)
          </button>
          
          <button
            type="button"
            onClick={() => {
              setProvider('deepseek');
              setTestingStatus('idle');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              provider === 'deepseek'
                ? 'bg-[#18181B] text-white shadow-soft-sm'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#EAEAE8]'
            }`}
          >
            <Zap size={15} className="text-[#D97706]" />
            DeepSeek (V3 & R1)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1 bg-[#FFFFFF]">
          
          {/* Security notice */}
          <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-[#16A34A] shrink-0 mt-0.5" />
            <div className="text-[#15803D] leading-relaxed text-[11px]">
              <strong>Almacenamiento Local Seguro:</strong> Tus claves de Anthropic y DeepSeek residen exclusivamente en el <code>localStorage</code> de este dispositivo y viajan encriptadas directo al proveedor seleccionado.
            </div>
          </div>

          {/* TAB 1: Anthropic Form */}
          {provider === 'anthropic' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#18181B] flex items-center gap-1.5">
                    Anthropic API Key (Claude)
                  </label>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => handleClearKey('anthropic')}
                      className="text-[10px] text-[#DC2626] hover:underline"
                    >
                      Eliminar clave
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full pl-3 pr-20 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D4D4D8] focus:border-[#18181B] focus:outline-none text-[#18181B] font-mono text-xs placeholder-[#A1A1AA] shadow-soft-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 text-[#71717A] hover:text-[#18181B] p-1"
                    title={showKey ? "Ocultar" : "Mostrar"}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-[#71717A]">
                  Obtén tu clave en <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-[#2563EB] underline">console.anthropic.com</a>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Cpu size={14} className="text-[#71717A]" />
                  Modelo de Claude
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D4D4D8] focus:border-[#18181B] focus:outline-none text-[#18181B] text-xs shadow-soft-sm"
                >
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recomendado para Cisco)</option>
                  <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Razonamiento híbrido)</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Rápido y ligero)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Server size={14} className="text-[#71717A]" />
                  URL Base Anthropic
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.anthropic.com/v1/messages"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#D4D4D8] text-[#52525B] font-mono text-[11px] shadow-soft-sm"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DeepSeek Form */}
          {provider === 'deepseek' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#18181B] flex items-center gap-1.5">
                    <Zap size={14} className="text-[#D97706]" />
                    DeepSeek API Key
                  </label>
                  {deepseekApiKey && (
                    <button
                      type="button"
                      onClick={() => handleClearKey('deepseek')}
                      className="text-[10px] text-[#DC2626] hover:underline"
                    >
                      Eliminar clave
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showDeepseekKey ? 'text' : 'password'}
                    value={deepseekApiKey}
                    onChange={(e) => setDeepseekApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full pl-3 pr-20 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D4D4D8] focus:border-[#18181B] focus:outline-none text-[#18181B] font-mono text-xs placeholder-[#A1A1AA] shadow-soft-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                    className="absolute right-2.5 text-[#71717A] hover:text-[#18181B] p-1"
                    title={showDeepseekKey ? "Ocultar" : "Mostrar"}
                  >
                    {showDeepseekKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-[#71717A]">
                  Obtén tu clave de DeepSeek en <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-[#2563EB] underline">platform.deepseek.com/api_keys</a>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Cpu size={14} className="text-[#71717A]" />
                  Modelo DeepSeek
                </label>
                <select
                  value={deepseekModel}
                  onChange={(e) => setDeepseekModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D4D4D8] focus:border-[#18181B] focus:outline-none text-[#18181B] text-xs shadow-soft-sm"
                >
                  <option value="deepseek-chat">DeepSeek-V3 (deepseek-chat) - Velocidad y programación</option>
                  <option value="deepseek-reasoner">DeepSeek-R1 (deepseek-reasoner) - Razonamiento profundo para topologías</option>
                </select>
                <p className="text-[10px] text-[#71717A]">
                  <strong>DeepSeek-R1</strong> expone su cadena de pensamiento completa explicando el diagnóstico de enrutamiento y comandos Cisco IOS.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Server size={14} className="text-[#71717A]" />
                  Endpoint API DeepSeek
                </label>
                <input
                  type="text"
                  value={deepseekBaseUrl}
                  onChange={(e) => setDeepseekBaseUrl(e.target.value)}
                  placeholder="https://api.deepseek.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#D4D4D8] text-[#52525B] font-mono text-[11px] shadow-soft-sm"
                />
              </div>
            </div>
          )}

          {/* Test connection results */}
          {testingStatus !== 'idle' && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 ${
              testingStatus === 'testing' ? 'bg-[#F4F4F5] border-[#E4E4E7] text-[#52525B]' :
              testingStatus === 'success' ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]' :
              'bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]'
            }`}>
              {testingStatus === 'testing' ? <RefreshCw size={15} className="animate-spin mt-0.5 shrink-0" /> :
               testingStatus === 'success' ? <CheckCircle2 size={15} className="shrink-0 text-[#16A34A] mt-0.5" /> :
               <AlertCircle size={15} className="shrink-0 text-[#DC2626] mt-0.5" />}
              <span className="text-[11px] leading-relaxed">{testMessage}</span>
            </div>
          )}

          {/* Test connection action */}
          <div>
            <button
              type="button"
              onClick={testConnection}
              disabled={testingStatus === 'testing'}
              className="w-full py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F5F3] border border-[#E8E8E5] text-[#18181B] font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-soft-sm"
            >
              <RefreshCw size={14} className={testingStatus === 'testing' ? 'animate-spin' : ''} />
              Probar Conexión con {provider === 'deepseek' ? 'DeepSeek' : 'Anthropic'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FFFFFF] border-t border-[#E8E8E5] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EAEAE8] border border-[#E8E8E5] text-[#18181B] font-medium text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs shadow-soft-sm transition-all"
          >
            Guardar Configuración
          </button>
        </div>

      </div>
    </div>
  );
};
