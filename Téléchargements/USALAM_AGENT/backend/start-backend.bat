@echo off
echo 🚀 Démarrage du Backend USALAMA...
echo.

echo 📦 Vérification des dépendances...
if not exist node_modules (
    echo Installation des dépendances...
    npm install
)

echo 🔗 Connexion à MongoDB...
echo.

echo 🌐 Démarrage du serveur sur http://localhost:3001
echo.
echo 📋 API Documentation:
echo    Health: http://localhost:3001/health
echo    Auth:   http://localhost:3001/api/auth
echo    Users:  http://localhost:3001/api/users
echo.
echo ⚠️  Appuyez sur Ctrl+C pour arrêter
echo.

npm run dev

pause
