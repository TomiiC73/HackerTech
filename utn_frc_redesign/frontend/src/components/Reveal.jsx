import { motion } from "framer-motion";

// Equivalente a AOS/Animista pero con lo que ya tenemos instalado
// (framer-motion): anima una vez cuando el elemento entra en viewport.
// `delay` en segundos permite escalonar tarjetas de una grilla.
export default function Reveal({ children, delay = 0, y = 24, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
