/* ==========================================================================
   KM Interiores · BUSCA NO FUNIL DE VENDAS            (03/08/2026 — 6a sessao)
   --------------------------------------------------------------------------
   POR QUE ARQUIVO PROPRIO: armadilha 22 — recurso escrito dentro do crm.html
   (691 KB) morre na proxima reescrita. Aqui ele sobrevive.

   O QUE FAZ: campo de busca acima do kanban do Funil. Filtra os cards ja
   renderizados, em memoria (nao vai ao banco: zero custo, resposta instantanea).
   Casa com titulo/cliente, origem, consultor e valor. Imune a acento e a
   maiuscula (mesma regra da lupa do site — decisao de 24/07).

   POR QUE MutationObserver: initFunil() reescreve k.innerHTML inteiro a cada
   troca de aba (Clientes/Parceiros), a cada filtro de consultor e a cada
   drag-and-drop. Sem o observer, o filtro sumiria sozinho. Ele NAO e local do
   IIFE (armadilha 31), entao nao da para chamar initFunil de fora — observar e
   reaplicar e o unico caminho estavel.

   NAO ALTERA DADO NENHUM. So esconde/mostra card na tela.
   ========================================================================== */
(function () {
  'use strict';

  var ID_BOX = 'kmFunilBuscaBox';
  var ID_INP = 'kmFunilBuscaInp';
  var ID_MSG = 'kmFunilBuscaMsg';
  var termo = '';
  var reaplicando = false;

  // -- normalizacao: minusculo + sem acento (Ubá == uba == UBA) ---------------
  function norm(s) {
    s = (s == null ? '' : '' + s);
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function kanban() { return document.getElementById('funilKanban'); }

  // -- monta a barra uma unica vez, logo acima do kanban ----------------------
  function montar() {
    var k = kanban();
    if (!k || document.getElementById(ID_BOX)) return !!document.getElementById(ID_BOX);

    var box = document.createElement('div');
    box.id = ID_BOX;
    box.style.cssText = 'display:flex;align-items:center;gap:8px;margin:0 0 10px;flex-wrap:wrap';
    box.innerHTML =
      '<div style="position:relative;flex:1 1 280px;max-width:420px">' +
        '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);opacity:.6;font-size:13px">&#128269;</span>' +
        '<input id="' + ID_INP + '" type="search" autocomplete="off" spellcheck="false" ' +
          'placeholder="Buscar card: cliente, origem, consultor, valor…" ' +
          'style="width:100%;padding:8px 30px 8px 30px;border:1px solid var(--line);border-radius:6px;' +
          'background:transparent;color:var(--text);font-size:13px;outline:none">' +
        '<button type="button" id="' + ID_INP + 'X" title="Limpar (Esc)" ' +
          'style="position:absolute;right:6px;top:50%;transform:translateY(-50%);display:none;' +
          'background:transparent;border:0;color:var(--muted);cursor:pointer;font-size:15px;line-height:1">&times;</button>' +
      '</div>' +
      '<span id="' + ID_MSG + '" style="font-size:12px;color:var(--muted)"></span>';

    k.parentNode.insertBefore(box, k);

    var inp = document.getElementById(ID_INP);
    var btnX = document.getElementById(ID_INP + 'X');
    var t = null;
    inp.addEventListener('input', function () {
      btnX.style.display = inp.value ? 'block' : 'none';
      clearTimeout(t);
      t = setTimeout(function () { termo = norm(inp.value); aplicar(); }, 120);
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { inp.value = ''; btnX.style.display = 'none'; termo = ''; aplicar(); }
    });
    btnX.addEventListener('click', function () {
      inp.value = ''; btnX.style.display = 'none'; termo = ''; aplicar(); inp.focus();
    });
    return true;
  }

  // -- aplica o filtro sobre os cards que estao na tela -----------------------
  function aplicar() {
    var k = kanban(); if (!k) return;
    var msg = document.getElementById(ID_MSG);
    var cols = k.querySelectorAll('.col');
    var total = 0, vis = 0;

    reaplicando = true;   // evita o observer se morder a propria cauda
    for (var c = 0; c < cols.length; c++) {
      var cards = cols[c].querySelectorAll('.lead');
      var n = 0;
      for (var i = 0; i < cards.length; i++) {
        total++;
        var ok = !termo || norm(cards[i].textContent).indexOf(termo) >= 0;
        cards[i].style.display = ok ? '' : 'none';
        if (ok) { n++; vis++; }
      }
      // o contador do cabecalho passa a refletir o que esta visivel
      var sp = cols[c].querySelector('h4 span');
      if (sp) sp.textContent = n;
    }
    reaplicando = false;

    if (msg) msg.textContent = termo ? (vis + ' de ' + total + ' card(s)') : '';
  }

  // -- observer: initFunil() reescreve o kanban; reaplicamos o filtro ---------
  function observar() {
    var k = kanban(); if (!k || k._kmBuscaObs) return;
    k._kmBuscaObs = true;
    var deb = null;
    new MutationObserver(function () {
      if (reaplicando || !termo) return;
      clearTimeout(deb);
      deb = setTimeout(aplicar, 60);
    }).observe(k, { childList: true, subtree: true });
  }

  function iniciar() {
    if (!montar()) return;
    observar();
    if (termo) aplicar();
  }

  // A tela do Funil ja existe no HTML (linha 449). iniciar() e idempotente, entao
  // rodamos ja E no DOMContentLoaded — cobre defer, async e carga fora de ordem.
  iniciar();
  document.addEventListener('DOMContentLoaded', iniciar);

  // Rede de seguranca: se o menu Funil for clicado antes de tudo montar.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-view="funil"]');
    if (a) setTimeout(iniciar, 120);
  }, true);

  window.kmFunilBuscaAplicar = aplicar;   // util para QA
})();
