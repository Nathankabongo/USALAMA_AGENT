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
const crypto = require('crypto');

// Database Core Class
class DatabaseCore {
  constructor(config = {}) {
    this.config = {
      dataPath: path.join(__dirname, '../data/usalama.db'),
      backupPath: path.join(__dirname, '../data/backups'),
      autoBackup: true,
      backupInterval: 60, // 1 hour
      ...config
    };

    this.ensureDirectories();
    this.loadData();
    this.startAutoBackup();
  }

  ensureDirectories() {
    const dirs = [
      path.dirname(this.config.dataPath),
      this.config.backupPath
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadData() {
    try {
      if (fs.existsSync(this.config.dataPath)) {
        const fileData = fs.readFileSync(this.config.dataPath, 'utf8');
        this.data = JSON.parse(fileData);
        console.log('✅ Database loaded successfully');
      } else {
        this.initializeDatabase();
        this.saveData();
        console.log('✅ New database created');
      }
    } catch (error) {
      console.error('❌ Error loading database:', error);
      this.initializeDatabase();
      this.saveData();
    }
  }

  initializeDatabase() {
    this.data = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastBackup: null,
      statistics: {
        totalUsers: 0,
        totalIncidents: 0,
        totalServices: 0,
        totalAlerts: 0
      },
      users: [],
      incidents: [],
      services: [],
      alerts: [],
      emergencyContacts: [],
      systemLogs: [],
      settings: {
        autoBackup: this.config.autoBackup,
        backupInterval: this.config.backupInterval,
        maxBackups: 30
      }
    };
  }

  saveData() {
    try {
      const jsonData = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.config.dataPath, jsonData);
      this.updateStatistics();
    } catch (error) {
      console.error('❌ Error saving database:', error);
      throw error;
    }
  }

  updateStatistics() {
    this.data.statistics = {
      totalUsers: this.data.users?.length || 0,
      totalIncidents: this.data.incidents?.length || 0,
      totalServices: this.data.services?.length || 0,
      totalAlerts: this.data.alerts?.length || 0
    };
  }

  startAutoBackup() {
    if (this.config.autoBackup) {
      this.backupTimer = setInterval(() => {
        this.createBackup();
      }, this.config.backupInterval * 60 * 1000);
    }
  }

  // CRUD Operations
  create(collection, record) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }

    const newRecord = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      ...record
    };

    this.data[collection].push(newRecord);
    this.saveData();
    this.addLog('CREATE', collection, newRecord.id);
    
    return newRecord;
  }

  findById(collection, id) {
    return this.data[collection]?.find(record => record.id === id);
  }

  find(collection, query = {}) {
    if (!this.data[collection]) return [];
    
    return this.data[collection].filter(record => {
      return Object.keys(query).every(key => {
        const recordValue = record[key];
        const queryValue = query[key];
        
        if (typeof queryValue === 'object' && queryValue !== null) {
          return Object.keys(queryValue).every(subKey => {
            return recordValue?.[subKey] === queryValue[subKey];
          });
        }
        
        return recordValue === queryValue;
      });
    });
  }

  update(collection, id, updates) {
    const recordIndex = this.data[collection]?.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
      throw new Error(`Record not found in ${collection}`);
    }

    const updatedRecord = {
      ...this.data[collection][recordIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (this.data[collection][recordIndex].version || 0) + 1
    };

    this.data[collection][recordIndex] = updatedRecord;
    this.saveData();
    this.addLog('UPDATE', collection, id);
    
    return updatedRecord;
  }

  delete(collection, id) {
    const recordIndex = this.data[collection]?.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
      return false;
    }

    this.data[collection].splice(recordIndex, 1);
    this.saveData();
    this.addLog('DELETE', collection, id);
    
    return true;
  }

  // Search and Query
  search(collection, searchTerm, fields = []) {
    if (!this.data[collection]) return [];
    
    return this.data[collection].filter(record => {
      const searchFields = fields.length > 0 ? fields : Object.keys(record);
      
      return searchFields.some(field => {
        const value = record[field];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }

  // Backup Operations
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.config.backupPath, `backup-${timestamp}.json`);
    
    try {
      const backupData = {
        ...this.data,
        backupInfo: {
          timestamp: new Date().toISOString(),
          version: this.data.version,
          size: JSON.stringify(this.data).length
        }
      };

      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      this.data.lastBackup = new Date().toISOString();
      this.saveData();
      
      console.log(`✅ Backup created: ${backupFile}`);
      this.cleanupOldBackups();
      
      return backupFile;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  cleanupOldBackups() {
    try {
      const backups = fs.readdirSync(this.config.backupPath)
        .filter(file => file.startsWith('backup-'))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupPath, file),
          time: fs.statSync(path.join(this.config.backupPath, file)).mtime
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      const maxBackups = this.data.settings?.maxBackups || 30;
      
      if (backups.length > maxBackups) {
        const toDelete = backups.slice(maxBackups);
        toDelete.forEach(backup => {
          fs.unlinkSync(backup.path);
          console.log(`🗑️ Deleted old backup: ${backup.name}`);
        });
      }
    } catch (error) {
      console.error('❌ Error cleaning up backups:', error);
    }
  }

  // Logging
  addLog(action, collection, recordId) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action,
      collection,
      recordId,
      user: 'system'
    };

    if (!this.data.systemLogs) {
      this.data.systemLogs = [];
    }

    this.data.systemLogs.push(logEntry);
    
    // Keep only last 1000 logs
    if (this.data.systemLogs.length > 1000) {
      this.data.systemLogs = this.data.systemLogs.slice(-1000);
    }
  }

  getLogs(limit = 100) {
    return (this.data.systemLogs || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Utilities
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getStatistics() {
    return {
      ...this.data.statistics,
      lastBackup: this.data.lastBackup,
      databaseSize: JSON.stringify(this.data).length,
      collections: Object.keys(this.data).filter(key => Array.isArray(this.data[key])),
      settings: this.data.settings
    };
  }

  destroy() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
  }
}

// Initialize database
const database = new DatabaseCore();

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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    const { userId, status, severity } = req.query;
    let query = {};
    
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    
    const incidents = database.find('incidents', query);
    
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

// Services endpoints
app.get('/api/services', async (req, res) => {
  try {
    const { type, active } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (active !== undefined) query.active = active === 'true';
    
    const services = database.find('services', query);
    
    res.json({
      success: true,
      message: 'Services retrieved successfully',
      data: { services }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve services',
      details: error.message
    });
  }
});

// Alerts endpoints
app.get('/api/alerts', async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};
    
    if (active !== undefined) query.active = active === 'true';
    
    const alerts = database.find('alerts', query);
    
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
app.get('/api/statistics', async (req, res) => {
  try {
    const stats = database.getStatistics();
    
    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: { statistics: stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
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
    
    const searchFields = fields ? fields.split(',') : [];
    const results = database.search(collection, query, searchFields);
    
    res.json({
      success: true,
      message: 'Search completed successfully',
      data: { results, count: results.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
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
    } catch (error) {
      socket.emit('emergency-error', { error: error.message });
    }
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
        password: 'admin123',
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
  } catch (error) {
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

module.exports = { app, server, io };
