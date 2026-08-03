/* ==========================================================================
   KM Interiores · FUNIL 2 — INSTAGRAM            (03/08/2026 — 6a sessao)
   --------------------------------------------------------------------------
   O CRM ja era multi-funil: oportunidades.pipeline tinha 'projeto' e 'parceiros'.
   Esta sessao acrescentou o terceiro: 'instagram', com estagios proprios
   (DM recebida -> Respondido -> Qualificado -> Orcamento enviado ->
    Visita/Showroom -> Ganho / Perdido).

   O QUE FICA NO crm.html (patch km-patch-funil2-instagram, inevitavel):
     - ESTAGIOS_PIPE + a troca de ESTAGIOS dentro de initFunil (ESTAGIOS e local
       do IIFE e e lido tambem pelo select de estagio do card)
     - o botao da aba <button data-pipe="instagram">
     - o fallback de coluna passou a ser o 1o estagio do pipeline (nenhum card some)

   O QUE FICA AQUI (arquivo proprio, armadilha 22):
     - a largura do kanban: o funil do Instagram tem 7 colunas, os outros 6.
       Em vez de fixar 7, o arquivo CONTA as colunas e escreve data-cols no
       kanban. Serve para qualquer funil futuro sem tocar em CSS de novo.
     - o rotulo de contexto ao lado das abas.

   NAO ALTERA DADO NENHUM. So layout.
   ========================================================================== */
(function () {
  'use strict';

  // ---- CSS: largura por numero de colunas ----------------------------------
  function estilo() {
    if (document.getElementById('kmFunil2Css')) return;
    var s = document.createElement('style');
    s.id = 'kmFunil2Css';
    s.textContent =
      '#funilKanban[data-cols="7"]{grid-template-columns:repeat(7,1fr)}' +
      '#funilKanban[data-cols="6"]{grid-template-columns:repeat(6,1fr)}' +
      '#funilKanban[data-cols="5"]{grid-template-columns:repeat(5,1fr)}' +
      '@media(max-width:1400px){#funilKanban[data-cols="7"]{grid-template-columns:repeat(4,1fr)}}' +
      '@media(max-width:1100px){#funilKanban[data-cols="7"]{grid-template-columns:repeat(3,1fr)}}' +
      '@media(max-width:700px){#funilKanban[data-cols="7"]{grid-template-columns:repeat(2,1fr)}}' +
      '#funilTabIg.sug{box-shadow:inset 0 -2px 0 var(--accent)}' +
      '#kmFunil2Ctx{font-size:11px;color:var(--muted);margin-left:6px}';
    (document.head || document.documentElement).appendChild(s);
  }

  // ---- conta as colunas e marca o kanban ------------------------------------
  function medir() {
    var k = document.getElementById('funilKanban'); if (!k) return;
    var n = k.querySelectorAll('.col').length;
    if (n > 0 && k.getAttribute('data-cols') !== String(n)) k.setAttribute('data-cols', String(n));

    // rotulo de contexto: qual funil o gestor esta olhando
    var ativa = document.querySelector('.funil-tab.sug');
    var ctx = document.getElementById('kmFunil2Ctx');
    if (ativa) {
      var pipe = ativa.getAttribute('data-pipe');
      if (!ctx) {
        ctx = document.createElement('span');
        ctx.id = 'kmFunil2Ctx';
        ativa.parentNode.appendChild(ctx);
      }
      ctx.textContent = pipe === 'instagram'
        ? '· funil social: DM e comentário viram card aqui'
        : (pipe === 'parceiros' ? '· arquitetos e parceiros' : '· projetos e vendas diretas');
    }
  }

  function iniciar() {
    estilo();
    medir();
    var k = document.getElementById('funilKanban');
    if (k && !k._kmF2Obs) {
      k._kmF2Obs = true;
      var d = null;
      new MutationObserver(function () { clearTimeout(d); d = setTimeout(medir, 50); })
        .observe(k, { childList: true });
    }
  }

  iniciar();                                            // idempotente
  document.addEventListener('DOMContentLoaded', iniciar);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.funil-tab, a[data-view="funil"]')) {
      setTimeout(iniciar, 150);
      setTimeout(medir, 700);                           // depois do fetch do kanban
    }
  }, true);

  window.kmFunil2Medir = medir;                         // util para QA
})();
