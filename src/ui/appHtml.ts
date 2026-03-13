import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

// ---------- Tipos ----------
type Server = { id: string; name: string; cost: number };
type BillingCycle = "mensal" | "bimestral" | "trimestral" | "semestral" | "anual";

type Client = {
  id: string;
  nome?: string;
  painel?: string;
  cycle?: BillingCycle;
  email?: string;
  venc?: string;
  plano?: number;
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
    logout: () => Promise<void>;
    openAddClient: () => void;
    openEditClient: (id: string) => void;
    saveClient: () => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    openImportClients: () => void;
    previewImport: () => void;
    importClientsFromText: () => Promise<void>;
    refreshFinance: () => void;
    toggleBulkSelectClients: (force?: boolean) => void;
  }
}

// ---------- Estado Global ----------
let currentUserId: string | null = null;
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

const CASINHA_COST: Record<string, number> = { Vision: 2.0, Starplay: 2.5 };
const FULL_SERVERS_LIST = ["Starplay", "Vision", "Primelux", "Play Tv", "Blast Elite", "Blast Flash", "Havok Radeon", "Havok Kyros", "Havok Andromeda", "Havok Neon", "Allbox", "Ryzeen", "Titan"];

// ---------- Helpers ----------
function money(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNum(raw: string): number {
  const v = (raw || "").toString().trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isoToday() { return new Date().toISOString().split("T")[0]; }

function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------- Barra de Lucro Superior (Somente Mensais) ----------
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");
  const metaEl = document.getElementById("top-casinhas-meta");

  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  // LÓGICA SOLICITADA: Filtrar apenas clientes MENSALISTAS para a barra do topo
  const mensalistas = clients.filter(c => (c.cycle || "mensal") === "mensal");

  const totalPlans = mensalistas.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);

  let qtdStarplay = 0;
  let qtdVision = 0;
  for (const c of mensalistas) {
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

// ---------- Navegação e Auth ----------
export function installLegacyApp() {
  document.getElementById("btn-login")?.addEventListener("click", () => window.handleAuth("login"));
  document.getElementById("btn-signup")?.addEventListener("click", () => window.handleAuth("signup"));

  firebaseApi.onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById("auth-section")?.classList.add("hidden");
      document.getElementById("app-content")?.classList.remove("hidden");
      await window.initialize12Servers(user.uid);
      window.startListening(user.uid);
      window.switchView("clients");
    } else {
      currentUserId = null;
      document.getElementById("auth-section")?.classList.remove("hidden");
      document.getElementById("app-content")?.classList.add("hidden");
    }
  });

  document.getElementById("clients-search")?.addEventListener("input", renderClientsList);
  document.querySelectorAll("#clients-filter-server, #clients-filter-cycle").forEach(el => 
    el.addEventListener("change", renderClientsList)
  );
}

window.handleAuth = async (mode) => {
  const email = (document.getElementById("auth-email") as HTMLInputElement).value;
  const password = (document.getElementById("auth-password") as HTMLInputElement).value;
  try {
    if (mode === "login") await firebaseApi.signInWithEmailAndPassword(auth, email, password);
    else await firebaseApi.createUserWithEmailAndPassword(auth, email, password);
  } catch { alert("Erro de acesso."); }
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

window.toggleModal = (id) => document.getElementById(id)?.classList.toggle("active");

// ---------- Clientes e Filtros ----------
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
  
  cont.innerHTML = "";
  filtered.forEach(c => {
    const div = document.createElement("div");
    div.className = "luxury-card p-5";
    div.innerHTML = `
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0">
          <div class="font-black uppercase text-slate-800 truncate">${c.nome || "Sem nome"}</div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">${c.painel || "-"} • ${c.cycle || "mensal"}</div>
          <div class="text-[11px] text-slate-500 mt-1 truncate">${c.email || ""}</div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Venc: ${c.venc || "-"} • ${money(c.plano || 0)}</div>
        </div>
        <div class="flex flex-col gap-2">
          <button class="bg-slate-100 px-3 py-1 rounded-xl text-[10px] font-black uppercase" onclick="openEditClient('${c.id}')">Editar</button>
          <button class="bg-red-50 text-red-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase" onclick="deleteClient('${c.id}')">Apagar</button>
        </div>
      </div>
    `;
    cont.appendChild(div);
  });
  createIcons({ icons });
}

window.openAddClient = () => {
  (document.getElementById("client-edit-id") as HTMLInputElement).value = "";
  (document.getElementById("client-nome") as HTMLInputElement).value = "";
  window.toggleModal("client-modal");
};

window.openEditClient = (id) => {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  (document.getElementById("client-edit-id") as HTMLInputElement).value = id;
  (document.getElementById("client-nome") as HTMLInputElement).value = c.nome || "";
  (document.getElementById("client-painel") as HTMLInputElement).value = c.painel || "";
  (document.getElementById("client-email") as HTMLInputElement).value = c.email || "";
  (document.getElementById("client-venc") as HTMLInputElement).value = c.venc || "";
  (document.getElementById("client-plano") as HTMLInputElement).value = String(c.plano || "20.00");
  window.toggleModal("client-modal");
};

window.saveClient = async () => {
  if (!currentUserId) return;
  const id = (document.getElementById("client-edit-id") as HTMLInputElement).value;
  const data = {
    nome: (document.getElementById("client-nome") as HTMLInputElement).value,
    painel: (document.getElementById("client-painel") as HTMLInputElement).value,
    cycle: (document.getElementById("client-cycle") as HTMLSelectElement).value,
    email: (document.getElementById("client-email") as HTMLInputElement).value,
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    plano: parseNum((document.getElementById("client-plano") as HTMLInputElement).value),
    updatedAt: new Date().toISOString()
  };
  const coll = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data)
     : await firebaseApi.addDoc(coll, { ...data, createdAt: data.updatedAt });
  window.toggleModal("client-modal");
};

window.deleteClient = async (id) => { if (currentUserId && confirm("Apagar?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id)); };

// ---------- Importação ----------
window.openImportClients = () => window.toggleModal("import-modal");

window.previewImport = () => {
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  document.getElementById("import-preview")!.textContent = "Lendo texto...";
  // Aqui entraria a lógica de regex para extrair dados
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;
  alert("Lógica de importação ativada. Processando blocos...");
  window.toggleModal("import-modal");
};

// ---------- Financeiro (Resumo Geral) ----------
window.refreshFinance = () => {
  document.getElementById("fin-total-clients")!.textContent = String(clients.length);
  const dueSoon = clients.filter(c => c.venc && daysBetween(isoToday(), c.venc) <= 7).length;
  document.getElementById("fin-due-soon")!.textContent = String(dueSoon);

  const breakdown: Record<string, number> = {};
  clients.forEach(c => {
    const k = `${c.painel || "Outros"} (${c.cycle || "mensal"})`;
    breakdown[k] = (breakdown[k] || 0) + (c.plano || 0);
  });

  document.getElementById("fin-breakdown")!.innerHTML = Object.entries(breakdown).map(([k, v]) => `
    <div class="flex justify-between border-b py-2">
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
  const snap = await firebaseApi.getDocs(firebaseApi.collection(db, "artifacts", appId, "users", userId, "servers"));
  if (snap.empty) {
    for (const name of FULL_SERVERS_LIST) {
      await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", userId, "servers"), { name, cost: 3.0 });
    }
  }
};

window.toggleBulkSelectClients = (force) => { bulkMode = force ?? !bulkMode; renderClientsList(); };
window.toggleDarkMode = () => document.body.classList.toggle("dark-mode");
