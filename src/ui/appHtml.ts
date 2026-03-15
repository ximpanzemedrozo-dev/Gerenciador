export const appHtml = `
  <section id="auth-section" class="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
    <div class="w-full max-w-sm">
      <div class="w-24 h-24 bg-sky-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 rotate-3">
        <i data-lucide="shield-check" class="w-12 h-12"></i>
      </div>
      <h1 class="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic mb-2 leading-none">
        GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
      </h1>
      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-12 italic">
        Elite Master Definitive Edition
      </p>
      <div id="auth-error" class="hidden mb-6 p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl border border-red-100"></div>
      <div class="space-y-4">
        <input type="email" id="auth-email" placeholder="E-mail Administrativo" class="input-box">
        <input type="password" id="auth-password" placeholder="Chave de Acesso" class="input-box">
        <button onclick="window.handleAuth('login')" class="w-full bg-sky-500 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest active:scale-95 transition-all">
          Aceder ao Painel
        </button>
      </div>
    </div>
  </section>

  <div id="app-content" class="hidden">
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-black italic tracking-tighter uppercase">
          GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
        </h1>
        <div class="flex gap-2">
          <button onclick="window.toggleDarkMode()" class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400">
            <i id="theme-icon" data-lucide="sun"></i>
          </button>
          <button onclick="window.logout()" class="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </div>
    </header>

    <div id="top-profitbar-wrap" class="fixed top-[72px] left-0 right-0 z-40 px-4 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm pb-3">
      <div class="max-w-7xl mx-auto mt-3">
        <div class="rounded-2xl border border-slate-200 bg-white/95 dark:bg-slate-900/90 p-4 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Custo Total (Starplay/Vision)</div>
              <div id="top-total-casinhas" class="text-2xl font-black text-rose-500 mt-1">R$ 0,00</div>
              <div id="top-casinhas-meta" class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2"></div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Faturamento Bruto</div>
              <div id="top-total-plans" class="text-2xl font-black text-slate-900 dark:text-white mt-1">R$ 0,00</div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Lucro Real Líquido</div>
              <div id="top-real-profit" class="text-3xl font-black text-emerald-600 mt-1">R$ 0,00</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <main id="app-main" class="max-w-7xl mx-auto px-4 pt-64 pb-32">
      <section id="view-clients" class="view-section">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 class="text-2xl font-black italic uppercase tracking-tighter">Clientes</h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Filtro: <span id="clients-count" class="text-slate-900 dark:text-white">0/0</span>
            </p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.toggleBulkSelectClients()" class="bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-xs uppercase">Selecionar</button>
            <button onclick="window.openImportClients()" class="bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Importar</button>
            <button onclick="window.openAddClient()" class="bg-sky-500 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Novo</button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 mb-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Painel</label>
              <select id="clients-filter-server" class="filter-select">
                <option value="">Todos</option>
                <option value="Starplay">Starplay</option>
                <option value="Vision">Vision</option>
                <option value="Primelux">Primelux</option>
                <option value="Play Tv">Play Tv</option>
                <option value="Blast Elite">Blast Elite</option>
                <option value="Blast Flash">Blast Flash</option>
                <option value="Havok Radeon">Havok Radeon</option>
                <option value="Havok Kyros">Havok Kyros</option>
                <option value="Havok Andromeda">Havok Andromeda</option>
                <option value="Havok Neon">Havok Neon</option>
                <option value="Allbox">Allbox</option>
                <option value="Ryzeen">Ryzeen</option>
                <option value="Titan">Titan</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Ciclo</label>
              <select id="clients-filter-cycle" class="filter-select">
                <option value="">Todos</option>
                <option value="mensal">Mensal</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="quadrimestral">Quadrimestral</option>
                <option value="quintomestral">Quintomestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>
          <div class="relative group">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors"></i>
            <input id="clients-search" class="input-box pl-11" placeholder="Buscar por nome, email ou ID..." />
          </div>
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <section id="view-finance" class="view-section hidden">
        <h2 class="text-2xl font-black uppercase mb-4">Ganhos</h2>
        <div id="fin-breakdown" class="space-y-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"></div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border-t border-slate-100 dark:border-slate-800 h-20 flex justify-around items-center px-4 z-50">
      <button onclick="window.switchView('clients')" id="nav-clients" class="nav-btn active"><i data-lucide="users"></i><span>Início</span></button>
      <button onclick="window.switchView('finance')" id="nav-finance" class="nav-btn"><i data-lucide="wallet"></i><span>Ganhos</span></button>
    </nav>
  </div>

  <div id="client-modal" class="modal-overlay" onclick="window.toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <h2 id="client-modal-title" class="text-2xl font-black italic uppercase text-sky-600 mb-6">Cliente</h2>
      <input type="hidden" id="client-edit-id" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome</label><input id="client-nome" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Painel</label><input id="client-painel" class="input-box" /></div>
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Ciclo</label>
          <select id="client-cycle" class="filter-select">
            <option value="mensal">Mensal</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
            <option value="quadrimestral">Quadrimestral</option>
            <option value="quintomestral">Quintomestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Email</label><input id="client-email" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Vencimento</label><input id="client-venc" type="date" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plano (R$)</label><input id="client-plano" class="input-box" value="20.00" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">ID Externo</label><input id="client-idext" class="input-box" /></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-8">
        <button onclick="window.saveClient()" class="bg-sky-500 text-white py-4 rounded-2xl font-black uppercase">Salvar</button>
        <button onclick="window.toggleModal('client-modal')" class="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase">Cancelar</button>
      </div>
    </div>
  </div>
`;
