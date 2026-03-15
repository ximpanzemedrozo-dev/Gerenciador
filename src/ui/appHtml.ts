export const appHtml = `
  <section id="auth-section" class="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
    <div class="w-full max-w-sm">
      <div class="w-20 h-20 bg-sky-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 rotate-3 shadow-lg">
        <i data-lucide="shield-check" class="w-10 h-10"></i>
      </div>
      <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic mb-2 leading-none">
        GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
      </h1>
      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-10 italic">Elite Master Edition</p>
      <div id="auth-error" class="hidden mb-6 p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl border border-red-100"></div>
      <div class="space-y-4">
        <input type="email" id="auth-email" placeholder="E-mail" class="input-box">
        <input type="password" id="auth-password" placeholder="Chave de Acesso" class="input-box">
        <button onclick="window.handleAuth('login')" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md">
          Aceder ao Painel
        </button>
      </div>
    </div>
  </section>

  <div id="app-content" class="hidden">
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-black italic tracking-tighter uppercase">GERENCIADOR <span class="text-sky-500">INTELIGENTE</span></h1>
        <div class="flex gap-2">
          <button onclick="window.toggleDarkMode()" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
            <i id="theme-icon" data-lucide="sun"></i>
          </button>
          <button onclick="window.logout()" class="p-2.5 rounded-xl bg-red-50 text-red-500 border border-red-100">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </div>
    </header>

    <div id="top-profitbar-wrap" class="fixed top-[72px] left-0 right-0 z-40 px-4 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm pb-4">
      <div class="max-w-7xl mx-auto mt-2">
        <div class="rounded-3xl border border-slate-200 bg-white/95 dark:bg-slate-900/90 p-4 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-3 md:pb-0">
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Custo Total (Logins)</div>
              <div id="top-total-casinhas" class="text-2xl font-black text-rose-500">R$ 0,00</div>
              <div id="top-casinhas-meta" class="text-[9px] font-bold text-slate-400 mt-1 uppercase"></div>
            </div>
            <div class="border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-3 md:pb-0">
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Faturamento Bruto</div>
              <div id="top-total-plans" class="text-2xl font-black text-slate-900 dark:text-white">R$ 0,00</div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lucro Real Líquido</div>
              <div id="top-real-profit" class="text-2xl font-black text-emerald-600">R$ 0,00</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <main id="app-main" class="max-w-7xl mx-auto px-4 pt-64 pb-32">
      <section id="view-clients" class="view-section">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 class="text-2xl font-black italic uppercase tracking-tighter">Clientes</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total: <span id="clients-count" class="text-slate-900 dark:text-white">0/0</span></p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.toggleBulkSelectClients()" class="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">Selecionar</button>
            <button onclick="window.openImportClients()" class="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">Importar</button>
            <button onclick="window.openAddClient()" class="bg-sky-500 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">Novo</button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 mb-6 space-y-3 shadow-sm">
          <div class="grid grid-cols-2 gap-3">
            <select id="clients-filter-server" class="filter-select">
              <option value="">Todos Painéis</option>
              <option value="Starplay">Starplay</option>
              <option value="Vision">Vision</option>
              <option value="Primelux">Primelux</option>
              <option value="Blast Elite">Blast Elite</option>
              <option value="Havok Neon">Havok Neon</option>
            </select>
            <select id="clients-filter-cycle" class="filter-select">
              <option value="">Todos Ciclos</option>
              <option value="mensal">Mensal</option>
              <option value="bimestral">Bimestral</option>
              <option value="trimestral">Trimestral</option>
              <option value="quadrimestral">Quadrimestral</option>
              <option value="quintomestral">Quintomestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <div class="relative">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input id="clients-search" class="input-box pl-11 py-3" placeholder="Buscar por nome, login ou ID..." />
          </div>
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>

        <div id="clients-bulkbar" class="hidden fixed bottom-24 left-0 right-0 px-4 z-[60]">
          <div class="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <span class="text-xs font-black uppercase text-slate-500">Selecionados: <span id="clients-bulk-count" class="text-sky-500">0</span></span>
            <div class="flex gap-2">
              <button onclick="window.bulkSelectAllFilteredClients()" class="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase">Todos</button>
              <button onclick="window.bulkDeleteSelectedClients()" class="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase">Apagar</button>
              <button onclick="window.toggleBulkSelectClients(false)" class="text-slate-400 font-black text-[10px] uppercase">Sair</button>
            </div>
          </div>
        </div>
      </section>

      <section id="view-finance" class="view-section hidden">
        <h2 class="text-2xl font-black italic uppercase tracking-tighter mb-4">Ganhos Gerais</h2>
        <div id="fin-breakdown" class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3"></div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t dark:border-slate-800 h-20 flex justify-around items-center px-4 z-50 shadow-2xl">
      <button onclick="window.switchView('clients')" id="nav-clients" class="nav-btn active"><i data-lucide="users"></i><span>Clientes</span></button>
      <button onclick="window.switchView('finance')" id="nav-finance" class="nav-btn"><i data-lucide="wallet"></i><span>Ganhos</span></button>
    </nav>
  </div>

  <div id="client-modal" class="modal-overlay" onclick="window.toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <div class="flex justify-between items-start mb-6">
        <h2 id="client-modal-title" class="text-2xl font-black italic uppercase text-sky-600">Cliente</h2>
        <button onclick="window.toggleModal('client-modal')" class="text-slate-400 font-black">X</button>
      </div>
      <input type="hidden" id="client-edit-id" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome</label><input id="client-nome" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Painel</label><input id="client-painel" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Ciclo</label>
          <select id="client-cycle" class="filter-select"><option value="mensal">Mensal</option><option value="bimestral">Bimestral</option><option value="trimestral">Trimestral</option><option value="quadrimestral">Quadrimestral</option><option value="quintomestral">Quintomestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option></select>
        </div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Vencimento</label><input id="client-venc" type="date" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plano (R$)</label><input id="client-plano" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">ID Externo</label><input id="client-idext" class="input-box" /></div>
      </div>
      <button onclick="window.saveClient()" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase mt-8 shadow-md">Guardar Alterações</button>
    </div>
  </div>

  <div id="import-modal" class="modal-overlay" onclick="window.toggleModal('import-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 shadow-3xl" onclick="event.stopPropagation()">
      <h2 class="text-2xl font-black italic uppercase text-sky-600 mb-6">Importação Inteligente</h2>
      <textarea id="import-text" class="w-full h-48 border rounded-2xl p-4 font-mono text-[10px] mb-4 outline-none dark:bg-slate-800" placeholder="Cole o texto do painel aqui..."></textarea>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="window.previewImport()" class="bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-[10px]">Testar 1º Bloco</button>
        <button onclick="window.importClientsFromText()" class="bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[10px]">Importar Tudo</button>
      </div>
      <pre id="import-preview" class="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] overflow-auto max-h-32 border dark:border-slate-700"></pre>
    </div>
  </div>
`;
