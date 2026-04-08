// Script de test pour MongoDB
const mongoose = require('mongoose');

async function testMongoDB() {
    const testConnections = [
        {
            name: 'MongoDB Atlas (Cloud)',
            uri: 'mongodb+srv://usalama:usalama123@cluster0.mongodb.net/usalama?retryWrites=true&w=majority'
        },
        {
            name: 'MongoDB Local',
            uri: 'mongodb://localhost:27017/usalama'
        },
        {
            name: 'MongoDB Local Test',
            uri: 'mongodb://127.0.0.1:27017/usalama_test'
        }
    ];

    for (const connection of testConnections) {
        try {
            console.log(`🔍 Test de connexion: ${connection.name}`);
            console.log(`📍 URI: ${connection.uri.replace(/\/\/.*@/, '//***:***@')}`);
            
            await mongoose.connect(connection.uri, {
                serverSelectionTimeoutMS: 3000,
                bufferCommands: false
            });
            
            console.log(`✅ ${connection.name}: Connexion réussie!`);
            console.log(`📊 Base de données: ${mongoose.connection.name}`);
            
            // Test simple
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log(`📋 Collections trouvées: ${collections.length}`);
            
            await mongoose.disconnect();
            console.log(`✅ ${connection.name}: Déconnecté avec succès\n`);
            
            return connection.name;
            
        } catch (error) {
            console.log(`❌ ${connection.name}: Échec de connexion`);
            console.log(`   Erreur: ${error.message}\n`);
            await mongoose.disconnect();
        }
    }
    
    console.log('🔧 Solutions recommandées:');
    console.log('1. MongoDB Atlas: Créez un compte gratuit sur https://www.mongodb.com/atlas');
    console.log('2. MongoDB Local: Installez MongoDB Community Server');
    console.log('3. Docker: Lancez "docker run -d -p 27017:27017 mongo"');
}

testMongoDB().catch(console.error);
