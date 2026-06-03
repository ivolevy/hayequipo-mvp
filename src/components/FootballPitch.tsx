import React, { useRef } from 'react';

interface FootballPitchProps {
  children?: React.ReactNode;
  onDropPlayer?: (playerId: string, x: number, y: number) => void;
  halfPitch?: boolean;
}

const FootballPitch: React.FC<FootballPitchProps> = ({ children, onDropPlayer, halfPitch = false }) => {
  const pitchRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (!playerId || !pitchRef.current || !onDropPlayer) return;

    const rect = pitchRef.current.getBoundingClientRect();
    
    // Ensure the drop is within the bounds (0 to 100%)
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to pitch limits to prevent player icons from falling off
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    onDropPlayer(playerId, x, y);
  };

  return (
    <div
      ref={pitchRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full mx-auto bg-emerald-700 border-2 border-white/60 rounded-md overflow-hidden shadow-inner ${
        halfPitch ? 'aspect-[4/3] max-w-[500px]' : 'aspect-[2/3] max-w-[400px]'
      }`}
    >
      {/* Grass Stripes Pattern (CSS Trick using repeating linear gradient) */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: halfPitch
            ? 'repeating-linear-gradient(0deg, transparent, transparent 20%, #000 20%, #000 40%)'
            : 'repeating-linear-gradient(0deg, transparent, transparent 10%, #000 10%, #000 20%)'
        }}
      />

      {halfPitch ? (
        <>
          {/* Half Pitch Markings */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/50 pointer-events-none"></div>
          <div className="absolute top-0 left-1/2 w-24 h-24 border-2 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="absolute bottom-0 left-1/2 w-48 h-24 border-2 border-b-0 border-white/50 -translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/2 w-20 h-8 border-2 border-b-0 border-white/50 -translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-24 left-1/2 w-16 h-8 border-2 border-b-0 border-white/50 rounded-t-full -translate-x-1/2 pointer-events-none"></div>
          
          <div className="absolute bottom-0 left-0 w-4 h-4 border-2 border-l-0 border-b-0 border-white/50 rounded-tr-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-2 border-r-0 border-b-0 border-white/50 rounded-tl-full pointer-events-none"></div>
        </>
      ) : (
        <>
          {/* Midline */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/50 -translate-y-1/2 pointer-events-none"></div>
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          {/* Top Penalty Box */}
          <div className="absolute top-0 left-1/2 w-48 h-24 border-2 border-t-0 border-white/50 -translate-x-1/2 pointer-events-none"></div>
          {/* Top Goal Box */}
          <div className="absolute top-0 left-1/2 w-20 h-8 border-2 border-t-0 border-white/50 -translate-x-1/2 pointer-events-none"></div>
          {/* Top Penalty Arc */}
          <div className="absolute top-24 left-1/2 w-16 h-8 border-2 border-t-0 border-white/50 rounded-b-full -translate-x-1/2 pointer-events-none"></div>

          {/* Bottom Penalty Box */}
          <div className="absolute bottom-0 left-1/2 w-48 h-24 border-2 border-b-0 border-white/50 -translate-x-1/2 pointer-events-none"></div>
          {/* Bottom Goal Box */}
          <div className="absolute bottom-0 left-1/2 w-20 h-8 border-2 border-b-0 border-white/50 -translate-x-1/2 pointer-events-none"></div>
          {/* Bottom Penalty Arc */}
          <div className="absolute bottom-24 left-1/2 w-16 h-8 border-2 border-b-0 border-white/50 rounded-t-full -translate-x-1/2 pointer-events-none"></div>

          {/* Corner Arcs */}
          <div className="absolute top-0 left-0 w-4 h-4 border-2 border-l-0 border-t-0 border-white/50 rounded-br-full pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-2 border-r-0 border-t-0 border-white/50 rounded-bl-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-2 border-l-0 border-b-0 border-white/50 rounded-tr-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-2 border-r-0 border-b-0 border-white/50 rounded-tl-full pointer-events-none"></div>
        </>
      )}

      {children}
    </div>
  );
};

export default FootballPitch;
