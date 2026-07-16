import { motion } from "framer-motion";
import Spinner from "../Spinner";

const cardVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

// Puramente presentacional: dispara onEnroll/onBack y muestra el estado que
// le pasan. La ceremonia WebAuthn en si (navigator.credentials.create,
// traduccion de errores) vive en api.js/webauthnErrors.js - este componente
// no sabe nada de eso, solo de mostrar el boton y el estado de carga.
export default function SignupStep2Enroll({ enrolling, onEnroll, onBack }) {
  return (
    <motion.div key="step2" variants={cardVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
        Para terminar de crear tu cuenta, registrá tu rostro,
        huella o llave de seguridad (FIDO2). Es obligatorio: sin
        este paso no se genera tu legajo.
      </p>
      <motion.button
        type="button"
        onClick={onEnroll}
        disabled={enrolling}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-4 px-5 py-6 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
      >
        <span className="shrink-0 w-14 h-14 rounded-xl bg-cyan-500 text-white flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 11c0 4-1 6-2 8M8 9a4 4 0 016-1M6 12c0-5 4-8 8-6.5M16 11c0 5-1 7-2 8M12 14c0 3 .5 5 1 6" />
          </svg>
        </span>
        <span className="text-left flex-1">
          <span className="block font-bold text-navy-900 dark:text-white">
            {enrolling ? <Spinner label="Confirmá en tu dispositivo..." /> : "Registrar Biometría / Llave de Seguridad"}
          </span>
          {!enrolling && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">FIDO2/WebAuthn obligatorio</span>}
        </span>
      </motion.button>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm font-semibold text-slate-400 hover:text-navy-700 dark:hover:text-white"
      >
        Volver
      </button>
    </motion.div>
  );
}
