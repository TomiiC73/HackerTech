import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { enrollSignup, getHome } from "../api";
import Spinner from "./Spinner";
import UtnLogo from "./UtnLogo";

const FIELD_BASE =
  "w-full px-4 py-3 rounded-xl border bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm outline-none transition-colors text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 border-slate-200 dark:border-white/15 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30";

const STEPS = [
  { n: 1, label: "Datos y carrera" },
  { n: 2, label: "Enrolamiento FIDO2" },
  { n: 3, label: "Legajo asignado" },
];

function StepperHeader({ current }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10" aria-label={`Paso ${current} de 3`}>
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{
                backgroundColor: current >= s.n ? "#0b2f5c" : "transparent",
                borderColor: current >= s.n ? "#0b2f5c" : "#cbd5e1",
                color: current >= s.n ? "#ffffff" : "#94a3b8",
              }}
              transition={{ duration: 0.3 }}
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold"
            >
              {current > s.n ? "✓" : s.n}
            </motion.div>
            <span className={`text-[11px] font-semibold hidden sm:block ${current >= s.n ? "text-navy-900 dark:text-white" : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-10 sm:w-16 h-0.5 bg-slate-200 dark:bg-carbon-700 -mt-5 overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-navy-800"
                animate={{ width: current > s.n ? "100%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const cardVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

const EMPTY_FORM = { first_name: "", last_name: "", dni: "", email: "", password: "", career: "" };

export default function SignupStepper() {
  const [careers, setCareers] = useState([]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [legajo, setLegajo] = useState(null);

  useEffect(() => {
    getHome()
      .then((data) => setCareers(data.careers || []))
      .catch(() => {});
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleStep1Submit(event) {
    event.preventDefault();
    setError("");
    if (!form.first_name || !form.last_name || !form.dni || !form.email || !form.password || !form.career) {
      setError("Completá todos los campos.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setStep(2);
  }

  async function handleEnroll() {
    setError("");
    setEnrolling(true);
    const result = await enrollSignup({
      full_name: `${form.first_name} ${form.last_name}`.trim(),
      dni: form.dni,
      email: form.email,
      password: form.password,
      career: form.career,
    });
    setEnrolling(false);

    if (!result.ok) {
      setError(result.error || "No se pudo completar el enrolamiento.");
      return;
    }
    setLegajo(result.legajo);
    setStep(3);
  }

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5 py-16 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-carbon-900 dark:to-carbon-950">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <UtnLogo withText={false} className="w-14 h-14 mx-auto text-navy-900 dark:text-white mb-4" />
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-2">Aspirantes 2026</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">Creá tu cuenta</h1>
        </div>

        <StepperHeader current={step} />

        <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] backdrop-blur-2xl shadow-premium p-8 sm:p-10 overflow-hidden">
          {error && (
            <div role="alert" className="rounded-xl bg-coral-50 dark:bg-coral-500/10 border border-coral-400/30 text-coral-600 dark:text-coral-300 text-sm px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {/* Sin mode="wait": ese modo retrasa el montaje del paso siguiente
              hasta que termine la animacion de salida del anterior, algo
              que depende de requestAnimationFrame y puede quedar
              colgado si la pestaña pierde foco/visibilidad a mitad de
              transicion (verificado: rAF deja de dispararse por completo
              en una pestaña en background). Sin "wait", el contenido nuevo
              se monta de inmediato en cuanto cambia el estado -el fade
              es solo cosmetico, nunca bloquea el flujo real. */}
          <AnimatePresence>
            {step === 1 && (
              <motion.form
                key="step1"
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleStep1Submit}
                className="space-y-4"
                noValidate
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nombre</label>
                    <input id="first_name" type="text" autoComplete="given-name" required
                      value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} className={FIELD_BASE} />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Apellido</label>
                    <input id="last_name" type="text" autoComplete="family-name" required
                      value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} className={FIELD_BASE} />
                  </div>
                </div>
                <div>
                  <label htmlFor="dni" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">DNI</label>
                  <input id="dni" type="text" inputMode="numeric" required
                    value={form.dni} onChange={(e) => updateField("dni", e.target.value)} className={FIELD_BASE} />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email</label>
                  <input id="email" type="email" autoComplete="email" required
                    value={form.email} onChange={(e) => updateField("email", e.target.value)} className={FIELD_BASE} />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Contraseña</label>
                  <input id="password" type="password" autoComplete="new-password" required
                    value={form.password} onChange={(e) => updateField("password", e.target.value)} className={FIELD_BASE} />
                </div>
                <div>
                  <label htmlFor="career" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Carrera</label>
                  <select id="career" required value={form.career} onChange={(e) => updateField("career", e.target.value)} className={`${FIELD_BASE} bg-white dark:bg-carbon-900`}>
                    <option value="" disabled>Elegí una carrera</option>
                    {careers.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-full bg-navy-900 text-white font-semibold transition-colors hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                  Continuar
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={cardVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                  Para terminar de crear tu cuenta, registrá tu rostro,
                  huella o llave de seguridad (FIDO2). Es obligatorio: sin
                  este paso no se genera tu legajo.
                </p>
                <motion.button
                  type="button"
                  onClick={handleEnroll}
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
                  onClick={() => setStep(1)}
                  className="mt-4 text-sm font-semibold text-slate-400 hover:text-navy-700 dark:hover:text-white"
                >
                  Volver
                </button>
              </motion.div>
            )}

            {step === 3 && (
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
                  Tu identidad quedó verificada con FIDO2.
                </p>
                <div className="rounded-2xl bg-navy-900 text-white p-6 mb-8">
                  <div className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold mb-1">Tu número de legajo asignado es</div>
                  <div className="text-3xl font-extrabold tracking-wide">{legajo}</div>
                  <div className="text-xs text-slate-300 mt-1">@frc</div>
                </div>
                <a
                  href="/portal"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-navy-900 text-white font-semibold transition-all hover:scale-[1.02] hover:bg-navy-800"
                >
                  Ir a Mi portal
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
