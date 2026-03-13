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
        <button onclick="handleAuth('login')" class="w-full bg-sky-500 text-white py-5 rounded-3xl font-black uppercase">Entrar</button>
      </div>
    </div>
  </section>

  <div id="app-content" class="hidden">
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-black italic uppercase">GERENCIADOR <span class="text-sky-500">INTELIGENTE</span></h1>
        <div class="flex gap-2">
          <select onchange="window.switchTheme(this.value)" class="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase p-2 rounded-xl border-none outline-none">
            <option value="light">☀️ Claro</option>
            <option value="dark">🌙 Escuro</option>
            <option value="midnight">🌌 Midnight</option>
          </select>
          <button onclick="logout()" class="p-2 rounded-xl bg-red-50 text-red-500 border border-red-100"><i data-lucide="log-out"></i></button>
        </div>
      </div>
    </header>

    <div id="top-profitbar-wrap" class="px-4 mt-4">
      <div class="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white/95 dark:bg-slate-900/90 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
        <div>
          <div class="text-[10px] font-black uppercase text-slate-400">Custo Total (Starplay/Vision)</div>
          <div id="top-total-casinhas" class="text-2xl font-black text-rose-500">R$ 0,00</div>
        </div>
        <div>
          <div class="text-[10px] font-black uppercase text-slate-400">Faturamento Bruto</div>
          <div id="top-total-plans" class="text-2xl font-black text-slate-900 dark:text-white">R$ 0,00</div>
        </div>
        <div>
          <div class="text-[10px] font-black uppercase text-slate-400">Lucro Real Líquido</div>
          <div id="top-real-profit" class="text-2xl font-black text-emerald-600">R$ 0,00</div>
        </div>
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 pt-5 pb-32">
      <section id="view-clients" class="view-section">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
          <h2 class="text-2xl font-black italic uppercase">Clientes (<span id="clients-count">0/0</span>)</h2>
          <div class="flex gap-2">
            <button id="btn-bulk" onclick="toggleBulkSelectClients()" class="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-black text-xs uppercase">Selecionar</button>
            <button onclick="openImportClients()" class="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs uppercase">Importar</button>
            <button onclick="openAddClient()" class="bg-sky-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase">Novo</button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 mb-4 space-y-3 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Filtrar Servidor</label>
              <select id="clients-filter-server" class="filter-select">
                <option value="">Todos os Painéis</option>
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
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Filtrar Ciclo</label>
              <select id="clients-filter-cycle" class="filter-select">
                <option value="">Todos os Ciclos</option>
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
            <input id="clients-search" class="input-box pl-11" placeholder="Procurar por nome, login, painel..." />
          </div>
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>

        <div id="clients-bulkbar" class="hidden fixed bottom-20 left-0 right-0 px-4 z-[60]">
          <div class="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 shadow-xl p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div class="text-xs font-black uppercase tracking-widest text-slate-500">
              Selecionados: <span id="clients-bulk-count" class="text-slate-900 dark:text-white">0</span>
            </div>
            <div class="flex flex-wrap gap-2 justify-end">
              <button onclick="bulkSelectAllFilteredClients()" class="bg-sky-500 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Selecionar Todos</button>
              <button onclick="bulkDeleteSelectedClients()" class="bg-red-600 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Apagar</button>
              <button onclick="toggleBulkSelectClients(false)" class="bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-xs uppercase">Cancelar</button>
            </div>
          </div>
        </div>
      </section>

      <section id="view-revendas" class="view-section hidden">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-black italic uppercase">Revendas</h2>
          <button onclick="openAddRevenda()" class="bg-sky-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase">Nova Revenda</button>
        </div>
        <div id="revendas-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <section id="view-finance" class="view-section hidden">
        <h2 class="text-2xl font-black uppercase mb-4">Ganhos Gerais</h2>
        <div id="fin-breakdown" class="space-y-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"></div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t dark:border-slate-800 h-20 flex justify-around items-center z-50 px-2 shadow-2xl">
      <button onclick="switchView('clients')" id="nav-clients" class="nav-btn active"><i data-lucide="users"></i><span class="text-[9px] uppercase font-bold block mt-1">Clientes</span></button>
      <button onclick="switchView('revendas')" id="nav-revendas" class="nav-btn"><i data-lucide="briefcase"></i><span class="text-[9px] uppercase font-bold block mt-1">Revendas</span></button>
      <button onclick="switchView('finance')" id="nav-finance" class="nav-btn"><i data-lucide="wallet"></i><span class="text-[9px] uppercase font-bold block mt-1">Ganhos</span></button>
    </nav>
  </div>

  <div id="client-modal" class="modal-overlay" onclick="toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <div class="flex items-start justify-between gap-4">
        <h2 id="client-modal-title" class="text-2xl font-black italic uppercase text-sky-600 tracking-tighter">Cliente</h2>
        <button onclick="toggleModal('client-modal')" class="text-slate-400 font-black">Fechar</button>
      </div>
      <input type="hidden" id="client-edit-id" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome</label><input id="client-nome" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">ID Externo</label><input id="client-idext" class="input-box" /></div>
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
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Vencimento</label><input id="client-venc" type="date" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plano (R$)</label><input id="client-plano" class="input-box" value="20.00" /></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-6">
        <button onclick="saveClient()" class="bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Guardar</button>
        <button onclick="toggleModal('client-modal')" class="bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
      </div>
    </div>
  </div>

  <div id="import-modal" class="modal-overlay" onclick="toggleModal('import-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onclick="event.stopPropagation()">
      <h2 class="text-2xl font-black uppercase mb-4 text-sky-600">Importação</h2>
      <select id="import-target-server" class="filter-select mb-4">
        <option value="">Automático</option>
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
      <textarea id="import-text" class="w-full h-64 p-4 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-2xl font-mono text-[11px] mb-4 outline-none" placeholder="Cole os blocos do painel aqui..."></textarea>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="previewImport()" class="bg-slate-800 text-white py-4 rounded-xl font-bold uppercase text-xs">Testar</button>
        <button onclick="importClientsFromText()" class="bg-sky-500 text-white py-4 rounded-xl font-bold uppercase text-xs">Importar Tudo</button>
      </div>
      <pre id="import-preview" class="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] overflow-auto max-h-32 border dark:border-slate-700"></pre>
    </div>
  </div>
`;
