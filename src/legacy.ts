import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

type Client = { id: string; nome?: string; painel?: string; venc?: string; plano?: number; idExt?: string; };

let currentUserId: string | null = null;
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

const ALL_SERVERS = ["Starplay", "Vision", "Primelux", "Play Tv", "Blast Elite", "Blast Flash", "Havok Radeon", "Havok Kyros", "Havok Andromeda", "Havok Neon", "Allbox", "Ryzeen", "Titan"];
let dashSettings = { period: 'current_month', startDate: '', endDate: '', selectedPanels: [...ALL_SERVERS] };

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
  }
}

const money = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
const parseNum = (s: string) => { const v = String(s).replace(/\s/g, "").replace(",", "."); const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// FUNÇÃO DE NOTIFICAÇÃO NATIVA (Hoje e Amanhã)
function checkAndNotify() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const expiringToday = clients.filter(c => c.venc === todayStr);
  const expiringTomorrow = clients.filter(c => c.venc === tomorrowStr);

  const badge = document.getElementById("notif-badge");
  const listCont = document.getElementById("notif-list");
  
  if (expiringToday.length > 0 || expiringTomorrow.length > 0) {
    if (badge) badge.classList.remove("hidden");
    
    // Dispara a notificação visual do Sistema Operacional (uma vez ao carregar)
    const total = expiringToday.length + expiringTomorrow.length;
    new Notification("Alerta de Vencimento", {
      body: `Você tem ${total} cliente(s) vencendo entre hoje e amanhã!`,
      icon: "/vite.svg" 
    });

    if (listCont) {
      listCont.innerHTML = "";
      [...expiringToday, ...expiringTomorrow].forEach(c => {
        const isToday = c.venc === todayStr;
        listCont.innerHTML += `
          <div class="p-4 rounded-2xl ${isToday ? 'bg-rose-50 border-rose-100' : 'bg-sky-50 border-sky-100'} dark:bg-slate-800 border flex justify-between items-center">
            <div>
              <div class="text-[9px] font-black uppercase ${isToday ? 'text-rose-500' : 'text-sky-500'}">${isToday ? 'Vence Hoje' : 'Vence Amanhã'}</div>
              <div class="text-xs font-bold text-slate-800 dark:text-white uppercase">${c.nome}</div>
            </div>
            <div class="text-right text-[10px] font-black uppercase text-slate-400">${c.painel}</div>
          </div>`;
      });
    }
  } else {
    if (badge) badge.classList.add("hidden");
    if (listCont) listCont.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">Tudo em dia por enquanto.</p>`;
  }
}

function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");
  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  const dashList = clients.filter(c => {
    if (!dashSettings.selectedPanels.includes(c.painel || '')) return false;
    if (!c.venc) return false;
    const d = new Date(c.venc + "T00:00:00");
    if (dashSettings.period === 'current_month') {
      const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    } else if (dashSettings.period === 'custom') {
      return d >= new Date(dashSettings.startDate) && d <= new Date(dashSettings.endDate);
    }
    return true;
  });

  const totalFaturamento = dashList.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);
  const totalCusto = dashList.reduce((acc, c) => {
    const p = c.painel || "";
    if (p === "Starplay") return acc + 2.50;
    if (p === "Vision") return acc + 2.00;
    return acc;
  }, 0);

  totalPlansEl.textContent = money(totalFaturamento);
  totalCasinhasEl.textContent = money(totalCusto);
  realProfitEl.textContent = money(totalFaturamento - totalCusto);
}

window.saveClient = async () => {
  if (!currentUserId) return;
  const id = (document.getElementById("client-edit-id") as HTMLInputElement).value;
  const data = {
    nome: (document.getElementById("client-nome") as HTMLInputElement).value,
    painel: (document.getElementById("client-painel") as HTMLSelectElement).value,
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    plano: parseNum((document.getElementById("client-plano") as HTMLInputElement).value),
    idExt: (document.getElementById("client-idext") as HTMLInputElement).value,
    updatedAt: new Date().toISOString()
  };
  const path = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data) : await firebaseApi.addDoc(path, data);
  window.toggleModal("client-modal");
};

export function installLegacyApp() {
  firebaseApi.onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById("auth-section")?.classList.add("hidden");
      document.getElementById("app-content")?.classList.remove("hidden");
      
      firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", user.uid, "clients"), snap => {
        clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]; 
        refreshTopProfitBar();
        checkAndNotify(); // VERIFICA VENCIMENTOS SEMPRE QUE O BANCO MUDA
        
        const grid = document.getElementById('dash-server-checkboxes');
        if (grid) grid.innerHTML = ALL_SERVERS.map(s => `<label class="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"><input type="checkbox" value="${s}" class="dash-panel-check w-4 h-4" ${dashSettings.selectedPanels.includes(s) ? 'checked' : ''}><span class="text-[10px] font-black uppercase">${s}</span></label>`).join('');
      });
      
      document.querySelectorAll('#clients-search, #filter-date-start, #filter-date-end').forEach(el => el.addEventListener('input', () => renderClientsList()));
      window.switchView("clients");
    }
  });
}

// Funções básicas mantidas (Login, Logout, Modal)
window.handleAuth = async (m) => {
  const e = (document.getElementById("auth-email") as HTMLInputElement).value;
  const p = (document.getElementById("auth-password") as HTMLInputElement).value;
  try { if (m === "login") await firebaseApi.signInWithEmailAndPassword(auth, e, p); } catch (err: any) { alert("Erro de acesso."); }
};
window.logout = () => { firebaseApi.signOut(auth); window.location.reload(); };
window.toggleModal = (id) => document.getElementById(id)?.classList.toggle("active");
window.toggleDarkMode = () => document.body.classList.toggle("dark-mode");
window.switchView = (v) => { document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden")); document.getElementById("view-" + v)?.classList.remove("hidden"); createIcons({ icons }); };
window.openAddClient = () => { (document.getElementById("client-edit-id") as HTMLInputElement).value = ""; window.toggleModal("client-modal"); };
window.saveDashSettings = () => {
  const selected: string[] = [];
  document.querySelectorAll('.dash-panel-check:checked').forEach((el: any) => selected.push(el.value));
  dashSettings.selectedPanels = selected;
  dashSettings.period = (document.getElementById('dash-setting-period') as HTMLSelectElement).value;
  window.toggleModal('dash-settings-modal');
  refreshTopProfitBar();
};
window.toggleDashCustomDates = (v) => document.getElementById("dash-custom-dates")?.classList.toggle("hidden", v !== "custom");
