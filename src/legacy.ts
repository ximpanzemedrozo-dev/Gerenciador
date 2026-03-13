import { auth, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

declare global {
  interface Window {
    handleAuth: (mode: "login" | "signup") => Promise<void>;
    toggleModal: (id: string) => void;
    toggleDarkMode: () => void;

    // stubs para não quebrar enquanto migramos o resto:
    initialize12Servers: (userId: string) => Promise<void>;
    startListening: (userId: string) => void;
    switchView: (v: string) => void;
    switchCasinhaSub: (sub: "clientes" | "revendas") => void;
  }
}

export function installLegacyApp() {
  document.getElementById("btn-login")?.addEventListener("click", () => window.handleAuth("login"));
  document.getElementById("btn-signup")?.addEventListener("click", () => window.handleAuth("signup"));

  firebaseApi.onAuthStateChanged(auth, async (user) => {
    const authDiv = document.getElementById("auth-section");
    const appDiv = document.getElementById("app-content");
    if (!authDiv || !appDiv) return;

    if (user) {
      authDiv.classList.add("hidden");
      appDiv.classList.remove("hidden");
      await window.initialize12Servers(user.uid);
      window.startListening(user.uid);
    } else {
      authDiv.classList.remove("hidden");
      appDiv.classList.add("hidden");
    }
  });

  createIcons({ icons });
}

window.handleAuth = async (mode) => {
  const email = (document.getElementById("auth-email") as HTMLInputElement | null)?.value;
  const password = (document.getElementById("auth-password") as HTMLInputElement | null)?.value;
  const errorEl = document.getElementById("auth-error") as HTMLDivElement | null;

  if (!email || !password || !errorEl) return;

  errorEl.classList.add("hidden");
  errorEl.innerText = "";

  try {
    if (mode === "login") await firebaseApi.signInWithEmailAndPassword(auth, email, password);
    else await firebaseApi.createUserWithEmailAndPassword(auth, email, password);
  } catch {
    errorEl.innerText = "Falha no acesso. Verifique as suas credenciais.";
    errorEl.classList.remove("hidden");
  }
};

window.toggleModal = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("active");
  document.body.style.overflow = el.classList.contains("active") ? "hidden" : "auto";
};

window.toggleDarkMode = () => {
  document.body.classList.toggle("dark-mode");
  const icon = document.getElementById("theme-icon");
  const isDark = document.body.classList.contains("dark-mode");
  icon?.setAttribute("data-lucide", isDark ? "moon" : "sun");
  createIcons({ icons });
};

// stubs (a gente implementa já já)
window.initialize12Servers = async () => {};
window.startListening = () => {};
window.switchView = () => {};
window.switchCasinhaSub = () => {};
