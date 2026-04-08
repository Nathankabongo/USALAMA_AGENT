import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/usalama';
    
    await mongoose.connect(mongoUri, {
      // Options de connexion recommandées
      maxPoolSize: 10, // Maintient jusqu'à 10 connexions socket
      serverSelectionTimeoutMS: 5000, // Timeout après 5s
      socketTimeoutMS: 45000, // Timeout après 45s
      bufferCommands: false, // Désactive le buffering mongoose
    });

    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
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

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};
