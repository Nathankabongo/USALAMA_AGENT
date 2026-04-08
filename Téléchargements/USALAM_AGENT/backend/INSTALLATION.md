# 🚀 Installation Backend USALAMA

## ✅ État Actuel
- **Node.js**: v24.11.1 ✅
- **npm**: 11.6.2 ✅
- **Dépendances**: Installées ✅
- **Code TypeScript**: Corrigé ✅

## 📦 Installation MongoDB

### Option 1: MongoDB Atlas (Cloud - Recommandé) 🌥

1. **Créer un compte gratuit**
   - Allez sur https://www.mongodb.com/atlas
   - Inscrivez-vous avec votre email

2. **Créer un cluster**
   - Choisissez "Shared Cluster (Free)"
   - Sélectionnez une région proche (ex: Europe)

3. **Créer un utilisateur de base de données**
   - Username: `usalama`
   - Password: `usalama123`
   - Cliquez sur "Create User"

4. **Configurer l'accès réseau**
   - Ajoutez votre adresse IP: `0.0.0.0/0` (tout accès)
   - Cliquez sur "Add IP Address"

5. **Obtenir la chaîne de connexion**
   - Cliquez sur "Connect" → "Connect your application"
   - Copiez la chaîne de connexion
   - Remplacez `<password>` par `usalama123`

6. **Configurer le backend**
   ```bash
   # Éditer .env
   MONGODB_URI=mongodb+srv://usalama:usalama123@cluster0.mongodb.net/usalama?retryWrites=true&w=majority
   ```

### Option 2: MongoDB Local 💻

1. **Télécharger MongoDB Community**
   - https://www.mongodb.com/try/download/community
   - Choisissez Windows x64

2. **Installer**
   - Lancez le .msi téléchargé
   - Cochez "Install MongoDB as a Service"
   - Cochez "Install MongoDB Compass"

3. **Démarrer le service**
   ```powershell
   # En tant qu'administrateur
   net start MongoDB
   ```

4. **Configurer le backend**
   ```bash
   # Éditer .env
   MONGODB_URI=mongodb://localhost:27017/usalama
   ```

### Option 3: Docker 🐳

1. **Installer Docker Desktop**
   - https://www.docker.com/products/docker-desktop

2. **Lancer MongoDB**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Configurer le backend**
   ```bash
   # Éditer .env
   MONGODB_URI=mongodb://localhost:27017/usalama
   ```

## 🚀 Démarrage du Backend

### 1. Configuration
```bash
cd backend
cp .env.example .env
# Éditer .env avec votre chaîne de connexion MongoDB
```

### 2. Démarrer le serveur
```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

### 3. Vérifier l'installation
```bash
# Test de connexion
npx ts-node src/test.ts

# Health check
curl http://localhost:3001/health
```

## 📋 Vérification

### ✅ Tests à effectuer

1. **Base de données**
   ```bash
   # Vérifier la connexion MongoDB
   npx ts-node src/test.ts
   ```

2. **API Endpoints**
   ```bash
   # Health check
   curl http://localhost:3001/health

   # Inscription
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@example.com","phone":"+243123456789","password":"TestPassword123","profile":{"firstName":"Test","lastName":"User"}}'
   ```

3. **WebSocket**
   - Ouvrez http://localhost:3001 dans votre navigateur
   - Vérifiez la console pour les messages WebSocket

## 🔧 Dépannage

### ❌ Erreurs communes

1. **MongoDB connection failed**
   ```
   Solution: Vérifiez votre chaîne de connexion dans .env
   ```

2. **Port 3001 déjà utilisé**
   ```bash
   # Trouver le processus
   netstat -ano | findstr :30017
   # Tuer le processus
   taskkill /PID <PID> /F
   ```

3. **Module not found**
   ```bash
   # Réinstaller les dépendances
   npm install
   ```

4. **TypeScript errors**
   ```bash
   # Recompiler
   npm run build
   ```

### 📞 Support

- **Documentation**: https://docs.mongodb.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Node.js**: https://nodejs.org/docs

## 🎉 Prochaines étapes

1. ✅ MongoDB installé et configuré
2. ✅ Backend démarré
3. ✅ API fonctionnelle
4. ✅ WebSocket connecté
5. 🔄 Intégration avec le frontend
6. 🔄 Tests complets
7. 🔄 Déploiement en production

---

**Le backend USALAMA est prêt !** 🚀
