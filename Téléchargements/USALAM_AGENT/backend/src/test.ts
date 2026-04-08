import { connectDatabase } from './config/database';
import { User } from './models/User';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    await connectDatabase();
    
    console.log('✅ Database connected successfully!');
    
    // Test user creation
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      phone: '+243123456789',
      password: 'TestPassword123',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        emergencyContacts: []
      }
    });
    
    console.log('✅ User model created successfully!');
    console.log('🎉 Backend verification completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection();
