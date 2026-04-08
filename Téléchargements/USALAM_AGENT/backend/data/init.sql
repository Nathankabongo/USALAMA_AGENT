-- ============================================================================
-- USALAMA - Script d'initialisation de la Base de Données (PostgreSQL)
-- Optimisé pour les requêtes géospatiales avec PostGIS
-- ============================================================================

-- 1. Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- Pour la génération d'UUID
CREATE EXTENSION IF NOT EXISTS "postgis";       -- Pour le support géospatial

-- 2. Définition des types ENUM (Équivalent aux enums Mongoose)
DO $$ BEGIN
    CREATE TYPE incident_type AS ENUM ('theft', 'assault', 'accident', 'missing', 'fire', 'medical', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('reported', 'investigating', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Création de la table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Profil et préférences (Format flexible JSONB)
    profile_data JSONB DEFAULT '{
        "first_name": "",
        "last_name": "",
        "emergency_contacts": [],
        "preferences": {
            "language": "fr",
            "notifications": {"email": true, "sms": true, "push": true}
        }
    }'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Création de la table des Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type incident_type NOT NULL,
    severity severity_level NOT NULL,
    status incident_status DEFAULT 'reported',
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- GÉOLOCALISATION : Utilisation du type GEOGRAPHY pour la précision (WGS 84)
    -- Geography(Point, 4326) est idéal pour les distances sur Terre (mètres)
    location GEOGRAPHY(Point, 4326) NOT NULL,
    
    -- Données additionnelles (Media, Témoins, Historique)
    media_urls JSONB DEFAULT '{"images": [], "videos": [], "documents": []}'::jsonb,
    witness_data JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. INDEXATION POUR LA PERFORMANCE
-- Index GIST indispensable pour les recherches géospatiales (Distance, Contient...)
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST (location);

-- Index pour les recherches fréquentes par type, statut et utilisateur
CREATE INDEX IF NOT EXISTS idx_incidents_type_status ON incidents (type, status);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents (user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at DESC);

-- 6. DÉCLENCHEURS (TRIGGERS) POUR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_modtime
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EXEMPLES DE REQUÊTES GÉOSPATIALES (À des fins de test)
-- ============================================================================

/*
  -- 1. Trouver tous les incidents de type 'assault' dans un rayon de 5km
  -- ST_DWithin fonctionne directement en mètres avec le type Geography
  SELECT title, description, ST_AsText(location) 
  FROM incidents 
  WHERE type = 'assault' 
  AND ST_DWithin(location, ST_MakePoint(longitude, latitude)::geography, 5000);

  -- 2. Calculer la distance exacte entre l'utilisateur et un incident (en mètres)
  SELECT title, ST_Distance(location, ST_MakePoint(usr_lng, usr_lat)::geography) as distance_m
  FROM incidents
  ORDER BY distance_m ASC;
*/
