import React, { useEffect, useRef, useState } from 'react';

function Bubble({ style }) {
  return <div className="bubble" style={style} />;
}

export default function Loader({ onDone }) {
  const [hidden, setHidden] = useState(false);

  // Generate random bubbles
  const bubbles = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 5.5) % 100}%`,
    width: `${6 + (i % 5) * 3}px`,
    height: `${6 + (i % 5) * 3}px`,
    animationDuration: `${3 + (i % 4)}s`,
    animationDelay: `${(i * 0.3) % 2.5}s`,
  }));

  useEffect(() => {
    const t = setTimeout(() => {
      setHidden(true);
      setTimeout(onDone, 900);
    }, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`loader-overlay${hidden ? ' hidden' : ''}`} aria-label="Loading NEERVA">
      <div className="bubbles">
        {bubbles.map((b, i) => <Bubble key={i} style={b} />)}
      </div>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        {/* Track + boat */}
        <div className="loader-track">
          <div className="ripple-trail" />
          <div className="loader-boat-wrap">
            <img 
              src="/NEERVA_Logo-removebg-preview.png" 
              alt="NEERVA" 
              style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* Title */}
        <div className="loader-title">NEERVA</div>
        <div className="loader-sub">Marine Intelligence Platform</div>
      </div>

      <div className="loader-ocean">
        <div className="ocean-waves" />
      </div>
    </div>
  );
}
