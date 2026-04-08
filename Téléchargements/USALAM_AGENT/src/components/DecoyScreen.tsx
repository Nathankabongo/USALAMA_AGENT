import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun, Wind, Thermometer, Droplets } from 'lucide-react';

// This screen acts as a camouflage when the user is in distress (Stealth Mode)
// It secretly displays a fake weather app while background processes (SOS, recording) continue.
const DecoyScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time (e.g. 14:30)
  const timeStr = currentTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // To avoid suspicion, interactive elements just perform dummy updates
  const [temp, setTemp] = useState(28);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-500 text-white font-sans flex flex-col">
      {/* Fake Status Bar space */}
      <div className="pt-4 flex justify-center">
        <h1 className="text-xl font-medium tracking-wide">Météo</h1>
      </div>

      <div className="flex-1 flex flex-col items-center pt-8 px-6">
        <h2 className="text-3xl font-normal drop-shadow-md">Kinshasa</h2>
        <p className="text-sky-100 mt-1 drop-shadow-sm">Aujourd'hui, {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        <div className="mt-8 flex flex-col items-center">
          <motion.div 
            animate={{ y: [0, -5, 0] }} 
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sun className="w-24 h-24 text-yellow-300 drop-shadow-lg" fill="currentColor" />
          </motion.div>
          <div className="text-[6rem] font-light tracking-tighter leading-none mt-4 drop-shadow-xl" onClick={() => setTemp(temp > 27 ? 27 : 28)}>
            {temp}°
          </div>
          <p className="text-xl font-medium mt-2 drop-shadow-md">Ensoleillé</p>
          <div className="flex gap-4 mt-2 text-sky-100 font-medium">
            <span>Max: 32°</span>
            <span>Min: 22°</span>
          </div>
        </div>

        <div className="w-full bg-white/20 backdrop-blur-md rounded-3xl mt-12 p-6 shadow-xl border border-white/10">
          <div className="grid grid-cols-2 gap-y-6">
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2 text-sky-100 text-sm uppercase tracking-wider font-semibold">
                <Wind className="w-4 h-4" /> Vent
              </div>
              <div className="text-2xl font-medium">12 km/h</div>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2 text-sky-100 text-sm uppercase tracking-wider font-semibold">
                <Droplets className="w-4 h-4" /> Humidité
              </div>
              <div className="text-2xl font-medium">65%</div>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2 text-sky-100 text-sm uppercase tracking-wider font-semibold">
                <CloudRain className="w-4 h-4" /> Précipitations
              </div>
              <div className="text-2xl font-medium">0 mm</div>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2 text-sky-100 text-sm uppercase tracking-wider font-semibold">
                <Thermometer className="w-4 h-4" /> Ressenti
              </div>
              <div className="text-2xl font-medium">30°</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-8 pt-4 px-6">
        <div className="w-full bg-black/10 h-1 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-white/50 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default DecoyScreen;
