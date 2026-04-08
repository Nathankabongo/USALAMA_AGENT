# 🚀 USALAMA - Système Complet et Autonome

## 📋 Architecture Complète

```
USALAMA-SYSTEM/
├── backend/                    # API REST + WebSocket
│   ├── src/
│   │   ├── database/         # Base de données JSON intégrée
│   │   ├── models/           # Modèles de données
│   │   ├── routes/           # API Endpoints
│   │   ├── middleware/       # Authentification, Validation
│   │   └── services/        # Logique métier
│   ├── data/                # Fichiers de données JSON
│   └── uploads/             # Fichiers uploadés
├── admin-panel/               # Site d'administration
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── pages/           # Pages admin
│   │   ├── services/        # Services API
│   │   └── utils/           # Utilitaires
│   └── public/              # Assets statiques
├── mobile-app/               # Application mobile (existant)
└── database/                # Scripts de migration et sauvegarde
```

## 🎯 Fonctionnalités

### **📊 Base de Données Intégrée**
- **JSON Database** : Fichiers JSON structurés
- **Backup Automatique** : Sauvegardes journalières
- **Migration** : Scripts de mise à jour
- **Sync** : Synchronisation multi-appareils

### **🖥️ Site d'Administration**
- **Dashboard** : Statistiques en temps réel
- **Gestion Utilisateurs** : Création, modification, suppression
- **Gestion Incidents** : Suivi, assignation, résolution
- **Gestion Services** : Médicaux, urgences, alertes
- **Configuration** : Paramètres système
- **Reports** : Rapports et analytics

### **📱 Application Mobile**
- **Authentification** : Login/registration
- **Signalement** : Création d'incidents
- **Services** : Accès aux services médicaux
- **Alertes** : Notifications en temps réel
- **Carte** : Géolocalisation et navigation

## 🔧 Technologies

### **Backend**
- **Node.js** + **Express.js**
- **JSON Database** (sans dépendance externe)
- **Socket.io** (WebSocket)
- **JWT** (Authentification)
- **Multer** (Upload fichiers)
- **Winston** (Logging)

### **Admin Panel**
- **React.js** + **TypeScript**
- **Material-UI** ou **Ant Design**
- **Chart.js** (Graphiques)
- **React Router** (Navigation)
- **Axios** (Appels API)

### **Database**
- **JSON Files** (Structure hiérarchique)
- **Compression** (gzip)
- **Encryption** (AES-256)
- **Versioning** (Git-like)

## 🚀 Déploiement

### **Option 1: Local (Recommandé)**
```bash
# Installation locale
npm run setup-local
npm run start-all
```

### **Option 2: Cloud**
```bash
# Déploiement cloud
npm run build-all
npm run deploy-cloud
```

### **Option 3: Docker**
```bash
# Conteneur Docker
docker-compose up -d
```

## 📊 Base de Données

### **Structure JSON**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@usalama.com",
      "profile": {...},
      "security": {...},
      "createdAt": "2026-03-30T..."
    }
  ],
  "incidents": [...],
  "services": [...],
  "alerts": [...],
  "system": {
    "version": "1.0.0",
    "lastBackup": "2026-03-30T...",
    "statistics": {...}
  }
}
```

### **Fonctionnalités Database**
- **CRUD** : Create, Read, Update, Delete
- **Query** : Recherche et filtrage
- **Index** : Indexation automatique
- **Cache** : Mise en cache intelligente
- **Backup** : Sauvegardes automatiques
- **Restore** : Restauration simple

## 🖥️ Admin Panel Features

### **Dashboard**
- 📊 Statistiques en temps réel
- 📈 Graphiques et métriques
- 🚨 Alertes actives
- 👥 Utilisateurs connectés
- 📱 Incidents récents

### **Gestion Utilisateurs**
- 👤 Création/modification/suppression
- 🔐 Gestion des rôles et permissions
- 📊 Historique des activités
- 🚫 Blocage/déblocage

### **Gestion Incidents**
- 📝 Création et suivi
- 📍 Géolocalisation
- 👥 Assignation aux agents
- 📊 Statistiques et rapports

### **Gestion Services**
- 🏥 Services médicaux
- 🚨 Services d'urgence
- 📞 Contacts d'urgence
- ⏰ Temps de réponse

## 🔄 Migration

### **Scripts de Migration**
```javascript
// migration-v1-to-v2.js
const migrate = async () => {
  // Logique de migration
  // Backup automatique
  // Validation des données
  // Rollback si erreur
};
```

### **Sauvegarde Automatique**
```javascript
// backup.js
const backup = async () => {
  // Sauvegarde quotidienne
  // Compression
  // Upload cloud (optionnel)
  // Nettoyage anciennes sauvegardes
};
```

## 🚀 Getting Started

### **1. Installation**
```bash
git clone https://github.com/your-repo/USALAMA-SYSTEM.git
cd USALAMA-SYSTEM
npm install
```

### **2. Configuration**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

### **3. Démarrage**
```bash
npm run setup      # Initialisation
npm run dev        # Développement
npm run build      # Production
npm run start      # Lancement
```

### **4. Accès**
- **Backend API** : http://localhost:3001
- **Admin Panel** : http://localhost:3002
- **Mobile App** : http://localhost:3003
- **Database** : ./data/ (fichiers JSON)

## 📚 Documentation

### **API Documentation**
- Swagger/OpenAPI
- Postman Collection
- Exemples de code

### **Admin Guide**
- Manuel d'utilisation
- Tutoriels vidéo
- FAQ

### **Developer Guide**
- Architecture
- Contributeurs
- Développement

## 🎯 Prochaines Étapes

1. ✅ Créer la structure de base
2. ✅ Implémenter la base de données JSON
3. ✅ Développer l'API backend
4. 🔄 Créer le panel admin
5. 🔄 Intégrer l'app mobile
6. 🔄 Tests et documentation
7. 🔄 Déploiement production

---

**USALAMA - Système de Sécurité Complet et Autonome** 🚀
