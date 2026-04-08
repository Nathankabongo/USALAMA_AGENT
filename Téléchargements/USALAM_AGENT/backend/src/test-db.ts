import { connectPostgres, query } from './config/postgres';
import { SpatialService } from './services/spatialService';

async function testDatabase() {
  console.log('🚀 Starting Database Connection Test...');
  
  try {
    // 1. Tester la connexion de base
    await connectPostgres();
    console.log('✅ Basic connection established.');

    // 2. Vérifier les extensions
    const extensions = await query('SELECT extname FROM pg_extension;');
    console.log('📦 Installed Extensions:', extensions.rows.map(r => r.extname).join(', '));

    // 3. Tester une requête spatiale complexe
    console.log('🔍 Testing Spatial Query (Find nearby)...');
    const nearby = await SpatialService.findNearbyIncidents({
      latitude: -4.4419, // Kinshasa coordinates
      longitude: 15.2663,
      radiusInMeters: 5000
    });
    
    console.log(`📍 Found ${nearby.length} incidents within 5km.`);
    console.log('✅ Database Test Completed Successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Test Failed:', error);
    process.exit(1);
  }
}

testDatabase();
