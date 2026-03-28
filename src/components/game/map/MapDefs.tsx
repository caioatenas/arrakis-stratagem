// SVG <defs> for filters, gradients, patterns used across the map
export function MapDefs() {
  return (
    <defs>
      {/* Glow filters */}
      <filter id="glow-selected">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-hover">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-soft">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-rico">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-attack">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="drop-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
      </filter>
      <filter id="shield-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Spice particle gradient */}
      <radialGradient id="spice-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(45, 80%, 65%)" stopOpacity="0.6" />
        <stop offset="100%" stopColor="hsl(45, 80%, 65%)" stopOpacity="0" />
      </radialGradient>

      {/* Pin gradients per faction */}
      <linearGradient id="pin-atreides" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5AA0E9" />
        <stop offset="100%" stopColor="#2C5F8A" />
      </linearGradient>
      <linearGradient id="pin-harkonnen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E95A5A" />
        <stop offset="100%" stopColor="#8A2C2C" />
      </linearGradient>
      <linearGradient id="pin-corrino" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D4B36A" />
        <stop offset="100%" stopColor="#8A7230" />
      </linearGradient>
      <linearGradient id="pin-fremen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5AE98A" />
        <stop offset="100%" stopColor="#2C8A4A" />
      </linearGradient>
      <linearGradient id="pin-neutral" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(30, 12%, 45%)" />
        <stop offset="100%" stopColor="hsl(30, 12%, 25%)" />
      </linearGradient>

      <style>{`
        @keyframes dash-flow { to { stroke-dashoffset: -24; } }
        .connection-line { animation: dash-flow 1.5s linear infinite; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .pulse-connection { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes rico-pulse { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.35; } }
        .rico-glow { animation: rico-pulse 3s ease-in-out infinite; }
        @keyframes ring-pulse { 0%, 100% { opacity: 0.3; transform-origin: center; } 50% { opacity: 0.7; } }
        .density-ring-pulse { animation: ring-pulse 2s ease-in-out infinite; }
        @keyframes banner-wave { 0%, 100% { transform: skewX(0deg); } 25% { transform: skewX(1.5deg); } 75% { transform: skewX(-1.5deg); } }
        .banner-wave { animation: banner-wave 3s ease-in-out infinite; }
        @keyframes spice-rise { 0% { opacity: 0.8; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-18px); } }
        .spice-particle { animation: spice-rise 2.5s ease-out infinite; }
        @keyframes shield-rotate { to { stroke-dashoffset: -20; } }
        .shield-rotate { animation: shield-rotate 3s linear infinite; }
      `}</style>
    </defs>
  );
}
