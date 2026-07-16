import { motion } from "framer-motion";
import ParticleBackground from "./ParticleBackground";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-carbon-950">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 min-h-[680px]">
        {/* Mitad izquierda: mensaje + CTAs, sobre fondo claro */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-24"
        >
          <span className="inline-flex w-fit items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900/5 dark:bg-white/10 text-xs font-bold tracking-[0.15em] uppercase text-navy-800 dark:text-cyan-300 mb-8">
            Universidad Tecnológica Nacional
          </span>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight text-navy-950 dark:text-white mb-7">
            Formamos a quienes<br />
            <span className="bg-gradient-to-r from-navy-700 to-cyan-500 bg-clip-text text-transparent">
              construyen el futuro.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mb-11">
            Ingeniería, tecnicaturas e investigación aplicada en la Facultad
            Regional Córdoba. Un solo acceso para toda tu vida académica.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <motion.a
              href="/signup"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3.5 rounded-full bg-navy-900 text-white font-semibold shadow-premium transition-colors hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Inscribite ahora
            </motion.a>
            <motion.a
              href="#carreras"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3.5 rounded-full border border-slate-300 dark:border-carbon-600 text-navy-900 dark:text-white font-semibold transition-colors hover:border-navy-500 dark:hover:border-cyan-400"
            >
              Ver carreras
            </motion.a>
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-6 max-w-md">
            <div>
              <dt className="sr-only">Estudiantes</dt>
              <dd className="text-2xl font-extrabold text-navy-900 dark:text-white">15k+</dd>
              <div className="text-xs text-slate-400 mt-0.5">Estudiantes</div>
            </div>
            <div>
              <dt className="sr-only">Carreras</dt>
              <dd className="text-2xl font-extrabold text-navy-900 dark:text-white">12</dd>
              <div className="text-xs text-slate-400 mt-0.5">Carreras</div>
            </div>
            <div>
              <dt className="sr-only">Años</dt>
              <dd className="text-2xl font-extrabold text-navy-900 dark:text-white">60+</dd>
              <div className="text-xs text-slate-400 mt-0.5">Años de historia</div>
            </div>
          </dl>
        </motion.div>

        {/* Mitad derecha: panel oscuro con fondo de particulas — espacio
            preparado para un fondo 3D real (Three.js/Spline/r3f), ver
            ParticleBackground.jsx. */}
        <div className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 overflow-hidden">
          <div
            className="absolute inset-0 opacity-25"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, #22d3ee 0%, transparent 45%), radial-gradient(circle at 80% 70%, #ef5a4f 0%, transparent 40%)",
            }}
          />
          <ParticleBackground className="absolute inset-0 w-full h-full" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full flex items-center justify-center p-10"
          >
            <div className="w-full max-w-sm rounded-3xl bg-white/[0.06] border border-white/10 backdrop-blur-xl p-8 text-white shadow-premium">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300 mb-4">Próximo hito</div>
              <div className="text-xl font-bold mb-2">Inscripciones 2026 abiertas</div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Tecnicaturas universitarias con inicio en agosto. Cupos
                limitados por comisión.
              </p>
              <a
                href="#noticias"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                Ver más
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
