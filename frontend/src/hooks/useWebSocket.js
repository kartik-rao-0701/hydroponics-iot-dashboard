import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useWebSocket = (url, onMessage) => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(url);
    
    socketRef.current.on('sensorUpdate', onMessage);
    
    return () => {
      socketRef.current.disconnect();
    };
  }, [url, onMessage]);

  return socketRef.current;
};

export default useWebSocket;
