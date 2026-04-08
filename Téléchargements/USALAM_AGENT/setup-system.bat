@echo off
echo 🚀 USALAMA - Installation du Système Complet
echo.

echo 📁 Création de la structure de dossiers...
mkdir USALAMA-SYSTEM 2>nul
cd USALAMA-SYSTEM

mkdir backend
mkdir backend\src
mkdir backend\src\database
mkdir backend\src\models
mkdir backend\src\routes
mkdir backend\src\middleware
mkdir backend\src\services
mkdir backend\data
mkdir backend\uploads

mkdir admin-panel
mkdir admin-panel\src
mkdir admin-panel\src\components
mkdir admin-panel\src\pages
mkdir admin-panel\src\services
mkdir admin-panel\src\utils
mkdir admin-panel\public

mkdir database
mkdir database\backups
mkdir database\migrations
mkdir database\scripts

echo ✅ Structure créée avec succès!
echo.

echo 📦 Copie des fichiers existants...
copy "..\backend\package.json" "backend\"
copy "..\backend\tsconfig.json" "backend\"
copy "..\backend\.env.example" "backend\"

xcopy "..\backend\src" "backend\src" /E /I /Y

echo ✅ Fichiers backend copiés!
echo.

echo 🎯 Configuration du système...
cd backend

echo 🔧 Installation des dépendances...
npm install sqlite sqlite3 @types/sqlite3

echo 📊 Création de la base de données...
mkdir data 2>nul

echo 🖥️ Création du panel admin...
cd ..\admin-panel

echo 📦 Initialisation React...
npx create-react-app . --template typescript

echo 🎨 Installation des dépendances admin...
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material @mui/x-data-grid
npm install axios react-router-dom
npm install chart.js react-chartjs-2
npm install @types/node

echo 🔄 Configuration terminée!
echo.

echo 🚀 Démarrage du système...
cd ..\backend
node src/server-simple.js

pause
