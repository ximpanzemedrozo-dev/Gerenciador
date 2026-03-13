export const appHtml = `
  <!-- LOGIN -->
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

  <!-- APP -->
  <div id="app-content" class="hidden">
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-black italic tracking-tighter uppercase">
          GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
        </h1>

        <div class="flex gap-2">
          <!-- botão Mobile/Desktop é injetado via JS (legacy.ts) -->

          <button onclick="toggleDarkMode()" class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400" title="Tema">
            <i id="theme-icon" data-lucide="sun"></i>
          </button>

          <button onclick="sigmaDB.signOut(sigmaDB.auth)" class="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100" title="Sair">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 pt-5 pb-32">
      <!-- CLIENTES (FUNCIONAL) -->
      <section id="view-clients" class="view-section">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 class="text-2xl font-black italic uppercase tracking-tighter">Clientes</h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro + Importação</p>
          </div>

          <div class="flex gap-2">
            <button onclick="openImportClients()" class="bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">
              Importar
            </button>
            <button onclick="openAddClient()" class="bg-sky-500 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">
              Novo
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 mb-4">
          <input id="clients-search" class="input-box" placeholder="Buscar por nome, email, id, painel..." />
        </div>

        <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <!-- CASINHAS (placeholder por enquanto) -->
      <section id="view-casinhas" class="view-section hidden">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-xl font-black">Casinhas</h2>
          <p class="text-sm text-slate-500 mt-2">Próximo passo: toggle pago + cálculo de dívida.</p>
        </div>
      </section>

      <!-- REVENDAS (FUNCIONAL) -->
      <section id="view-revendas" class="view-section hidden">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-2xl font-black italic uppercase tracking-tighter">Parceiros Revenda</h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cálculo automático</p>
          </div>

          <button onclick="openAddRevenda()" class="bg-sky-500 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase">
            Novo
          </button>
        </div>

        <div id="revendas-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <!-- SERVERS (placeholder por enquanto) -->
      <section id="view-servers" class="view-section hidden">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-xl font-black">Painéis</h2>
          <p class="text-sm text-slate-500 mt-2">Próximo passo: editar custos por painel.</p>
        </div>
      </section>

      <!-- FINANCE (placeholder por enquanto) -->
      <section id="view-finance" class="view-section hidden">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-xl font-black">Ganhos</h2>
          <p class="text-sm text-slate-500 mt-2">Próximo passo: dashboard de lucro por mês.</p>
        </div>
      </section>
    </main>

    <!-- NAV -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border-t border-slate-100 dark:border-slate-800 h-20 flex justify-around items-center px-4 z-50">
      <button onclick="switchView('clients')" id="nav-clients" class="nav-btn active">
        <i data-lucide="users"></i><span>Início</span>
      </button>
      <button onclick="switchView('casinhas')" id="nav-casinhas" class="nav-btn">
        <i data-lucide="layout-grid"></i><span>Casinhas</span>
      </button>
      <button onclick="switchView('revendas')" id="nav-revendas" class="nav-btn">
        <i data-lucide="handshake"></i><span>Revenda</span>
      </button>
      <button onclick="switchView('servers')" id="nav-servers" class="nav-btn">
        <i data-lucide="server"></i><span>Painéis</span>
      </button>
      <button onclick="switchView('finance')" id="nav-finance" class="nav-btn">
        <i data-lucide="wallet"></i><span>Ganhos</span>
      </button>
    </nav>
  </div>

  <!-- MODAL: CLIENTE -->
  <div id="client-modal" class="modal-overlay" onclick="toggleModal('client-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 id="client-modal-title" class="text-2xl font-black italic uppercase text-sky-600 tracking-tighter">Novo Cliente</h2>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro rápido</p>
        </div>
        <button onclick="toggleModal('client-modal')" class="text-slate-400 font-black">Fechar</button>
      </div>

      <input type="hidden" id="client-edit-id" />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nome</label>
          <input id="client-nome" class="input-box" placeholder="Ex: Irma da Kamila" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Painel</label>
          <input id="client-painel" class="input-box" placeholder="Ex: Starplay" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Email/Login</label>
          <input id="client-email" class="input-box" placeholder="ex: dalvastream@gmail.com" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Senha (opcional)</label>
          <input id="client-senha" class="input-box" placeholder="(vazio)" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Vencimento</label>
          <input id="client-venc" type="date" class="input-box" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Plano (R$)</label>
          <input id="client-plano" inputmode="decimal" class="input-box" placeholder="20,00" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Conexões</label>
          <input id="client-conexoes" type="number" min="1" class="input-box" value="1" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">ID Externo</label>
          <input id="client-idext" class="input-box" placeholder="778897151" />
        </div>

        <div class="md:col-span-2">
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Observação</label>
          <input id="client-obs" class="input-box" placeholder="Aplicativo e Mac: " />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-6">
        <button onclick="saveClient()" class="bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Guardar</button>
        <button onclick="toggleModal('client-modal')" class="bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- MODAL: IMPORTAR CLIENTE (1 bloco) -->
  <div id="import-modal" class="modal-overlay" onclick="toggleModal('import-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black italic uppercase text-sky-600 tracking-tighter">Importar Cliente</h2>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cole o bloco e confirme</p>
        </div>
        <button onclick="toggleModal('import-modal')" class="text-slate-400 font-black">Fechar</button>
      </div>

      <div class="mt-5">
        <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Texto do painel</label>
        <textarea id="import-text" class="w-full rounded-2xl border border-slate-200 p-4 font-mono text-xs min-h-[220px]"></textarea>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-4">
        <button onclick="previewImport()" class="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Prévia</button>
        <button onclick="applyImportToClientForm()" class="bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Usar no Form</button>
      </div>

      <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Prévia do parse</div>
        <pre id="import-preview" class="text-xs mt-2 whitespace-pre-wrap"></pre>
      </div>
    </div>
  </div>

  <!-- MODAL: REVENDAS (mantido) -->
  <div id="revenda-modal" class="modal-overlay" onclick="toggleModal('revenda-modal')">
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 id="revenda-modal-title" class="text-2xl font-black italic uppercase text-sky-600 tracking-tighter">Nova Revenda</h2>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">QTD + preço por cliente, por painel</p>
        </div>
        <button onclick="toggleModal('revenda-modal')" class="text-slate-400 font-black">Fechar</button>
      </div>

      <input type="hidden" id="rev-edit-id" />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nome do parceiro</label>
          <input id="rev-nome" class="input-box" placeholder="Ex: Parceiro X" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Divisões (1=pagamento único; 2=2 parcelas)</label>
          <input id="rev-divisoes" type="number" min="1" value="1" class="input-box" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Data Pagamento 1</label>
          <input id="rev-pay-date-1" type="date" class="input-box" />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Data Pagamento 2</label>
          <input id="rev-pay-date-2" type="date" class="input-box" />
        </div>
      </div>

      <div class="mt-5 rounded-2xl border border-slate-200 p-4 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total que a revenda paga</div>
            <div id="rev-total-paga" class="text-2xl font-black text-emerald-600">R$ 0,00</div>
          </div>
          <div>
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo casinhas (Vision/Starplay)</div>
            <div id="rev-total-custo-casinhas" class="text-2xl font-black text-rose-500">R$ 0,00</div>
          </div>
          <div>
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Lucro</div>
            <div id="rev-total-lucro" class="text-2xl font-black text-sky-600">R$ 0,00</div>
          </div>
        </div>
      </div>

      <div class="mt-5">
        <h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Painéis</h3>
        <div id="rev-server-grid" class="space-y-3"></div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-6">
        <button onclick="saveRevenda()" class="bg-sky-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Guardar</button>
        <button onclick="toggleModal('revenda-modal')" class="bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
      </div>
    </div>
  </div>
`;
