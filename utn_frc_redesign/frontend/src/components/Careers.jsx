import Reveal from "./Reveal";

export default function Careers({ items = [] }) {
  if (!items.length) return null;

  return (
    <section id="carreras" className="py-20 sm:py-28 px-5 sm:px-8 bg-white dark:bg-carbon-900" aria-labelledby="carreras-title">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-2">Oferta académica</div>
          <h2 id="carreras-title" className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white mb-10">
            Carreras de grado
          </h2>
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((career, index) => (
            <Reveal key={career.name} delay={(index % 2) * 0.08}>
              <article className="h-full border border-slate-200 dark:border-carbon-700 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 transition-all hover:-translate-y-1 hover:shadow-premium hover:border-transparent">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-navy-900 dark:text-white mb-2">{career.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{career.description}</p>
                  {career.intermediate_title && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                      Título intermedio: {career.intermediate_title}
                    </p>
                  )}
                </div>
                <div className="shrink-0 sm:w-44 rounded-xl bg-navy-900 dark:bg-navy-800 text-white p-4 flex flex-col justify-center gap-1">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold">Título de grado</div>
                  <div className="font-bold text-sm leading-snug">{career.degree_title}</div>
                  <div className="text-xs text-slate-300">Duración {career.duration}</div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
