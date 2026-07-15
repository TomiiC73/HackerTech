const CATEGORY_STYLES = {
  Académica: "bg-navy-900/8 text-navy-800 dark:bg-navy-500/20 dark:text-navy-200",
  Extensión: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
  Inscripciones: "bg-coral-500/10 text-coral-600 dark:bg-coral-400/15 dark:text-coral-300",
};

function CategoryTag({ category }) {
  const cls = CATEGORY_STYLES[category] || CATEGORY_STYLES["Académica"];
  return (
    <span className={`inline-flex text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${cls}`}>
      {category}
    </span>
  );
}

function FeaturedCard({ item }) {
  return (
    <article className="group relative col-span-2 row-span-2 rounded-3xl overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-8 flex flex-col justify-end min-h-[280px] transition-all hover:scale-[1.01] shadow-premium">
      <div
        className="absolute inset-0 opacity-25 transition-opacity group-hover:opacity-40"
        aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(circle at 75% 20%, #22d3ee 0%, transparent 45%)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-2.5 mb-4">
          <CategoryTag category={item.category} />
          <span className="text-xs font-semibold text-white/50">{item.date}</span>
        </div>
        <h3 className="text-2xl font-extrabold text-white mb-3 leading-snug">{item.title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-lg">{item.summary}</p>
      </div>
    </article>
  );
}

function RegularCard({ item }) {
  return (
    <article className="group h-full rounded-3xl border border-slate-200 dark:border-carbon-700 bg-white dark:bg-carbon-900 p-6 flex flex-col transition-all hover:scale-[1.02] hover:shadow-premium hover:border-transparent">
      <div className="flex items-center gap-2.5 mb-3">
        <CategoryTag category={item.category} />
        <span className="text-xs font-semibold text-slate-400">{item.date}</span>
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2 leading-snug">{item.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.summary}</p>
    </article>
  );
}

export default function NewsBento({ items = [] }) {
  if (!items.length) return null;

  const [first, ...rest] = items;

  return (
    <section id="noticias" className="py-20 sm:py-28 px-5 sm:px-8 bg-slate-50 dark:bg-carbon-950" aria-labelledby="noticias-title">
      <div className="max-w-7xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-2">Actualidad</div>
        <h2 id="noticias-title" className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white mb-10">
          Noticias y avisos
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[140px]">
          <FeaturedCard item={first} />
          {rest.map((item) => (
            <div key={item.title} className="col-span-2 lg:col-span-1 row-span-2">
              <RegularCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
