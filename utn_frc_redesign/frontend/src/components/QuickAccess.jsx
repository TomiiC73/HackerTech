export default function QuickAccess({ items = [] }) {
  if (!items.length) return null;

  return (
    <section id="accesos" className="py-20 sm:py-28 px-5 sm:px-8" aria-labelledby="accesos-title">
      <div className="max-w-7xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-2">Accesos rápidos</div>
        <h2 id="accesos-title" className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white mb-10">
          Todo lo que usás, en un solo lugar
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <a
              key={item.label}
              href="#login"
              className="group bg-white dark:bg-carbon-900 border border-slate-200 dark:border-carbon-700 rounded-2xl p-6 flex flex-col gap-2 shadow-sm transition-all hover:scale-[1.02] hover:shadow-premium hover:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <span
                className="w-10 h-10 rounded-xl bg-navy-900/5 dark:bg-white/5 group-hover:bg-cyan-500/10 flex items-center justify-center mb-1 transition-colors"
                aria-hidden="true"
              >
                <span className="w-4 h-4 rounded bg-navy-800 dark:bg-cyan-400 group-hover:bg-cyan-600 transition-colors" />
              </span>
              <span className="font-bold text-navy-900 dark:text-white">{item.label}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{item.description}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
