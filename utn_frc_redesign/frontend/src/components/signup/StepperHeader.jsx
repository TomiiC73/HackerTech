import { motion } from "framer-motion";

const STEPS = [
  { n: 1, label: "Datos y carrera" },
  { n: 2, label: "Enrolamiento FIDO2" },
  { n: 3, label: "Legajo asignado" },
];

// Puramente presentacional: solo sabe dibujar el progreso dado el paso
// actual, no conoce formularios ni FIDO2. Reutilizable si el wizard alguna
// vez suma o reordena pasos.
export default function StepperHeader({ current }) {
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
