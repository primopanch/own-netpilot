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
  Sparkles,
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
        setTestMessage(`Error de conexión / CORS: ${err.message}. Verifica tu conexión o endpoint proxy.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c1220] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configuración de Proveedor & API Keys</h2>
              <p className="text-xs text-slate-400">Almacenadas 100% de forma local en tu navegador (localStorage)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-2 p-2 bg-[#080d19] border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => {
              setProvider('anthropic');
              setTestingStatus('idle');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              provider === 'anthropic'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap size={15} className="text-amber-400" />
            DeepSeek (V3 & R1)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          
          {/* Security notice */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-relaxed text-[11px]">
              <strong>Almacenamiento Local Seguro:</strong> Tus claves de Anthropic y DeepSeek residen exclusivamente en el <code>localStorage</code> de este dispositivo y viajan encriptadas directo al proveedor seleccionado.
            </div>
          </div>

          {/* TAB 1: Anthropic Form */}
          {provider === 'anthropic' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* API Key field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    Anthropic API Key (Claude)
                  </label>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => handleClearKey('anthropic')}
                      className="text-[10px] text-red-400 hover:text-red-300"
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
                    className="w-full pl-3 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-slate-100 font-mono text-xs placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-1"
                    title={showKey ? "Ocultar" : "Mostrar"}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Obtén tu clave en <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-cyan-400 underline">console.anthropic.com</a>
                </p>
              </div>

              {/* Model selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Cpu size={14} className="text-cyan-400" />
                  Modelo de Claude
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100 text-xs"
                >
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recomendado para Cisco)</option>
                  <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Razonamiento híbrido)</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Rápido y ligero)</option>
                </select>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Server size={14} className="text-slate-400" />
                  URL Base Anthropic
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.anthropic.com/v1/messages"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DeepSeek Form */}
          {provider === 'deepseek' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* DeepSeek API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-400" />
                    DeepSeek API Key
                  </label>
                  {deepseekApiKey && (
                    <button
                      type="button"
                      onClick={() => handleClearKey('deepseek')}
                      className="text-[10px] text-red-400 hover:text-red-300"
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
                    className="w-full pl-3 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-100 font-mono text-xs placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-1"
                    title={showDeepseekKey ? "Ocultar" : "Mostrar"}
                  >
                    {showDeepseekKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Obtén tu clave de DeepSeek en <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-indigo-400 underline">platform.deepseek.com/api_keys</a>
                </p>
              </div>

              {/* DeepSeek Model Selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Cpu size={14} className="text-indigo-400" />
                  Modelo DeepSeek
                </label>
                <select
                  value={deepseekModel}
                  onChange={(e) => setDeepseekModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-400 focus:outline-none text-slate-100 text-xs"
                >
                  <option value="deepseek-chat">DeepSeek-V3 (deepseek-chat) - Velocidad y programación</option>
                  <option value="deepseek-reasoner">DeepSeek-R1 (deepseek-reasoner) - Razonamiento profundo para topologías</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  <strong>DeepSeek-R1</strong> expone su cadena de pensamiento completa explicando el diagnóstico de enrutamiento y comandos Cisco IOS.
                </p>
              </div>

              {/* DeepSeek Base URL */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Server size={14} className="text-slate-400" />
                  Endpoint API DeepSeek
                </label>
                <input
                  type="text"
                  value={deepseekBaseUrl}
                  onChange={(e) => setDeepseekBaseUrl(e.target.value)}
                  placeholder="https://api.deepseek.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Test connection results */}
          {testingStatus !== 'idle' && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 ${
              testingStatus === 'testing' ? 'bg-cyan-950/30 border-cyan-800 text-cyan-300' :
              testingStatus === 'success' ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300' :
              'bg-red-950/40 border-red-800 text-red-300'
            }`}>
              {testingStatus === 'testing' ? <RefreshCw size={15} className="animate-spin mt-0.5 shrink-0" /> :
               testingStatus === 'success' ? <CheckCircle2 size={15} className="shrink-0 text-emerald-400 mt-0.5" /> :
               <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />}
              <span className="text-[11px] leading-relaxed">{testMessage}</span>
            </div>
          )}

          {/* Test connection action */}
          <div>
            <button
              type="button"
              onClick={testConnection}
              disabled={testingStatus === 'testing'}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={14} className={testingStatus === 'testing' ? 'animate-spin' : ''} />
              Probar Conexión con {provider === 'deepseek' ? 'DeepSeek' : 'Anthropic'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
          >
            Guardar Configuración
          </button>
        </div>

      </div>
    </div>
  );
};
