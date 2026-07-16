import { motion } from "framer-motion";

const FIELD_BASE =
  "w-full px-4 py-3 rounded-xl border bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm outline-none transition-colors text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 border-slate-200 dark:border-white/15 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30";

const cardVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

// Puramente presentacional: solo junta datos + carrera y delega el envio.
// No sabe nada de FIDO2, legajos ni de los otros pasos - eso es
// responsabilidad de SignupStepper (el orquestador) y de SignupStep2Enroll.
export default function SignupStep1Form({ form, onFieldChange, careers, careersLoading, onSubmit }) {
  return (
    <motion.form
      key="step1"
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      onSubmit={onSubmit}
      className="space-y-4"
      noValidate
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nombre</label>
          <input id="first_name" type="text" autoComplete="given-name" required
            value={form.first_name} onChange={(e) => onFieldChange("first_name", e.target.value)} className={FIELD_BASE} />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Apellido</label>
          <input id="last_name" type="text" autoComplete="family-name" required
            value={form.last_name} onChange={(e) => onFieldChange("last_name", e.target.value)} className={FIELD_BASE} />
        </div>
      </div>
      <div>
        <label htmlFor="dni" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">DNI</label>
        <input id="dni" type="text" inputMode="numeric" required
          value={form.dni} onChange={(e) => onFieldChange("dni", e.target.value)} className={FIELD_BASE} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email</label>
        <input id="email" type="email" autoComplete="email" required
          value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} className={FIELD_BASE} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Contraseña</label>
        <input id="password" type="password" autoComplete="new-password" required
          value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} className={FIELD_BASE} />
      </div>
      <div>
        <label htmlFor="career" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Carrera</label>
        <select
          id="career"
          required
          disabled={careersLoading}
          value={form.career}
          onChange={(e) => onFieldChange("career", e.target.value)}
          className={`${FIELD_BASE} bg-white dark:bg-carbon-900 disabled:opacity-60`}
        >
          <option value="" disabled>
            {careersLoading ? "Cargando carreras..." : "Elegí una carrera"}
          </option>
          {careers.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        {!careersLoading && careers.length === 0 && (
          <p className="mt-1.5 text-xs text-coral-500">
            No se pudieron cargar las carreras. Recargá la página e intentá de nuevo.
          </p>
        )}
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
  );
}
