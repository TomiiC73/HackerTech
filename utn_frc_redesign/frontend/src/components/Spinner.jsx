// Loader elegante (SVG + CSS, sin dependencias de Lottie): un anillo con
// gradiente que gira, mas liviano que cargar un runtime de animaciones
// para un solo spinner. `label` es el texto leido por lectores de pantalla
// y mostrado al lado.
export default function Spinner({ label = "Cargando...", size = 20, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} role="status">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
        <path d="M21.5 12a9.5 9.5 0 00-9.5-9.5" stroke="url(#spinner-gradient)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span>{label}</span>
    </span>
  );
}
