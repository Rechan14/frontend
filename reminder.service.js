const calendarService = require('./calendar.service');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

// Store connected clients
const clients = new Map(); // Using Map to store client info

// Initialize WebSocket server
function initializeWebSocket(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true
  });

  wss.on('connection', (ws, req) => {
    try {
      // Parse the URL to get query parameters
      const parameters = url.parse(req.url, true).query;
      const token = parameters.token;

      if (!token) {
        console.error('No token provided');
        ws.close(1008, 'No token provided');
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Store client with user info
      clients.set(ws, {
        userId: decoded.id,
        ws: ws
      });

      console.log(`Client connected: ${decoded.id}`);

      ws.on('close', () => {
        clients.delete(ws);
        console.log(`Client disconnected: ${decoded.id}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${decoded.id}:`, error);
        clients.delete(ws);
      });

    } catch (error) {
      console.error('Token verification failed:', error);
      ws.close(1008, 'Invalid token');
    }
  });

  // Handle server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
}

// Function to send reminder to specific client
function sendReminderToClient(client, reminder) {
  const message = JSON.stringify({
    type: 'reminder',
    data: {
      title: reminder.title,
      description: reminder.description,
      startDate: reminder.startDate,
      minutesBefore: reminder.reminderMinutes
    }
  });

  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(message);
    console.log(`Reminder sent to user ${client.userId}`);
  }
}

// Check for reminders every minute
async function checkReminders() {
  try {
    console.log('Checking for reminders...');
    const upcomingReminders = await calendarService.checkUpcomingReminders();
    console.log('Found reminders:', upcomingReminders.length);
    
    for (const reminder of upcomingReminders) {
      // Send reminder to all connected clients
      clients.forEach(client => {
        sendReminderToClient(client, reminder);
      });
      
      // Mark the reminder as sent
      await calendarService.updateEvent(reminder.id, {
        reminderEnabled: false
      });
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

// Start the reminder checking interval
function startReminderService() {
  console.log('Starting reminder service...');
  // Check immediately
  checkReminders();
  
  // Then check every minute
  setInterval(checkReminders, 60000);
}

module.exports = {
  initializeWebSocket,
  startReminderService
}; 