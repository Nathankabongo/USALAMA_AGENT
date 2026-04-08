const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const fs = require('fs');
const path = require('path');

// Simple JSON Database
class JSONDatabase {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/usalama.json');
    this.ensureDataDirectory();
    this.loadData();
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const fileData = fs.readFileSync(this.dataPath, 'utf8');
        this.data = JSON.parse(fileData);
        console.log('✅ Loaded data from JSON file');
      } else {
        this.initializeData();
        this.saveData();
        console.log('✅ Created new JSON database');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      this.initializeData();
      this.saveData();
    }
  }

  initializeData() {
    this.data = {
      users: [],
      incidents: [],
      emergency_contacts: [],
      alerts: [],
      medical_services: [
        {
          id: 1,
          name: "Hôpital Général de Kinshasa",
          type: "hospital",
          phone: "+243123456789",
          address: "Avenue de la Paix, Kinshasa",
          latitude: -4.3275,
          longitude: 15.3136,
          responseTime: 15,
          isActive: true
        },
        {
          id: 2,
          name: "Centre Médical Ngaliema",
          type: "clinic",
          phone: "+243987654321",
          address: "Boulevard Ngaliema, Kinshasa",
          latitude: -4.3026,
          longitude: 15.2682,
          responseTime: 10,
          isActive: true
        },
        {
          id: 3,
          name: "Service d'Ambulance USALAMA",
          type: "ambulance",
          phone: "+243112233445",
          address: "Disponible 24/7",
          latitude: -4.3275,
          longitude: 15.3136,
          responseTime: 8,
          isActive: true
        }
      ]
    };
  }

  saveData() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  }

  findUserByEmail(email) {
    return this.data.users.find(user => user.email === email);
  }

  createUser(userData) {
    const newUser = {
      id: Date.now(),
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  createIncident(incidentData) {
    const newIncident = {
      id: Date.now(),
      ...incidentData,
      status: 'reported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.incidents.push(newIncident);
    this.saveData();
    return newIncident;
  }

  getIncidents(userId) {
    if (userId) {
      return this.data.incidents.filter(incident => incident.userId === userId);
    }
    return this.data.incidents;
  }

  getMedicalServices() {
    return this.data.medical_services.filter(service => service.isActive);
  }

  getNearbyMedicalServices(lat, lng, radius = 5) {
    const services = this.data.medical_services.filter(service => service.isActive);
    
    return services.map(service => {
      const distance = this.calculateDistance(lat, lng, service.latitude, service.longitude);
      return { ...service, distance };
    }).filter(service => service.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
  }

  createAlert(alertData) {
    const newAlert = {
      id: Date.now(),
      ...alertData,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    this.data.alerts.push(newAlert);
    this.saveData();
    return newAlert;
  }

  getActiveAlerts() {
    return this.data.alerts.filter(alert => alert.isActive);
  }

  getStatistics() {
    const incidents = this.data.incidents;
    const users = this.data.users;
    
    return {
      totalUsers: users.length,
      totalIncidents: incidents.length,
      incidentsByType: this.groupBy(incidents, 'type'),
      incidentsBySeverity: this.groupBy(incidents, 'severity'),
      incidentsByStatus: this.groupBy(incidents, 'status'),
      activeAlerts: this.data.alerts.filter(alert => alert.isActive).length,
      medicalServices: this.data.medical_services.filter(service => service.isActive).length
    };
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }
}

const jsonDB = new JSONDatabase();

// Express setup
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
    const stats = jsonDB.getStatistics();
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

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, phone, password, firstName, lastName } = req.body;
    
    const existingUser = jsonDB.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    const newUser = jsonDB.createUser({
      username,
      email,
      phone,
      password,
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
    
    const user = jsonDB.findUserByEmail(email);
    if (!user || user.password !== password) {
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
        token: 'mock-jwt-token'
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
    
    const newIncident = jsonDB.createIncident({
      userId,
      type,
      severity,
      title,
      description,
      location
    });
    
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
    const incidents = jsonDB.getIncidents(userId ? parseInt(userId) : undefined);
    
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
    const services = jsonDB.getMedicalServices();
    
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
    
    const nearbyServices = jsonDB.getNearbyMedicalServices(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
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
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = jsonDB.getActiveAlerts();
    
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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });
  
  socket.on('emergency-request', async (data) => {
    console.log('🚨 Emergency request received:', data);
    
    const emergency = jsonDB.createIncident({
      userId: data.userId,
      type: 'medical',
      severity: 'critical',
      title: 'Emergency Request',
      description: data.description,
      location: data.location
    });
    
    io.emit('emergency-broadcast', {
      ...emergency,
      timestamp: new Date().toISOString()
    });
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

module.exports = { app, server, io };
