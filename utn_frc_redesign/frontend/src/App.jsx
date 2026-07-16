import { useEffect, useState } from "react";
import { getHome } from "./api";
import TopBar from "./components/TopBar";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import LoginCard from "./components/LoginCard";
import QuickAccess from "./components/QuickAccess";
import NewsBento from "./components/NewsBento";
import Careers from "./components/Careers";
import Footer from "./components/Footer";
import SignupStepper from "./components/SignupStepper";

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("utnfrc-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("utnfrc-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return [darkMode, () => setDarkMode((v) => !v)];
}

function HomePage({ home }) {
  return (
    <>
      <Hero />

      {/* Portal de autenticación integrado, superpuesto sobre un fondo
          con contraste para que el efecto glassmorphism de LoginCard
          se note de verdad. */}
      <section className="relative py-20 sm:py-28 px-5 sm:px-8 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-carbon-900 dark:to-carbon-950 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, #1868c7 0%, transparent 45%), radial-gradient(circle at 80% 70%, #22d3ee 0%, transparent 40%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="hidden lg:block">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-3">Portal de acceso</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white leading-tight mb-5">
              Un solo acceso,<br />dos formas de entrar.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              Usá tu legajo y contraseña de siempre, o sumá una
              confirmación biométrica FIDO2 real como segundo factor,
              sin que tu biometría salga nunca de tu dispositivo.
            </p>
          </div>
          <LoginCard domainOptions={home.domain_options} defaultDomain={home.default_domain} />
        </div>
      </section>

      <QuickAccess items={home.quick_access_items} />
      <NewsBento items={home.news_items} />
      <Careers items={home.careers} />

      <section id="bedelia" className="py-20 sm:py-28 px-5 sm:px-8 bg-slate-50 dark:bg-carbon-950 border-t border-slate-200 dark:border-carbon-700">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 mb-2">Bedelía</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white mb-3">Trámites y certificados</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              Certificados de alumno regular, actas de examen,
              equivalencias y trámites administrativos. Atención de lunes
              a viernes de 8 a 20 hs.
            </p>
          </div>
          <a
            href="#login"
            className="justify-self-start lg:justify-self-end px-7 py-3.5 rounded-full bg-navy-900 text-white font-semibold transition-all hover:scale-[1.03] hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            Iniciar un trámite
          </a>
        </div>
      </section>
    </>
  );
}

export default function App() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [home, setHome] = useState({ news_items: [], quick_access_items: [], careers: [], domain_options: [], default_domain: "frc" });
  // Sin react-router: solo dos "paginas" en esta SPA, alcanza con mirar el
  // pathname una vez al montar. Vite sirve index.html para /signup en dev
  // (SPA fallback por defecto), y el navbar/footer se comparten entre las dos.
  const isSignupPage = window.location.pathname === "/signup";

  useEffect(() => {
    getHome()
      .then(setHome)
      .catch(() => {
        // El contenido publico no es critico: si /api/home falla (backend
        // caido), la pagina sigue siendo usable, solo sin noticias/accesos.
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <NavBar darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="flex-1">
        {isSignupPage ? <SignupStepper /> : <HomePage home={home} />}
      </main>

      <Footer />
    </div>
  );
}
