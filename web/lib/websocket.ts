import { useEffect, useRef, useState, useCallback } from 'react';
import { getAuthToken } from './auth';

interface Message {
  id: number;
  content: string;
  sender: any;
  created_at: string;
  conversation: number;
}

interface WebSocketHookReturn {
  socket: WebSocket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: any) => void;
  lastMessage: Message | null;
  lastMetaConversationId: number | null;
}

export const useWebSocket = (conversationId?: number): WebSocketHookReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [lastMetaConversationId, setLastMetaConversationId] = useState<number | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const token = getAuthToken();
    if (!token) {
      setConnectionStatus('error');
      return;
    }

    try {
      setConnectionStatus('connecting');
      // Try WebSocket endpoint
      const wsUrl = `ws://localhost:8000/ws/messages/?token=${token}`;
      console.log(`Attempting WebSocket connection to: ${wsUrl}`);
      
      const newSocket = new WebSocket(wsUrl);
      
      const connectionTimeout = setTimeout(() => {
        newSocket.close();
        console.log('WebSocket connection timeout');
        setConnectionStatus('error');
      }, 5000);

        newSocket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connected successfully');
          setConnectionStatus('connected');
          reconnectAttemptsRef.current = 0;
          
          // Join conversation if specified
          if (conversationId) {
            newSocket.send(JSON.stringify({
              type: 'join_conversation',
              conversation_id: conversationId
            }));
          }
          
          setSocket(newSocket);
        };

        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            if (data.type === 'new_message') {
              setLastMessage(data.message);
              setLastMetaConversationId(null);
            } else if (data.type === 'new_message_meta') {
              const convId = data.conversation_id ?? data.conversation;
              if (typeof convId === 'number') {
                setLastMetaConversationId(convId);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        newSocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket disconnected:', event.code, event.reason);
          setConnectionStatus('disconnected');
          setSocket(null);

          // Attempt to reconnect
          if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          } else {
            console.log('Max reconnection attempts reached or connection closed normally');
            setConnectionStatus('error');
          }
        };

        newSocket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          console.log('Make sure the backend is running with: python start_websocket_server.py');
          setConnectionStatus('error');
        };
      
      setSocket(newSocket);
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [conversationId]);

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  useEffect(() => {
    if (getAuthToken()) {
      connect();
    } else {
      setConnectionStatus('disconnected');
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  return {
    socket,
    connectionStatus,
    sendMessage,
    lastMessage,
    lastMetaConversationId
  };
};