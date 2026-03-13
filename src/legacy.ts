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

// ---------- Motor de Importação Inteligente (Regras Solicitadas) ----------
function parseSmartBlock(text: string): Partial<Client> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: Partial<Client> = { cycle: 'mensal', plano: 20, status: 'Ativo' };

  // 1. ID do Usuário (Busca sequência de 9 dígitos)
  const idMatch = text.match(/\b\d{9}\b/);
  if (idMatch) result.idExt = idMatch[0];

  // 2. Vencimento (Busca formato DD/MM/YYYY que NÃO seja a data de criação)
  // Normalmente o vencimento aparece primeiro ou em destaque.
  const dates = text.match(/\d{2}\/\d{2}\/\d{4}/g);
  if (dates && dates.length > 0) result.venc = dates[0]; // Pega a primeira data (vencimento)

  // 3. Valor do Plano
  const priceMatch = text.match(/R\$\s*([\d,.]+)/);
  if (priceMatch) result.plano = parseFloat(priceMatch[1].replace(',', '.'));

  // 4. Nome/Referência e Status
  lines.forEach(line => {
    // Procura a linha que contém o nome (Irma da Kamila - 12/04/2026...)
    if (line.includes(' - ') && line.includes('/') && !line.includes('Criado em')) {
      result.nome = line.split(' - ')[0].trim();
    }
    if (line.toLowerCase() === 'ativo' || line.toLowerCase() === 'inativo') {
      result.status = line;
    }
  });

  // Fallback: Se não achou nome na linha do hífen, tenta a linha após o ID
  if (!result.nome && lines.length > 5) result.nome = lines[lines.length - 3];

  return result;
}

// ---------- Ações de Clientes e Bulk ----------
window.toggleBulkSelectClients = (force?: boolean) => {
  bulkMode = force !== undefined ? force : !bulkMode;
  selectedClientIds.clear();
  document.getElementById('clients-bulkbar')?.classList.toggle('hidden', !bulkMode);
  renderClientsList();
};

function updateBulkCount() {
  const el = document.getElementById('clients-bulk-count');
  if (el) el.textContent = String(selectedClientIds.size);
}

window.bulkDeleteSelectedClients = async () => {
  if (!currentUserId || selectedClientIds.size === 0) return;
  if (!confirm(`Deseja apagar ${selectedClientIds.size} clientes selecionados?`)) return;

  for (const id of selectedClientIds) {
    await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
  }
  window.toggleBulkSelectClients(false);
};

// ---------- Renderização ----------
function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;

  cont.innerHTML = "";
  clients.forEach(c => {
    const isSelected = selectedClientIds.has(c.id);
    const div = document.createElement("div");
    div.className = `luxury-card p-5 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-sky-500 bg-sky-50/50' : ''}`;
    
    div.innerHTML = `
      <div class="flex items-start gap-3">
        ${bulkMode ? `<input type="checkbox" class="mt-1" ${isSelected ? 'checked' : ''}>` : ''}
        <div class="flex-1 min-w-0">
          <div class="font-black uppercase truncate text-slate-800">${c.nome || 'Sem Nome'}</div>
          <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase">ID: ${c.idExt || '-'} • ${c.status || 'Ativo'}</div>
          <div class="text-[11px] font-bold text-slate-500 mt-2">VENC: ${c.venc || '-'} • R$ ${c.plano?.toFixed(2)}</div>
        </div>
        ${!bulkMode ? `<button onclick="window.deleteClient('${c.id}')" class="text-red-400 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
      </div>
    `;

    div.onclick = (e) => {
      if (bulkMode) {
        if (selectedClientIds.has(c.id)) selectedClientIds.delete(c.id);
        else selectedClientIds.add(c.id);
        renderClientsList();
        updateBulkCount();
      }
    };

    cont.appendChild(div);
  });
  createIcons({ icons });
}

// ---------- Importação ----------
window.previewImport = () => {
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  if (!text) return;
  const blocks = text.split(/UsuárioDatas|Criado em|Conexões: \d+/i).filter(b => b.trim().length > 15);
  const data = parseSmartBlock(blocks[0] || text);
  document.getElementById("import-preview")!.textContent = JSON.stringify(data, null, 2);
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const blocks = text.split(/UsuárioDatas|SituaçãoDetalhesAções/i).filter(b => b.trim().length > 20);
  
  if (!blocks.length) return alert("Nenhum bloco de cliente detectado.");
  if (!confirm(`Importar ${blocks.length} clientes?`)) return;

  document.getElementById('import-status-area')?.classList.remove('hidden');
  const bar = document.getElementById("import-bar");

  for (let i = 0; i < blocks.length; i++) {
    const data = parseSmartBlock(blocks[i]);
    await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
      ...data, createdAt: new Date().toISOString()
    });
    if (bar) bar.style.width = `${((i + 1) / blocks.length) * 100}%`;
  }

  alert("Importação concluída com sucesso!");
  window.toggleModal("import-modal");
  (document.getElementById("import-text") as HTMLTextAreaElement).value = "";
};

// ---------- Inicialização ----------
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
  const mensalistas = clients.filter(c => c.cycle === 'mensal');
  const total = mensalistas.reduce((acc, c) => acc + (c.plano || 0), 0);
  const custos = mensalistas.length * 2.5; // Exemplo de custo fixo
  
  document.getElementById("top-total-plans")!.textContent = "R$ " + total.toFixed(2);
  document.getElementById("top-total-casinhas")!.textContent = "R$ " + custos.toFixed(2);
  document.getElementById("top-real-profit")!.textContent = "R$ " + (total - custos).toFixed(2);
  document.getElementById("clients-count")!.textContent = `${clients.length}/${clients.length}`;
}

// Funções base (Auth/Modal)
window.handleAuth = async (m) => {
  const e = (document.getElementById("auth-email") as HTMLInputElement).value;
  const p = (document.getElementById("auth-password") as HTMLInputElement).value;
  try {
    if (m === 'login') await firebaseApi.signInWithEmailAndPassword(auth, e, p);
  } catch (err) { alert("Erro de login."); }
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
window.deleteClient = async (id) => {
  if (currentUserId && confirm("Apagar cliente?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
};
