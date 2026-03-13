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
        <div class="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Custo mensal (Starplay/Vision)</div>
              <div id="top-total-casinhas" class="text-2xl font-black text-rose-500 mt-1">R$ 0,00</div>
              <div id="top-casinhas-meta" class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2"></div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total Mensalistas</div>
              <div id="top-total-plans" class="text-2xl font-black text-slate-900 mt-1">R$ 0,00</div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Lucro Líquido Mensal</div>
              <div id="top-real-profit" class="text-3xl font-black text-emerald-600 mt-1">R$ 0,00</div>
            </div>
          </div>
          <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3">
            Base: Exibindo apenas clientes com ciclo <span class="text-slate-700">Mensal</span>. Outros ciclos veja em "Ganhos".
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
              Filtro atual: <span id="clients-count" class="text-slate-900">0/0</span>
            </p>
          </div>
          <div class="flex gap-2">
            <button id="btn-bulk" onclick="toggleBulkSelectClients()" class="bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-xs uppercase">Selecionar</button>
            <button onclick="openImportClients()" class="bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Importar</button>
            <button onclick="openAddClient()" class="bg-sky-500 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Novo</button>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Servidor</label>
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
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>
          <input id="clients-search" class="input-box" placeholder="Buscar por nome, email, painel..." />
        </div>
        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <section id="view-finance" class="view-section hidden">
        <div class="flex items-end justify-between mb-4">
          <div>
            <h2 class="text-2xl font-black italic uppercase tracking-tighter">Resumo de Ganhos</h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Visão geral de todos os ciclos</p>
          </div>
          <button onclick="refreshFinance()" class="bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">Atualizar</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total Clientes</div>
            <div id="fin-total-clients" class="text-3xl font-black text-slate-900 mt-2">0</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Vencendo (7 dias)</div>
            <div id="fin-due-soon" class="text-3xl font-black text-rose-500 mt-2">0</div>
          </div>
        </div>
        <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div id="fin-breakdown" class="mt-4 space-y-3"></div>
        </div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border-t border-slate-100 dark:border-slate-800 h-20 flex justify-around items-center px-4 z-50">
      <button onclick="switchView('clients')" id="nav-clients" class="nav-btn active"><i data-lucide="users"></i><span>Início</span></button>
      <button onclick="switchView('finance')" id="nav-finance" class="nav-btn"><i data-lucide="wallet"></i><span>Ganhos</span></button>
    </nav>
  </div>

  <div id="client-modal" class="modal-overlay" onclick="toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <div class="flex items-start justify-between gap-4">
        <h2 id="client-modal-title" class="text-2xl font-black italic uppercase text-sky-600 tracking-tighter">Novo Cliente</h2>
        <button onclick="toggleModal('client-modal')" class="text-slate-400 font-black">Fechar</button>
      </div>
      <input type="hidden" id="client-edit-id" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nome</label><input id="client-nome" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Painel</label><input id="client-painel" class="input-box" /></div>
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Ciclo</label>
          <select id="client-cycle" class="filter-select">
            <option value="mensal">Mensal</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Email</label><input id="client-email" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Vencimento</label><input id="client-venc" type="date" class="input-box" /></div>
        <div><label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Plano (R$)</label><input id="client-plano" class="input-box" value="20.00" /></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-6">
        <button onclick="saveClient()" class="bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Guardar</button>
        <button onclick="toggleModal('client-modal')" class="bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
      </div>
    </div>
  </div>

  <div id="import-modal" class="modal-overlay" onclick="toggleModal('import-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-3xl" onclick="event.stopPropagation()">
      <h2 class="text-2xl font-black italic uppercase text-sky-600 tracking-tighter">Importar Clientes</h2>
      <select id="import-server" class="filter-select mt-4"><option value="">Auto (pelo texto)</option><option value="Starplay">Starplay</option><option value="Vision">Vision</option></select>
      <textarea id="import-text" class="w-full rounded-2xl border p-4 mt-4 font-mono text-xs min-h-[200px]" placeholder="Cole o texto do painel aqui..."></textarea>
      <div class="mt-4 bg-slate-50 p-3 rounded-xl">
        <div id="import-status" class="text-[10px] font-black uppercase text-slate-400">Aguardando...</div>
        <div class="h-2 bg-slate-200 rounded-full mt-1 overflow-hidden"><div id="import-bar" class="h-full bg-sky-500 w-0"></div></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-4">
        <button onclick="previewImport()" class="bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs">Prévia</button>
        <button onclick="importClientsFromText()" class="bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-xs">Importar Tudo</button>
      </div>
      <pre id="import-preview" class="text-[10px] mt-4 p-3 bg-slate-100 rounded-lg max-h-32 overflow-auto"></pre>
    </div>
  </div>
`;
