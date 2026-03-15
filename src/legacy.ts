import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

type Client = { id: string; nome?: string; painel?: string; venc?: string; plano?: number; idExt?: string; phone?: string; };

let currentUserId: string | null = null;
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

const ALL_SERVERS = ["Starplay", "Vision", "Primelux", "Play Tv", "Blast Elite", "Blast Flash", "Havok Radeon", "Havok Kyros", "Havok Andromeda", "Havok Neon", "Allbox", "Ryzeen", "Titan"];
let dashSettings = { 
  period: 'current_month', 
  startDate: '', 
  endDate: '', 
  selectedPanels: [...ALL_SERVERS],
  adminPhone: localStorage.getItem("adminPhone") || ""
};

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
    sendWhatsApp: (id: string) => void;
  }
}

const money = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
const parseNum = (s: string) => { const v = String(s).replace(/\s/g, "").replace(",", "."); const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// 1. IMPORTAÇÃO INTELIGENTE (FORMATO BLOCO)
window.importClientsFromText = async () => {
  if (!currentUserId) return;
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const forcedServer = (document.getElementById("import-server-select") as HTMLSelectElement).value;
  const blocks = text.split(/(?=\b\d{7}\b)/);
  let count = 0;

  for (let b of blocks) {
    const lines = b.trim().split('\n');
    if (lines.length < 5) continue;
    const idExt = lines[0].trim();
    const dateMatch = b.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    let venc = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : "";
    let nome = "Cliente Importado";
    let plano = 20;
    const planoIdx = lines.findIndex(l => l.includes("Plano: R$"));
    if (planoIdx > 0) {
      nome = lines[planoIdx - 1].trim();
      const valMatch = lines[planoIdx].match(/Plano:\s*R\$\s*([\d,.]+)/i);
      if (valMatch) plano = parseFloat(valMatch[1].replace('.', '').replace(',', '.'));
    }
    let painel = forcedServer || (b.toUpperCase().includes('STARPLAY') ? 'Starplay' : b.toUpperCase().includes('VISION') ? 'Vision' : 'Havok Kyros');

    await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
      nome, idExt, painel, venc, plano, createdAt: new Date().toISOString()
    });
    count++;
  }
  alert(`${count} clientes importados!`);
  window.toggleModal("import-modal");
};

// 2. NOTIFICAÇÕES E WHATSAPP
function checkAndNotify() {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomStr = tomorrow.toISOString().split('T')[0];
  const upcoming = clients.filter(c => c.venc === todayStr || c.venc === tomStr);
  const badge = document.getElementById("notif-badge");
  const listCont = document.getElementById("notif-list");
  
  if (upcoming.length > 0) {
    badge?.classList.remove("hidden");
    if (listCont) {
      listCont.innerHTML = upcoming.map(c => `
        <div class="p-4 rounded-2xl ${c.venc === todayStr ? 'bg-rose-50 border-rose-100' : 'bg-sky-50 border-sky-100'} dark:bg-slate-800 border flex justify-between items-center">
          <div>
            <div class="text-[9px] font-black uppercase ${c.venc === todayStr ? 'text-rose-500' : 'text-sky-500'}">${c.venc === todayStr ? 'Vence Hoje' : 'Vence Amanhã'}</div>
            <div class="text-xs font-bold text-slate-800 dark:text-white uppercase">${c.nome}</div>
          </div>
          <button onclick="window.sendWhatsApp('${c.id}')" class="p-2.5 bg-emerald-500 text-white rounded-xl"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
        </div>`).join('');
    }
  } else {
    badge?.classList.add("hidden");
    if (listCont) listCont.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">Tudo em ordem!</p>`;
  }
  createIcons({ icons });
}

window.sendWhatsApp = (id) => {
  const c = clients.find(x => x.id === id); if (!c) return;
  const admin = dashSettings.adminPhone.replace(/\D/g, "");
  if (!admin) return alert("Configure seu WhatsApp na engrenagem!");
  const msg = `⚠️ *AVISO*\n\n👤 *Cliente:* ${c.nome}\n🖥️ *Painel:* ${c.painel}\n📅 *Vencimento:* ${c.venc?.split("-").reverse().join("/")}\n💰 *Valor:* ${money(c.plano || 0)}\n📱 *ID:* ${c.idExt || 'N/A'}`;
  window.open(`https://wa.me/${admin}?text=${encodeURIComponent(msg)}`, "_blank");
};

// 3. DASHBOARD E RENDERS
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");
  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  const now = new Date();
  const dashList = clients.filter(c => {
    if (!dashSettings.selectedPanels.includes(c.painel || '')) return false;
    if (!c.venc) return false;
    const d = new Date(c.venc + "T00:00:00");
    if (dashSettings.period === 'current_month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else if (dashSettings.period === 'custom') {
      const start = dashSettings.startDate ? new Date(dashSettings.startDate + "T00:00:00") : null;
      const end = dashSettings.endDate ? new Date(dashSettings.endDate + "T23:59:59") : null;
      if (start && d < start) return false;
      if (end && d > end) return false;
    }
    return true;
  });

  const faturamento = dashList.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);
  const custo = dashList.reduce((acc, c) => {
    const p = (c.painel || "").trim();
    if (p === "Starplay") return acc + 2.50;
    if (p === "Vision") return acc + 2.00;
    return acc;
  }, 0);

  totalPlansEl.textContent = money(faturamento);
  totalCasinhasEl.textContent = money(custo);
  realProfitEl.textContent = money(faturamento - custo);
  const infoEl = document.getElementById("dash-info-text");
  if (infoEl) infoEl.textContent = `Dashboard: ${dashList.length} itens filtrados.`;
}

// RENDERIZAÇÃO DOS CARDS (COM ID EXTERNO)
function renderClientsList() {
  const cont = document.getElementById("clients-list"); if (!cont) return;
  const q = (document.getElementById("clients-search") as HTMLInputElement)?.value.toLowerCase();
  const ds = (document.getElementById("filter-date-start") as HTMLInputElement)?.value;
  const de = (document.getElementById("filter-date-end") as HTMLInputElement)?.value;
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value;

  const filtered = clients.filter(c => {
    if (srv && c.painel !== srv) return false;
    if (ds && c.venc && c.venc < ds) return false;
    if (de && c.venc && c.venc > de) return false;
    if (!q) return true;
    return c.nome?.toLowerCase().includes(q) || c.idExt?.toLowerCase().includes(q) || c.painel?.toLowerCase().includes(q);
  });

  document.getElementById("clients-count")!.textContent = `${filtered.length}/${clients.length}`;
  cont.innerHTML = "";
  filtered.forEach(c => {
    const isSel = selectedClientIds.has(c.id);
    const div = document.createElement("div");
    div.className = `luxury-card p-5 border transition-all cursor-pointer ${isSel ? 'ring-2 ring-sky-500 bg-sky-50/20' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`;
    
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="min-w-0 flex items-center gap-3">
          ${bulkMode ? `<input type="checkbox" ${isSel ? 'checked' : ''} class="w-4 h-4 pointer-events-none">` : ''}
          <div class="min-w-0">
            <div class="font-black uppercase text-slate-800 dark:text-white truncate">${c.nome || "Sem nome"}</div>
            <div class="text-[10px] font-bold text-slate-400 uppercase mt-1">${c.painel} • VENC: ${c.venc?.split("-").reverse().join("/") || "-"}</div>
            <div class="text-[10px] font-black text-slate-500 mt-1 uppercase">ID: ${c.idExt || 'N/A'}</div>
            <div class="text-[11px] font-black text-sky-600 mt-2">${money(c.plano || 0)}</div>
          </div>
        </div>
        ${!bulkMode ? `
          <div class="flex flex-col gap-2">
            <button onclick="event.stopPropagation(); window.openEditClient('${c.id}')" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
            <button onclick="event.stopPropagation(); window.deleteClient('${c.id}')" class="p-2 bg-red-50 rounded-xl text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>` : ''}
      </div>`;

    div.onclick = () => {
      if (bulkMode) {
        isSel ? selectedClientIds.delete(c.id) : selectedClientIds.add(c.id);
        document.getElementById("clients-bulk-count")!.textContent = String(selectedClientIds.size);
        renderClientsList();
      }
    };
    cont.appendChild(div);
  });
  createIcons({ icons });
}

// 4. INICIALIZAÇÃO E AUXILIARES
export function installLegacyApp() {
  firebaseApi.onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById("auth-section")?.classList.add("hidden");
      document.getElementById("app-content")?.classList.remove("hidden");
      firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", user.uid, "clients"), snap => {
        clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]; 
        refreshTopProfitBar(); checkAndNotify(); renderClientsList();
        const grid = document.getElementById('dash-server-checkboxes');
        if (grid) {
          grid.innerHTML = ALL_SERVERS.map(s => `<label class="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"><input type="checkbox" value="${s}" class="dash-panel-check w-4 h-4" ${dashSettings.selectedPanels.includes(s) ? 'checked' : ''}><span class="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">${s}</span></label>`).join('');
          (document.getElementById('admin-phone') as HTMLInputElement).value = dashSettings.adminPhone;
        }
      });
      document.querySelectorAll('#clients-search, #filter-date-start, #filter-date-end').forEach(el => el.addEventListener('input', renderClientsList));
      document.querySelectorAll('#clients-filter-server').forEach(el => el.addEventListener('change', renderClientsList));
      window.switchView("clients");
    }
  });
}

// CRUD
window.saveClient = async () => {
  if (!currentUserId) return;
  const id = (document.getElementById("client-edit-id") as HTMLInputElement).value;
  const data = {
    nome: (document.getElementById("client-nome") as HTMLInputElement).value,
    painel: (document.getElementById("client-painel") as HTMLSelectElement).value,
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    plano: parseNum((document.getElementById("client-plano") as HTMLInputElement).value),
    phone: (document.getElementById("client-phone") as HTMLInputElement).value,
    idExt: (document.getElementById("client-idext") as HTMLInputElement).value,
    updatedAt: new Date().toISOString()
  };
  const path = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data) : await firebaseApi.addDoc(path, data);
  window.toggleModal("client-modal");
};

window.openEditClient = (id) => {
  const c = clients.find(x => x.id === id); if (!c) return;
  (document.getElementById("client-edit-id") as HTMLInputElement).value = id;
  (document.getElementById("client-modal-title")!).textContent = "Editar Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = c.nome || "";
  (document.getElementById("client-painel") as HTMLSelectElement).value = c.painel || "Starplay";
  (document.getElementById("client-venc") as HTMLInputElement).value = c.venc || "";
  (document.getElementById("client-plano") as HTMLInputElement).value = (c.plano || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  (document.getElementById("client-phone") as HTMLInputElement).value = c.phone || "";
  (document.getElementById("client-idext") as HTMLInputElement).value = c.idExt || "";
  window.toggleModal("client-modal");
};

window.deleteClient = async (id) => { if (confirm("Excluir cliente?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); };
window.toggleBulkSelectClients = (f) => { bulkMode = f ?? !bulkMode; selectedClientIds.clear(); document.getElementById("clients-bulkbar")?.classList.toggle("hidden", !bulkMode); renderClientsList(); };
window.bulkSelectAllFilteredClients = () => { getFilteredClients().forEach(c => selectedClientIds.add(c.id)); document.getElementById("clients-bulk-count")!.textContent = String(selectedClientIds.size); renderClientsList(); };
window.bulkDeleteSelectedClients = async () => { if (confirm(`Excluir ${selectedClientIds.size} selecionados?`)) { for (const id of selectedClientIds) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); window.toggleBulkSelectClients(false); } };

// Extras
window.handleAuth = async (m) => {
  const e = (document.getElementById("auth-email") as HTMLInputElement).value;
  const p = (document.getElementById("auth-password") as HTMLInputElement).value;
  try { if (m === "login") await firebaseApi.signInWithEmailAndPassword(auth, e, p); } catch (err: any) { alert("Erro."); }
};
window.logout = () => { firebaseApi.signOut(auth); window.location.reload(); };
window.toggleModal = (id) => document.getElementById(id)?.classList.toggle("active");
window.toggleDarkMode = () => { document.body.classList.toggle("dark-mode"); createIcons({ icons }); };
window.switchView = (v) => { document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden")); document.getElementById("view-" + v)?.classList.remove("hidden"); createIcons({ icons }); };
window.toggleDashCustomDates = (v) => document.getElementById("dash-custom-dates")?.classList.toggle("hidden", v !== "custom");
window.openAddClient = () => { (document.getElementById("client-edit-id") as HTMLInputElement).value = ""; (document.getElementById("client-nome") as HTMLInputElement).value = ""; window.toggleModal("client-modal"); };
window.openImportClients = () => window.toggleModal("import-modal");
window.saveDashSettings = () => {
  const admin = (document.getElementById('admin-phone') as HTMLInputElement).value;
  localStorage.setItem("adminPhone", admin);
  dashSettings.adminPhone = admin;
  dashSettings.period = (document.getElementById('dash-setting-period') as HTMLSelectElement).value;
  dashSettings.startDate = (document.getElementById('dash-start') as HTMLInputElement).value;
  dashSettings.endDate = (document.getElementById('dash-end') as HTMLInputElement).value;
  const sel: string[] = [];
  document.querySelectorAll('.dash-panel-check:checked').forEach((el: any) => sel.push(el.value));
  dashSettings.selectedPanels = sel;
  window.toggleModal('dash-settings-modal');
  refreshTopProfitBar();
};
