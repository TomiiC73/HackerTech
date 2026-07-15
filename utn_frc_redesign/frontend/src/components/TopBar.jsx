const QUICK_LINKS = [
  {
    label: "Autogestión (Sysacad)",
    short: "Autogestión",
    href: "#login",
    icon: (
      <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
    ),
  },
  {
    label: "Universidad Virtual",
    short: "UV",
    href: "#login",
    icon: (
      <path
        d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm-6 6.7V15c0 1.5 2.7 3 6 3s6-1.5 6-3V9.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Webmail institucional",
    short: "Webmail",
    href: "#login",
    icon: (
      <path
        d="M3 6h18v12H3V6zm0 0l9 7 9-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Bolsa de trabajo",
    short: "Bolsa de trabajo",
    href: "#login",
    icon: (
      <path
        d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h12l1 12H4L5 7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function TopBar() {
  return (
    <div className="hidden sm:block bg-navy-950 text-slate-300 text-xs">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-9 flex items-center justify-end gap-1">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.short}
            href={link.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            aria-label={link.label}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {link.icon}
            </svg>
            <span className="font-medium">{link.short}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
