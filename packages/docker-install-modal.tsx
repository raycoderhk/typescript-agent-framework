import React, { useState, useEffect } from 'react';
import { generateUUID } from '../utils/generateUUID';

interface DockerInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallationComplete?: () => void;
  proxyId?: string; // Optional proxyId to use instead of generating one
  reason?: 'initial' | 'mismatch'; // Reason for showing the modal
} 

export function DockerInstallModal({ 
  isOpen, 
  onClose, 
  onInstallationComplete,
  proxyId: providedProxyId,
  reason = 'initial'
}: DockerInstallModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [proxyId, setProxyId] = useState<string>("");
  const [dockerCommand, setDockerCommand] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  // Step completion states
  const [dockerInstalled, setDockerInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'failed' | 'timeout'>('idle');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Initialize proxy ID and docker command
  useEffect(() => {
    if (isOpen) {
      let currentProxyId: string;
      
      if (providedProxyId) {
        // Use provided proxyId (for mismatch scenarios)
        currentProxyId = providedProxyId;
        // Update localStorage to match
        localStorage.setItem('playground_proxy_id', currentProxyId);
      } else {
        // Check if we already have a proxy ID stored
        const existingProxyId = localStorage.getItem('playground_proxy_id');
        currentProxyId = existingProxyId || generateUUID();
        
        if (!existingProxyId) {
          localStorage.setItem('playground_proxy_id', currentProxyId);
        }
      }
      
      setProxyId(currentProxyId);
      setDockerCommand(`docker run -d -p 11990:11990 --name mcp-toolbox --proxy-id ${currentProxyId} null-shot/mcp-toolbox:latest`);
    }
  }, [isOpen, providedProxyId]);

  return (
    // Rest of the component code
  );
} 