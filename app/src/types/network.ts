export type DeviceType = 'router' | 'switch' | 'pc' | 'server' | 'cloud' | 'multilayer-switch';

export interface NetworkInterface {
  name: string;             // e.g., 'GigabitEthernet0/0/0', 'FastEthernet0/1'
  shortName: string;        // e.g., 'Gi0/0/0', 'Fa0/1'
  ipAddress?: string;       // e.g., '192.168.10.1'
  subnetMask?: string;      // e.g., '255.255.255.0'
  cidr?: number;            // e.g., 24
  vlan?: number;            // e.g., 10
  status: 'up' | 'down';
  description?: string;
  connectedTo?: {
    deviceId: string;
    portName: string;
  };
}

export interface NetworkDevice {
  id: string;               // e.g., 'R1', 'SW1', 'PC1'
  name: string;             // Display name
  type: DeviceType;
  model: string;            // e.g., 'Cisco 2911', 'Cisco 2960-24TT', 'PC-PT'
  x: number;                // Canvas X coordinate
  y: number;                // Canvas Y coordinate
  interfaces: NetworkInterface[];
  iosConfig: string;        // Cisco IOS commands for this device
  notes?: string;
  defaultGateway?: string;
}

export interface NetworkLink {
  id: string;
  sourceDevice: string;
  sourcePort: string;
  targetDevice: string;
  targetPort: string;
  type: 'straight' | 'cross' | 'serial' | 'fiber';
}

export interface NetworkTopology {
  id: string;
  name: string;
  description: string;
  packetTracerVersion: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
  vlans?: { id: number; name: string; subnet: string }[];
  routingProtocol?: string; // 'OSPF' | 'EIGRP' | 'RIP' | 'BGP' | 'Static'
}

export interface ContextFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;          // text content or base64
  isImage: boolean;
  dataUrl?: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachedFiles?: ContextFile[];
  topology?: NetworkTopology;
  extractedConfigs?: { [deviceName: string]: string };
}

export type AiProvider = 'anthropic' | 'deepseek';

export interface ApiSettings {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekBaseUrl: string;
  dangerouslyAllowBrowser: boolean;
  temperature: number;
  maxTokens: number;
}
