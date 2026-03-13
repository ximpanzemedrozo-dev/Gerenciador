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

declare global {
  interface Window {
    handleAuth: (mode: "login" | "signup") => Promise<void>;
    toggleModal: (id: string) => void;
    toggleDarkMode: () => void;

    // core
    initialize12Servers: (userId: string) => Promise<void>;
    startListening: (userId: string) => void;

    // nav
    switchView: (v: string) => void;

    // revendas
    openAddRevenda: () => void;
    openEditRevenda: (id: string) => void;
    saveRevenda: () => Promise<void>;
    deleteRevenda: (id: string) => Promise<void>;
  }
}

const FULL_SERVERS_LIST = [
  "Havok Radeon",
  "Havok Kyros",
  "Havok Andromeda",
  "Havok Neon",
  "Blast Elite",
  "Blast Flash",
  "Primelux",
  "Starplay",
  "Vision",
  "Allbox",
  "Ryzeen",
  "Titan"
];

const CASINHA_COST: Record<string, number> = {
  Vision: 2.0,
  Starplay: 2.5
};

let currentUserId: string | null = null;
let servers: Server[] = [];
let revendas: Revenda[] = [];

// ---------- helpers ----------
function money(n: number) {
  return `R$ ${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNum(raw: string): number {
  const v = (raw || "").toString().trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getServerCostByName(name: string): number {
  // se existir no Firestore servers, usa custo; senão usa casinha defaults quando applicable, senão 0
  const s = servers.find((x) => x.name === name);
  if (s) return Number(s.cost) || 0;
  if (CASINHA_COST[name] != null) return CASINHA_COST[name];
  return 0;
}

// ---------- install ----------
export function installLegacyApp() {
  document.getElementById("btn-login")?.addEventListener("click", () => window.handleAuth("login"));
  document.getElementById("btn-signup")?.addEventListener("click", () => window.handleAuth("signup"));

  firebaseApi.onAuthStateChanged(auth, async (user) => {
    const authDiv = document.getElementById("auth-section");
    const appDiv = document.getElementById("app-content");
    if (!authDiv || !appDiv) return;

    if (user) {
      currentUserId = user.uid;
      authDiv.classList.add("hidden");
      appDiv.classList.remove("hidden");

      await window.initialize12Servers(user.uid);
      window.startListening(user.uid);

      // abre em revendas por enquanto (pois é a parte pronta)
      window.switchView("revendas");
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

window.switchView = (v) => {
  document.querySelectorAll(".view-section").forEach((s) => s.classList.add("hidden"));
  document.getElementById(`view-${v}`)?.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(`nav-${v}`)?.classList.add("active");

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
    Primelux: 4.0,
    Allbox: 3.0,
    Ryzeen: 3.5,
    Titan: 4.0
  };

  for (const name of FULL_SERVERS_LIST) {
    if (!existingNames.includes(name)) {
      await firebaseApi.addDoc(srvPath, {
        name,
        cost: defaults[name] ?? 2.5,
        createdAt: new Date().toISOString()
      });
    }
  }
};

window.startListening = (userId) => {
  // servers listener
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "servers"), (snap) => {
    servers = snap.docs.map((d) => {
      const data = d.data() as any;
      return { id: d.id, name: data.name, cost: Number(data.cost) || 0 };
    });

    // se o modal de revenda estiver aberto, atualiza o grid
    if (document.getElementById("revenda-modal")?.classList.contains("active")) {
      renderRevendaServerGridFromServers();
      updateRevendaTotalsFromInputs();
    }
  });

  // revendas listener
  firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", userId, "revendas"), (snap) => {
    revendas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Revenda[];
    renderRevendasList();
  });
};

// ---------- Revendas UI ----------
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

    // casinhas custo fixo para Vision/Starplay
    if (CASINHA_COST[srvName] != null) {
      totalCasinhas += count * CASINHA_COST[srvName];
    }

    // custo do painel (se cadastrado em servers)
    totalCustoServers += count * getServerCostByName(srvName);
  }

  // lucro “real”: receita - custo servers
  // (isso já inclui Vision/Starplay, porque o custo desses servidores default = 2.0/2.5 ao criar)
  const lucro = totalPaga - totalCustoServers;

  return { totalPaga, totalCasinhas, totalCustoServers, lucro };
}

function renderRevendaServerGridFromServers(existing?: Record<string, RevendaServerRow>) {
  const grid = document.getElementById("rev-server-grid");
  if (!grid) return;

  const list = servers.length ? servers.map((s) => s.name) : FULL_SERVERS_LIST;
  grid.innerHTML = "";

  for (const srvName of list) {
    const ex = existing?.[srvName];
    const row = document.createElement("div");
    row.className = "flex items-center gap-3 rounded-2xl border border-slate-200 p-4";

    row.innerHTML = `
      <div class="flex-1">
        <div class="font-black uppercase text-slate-700">${srvName}</div>
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Custo unidade: ${money(getServerCostByName(srvName))}
        </div>
      </div>

      <div class="w-24">
        <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">QTD</label>
        <input class="input-box !p-3 !rounded-xl !bg-slate-900 !text-white text-center"
               inputmode="numeric"
               data-srv="${srvName}"
               data-type="count"
               value="${ex?.count ?? 0}">
      </div>

      <div class="w-28">
        <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">R$ / cliente</label>
        <input class="input-box !p-3 !rounded-xl !bg-slate-900 !text-white text-center"
               inputmode="decimal"
               data-srv="${srvName}"
               data-type="price"
               value="${ex?.price ?? 0}">
      </div>
    `;

    grid.appendChild(row);
  }

  // listeners de cálculo em tempo real
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

  // remove linhas 0/0 pra não poluir o Firestore
  for (const [k, v] of Object.entries(out)) {
    if ((v.count || 0) <= 0 && (v.price || 0) <= 0) delete out[k];
  }
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

// ---------- Revendas actions ----------
window.openAddRevenda = () => {
  (document.getElementById("revenda-modal-title") as HTMLElement | null)?.replaceChildren(
    document.createTextNode("Nova Revenda")
  );

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

  (document.getElementById("revenda-modal-title") as HTMLElement | null)?.replaceChildren(
    document.createTextNode("Editar Revenda")
  );

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

  if (!nome) {
    alert("Informe o nome do parceiro.");
    return;
  }

  const serversMap = readRevendaServersFromInputs();

  const payload = {
    nome,
    divisoes,
    payDate1,
    payDate2,
    servers: serversMap,
    updatedAt: new Date().toISOString()
  };

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
