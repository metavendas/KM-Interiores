/* =============================================================================
   KM Interiores · CRM · km-atendimento-fix.js — 03/08/2026
   Conserta a aba "Atendimento ao Vivo", que NUNCA abriu desde 24/07.

   O BUG (ovo e galinha)
   ---------------------
   A seção da aba não existe no HTML: ela é criada em tempo de execução por
   ensureSection(), que só roda dentro de window.loadChatAtendimento().
   Mas o showView() do crm.html (linha 1613) faz, nesta ordem:

     1) procura .view[data-v="chat_atendimento"]  → NÃO ACHA
     2) found=false → cai no dashboard e faz v='dashboard'
     3) só então: if (v==='chat_atendimento') loadChatAtendimento()   ← v já é 'dashboard'

   Ou seja: a seção só é criada se já existir. Clicar no menu abria o Dashboard,
   silenciosamente. Por isso havia 2 conversas de visitantes abertas desde 24/07
   sem ninguém responder — o CRM nunca mostrou a tela de atendimento.

   A CORREÇÃO
   ----------
   Criar a seção ANTES do showView rodar. Duas garantias:
     (a) na carga da página, chamando loadChatAtendimento() uma vez;
     (b) no clique do menu, em fase de CAPTURA (capture:true), que roda antes do
         handler do CRM — se por qualquer motivo a seção ainda não existir, ela
         nasce ali e o showView a encontra.
   startPoll() já é idempotente (chama stopPoll() antes) e o poll se encerra
   sozinho quando a aba não está visível — chamar duas vezes não cria timer duplo.

   Arquivo .js próprio (armadilha 22). Nada do crm.html foi apagado.
   ============================================================================= */
(function () {
  'use strict';

  var SEL = '.view[data-v="chat_atendimento"]';

  function existe() { return !!document.querySelector(SEL); }

  function garantirSecao() {
    if (existe()) return true;
    if (typeof window.loadChatAtendimento !== 'function') return false;
    try { window.loadChatAtendimento(); } catch (e) {
      if (window.console) console.error('[km-atendimento-fix]', e);
    }
    return existe();
  }

  // (a) Na carga: cria a seção assim que o bloco km-cav-js estiver disponível.
  //     Tentativas curtas e limitadas — nunca fica girando para sempre.
  var tentativas = 0;
  var timer = setInterval(function () {
    if (garantirSecao() || ++tentativas >= 20) clearInterval(timer);
  }, 300);

  // (b) No clique do menu, ANTES do handler do CRM (fase de captura).
  document.addEventListener('click', function (e) {
    var alvo = e.target;
    var a = null;
    while (alvo && alvo !== document) {
      if (alvo.tagName === 'A' && alvo.getAttribute('data-view') === 'chat_atendimento') { a = alvo; break; }
      alvo = alvo.parentNode;
    }
    if (!a) return;

    garantirSecao();

    // Depois que o showView terminou: se a seção nasceu agora, o showView desta
    // primeira vez pode ter caído no dashboard. Corrige mostrando a aba e
    // recarregando a lista de conversas.
    setTimeout(function () {
      var s = document.querySelector(SEL);
      if (!s) return;
      if (s.hidden) {
        var views = document.querySelectorAll('.view');
        for (var i = 0; i < views.length; i++) { views[i].hidden = (views[i] !== s); }
        var links = document.querySelectorAll('.nav a[data-view]');
        for (var j = 0; j < links.length; j++) {
          links[j].classList.toggle('active', links[j].getAttribute('data-view') === 'chat_atendimento');
        }
      }
      if (typeof window.loadChatAtendimento === 'function') {
        try { window.loadChatAtendimento(); } catch (err) {}
      }
    }, 80);
  }, true);

  window.__kmAtendimentoFix = '2026-08-03';
})();
