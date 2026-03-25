import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DirectionOverlayProps {
  direction: string | null;
  isVisible: boolean;
}

const DirectionOverlay: React.FC<DirectionOverlayProps> = ({ direction, isVisible }) => {
  const [arrowAnimation, setArrowAnimation] = useState<'pulse' | 'slide'>('pulse');

  useEffect(() => {
    if (direction) {
      setArrowAnimation(direction === 'left' ? 'slide' : 'pulse');
    }
  }, [direction]);

  const getArrowIcon = () => {
    switch (direction) {
      case 'up': return <ArrowUp className="w-12 h-12 text-blue-400" />;
      case 'down': return <ArrowDown className="w-12 h-12 text-blue-400" />;
      case 'left': return <ArrowLeft className="w-12 h-12 text-blue-400" />;
      case 'right': return <ArrowRight className="w-12 h-12 text-blue-400" />;
      default: return null;
    }
  };

  const getAnimationClass = () => {
    switch (arrowAnimation) {
      case 'pulse': return 'animate-pulse';
      case 'slide': return 'animate-bounce';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && direction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute inset-0 flex items-center justify-center z-50"
        >
          <div className={`w-24 h-24 bg-blue-600/30 rounded-full flex items-center justify-center backdrop-blur-sm ${getAnimationClass()}`}>
            {getArrowIcon()}
          </div>
          
          {/* Texte d'instruction */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur rounded-lg px-4 py-2">
            <div className="text-white font-medium text-sm">
              {direction === 'up' && "Tout droit"}
              {direction === 'down' && "Faites demi-tour"}
              {direction === 'left' && "Tournez à gauche"}
              {direction === 'right' && "Tournez à droite"}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DirectionOverlay;
