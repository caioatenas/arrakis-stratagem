interface SpiceParticlesProps {
  x: number;
  y: number;
  production: number;
  tipo: string;
}

export function SpiceParticles({ x, y, production, tipo }: SpiceParticlesProps) {
  const count = production >= 12 ? 4 : production >= 8 ? 2 : 1;
  const particles = Array.from({ length: count }, (_, i) => ({
    dx: (Math.sin(i * 2.5) * 12),
    delay: `${i * 0.6}s`,
  }));

  return (
    <g>
      {/* Rich territory golden pulse */}
      {tipo === 'rico' && (
        <circle cx={x} cy={y} r={38} fill="url(#spice-glow)" className="rico-glow" />
      )}
      {/* Floating spice particles */}
      {particles.map((p, i) => (
        <circle key={i} cx={x + p.dx} cy={y - 30} r={1.5}
          fill="hsl(45, 80%, 65%)" className="spice-particle"
          style={{ animationDelay: p.delay }} />
      ))}
    </g>
  );
}
