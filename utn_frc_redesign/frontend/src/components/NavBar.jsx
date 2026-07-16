import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import UtnLogo from "./UtnLogo";

const MENUS = {
  institucional: {
    label: "Institucional",
    columns: [
      {
        title: "La facultad",
        items: [
          { label: "Autoridades", desc: "Decanato y secretarías" },
          { label: "Historia", desc: "Más de 60 años formando ingenieros" },
          { label: "Investigación", desc: "Centros y grupos de I+D" },
        ],
      },
      {
        title: "Comunidad",
        items: [
          { label: "Extensión universitaria", desc: "Cursos y capacitaciones" },
          { label: "Bienestar estudiantil", desc: "Becas y acompañamiento" },
        ],
      },
    ],
  },
  especialidades: {
    label: "Especialidades",
    columns: [
      {
        title: "Ingenierías",
        items: [
          { label: "Ingeniería en Sistemas de Información", desc: "5 años · Grado" },
          { label: "Ingeniería Electrónica", desc: "5 años · Grado" },
          { label: "Ingeniería Civil", desc: "5 años · Grado" },
          { label: "Ingeniería Industrial", desc: "5 años · Grado" },
          { label: "Ingeniería Mecánica", desc: "5 años · Grado" },
          { label: "Ingeniería Química", desc: "5 años · Grado" },
        ],
      },
      {
        title: "Tecnicaturas",
        items: [
          { label: "Tecnicatura en Mecatrónica", desc: "2 años" },
          { label: "Tecnicatura en Programación", desc: "2 años" },
        ],
      },
    ],
  },
  secretarias: {
    label: "Secretarías",
    columns: [
      {
        title: "Académicas",
        items: [
          { label: "Secretaría Académica", desc: "Planes de estudio y correlatividades" },
          { label: "Secretaría de Extensión", desc: "Vínculo con el medio" },
        ],
      },
      {
        title: "Investigación y posgrado",
        items: [
          { label: "Secretaría de Ciencia y Tecnología", desc: "Becas de investigación" },
          { label: "Secretaría de Posgrado", desc: "Especializaciones y doctorados" },
        ],
      },
    ],
  },
};

function MegaMenuItem({ menuKey, openMenu, setOpenMenu }) {
  const menu = MENUS[menuKey];
  const isOpen = openMenu === menuKey;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpenMenu(menuKey)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white transition-colors py-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setOpenMenu(isOpen ? null : menuKey)}
      >
        {menu.label}
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 transition-all duration-200 ${
          isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-1 invisible"
        }`}
      >
        <div className="w-[520px] rounded-2xl border border-slate-200 dark:border-carbon-700 bg-white dark:bg-carbon-900 shadow-premium p-6 grid grid-cols-2 gap-6">
          {menu.columns.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3">
                {col.title}
              </div>
              <ul className="space-y-1">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href="#carreras"
                      className="block px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-carbon-800 transition-colors"
                    >
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.label}
                      </span>
                      <span className="block text-xs text-slate-400">{item.desc}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NavBar({ darkMode, onToggleDarkMode }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/90 dark:bg-carbon-950/90 backdrop-blur border-b border-slate-200 dark:border-carbon-700"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center gap-8">
        <a href="/" className="flex items-center gap-3 shrink-0" aria-label="UTN Facultad Regional Córdoba, ir al inicio">
          <UtnLogo className="w-11 h-11 dark:invert shrink-0" />
          <span className="leading-tight hidden xs:block">
            <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Universidad Tecnológica Nacional</span>
            <span className="block text-[15px] font-extrabold text-navy-900 dark:text-white">Facultad Regional Córdoba</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7" aria-label="Navegación principal">
          <MegaMenuItem menuKey="institucional" openMenu={openMenu} setOpenMenu={setOpenMenu} />
          <MegaMenuItem menuKey="especialidades" openMenu={openMenu} setOpenMenu={setOpenMenu} />
          <MegaMenuItem menuKey="secretarias" openMenu={openMenu} setOpenMenu={setOpenMenu} />
          <a
            href="#bedelia"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white transition-colors"
          >
            Bedelía
          </a>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-carbon-800 transition-colors"
          >
            {darkMode ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
              </svg>
            )}
          </button>
          <a
            href="/signup"
            className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-full text-navy-800 dark:text-white hover:bg-slate-100 dark:hover:bg-carbon-800 transition-colors"
          >
            Inscribite
          </a>
          <motion.a
            href="#login"
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-full bg-navy-800 text-white shadow-sm hover:shadow-premium hover:bg-navy-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            Iniciar sesión
          </motion.a>
          <button
            type="button"
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Abrir menú"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-slate-200 dark:border-carbon-700 px-5 py-4 flex flex-col gap-1" aria-label="Navegación móvil">
          {Object.entries(MENUS).map(([key, menu]) => (
            <a key={key} href="#carreras" className="py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {menu.label}
            </a>
          ))}
          <a href="#bedelia" className="py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Bedelía
          </a>
          <a href="/signup" className="py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Inscribite
          </a>
          <a href="#login" className="mt-2 text-center text-sm font-semibold px-4 py-2.5 rounded-full bg-navy-800 text-white">
            Iniciar sesión
          </a>
        </nav>
      )}
    </header>
  );
}
