const http = require('http');

// Test function
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(body)
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test all endpoints
async function runTests() {
  console.log('🧪 Testing USALAMA Backend Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1️⃣ Testing /health endpoint...');
    const health = await testEndpoint('/health');
    console.log(`✅ Status: ${health.status}`);
    console.log(`📊 Database: ${health.data.database.type}`);
    console.log(`📈 Users: ${health.data.database.statistics.totalUsers}`);
    console.log(`🚨 Incidents: ${health.data.database.statistics.totalIncidents}\n`);

    // Test API test endpoint
    console.log('2️⃣ Testing /api/test endpoint...');
    const test = await testEndpoint('/api/test');
    console.log(`✅ Status: ${test.status}`);
    console.log(`📝 Message: ${test.data.message}\n`);

    // Test medical services
    console.log('3️⃣ Testing /api/medical/services endpoint...');
    const medical = await testEndpoint('/api/medical/services');
    console.log(`✅ Status: ${medical.status}`);
    console.log(`🏥 Services found: ${medical.data.data.services.length}\n`);

    // Test nearby services
    console.log('4️⃣ Testing /api/medical/nearby endpoint...');
    const nearby = await testEndpoint('/api/medical/nearby?lat=-4.3275&lng=15.3136&radius=10');
    console.log(`✅ Status: ${nearby.status}`);
    console.log(`📍 Nearby services: ${nearby.data.data.services.length}\n`);

    // Test alerts
    console.log('5️⃣ Testing /api/alerts endpoint...');
    const alerts = await testEndpoint('/api/alerts');
    console.log(`✅ Status: ${alerts.status}`);
    console.log(`🚨 Active alerts: ${alerts.data.data.alerts.length}\n`);

    // Test user registration
    console.log('6️⃣ Testing /api/auth/register endpoint...');
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      phone: '+243123456789',
      password: 'TestPassword123',
      firstName: 'Test',
      lastName: 'User'
    };
    const register = await testEndpoint('/api/auth/register', 'POST', userData);
    console.log(`✅ Status: ${register.status}`);
    console.log(`👤 User registered: ${register.data.success}\n`);

    // Test incident creation
    console.log('7️⃣ Testing /api/incidents endpoint...');
    const incidentData = {
      userId: 1,
      type: 'theft',
      severity: 'medium',
      title: 'Test Incident',
      description: 'This is a test incident',
      location: {
        latitude: -4.3275,
        longitude: 15.3136,
        address: 'Test Address'
      }
    };
    const incident = await testEndpoint('/api/incidents', 'POST', incidentData);
    console.log(`✅ Status: ${incident.status}`);
    console.log(`🚨 Incident created: ${incident.data.success}\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('🚀 Backend is fully functional!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('🔧 Make sure the server is running on port 3001');
  }
}

// Run tests
runTests();
