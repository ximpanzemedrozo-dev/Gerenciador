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
const FULL_SERVERS_LIST = [
  "Havok Radeon", "Havok Kyros", "Havok Andromeda", "Havok Neon",
  "Blast Elite", "Blast Flash", "Play Tv", "Primelux",
  "Starplay", "Vision", "Allbox", "Ryzeen", "Titan"
];

// ---------- Helpers de Formatação e Data ----------
function money(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNum(raw: string): number {
  const v = (raw || "").toString().trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetweenIso(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function tryParsePtDateLineToIso(line: string): string {
  const m = line.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeServerName(raw: string): string {
  const s = raw.toUpperCase();
  if (s.includes("STARPLAY")) return "Starplay";
  if (s.includes("VISION")) return "Vision";
  if (s.includes("PRIME")) return "Primelux";
  if (s.includes("BLAST ELITE")) return "Blast Elite";
  if (s.includes("BLAST FLASH")) return "Blast Flash";
  if (s.includes("PLAY TV")) return "Play Tv";
  return "";
}

function isNoiseNameLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 3) return true;
  if (/IPTV|Venc|Plano|R\$|Conex/i.test(t)) return true;
  if (tryParsePtDateLineToIso(t)) return true;
  return false;
}

// ---------- UI e Dashboard ----------
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

// ---------- Autenticação e Navegação ----------
export function installLegacyApp() {
  document.getElementById("btn-login")?.addEventListener("click", () => window.handleAuth("login"));
  document.getElementById("btn-signup")?.addEventListener("click", () => window.handleAuth("signup"));

  firebaseApi.onAuthStateChanged(auth, async (user) => {
    const authDiv = document.getElementById("auth-section");
    const appDiv = document.getElementById("app-content");
    if (user) {
      currentUserId = user.uid;
      authDiv?.classList.add("hidden");
      appDiv?.classList.remove("hidden");
      await window.initialize12Servers(user.uid);
      window.startListening(user.uid);
      window.switchView("clients");
    } else {
      currentUserId = null;
      authDiv?.classList.remove("hidden");
      appDiv?.classList.add("hidden");
    }
  });
}

window.handleAuth = async (mode) => {
  const email = (document.getElementById("auth-email") as HTMLInputElement).value;
  const password = (document.getElementById("auth-password") as HTMLInputElement).value;
  try {
    if (mode === "login") await firebaseApi.signInWithEmailAndPassword(auth, email, password);
    else await firebaseApi.createUserWithEmailAndPassword(auth, email, password);
  } catch (err) { alert("Erro na autenticação."); }
};

window.logout = () => firebaseApi.signOut(auth);

window.switchView = (v) => {
  document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden"));
  document.getElementById(`view-${v}`)?.classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`nav-${v}`)?.classList.add("active");
  if (v === "finance") window.refreshFinance();
  refreshTopProfitBar();
  createIcons({ icons });
};

window.toggleModal = (id) => {
  const el = document.getElementById(id);
  el?.classList.toggle("active");
};

// ---------- Clientes (CRUD) ----------
function getFilteredClients() {
  const q = (document.getElementById("clients-search") as HTMLInputElement)?.value.toLowerCase().trim() || "";
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value || "";
  const cyc = (document.getElementById("clients-filter-cycle") as HTMLSelectElement)?.value || "";

  return clients.filter(c => {
    if (srv && c.painel !== srv) return false;
    if (cyc && (c.cycle || "mensal") !== cyc) return false;
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });
}

function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;
  const filtered = getFilteredClients();
  document.getElementById("clients-count")!.textContent = `${filtered.length}/${clients.length}`;
  updateBulkUi();

  cont.innerHTML = "";
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
  (document.getElementById("client-email") as HTMLInputElement).value = "";
  (document.getElementById("client-painel") as HTMLInputElement).value = "";
  (document.getElementById("client-venc") as HTMLInputElement).value = "";
  (document.getElementById("client-plano") as HTMLInputElement).value = "20.00";
  window.toggleModal("client-modal");
};

window.openEditClient = (id) => {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  (document.getElementById("client-edit-id") as HTMLInputElement).value = id;
  (document.getElementById("client-modal-title")!).textContent = "Editar Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = c.nome || "";
  (document.getElementById("client-email") as HTMLInputElement).value = c.email || "";
  (document.getElementById("client-painel") as HTMLInputElement).value = c.painel || "";
  (document.getElementById("client-venc") as HTMLInputElement).value = c.venc || "";
  (document.getElementById("client-plano") as HTMLInputElement).value = String(c.plano || "");
  window.toggleModal("client-modal");
};

window.saveClient = async () => {
  if (!currentUserId) return;
  const id = (document.getElementById("client-edit-id") as HTMLInputElement).value;
  const data = {
    nome: (document.getElementById("client-nome") as HTMLInputElement).value,
    email: (document.getElementById("client-email") as HTMLInputElement).value,
    painel: (document.getElementById("client-painel") as HTMLInputElement).value,
    cycle: (document.getElementById("client-cycle") as HTMLSelectElement).value,
    plano: parseNum((document.getElementById("client-plano") as HTMLInputElement).value),
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    updatedAt: new Date().toISOString()
  };
  const coll = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data) 
     : await firebaseApi.addDoc(coll, { ...data, createdAt: data.updatedAt });
  window.toggleModal("client-modal");
};

window.deleteClient = async (id) => {
  if (currentUserId && confirm("Apagar cliente?")) {
    await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
  }
};

// ---------- Importação (Parsing) ----------
function parseClientBlock(text: string, forcedServer: string): Partial<Client> {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result: Partial<Client> = { painel: forcedServer || normalizeServerName(text), cycle: "mensal", plano: 20 };

  lines.forEach(line => {
    if (line.includes("@")) result.email = line;
    const isoDate = tryParsePtDateLineToIso(line);
    if (isoDate) result.venc = isoDate;
    if (line.includes("R$") || line.toLowerCase().includes("plano")) {
      const p = parseNum(line.replace(/[^0-9,.]/g, ""));
      if (p > 0) result.plano = p;
    }
    if (!result.nome && !isNoiseNameLine(line)) result.nome = line;
  });
  return result;
}

window.openImportClients = () => window.toggleModal("import-modal");

window.previewImport = () => {
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const srv = (document.getElementById("import-server") as HTMLSelectElement).value;
  const blocks = text.split(/IPTV|Criado em/i).filter(b => b.trim().length > 10);
  const data = parseClientBlock(blocks[0] || text, srv);
  document.getElementById("import-preview")!.textContent = JSON.stringify(data, null, 2);
};

window.applyImportToClientForm = () => {
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const srv = (document.getElementById("import-server") as HTMLSelectElement).value;
  const data = parseClientBlock(text, srv);
  window.openAddClient();
  if (data.nome) (document.getElementById("client-nome") as HTMLInputElement).value = data.nome;
  if (data.email) (document.getElementById("client-email") as HTMLInputElement).value = data.email;
  if (data.painel) (document.getElementById("client-painel") as HTMLInputElement).value = data.painel;
  if (data.venc) (document.getElementById("client-venc") as HTMLInputElement).value = data.venc;
  window.toggleModal("import-modal");
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const srv = (document.getElementById("import-server") as HTMLSelectElement).value;
  const blocks = text.split(/IPTV|Criado em/i).filter(b => b.trim().length > 10);
  
  if (!blocks.length || !confirm(`Importar ${blocks.length} clientes?`)) return;

  const bar = document.getElementById("import-bar");
  const status = document.getElementById("import-status");

  for (let i = 0; i < blocks.length; i++) {
    const data = parseClientBlock(blocks[i], srv);
    await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
      ...data, createdAt: new Date().toISOString()
    });
    const pct = Math.round(((i + 1) / blocks.length) * 100);
    if (bar) bar.style.width = `${pct}%`;
    if (status) status.textContent = `${i + 1}/${blocks.length}`;
  }
  alert("Importação concluída!");
  window.toggleModal("import-modal");
};

// ---------- Financeiro e Escuta ----------
window.refreshFinance = () => {
  const filtered = getFilteredClients();
  const dueSoon = filtered.filter(c => c.venc && daysBetweenIso(isoToday(), c.venc) <= 7).length;
  document.getElementById("fin-total-clients")!.textContent = String(filtered.length);
  document.getElementById("fin-due-soon")!.textContent = String(dueSoon);

  const breakdown: Record<string, number> = {};
  filtered.forEach(c => {
    const k = `${c.painel || "Outros"} (${c.cycle || "mensal"})`;
    breakdown[k] = (breakdown[k] || 0) + (c.plano || 0);
  });
  document.getElementById("fin-breakdown")!.innerHTML = Object.entries(breakdown).map(([k, v]) => `
    <div class="flex justify-between py-2 border-b border-slate-50">
      <span class="text-xs font-bold text-slate-500 uppercase">${k}</span>
      <span class="text-xs font-black text-slate-900">${money(v)}</span>
    </div>
  `).join("");
};

window.startListening = (userId) => {
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "clients"), snap => {
    clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
    renderClientsList();
    window.refreshFinance();
    refreshTopProfitBar();
  });
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

// Funções de Interface restantes (Stubs ou implementação simples)
window.toggleBulkSelectClients = (force) => { bulkMode = force ?? !bulkMode; selectedClientIds.clear(); renderClientsList(); };
window.bulkSelectAllFilteredClients = () => { getFilteredClients().forEach(c => selectedClientIds.add(c.id)); renderClientsList(); };
window.bulkDeleteSelectedClients = async () => {
  if (currentUserId && selectedClientIds.size && confirm("Apagar selecionados?")) {
    for (const id of selectedClientIds) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
    window.toggleBulkSelectClients(false);
  }
};
window.toggleDarkMode = () => document.body.classList.toggle("dark-mode");
window.toggleUiMode = () => { document.body.classList.toggle("compact-ui"); syncUiModeLabel(); };

// Adicione aqui implementações de Revenda se necessário...
window.openAddRevenda = () => window.toggleModal("revenda-modal");
window.renderRevendasList = () => {}; // Placeholder
