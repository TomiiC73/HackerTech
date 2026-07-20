// Toggle claro/oscuro compartido por todas las paginas que extienden
// base.html. El tema inicial ya se aplica inline en el <head> (evita el
// flash de tema equivocado) - esta funcion solo maneja el click del boton.
function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  root.classList.toggle("dark", next === "dark");
  localStorage.setItem("utnfrc-theme", next);
}
