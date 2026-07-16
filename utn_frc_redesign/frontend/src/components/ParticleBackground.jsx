import { useEffect, useRef } from "react";

// Fondo animado liviano (canvas 2D, sin dependencias) para el panel oscuro
// del Hero. Es el espacio "preparado" para un fondo 3D real (Three.js,
// Spline, react-three-fiber): mismo contenedor, misma posicion absoluta
// detras del contenido — cambiar de canvas a un <Canvas> de r3f no
// requeriria tocar el layout del Hero, solo este componente.
export default function ParticleBackground({ particleCount = 60, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrame;
    let particles = [];

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    }

    function initParticles() {
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 1.6 + 0.6) * window.devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.15 * window.devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.15 * window.devicePixelRatio,
        alpha: Math.random() * 0.5 + 0.15,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const maxLinkDist = 130 * window.devicePixelRatio;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < maxLinkDist) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.12 * (1 - dist / maxLinkDist)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(step);
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resize();
    initParticles();
    if (!prefersReducedMotion) {
      step();
    } else {
      // Respeta prefers-reduced-motion: dibuja un frame estatico y no anima.
      step();
      cancelAnimationFrame(animationFrame);
    }

    function handleResize() {
      resize();
      initParticles();
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [particleCount]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
