// Isologo UTN: cuatro arcos con simetria rotacional de 90° que se cruzan
// en el centro con una barra horizontal, mismo espiritu visual que el
// simbolo institucional real. Usa currentColor para heredar el color del
// contenedor (navbar claro vs footer/hero oscuro).
export default function UtnLogo({ withText = true, className = "" }) {
  return (
    <svg
      viewBox={withText ? "0 0 100 132" : "0 0 100 100"}
      className={className}
      role="img"
      aria-label="Universidad Tecnológica Nacional"
    >
      <defs>
        <path
          id="utn-logo-arch"
          d="M50 8 A21 21 0 0 0 29 29 L29 50 L37 50 L37 29 A13 13 0 0 1 50 16 A13 13 0 0 1 63 29 L63 50 L71 50 L71 29 A21 21 0 0 0 50 8 Z"
        />
      </defs>
      <g fill="currentColor">
        <use href="#utn-logo-arch" transform="rotate(0 50 50)" />
        <use href="#utn-logo-arch" transform="rotate(90 50 50)" />
        <use href="#utn-logo-arch" transform="rotate(180 50 50)" />
        <use href="#utn-logo-arch" transform="rotate(270 50 50)" />
        <rect x="20" y="46" width="60" height="8" />
        {withText && (
          <text x="50" y="124" textAnchor="middle" fontWeight="800" fontSize="26" fontFamily="Inter, ui-sans-serif, sans-serif" letterSpacing="1">
            UTN
          </text>
        )}
      </g>
    </svg>
  );
}
