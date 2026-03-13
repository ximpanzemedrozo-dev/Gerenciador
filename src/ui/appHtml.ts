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
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-5">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-black italic tracking-tighter uppercase">
          GERENCIADOR <span class="text-sky-500">INTELIGENTE</span>
        </h1>

        <button onclick="toggleDarkMode()" class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400">
          <i id="theme-icon" data-lucide="sun"></i>
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 pt-10">
      <div class="luxury-card">
        Base migrada. Próximo passo: colar o BODY completo do teu app e migrar o JS grande.
      </div>
    </main>
  </div>
`;
