import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] SOC Dashboard Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] SOC Dashboard Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}
