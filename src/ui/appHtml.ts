export const appHtml = `
  <section id="auth-section" class="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
    <div class="w-full max-w-sm">
      <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic mb-8">
        GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
      </h1>
      <div id="auth-error" class="hidden mb-6 p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl border border-red-100"></div>
      <div class="space-y-4">
        <input type="email" id="auth-email" placeholder="E-mail" class="input-box">
        <input type="password" id="auth-password" placeholder="Senha" class="input-box">
        <button onclick="window.handleAuth('login')" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-md">Entrar</button>
      </div>
    </div>
  </section>

  <div id="app-content" class="hidden">
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-black italic tracking-tighter uppercase text-slate-800 dark:text-white">GERENCIADOR <span class="text-sky-500">INTELIGENTE</span></h1>
        <div class="flex gap-2">
          <button onclick="window.toggleDarkMode()" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400"><i id="theme-icon" data-lucide="sun"></i></button>
          <button onclick="window.logout()" class="p-2.5 rounded-xl bg-red-50 text-red-500 border border-red-100"><i data-lucide="log-out"></i></button>
        </div>
      </div>
    </header>

    <div id="top-profitbar-wrap" class="fixed top-[72px] left-0 right-0 z-40 px-4 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm pb-4">
      <div class="max-w-7xl mx-auto mt-2 relative">
        <button onclick="window.toggleModal('dash-settings-modal')" class="absolute -top-1 -right-1 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md border dark:border-slate-700 z-50 text-slate-400 hover:text-sky-500 transition-colors">
          <i data-lucide="settings" class="w-4 h-4"></i>
        </button>
        <div class="rounded-3xl border border-slate-200 bg-white/95 dark:bg-slate-900/90 p-4 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><div class="text-[10px] font-black uppercase text-slate-400 mb-1">Custo Seleção</div><div id="top-total-casinhas" class="text-2xl font-black text-rose-500">R$ 0,00</div></div>
            <div><div class="text-[10px] font-black uppercase text-slate-400 mb-1">Faturamento</div><div id="top-total-plans" class="text-2xl font-black text-slate-900 dark:text-white">R$ 0,00</div></div>
            <div><div class="text-[10px] font-black uppercase text-slate-400 mb-1">Lucro Líquido</div><div id="top-real-profit" class="text-2xl font-black text-emerald-600">R$ 0,00</div></div>
          </div>
          <div id="dash-info-text" class="text-[9px] font-bold uppercase text-slate-400 mt-2 border-t pt-2 dark:border-slate-800">Filtrando indicadores...</div>
        </div>
      </div>
    </div>

    <main id="app-main" class="max-w-7xl mx-auto px-4 pt-72 pb-32">
      <section id="view-clients" class="view-section">
        <div class="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
          <h2 class="text-2xl font-black italic uppercase tracking-tighter text-slate-800 dark:text-white">Clientes (<span id="clients-count">0/0</span>)</h2>
          <div class="flex gap-2">
            <button onclick="window.toggleBulkSelectClients()" class="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">Selecionar</button>
            <button onclick="window.openImportClients()" class="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">Importar</button>
            <button onclick="window.openAddClient()" class="bg-sky-500 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">Novo</button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 mb-6 space-y-4 shadow-sm">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select id="clients-filter-server" class="filter-select">
              <option value="">Todos Painéis</option>
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
            <div class="flex flex-col gap-1">
              <label class="text-[8px] font-bold text-slate-400 uppercase ml-1">De</label>
              <input type="date" id="filter-date-start" class="filter-select h-10" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[8px] font-bold text-slate-400 uppercase ml-1">Até</label>
              <input type="date" id="filter-date-end" class="filter-select h-10" />
            </div>
          </div>
          <div class="relative"><i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i><input id="clients-search" class="input-box pl-11 py-3" placeholder="Procurar nome, login, ID..." /></div>
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>

        <div id="clients-bulkbar" class="hidden fixed bottom-24 left-0 right-0 px-4 z-[60]">
          <div class="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xl p-4 flex justify-between items-center">
            <span class="text-xs font-black uppercase text-slate-800 dark:text-white">Itens: <span id="clients-bulk-count" class="text-sky-500">0</span></span>
            <div class="flex gap-2">
              <button onclick="window.bulkSelectAllFilteredClients()" class="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase">Todos</button>
              <button onclick="window.bulkDeleteSelectedClients()" class="bg-red-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase">Apagar</button>
              <button onclick="window.toggleBulkSelectClients(false)" class="bg-slate-100 text-slate-500 px-3 py-2 rounded-xl text-[10px] font-black uppercase">Sair</button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t dark:border-slate-800 h-20 flex justify-around items-center px-4 z-50 shadow-2xl">
      <button onclick="window.switchView('clients')" id="nav-clients" class="nav-btn active"><i data-lucide="users"></i><span>Clientes</span></button>
      <button onclick="window.switchView('finance')" id="nav-finance" class="nav-btn"><i data-lucide="wallet"></i><span>Ganhos</span></button>
    </nav>
  </div>

  <div id="dash-settings-modal" class="modal-overlay" onclick="window.toggleModal('dash-settings-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] p-6 shadow-3xl" onclick="event.stopPropagation()">
      <h2 class="text-xl font-black uppercase text-sky-600 mb-6">Ajustar Dashboard</h2>
      <div class="space-y-4">
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Período de Cálculo</label>
          <select id="dash-setting-period" class="filter-select p-3 h-12" onchange="window.toggleDashCustomDates(this.value)">
            <option value="current_month">Apenas Vencimentos deste Mês</option>
            <option value="all_time">Todos os tempos (Base Completa)</option>
            <option value="custom">Período Personalizado</option>
          </select>
        </div>
        <div id="dash-custom-dates" class="hidden grid grid-cols-2 gap-3">
          <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Início</label><input type="date" id="dash-start" class="input-box" /></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Fim</label><input type="date" id="dash-end" class="input-box" /></div>
        </div>
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Filtrar por Painel</label>
          <div id="dash-panel-options" class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border dark:border-slate-800 rounded-xl"></div>
        </div>
      </div>
      <button onclick="window.saveDashSettings()" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase mt-8">Aplicar Filtros</button>
    </div>
  </div>

  <div id="client-modal" class="modal-overlay" onclick="window.toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <h2 id="client-modal-title" class="text-2xl font-black uppercase text-sky-600 mb-6">Cliente</h2>
      <input type="hidden" id="client-edit-id" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome</label><input id="client-nome" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Servidor</label>
          <select id="client-painel" class="filter-select p-3 h-[52px]">
            <option value="Starplay">Starplay</option><option value="Vision">Vision</option><option value="Primelux">Primelux</option>
            <option value="Play Tv">Play Tv</option><option value="Blast Elite">Blast Elite</option><option value="Blast Flash">Blast Flash</option>
            <option value="Havok Radeon">Havok Radeon</option><option value="Havok Kyros">Havok Kyros</option><option value="Havok Andromeda">Havok Andromeda</option>
            <option value="Havok Neon">Havok Neon</option><option value="Allbox">Allbox</option><option value="Ryzeen">Ryzeen</option><option value="Titan">Titan</option>
          </select>
        </div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Ciclo</label>
          <select id="client-cycle" class="filter-select p-3 h-[52px]">
            <option value="mensal">Mensal</option><option value="bimestral">Bimestral</option><option value="trimestral">Trimestral</option>
            <option value="quadrimestral">Quadrimestral</option><option value="quintomestral">Quintomestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option>
          </select>
        </div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Vencimento</label><input id="client-venc" type="date" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plano (R$)</label><input id="client-plano" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">ID Externo</label><input id="client-idext" class="input-box" /></div>
      </div>
      <button onclick="window.saveClient()" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase mt-8 shadow-md">Gravar</button>
    </div>
  </div>

  <div id="import-modal" class="modal-overlay" onclick="window.toggleModal('import-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 shadow-3xl" onclick="event.stopPropagation()">
      <h2 class="text-2xl font-black italic uppercase text-sky-600 mb-6">Importar Clientes</h2>
      <div class="mb-4">
        <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block ml-1">Servidor de Destino</label>
        <select id="import-target-server" class="filter-select p-3 h-12">
          <option value="">Detectar Automaticamente</option>
          <option value="Starplay">Starplay</option><option value="Vision">Vision</option><option value="Primelux">Primelux</option>
          <option value="Play Tv">Play Tv</option><option value="Blast Elite">Blast Elite</option><option value="Blast Flash">Blast Flash</option>
          <option value="Havok Radeon">Havok Radeon</option><option value="Havok Kyros">Havok Kyros</option><option value="Havok Andromeda">Havok Andromeda</option>
          <option value="Havok Neon">Havok Neon</option><option value="Allbox">Allbox</option><option value="Ryzeen">Ryzeen</option><option value="Titan">Titan</option>
        </select>
      </div>
      <textarea id="import-text" class="w-full h-48 border dark:border-slate-700 rounded-2xl p-4 font-mono text-[10px] mb-4 outline-none dark:bg-slate-800" placeholder="Cole o texto do painel aqui..."></textarea>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="window.importClientsFromText()" class="bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[10px]">Importar Tudo</button>
        <button onclick="window.toggleModal('import-modal')" class="bg-slate-200 text-slate-500 py-3 rounded-xl font-black uppercase text-[10px]">Fechar</button>
      </div>
    </div>
  </div>
`;
