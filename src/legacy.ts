import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

// ---------- Tipos ----------
type Client = {
  id: string;
  nome?: string;
  painel?: string;
  cycle?: string;
  email?: string;
  venc?: string;
  plano?: number;
  idExt?: string;
  status?: string;
};

type Revenda = {
  id: string;
  nome?: string;
  painel?: string;
  custoCredito?: number;
};

// ---------- Estado Global ----------
let currentUserId: string | null = null;
let clients: Client[] = [];
let revendas: Revenda[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

// ---------- Temas ----------
window.switchTheme = (theme: string) => {
  document.body.classList.remove('dark-mode', 'midnight-mode');
  if (theme === 'dark') document.body.classList.add('dark-mode');
  if (theme === 'midnight') document.body.classList.add('midnight-mode');
  localStorage.setItem('gi-theme', theme);
};

// ---------- Lógica de Lucro Real (Cálculo Específico) ----------
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");

  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  // 1. Faturamento Bruto: Soma total de todos os planos cadastrados
  const totalFaturamento = clients.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);

  // 2. Custo Total Corrigido:
  // Starplay = 2.50 | Vision = 2.00 | Outros = 0.00
  const totalCusto = clients.reduce((acc, c) => {
    const painel = (c.painel || "").trim();
    let custoUnitario = 0;
    
    if (painel === "Starplay") {
      custoUnitario = 2.50;
    } else if (painel === "Vision") {
      custoUnitario = 2.00;
    } else {
      custoUnitario = 0; // Outros servidores mantém 0 conforme solicitado
    }
    
    return acc + custoUnitario;
  }, 0);

  // 3. Lucro Real
  const lucroReal = totalFaturamento - totalCusto;

  totalPlansEl.textContent = "R$ " + totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  totalCasinhasEl.textContent = "R$ " + totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  realProfitEl.textContent = "R$ " + lucroReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  
  const countEl = document.getElementById("clients-count");
  if (countEl) {
    const filteredLength = getFilteredClients().length;
    countEl.textContent = `${filteredLength}/${clients.length}`;
  }
}

// ---------- CRUD de Clientes ----------
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
  (document.getElementById("client-idext") as HTMLInputElement).value = c.idExt || "";
  (document.getElementById("client-painel") as HTMLInputElement).value = c.painel || "";
  (document.getElementById("client-cycle") as HTMLSelectElement).value = c.cycle || "mensal";
  (document.getElementById("client-venc") as HTMLInputElement).value = c.venc || "";
  (document.getElementById("client-plano") as HTMLInputElement).value = (c.plano || 0).toFixed(2);
  window.toggleModal("client-modal");
};

window.saveClient = async () => {
  if (!currentUserId) return;
  const id = (document.getElementById("client-edit-id") as HTMLInputElement).value;
  const data = {
    nome: (document.getElementById("client-nome") as HTMLInputElement).value,
    idExt: (document.getElementById("client-idext") as HTMLInputElement).value,
    painel: (document.getElementById("client-painel") as HTMLInputElement).value,
    cycle: (document.getElementById("client-cycle") as HTMLSelectElement).value,
    venc: (document.getElementById("client-venc") as HTMLInputElement).value,
    plano: parseFloat((document.getElementById("client-plano") as HTMLInputElement).value.replace(',', '.')),
    updatedAt: new Date().toISOString()
  };
  const coll = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data)
     : await firebaseApi.addDoc(coll, { ...data, createdAt: data.updatedAt });
  window.toggleModal("client-modal");
};

// ---------- Motor de Importação ----------
function parseSmartBlock(text: string, forcedServer: string): Partial<Client> | null {
  const idMatch = text.match(/\b(\d{9})\b/);
  if (!idMatch) return null;
  const result: Partial<Client> = { idExt: idMatch[1], cycle: 'mensal', status: 'Ativo', plano: 20, painel: forcedServer || 'Outros' };
  if (!forcedServer) {
    const t = text.toUpperCase();
    if (t.includes('STAR PLAY')) result.painel = 'Starplay';
    else if (t.includes('VISION')) result.painel = 'Vision';
  }
  const dateMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateMatch) { const [, d, m, y] = dateMatch; result.venc = `${y}-${m}-${d}`; }
  const priceMatch = text.match(/Plano:\s*R\$\s*([\d,.]+)/i);
  if (priceMatch) result.plano = parseFloat(priceMatch[1].replace('.', '').replace(',', '.'));
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach(line => { if (line.includes(' - ') && !line.includes('Criado em')) result.nome = line.split(' - ')[0].trim(); });
  return result;
}

window.previewImport = () => {
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const forced = (document.getElementById("import-target-server") as HTMLSelectElement).value;
  const blocks = text.match(/\d{9}[\s\S]*?(?=\d{9}|$)/g);
  if (blocks) { const data = parseSmartBlock(blocks[0], forced); document.getElementById("import-preview")!.textContent = JSON.stringify(data, null, 2); }
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const forced = (document.getElementById("import-target-server") as HTMLSelectElement).value;
  const blocks = text.match(/\d{9}[\s\S]*?(?=\d{9}|$)/g);
  if (!blocks) return alert("Nenhum cliente encontrado.");
  for (let i = 0; i < blocks.length; i++) {
    const data = parseSmartBlock(blocks[i], forced);
    if (data) await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), { ...data, createdAt: new Date().toISOString() });
  }
  alert("Finalizado!");
  window.toggleModal("import-modal");
};

// ---------- Filtros e Busca ----------
function getFilteredClients() {
  const q = ((document.getElementById("clients-search") as HTMLInputElement)?.value || "").toLowerCase().trim();
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value || "";
  const cyc = (document.getElementById("clients-filter-cycle") as HTMLSelectElement)?.value || "";

  return clients.filter(c => {
    if (srv && (c.painel || "") !== srv) return false;
    if (cyc && (c.cycle || "mensal") !== cyc) return false;
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.idExt || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });
}

function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;
  cont.innerHTML = "";
  const filtered = getFilteredClients();
  filtered.forEach(c => {
    const sel = selectedClientIds.has(c.id);
    const div = document.createElement("div");
    div.className = `luxury-card p-5 cursor-pointer transition-all ${sel ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-900/10' : ''}`;
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-3">
          ${bulkMode ? `<input type="checkbox" ${sel ? "checked" : ""}>` : ''}
          <div class="min-w-0">
            <div class="font-black uppercase truncate text-slate-800 dark:text-slate-100">${c.nome || 'Sem Nome'}</div>
            <div class="text-[9px] font-bold text-slate-400 mt-1 uppercase">${c.painel || '-'} • ID: ${c.idExt || '-'}</div>
            <div class="text-[10px] font-bold text-slate-500 mt-2">VENC: ${c.venc ? c.venc.split('-').reverse().join('/') : '-'} • R$ ${c.plano?.toFixed(2)}</div>
          </div>
        </div>
        ${!bulkMode ? `
          <div class="flex flex-col gap-2">
            <button onclick="window.openEditClient('${c.id}')" class="text-sky-500 p-1"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            <button onclick="window.deleteClient('${c.id}')" class="text-red-400 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        ` : ''}
      </div>
    `;
    div.onclick = () => { if (bulkMode) { sel ? selectedClientIds.delete(c.id) : selectedClientIds.add(c.id); renderClientsList(); } };
    cont.appendChild(div);
  });
  createIcons({ icons });
}

// ---------- Ações em Massa ----------
window.toggleBulkSelectClients = (force?: boolean) => { bulkMode = force !== undefined ? force : !bulkMode; selectedClientIds.clear(); document.getElementById('clients-bulkbar')?.classList.toggle('hidden', !bulkMode); renderClientsList(); };
window.bulkSelectAllFilteredClients = () => { getFilteredClients().forEach(c => selectedClientIds.add(c.id)); renderClientsList(); };
window.bulkDeleteSelectedClients = async () => { if (confirm(\`Apagar \${selectedClientIds.size}?\`)) { for (const id of selectedClientIds) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); window.toggleBulkSelectClients(false); } };

// ---------- Inicialização ----------
export function installLegacyApp() {
  window.switchTheme(localStorage.getItem('gi-theme') || 'light');
  firebaseApi.onAuthStateChanged(auth, user => {
    if (user) { 
      currentUserId = user.uid; 
      document.getElementById("auth-section")?.classList.add("hidden"); 
      document.getElementById("app-content")?.classList.remove("hidden"); 
      window.startListening(user.uid); 
      document.getElementById("clients-search")?.addEventListener("input", renderClientsList);
      document.getElementById("clients-filter-server")?.addEventListener("change", () => { renderClientsList(); refreshTopProfitBar(); });
      document.getElementById("clients-filter-cycle")?.addEventListener("change", () => { renderClientsList(); refreshTopProfitBar(); });
    }
  });
}

window.startListening = (uid) => {
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", uid, "clients"), s => {
    clients = s.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
    renderClientsList();
    refreshTopProfitBar();
  });
};

// Globais Auxiliares
window.handleAuth = async (m) => {
  const e = (document.getElementById("auth-email") as HTMLInputElement).value;
  const p = (document.getElementById("auth-password") as HTMLInputElement).value;
  try { if (m === 'login') await firebaseApi.signInWithEmailAndPassword(auth, e, p); } catch { alert("Erro."); }
};
window.logout = () => firebaseApi.signOut(auth);
window.switchView = (v) => {
  document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('view-'+v)?.classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nav-'+v)?.classList.add('active');
  createIcons({ icons });
};
window.toggleModal = (id) => document.getElementById(id)?.classList.toggle('active');
window.openImportClients = () => window.toggleModal('import-modal');
window.deleteClient = async (id) => { if (confirm("Apagar?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId!, "clients", id)); };
window.openAddRevenda = () => {}; window.saveRevenda = async () => {}; window.refreshFinance = () => {};
