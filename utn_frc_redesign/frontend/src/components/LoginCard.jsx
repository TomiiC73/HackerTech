import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { confirmWithPasskey, login } from "../api";
import Spinner from "./Spinner";
import Toast from "./Toast";

const stepVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

const FIELD_BASE =
  "w-full px-4 py-3 rounded-xl border bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm outline-none transition-colors text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400";
const FIELD_OK = "border-slate-200 dark:border-white/15 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30";
const FIELD_ERROR = "border-coral-400 ring-2 ring-coral-400/30";

function IdentityFields({ values, onChange, invalid, domainOptions, defaultDomain }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="legajo" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Legajo
        </label>
        <input
          id="legajo"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          required
          aria-invalid={invalid}
          value={values.legajo}
          onChange={(e) => onChange({ ...values, legajo: e.target.value })}
          className={`${FIELD_BASE} ${invalid ? FIELD_ERROR : FIELD_OK}`}
        />
      </div>
      <div className="flex items-end gap-2">
        <span className="pb-3 text-slate-400 font-semibold" aria-hidden="true">
          @
        </span>
        <div className="flex-1">
          <label htmlFor="domain" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Dominio
          </label>
          <select
            id="domain"
            required
            value={values.domain}
            onChange={(e) => onChange({ ...values, domain: e.target.value })}
            className={`${FIELD_BASE} ${invalid ? FIELD_ERROR : FIELD_OK}`}
          >
            {(domainOptions.length ? domainOptions : [defaultDomain]).map((opt) => (
              <option key={opt} value={opt} className="text-slate-900">
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={invalid}
          value={values.password}
          onChange={(e) => onChange({ ...values, password: e.target.value })}
          className={`${FIELD_BASE} ${invalid ? FIELD_ERROR : FIELD_OK}`}
        />
      </div>
    </div>
  );
}

const EMPTY_FORM = { legajo: "", domain: "", password: "" };

export default function LoginCard({ domainOptions = [], defaultDomain = "frc" }) {
  const [step, setStep] = useState("identify"); // "identify" | "confirm"
  const [form, setForm] = useState({ ...EMPTY_FORM, domain: defaultDomain });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState({ text: "", tone: "idle" });
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState(null);

  function backToPasswordMode() {
    // Modo A: el usuario vuelve a identificarse desde cero. No reusamos la
    // contraseña anterior (ya se descarto al pasar a "confirm", ver abajo).
    setToast(null);
    setConfirmStatus({ text: "", tone: "idle" });
    setStep("identify");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(form);
      if (!result.ok) {
        setError(result.error || "No se pudo iniciar sesión.");
        return;
      }
      if (result.next === "/webauthn") {
        // Ya tiene una passkey registrada: falta confirmarla (segundo factor).
        // La contraseña ya cumplio su proposito (identificar al usuario) y
        // no hace falta mantenerla en memoria del componente mas tiempo del
        // necesario.
        setForm((prev) => ({ ...prev, password: "" }));
        setStep("confirm");
      } else {
        // Primer ingreso sin passkey todavia: la contraseña ya alcanzo.
        window.location.href = result.next;
      }
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setToast(null);
    setConfirmStatus({ text: "Confirmá en tu dispositivo...", tone: "idle" });
    const result = await confirmWithPasskey();
    if (result.ok) {
      setConfirmStatus({ text: "¡Listo! Entrando...", tone: "success" });
      window.location.href = result.next;
    } else {
      // Mensaje corto en linea (accesible via aria-live) + toast elegante
      // con la traduccion especifica del error (NotAllowedError si cancelo
      // el prompt, NotSupportedError si el dispositivo no admite FIDO2,
      // etc. - ver webauthnErrors.js) y una salida rapida de vuelta a
      // Modo A, para no dejar al usuario trabado si no puede usar FIDO2.
      setConfirmStatus({ text: "No se pudo confirmar tu identidad.", tone: "error" });
      setConfirming(false);
      setToast({ id: Date.now(), tone: "error", message: result.error });
    }
  }

  return (
    <>
    <div
      id="login"
      className="relative rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.05] backdrop-blur-2xl shadow-premium p-8 sm:p-10 w-full max-w-md mx-auto"
    >
      <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-2">Portal UTN-FRC</div>
      <h2 className="text-2xl font-extrabold text-navy-900 dark:text-white mb-7">Iniciar sesión</h2>

      {/* Sin mode="wait": evita depender de que la animacion de salida
          termine (requestAnimationFrame) para montar el paso siguiente -
          si la pestaña pierde foco a mitad de transicion esa espera puede
          no completarse nunca. El contenido nuevo se monta apenas cambia
          el estado; el fade es solo cosmetico. */}
      <AnimatePresence>
      {step === "identify" && (
        <motion.div key="identify" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
          {error && (
            <div role="alert" className="rounded-xl bg-coral-50 dark:bg-coral-500/10 border border-coral-400/30 text-coral-600 dark:text-coral-300 text-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <IdentityFields
              values={form}
              onChange={setForm}
              invalid={Boolean(error)}
              domainOptions={domainOptions}
              defaultDomain={defaultDomain}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full bg-navy-900 text-white font-semibold transition-all hover:scale-[1.02] hover:bg-navy-800 disabled:opacity-60 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              {loading ? <Spinner label="Verificando..." /> : "Ingresar"}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-900/5 dark:bg-white/5 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-200">Cuenta de prueba</b>
            <br />
            Legajo: 45231 · @frc · Contraseña: utn2026
          </div>
        </motion.div>
      )}

      {step === "confirm" && (
        <motion.div key="confirm" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Ya validamos tu legajo y contraseña. Confirmá tu identidad para
            terminar de ingresar.
          </p>
          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex flex-col items-center justify-center gap-1 px-5 py-5 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            <span className="block font-bold text-navy-900 dark:text-white">Confirmar con Rostro / Huella</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">FIDO2/WebAuthn</span>
          </motion.button>
          <div
            role="status"
            aria-live="polite"
            className={`mt-4 text-sm flex items-center justify-center gap-2 ${
              confirmStatus.tone === "error" ? "text-coral-500" : confirmStatus.tone === "success" ? "text-emerald-500" : "text-slate-400"
            }`}
          >
            {confirming && confirmStatus.tone === "idle" ? <Spinner label={confirmStatus.text} size={16} /> : confirmStatus.text}
          </div>
          <button
            type="button"
            onClick={backToPasswordMode}
            className="mt-3 text-sm font-semibold text-slate-400 hover:text-navy-700 dark:hover:text-white"
          >
            Volver
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
    {/* Fuera del card: su backdrop-blur-2xl crea un containing block para
        position:fixed (igual que transform/filter), asi que un Toast
        anidado ahi adentro quedaria anclado al card en vez del viewport. */}
    <Toast toast={toast} onClose={() => setToast(null)} onAction={backToPasswordMode} actionLabel="Volver a Modo A" />
    </>
  );
}
