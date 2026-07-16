// Isologo real de la UTN (frontend/public/utn-logo.png, negro sobre
// transparente). className controla tamaño/color: para fondos oscuros hay
// que agregar un filtro invert (ver NavBar/Footer/SignupStepper) porque una
// imagen rasterizada no hereda currentColor como haría un SVG.
export default function UtnLogo({ className = "" }) {
  return (
    <img
      src="/utn-logo.png"
      alt="Universidad Tecnológica Nacional"
      className={`object-contain ${className}`}
    />
  );
}
