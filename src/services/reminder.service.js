const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

class ReminderService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.reminderCheckInterval = null;
  }

  initialize(server) {
    // Create WebSocket server with proper configuration
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      clientTracking: true,
      verifyClient: (info, callback) => {
        try {
          const token = url.parse(info.req.url, true).query.token;
          if (!token) {
            callback(false, 401, 'Unauthorized: No token provided');
            return;
          }

          jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
              console.error('Token verification failed:', err);
              callback(false, 401, 'Unauthorized: Invalid token');
              return;
            }
            callback(true);
          });
        } catch (error) {
          console.error('Error in verifyClient:', error);
          callback(false, 401, 'Unauthorized: Error processing token');
        }
      }
    });

    this.wss.on('connection', (ws, req) => {
      try {
        const token = url.parse(req.url, true).query.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.sub;

        console.log(`Client connected: ${userId}`);

        // Store the WebSocket connection
        this.clients.set(userId, ws);

        // Handle client disconnection
        ws.on('close', () => {
          console.log(`Client disconnected: ${userId}`);
          this.clients.delete(userId);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
          this.clients.delete(userId);
        });

        // Send initial connection success message
        ws.send(JSON.stringify({ type: 'connection', status: 'success' }));
      } catch (error) {
        console.error('Error in connection handler:', error);
        ws.close(1008, 'Invalid token');
      }
    });

    // Start checking for reminders
    this.startReminderCheck();
  }

  // ... rest of the class implementation ...
} 