import { ApiSettings, ContextFile, NetworkTopology } from '../types/network';
import { parseAiResponseToTopology } from './packetTracerExporter';

export interface SendMessageOptions {
  userPrompt: string;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  contextFiles: ContextFile[];
  settings: ApiSettings;
}

export interface ClaudeResponse {
  text: string;
  topology?: NetworkTopology;
}

const VISION_PROMPT = `Analiza esta imagen de un proyecto de Cisco Packet Tracer como un ingeniero de redes.
Extrae únicamente información útil para reconstruirlo: dispositivos y modelos, nombres, enlaces y puertos,
VLANs, direcciones IP, máscaras, gateways y cualquier configuración CLI visible. Si un dato no es legible,
indícalo como desconocido. Devuelve una especificación técnica estructurada en español, no una opinión.`;

async function extractImageContextForDeepSeek(imageFiles: ContextFile[], settings: ApiSettings): Promise<string> {
  if (imageFiles.length === 0) return '';
  if (!settings.apiKey.trim()) {
    return `\n[AVISO: Hay ${imageFiles.length} imagen(es) adjunta(s), pero DeepSeek no interpreta imágenes y no hay una clave de Anthropic configurada para el puente de visión. Solicita una descripción textual o configura Anthropic como decodificador visual.]\n`;
  }

  const content: any[] = [];
  imageFiles.forEach((file) => {
    const match = file.dataUrl?.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: `image/${match[1]}`, data: match[2] }
      });
    }
  });
  content.push({ type: 'text', text: VISION_PROMPT });

  const response = await fetch(settings.baseUrl || 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': settings.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      ...(settings.dangerouslyAllowBrowser ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {}),
    },
    body: JSON.stringify({
      model: settings.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.1,
      system: 'Eres un extractor visual para NetPilot. No inventes datos ilegibles.',
      messages: [{ role: 'user', content }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Error del puente de visión HTTP ${response.status}`);
  }
  const data = await response.json();
  return `\n[ESPECIFICACIÓN EXTRAÍDA DE IMAGEN PARA DEEPSEEK]\n${data.content?.[0]?.text || 'No se obtuvo texto visual.'}\n[/ESPECIFICACIÓN EXTRAÍDA DE IMAGEN]\n`;
}

const SYSTEM_PROMPT = `Eres NetPilot AI, el asistente de ingeniería de redes experto en Cisco IOS y Cisco Packet Tracer.
Tu objetivo es resolver dudas, diseñar topologías completas, diagnosticar fallas de red y guiar paso a paso en laboratorios de CCNA, CCNP y Packet Tracer.

REGLAS DE RESPUESTA:
1. Siempre explica el razonamiento técnico y el propósito de cada comando Cisco IOS de forma didáctica y clara.
2. Organiza los comandos agrupados claramente por dispositivo usando bloques de código con el identificador del equipo.
   Por ejemplo:
   \`\`\`ios [R1]
   enable
   configure terminal
   hostname R1
   ...
   \`\`\`
   \`\`\`ios [SW1]
   enable
   configure terminal
   hostname SW1
   ...
   \`\`\`
3. Incluye una breve tabla de direccionamiento IP (Dispositivo, Interfaz, IP, Máscara, Gateway, VLAN) cuando diseñes una red.
4. Incluye comandos de verificación esenciales (ej: \`show ip interface brief\`, \`show ip route\`, \`show vlan brief\`, \`show ip ospf neighbor\`).
5. Mantén un tono profesional, técnico, conciso y de alta ingeniería en español.`;

/**
 * Sends a prompt to the DeepSeek Chat Completions API
 */
export async function sendToDeepSeek(options: SendMessageOptions): Promise<ClaudeResponse> {
  const { userPrompt, chatHistory, contextFiles, settings } = options;

  if (!settings.deepseekApiKey || settings.deepseekApiKey.trim().length === 0) {
    return simulateClaudeResponse(userPrompt, contextFiles);
  }

  let baseUrl = settings.deepseekBaseUrl || 'https://api.deepseek.com';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const endpoint = baseUrl.endsWith('/v1') || baseUrl.endsWith('/chat/completions')
    ? (baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`)
    : `${baseUrl}/chat/completions`;

  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  chatHistory.slice(-6).forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });

  let combinedPrompt = userPrompt;
  if (contextFiles.length > 0) {
    const fileTexts = contextFiles
      .filter(f => !f.isImage)
      .map(f => `[Archivo de contexto adjunto: ${f.name}]\n${f.content}\n---`)
      .join('\n\n');
    if (fileTexts) {
      combinedPrompt = `${fileTexts}\n\n${userPrompt}`;
    }
  }

  const imageFiles = contextFiles.filter(file => file.isImage && file.dataUrl);
  if (imageFiles.length > 0) {
    try {
      combinedPrompt = `${await extractImageContextForDeepSeek(imageFiles, settings)}\n${combinedPrompt}`;
    } catch (error: any) {
      combinedPrompt = `[AVISO: El puente de visión no pudo decodificar las imágenes: ${error.message || 'error desconocido'}]\n\n${combinedPrompt}`;
    }
  }

  messages.push({
    role: 'user',
    content: combinedPrompt
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.deepseekApiKey.trim()}`,
      },
      body: JSON.stringify({
        model: settings.deepseekModel || 'deepseek-chat',
        messages,
        temperature: settings.temperature || 0.2,
        max_tokens: settings.maxTokens || 4000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const messageChoice = data.choices?.[0]?.message;
    let textOutput = messageChoice?.content || '';

    if (messageChoice?.reasoning_content) {
      textOutput = `> 🧠 **Razonamiento DeepSeek-R1:**\n> ${messageChoice.reasoning_content.split('\n').join('\n> ')}\n\n${textOutput}`;
    }

    const parsedTopology = parseAiResponseToTopology(textOutput, 'Topología Generada por DeepSeek');

    return {
      text: textOutput,
      topology: parsedTopology
    };
  } catch (err: any) {
    console.warn("DeepSeek API Error, using fallback engine:", err);
    const fallback = simulateClaudeResponse(userPrompt, contextFiles);
    return {
      text: `> ⚠️ **Aviso de Conexión DeepSeek:** ${err.message || 'No se pudo conectar a la API de DeepSeek'}. He activado el **Motor Local de Simulación de NetPilot** para resolver tu requerimiento sin interrupciones.\n\n` + fallback.text,
      topology: fallback.topology
    };
  }
}

/**
 * Universal router to Anthropic or DeepSeek based on user settings
 */
export async function sendToAi(options: SendMessageOptions): Promise<ClaudeResponse> {
  if (options.settings.provider === 'deepseek') {
    return sendToDeepSeek(options);
  }
  return sendToClaude(options);
}

/**
 * Sends a prompt to the Anthropic Messages API or uses the offline fallback engine.
 */
export async function sendToClaude(options: SendMessageOptions): Promise<ClaudeResponse> {
  const { userPrompt, chatHistory, contextFiles, settings } = options;

  if (settings.provider === 'deepseek') {
    return sendToDeepSeek(options);
  }

  // If no API Key is provided or user explicitly wants demo mode:
  if (!settings.apiKey || settings.apiKey.trim().length === 0) {
    return simulateClaudeResponse(userPrompt, contextFiles);
  }

  const endpoint = settings.baseUrl || 'https://api.anthropic.com/v1/messages';

  // Format messages for Anthropic
  const formattedMessages: any[] = [];

  // Add history
  chatHistory.slice(-6).forEach(msg => {
    formattedMessages.push({
      role: msg.role,
      content: msg.content
    });
  });

  // Current user message content (can include text + base64 images)
  const currentContent: any[] = [];

  // Add attached context files
  contextFiles.forEach(file => {
    if (file.isImage && file.dataUrl) {
      const match = file.dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (match) {
        currentContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: `image/${match[1]}`,
            data: match[2]
          }
        });
      }
    } else {
      currentContent.push({
        type: 'text',
        text: `[Archivo de contexto adjunto: ${file.name}]\n${file.content}\n---`
      });
    }
  });

  currentContent.push({
    type: 'text',
    text: userPrompt
  });

  formattedMessages.push({
    role: 'user',
    content: currentContent
  });

  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': settings.apiKey.trim(),
      'anthropic-version': '2023-06-01',
    };

    if (settings.dangerouslyAllowBrowser) {
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model || 'claude-3-5-sonnet-20241022',
        max_tokens: settings.maxTokens || 4000,
        temperature: settings.temperature || 0.2,
        system: SYSTEM_PROMPT,
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const textOutput = data.content?.[0]?.text || '';

    const parsedTopology = parseAiResponseToTopology(textOutput, 'Topología Generada por Claude');

    return {
      text: textOutput,
      topology: parsedTopology
    };
  } catch (err: any) {
    console.warn("Claude API Error, using fallback engine with notice:", err);
    // Return friendly simulated response with error notification
    const fallback = simulateClaudeResponse(userPrompt, contextFiles);
    return {
      text: `> ⚠️ **Aviso de Conexión Anthropic:** ${err.message || 'No se pudo conectar a la API de Claude'}. He activado el **Motor Local de Simulación de NetPilot** para resolver tu requerimiento sin interrupciones.\n\n` + fallback.text,
      topology: fallback.topology
    };
  }
}

/**
 * Intelligent Cisco Network Engineering Simulation Engine
 * Generates realistic CCNA-grade step-by-step Cisco IOS commands, explanations, and topologies.
 */
function simulateClaudeResponse(prompt: string, files: ContextFile[]): ClaudeResponse {
  const p = prompt.toLowerCase();

  // Scenario 1: OSPF Routing
  if (p.includes('ospf') || p.includes('enrutamiento') || p.includes('routing')) {
    const text = `### Diseño y Configuración de Enrutamiento OSPFv2 Multi-Área

He diseñado una topología de alta disponibilidad con dos routers Cisco 2911 (\`R1\` y \`R2\`) conectados mediante un enlace WAN punto a punto, configurando el protocolo de estado de enlace **OSPFv2 (Área 0 Backbone)**.

#### 1. Tabla de Direccionamiento IP y Asignación de Interfaces
| Dispositivo | Interfaz | Dirección IP | Máscara de Subred | Área OSPF | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | Gi0/0/0 | 192.168.1.1 | 255.255.255.0 (/24) | Área 0 | Red LAN 1 |
| **R1** | Gi0/0/1 | 10.0.0.1 | 255.255.255.252 (/30) | Área 0 | Enlace WAN a R2 |
| **R2** | Gi0/0/1 | 10.0.0.2 | 255.255.255.252 (/30) | Área 0 | Enlace WAN a R1 |
| **R2** | Gi0/0/0 | 192.168.2.1 | 255.255.255.0 (/24) | Área 0 | Red LAN 2 |

---

#### 2. Configuración Cisco IOS Paso a Paso para **R1**
Explicación de comandos:
- \`router ospf 1\`: Habilita el proceso de enrutamiento OSPF con ID de proceso local 1.
- \`router-id 1.1.1.1\`: Asigna manualmente el identificador del router para evitar ambigüedades.
- \`network ... 0.0.0.3 area 0\`: Publica la subred con máscara wildcard y la asocia al Backbone.
- \`passive-interface Gi0/0/0\`: Evita enviar paquetes Hello innecesarios hacia la red de usuarios por seguridad.

\`\`\`ios [R1]
enable
configure terminal
hostname R1
!
interface GigabitEthernet0/0/0
 description LAN_1_Local
 ip address 192.168.1.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/1
 description WAN_Enlace_PTP_hacia_R2
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 1.1.1.1
 passive-interface GigabitEthernet0/0/0
 network 10.0.0.0 0.0.0.3 area 0
 network 192.168.1.0 0.0.0.255 area 0
!
exit
write memory
\`\`\`

---

#### 3. Configuración Cisco IOS Paso a Paso para **R2**

\`\`\`ios [R2]
enable
configure terminal
hostname R2
!
interface GigabitEthernet0/0/0
 description LAN_2_Local
 ip address 192.168.2.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/1
 description WAN_Enlace_PTP_hacia_R1
 ip address 10.0.0.2 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 2.2.2.2
 passive-interface GigabitEthernet0/0/0
 network 10.0.0.0 0.0.0.3 area 0
 network 192.168.2.0 0.0.0.255 area 0
!
exit
write memory
\`\`\`

---

#### 4. Comandos de Verificación en Cisco Packet Tracer
Ejecuta estos comandos en la pestaña **CLI** para validar la convergencia de la red:
- \`show ip ospf neighbor\`: Debe mostrar a su vecino en estado **FULL/BDR** o **FULL/DR**.
- \`show ip route ospf\`: Verifica que las rutas remotas (\`O\`) aparezcan en la tabla de enrutamiento.
- \`ping 192.168.2.1\`: Prueba de conectividad extremo a extremo con 100% de éxito.`;

    const topo = parseAiResponseToTopology(text, 'Topología OSPF Multi-Área');
    return { text, topology: topo };
  }

  // Scenario 2: DHCP Server & Helper-Address
  if (p.includes('dhcp') || p.includes('direccionamiento') || p.includes('ip helper')) {
    const text = `### Servidor DHCP en Router Cisco IOS con Exclusión de IPs

A continuación tienes la solución para configurar un Router Cisco 2911 como servidor DHCP automático para la red LAN, protegiendo las IPs estáticas de servidores e impresoras.

#### 1. Configuración Cisco IOS para **R1**
Explicación de comandos:
- \`ip dhcp excluded-address\`: Excluye del rango dinámico las IPs asignadas a infraestructura (Gateways, impresoras).
- \`ip dhcp pool\`: Define el grupo de direccionamiento.
- \`default-router\`: Indica la IP del router como puerta de enlace predeterminada.
- \`dns-server\`: Asigna los servidores DNS para resolución de nombres.
- \`lease\`: Define el tiempo de concesión (días, horas, minutos).

\`\`\`ios [R1]
enable
configure terminal
hostname R1
!
interface GigabitEthernet0/0/0
 description Gateway_LAN_Usuarios
 ip address 192.168.10.1 255.255.255.0
 no shutdown
!
! Excluir las primeras 10 direcciones IP para infraestructura
ip dhcp excluded-address 192.168.10.1 192.168.10.10
ip dhcp excluded-address 192.168.10.254
!
! Crear el pool DHCP para los clientes
ip dhcp pool POOL_LAN_USUARIOS
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 8.8.8.8 1.1.1.1
 domain-name netpilot.local
 lease 2 12 0
!
exit
write memory
\`\`\`

#### 2. Configuración del Switch de Acceso **SW1**
\`\`\`ios [SW1]
enable
configure terminal
hostname SW1
!
interface range FastEthernet0/1 - 24
 switchport mode access
 switchport access vlan 1
 spanning-tree portfast
 no shutdown
!
exit
write memory
\`\`\`

#### 3. Verificación en Packet Tracer
- En las PCs cliente, ve a **Desktop -> IP Configuration** y selecciona **DHCP**. La PC obtendrá automáticamente una IP en el rango 192.168.10.11+.
- En el CLI del Router: \`show ip dhcp binding\` (muestra las direcciones MAC y las IPs concedidas).`;

    const topo = parseAiResponseToTopology(text, 'Servidor DHCP Cisco IOS');
    return { text, topology: topo };
  }

  // Scenario 3: NAT / PAT
  if (p.includes('nat') || p.includes('pat') || p.includes('internet') || p.includes('acceso')) {
    const text = `### Configuración de NAT Dinámico con Sobrecarga (PAT) en Cisco IOS

Esta configuración permite que todos los dispositivos de la red privada (192.168.1.0/24) naveguen a Internet utilizando una única dirección IP pública en la interfaz WAN.

#### 1. Configuración Cisco IOS para **R1-Gateway**
Explicación paso a paso:
- \`ip nat inside\` e \`ip nat outside\`: Marcan el tráfico que entra por la interfaz LAN y sale por la WAN pública.
- \`access-list 1 permit\`: Lista de control de acceso estándar que define qué subredes privadas tienen permiso para traducirse.
- \`ip nat inside source list 1 interface GigabitEthernet0/0/1 overload\`: Activa PAT (Port Address Translation) mapeando números de puerto TCP/UDP.

\`\`\`ios [R1-Gateway]
enable
configure terminal
hostname R1-Gateway
!
interface GigabitEthernet0/0/0
 description Interfaz_LAN_Inside
 ip nat inside
 ip address 192.168.1.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/1
 description Interfaz_WAN_Outside_Internet
 ip nat outside
 ip address 203.0.113.2 255.255.255.252
 no shutdown
!
! Ruta predeterminada hacia el ISP
ip route 0.0.0.0 0.0.0.0 203.0.113.1
!
! ACL que define el tráfico interno permitido
access-list 1 permit 192.168.1.0 0.0.0.255
!
! Regla de NAT con Sobrecarga (PAT)
ip nat inside source list 1 interface GigabitEthernet0/0/1 overload
!
exit
write memory
\`\`\`

#### 2. Comandos de Verificación
- \`show ip nat translations\`: Muestra la tabla de traducción con puertos activos.
- \`show ip nat statistics\`: Verifica paquetes traducidos con éxito y contadores de aciertos.`;

    const topo = parseAiResponseToTopology(text, 'Laboratorio NAT/PAT Gateway');
    return { text, topology: topo };
  }

  // Default: Full VLAN & Router-on-a-Stick Lab
  const text = `### Solución Completa: Inter-VLAN Routing (Router-on-a-Stick) con 802.1Q

He generado la arquitectura de red requerida para segmentar el tráfico departamental mediante VLANs y permitir la comunicación entre ellas utilizando un Router Cisco 2911 (\`R1\`) y un Switch Cisco 2960 (\`SW1\`).

#### 1. Resumen de VLANs y Segmentación
- **VLAN 10 (Ventas)**: 192.168.10.0/24 — Gateway: \`192.168.10.1\`
- **VLAN 20 (Ingeniería)**: 192.168.20.0/24 — Gateway: \`192.168.20.1\`
- **VLAN 99 (Administración / Nativa)**: 192.168.99.0/24 — Switch IP: \`192.168.99.2\`

---

#### 2. Configuración para el Router **R1**
Configuración de subinterfaces con encapsulación IEEE 802.1Q:

\`\`\`ios [R1]
enable
configure terminal
hostname R1
!
interface GigabitEthernet0/0/0
 no ip address
 no shutdown
!
interface GigabitEthernet0/0/0.10
 description Gateway_VLAN_10_Ventas
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0
!
interface GigabitEthernet0/0/0.20
 description Gateway_VLAN_20_Ingenieria
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
!
interface GigabitEthernet0/0/0.99
 description Gateway_VLAN_99_Admin
 encapsulation dot1Q 99 native
 ip address 192.168.99.1 255.255.255.0
!
! Servidor DHCP para que las PCs tomen IP automáticamente
ip dhcp pool VENTAS
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 8.8.8.8
!
ip dhcp pool INGENIERIA
 network 192.168.20.0 255.255.255.0
 default-router 192.168.20.1
 dns-server 8.8.8.8
!
exit
write memory
\`\`\`

---

#### 3. Configuración para el Switch **SW1**
Creación de VLANs, enlace troncal al Router y puertos de acceso con PortFast:

\`\`\`ios [SW1]
enable
configure terminal
hostname SW1
!
vlan 10
 name VENTAS
!
vlan 20
 name INGENIERIA
!
vlan 99
 name ADMIN
!
interface GigabitEthernet0/1
 description Trunk_Link_to_R1
 switchport mode trunk
 switchport trunk native vlan 99
 no shutdown
!
interface FastEthernet0/10
 description Acceso_PC_Ventas
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
!
interface FastEthernet0/20
 description Acceso_PC_Ingenieria
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
!
interface vlan 99
 ip address 192.168.99.2 255.255.255.0
 no shutdown
!
ip default-gateway 192.168.99.1
!
exit
write memory
\`\`\`

---

#### 4. Verificación y Pruebas
1. Haz clic en el botón superior **"Exportar a Packet Tracer (.pkt / Scripts)"** para descargar el archivo empaquetado.
2. Abre la topología en Cisco Packet Tracer y realiza un ping desde **PC-Ventas** hacia **PC-Ingenieria** (\`ping 192.168.20.10\`). El primer paquete puede fallar por ARP; los siguientes responderán con \`Reply from...\`.`;

  const topo = parseAiResponseToTopology(text, 'VLAN & Router-on-a-Stick Lab');
  return { text, topology: topo };
}
