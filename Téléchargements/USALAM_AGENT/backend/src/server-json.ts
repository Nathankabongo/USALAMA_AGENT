import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { jsonDB } from './config/database-json';

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
    const stats = await jsonDB.getStatistics();
    res.status(200).json({
      success: true,
      message: 'USALAMA Backend is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        type: 'JSON File',
        status: 'Connected',
        statistics: stats
      }
    });
  } catch (error) {
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

// Auth endpoints (simplified)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, phone, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const existingUser = await jsonDB.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    const newUser = await jsonDB.createUser({
      username,
      email,
      phone,
      password, // In production, hash this password
      profile: { firstName, lastName }
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: { id: newUser.id, username: newUser.username, email: newUser.email } }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await jsonDB.findUserByEmail(email);
    if (!user || user.password !== password) { // In production, use bcrypt.compare
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, username: user.username, email: user.email },
        token: 'mock-jwt-token' // In production, generate real JWT
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

// Incident endpoints
app.post('/api/incidents', async (req, res) => {
  try {
    const { userId, type, severity, title, description, location } = req.body;
    
    const newIncident = await jsonDB.createIncident({
      userId,
      type,
      severity,
      title,
      description,
      location
    });
    
    // Broadcast to connected clients
    io.emit('incident-created', newIncident);
    
    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: { incident: newIncident }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Incident creation failed',
      details: error.message
    });
  }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const { userId } = req.query;
    const incidents = await jsonDB.getIncidents(userId ? parseInt(userId as string) : undefined);
    
    res.json({
      success: true,
      message: 'Incidents retrieved successfully',
      data: { incidents }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve incidents',
      details: error.message
    });
  }
});

// Medical services endpoints
app.get('/api/medical/services', async (req, res) => {
  try {
    const services = await jsonDB.getMedicalServices();
    
    res.json({
      success: true,
      message: 'Medical services retrieved successfully',
      data: { services }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve medical services',
      details: error.message
    });
  }
});

app.get('/api/medical/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const nearbyServices = await jsonDB.getNearbyMedicalServices(
      parseFloat(lat as string),
      parseFloat(lng as string),
      parseFloat(radius as string)
    );
    
    res.json({
      success: true,
      message: 'Nearby medical services retrieved successfully',
      data: { services: nearbyServices }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve nearby services',
      details: error.message
    });
  }
});

// Alert endpoints
app.post('/api/alerts', async (req, res) => {
  try {
    const { title, message, type, severity, location } = req.body;
    
    const newAlert = await jsonDB.createAlert({
      title,
      message,
      type,
      severity,
      location
    });
    
    // Broadcast to all clients
    io.emit('alert-broadcast', newAlert);
    
    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { alert: newAlert }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Alert creation failed',
      details: error.message
    });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await jsonDB.getActiveAlerts();
    
    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: { alerts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      details: error.message
    });
  }
});

// Statistics endpoint
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const stats = await jsonDB.getStatistics();
    
    res.json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: { analytics: stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics',
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
    
    // Create emergency incident
    const emergency = await jsonDB.createIncident({
      userId: data.userId,
      type: 'medical',
      severity: 'critical',
      title: 'Emergency Request',
      description: data.description,
      location: data.location
    });
    
    // Broadcast to emergency responders
    io.emit('emergency-broadcast', {
      ...emergency,
      timestamp: new Date().toISOString()
    });
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

// Start server
server.listen(PORT, () => {
  console.log('🚀 USALAMA Backend Server Started Successfully!');
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('💾 Database: JSON File (No MongoDB required!)');
  console.log('🎯 Ready for frontend integration!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export { app, server, io };
