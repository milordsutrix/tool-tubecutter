import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import { URL } from 'url';

class WebSocketService {
  private wss!: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();

  public initialize(httpServer: Server): void {
    // On configure le serveur pour n'écouter que sur le chemin '/ws'
    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
      // Vérifier si la requête est pour notre chemin WebSocket
      if (request.url === '/ws') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        // Laisser Vite (ou un autre service) gérer les autres requêtes d'upgrade
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected via WebSocket on /ws');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'register' && data.jobId) {
            this.clients.set(data.jobId, ws);
            console.log(`Client registered for jobId: ${data.jobId}`);
            ws.on('close', () => {
              console.log(`Client disconnected for jobId: ${data.jobId}`);
              this.clients.delete(data.jobId);
            });
          }
        } catch (e) {
          console.error('Failed to parse message or invalid message format:', message);
        }
      });
    });
  }

  public sendMessage(jobId: string, type: string, payload: any): boolean {
    const client = this.clients.get(jobId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload }));
      return true;
    }
    console.warn(`No active WebSocket client found for jobId: ${jobId}`);
    return false;
  }
}

export const webSocketService = new WebSocketService();