import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

type Client = { id: string; nome?: string; painel?: string; cycle?: string; venc?: string; plano?: number; idExt?: string; };

let currentUserId: string | null = null;
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();
let dashSettings = { period: 'current_month', startDate: '', endDate: '', panels: [] as string[] };

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
    importClientsFromText: () => Promise<void>;
    saveDashSettings: () => void;
    toggleDashCustomDates: (v: string) => void;
    refreshFinance: () => void;
  }
}

const money = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
const parseNum = (s: string) => { const v = String(s).replace(/\s/g, "").replace(",", "."); const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// Lógica Dashboard corrigida: Starplay=2.5, Vision=2.0, Outros=0
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");
  const infoEl = document.getElementById("dash-info-text");

  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const dashList = clients.filter(c => {
    // 1. Filtrar Painéis (Selecionados na engrenagem)
    if (dashSettings.panels.length > 0 && !dashSettings.panels.includes(c.painel || '')) return false;

    // 2. Filtrar Período
    if (!c.venc) return false;
    const d = new Date(c.venc + "T00:00:00");
    
    if (dashSettings.period === 'current_month') {
      // Regra automática: Apenas ciclo mensal deste mês conforme pedido anterior
      if ((c.cycle || 'mensal') !== 'mensal') return false;
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } else if (dashSettings.period === 'custom') {
      if (!dashSettings.startDate || !dashSettings.endDate) return true;
      const start = new Date(dashSettings.startDate + "T00:00:00");
      const end = new Date(dashSettings.endDate + "T23:59:59");
      return d >= start && d <= end;
    }
    return true; // all_time
  });

  const faturamento = dashList.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);
  const custo = dashList.reduce((acc, c) => {
    const p = (c.painel || "").trim();
    if (p === "Starplay") return acc + 2.50;
    if (p === "Vision") return acc + 2.00;
    return acc; // Outros = 0 conforme solicitado
  }, 0);

  totalPlansEl.textContent = money(faturamento);
  totalCasinhasEl.textContent = money(custo);
  realProfitEl.textContent = money(faturamento - custo);

  if (infoEl) {
    const pTxt = dashSettings.period === 'current_month' ? 'Mensais do Mês' : dashSettings.period === 'all_time' ? 'Base Toda' : 'Período Personalizado';
    infoEl.textContent = "Filtrando: " + pTxt + " (" + dashList.length + " logins)";
  }
}

function getFilteredClients() {
  const q = ((document.getElementById("clients-search") as HTMLInputElement)?.value || "").toLowerCase().trim();
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value || "";
  const cyc = (document.getElementById("clients-filter-cycle") as HTMLSelectElement)?.value || "";
  const dStart = (document.getElementById("filter-date-start") as HTMLInputElement)?.value;
  const dEnd = (document.getElementById("filter-date-end") as HTMLInputElement)?.value;

  return clients.filter(c => {
    if (srv && c.painel !== srv) return false;
    if (cyc && (c.cycle || "mensal") !== cyc) return false;
    if (dStart && c.venc && c.venc < dStart) return false;
    if (dEnd && c.venc && c.venc > dEnd) return false;
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.idExt || "").toLowerCase().includes(q) || (c.painel || "").toLowerCase().includes(q);
  });
}

function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;
  const filtered = getFilteredClients();
  document.getElementById("clients-count")!.textContent = filtered.length + "/" + clients.length;

  cont.innerHTML = "";
  filtered.forEach(c => {
    const div = document.createElement("div");
    const sel = selectedClientIds.has(c.id);
    div.className = "luxury-card p-5 cursor-pointer border " + (sel ? "ring-2 ring-sky-500 bg-sky-50/20" : "border-slate-200 dark:border-slate-800");
    div.innerHTML = "<div class='flex justify-between items-start gap-3'><div class='min-w-0'><div class='flex items-center gap-3'>" + (bulkMode ? "<input type='checkbox' " + (sel ? "checked" : "") + " class='w-4 h-4 pointer-events-none'>" : "") + "<div class='font-black uppercase text-slate-800 dark:text-white truncate'>" + (c.nome || "Sem nome") + "</div></div><div class='text-[10px] font-bold text-slate-400 uppercase mt-1'>" + (c.painel || "Outros") + " • " + (c.cycle || "mensal") + "</div><div class='text-[10px] text-slate-500 mt-1 font-bold'>VENC: " + (c.venc ? c.venc.split("-").reverse().join("/") : "-") + "</div><div class='text-[11px] font-black text-sky-600 mt-2'>" + money(c.plano || 0) + "</div></div>" + (!bulkMode ? "<div class='flex flex-col gap-2'><button class='btn-edit p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500'><i data-lucide='edit-3' class='w-4 h-4'></i></button><button class='btn-del p-2 bg-red-50 rounded-xl text-red-500'><i data-lucide='trash-2' class='w-4 h-4'></i></button></div>" : "") + "</div>";
    
    div.onclick = () => {
      if (bulkMode) {
        if (selectedClientIds.has(c.id)) selectedClientIds.delete(c.id);
        else selectedClientIds.add(c.id);
        renderClientsList();
        document.getElementById("clients-bulk-count")!.textContent = String(selectedClientIds.size);
      }
    };
    div.querySelector(".btn-edit")?.addEventListener("click", (e) => { e.stopPropagation(); window.openEditClient(c.id); });
    div.querySelector(".btn-del")?.addEventListener("click", (e) => { e.stopPropagation(); window.deleteClient(c.id); });
    cont.appendChild(div);
  });
  createIcons({ icons });
}

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

window.saveDashSettings = () => {
  dashSettings.period = (document.getElementById('dash-setting-period') as HTMLSelectElement).value;
  dashSettings.startDate = (document.getElementById('dash-start') as HTMLInputElement).value;
  dashSettings.endDate = (document.getElementById('dash-end') as HTMLInputElement).value;
  const selectedPanels: string[] = [];
  document.querySelectorAll('#dash-panel-options input:checked').forEach((el: any) => selectedPanels.push(el.value));
  dashSettings.panels = selectedPanels;
  window.toggleModal('dash-settings-modal');
  refreshTopProfitBar();
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const targetServer = (document.getElementById("import-target-server") as HTMLSelectElement).value;
  const blocks = text.match(/\d{9}[\s\S]*?(?=\d{9}|$)/g);
  if (!blocks) return alert("Nenhum cliente válido encontrado.");

  for (let b of blocks) {
    const id = b.match(/\b(\d{9})\b/)?.[1];
    if (!id) continue;
    
    let painel = targetServer;
    if (!painel) {
      if (b.toUpperCase().includes('STARPLAY')) painel = 'Starplay';
      else if (b.toUpperCase().includes('VISION')) painel = 'Vision';
      else painel = 'Outros';
    }

    const priceMatch = b.match(/Plano:\s*R\$\s*([\d,.]+)/i);
    const plano = priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : 20.00;

    await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
      nome: b.split('\n')[0].split('-')[0].trim() || 'Novo Cliente',
      idExt: id,
      painel,
      plano,
      cycle: 'mensal',
      createdAt: new Date().toISOString()
    });
  }
  alert("Finalizado!");
  window.toggleModal("import-modal");
};

export function installLegacyApp() {
  firebaseApi.onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid; document.getElementById("auth-section")?.classList.add("hidden"); document.getElementById("app-content")?.classList.remove("hidden");
      firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", user.uid, "clients"), snap => {
        clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]; 
        renderClientsList(); refreshTopProfitBar();
        const grid = document.getElementById('dash-panel-options');
        if (grid) grid.innerHTML = Array.from(new Set(clients.map(c => c.painel || 'Outros'))).map(p => "<label class='flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer'><input type='checkbox' value='" + p + "' class='w-4 h-4' " + (dashSettings.panels.includes(p) ? "checked" : "") + "><span class='text-[10px] font-black uppercase'>" + p + "</span></label>").join('');
      });
      document.querySelectorAll('#clients-search, #filter-date-start, #filter-date-end').forEach(el => el.addEventListener('input', renderClientsList));
      document.querySelectorAll('#clients-filter-server, #clients-filter-cycle').forEach(el => el.addEventListener('change', renderClientsList));
      window.switchView("clients");
    }
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
window.switchView = (v) => { document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden")); document.getElementById("view-" + v)?.classList.remove("hidden"); document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active")); document.getElementById("nav-" + v)?.classList.add("active"); createIcons({ icons }); };
window.openImportClients = () => window.toggleModal("import-modal");
window.openAddClient = () => { (document.getElementById("client-edit-id") as HTMLInputElement).value = ""; (document.getElementById("client-nome") as HTMLInputElement).value = ""; window.toggleModal("client-modal"); };
window.deleteClient = async (id) => { if(confirm("Apagar?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); };
window.toggleDashCustomDates = (v) => { document.getElementById("dash-custom-dates")?.classList.toggle("hidden", v !== "custom"); };
window.toggleBulkSelectClients = (f) => { bulkMode = f ?? !bulkMode; selectedClientIds.clear(); document.getElementById("clients-bulkbar")?.classList.toggle("hidden", !bulkMode); renderClientsList(); };
window.bulkSelectAllFilteredClients = () => { getFilteredClients().forEach(c => selectedClientIds.add(c.id)); renderClientsList(); document.getElementById("clients-bulk-count")!.textContent = String(selectedClientIds.size); };
window.bulkDeleteSelectedClients = async () => { if(confirm("Apagar selecionados?")) { for(let id of selectedClientIds) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); window.toggleBulkSelectClients(false); } };
