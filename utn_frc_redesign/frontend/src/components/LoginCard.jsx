import { useState } from "react";
import { confirmWithPasskey, login, loginMfa } from "../api";

const FIELD_BASE =
  "w-full px-4 py-3 rounded-xl border bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm outline-none transition-colors text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400";
const FIELD_OK = "border-slate-200 dark:border-white/15 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30";
const FIELD_ERROR = "border-coral-400 ring-2 ring-coral-400/30";

function IdentityFields({ idPrefix, values, onChange, invalid, domainOptions, defaultDomain }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-legajo`} className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Legajo
        </label>
        <input
          id={`${idPrefix}-legajo`}
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
          <label htmlFor={`${idPrefix}-domain`} className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Dominio
          </label>
          <select
            id={`${idPrefix}-domain`}
            required
            value={values.domain}
            onChange={(e) => onChange({ ...values, domain: e.target.value })}
            className={`${FIELD_BASE} ${invalid ? FIELD_ERROR : FIELD_OK}`}
          >
            {(domainOptions.length ? domainOptions : [defaultDomain]).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-password`} className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Contraseña
        </label>
        <input
          id={`${idPrefix}-password`}
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
  const [tab, setTab] = useState("password"); // "password" | "mfa"
  const [formA, setFormA] = useState({ ...EMPTY_FORM, domain: defaultDomain });
  const [formB, setFormB] = useState({ ...EMPTY_FORM, domain: defaultDomain });
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [mfaStep, setMfaStep] = useState("identify"); // "identify" | "confirm"
  const [confirmStatus, setConfirmStatus] = useState({ text: "", tone: "idle" });
  const [confirming, setConfirming] = useState(false);

  async function handleSubmitA(event) {
    event.preventDefault();
    setErrorA("");
    setLoadingA(true);
    try {
      const result = await login(formA);
      if (!result.ok) {
        setErrorA(result.error || "No se pudo iniciar sesión.");
        return;
      }
      window.location.href = result.next;
    } catch {
      setErrorA("Error de conexión con el servidor.");
    } finally {
      setLoadingA(false);
    }
  }

  async function handleSubmitB(event) {
    event.preventDefault();
    setErrorB("");
    setLoadingB(true);
    try {
      const result = await loginMfa(formB);
      if (!result.ok) {
        setErrorB(result.error || "No se pudo iniciar sesión.");
        return;
      }
      setMfaStep("confirm");
    } catch {
      setErrorB("Error de conexión con el servidor.");
    } finally {
      setLoadingB(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setConfirmStatus({ text: "Confirmá en tu dispositivo...", tone: "idle" });
    const result = await confirmWithPasskey();
    if (result.ok) {
      setConfirmStatus({ text: "¡Listo! Entrando...", tone: "success" });
      window.location.href = result.next;
    } else {
      setConfirmStatus({ text: `No se pudo confirmar: ${result.error}`, tone: "error" });
      setConfirming(false);
    }
  }

  return (
    <div
      id="login"
      className="relative rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.05] backdrop-blur-2xl shadow-premium p-8 sm:p-10 w-full max-w-md mx-auto"
    >
      <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-2">Portal UTN-FRC</div>
      <h2 className="text-2xl font-extrabold text-navy-900 dark:text-white mb-7">Iniciar sesión</h2>

      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-slate-900/5 dark:bg-white/5 mb-7" role="tablist" aria-label="Método de inicio de sesión">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "password"}
          onClick={() => setTab("password")}
          className={`flex-1 text-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "password"
              ? "bg-white dark:bg-carbon-800 text-navy-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-navy-700 dark:hover:text-white"
          }`}
        >
          Modo A · Tradicional
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "mfa"}
          onClick={() => setTab("mfa")}
          className={`flex-1 text-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "mfa"
              ? "bg-white dark:bg-carbon-800 text-navy-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-navy-700 dark:hover:text-white"
          }`}
        >
          Modo B · Biométrico
        </button>
      </div>

      {tab === "password" && (
        <div role="tabpanel">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
            Ingresá con tu legajo y contraseña institucional.
          </p>

          {errorA && (
            <div role="alert" className="rounded-xl bg-coral-50 dark:bg-coral-500/10 border border-coral-400/30 text-coral-600 dark:text-coral-300 text-sm px-4 py-3 mb-4">
              {errorA}
            </div>
          )}

          <form onSubmit={handleSubmitA} className="space-y-4" noValidate>
            <IdentityFields
              idPrefix="a"
              values={formA}
              onChange={setFormA}
              invalid={Boolean(errorA)}
              domainOptions={domainOptions}
              defaultDomain={defaultDomain}
            />
            <button
              type="submit"
              disabled={loadingA}
              className="w-full py-3.5 rounded-full bg-navy-900 text-white font-semibold transition-all hover:scale-[1.02] hover:bg-navy-800 disabled:opacity-60 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              {loadingA ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-900/5 dark:bg-white/5 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-200">Cuenta de prueba</b>
            <br />
            Legajo: 45231 · @frc · Contraseña: utn2026
          </div>
        </div>
      )}

      {tab === "mfa" && mfaStep === "identify" && (
        <div role="tabpanel">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
            Ingresá tu legajo y contraseña; después confirmás con rostro,
            huella o llave de seguridad (FIDO2) como segundo factor.
          </p>

          {errorB && (
            <div role="alert" className="rounded-xl bg-coral-50 dark:bg-coral-500/10 border border-coral-400/30 text-coral-600 dark:text-coral-300 text-sm px-4 py-3 mb-4">
              {errorB}
            </div>
          )}

          <form onSubmit={handleSubmitB} className="space-y-4" noValidate>
            <IdentityFields
              idPrefix="b"
              values={formB}
              onChange={setFormB}
              invalid={Boolean(errorB)}
              domainOptions={domainOptions}
              defaultDomain={defaultDomain}
            />
            <button
              type="submit"
              disabled={loadingB}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full bg-cyan-500 text-white font-semibold transition-all hover:scale-[1.02] hover:bg-cyan-600 disabled:opacity-60 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 11c0 4-1 6-2 8M8 9a4 4 0 016-1M6 12c0-5 4-8 8-6.5M16 11c0 5-1 7-2 8M12 14c0 3 .5 5 1 6" />
              </svg>
              {loadingB ? "Verificando..." : "Continuar y confirmar con FIDO2"}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-900/5 dark:bg-white/5 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Necesitás tener una passkey ya registrada. Si todavía no tenés
            una, ingresá primero con la opción tradicional.
          </div>
        </div>
      )}

      {tab === "mfa" && mfaStep === "confirm" && (
        <div role="tabpanel" className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Ya validamos tu legajo y contraseña. Confirmá tu identidad para
            terminar de ingresar.
          </p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            <span className="shrink-0 w-12 h-12 rounded-xl bg-cyan-500 text-white flex items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 11c0 4-1 6-2 8M8 9a4 4 0 016-1M6 12c0-5 4-8 8-6.5M16 11c0 5-1 7-2 8M12 14c0 3 .5 5 1 6" />
              </svg>
            </span>
            <span className="text-left">
              <span className="block font-bold text-navy-900 dark:text-white">Confirmar con Rostro / Huella</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">FIDO2/WebAuthn · Passwordless</span>
            </span>
          </button>
          <div
            role="status"
            aria-live="polite"
            className={`mt-4 text-sm ${
              confirmStatus.tone === "error" ? "text-coral-500" : confirmStatus.tone === "success" ? "text-emerald-500" : "text-slate-400"
            }`}
          >
            {confirmStatus.text}
          </div>
          <button
            type="button"
            onClick={() => setMfaStep("identify")}
            className="mt-3 text-sm font-semibold text-slate-400 hover:text-navy-700 dark:hover:text-white"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
