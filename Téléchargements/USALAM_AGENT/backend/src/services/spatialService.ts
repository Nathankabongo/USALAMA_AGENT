import { query } from '../config/postgres';

export interface LocationQuery {
  latitude: number;
  longitude: number;
  radiusInMeters: number;
}

export class SpatialService {
  /**
   * Trouve les incidents à proximité d'une position donnée.
   * Utilise la fonction ST_DWithin de PostGIS sur le type GEOGRAPHY.
   */
  static async findNearbyIncidents(params: LocationQuery) {
    const { latitude, longitude, radiusInMeters } = params;

    const sql = `
      SELECT 
        id, 
        title, 
        type, 
        severity, 
        status, 
        ST_X(location::geometry) as longitude, 
        ST_Y(location::geometry) as latitude,
        ST_Distance(location, ST_MakePoint($1, $2)::geography) as distance_meters
      FROM incidents
      WHERE ST_DWithin(
        location, 
        ST_MakePoint($1, $2)::geography, 
        $3
      )
      ORDER BY distance_meters ASC;
    `;

    try {
      const result = await query(sql, [longitude, latitude, radiusInMeters]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error executing spatial query:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une position est à l'intérieur d'une zone de sécurité (Geofencing).
   * Note: Cette fonction suppose l'existence d'une table 'safe_zones'.
   */
  static async isInsideSafeZone(latitude: number, longitude: number) {
    const sql = `
      SELECT name 
      FROM safe_zones 
      WHERE ST_Contains(
        boundary::geometry, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      );
    `;

    try {
      // Pour l'instant on retourne un tableau vide si la table n'existe pas encore
      const result = await query(sql, [longitude, latitude]);
      return result.rows;
    } catch (error) {
      // Si la table n'existe pas, on loggue l'erreur mais on ne bloque pas
      console.warn('⚠️ Safe zones table might not exist yet.');
      return [];
    }
  }
}
