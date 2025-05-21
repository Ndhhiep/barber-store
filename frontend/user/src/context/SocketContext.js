import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

// Create context
const SocketContext = createContext(null);

/**
 * Socket.IO provider component for user frontend
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  
  // Use refs to prevent unnecessary re-renders
  const socketRef = useRef(null);
  const handlersRef = useRef(new Map());
  
  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('Initializing Socket.IO connection...');
    
    try {
      // Create Socket.IO instance
      const socketInstance = io('http://localhost:5000', {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        transports: ['polling', 'websocket'],
        withCredentials: true,
        timeout: 10000
      });
      
      socketRef.current = socketInstance;
      setSocket(socketInstance);
      
      // Connection event handlers
      const onConnect = () => {
        console.log(`Socket connected with ID: ${socketInstance.id}`);
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
      };
      
      const onDisconnect = (reason) => {
        console.log(`Socket disconnected. Reason: ${reason}`);
        setIsConnected(false);
      };
      
      const onError = (error) => {
        console.error('Socket connection error:', error);
        setIsLoading(false);
        setError(`Cannot connect to Socket.IO server: ${error.message}`);
      };
      
      // Register system event handlers
      socketInstance.on('connect', onConnect);
      socketInstance.on('disconnect', onDisconnect);      socketInstance.on('connect_error', onError);
      
      // Store a copy of handlersRef.current outside the cleanup function
      // to avoid stale reference in the cleanup function
      const currentHandlers = handlersRef.current;
      
      // Clean up on unmount
      return () => {
        console.log('Cleaning up socket connection...');

        // Unregister event handlers using the saved reference
        if (currentHandlers.size > 0) {
          currentHandlers.forEach((callbacks, eventName) => {
            callbacks.forEach((wrappedCb, originalCb) => {
              if (socketInstance) {
                socketInstance.off(eventName, wrappedCb);
              }
            });
          });
          currentHandlers.clear();
        }
        
        // Remove system event handlers
        if (socketInstance) {
          socketInstance.off('connect', onConnect);
          socketInstance.off('disconnect', onDisconnect);
          socketInstance.off('connect_error', onError);
          socketInstance.disconnect();
        }
      };
    } catch (err) {
      console.error('Error initializing socket:', err);
      setIsLoading(false);
      setError(`Error initializing Socket.IO: ${err.message}`);
    }
  }, []);
  
  // Register event handler
  const registerHandler = useCallback((eventName, callback) => {
    if (!socketRef.current) {
      console.warn(`Cannot register handler for '${eventName}': Socket not initialized`);
      return;
    }
    
    // Create a wrapped callback function
    const wrappedCallback = (data) => {
      try {
        // Call the original callback
        callback(data);
        
        // Update last message state
        const messageData = { event: eventName, data, timestamp: new Date() };
        setLastMessage(messageData);
      } catch (err) {
        console.error(`Error handling event ${eventName}:`, err);
        setError(`Error handling event ${eventName}: ${err.message}`);
      }
    };
    
    // Store mapping between original and wrapped callbacks
    if (!handlersRef.current.has(eventName)) {
      handlersRef.current.set(eventName, new Map());
    }
    handlersRef.current.get(eventName).set(callback, wrappedCallback);
    
    // Register event handler
    socketRef.current.on(eventName, wrappedCallback);
    
    // Return unregister function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, wrappedCallback);
      }
      
      if (handlersRef.current.has(eventName)) {
        handlersRef.current.get(eventName).delete(callback);
        if (handlersRef.current.get(eventName).size === 0) {
          handlersRef.current.delete(eventName);
        }
      }
    };
  }, []);
  
  // Unregister event handler
  const unregisterHandler = useCallback((eventName, callback) => {
    if (!socketRef.current) {
      console.warn(`Cannot unregister handler for '${eventName}': Socket not initialized`);
      return;
    }
    
    // Get wrapped callback
    if (handlersRef.current.has(eventName)) {
      const wrappedCallback = handlersRef.current.get(eventName).get(callback);
      if (wrappedCallback) {
        socketRef.current.off(eventName, wrappedCallback);
        handlersRef.current.get(eventName).delete(callback);
        if (handlersRef.current.get(eventName).size === 0) {
          handlersRef.current.delete(eventName);
        }
      }
    }
  }, []);
  
  // Emit an event
  const emitEvent = useCallback((eventName, data) => {
    if (!socketRef.current || !isConnected) {
      console.warn(`Cannot emit event '${eventName}': Socket not connected`);
      return false;
    }
    
    try {
      socketRef.current.emit(eventName, data);
      return true;
    } catch (err) {
      console.error(`Error emitting event ${eventName}:`, err);
      setError(`Error emitting event ${eventName}: ${err.message}`);
      return false;
    }
  }, [isConnected]);
  
  // Reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current && !isConnected) {
      console.log('Attempting to reconnect...');
      setIsLoading(true);
      setError(null);
      socketRef.current.connect();
    }
  }, [isConnected]);
  
  // Create context value
  const contextValue = {
    socket,
    isConnected,
    isLoading,
    error,
    lastMessage,
    registerHandler,
    unregisterHandler,
    emitEvent,
    reconnect
  };
  
  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};
