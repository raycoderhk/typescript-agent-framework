// Docker connection detection utility

export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  uptime: number;
  proxyId: string;
  mcpProxyConnected: boolean;
  activeServers: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  error?: string;
  response?: HealthCheckResponse;
}

/**
 * Check if the local Docker toolbox is running by pinging the health endpoint
 */
export async function checkDockerToolboxConnection(): Promise<ConnectionStatus> {
  try {
    const response = await fetch('http://localhost:11990/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data: HealthCheckResponse = await response.json();
      return {
        isConnected: true,
        response: data
      };
    } else {
      return {
        isConnected: false,
        error: `Health check failed with status: ${response.status}`
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Periodically check connection status
 */
export function createConnectionMonitor(
  onStatusChange: (status: ConnectionStatus) => void,
  intervalMs: number = 30000 // Check every 30 seconds by default
): () => void {
  const checkStatus = async () => {
    const status = await checkDockerToolboxConnection();
    onStatusChange(status);
  };

  // Initial check
  checkStatus();

  // Set up periodic checking
  const intervalId = setInterval(checkStatus, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Wait for Docker toolbox to become available
 */
export async function waitForDockerToolbox(
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<ConnectionStatus> {
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const status = await checkDockerToolboxConnection();
    
    if (status.isConnected) {
      return status;
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return {
    isConnected: false,
    error: 'Timeout waiting for Docker toolbox to become available'
  };
}

/**
 * Get or generate proxy ID for Docker toolbox
 */
export function getOrCreateProxyId(): string {
  const storageKey = 'docker_toolbox_proxy_id';
  
  let proxyId = localStorage.getItem(storageKey);
  if (!proxyId) {
    proxyId = generateUUID();
    localStorage.setItem(storageKey, proxyId);
  }
  
  return proxyId;
}

/**
 * Generate a UUID for proxy ID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get toolbox installation status from localStorage
 */
export function getToolboxInstallationStatus(): {
  isInstalled: boolean;
  proxyId?: string;
} {
  const isInstalled = localStorage.getItem('local_toolbox_installed') === 'true';
  const proxyId = localStorage.getItem('docker_toolbox_proxy_id');
  
  return {
    isInstalled,
    proxyId: proxyId || undefined
  };
}

/**
 * Set toolbox installation status in localStorage
 */
export function setToolboxInstallationStatus(isInstalled: boolean, proxyId?: string): void {
  localStorage.setItem('local_toolbox_installed', isInstalled.toString());
  
  if (proxyId) {
    localStorage.setItem('docker_toolbox_proxy_id', proxyId);
  }
} 