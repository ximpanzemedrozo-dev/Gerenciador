import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

// ---------- Tipos ----------
type Client = { id: string; nome?: string; painel?: string; cycle?: string; email?: string; venc?: string; plano?: number; idExt?: string; };

// ---------- Estado Global ----------
let currentUserId: string | null = null;
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

// ---------- Helpers ----------
function money(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNum(raw: string): number {
  const v = (raw || "").toString().trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ---------- Lógica de Lucro Real (Regra: Starplay=2.50 / Vision=2.00 / Outros=0) ----------
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");
  const metaEl = document.getElementById("top-casinhas-meta");

  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  // Faturamento soma TODOS os planos independente do ciclo
  const totalFaturamento = clients.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);

  // Custo: Starplay=2.5 | Vision=2.0 | Outros=0
  const totalCusto = clients.reduce((acc, c) => {
    const painel = (c.painel || "").trim();
    if (painel === "Starplay") return acc + 2.50;
    if (painel === "Vision") return acc + 2.00;
    return acc;
  }, 0);

  const lucroReal = totalFaturamento - totalCusto;

  totalPlansEl.textContent = money(totalFaturamento);
  totalCasinhasEl.textContent = money(totalCusto);
  realProfitEl.textContent = money(lucroReal);

  if (metaEl) {
    const s = clients.filter(c => c.painel === "Starplay").length;
    const v = clients.filter(c => c.painel === "Vision").length;
    metaEl.textContent = `Starplay: ${s} • Vision: ${v}`;
  }
}

// ---------- CRUD Clientes ----------
window.openAddClient = () => {
  (document.getElementById("client-edit-id") as HTMLInputElement).value = "";
  (document.getElementById("client-modal-title")!).textContent = "Novo Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = "";
  (document.getElementById("client-idext") as HTMLInputElement).value = "";
  window.toggleModal("client-modal");
};

window.openEditClient = (id: string) => {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  (document.getElementById("client-edit-id") as HTMLInputElement).value = id;
  (document.getElementById("client-modal-title")!).textContent = "Editar Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = c.nome || "";
  (document.getElementById("client-painel") as HTMLInputElement).value = c.painel || "";
  (document.getElementById("client-email") as HTMLInputElement).value = c.email || "";
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
    painel: (document.getElementById("client-painel") as HTMLInputElement).value,
    email: (document.getElementById("client-email") as HTMLInputElement).value,
    cycle: (document.getElementById("client-cycle") as HTMLSelectElement).value,
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    plano: parseNum((document.getElementById("client-plano") as HTMLInputElement).value),
    idExt: (document.getElementById("client-idext") as HTMLInputElement).value,
    updatedAt: new Date().toISOString()
  };
  const coll = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data)
     : await firebaseApi.addDoc(coll, { ...data, createdAt: data.updatedAt });
  window.toggleModal("client-modal");
};

// ---------- Renderização e Busca ----------
function getFilteredClients() {
  const q = ((document.getElementById("clients-search") as HTMLInputElement)?.value || "").toLowerCase().trim();
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value || "";
  const cyc = (document.getElementById("clients-filter-cycle") as HTMLSelectElement)?.value || "";

  return clients.filter(c => {
    if (srv && c.painel !== srv) return false;
    if (cyc && (c.cycle || "mensal") !== cyc) return false;
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.idExt || "").toLowerCase().includes(q);
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
    div.className = "luxury-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl";
    div.innerHTML = `
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0">
          <div class="font-black uppercase text-slate-800 dark:text-white truncate">${c.nome || "Sem nome"}</div>
          <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase">${c.painel || "Outros"} • ID: ${c.idExt || "-"}</div>
          <div class="text-[11px] font-bold text-slate-500 mt-2">VENC: ${c.venc || "-"} • ${money(c.plano || 0)}</div>
        </div>
        <div class="flex flex-col gap-2">
          <button onclick="window.openEditClient('${c.id}')" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
          <button onclick="window.deleteClient('${c.id}')" class="p-2 bg-red-50 rounded-xl text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
      </div>
    `;
    cont.appendChild(div);
  });
  createIcons({ icons });
}

// ---------- Inicialização e Auth ----------
export function installLegacyApp() {
  window.switchView = (v) => {
    document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden"));
    document.getElementById(`view-${v}`)?.classList.remove("hidden");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(`nav-${v}`)?.classList.add("active");
    refreshTopProfitBar();
  };

  firebaseApi.onAuthStateChanged(auth, user => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById("auth-section")?.classList.add("hidden");
      document.getElementById("app-content")?.classList.remove("hidden");
      firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", user.uid, "clients"), snap => {
        clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
        renderClientsList();
        refreshTopProfitBar();
      });
    } else {
      document.getElementById("auth-section")?.classList.remove("hidden");
      document.getElementById("app-content")?.classList.add("hidden");
    }
  });

  document.getElementById("clients-search")?.addEventListener("input", renderClientsList);
  document.getElementById("clients-filter-server")?.addEventListener("change", renderClientsList);
  document.getElementById("clients-filter-cycle")?.addEventListener("change", renderClientsList);
}

window.handleAuth = async (m) => {
  const e = (document.getElementById("auth-email") as HTMLInputElement).value;
  const p = (document.getElementById("auth-password") as HTMLInputElement).value;
  try { if (m === "login") await firebaseApi.signInWithEmailAndPassword(auth, e, p); } catch { alert("Falha no login."); }
};

window.logout = () => firebaseApi.signOut(auth);
window.toggleModal = (id) => document.getElementById(id)?.classList.toggle("active");
window.toggleDarkMode = () => document.body.classList.toggle("dark-mode");
window.deleteClient = async (id) => { if(confirm("Apagar?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); };
