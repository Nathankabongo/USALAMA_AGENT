const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const filesToFix = [
  'src/services/automationShortcuts.ts',
  'src/services/externalIntegrations.ts',
  'src/services/analyticsReports.ts',
  'src/services/multiChannelCommunication.ts',
  'src/services/offlineStorage.ts',
  'src/services/survivalMode.ts',
  'src/hooks/useSentinelSOS.ts',
  'src/components/ui/textarea.tsx'
];

// Fonction pour remplacer 'any' par des types plus spécifiques
function fixAnyTypes(content) {
  // Remplacements basiques
  content = content.replace(/: any\b/g, ': unknown');
  content = content.replace(/\): any\b/g, '): unknown');
  content = content.replace(/<any>/g, '<unknown>');
  content = content.replace(/Array<any>/g, 'unknown[]');
  content = content.replace(/\[\]: any\b/g, '[]: unknown');
  
  // Cas spécifiques
  content = content.replace(/event: any\b/g, 'event: Event');
  content = content.replace(/error: any\b/g, 'error: Error');
  content = content.replace(/data: any\b/g, 'data: Record<string, unknown>');
  content = content.replace(/params: any\b/g, 'params: Record<string, unknown>');
  content = content.replace(/response: any\b/g, 'response: unknown');
  
  return content;
}

// Fonction pour corriger les interfaces vides
function fixEmptyInterfaces(content) {
  content = content.replace(/interface \w+ extends \{\}/g, (match) => {
    return match.replace('extends {}', '');
  });
  
  return content;
}

// Fonction pour corriger les dépendances manquantes dans useEffect
function fixUseEffectDeps(content) {
  // Ajouter les dépendances manquantes courantes
  content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/g, (match) => {
    if (match.includes('initializeSOSSystem') || match.includes('cleanupSOSSystem')) {
      return match.replace(/\[\]/, '[initializeSOSSystem, cleanupSOSSystem]');
    }
    return match;
  });
  
  return content;
}

// Traiter chaque fichier
filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`🔧 Correction de ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Appliquer les corrections
    content = fixAnyTypes(content);
    content = fixEmptyInterfaces(content);
    content = fixUseEffectDeps(content);
    
    // Sauvegarder le fichier corrigé
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath} corrigé`);
  } else {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
  }
});

console.log('🎉 Correction automatique terminée !');
