const express = require('express');
const http = require('http');
const reminderService = require('./reminder.service');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize WebSocket server
reminderService.initializeWebSocket(server);

// Start the reminder service
reminderService.startReminderService();

// Import routes
const calendarRoutes = require('./calendars/calendars.controller');
app.use('/calendars', calendarRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('WebSocket server is ready');
}); 