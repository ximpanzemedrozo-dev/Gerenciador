import { auth, db, appId, firebaseApi } from "./firebase";
import { createIcons, icons } from "lucide";

// ---------- Tipos ----------
type Client = { id: string; nome?: string; painel?: string; cycle?: string; email?: string; venc?: string; plano?: number; idExt?: string; };

// ---------- Estado ----------
let clients: Client[] = [];

// ---------- Lógica de Lucro Real (Correção Solicitada) ----------
function refreshTopProfitBar() {
  const totalPlansEl = document.getElementById("top-total-plans");
  const totalCasinhasEl = document.getElementById("top-total-casinhas");
  const realProfitEl = document.getElementById("top-real-profit");

  if (!totalPlansEl || !totalCasinhasEl || !realProfitEl) return;

  // 1. Faturamento Bruto: Soma total de todos os planos cadastrados (não importa o ciclo)
  const faturamentoBruto = clients.reduce((acc, c) => acc + (Number(c.plano) || 0), 0);

  // 2. Custo Real (Baseado em 37 Logins): 
  // Starplay = 2.50 | Vision = 2.00 | Outros = 0.00
  const custoTotal = clients.reduce((acc, c) => {
    const painel = (c.painel || "").trim();
    let custoItem = 0;
    if (painel === "Starplay") custoItem = 2.50;
    else if (painel === "Vision") custoItem = 2.00;
    return acc + custoItem;
  }, 0);

  // 3. Lucro Real Líquido
  const lucroReal = faturamentoBruto - custoTotal;

  totalPlansEl.textContent = "R$ " + faturamentoBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  totalCasinhasEl.textContent = "R$ " + custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  realProfitEl.textContent = "R$ " + lucroReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  
  const countEl = document.getElementById("clients-count");
  if (countEl) countEl.textContent = `${clients.length}/${clients.length}`;
}

// ---------- Renderização e Filtros ----------
function renderClientsList() {
  const q = ((document.getElementById("clients-search") as HTMLInputElement)?.value || "").toLowerCase();
  const srv = (document.getElementById("clients-filter-server") as HTMLSelectElement)?.value;
  const cyc = (document.getElementById("clients-filter-cycle") as HTMLSelectElement)?.value;

  const filtered = clients.filter(c => {
    if (srv && c.painel !== srv) return false;
    if (cyc && (c.cycle || "mensal") !== cyc) return false;
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.idExt || "").toLowerCase().includes(q);
  });

  const cont = document.getElementById("clients-list");
  if (!cont) return;
  cont.innerHTML = "";
  filtered.forEach(c => {
    const div = document.createElement("div");
    div.className = "luxury-card p-5";
    div.innerHTML = `
      <div class="font-black uppercase text-slate-800">${c.nome || 'Sem Nome'}</div>
      <div class="text-[10px] font-bold text-slate-400 uppercase mt-1">${c.painel || '-'} • ${c.cycle || 'mensal'}</div>
      <div class="text-[11px] font-bold text-slate-500 mt-2">VENC: ${c.venc || '-'} • R$ ${Number(c.plano).toFixed(2)}</div>
    `;
    cont.appendChild(div);
  });
  createIcons({ icons });
}

// ---------- Inicialização ----------
export function installLegacyApp() {
  firebaseApi.onAuthStateChanged(auth, user => {
    if (user) {
      document.getElementById("auth-section")?.classList.add("hidden");
      document.getElementById("app-content")?.classList.remove("hidden");
      
      firebaseApi.onSnapshot(firebaseApi.collection(db, "artifacts", appId, "users", user.uid, "clients"), snap => {
        clients = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
        renderClientsList();
        refreshTopProfitBar();
      });

      document.getElementById("clients-search")?.addEventListener("input", renderClientsList);
      document.getElementById("clients-filter-server")?.addEventListener("change", renderClientsList);
      document.getElementById("clients-filter-cycle")?.addEventListener("change", renderClientsList);
    }
  });
}
