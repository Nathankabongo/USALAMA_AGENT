import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { database } from './database/core';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const stats = database.getStatistics();
    res.status(200).json({
      success: true,
      message: 'USALAMA Backend is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        type: 'USALAMA Database Core',
        status: 'Connected',
        statistics: stats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

// API Routes
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test endpoint working',
    data: {
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query
      }
    }
  });
});

// User endpoints
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    const newUser = database.create('users', userData);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: newUser }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'User creation failed',
      details: error.message
    });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = database.find('users');
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
      details: error.message
    });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = database.findById('users', req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user',
      details: error.message
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updatedUser = database.update('users', req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'User update failed',
      details: error.message
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const deleted = database.delete('users', req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'User deletion failed',
      details: error.message
    });
  }
});

// Incident endpoints
app.post('/api/incidents', async (req, res) => {
  try {
    const incidentData = req.body;
    const newIncident = database.create('incidents', incidentData);
    
    // Broadcast to connected clients
    io.emit('incident-created', newIncident);
    
    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: { incident: newIncident }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Incident creation failed',
      details: error.message
    });
  }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const { userId, status, severity } = req.query;
    const query: any = {};
    
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    
    const incidents = database.find('incidents', query);
    
    res.json({
      success: true,
      message: 'Incidents retrieved successfully',
      data: { incidents }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve incidents',
      details: error.message
    });
  }
});

app.get('/api/incidents/:id', async (req, res) => {
  try {
    const incident = database.findById('incidents', req.params.id);
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Incident retrieved successfully',
      data: { incident }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve incident',
      details: error.message
    });
  }
});

// Services endpoints
app.post('/api/services', async (req, res) => {
  try {
    const serviceData = req.body;
    const newService = database.create('services', serviceData);
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service: newService }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Service creation failed',
      details: error.message
    });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const { type, active } = req.query;
    const query: any = {};
    
    if (type) query.type = type;
    if (active !== undefined) query.active = active === 'true';
    
    const services = database.find('services', query);
    
    res.json({
      success: true,
      message: 'Services retrieved successfully',
      data: { services }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve services',
      details: error.message
    });
  }
});

// Alerts endpoints
app.post('/api/alerts', async (req, res) => {
  try {
    const alertData = req.body;
    const newAlert = database.create('alerts', alertData);
    
    // Broadcast to all clients
    io.emit('alert-broadcast', newAlert);
    
    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { alert: newAlert }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Alert creation failed',
      details: error.message
    });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const { active } = req.query;
    const query: any = {};
    
    if (active !== undefined) query.active = active === 'true';
    
    const alerts = database.find('alerts', query);
    
    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: { alerts }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      details: error.message
    });
  }
});

// Search endpoint
app.get('/api/search/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { q: query, fields } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const searchFields = fields ? (fields as string).split(',') : [];
    const results = database.search(collection, query as string, searchFields);
    
    res.json({
      success: true,
      message: 'Search completed successfully',
      data: { results, count: results.length }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message
    });
  }
});

// Statistics endpoint
app.get('/api/statistics', async (req, res) => {
  try {
    const stats = database.getStatistics();
    
    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: { statistics: stats }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      details: error.message
    });
  }
});

// Logs endpoint
app.get('/api/logs', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = database.getLogs(parseInt(limit as string));
    
    res.json({
      success: true,
      message: 'Logs retrieved successfully',
      data: { logs }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs',
      details: error.message
    });
  }
});

// Backup endpoints
app.post('/api/backup', async (req, res) => {
  try {
    const backupFile = await database.createBackup();
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      data: { backupFile }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Backup failed',
      details: error.message
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });
  
  socket.on('emergency-request', async (data) => {
    console.log('🚨 Emergency request received:', data);
    
    try {
      const emergency = database.create('incidents', {
        userId: data.userId,
        type: 'medical',
        severity: 'critical',
        title: 'Emergency Request',
        description: data.description,
        location: data.location,
        status: 'reported'
      });
      
      // Broadcast to emergency responders
      io.emit('emergency-broadcast', {
        ...emergency,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('emergency-confirmed', emergency);
    } catch (error: any) {
      socket.emit('emergency-error', { error: error.message });
    }
  });
  
  socket.on('location-update', (data) => {
    console.log('📍 Location update:', data);
    socket.broadcast.emit('location-update', data);
  });
  
  socket.on('test-message', (data) => {
    console.log('📨 Test message received:', data);
    io.emit('test-broadcast', {
      ...data,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Initialize database with sample data
async function initializeSampleData() {
  try {
    // Check if database is empty
    const stats = database.getStatistics();
    
    if (stats.totalUsers === 0) {
      console.log('📝 Initializing sample data...');
      
      // Create admin user
      database.create('users', {
        username: 'admin',
        email: 'admin@usalama.com',
        phone: '+243123456789',
        password: 'admin123', // In production, hash this
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          role: 'administrator'
        },
        isActive: true
      });
      
      // Create sample services
      database.create('services', {
        name: "Hôpital Général de Kinshasa",
        type: "hospital",
        phone: "+243123456789",
        address: "Avenue de la Paix, Kinshasa",
        latitude: -4.3275,
        longitude: 15.3136,
        responseTime: 15,
        isActive: true
      });
      
      database.create('services', {
        name: "Centre Médical Ngaliema",
        type: "clinic",
        phone: "+243987654321",
        address: "Boulevard Ngaliema, Kinshasa",
        latitude: -4.3026,
        longitude: 15.2682,
        responseTime: 10,
        isActive: true
      });
      
      database.create('services', {
        name: "Service d'Ambulance USALAMA",
        type: "ambulance",
        phone: "+243112233445",
        address: "Disponible 24/7",
        latitude: -4.3275,
        longitude: 15.3136,
        responseTime: 8,
        isActive: true
      });
      
      console.log('✅ Sample data initialized');
    }
  } catch (error: any) {
    console.error('❌ Error initializing sample data:', error.message);
  }
}

// Start server
server.listen(PORT, async () => {
  console.log('🚀 USALAMA Backend Server Started Successfully!');
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('💾 Database: USALAMA Database Core (JSON-based)');
  console.log('🎯 Ready for frontend integration!');
  
  // Initialize sample data
  await initializeSampleData();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  database.destroy();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  database.destroy();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export { app, server, io };
