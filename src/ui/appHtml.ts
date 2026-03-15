export const appHtml = `
  <section id="auth-section" class="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
    <div class="w-full max-w-sm">
      <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic mb-8">
        GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
      </h1>
      <div id="auth-error" class="hidden mb-6 p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl border border-red-100"></div>
      <div class="space-y-4">
        <input type="email" id="auth-email" placeholder="E-mail Administrativo" class="input-box">
        <input type="password" id="auth-password" placeholder="Chave de Acesso" class="input-box">
        <button onclick="window.handleAuth('login')" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-md">Aceder ao Painel</button>
      </div>
    </div>
  </section>

  <div id="app-content" class="hidden">
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-black italic tracking-tighter uppercase text-slate-800 dark:text-white">GERENCIADOR <span class="text-sky-500">INTELIGENTE</span></h1>
        <div class="flex gap-2">
          <button onclick="window.toggleModal('notification-modal')" id="notif-btn" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 relative">
            <i data-lucide="bell"></i>
            <span id="notif-badge" class="hidden absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
          </button>
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
      <div class="max-w-7xl mx-auto mt-2 relative">
        <button onclick="window.toggleModal('dash-settings-modal')" class="absolute -top-1 -right-1 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md border dark:border-slate-700 z-50 text-slate-400 hover:text-sky-500 transition-colors">
          <i data-lucide="settings" class="w-4 h-4"></i>
        </button>
        <div class="rounded-3xl border border-slate-200 bg-white/95 dark:bg-slate-900/90 p-4 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><div class="text-[10px] font-black uppercase text-slate-400 mb-1">Custo Seleção</div><div id="top-total-casinhas" class="text-2xl font-black text-rose-500">R$ 0,00</div></div>
            <div><div class="text-[10px] font-black uppercase text-slate-400 mb-1">Faturamento</div><div id="top-total-plans" class="text-2xl font-black text-slate-900 dark:text-white">R$ 0,00</div></div>
            <div><div class="text-[10px] font-black uppercase text-slate-400 mb-1">Lucro Real</div><div id="top-real-profit" class="text-2xl font-black text-emerald-600">R$ 0,00</div></div>
          </div>
          <div id="dash-info-text" class="text-[9px] font-bold uppercase text-slate-400 mt-2 border-t pt-2 dark:border-slate-800 italic text-center">Dashboard Ativa</div>
        </div>
      </div>
    </div>

    <main id="app-main" class="max-w-7xl mx-auto px-4 pt-72 pb-32">
      <section id="view-clients" class="view-section">
        <div class="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
          <h2 class="text-2xl font-black italic uppercase tracking-tighter text-slate-800 dark:text-white">Clientes (<span id="clients-count">0/0</span>)</h2>
          <div class="flex gap-2">
            <button onclick="window.toggleBulkSelectClients()" class="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-sm">Selecionar</button>
            <button onclick="window.openImportClients()" class="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-sm">Importar</button>
            <button onclick="window.openAddClient()" class="bg-sky-500 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-sm">Novo Cliente</button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 mb-6 space-y-4 shadow-sm">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select id="clients-filter-server" class="filter-select">
              <option value="">Todos Servidores</option>
              <option value="Starplay">Starplay</option><option value="Vision">Vision</option><option value="Primelux">Primelux</option>
              <option value="Play Tv">Play Tv</option><option value="Blast Elite">Blast Elite</option><option value="Blast Flash">Blast Flash</option>
              <option value="Havok Radeon">Havok Radeon</option><option value="Havok Kyros">Havok Kyros</option><option value="Havok Andromeda">Havok Andromeda</option>
              <option value="Havok Neon">Havok Neon</option><option value="Allbox">Allbox</option><option value="Ryzeen">Ryzeen</option><option value="Titan">Titan</option>
            </select>
            <select id="clients-filter-cycle" class="filter-select">
              <option value="">Todos Ciclos</option>
              <option value="mensal">Mensal</option><option value="bimestral">Bimestral</option><option value="trimestral">Trimestral</option>
              <option value="quadrimestral">Quadrimestral</option><option value="quintomestral">Quintomestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option>
            </select>
            <div class="flex flex-col gap-1">
              <label class="text-[8px] font-bold text-slate-400 uppercase ml-1">Venc. De</label>
              <input type="date" id="filter-date-start" class="filter-select h-10" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[8px] font-bold text-slate-400 uppercase ml-1">Venc. Até</label>
              <input type="date" id="filter-date-end" class="filter-select h-10" />
            </div>
          </div>
          <div class="relative">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input id="clients-search" class="input-box pl-11 py-3" placeholder="Buscar por nome, login, painel ou ID..." />
          </div>
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t dark:border-slate-800 h-20 flex justify-around items-center px-4 z-50">
      <button onclick="window.switchView('clients')" id="nav-clients" class="nav-btn active"><i data-lucide="users"></i><span>Painel</span></button>
      <button onclick="window.switchView('finance')" id="nav-finance" class="nav-btn"><i data-lucide="wallet"></i><span>Financeiro</span></button>
    </nav>
  </div>

  <div id="notification-modal" class="modal-overlay" onclick="window.toggleModal('notification-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-6 shadow-3xl max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
      <h2 class="text-xl font-black uppercase text-sky-600 mb-2 italic">Alertas do Dia</h2>
      <p class="text-[10px] text-slate-400 uppercase font-bold mb-6">Vencimentos hoje e amanhã</p>
      <div id="notif-list" class="space-y-3"></div>
      <button onclick="window.toggleModal('notification-modal')" class="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-2xl font-black uppercase mt-8">Entendido</button>
    </div>
  </div>

  <div id="dash-settings-modal" class="modal-overlay" onclick="window.toggleModal('dash-settings-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] p-6 shadow-3xl" onclick="event.stopPropagation()">
      <h2 class="text-xl font-black uppercase text-sky-600 mb-6 italic">Configurar Exibição</h2>
      <div class="space-y-4">
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Período de Cálculo</label>
          <select id="dash-setting-period" class="filter-select p-3 h-12" onchange="window.toggleDashCustomDates(this.value)">
            <option value="current_month">Apenas Vencimentos deste Mês</option>
            <option value="all_time">Toda a Base</option>
            <option value="custom">Período Customizado</option>
          </select>
        </div>
        <div id="dash-custom-dates" class="hidden grid grid-cols-2 gap-3">
          <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Data Inicial</label><input type="date" id="dash-start" class="input-box" /></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Data Final</label><input type="date" id="dash-end" class="input-box" /></div>
        </div>
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Painéis na Dashboard</label>
          <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50" id="dash-server-checkboxes"></div>
        </div>
      </div>
      <button onclick="window.saveDashSettings()" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase mt-8 shadow-md">Atualizar</button>
    </div>
  </div>

  <div id="client-modal" class="modal-overlay" onclick="window.toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <h2 id="client-modal-title" class="text-2xl font-black uppercase text-sky-600 mb-6">Cadastro</h2>
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
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Vencimento</label><input id="client-venc" type="date" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plano R$</label><input id="client-plano" class="input-box" /></div>
        <div class="md:col-span-2"><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">ID Externo</label><input id="client-idext" class="input-box" /></div>
      </div>
      <button onclick="window.saveClient()" class="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase mt-8 shadow-md">Gravar</button>
    </div>
  </div>

  <div id="import-modal" class=\"modal-overlay\" onclick=\"window.toggleModal('import-modal')\">
    <div class=\"bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 shadow-3xl\" onclick=\"event.stopPropagation()\">
      <h2 class=\"text-2xl font-black italic uppercase text-sky-600 mb-6\">Importar</h2>
      <textarea id=\"import-text\" class=\"w-full h-48 border dark:border-slate-700 rounded-2xl p-4 font-mono text-[10px] mb-4 outline-none dark:bg-slate-800\" placeholder=\"Cole o texto aqui...\"></textarea>
      <button onclick=\"window.importClientsFromText()\" class=\"w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[10px]\">Processar</button>
    </div>
  </div>
`;
