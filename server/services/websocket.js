import { v4 as uuidv4 } from 'uuid';

const clients = new Map();

export const setupWebSocket = (wss) => {
  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    console.log(`WebSocket client connected: ${clientId}`);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'authenticate') {
          // Store client with company association
          clients.set(clientId, {
            ws,
            companyId: data.companyId,
            userId: data.userId
          });
          
          ws.send(JSON.stringify({
            type: 'authenticated',
            clientId,
            message: 'WebSocket connection established'
          }));
          
          console.log(`Client authenticated: ${clientId}, Company: ${data.companyId}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(clientId);
    });
    
    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established'
    }));
  });
  
  console.log('WebSocket server initialized');
};

export const broadcastToCompany = (companyId, message) => {
  for (const [clientId, client] of clients) {
    if (client.companyId === companyId && client.ws.readyState === 1) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        clients.delete(clientId);
      }
    }
  }
};

export const broadcastToAll = (message) => {
  for (const [clientId, client] of clients) {
    if (client.ws.readyState === 1) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        clients.delete(clientId);
      }
    }
  }
};