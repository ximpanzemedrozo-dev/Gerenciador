import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

// ---------- Tipos ----------
type Client = { id: string; nome?: string; painel?: string; cycle?: string; email?: string; venc?: string; plano?: number; idExt?: string; };

// ---------- Estado Global ----------
let currentUserId: string | null = null;
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

// ---------- Globais (Window) ----------
declare global {
  interface Window {
    handleAuth: (m: string) => Promise<void>;
    toggleModal: (id: string) => void;
    toggleDarkMode: () => void;
    logout: () => void;
    switchView: (v: string) => void;
    openAddClient: () => void;
    openEditClient: (id: string) => void;
    saveClient: () => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    toggleBulkSelectClients: (f?: boolean) => void;
    bulkSelectAllFilteredClients: () => void;
    bulkDeleteSelectedClients: () => Promise<void>;
    openImportClients: () => void;
    previewImport: () => void;
    importClientsFromText: () => Promise<void>;
    refreshFinance: () => void;
  }
}

// ---------- Helpers ----------
const money = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const parseNum = (s: string) => { const v = s.replace(/\s/g, "").replace(",", "."); const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// ---------- Lógica de Lucro Real (Regra: Starplay=2.5, Vision=2.0, Outros=0) ----------
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");

  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  const totalFaturamento = clients.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);
  const totalCusto = clients.reduce((acc, c) => {
    const p = (c.painel || "").trim();
    if (p === "Starplay") return acc + 2.50;
    if (p === "Vision") return acc + 2.00;
    return acc;
  }, 0);

  totalPlansEl.textContent = money(totalFaturamento);
  totalCasinhasEl.textContent = money(totalCusto);
  realProfitEl.textContent = money(totalFaturamento - totalCusto);
}

// ---------- Renderização e Filtros ----------
function getFilteredClients() {
  const q = ((document.getElementById("clients-search") as HTMLInputElement)?.value || "").toLowerCase().trim();
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value || "";
  const cyc = (document.getElementById("clients-filter-cycle") as HTMLSelectElement)?.value || "";

  return clients.filter(c => {
    if (srv && c.painel !== srv) return false;
    if (cyc && (c.cycle || "mensal") !== cyc) return false;
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.idExt || "").toLowerCase().includes(q) || (c.painel || "").toLowerCase().includes(q);
  });
}

function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;
  const filtered = getFilteredClients();
  document.getElementById("clients-count")!.textContent = `${filtered.length}/${clients.length}`;

  cont.innerHTML = "";
  filtered.forEach(c => {
    const div = document.createElement("div");
    const sel = selectedClientIds.has(c.id);
    div.className = `luxury-card p-5 cursor-pointer border ${sel ? "ring-2 ring-sky-500 bg-sky-50/20" : "border-slate-200 dark:border-slate-800"}`;
    
    div.innerHTML = `
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            ${bulkMode ? `<input type="checkbox" ${sel ? "checked" : ""} class="w-4 h-4 pointer-events-none">` : ""}
            <div class="font-black uppercase text-slate-800 dark:text-white truncate">${c.nome || "Sem nome"}</div>
          </div>
          <div class="text-[10px] font-bold text-slate-400 uppercase mt-1">${c.painel || "Outros"} • ${c.cycle || "mensal"}</div>
          <div class="text-[11px] font-black text-sky-600 mt-2">${money(c.plano || 0)}</div>
        </div>
        ${!bulkMode ? `
          <div class="flex flex-col gap-2">
            <button onclick="window.openEditClient('${c.id}')" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
            <button onclick="window.deleteClient('${c.id}')" class="p-2 bg-red-50 rounded-xl text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>` : ""}
      </div>
    `;
    
    div.onclick = () => {
      if (bulkMode) {
        if (selectedClientIds.has(c.id)) selectedClientIds.delete(c.id);
        else selectedClientIds.add(c.id);
        renderClientsList();
        document.getElementById("clients-bulk-count")!.textContent = String(selectedClientIds.size);
      }
    };
    cont.appendChild(div);
  });
  createIcons({ icons });
}

// ---------- CRUD Implementation ----------
window.openAddClient = () => {
  (document.getElementById("client-edit-id") as HTMLInputElement).value = "";
  (document.getElementById("client-nome") as HTMLInputElement).value = "";
  (document.getElementById("client-plano") as HTMLInputElement).value = "20,00";
  window.toggleModal("client-modal");
};

window.openEditClient = (id) => {
  const c = clients.find(x => x.id === id); if (!c) return;
  (document.getElementById("client-edit-id") as HTMLInputElement).value = id;
  (document.getElementById("client-modal-title")!).textContent = "Editar Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = c.nome || "";
  (document.getElementById("client-painel") as HTMLSelectElement).value = c.painel || "Starplay";
  (document.getElementById("client-cycle") as HTMLSelectElement).value = c.cycle || "mensal";
  (document.getElementById("client-venc") as HTMLInputElement).value = c.venc || "";
  (document.getElementById("client-plano") as HTMLInputElement).value = (c.plano || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  (document.getElementById("client-idext") as HTMLInputElement).value = c.idExt || "";
  window.toggleModal("client-modal");
};

window.saveClient = async () => {
  if (!currentUserId) return;
  const id = (document.getElementById("client-edit-id") as HTMLInputElement).value;
  const data = {
    nome: (document.getElementById("client-nome") as HTMLInputElement).value,
    painel: (document.getElementById("client-painel") as HTMLSelectElement).value,
    cycle: (document.getElementById("client-cycle") as HTMLSelectElement).value,
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    plano: parseNum((document.getElementById("client-plano") as HTMLInputElement).value),
    idExt: (document.getElementById("client-idext") as HTMLInputElement).value,
    updatedAt: new Date().toISOString()
  };
  const path = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data) : await firebaseApi.addDoc(path, data);
  window.toggleModal("client-modal");
};

window.deleteClient = async (id) => { if(confirm("Apagar cliente?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); };

// ---------- Ações e Init ----------
window.toggleBulkSelectClients = (f) => { bulkMode = f ?? !bulkMode; selectedClientIds.clear(); document.getElementById("clients-bulkbar")?.classList.toggle("hidden", !bulkMode); renderClientsList(); };
window.bulkSelectAllFilteredClients = () => { getFilteredClients().forEach(c => selectedClientIds.add(c.id)); renderClientsList(); document.getElementById("clients-bulk-count")!.textContent = String(selectedClientIds.size); };
window.bulkDeleteSelectedClients = async () => { if(confirm(`Apagar ${selectedClientIds.size}?`)) { for(let id of selectedClientIds) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); window.toggleBulkSelectClients(false); } };

export function installLegacyApp() {
  firebaseApi.onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid; document.getElementById("auth-section")?.classList.add("hidden"); document.getElementById("app-content")?.classList.remove("hidden");
      firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", user.uid, "clients"), snap => {
        clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]; renderClientsList(); refreshTopProfitBar();
      });
      document.getElementById("clients-search")?.addEventListener("input", renderClientsList);
      document.getElementById("clients-filter-server")?.addEventListener("change", renderClientsList);
      document.getElementById("clients-filter-cycle")?.addEventListener("change", renderClientsList);
    } else { document.getElementById("auth-section")?.classList.remove("hidden"); document.getElementById("app-content")?.classList.add("hidden"); }
  });
}

window.handleAuth = async (m) => {
  const e = (document.getElementById("auth-email") as HTMLInputElement).value;
  const p = (document.getElementById("auth-password") as HTMLInputElement).value;
  try { if (m === "login") await firebaseApi.signInWithEmailAndPassword(auth, e, p); } catch { alert("Erro de acesso."); }
};
window.logout = () => firebaseApi.signOut(auth);
window.toggleModal = (id) => document.getElementById(id)?.classList.toggle("active");
window.toggleDarkMode = () => { document.body.classList.toggle("dark-mode"); createIcons({ icons }); };
window.switchView = (v) => { document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden")); document.getElementById(`view-${v}`)?.classList.remove("hidden"); document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active")); document.getElementById(`nav-${v}`)?.classList.add("active"); createIcons({ icons }); };
window.openImportClients = () => window.toggleModal("import-modal");
window.previewImport = () => {}; window.importClientsFromText = async () => {}; window.refreshFinance = () => {};
