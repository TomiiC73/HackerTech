import { AnimatePresence, motion } from "framer-motion";

const TONE_STYLES = {
  error: "border-coral-400/40 bg-coral-50 dark:bg-coral-500/10 text-coral-700 dark:text-coral-200",
  info: "border-cyan-400/40 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-200",
};

// Alerta flotante para errores de FIDO2/WebAuthn (cancelaste el prompt,
// dispositivo sin soporte, etc.). Vive en position:fixed con z-[100] -
// por encima del NavBar sticky (z-40) y de cualquier fondo animado
// (ParticleBackground u otro), que nunca declaran z-index propio y
// quedan en el stacking context por defecto (auto/0).
export default function Toast({ toast, onClose, onAction, actionLabel }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-6 pointer-events-none" aria-live="assertive">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            role="alert"
            className={`pointer-events-auto w-full max-w-sm rounded-2xl border shadow-premium backdrop-blur-xl px-5 py-4 ${TONE_STYLES[toast.tone] || TONE_STYLES.error}`}
          >
            <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
            <div className="mt-3 flex items-center gap-4">
              {onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className="text-sm font-bold underline underline-offset-2 hover:no-underline"
                >
                  {actionLabel}
                </button>
              )}
              <button type="button" onClick={onClose} className="text-sm font-semibold text-current/70 hover:text-current">
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
