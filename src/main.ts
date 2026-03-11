import "./styles.css";
import { createIcons, icons } from "lucide";
import { auth, db, appId, firebaseApi } from "./firebase";

declare global {
  interface Window {
    sigmaDB: any;
  }
}

window.sigmaDB = { db, appId, auth, ...firebaseApi };

document.getElementById("app")!.innerHTML = `
  <div class="min-h-screen p-6">
    <div class="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6">
      <h1 class="text-2xl font-black">Gerenciador Inteligente</h1>
      <p class="mt-2 text-slate-600">
        Base Vite + TypeScript + Tailwind criada. Próximo passo: migrar seu HTML/JS do app antigo.
      </p>
    </div>
  </div>
`;

createIcons({ icons });
