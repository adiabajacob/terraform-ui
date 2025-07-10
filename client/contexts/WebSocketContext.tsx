import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  connected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setConnected(true);
      // Authenticate with the server
      websocket.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        companyId: user.company?.id
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    websocket.onclose = () => {
      setConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user]);

  const sendMessage = (message: any) => {
    if (ws && connected) {
      ws.send(JSON.stringify(message));
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};