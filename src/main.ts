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

window.sigmaDB = { db, appId, auth, ...firebaseApi };

const root = document.getElementById("app");
if (!root) throw new Error("#app não encontrado");
root.innerHTML = appHtml;

createIcons({ icons });
installLegacyApp();
