# USALAMA AGENT – Application de Sécurité Communautaire

## Description

USALAMA AGENT est une plateforme web mobile-first de sécurité communautaire pour Kinshasa, transformant la protection citoyenne par la technologie.

## Fonctionnalités Principales

- **SOS Intelligent**: Reconnaissance de tap, appui long, double-tap
- **Mode Caméléon**: Interface fantôme (météo, news, calculatrice)
- **Tracking GPS**: Suivi en temps réel avec chiffrement
- **Preuves Audio/Vidéo**: Enregistrement automatique lors des SOS
- **Score de Confiance**: Système de réputation communautaire
- **Offline First**: Fonctionne sans connexion internet
- **PWA Complet**: Installation native et notifications push

## Architecture

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Django + PostGIS (prévu)
- **Base de données**: PostgreSQL avec extensions spatiales
- **Mobile-First**: Design adapté aux smartphones

## Démarrage Rapide

1. Cloner le repository
```bash
git clone <repository-url>
cd USALAM_AGENT
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer le serveur de développement
```bash
npm run dev
```

4. Ouvrir http://localhost:5173 sur votre mobile

## Structure du Projet

```
src/
├── components/     # Composants React
├── hooks/         # Hooks personnalisés
├── pages/         # Écrans de l'application
├── services/      # Services API et stockage
├── types/         # Types TypeScript
└── utils/         # Utilitaires
```

## Auteur

Développé pour la communauté de Kinshasa dans le cadre du projet USALAMA.

## Licence

MIT License - Voir fichier LICENSE pour plus de détails.
