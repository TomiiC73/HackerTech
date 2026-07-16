import { motion } from "framer-motion";

// Puramente presentacional: solo muestra el legajo que ya se genero y
// confirmo del lado del servidor (ver app.py `_generate_unique_legajo`).
// No genera ni valida nada por su cuenta.
export default function SignupStep3Success({ legajo, domain }) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
        className="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6"
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </motion.div>
      <h2 className="text-xl font-extrabold text-navy-900 dark:text-white mb-2">¡Cuenta creada con éxito!</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
        Ya podés ingresar con tu legajo y contraseña.
      </p>
      <div className="rounded-2xl bg-navy-900 text-white p-6 mb-6">
        <div className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold mb-1">Tu número de legajo asignado es</div>
        <div className="text-3xl font-extrabold tracking-wide">{legajo}</div>
        <div className="text-xs text-slate-300 mt-1">@{domain}</div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-6">
        Desde "Mi portal" vas a poder reforzar tu seguridad activando una
        passkey (huella, PIN o rostro) como acceso sin contraseña.
      </p>
      <a
        href="/portal"
        className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-navy-900 text-white font-semibold transition-all hover:scale-[1.02] hover:bg-navy-800"
      >
        Ir a Mi portal
      </a>
    </motion.div>
  );
}
