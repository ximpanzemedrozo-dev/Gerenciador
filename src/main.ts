import "./styles.css";
import { createIcons, icons } from "lucide";
import { auth, db, appId, firebaseApi } from "./firebase";
import { appHtml } from "./ui/appHtml";
import { installLegacyApp } from "./legacy";

declare global {
  interface Window {
    sigmaDB: any;
  }
}

// bridge global (mantém compatibilidade com o seu código legado)
window.sigmaDB = { db, appId, auth, ...firebaseApi };

// injeta o HTML do app (body inteiro vira template string)
const root = document.getElementById("app");
if (!root) throw new Error("#app não encontrado no index.html");
root.innerHTML = appHtml;

// renderiza os ícones (lucide)
createIcons({ icons });

// instala handlers + listeners (auth, botões etc.)
installLegacyApp();
