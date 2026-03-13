export const appHtml = `
  <section id="auth-section" class="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
    <div class="w-full max-w-sm">
      <h1 class="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic mb-10">
        GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
      </h1>
      <div id="auth-error" class="hidden mb-6 p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl"></div>
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
          <button onclick="logout()" class="p-2 rounded-xl bg-red-50 text-red-500"><i data-lucide="log-out"></i></button>
        </div>
      </div>
    </header>

    <div class="px-4 mt-4">
      <div class="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white/95 dark:bg-slate-900/90 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
        <div>
          <div class="text-[10px] font-black uppercase text-slate-400">Custo mensal (Starplay/Vision)</div>
          <div id="top-total-casinhas" class="text-2xl font-black text-rose-500">R$ 0,00</div>
        </div>
        <div>
          <div class="text-[10px] font-black uppercase text-slate-400">Faturamento Mensal</div>
          <div id="top-total-plans" class="text-2xl font-black text-slate-900 dark:text-white">R$ 0,00</div>
        </div>
        <div>
          <div class="text-[10px] font-black uppercase text-slate-400">Lucro Líquido Mensal</div>
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

        <div id="clients-bulkbar" class="hidden mb-4 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30 rounded-2xl flex flex-wrap gap-3 justify-between items-center">
           <span class="text-xs font-bold text-sky-700 dark:text-sky-400">Selecionados: <span id="clients-bulk-count">0</span></span>
           <div class="flex gap-2">
             <button onclick="bulkSelectAllFilteredClients()" class="bg-sky-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Todos</button>
             <button onclick="bulkDeleteSelectedClients()" class="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Apagar</button>
             <button onclick="toggleBulkSelectClients(false)" class="text-slate-500 text-[10px] font-bold uppercase">Sair</button>
           </div>
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <section id="view-revendas" class="view-section hidden">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-black italic uppercase">Revendas</h2>
          <button onclick="openAddRevenda()" class="bg-sky-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase">Adicionar Parceiro</button>
        </div>
        <div id="revendas-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <section id="view-finance" class="view-section hidden">
        <h2 class="text-2xl font-black uppercase mb-4">Resumo Financeiro</h2>
        <div id="fin-breakdown" class="space-y-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"></div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t dark:border-slate-800 h-20 flex justify-around items-center z-50 px-2">
      <button onclick="switchView('clients')" id="nav-clients" class="nav-btn active">
        <i data-lucide="users"></i><span class="text-[9px] uppercase font-bold block mt-1">Clientes</span>
      </button>
      <button onclick="switchView('revendas')" id="nav-revendas" class="nav-btn">
        <i data-lucide="briefcase"></i><span class="text-[9px] uppercase font-bold block mt-1">Revendas</span>
      </button>
      <button onclick="switchView('finance')" id="nav-finance" class="nav-btn">
        <i data-lucide="wallet"></i><span class="text-[9px] uppercase font-bold block mt-1">Ganhos</span>
      </button>
    </nav>
  </div>

  <div id="client-modal" class="modal-overlay" onclick="toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2rem] p-6 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <h2 id="client-modal-title" class="text-2xl font-black uppercase text-sky-600 mb-6">Cliente</h2>
      <input type="hidden" id="client-edit-id" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome</label><input id="client-nome" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">ID Externo</label><input id="client-idext" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Painel</label><input id="client-painel" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Ciclo</label>
          <select id="client-cycle" class="filter-select">
            <option value="mensal">Mensal</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Vencimento</label><input id="client-venc" type="date" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plano (R$)</label><input id="client-plano" class="input-box" /></div>
      </div>
      <div class="flex gap-3 mt-8">
        <button onclick="saveClient()" class="flex-1 bg-sky-500 text-white py-4 rounded-2xl font-black uppercase">Salvar</button>
        <button onclick="toggleModal('client-modal')" class="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase">Cancelar</button>
      </div>
    </div>
  </div>

  <div id="import-modal" class="modal-overlay" onclick="toggleModal('import-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onclick="event.stopPropagation()">
      <h2 class="text-2xl font-black uppercase mb-4 text-sky-600">Importação Completa</h2>
      <div class="mb-4">
        <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Servidor de Destino (Forçar)</label>
        <select id="import-target-server" class="filter-select">
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
      </div>
      <textarea id="import-text" class="w-full h-64 p-4 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-2xl font-mono text-[11px] mb-4 outline-none" placeholder="Cole os blocos do painel aqui..."></textarea>
      <div id="import-status-area" class="hidden mb-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200">
        <div id="import-status" class="text-[10px] font-black uppercase text-slate-500 mb-1">Iniciando...</div>
        <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div id="import-bar" class="h-full bg-sky-500 w-0"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="previewImport()" class="bg-slate-800 text-white py-4 rounded-xl font-bold uppercase text-xs">Testar</button>
        <button onclick="importClientsFromText()" class="bg-sky-500 text-white py-4 rounded-xl font-bold uppercase text-xs">Importar Lista</button>
      </div>
      <pre id="import-preview" class="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] border dark:border-slate-700 max-h-40 overflow-auto"></pre>
    </div>
  </div>

  <div id="revenda-modal" class="modal-overlay" onclick="toggleModal('revenda-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl p-6" onclick="event.stopPropagation()">
      <h2 id="revenda-modal-title" class="text-2xl font-black uppercase text-sky-600 mb-6">Nova Revenda</h2>
      <input type="hidden" id="revenda-edit-id" />
      <div class="space-y-4">
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome do Parceiro</label><input id="revenda-nome" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Painel Utilizado</label><input id="revenda-painel" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Custo por Crédito (R$)</label><input id="revenda-custo" class="input-box" placeholder="Ex: 5.00" /></div>
      </div>
      <div class="flex gap-3 mt-8">
        <button onclick="saveRevenda()" class="flex-1 bg-sky-500 text-white py-4 rounded-2xl font-black uppercase">Salvar</button>
        <button onclick="toggleModal('revenda-modal')" class="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase">Cancelar</button>
      </div>
    </div>
  </div>
`;
