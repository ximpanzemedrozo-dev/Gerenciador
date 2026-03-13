import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

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
  rawImport?: string;

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
  }
}

const CASINHA_COST: Record<string, number> = { Vision: 2.0, Starplay: 2.5 };

const FULL_SERVERS_LIST = [
  "Havok Radeon",
  "Havok Kyros",
  "Havok Andromeda",
  "Havok Neon",
  "Blast Elite",
  "Blast Flash",
  "Play Tv",
  "Primelux",
  "Starplay",
  "Vision",
  "Allbox",
  "Ryzeen",
  "Titan"
];

const SERVER_GROUPS: Array<{ title: string; servers: string[] }> = [
  { title: "Havok", servers: ["Havok Radeon", "Havok Kyros", "Havok Andromeda", "Havok Neon"] },
  { title: "Blast", servers: ["Blast Elite", "Blast Flash", "Play Tv"] },
  { title: "Premium", servers: ["Primelux"] },
  { title: "Casinhas", servers: ["Starplay", "Vision"] },
  { title: "Outros", servers: ["Allbox", "Ryzeen", "Titan"] }
];

let currentUserId: string | null = null;
let servers: Server[] = [];
let revendas: Revenda[] = [];
let clients: Client[] = [];

// ---------- helpers ----------
function money(n: number) {
  return `R$ ${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNum(raw: string): number {
  const v = (raw || "").toString().trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toIsoDateFromPtDate(d: string): string {
  const m = d.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeServerName(raw: string): string {
  const s = (raw || "").toUpperCase();

  if (s.includes("STAR") && s.includes("PLAY")) return "Starplay";
  if (s.includes("STARPLAY")) return "Starplay";
  if (s.includes("VISION")) return "Vision";
  if (s.includes("PRIMELUX") || s.includes("PRIME LUX") || s.includes("PRIME")) return "Primelux";
  if (s.includes("PLAY TV")) return "Play Tv";
  if (s.includes("BLAST")) {
    if (s.includes("ELITE")) return "Blast Elite";
    if (s.includes("FLASH")) return "Blast Flash";
  }
  if (s.includes("HAVOK")) {
    if (s.includes("RADEON")) return "Havok Radeon";
    if (s.includes("KYROS")) return "Havok Kyros";
    if (s.includes("ANDROMEDA")) return "Havok Andromeda";
    if (s.includes("NEON")) return "Havok Neon";
  }

  const clean = raw.trim();
  if (!clean) return "";
  return clean
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function normalizeCycle(raw: string): BillingCycle {
  const s = (raw || "").toLowerCase().trim();
  if (s === "bimestral") return "bimestral";
  if (s === "trimestral") return "trimestral";
  if (s === "semestral") return "semestral";
  if (s === "anual") return "anual";
  return "mensal";
}

function ensureUiToggleButton() {
  const headerRow = document.querySelector("#app-content header .max-w-7xl");
  if (!headerRow) return;
  if (document.getElementById("ui-mode-btn")) return;

  const btn = document.createElement("button");
  btn.id = "ui-mode-btn";
  btn.className = "ui-toggle-btn";
  btn.type = "button";
  btn.onclick = () => window.toggleUiMode();
  btn.innerHTML = `<span id="ui-mode-label">Mobile</span>`;

  const rightSide = headerRow.querySelector(".flex.gap-2");
  if (rightSide) rightSide.prepend(btn);
  else headerRow.appendChild(btn);

  syncUiModeLabel();
}

function syncUiModeLabel() {
  const label = document.getElementById("ui-mode-label");
  if (!label) return;
  label.textContent = document.body.classList.contains("compact-ui") ? "Mobile" : "Desktop";
}

function setImportProgress(done: number, total: number, msg = "") {
  const bar = document.getElementById("import-bar") as HTMLDivElement | null;
  const status = document.getElementById("import-status") as HTMLDivElement | null;
  const log = document.getElementById("import-log") as HTMLDivElement | null;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  if (bar) bar.style.width = `${pct}%`;
  if (status) status.textContent = `${done}/${total} (${pct}%)`;
  if (log && msg) log.textContent = msg;
}

function isoToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetweenIso(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------- install ----------
export function installLegacyApp() {
  document.getElementById("btn-login")?.addEventListener("click", () => window.handleAuth("login"));
  document.getElementById("btn-signup")?.addEventListener("click", () => window.handleAuth("signup"));

  document.body.classList.add("compact-ui");

  firebaseApi.onAuthStateChanged(auth, async (user) => {
    const authDiv = document.getElementById("auth-section");
    const appDiv = document.getElementById("app-content");
    if (!authDiv || !appDiv) return;

    if (user) {
      currentUserId = user.uid;
      authDiv.classList.add("hidden");
      appDiv.classList.remove("hidden");

      ensureUiToggleButton();

      await window.initialize12Servers(user.uid);
      window.startListening(user.uid);

      document.getElementById("clients-search")?.addEventListener("input", () => renderClientsList());
      document.getElementById("clients-filter-server")?.addEventListener("change", () => {
        renderClientsList();
        window.refreshFinance();
      });
      document.getElementById("clients-filter-cycle")?.addEventListener("change", () => {
        renderClientsList();
        window.refreshFinance();
      });

      window.switchView("clients");
    } else {
      currentUserId = null;
      authDiv.classList.remove("hidden");
      appDiv.classList.add("hidden");
    }
  });

  createIcons({ icons });
}

// ---------- auth ----------
window.handleAuth = async (mode) => {
  const email = (document.getElementById("auth-email") as HTMLInputElement | null)?.value;
  const password = (document.getElementById("auth-password") as HTMLInputElement | null)?.value;
  const errorEl = document.getElementById("auth-error") as HTMLDivElement | null;

  if (!email || !password || !errorEl) return;

  errorEl.classList.add("hidden");
  errorEl.innerText = "";

  try {
    if (mode === "login") await firebaseApi.signInWithEmailAndPassword(auth, email, password);
    else await firebaseApi.createUserWithEmailAndPassword(auth, email, password);
  } catch {
    errorEl.innerText = "Falha no acesso. Verifique as suas credenciais.";
    errorEl.classList.remove("hidden");
  }
};

// ---------- ui helpers ----------
window.toggleModal = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("active");
  document.body.style.overflow = el.classList.contains("active") ? "hidden" : "auto";
};

window.toggleDarkMode = () => {
  document.body.classList.toggle("dark-mode");
  const icon = document.getElementById("theme-icon");
  const isDark = document.body.classList.contains("dark-mode");
  icon?.setAttribute("data-lucide", isDark ? "moon" : "sun");
  createIcons({ icons });
};

window.toggleUiMode = () => {
  document.body.classList.toggle("compact-ui");
  syncUiModeLabel();
};

window.logout = async () => {
  await firebaseApi.signOut(auth);
};

window.switchView = (v) => {
  document.querySelectorAll(".view-section").forEach((s) => s.classList.add("hidden"));
  document.getElementById(`view-${v}`)?.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(`nav-${v}`)?.classList.add("active");

  // quando abrir finance, já renderiza
  if (v === "finance") window.refreshFinance();

  createIcons({ icons });
};

// ---------- firestore init ----------
window.initialize12Servers = async (userId) => {
  const srvPath = firebaseApi.collection(db, "artifacts", appId, "users", userId, "servers");
  const snap = await firebaseApi.getDocs(srvPath);
  const existingNames = snap.docs.map((d) => (d.data() as any).name);

  const defaults: Record<string, number> = {
    Vision: 2.0,
    Starplay: 2.5,
    "Havok Radeon": 3.0,
    "Havok Kyros": 3.0,
    "Havok Andromeda": 3.0,
    "Havok Neon": 3.0,
    "Blast Elite": 3.5,
    "Blast Flash": 3.5,
    "Play Tv": 3.5,
    Primelux: 4.0,
    Allbox: 3.0,
    Ryzeen: 3.5,
    Titan: 4.0
  };

  for (const name of FULL_SERVERS_LIST) {
    if (!existingNames.includes(name)) {
      await firebaseApi.addDoc(srvPath, { name, cost: defaults[name] ?? 2.5, createdAt: new Date().toISOString() });
    }
  }
};

window.startListening = (userId) => {
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "clients"), (snap) => {
    clients = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Client[];
    renderClientsList();
    window.refreshFinance();
  });

  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "servers"), (snap) => {
    servers = snap.docs.map((d) => {
      const data = d.data() as any;
      return { id: d.id, name: data.name, cost: Number(data.cost) || 0 };
    });

    if (document.getElementById("revenda-modal")?.classList.contains("active")) {
      renderRevendaServerGridFromServers();
      updateRevendaTotalsFromInputs();
    }
  });

  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "revendas"), (snap) => {
    revendas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Revenda[];
    renderRevendasList();
  });
};

// ---------- Clients ----------
function currentClientFilters() {
  const q = ((document.getElementById("clients-search") as HTMLInputElement | null)?.value || "").toLowerCase().trim();
  const serverFilter = (document.getElementById("clients-filter-server") as HTMLSelectElement | null)?.value || "";
  const cycleFilter = (document.getElementById("clients-filter-cycle") as HTMLSelectElement | null)?.value || "";
  return { q, serverFilter, cycleFilter };
}

function getFilteredClients(): Client[] {
  const { q, serverFilter, cycleFilter } = currentClientFilters();

  return clients.filter((c) => {
    if (serverFilter && (c.painel || "") !== serverFilter) return false;
    if (cycleFilter && (c.cycle || "mensal") !== cycleFilter) return false;

    if (!q) return true;
    return (
      (c.nome || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.painel || "").toLowerCase().includes(q) ||
      (c.idExt || "").toLowerCase().includes(q)
    );
  });
}

function renderClientsList() {
  const cont = document.getElementById("clients-list");
  if (!cont) return;

  const filtered = getFilteredClients();

  if (filtered.length === 0) {
    cont.innerHTML = `<div class="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Nenhum cliente encontrado.</div>`;
    return;
  }

  cont.innerHTML = "";
  for (const c of filtered) {
    const div = document.createElement("div");
    div.className = "rounded-2xl border border-slate-200 bg-white p-5";

    const vencTxt = c.venc ? c.venc.split("-").reverse().join("/") : "-";
    const planoTxt = typeof c.plano === "number" ? money(c.plano) : "-";
    const cycleTxt = (c.cycle || "mensal").toUpperCase();

    div.innerHTML = `
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0">
          <div class="font-black uppercase text-slate-800 truncate">${c.nome || "Sem nome"}</div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">${c.painel || "-"}</div>
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">${cycleTxt}</div>
          <div class="text-[11px] text-slate-500 mt-1 truncate">${c.email || ""}</div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Venc: ${vencTxt} • Plano: ${planoTxt}</div>
        </div>

        <div class="flex flex-col gap-2">
          <button class="bg-slate-100 px-4 py-2 rounded-xl font-black text-xs uppercase" data-act="edit">Editar</button>
          <button class="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-xs uppercase" data-act="del">Apagar</button>
        </div>
      </div>
    `;

    div.querySelector('[data-act="edit"]')?.addEventListener("click", () => window.openEditClient(c.id));
    div.querySelector('[data-act="del"]')?.addEventListener("click", () => window.deleteClient(c.id));
    cont.appendChild(div);
  }

  createIcons({ icons });
}

function setClientForm(data: Partial<Client>) {
  (document.getElementById("client-edit-id") as HTMLInputElement | null)!.value = data.id || "";
  (document.getElementById("client-nome") as HTMLInputElement | null)!.value = data.nome || "";
  (document.getElementById("client-painel") as HTMLInputElement | null)!.value = data.painel || "";
  (document.getElementById("client-cycle") as HTMLSelectElement | null)!.value = (data.cycle as any) || "mensal";

  (document.getElementById("client-email") as HTMLInputElement | null)!.value = data.email || "";
  (document.getElementById("client-senha") as HTMLInputElement | null)!.value = data.senha || "";
  (document.getElementById("client-venc") as HTMLInputElement | null)!.value = data.venc || "";

  (document.getElementById("client-plano") as HTMLInputElement | null)!.value =
    typeof data.plano === "number" ? String(data.plano).replace(".", ",") : "";
  (document.getElementById("client-conexoes") as HTMLInputElement | null)!.value = String(data.conexoes ?? 1);
  (document.getElementById("client-idext") as HTMLInputElement | null)!.value = data.idExt || "";
  (document.getElementById("client-obs") as HTMLInputElement | null)!.value = data.obs || "Aplicativo e Mac: ";
}

window.openAddClient = () => {
  const t = document.getElementById("client-modal-title");
  if (t) t.textContent = "Novo Cliente";
  setClientForm({ id: "", conexoes: 1, obs: "Aplicativo e Mac: ", cycle: "mensal" });
  window.toggleModal("client-modal");
};

window.openEditClient = (id) => {
  const c = clients.find((x) => x.id === id);
  if (!c) return;
  const t = document.getElementById("client-modal-title");
  if (t) t.textContent = "Editar Cliente";
  setClientForm(c);
  window.toggleModal("client-modal");
};

window.saveClient = async () => {
  if (!currentUserId) return;

  const id = (document.getElementById("client-edit-id") as HTMLInputElement | null)?.value || "";
  const nome = (document.getElementById("client-nome") as HTMLInputElement | null)?.value?.trim() || "";
  const painel = normalizeServerName((document.getElementById("client-painel") as HTMLInputElement | null)?.value || "");
  const cycle = normalizeCycle((document.getElementById("client-cycle") as HTMLSelectElement | null)?.value || "mensal");

  const email = (document.getElementById("client-email") as HTMLInputElement | null)?.value?.trim() || "";
  const senha = (document.getElementById("client-senha") as HTMLInputElement | null)?.value || "";
  const venc = (document.getElementById("client-venc") as HTMLInputElement | null)?.value || "";
  const plano = parseNum((document.getElementById("client-plano") as HTMLInputElement | null)?.value || "");
  const conexoes = Math.max(
    1,
    Math.floor(parseNum((document.getElementById("client-conexoes") as HTMLInputElement | null)?.value || "1"))
  );
  const idExt = (document.getElementById("client-idext") as HTMLInputElement | null)?.value?.trim() || "";
  const obs = (document.getElementById("client-obs") as HTMLInputElement | null)?.value || "";

  if (!nome) return alert("Informe o nome do cliente.");
  if (!painel) return alert("Informe o painel.");

  const payload: Omit<Client, "id"> = {
    nome,
    painel,
    cycle,
    email,
    senha,
    venc,
    plano: Number.isFinite(plano) ? plano : 0,
    conexoes,
    idExt,
    obs,
    updatedAt: new Date().toISOString()
  };

  if (id) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id), payload);
  } else {
    await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
      ...payload,
      createdAt: new Date().toISOString()
    });
  }

  window.toggleModal("client-modal");
};

window.deleteClient = async (id) => {
  if (!currentUserId) return;
  if (!confirm("Apagar este cliente?")) return;
  await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "clients", id));
};

// ---------- Import (SÓ servidor override) ----------
function parseImportBlock(text: string): Partial<Client> {
  const lines = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out: Partial<Client> = { obs: "Aplicativo e Mac: ", rawImport: text };

  const idLine = lines.find((l) => /^[0-9]{5,}$/.test(l));
  if (idLine) out.idExt = idLine;

  const painelLine = lines.find((l) => /STAR\s*PLAY|STARPLAY|VISION|HAVOK|BLAST|PRIME|PRIMELUX|PLAY\s*TV/i.test(l)) || "";
  if (painelLine) out.painel = normalizeServerName(painelLine.replace(/-?\s*IPTV.*/i, "").trim() || painelLine);

  const emailLine = lines.find((l) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l));
  if (emailLine) out.email = emailLine;

  const vencLine = lines.find((l) => /^\d{2}\/\d{2}\/\d{4},\s*\d{2}:\d{2}:\d{2}$/.test(l));
  if (vencLine) out.venc = toIsoDateFromPtDate(vencLine);

  const nameLine = lines.find((l) => /-.*\d{2}\/\d{2}\/\d{4}/.test(l));
  if (nameLine) {
    const nome = nameLine.split("-")[0]?.trim();
    if (nome) out.nome = nome;
  }

  const planoLine = lines.find((l) => /Plano:\s*R\$\s*/i.test(l));
  if (planoLine) out.plano = parseNum(planoLine.replace(/Plano:\s*R\$\s*/i, "").trim());

  const conLine = lines.find((l) => /Conex(ões|oes):/i.test(l));
  if (conLine) out.conexoes = Math.max(1, Math.floor(parseNum(conLine.replace(/Conex(ões|oes):/i, "").trim())));

  const statusLine = lines.find((l) => /^Ativo$/i.test(l) || /^Inativo$/i.test(l));
  if (statusLine) out.status = statusLine;

  return out;
}

function splitImportBlocks(text: string): string[] {
  const rawLines = (text || "").split("\n");
  const blocks: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    const b = buf.join("\n").trim();
    if (b) blocks.push(b);
    buf = [];
  };

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (/^[0-9]{5,}$/.test(trimmed)) {
      if (buf.length > 0) flush();
    }
    buf.push(line);
  }

  flush();
  return blocks;
}

function getImportServerOverride() {
  return (document.getElementById("import-server") as HTMLSelectElement | null)?.value || "";
}

window.openImportClients = () => {
  const ta = document.getElementById("import-text") as HTMLTextAreaElement | null;
  const prev = document.getElementById("import-preview") as HTMLElement | null;
  const log = document.getElementById("import-log") as HTMLElement | null;

  if (ta) ta.value = "";
  if (prev) prev.textContent = "";
  if (log) log.textContent = "";

  const srvSel = document.getElementById("import-server") as HTMLSelectElement | null;
  if (srvSel) srvSel.value = "";

  setImportProgress(0, 0, "");
  window.toggleModal("import-modal");
};

window.previewImport = () => {
  const ta = document.getElementById("import-text") as HTMLTextAreaElement | null;
  const prev = document.getElementById("import-preview") as HTMLElement | null;
  if (!ta || !prev) return;

  const importServer = getImportServerOverride();

  const blocks = splitImportBlocks(ta.value);
  const first = blocks[0] || "";
  const parsed = parseImportBlock(first);

  const preview = {
    ...parsed,
    painel: importServer ? importServer : parsed.painel
  };

  prev.textContent = JSON.stringify(
    { blocks: blocks.length, overrides: { importServer: importServer || "AUTO" }, first: preview },
    null,
    2
  );

  setImportProgress(0, blocks.length, "Prévia gerada do 1º bloco (com servidor override).");
};

window.applyImportToClientForm = () => {
  const ta = document.getElementById("import-text") as HTMLTextAreaElement | null;
  if (!ta) return;

  const importServer = getImportServerOverride();

  const blocks = splitImportBlocks(ta.value);
  const first = blocks[0] || "";
  const parsed = parseImportBlock(first);

  const painel = importServer ? importServer : normalizeServerName(parsed.painel || "");

  const t = document.getElementById("client-modal-title");
  if (t) t.textContent = "Novo Cliente (Importado)";

  setClientForm({
    id: "",
    nome: parsed.nome || "",
    painel,
    cycle: "mensal", // padrão; você ajusta depois no form se quiser
    email: parsed.email || "",
    senha: "",
    venc: parsed.venc || "",
    plano: typeof parsed.plano === "number" ? parsed.plano : 0,
    conexoes: parsed.conexoes ?? 1,
    idExt: parsed.idExt || "",
    obs: parsed.obs || "Aplicativo e Mac: "
  });

  const importEl = document.getElementById("import-modal");
  if (importEl?.classList.contains("active")) window.toggleModal("import-modal");
  if (!document.getElementById("client-modal")?.classList.contains("active")) window.toggleModal("client-modal");
};

window.importClientsFromText = async () => {
  if (!currentUserId) return;

  const ta = document.getElementById("import-text") as HTMLTextAreaElement | null;
  if (!ta) return;

  const importServer = getImportServerOverride();

  const blocks = splitImportBlocks(ta.value);
  if (blocks.length === 0) return alert("Cole pelo menos 1 cliente para importar.");

  let ok = 0;
  let fail = 0;

  setImportProgress(0, blocks.length, "Iniciando importação...");

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const parsed = parseImportBlock(b);

    const nome = (parsed.nome || "").trim();
    const painel = importServer ? importServer : normalizeServerName(parsed.painel || "");
    const venc = parsed.venc || "";

    if (!nome || !painel || !venc) {
      fail++;
      setImportProgress(i + 1, blocks.length, `Falhou bloco ${i + 1}/${blocks.length}: faltou nome/painel/vencimento.`);
      continue;
    }

    try {
      const payload: Omit<Client, "id"> = {
        nome,
        painel,
        cycle: "mensal", // IMPORT não escolhe ciclo (você pediu assim)
        email: parsed.email || "",
        senha: "",
        venc,
        plano: typeof parsed.plano === "number" ? parsed.plano : 0,
        conexoes: parsed.conexoes ?? 1,
        idExt: parsed.idExt || "",
        obs: parsed.obs || "Aplicativo e Mac: ",
        status: parsed.status || "",
        rawImport: parsed.rawImport || b,
        updatedAt: new Date().toISOString()
      };

      await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "clients"), {
        ...payload,
        createdAt: new Date().toISOString()
      });

      ok++;
      setImportProgress(i + 1, blocks.length, `Importando... OK: ${ok} | Falhas: ${fail}`);
    } catch (e) {
      fail++;
      setImportProgress(i + 1, blocks.length, `Erro no bloco ${i + 1}: ${String(e)}`);
    }

    await new Promise((r) => setTimeout(r, 30));
  }

  setImportProgress(blocks.length, blocks.length, `Finalizado. Importados: ${ok} | Falhas: ${fail}`);
  alert(`Importação concluída.\nImportados: ${ok}\nFalhas: ${fail}`);
};

// ---------- Finance (dashboard "bem" ao abrir) ----------
function sumPlan(list: Client[]) {
  return list.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);
}

function countDueSoon(list: Client[], days = 7) {
  const today = isoToday();
  return list.filter((c) => {
    if (!c.venc) return false;
    const diff = daysBetweenIso(today, c.venc);
    return diff >= 0 && diff <= days;
  }).length;
}

function groupKey(c: Client) {
  const cycle = c.cycle || "mensal";
  const painel = c.painel || "-";
  return `${cycle}__${painel}`;
}

window.refreshFinance = () => {
  const list = getFilteredClients();

  const totalClientsEl = document.getElementById("fin-total-clients");
  const totalPlansEl = document.getElementById("fin-total-plans");
  const dueSoonEl = document.getElementById("fin-due-soon");
  const breakdownEl = document.getElementById("fin-breakdown");

  if (!totalClientsEl || !totalPlansEl || !dueSoonEl || !breakdownEl) return;

  totalClientsEl.textContent = String(list.length);
  totalPlansEl.textContent = money(sumPlan(list));
  dueSoonEl.textContent = String(countDueSoon(list, 7));

  const groups = new Map<string, { cycle: string; painel: string; count: number; total: number }>();
  for (const c of list) {
    const key = groupKey(c);
    const [cycle, painel] = key.split("__");
    const current = groups.get(key) || { cycle, painel, count: 0, total: 0 };
    current.count += 1;
    current.total += Number(c.plano) || 0;
    groups.set(key, current);
  }

  const rows = Array.from(groups.values()).sort((a, b) => (a.cycle + a.painel).localeCompare(b.cycle + b.painel));

  if (rows.length === 0) {
    breakdownEl.innerHTML = `<div class="text-sm text-slate-500">Sem dados com os filtros atuais.</div>`;
    return;
  }

  breakdownEl.innerHTML = rows
    .map((r) => {
      return `
        <div class="rounded-2xl border border-slate-200 p-4 bg-slate-50">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-black uppercase text-slate-800">${r.cycle.toUpperCase()}</div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">${r.painel}</div>
              <div class="text-xs text-slate-600 mt-2">Clientes: <span class="font-black">${r.count}</span></div>
            </div>
            <div class="text-right">
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total</div>
              <div class="text-xl font-black text-emerald-600">${money(r.total)}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
};

// ---------- Revendas (mantido) ----------
function renderRevendasList() {
  const cont = document.getElementById("revendas-list");
  if (!cont) return;

  if (revendas.length === 0) {
    cont.innerHTML = `<div class="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Nenhuma revenda cadastrada ainda.</div>`;
    return;
  }

  cont.innerHTML = "";
  for (const r of revendas) {
    const calc = calcRevendaTotals(r.servers || {});
    const div = document.createElement("div");
    div.className = "rounded-2xl border border-slate-200 bg-white p-6";

    div.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <div>
          <h3 class="text-lg font-black uppercase text-sky-600">${r.nome ?? "Sem nome"}</h3>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total paga: ${money(calc.totalPaga)}</div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Custo casinhas: ${money(calc.totalCasinhas)}</div>
          <div class="text-[11px] font-black uppercase tracking-widest mt-2">Lucro: <span class="text-sky-600">${money(calc.lucro)}</span></div>
        </div>
        <div class="flex flex-col gap-2">
          <button class="bg-slate-100 px-4 py-2 rounded-xl font-black text-xs uppercase" data-act="edit">Editar</button>
          <button class="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-xs uppercase" data-act="del">Apagar</button>
        </div>
      </div>
    `;

    div.querySelector('[data-act="edit"]')?.addEventListener("click", () => window.openEditRevenda(r.id));
    div.querySelector('[data-act="del"]')?.addEventListener("click", () => window.deleteRevenda(r.id));
    cont.appendChild(div);
  }

  createIcons({ icons });
}

function calcRevendaTotals(serversMap: Record<string, RevendaServerRow>) {
  let totalPaga = 0;
  let totalCasinhas = 0;
  let totalCustoServers = 0;

  for (const [srvName, data] of Object.entries(serversMap || {})) {
    const count = Number(data?.count) || 0;
    const price = Number(data?.price) || 0;

    totalPaga += count * price;

    if (CASINHA_COST[srvName] != null) totalCasinhas += count * CASINHA_COST[srvName];
    totalCustoServers += count * getServerCostByName(srvName);
  }

  const lucro = totalPaga - totalCustoServers;
  return { totalPaga, totalCasinhas, totalCustoServers, lucro };
}

function sectionTitleHtml(title: string) {
  return `
    <div class="mt-6 mb-2">
      <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">${title}</div>
    </div>
  `;
}

function renderServerRowHtml(srvName: string, ex?: RevendaServerRow) {
  return `
    <div class="rounded-2xl border border-slate-200 p-4 bg-white">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-center">
        <div class="min-w-0">
          <div class="font-black uppercase text-slate-700 truncate">${srvName}</div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Custo unidade: ${money(getServerCostByName(srvName))}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">QTD</label>
            <input class="mini-input" type="number" inputmode="numeric" data-srv="${srvName}" data-type="count" value="${ex?.count ?? 0}" />
          </div>

          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">R$ / cliente</label>
            <input class="mini-input" inputmode="decimal" data-srv="${srvName}" data-type="price" value="${ex?.price ?? 0}" />
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRevendaServerGridFromServers(existing?: Record<string, RevendaServerRow>) {
  const grid = document.getElementById("rev-server-grid");
  if (!grid) return;

  const firestoreNames = servers.map((s) => s.name);
  const allowed = new Set([...FULL_SERVERS_LIST, ...firestoreNames]);

  grid.innerHTML = "";

  for (const g of SERVER_GROUPS) {
    const items = g.servers.filter((name) => allowed.has(name));
    if (items.length === 0) continue;

    grid.insertAdjacentHTML("beforeend", sectionTitleHtml(g.title));
    for (const srvName of items) grid.insertAdjacentHTML("beforeend", renderServerRowHtml(srvName, existing?.[srvName]));
  }

  grid.querySelectorAll("input[data-srv]").forEach((el) => {
    el.addEventListener("input", () => updateRevendaTotalsFromInputs());
  });
}

function readRevendaServersFromInputs(): Record<string, RevendaServerRow> {
  const out: Record<string, RevendaServerRow> = {};
  document.querySelectorAll<HTMLInputElement>("#rev-server-grid input[data-srv]").forEach((input) => {
    const srv = input.getAttribute("data-srv") || "";
    const type = input.getAttribute("data-type") as "count" | "price";
    if (!srv || !type) return;

    if (!out[srv]) out[srv] = { count: 0, price: 0 };
    if (type === "count") out[srv].count = Math.max(0, Math.floor(parseNum(input.value)));
    if (type === "price") out[srv].price = Math.max(0, parseNum(input.value));
  });

  for (const [k, v] of Object.entries(out)) if ((v.count || 0) <= 0 && (v.price || 0) <= 0) delete out[k];
  return out;
}

function updateRevendaTotalsFromInputs() {
  const totalPagaEl = document.getElementById("rev-total-paga");
  const totalCasinhasEl = document.getElementById("rev-total-custo-casinhas");
  const lucroEl = document.getElementById("rev-total-lucro");
  if (!totalPagaEl || !totalCasinhasEl || !lucroEl) return;

  const map = readRevendaServersFromInputs();
  const calc = calcRevendaTotals(map);

  totalPagaEl.textContent = money(calc.totalPaga);
  totalCasinhasEl.textContent = money(calc.totalCasinhas);
  lucroEl.textContent = money(calc.lucro);
}

window.openAddRevenda = () => {
  const title = document.getElementById("revenda-modal-title");
  if (title) title.textContent = "Nova Revenda";

  (document.getElementById("rev-edit-id") as HTMLInputElement | null)!.value = "";
  (document.getElementById("rev-nome") as HTMLInputElement | null)!.value = "";
  (document.getElementById("rev-divisoes") as HTMLInputElement | null)!.value = "1";
  (document.getElementById("rev-pay-date-1") as HTMLInputElement | null)!.value = "";
  (document.getElementById("rev-pay-date-2") as HTMLInputElement | null)!.value = "";

  renderRevendaServerGridFromServers({});
  updateRevendaTotalsFromInputs();
  window.toggleModal("revenda-modal");
};

window.openEditRevenda = (id) => {
  const r = revendas.find((x) => x.id === id);
  if (!r) return;

  const title = document.getElementById("revenda-modal-title");
  if (title) title.textContent = "Editar Revenda";

  (document.getElementById("rev-edit-id") as HTMLInputElement | null)!.value = r.id;
  (document.getElementById("rev-nome") as HTMLInputElement | null)!.value = r.nome ?? "";
  (document.getElementById("rev-divisoes") as HTMLInputElement | null)!.value = String(r.divisoes ?? 1);
  (document.getElementById("rev-pay-date-1") as HTMLInputElement | null)!.value = r.payDate1 ?? "";
  (document.getElementById("rev-pay-date-2") as HTMLInputElement | null)!.value = r.payDate2 ?? "";

  renderRevendaServerGridFromServers(r.servers || {});
  updateRevendaTotalsFromInputs();
  window.toggleModal("revenda-modal");
};

window.saveRevenda = async () => {
  if (!currentUserId) return;

  const id = (document.getElementById("rev-edit-id") as HTMLInputElement | null)?.value || "";
  const nome = (document.getElementById("rev-nome") as HTMLInputElement | null)?.value?.trim() || "";
  const divisoes = Math.max(1, Math.floor(parseNum((document.getElementById("rev-divisoes") as HTMLInputElement | null)?.value || "1")));
  const payDate1 = (document.getElementById("rev-pay-date-1") as HTMLInputElement | null)?.value || "";
  const payDate2 = (document.getElementById("rev-pay-date-2") as HTMLInputElement | null)?.value || "";

  if (!nome) return alert("Informe o nome do parceiro.");

  const serversMap = readRevendaServersFromInputs();
  const payload = { nome, divisoes, payDate1, payDate2, servers: serversMap, updatedAt: new Date().toISOString() };

  if (id) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "revendas", id), payload);
  } else {
    await firebaseApi.addDoc(firebaseApi.collection(db, "artifacts", appId, "users", currentUserId, "revendas"), {
      ...payload,
      createdAt: new Date().toISOString()
    });
  }

  window.toggleModal("revenda-modal");
};

window.deleteRevenda = async (id) => {
  if (!currentUserId) return;
  if (!confirm("Deseja apagar esta revenda?")) return;
  await firebaseApi.deleteDoc(firebaseApi.doc(db, "artifacts", appId, "users", currentUserId, "revendas", id));
};
