import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { signup, getHome } from "../api";
import UtnLogo from "./UtnLogo";
import Toast from "./Toast";
import StepperHeader from "./signup/StepperHeader";
import SignupStep1Form from "./signup/SignupStep1Form";
import SignupStepSuccess from "./signup/SignupStepSuccess";

const EMPTY_FORM = { first_name: "", last_name: "", dni: "", email: "", password: "", career: "" };

// Orquestador del wizard: es el UNICO lugar que conoce el estado del
// formulario y el paso actual. SignupStep1Form/3Success son componentes
// "tontos" que solo reciben props y disparan callbacks - la logica de
// negocio (validacion, cuando avanzar de paso) vive toda aca. Sin FIDO2:
// la cuenta se crea directo con los datos del paso 1, una passkey es algo
// que se registra despues, ya logueado, desde "Mi portal".
export default function SignupStepper() {
  const [careers, setCareers] = useState([]);
  const [careersLoading, setCareersLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [legajo, setLegajo] = useState(null);
  const [domain, setDomain] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getHome()
      .then((data) => setCareers(data.careers || []))
      .catch(() => setCareers([]))
      .finally(() => setCareersLoading(false));
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleStep1Submit(event) {
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

    setSubmitting(true);
    setToast(null);
    const result = await signup({
      full_name: `${form.first_name} ${form.last_name}`.trim(),
      dni: form.dni,
      email: form.email,
      password: form.password,
      career: form.career,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || "No se pudo crear la cuenta.");
      setToast({ id: Date.now(), tone: "error", message: result.error || "No se pudo crear la cuenta." });
      return;
    }
    setLegajo(result.legajo);
    setDomain(result.domain);
    setStep(2);
  }

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5 py-16 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-carbon-900 dark:to-carbon-950">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <UtnLogo className="w-14 h-14 mx-auto dark:invert mb-4" />
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
              <SignupStep1Form
                form={form}
                onFieldChange={updateField}
                careers={careers}
                careersLoading={careersLoading}
                submitting={submitting}
                onSubmit={handleStep1Submit}
              />
            )}
            {step === 2 && <SignupStepSuccess legajo={legajo} domain={domain} />}
          </AnimatePresence>
        </div>
      </div>
      {/* Fuera del card: su backdrop-blur-2xl + overflow-hidden crea un
          containing block para position:fixed y ademas recortaria el
          toast si quedara anidado adentro. */}
      <Toast toast={toast} onClose={() => setToast(null)} onAction={() => setToast(null)} actionLabel="Cerrar" />
    </section>
  );
}
