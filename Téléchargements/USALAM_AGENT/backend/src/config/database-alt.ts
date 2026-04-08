import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Option 1: MongoDB Atlas (Cloud - Recommandé)
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://usalama:usalama123@cluster0.mongodb.net/usalama?retryWrites=true&w=majority';
    
    // Option 2: MongoDB Local (si installé)
    // const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/usalama';
    
    // Option 3: In-memory MongoDB pour les tests
    // const mongoUri = 'mongodb://127.0.0.1:27017/usalama_test';
    
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    console.log('✅ Connected to MongoDB successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    // Écouter les événements de connexion
    mongoose.connection.on('error', (error: any) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Test simple
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Available collections: ${collections.length}`);

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    
    // Instructions pour l'utilisateur
    console.log('\n🔧 Solutions possibles:');
    console.log('1. Installer MongoDB Community Server localement');
    console.log('2. Créer un compte gratuit MongoDB Atlas');
    console.log('3. Utiliser Docker pour MongoDB');
    
    process.exit(1);
  }
};
