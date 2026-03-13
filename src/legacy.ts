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

// ---------- Estado Global ----------
let currentUserId: string | null = null;
let clients: Client[] = [];
let bulkMode = false;
let selectedClientIds = new Set<string>();

// ---------- Funções de Tema ----------
window.switchTheme = (theme: string) => {
  document.body.classList.remove('dark-mode', 'midnight-mode');
  if (theme === 'dark') document.body.classList.add('dark-mode');
  if (theme === 'midnight') document.body.classList.add('midnight-mode');
  localStorage.setItem('gi-theme', theme);
};

// ---------- Motor de Importação Refinado ----------
function parseSmartBlock(text: string): Partial<Client> | null {
  // Extrai o ID de 9 dígitos que deve estar no início do bloco
  const idMatch = text.match(/^\s*(\d{9})/);
  if (!idMatch) return null;

  const result: Partial<Client> = {
    idExt: idMatch[1],
    cycle: 'mensal',
    status: 'Ativo',
    plano: 20
  };

  // 1. Vencimento: Pega a primeira data DD/MM/YYYY que encontrar no bloco
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) result.venc = dateMatch[1];

  // 2. Plano: Procura o valor após "Plano: R$"
  const priceMatch = text.match(/Plano:\s*R\$\s*([\d,.]+)/i);
  if (priceMatch) {
    result.plano = parseFloat(priceMatch[1].replace('.', '').replace(',', '.'));
  }

  // 3. Nome/Referência:
  // Procuramos a linha que contém o padrão "Nome - Detalhes"
  // Geralmente é a linha que antecede a palavra "Plano"
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const planoIndex = lines.findIndex(l => l.toLowerCase().includes('plano:'));
  
  if (planoIndex > 0) {
    const nameLine = lines[planoIndex - 1];
    // Se tiver hífen, pega apenas o que vem antes, conforme solicitado
    result.nome = nameLine.includes(' - ') ? nameLine.split(' - ')[0].trim() : nameLine.trim();
  }

  // 4. Status: Verifica se a palavra Ativo/Inativo está isolada em alguma linha
  if (text.match(/\bAtivo\b/i)) result.status = 'Ativo';
  if (text.match(/\bInativo\b/i)) result.status = 'Inativo';

  return result;
}

// ---------- Ações em Massa (Bulk) ----------
window.toggleBulkSelectClients = (force?: boolean) => {
  bulkMode = force !== undefined ? force : !bulkMode;
  selectedClientIds.clear();
  const bulkBar = document.getElementById('clients-bulkbar');
  if (bulkBar) bulkBar.classList.toggle('hidden', !bulkMode);
  renderClientsList();
};

window.bulkSelectAllFilteredClients = () => {
  // Pega os IDs de todos os clientes que estão aparecendo no momento (filtrados)
  const filtered = getFilteredClients();
  filtered.forEach(c => selectedClientIds.add(c.id));
  updateBulkCount();
  renderClientsList();
};

function updateBulkCount() {
  const el = document.getElementById('clients-bulk-count');
  if (el) el.textContent = String(selectedClientIds.size);
}

window.bulkDeleteSelectedClients = async () => {
  if (!currentUserId || selectedClientIds.size === 0) return;
  if (!confirm(`Deseja apagar definitivamente ${selectedClientIds.size} clientes?`)) return;

  for (const id of selectedClientIds) {
    try {
      await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
    } catch (err) { console.error("Erro ao deletar:", id); }
  }
  window.toggleBulkSelectClients(false);
};

// ---------- Listagem e Filtros ----------
function getFilteredClients() {
  return clients; // Adicionar lógica de filtro aqui se necessário futuramente
}

function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;

  cont.innerHTML = "";
  const filtered = getFilteredClients();
  
  document.getElementById("clients-count")!.textContent = `${filtered.length}/${clients.length}`;

  filtered.forEach(c => {
    const isSelected = selectedClientIds.has(c.id);
    const div = document.createElement("div");
    // Se estiver em modo bulk, o card inteiro vira um botão de seleção
    div.className = `luxury-card p-5 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-900/10' : ''}`;
    
    div.innerHTML = `
      <div class="flex items-start gap-3">
        ${bulkMode ? `<div class="w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-slate-300'}"><i data-lucide="check" class="w-3 h-3 text-white ${isSelected ? '' : 'hidden'}"></i></div>` : ''}
        <div class="flex-1 min-w-0">
          <div class="font-black uppercase truncate text-slate-800 dark:text-slate-100">${c.nome || 'Sem Nome'}</div>
          <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase">ID: ${c.idExt || '-'} • ${c.status || 'Ativo'}</div>
          <div class="text-[11px] font-bold text-slate-500 mt-2">VENC: ${c.venc || '-'} • R$ ${c.plano?.toFixed(2)}</div>
        </div>
        ${!bulkMode ? `<button onclick="window.deleteClient('${c.id}')" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
      </div>
    `;

    div.onclick = () => {
      if (bulkMode) {
        if (selectedClientIds.has(c.id)) selectedClientIds.delete(c.id);
        else selectedClientIds.add(c.id);
        updateBulkCount();
        renderClientsList();
      }
    };

    cont.appendChild(div);
  });
  createIcons({ icons });
}

// ---------- Lógica de Importação ----------
window.previewImport = () => {
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  if (!text) return;
  
  // No preview, pegamos o primeiro bloco que começa com 9 dígitos
  const firstBlock = text.match(/\d{9}[\s\S]*?(?=\d{9}|$)/);
  if (firstBlock) {
    const data = parseSmartBlock(firstBlock[0]);
    document.getElementById("import-preview")!.textContent = JSON.stringify(data, null, 2);
  } else {
    document.getElementById("import-preview")!.textContent = "Nenhum cliente válido detectado.";
  }
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  
  // Regex para separar blocos que iniciam com um número de 9 dígitos
  const blocks = text.match(/\d{9}[\s\S]*?(?=\d{9}|$)/g);
  
  if (!blocks || !blocks.length) return alert("Nenhum cliente detectado. Verifique se copiou o ID de 9 dígitos.");
  if (!confirm(`Importar ${blocks.length} clientes?`)) return;

  const statusArea = document.getElementById('import-status-area');
  const bar = document.getElementById("import-bar");
  const statusTxt = document.getElementById("import-status");
  
  statusArea?.classList.remove('hidden');

  for (let i = 0; i < blocks.length; i++) {
    const data = parseSmartBlock(blocks[i]);
    if (data) {
      await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
        ...data, createdAt: new Date().toISOString()
      });
    }
    const pct = Math.round(((i + 1) / blocks.length) * 100);
    if (bar) bar.style.width = `${pct}%`;
    if (statusTxt) statusTxt.textContent = `Importando: ${i + 1}/${blocks.length}`;
  }

  alert("Importação finalizada com sucesso!");
  window.toggleModal("import-modal");
  (document.getElementById("import-text") as HTMLTextAreaElement).value = "";
  statusArea?.classList.add('hidden');
};

// ---------- Inicialização e Sync ----------
export function installLegacyApp() {
  const savedTheme = localStorage.getItem('gi-theme') || 'light';
  window.switchTheme(savedTheme);

  firebaseApi.onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById("auth-section")?.classList.add("hidden");
      document.getElementById("app-content")?.classList.remove("hidden");
      window.startListening(user.uid);
    }
  });
}

window.startListening = (uid) => {
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", uid, "clients"), snap => {
    clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
    renderClientsList();
    refreshTopProfitBar();
  });
};

function refreshTopProfitBar() {
  const mensalistas = clients.filter(c => (c.cycle || 'mensal') === 'mensal');
  const total = mensalistas.reduce((acc, c) => acc + (c.plano || 0), 0);
  const custos = mensalistas.length * 2.5; 
  
  document.getElementById("top-total-plans")!.textContent = "R$ " + total.toFixed(2);
  document.getElementById("top-total-casinhas")!.textContent = "R$ " + custos.toFixed(2);
  document.getElementById("top-real-profit")!.textContent = "R$ " + (total - custos).toFixed(2);
}

// Globais Auxiliares
window.handleAuth = async (m) => {
  const e = (document.getElementById("auth-email") as HTMLInputElement).value;
  const p = (document.getElementById("auth-password") as HTMLInputElement).value;
  try { if (m === 'login') await firebaseApi.signInWithEmailAndPassword(auth, e, p); } catch { alert("Erro de login."); }
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
window.openAddClient = () => { /* Lógica de abrir form vazio */ };
window.deleteClient = async (id) => {
  if (currentUserId && confirm("Deseja apagar este cliente?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
};
