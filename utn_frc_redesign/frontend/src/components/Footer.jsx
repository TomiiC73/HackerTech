import UtnLogo from "./UtnLogo";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <UtnLogo className="h-24 mb-4 invert" />
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Facultad Regional Córdoba · Maestro M. López 675, Córdoba, Argentina.
          </p>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Institucional</div>
          <div className="flex flex-col gap-2 text-sm">
            <a href="#carreras" className="hover:text-white transition-colors">Carreras</a>
            <a href="#bedelia" className="hover:text-white transition-colors">Bedelía</a>
            <a href="/signup" className="hover:text-white transition-colors">Inscribite</a>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Comunidad</div>
          <div className="flex flex-col gap-2 text-sm">
            <a href="#accesos" className="hover:text-white transition-colors">Accesos rápidos</a>
            <a href="#noticias" className="hover:text-white transition-colors">Noticias</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        Proyecto de rediseño educativo — HackerTech UTN-FRC. No es un sitio oficial.
      </div>
    </footer>
  );
}
