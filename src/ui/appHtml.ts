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
        <button id="btn-login" class="w-full bg-sky-500 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest active:scale-95 transition-all">
          Aceder ao Painel
        </button>
        <button id="btn-signup" class="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-6 hover:text-sky-500 transition-colors">
          Criar Nova Credencial
        </button>
      </div>
    </div>
  </section>

  <div id="app-content" class="hidden">
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-black italic tracking-tighter uppercase">
          GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
        </h1>
        <div class="flex gap-2">
          <button onclick="toggleDarkMode()" class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400" title="Tema">
            <i id="theme-icon" data-lucide="sun"></i>
          </button>
          <button onclick="logout()" class="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100" title="Sair">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </div>
    </header>

    <div id="top-profitbar-wrap" class="sticky top-[72px] z-40 px-4">
      <div class="max-w-7xl mx-auto mt-3 mb-2">
        <div class="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Custo Total (Logins Ativos)</div>
              <div id="top-total-casinhas" class="text-2xl font-black text-rose-500 mt-1">R$ 0,00</div>
              <div id="top-casinhas-meta" class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2"></div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Faturamento Bruto</div>
              <div id="top-total-plans" class="text-2xl font-black text-slate-900 mt-1">R$ 0,00</div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Lucro Real Líquido</div>
              <div id="top-real-profit" class="text-3xl font-black text-emerald-600 mt-1">R$ 0,00</div>
            </div>
          </div>
          <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3 border-t pt-2">
            Base: <span class="text-slate-700">37 Logins</span> (Starplay R$ 2.50 / Vision R$ 2.00 / Outros R$ 0.00)
          </div>
        </div>
      </div>
    </div>

    <main id="app-main" class="max-w-7xl mx-auto px-4 pt-5 pb-32">
      <section id="view-clients" class="view-section">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 class="text-2xl font-black italic uppercase tracking-tighter">Clientes</h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Filtro: <span id="clients-count" class="text-slate-900">0/0</span>
            </p>
          </div>
          <div class="flex gap-2">
            <button onclick="toggleBulkSelectClients()" class="bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-xs uppercase">Selecionar</button>
            <button onclick="openImportClients()" class="bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Importar</button>
            <button onclick="openAddClient()" class="bg-sky-500 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Novo</button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 mb-4 space-y-3 shadow-sm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Servidor</label>
              <select id="clients-filter-server" class="filter-select">
                <option value="">Todos</option>
                <option value="Starplay">Starplay</option>
                <option value="Vision">Vision</option>
                <option value="Primelux">Primelux</option>
                <option value="Havok Radeon">Havok Radeon</option>
                <option value="Blast Elite">Blast Elite</option>
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
          <div class="relative">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input id="clients-search" class="input-box pl-11" placeholder="Buscar por nome, email ou ID..." />
          </div>
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>
    </main>
  </div>
`;
