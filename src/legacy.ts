import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

// ---------- Tipos ----------
type Server = { id: string; name: string; cost: number };
type RevendaServerRow = { count: number; price: number };
type Revenda = {
  id: string;
  nome: string;
  divisoes: number;
  payDate1?: string;
  payDate2?: string;
  servers: Record<string, RevendaServerRow>;
  createdAt?: string;
  updatedAt?: string;
};

type BillingCycle = "mensal" | "bimestral" | "trimestral" | "semestral" | "anual";

type Client = {
  id: string;
  nome?: string;
  painel?: string;
  cycle?: BillingCycle;
  email?: string;
  senha?: string;
  venc?: string; // YYYY-MM-DD
  plano?: number;
  conexoes?: number;
  idExt?: string;
  obs?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

declare global {
  interface Window {
    handleAuth: (mode: "login" | "signup") => Promise<void>;
    toggleModal: (id: string) => void;
    toggleDarkMode: () => void;
    initialize12Servers: (userId: string) => Promise<void>;
    startListening: (userId: string) => void;
    switchView: (v: string) => void;
    openAddRevenda: () => void;
    openEditRevenda: (id: string) => void;
    saveRevenda: () => Promise<void>;
    deleteRevenda: (id: string) => Promise<void>;
    toggleUiMode: () => void;
    logout: () => Promise<void>;
    openAddClient: () => void;
    openEditClient: (id: string) => void;
    saveClient: () => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    openImportClients: () => void;
    previewImport: () => void;
    applyImportToClientForm: () => void;
    importClientsFromText: () => Promise<void>;
    refreshFinance: () => void;
    toggleBulkSelectClients: (force?: boolean) => void;
    bulkSelectAllFilteredClients: () => void;
    bulkDeleteSelectedClients: () => Promise<void>;
    bulkDeleteFilteredClients: () => Promise<void>;
  }
}

// ---------- Estado Global ----------
let currentUserId: string | null = null;
let servers: Server[] = [];
let revendas: Revenda[] = [];
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

const CASINHA_COST: Record<string, number> = { Vision: 2.0, Starplay: 2.5 };
const FULL_SERVERS_LIST = ["Havok Radeon", "Havok Kyros", "Havok Andromeda", "Havok Neon", "Blast Elite", "Blast Flash", "Play Tv", "Primelux", "Starplay", "Vision", "Allbox", "Ryzeen", "Titan"];

// ---------- Helpers de UI e Formatação ----------
function money(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNum(raw: string): number {
  const v = (raw || "").toString().trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isoToday(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function daysBetweenIso(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function syncUiModeLabel() {
  const label = document.getElementById("ui-mode-label");
  if (label) label.textContent = document.body.classList.contains("compact-ui") ? "Mobile" : "Desktop";
}

function updateBulkUi() {
  const bulkbar = document.getElementById("clients-bulkbar");
  const bulkCount = document.getElementById("clients-bulk-count");
  const btn = document.getElementById("btn-bulk");
  if (bulkCount) bulkCount.textContent = String(selectedClientIds.size);
  if (bulkbar) bulkbar.classList.toggle("hidden", !bulkMode);
  if (btn) btn.textContent = bulkMode ? "Selecionando" : "Selecionar";
}

// ---------- Lógica de Dashboard (Barra Superior) ----------
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");
  const metaEl = document.getElementById("top-casinhas-meta");

  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  const filtered = getFilteredClients();
  const totalPlans = filtered.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);

  let qtdStarplay = 0;
  let qtdVision = 0;
  for (const c of filtered) {
    if (c.painel === "Starplay") qtdStarplay++;
    if (c.painel === "Vision") qtdVision++;
  }

  const custoCasinhas = qtdStarplay * 2.5 + qtdVision * 2.0;
  const lucroReal = totalPlans - custoCasinhas;

  totalPlansEl.textContent = money(totalPlans);
  totalCasinhasEl.textContent = money(custoCasinhas);
  realProfitEl.textContent = money(lucroReal);
  if (metaEl) metaEl.textContent = `Starplay: ${qtdStarplay} (R$ 2.50) • Vision: ${qtdVision} (R$ 2.00)`;
}

// ---------- Autenticação e Inicialização ----------
export function installLegacyApp() {
  document.getElementById("btn-login")?.addEventListener("click", () => window.handleAuth("login"));
  document.getElementById("btn-signup")?.addEventListener("click", () => window.handleAuth("signup"));
  document.body.classList.add("compact-ui");

  firebaseApi.onAuthStateChanged(auth, async (user) => {
    const authDiv = document.getElementById("auth-section");
    const appDiv = document.getElementById("app-content");
    if (!authDiv || !appDiv) return;

    if (user) {
      currentUserId = user.uid;
      authDiv.classList.add("hidden");
      appDiv.classList.remove("hidden");
      await window.initialize12Servers(user.uid);
      window.startListening(user.uid);

      document.getElementById("clients-search")?.addEventListener("input", () => {
        renderClientsList();
        refreshTopProfitBar();
      });
      document.querySelectorAll("#clients-filter-server, #clients-filter-cycle").forEach(el => 
        el.addEventListener("change", () => { renderClientsList(); window.refreshFinance(); refreshTopProfitBar(); })
      );

      window.switchView("clients");
    } else {
      currentUserId = null;
      authDiv.classList.remove("hidden");
      appDiv.classList.add("hidden");
    }
  });
  createIcons({ icons });
}

window.handleAuth = async (mode) => {
  const email = (document.getElementById("auth-email") as HTMLInputElement)?.value;
  const password = (document.getElementById("auth-password") as HTMLInputElement)?.value;
  const errorEl = document.getElementById("auth-error");
  if (!email || !password || !errorEl) return;
  try {
    if (mode === "login") await firebaseApi.signInWithEmailAndPassword(auth, email, password);
    else await firebaseApi.createUserWithEmailAndPassword(auth, email, password);
  } catch {
    errorEl.innerText = "Falha no acesso. Verifique as suas credenciais.";
    errorEl.classList.remove("hidden");
  }
};

window.logout = () => firebaseApi.signOut(auth);

// ---------- Navegação ----------
window.switchView = (v) => {
  document.querySelectorAll(".view-section").forEach((s) => s.classList.add("hidden"));
  document.getElementById(`view-${v}`)?.classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(`nav-${v}`)?.classList.add("active");
  if (v === "finance") window.refreshFinance();
  refreshTopProfitBar();
  createIcons({ icons });
};

window.toggleModal = (id) => {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("active");
};

// ---------- Escuta de Dados (Real-time) ----------
window.startListening = (userId) => {
  // Clientes
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "clients"), (snap) => {
    clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
    renderClientsList();
    window.refreshFinance();
    refreshTopProfitBar();
  });
  // Servidores/Painéis
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "servers"), (snap) => {
    servers = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Server[];
  });
  // Revendas
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "revendas"), (snap) => {
    revendas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Revenda[];
    renderRevendasList();
  });
};

// ---------- Clientes (CRUD e Listagem) ----------
function getFilteredClients() {
  const q = (document.getElementById("clients-search") as HTMLInputElement)?.value.toLowerCase().trim() || "";
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value || "";
  const cyc = (document.getElementById("clients-filter-cycle") as HTMLSelectElement)?.value || "";

  return clients.filter(c => {
    if (srv && c.painel !== srv) return false;
    if (cyc && (c.cycle || "mensal") !== cyc) return false;
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.idExt || "").includes(q);
  });
}

function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;
  const filtered = getFilteredClients();
  document.getElementById("clients-count")!.textContent = `${filtered.length}/${clients.length}`;
  updateBulkUi();

  cont.innerHTML = filtered.length ? "" : `<div class="p-6 text-slate-500 luxury-card">Nenhum cliente encontrado.</div>`;
  
  filtered.forEach(c => {
    const div = document.createElement("div");
    div.className = "luxury-card p-5";
    const checked = selectedClientIds.has(c.id);
    div.innerHTML = `
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            ${bulkMode ? `<input type="checkbox" class="bulk-check" ${checked ? "checked" : ""} />` : ""}
            <div class="font-black uppercase text-slate-800 truncate">${c.nome || "Sem nome"}</div>
          </div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">${c.painel || "-"} • ${c.cycle || "mensal"}</div>
          <div class="text-[11px] text-slate-500 mt-1 truncate">${c.email || ""}</div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Venc: ${c.venc || "-"} • ${money(c.plano || 0)}</div>
        </div>
        ${!bulkMode ? `
          <div class="flex flex-col gap-2">
            <button class="bg-slate-100 px-4 py-2 rounded-xl font-black text-xs uppercase" onclick="openEditClient('${c.id}')">Editar</button>
            <button class="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-xs uppercase" onclick="deleteClient('${c.id}')">Apagar</button>
          </div>
        ` : ""}
      </div>
    `;
    if (bulkMode) {
      div.querySelector("input")?.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        target.checked ? selectedClientIds.add(c.id) : selectedClientIds.delete(c.id);
        updateBulkUi();
      });
    }
    cont.appendChild(div);
  });
  createIcons({ icons });
}

window.openAddClient = () => {
  (document.getElementById("client-edit-id") as HTMLInputElement).value = "";
  (document.getElementById("client-modal-title")!).textContent = "Novo Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = "";
  (document.getElementById("client-plano") as HTMLInputElement).value = "20.00";
  window.toggleModal("client-modal");
};

window.openEditClient = (id) => {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  (document.getElementById("client-edit-id") as HTMLInputElement).value = id;
  (document.getElementById("client-modal-title")!).textContent = "Editar Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = c.nome || "";
  (document.getElementById("client-painel") as HTMLInputElement).value = c.painel || "";
  (document.getElementById("client-plano") as HTMLInputElement).value = String(c.plano || "");
  (document.getElementById("client-venc") as HTMLInputElement).value = c.venc || "";
  window.toggleModal("client-modal");
};

window.saveClient = async () => {
  if (!currentUserId) return;
  const id = (document.getElementById("client-edit-id") as HTMLInputElement).value;
  const data = {
    nome: (document.getElementById("client-nome") as HTMLInputElement).value,
    painel: (document.getElementById("client-painel") as HTMLInputElement).value,
    cycle: (document.getElementById("client-cycle") as HTMLSelectElement).value,
    plano: parseNum((document.getElementById("client-plano") as HTMLInputElement).value),
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    updatedAt: new Date().toISOString()
  };
  const path = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data) : await firebaseApi.addDoc(path, { ...data, createdAt: data.updatedAt });
  window.toggleModal("client-modal");
};

window.deleteClient = async (id) => {
  if (currentUserId && confirm("Apagar este cliente?")) {
    await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
  }
};

// ---------- Ações em Massa (Bulk) ----------
window.toggleBulkSelectClients = (force) => {
  bulkMode = force !== undefined ? force : !bulkMode;
  selectedClientIds.clear();
  renderClientsList();
};

window.bulkSelectAllFilteredClients = () => {
  getFilteredClients().forEach(c => selectedClientIds.add(c.id));
  renderClientsList();
};

window.bulkDeleteSelectedClients = async () => {
  if (!currentUserId || !selectedClientIds.size || !confirm(`Apagar ${selectedClientIds.size} clientes?`)) return;
  for (const id of selectedClientIds) {
    await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
  }
  window.toggleBulkSelectClients(false);
};

// ---------- Financeiro ----------
window.refreshFinance = () => {
  const filtered = getFilteredClients();
  const dueSoon = filtered.filter(c => c.venc && daysBetweenIso(isoToday(), c.venc) <= 7).length;
  
  document.getElementById("fin-total-clients")!.textContent = String(filtered.length);
  document.getElementById("fin-due-soon")!.textContent = String(dueSoon);

  const breakdown: Record<string, number> = {};
  filtered.forEach(c => {
    const key = `${c.painel || "Outros"} (${c.cycle || "mensal"})`;
    breakdown[key] = (breakdown[key] || 0) + (c.plano || 0);
  });

  const cont = document.getElementById("fin-breakdown")!;
  cont.innerHTML = Object.entries(breakdown).map(([k, v]) => `
    <div class="flex justify-between border-b border-slate-50 py-2">
      <span class="text-xs font-bold text-slate-500 uppercase">${k}</span>
      <span class="text-xs font-black text-slate-900">${money(v)}</span>
    </div>
  `).join("");
};

// ---------- Revendas ----------
function renderRevendasList() {
  const cont = document.getElementById("revendas-list");
  if (!cont) return;
  cont.innerHTML = revendas.length ? "" : `<div class="p-6 text-slate-500 luxury-card">Nenhum parceiro cadastrado.</div>`;
  revendas.forEach(r => {
    const div = document.createElement("div");
    div.className = "luxury-card p-5";
    div.innerHTML = `
      <div class="font-black text-slate-800 uppercase">${r.nome}</div>
      <div class="text-[10px] text-slate-400 font-bold mt-1">Divisões: ${r.divisoes}</div>
      <div class="flex gap-2 mt-4">
        <button class="bg-slate-100 px-3 py-2 rounded-xl text-[10px] font-black uppercase" onclick="openEditRevenda('${r.id}')">Editar</button>
        <button class="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase" onclick="deleteRevenda('${r.id}')">Apagar</button>
      </div>
    `;
    cont.appendChild(div);
  });
}

// Inicializadores básicos que faltavam
window.toggleDarkMode = () => {
  document.body.classList.toggle("dark-mode");
  createIcons({ icons });
};

window.toggleUiMode = () => {
  document.body.classList.toggle("compact-ui");
  syncUiModeLabel();
};

window.initialize12Servers = async (userId) => {
  const srvPath = firebaseApi.collection(db, "artifacts", appId, "users", userId, "servers");
  const snap = await firebaseApi.getDocs(srvPath);
  if (snap.empty) {
    for (const name of FULL_SERVERS_LIST) {
      await firebaseApi.addDoc(srvPath, { name, cost: 3.0, createdAt: new Date().toISOString() });
    }
  }
};

// Funções de Importação (Stubs necessários para evitar erros)
window.openImportClients = () => window.toggleModal("import-modal");
window.previewImport = () => { /* Lógica de parse de texto */ };
window.applyImportToClientForm = () => { /* Lógica de preenchimento */ };
window.importClientsFromText = async () => { /* Lógica de upload em massa */ };

// Revendas (Stubs necessários)
window.openAddRevenda = () => window.toggleModal("revenda-modal");
window.openEditRevenda = (id) => { /* Lógica edit */ };
window.saveRevenda = async () => { /* Lógica save */ };
window.deleteRevenda = async (id) => { /* Lógica del */ };
