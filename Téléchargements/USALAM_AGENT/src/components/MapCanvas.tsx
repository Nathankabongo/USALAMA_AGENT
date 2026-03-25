import React from 'react';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';
import { PositionData, MapState, MapDrawing, NavigationCommand } from '../types/copilot';

interface MapCanvasProps {
  currentPosition: PositionData | null;
  mapDrawings: MapDrawing[];
  dangerZones: NavigationCommand[];
  onMapStateChange: (state: Partial<MapState>) => void;
  mapState: MapState;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  currentPosition, 
  mapDrawings, 
  dangerZones, 
  onMapStateChange, 
  mapState 
}) => {
  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* Carte simulée */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-slate-600 text-center">
          <Map className="w-16 h-16 mx-auto mb-2" />
          <div className="text-sm">Carte de navigation partagée</div>
        </div>
      </div>

      {/* Zones de danger */}
      {dangerZones.filter(cmd => cmd.type === 'danger').map((cmd) => (
        <motion.div
          key={cmd.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute w-8 h-8 bg-red-600 rounded-full border-2 border-white animate-pulse"
          style={{
            left: `${cmd.data.position.x}%`,
            top: `${cmd.data.position.y}%`
          }}
        />
      ))}

      {/* Dessins partagés */}
      <svg className="absolute inset-0 pointer-events-none">
        {mapDrawings.map((drawing) => (
          <g key={drawing.id}>
            {drawing.type === 'path' && drawing.points.length > 1 && (
              <polyline
                points={drawing.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={drawing.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        ))}
      </svg>

      {/* Position actuelle */}
      {currentPosition && (
        <div
          className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          style={{
            left: `${(currentPosition.lng - mapState.center.lng + 0.01) * 5000}%`,
            top: `${-(currentPosition.lat - mapState.center.lat + 0.01) * 5000}%`
          }}
        >
          <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
