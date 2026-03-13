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

// ---------- Temas ----------
window.switchTheme = (theme: string) => {
  document.body.classList.remove('dark-mode', 'midnight-mode');
  if (theme === 'dark') document.body.classList.add('dark-mode');
  if (theme === 'midnight') document.body.classList.add('midnight-mode');
  localStorage.setItem('gi-theme', theme);
};

// ---------- Motor de Importação (Regras Específicas) ----------
function parseSmartBlock(text: string, forcedServer: string): Partial<Client> | null {
  const idMatch = text.match(/\b(\d{9})\b/);
  if (!idMatch) return null;

  const result: Partial<Client> = {
    idExt: idMatch[1],
    cycle: 'mensal',
    status: 'Ativo',
    plano: 20,
    painel: forcedServer || 'Outros'
  };

  // Se não foi forçado um servidor, tenta detectar
  if (!forcedServer) {
    if (text.toUpperCase().includes('STAR PLAY')) result.painel = 'Starplay';
    else if (text.toUpperCase().includes('VISION')) result.painel = 'Vision';
  }

  // Vencimento (YYYY-MM-DD para o input date)
  const dateMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    result.venc = `${y}-${m}-${d}`;
  }

  // Plano
  const priceMatch = text.match(/Plano:\s*R\$\s*([\d,.]+)/i);
  if (priceMatch) {
    result.plano = parseFloat(priceMatch[1].replace('.', '').replace(',', '.'));
  }

  // Nome (pega o que vem antes do hífen)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach(line => {
    if (line.includes(' - ') && !line.includes('Criado em') && !line.includes('STAR PLAY')) {
       result.nome = line.split(' - ')[0].trim();
    }
  });

  return result;
}

// ---------- CRUD de Clientes ----------
window.openAddClient = () => {
  (document.getElementById("client-edit-id") as HTMLInputElement).value = "";
  (document.getElementById("client-modal-title")!).textContent = "Novo Cliente";
  (document.getElementById("client-nome") as HTMLInputElement).value = "";
  (document.getElementById("client-idext") as HTMLInputElement).value = "";
  (document.getElementById("client-painel") as HTMLInputElement).value = "";
  (document.getElementById("client-venc") as HTMLInputElement).value = "";
  (document.getElementById("client-plano") as HTMLInputElement).value = "20.00";
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
  (document.getElementById("client-status") as HTMLSelectElement).value = c.status || "Ativo";
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
    status: (document.getElementById("client-status") as HTMLSelectElement).value,
    updatedAt: new Date().toISOString()
  };
  const coll = firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients");
  id ? await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), data)
     : await firebaseApi.addDoc(coll, { ...data, createdAt: data.updatedAt });
  window.toggleModal("client-modal");
};

// ---------- Ações em Massa ----------
window.toggleBulkSelectClients = (force?: boolean) => {
  bulkMode = force !== undefined ? force : !bulkMode;
  selectedClientIds.clear();
  document.getElementById('clients-bulkbar')?.classList.toggle('hidden', !bulkMode);
  renderClientsList();
};

window.bulkSelectAllFilteredClients = () => {
  clients.forEach(c => selectedClientIds.add(c.id));
  updateBulkCount();
  renderClientsList();
};

function updateBulkCount() {
  const el = document.getElementById('clients-bulk-count');
  if (el) el.textContent = String(selectedClientIds.size);
}

window.bulkDeleteSelectedClients = async () => {
  if (!currentUserId || !selectedClientIds.size) return;
  if (!confirm(`Deseja apagar ${selectedClientIds.size} clientes?`)) return;
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
  
  document.getElementById("clients-count")!.textContent = `${clients.length}/${clients.length}`;

  clients.forEach(c => {
    const isSelected = selectedClientIds.has(c.id);
    const div = document.createElement("div");
    div.className = `luxury-card p-5 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-900/10' : ''}`;
    
    div.innerHTML = `
      <div class="flex items-start gap-3">
        ${bulkMode ? `<div class="w-5 h-5 rounded-full border-2 flex items-center justify-center \${isSelected ? 'bg-sky-500 border-sky-500' : 'border-slate-300'}"><i data-lucide="check" class="w-3 h-3 text-white"></i></div>` : ''}
        <div class="flex-1 min-w-0">
          <div class="font-black uppercase truncate text-slate-800 dark:text-slate-100">\${c.nome || 'Sem Nome'}</div>
          <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase">\${c.painel || '-'} • ID: \${c.idExt || '-'} • \${c.status || 'Ativo'}</div>
          <div class="text-[11px] font-bold text-slate-500 mt-2">VENC: \${c.venc ? c.venc.split('-').reverse().join('/') : '-'} • R$ \${c.plano?.toFixed(2)}</div>
        </div>
        \${!bulkMode ? \`
          <div class="flex flex-col gap-2">
            <button onclick="window.openEditClient('\${c.id}')" class="text-sky-500 p-1"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
            <button onclick="window.deleteClient('\${c.id}')" class="text-red-400 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        \` : ''}
      </div>
    `;

    div.onclick = () => {
      if (bulkMode) {
        isSelected ? selectedClientIds.delete(c.id) : selectedClientIds.add(c.id);
        updateBulkCount();
        renderClientsList();
      }
    };
    cont.appendChild(div);
  });
  createIcons({ icons });
}

// ---------- Importação ----------
window.previewImport = () => {
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const forced = (document.getElementById("import-target-server") as HTMLSelectElement).value;
  const blocks = text.match(/\d{9}[\s\S]*?(?=\d{9}|$)/g);
  if (blocks) {
    const data = parseSmartBlock(blocks[0], forced);
    document.getElementById("import-preview")!.textContent = JSON.stringify(data, null, 2);
  }
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;
  const text = (document.getElementById("import-text") as HTMLTextAreaElement).value;
  const forced = (document.getElementById("import-target-server") as HTMLSelectElement).value;
  const blocks = text.match(/\d{9}[\s\S]*?(?=\d{9}|$)/g);
  
  if (!blocks || !blocks.length) return alert("Nenhum cliente detectado.");

  document.getElementById('import-status-area')?.classList.remove('hidden');
  const bar = document.getElementById("import-bar");

  for (let i = 0; i < blocks.length; i++) {
    const data = parseSmartBlock(blocks[i], forced);
    if (data) {
      await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
        ...data, createdAt: new Date().toISOString()
      });
    }
    if (bar) bar.style.width = \`\${((i + 1) / blocks.length) * 100}%\`;
  }
  alert("Finalizado!");
  window.toggleModal("import-modal");
  (document.getElementById("import-text") as HTMLTextAreaElement).value = "";
  document.getElementById('import-status-area')?.classList.add('hidden');
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
  const mensalistas = clients.filter(c => (c.cycle || 'mensal') === 'mensal');
  const total = mensalistas.reduce((acc, c) => acc + (c.plano || 0), 0);
  const custos = mensalistas.filter(c => c.painel === 'Starplay').length * 2.5 + mensalistas.filter(c => c.painel === 'Vision').length * 2.0;
  
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
window.deleteClient = async (id) => {
  if (currentUserId && confirm("Apagar cliente?")) await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
};
