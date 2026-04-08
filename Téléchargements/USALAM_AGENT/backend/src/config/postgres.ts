import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // Temps d'inactivité avant fermeture
  connectionTimeoutMillis: 2000, // Temps d'attente pour une connexion
};

const pool = new Pool(poolConfig);

// Journalisation des erreurs du pool
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export const connectPostgres = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully');
    
    // Vérification de l'extension PostGIS
    const res = await client.query('SELECT PostGIS_Version()');
    console.log(`🌍 PostGIS Version: ${res.rows[0].postgis_version}`);
    
    client.release();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    // On ne stoppe pas le processus ici pour permettre la cohabitation avec MongoDB
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
