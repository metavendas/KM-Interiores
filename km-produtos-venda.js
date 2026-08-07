/* =============================================================================
   KM Interiores · km-produtos-venda.js
   SELETOR DE PRODUTOS DO PEDIDO — busca ordenada + produto fora do site
   -----------------------------------------------------------------------------
   OS DOIS PROBLEMAS RELATADOS EM 06/08/2026

   (5) "Produto que não aparece no site também não aparece na hora de cadastrar
        a venda." O site é uma coisa, a venda é outra.
   (6) "A busca de produtos no cadastro de venda não segue uma ordem quando eu
        digito o nome."

   A CAUSA REAL (medida, não suposta)
   O banco NÃO era o culpado: a política de RLS já deixa o staff enxergar os 135
   produtos, inclusive o que está com "publicar no site = não" — confirmado por
   consulta simulando o login da consultora. O culpado é o <select> nativo do
   formulário: com 135 opções, digitar dentro dele aciona o "type-ahead" do
   próprio navegador, que só pula para a opção que COMEÇA com as letras digitadas,
   perde o que foi digitado depois de ~1 segundo e não tem noção de acento. Na
   prática, o gestor digita "mesa redonda", o cursor pula para outro lugar e a
   conclusão natural é "o produto não está aqui".

   O QUE ESTE ARQUIVO FAZ
   Troca aquele <select> por um campo de busca de verdade:
     · carrega TODOS os produtos, explicitamente SEM filtro de publicar_site;
     · ordena por relevância — começa com > palavra começa com > contém > A-Z;
     · ignora acento e maiúscula ("sofa" acha "Sofá", "uba" acha "Ubá");
     · busca também por SKU, categoria e coleção;
     · marca com a etiqueta "fora do site" o produto que o gestor tirou da
       vitrine, para ficar claro que ele EXISTE e pode ser vendido;
     · mantém o <select> original escondido como fonte da verdade — o código de
       salvar a venda continua lendo dele, nada do fluxo antigo foi removido.

   ARMADILHA TRATADA: renderVendaItens()/pedRenderItens() reescrevem as linhas de
   item do zero. Um MutationObserver reaplica o combo depois de cada re-render.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__kmProdVenda) return;
  window.__kmProdVenda = true;

  var SB     = window.SB     || 'https://hpbtnlfihbwwawgtesvm.supabase.co';
  var KEY    = window.KEY    || 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
  var TOKKEY = window.TOKKEY || 'km_crm_token';

  var PRODS = null;      // catálogo completo do CRM
  var CARREGANDO = null; // promise em voo (evita 5 requisições para 5 linhas)

  /* ---------- normalização: sem acento, minúscula ---------- */
  function norm(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function money(n) {
    var v = Number(n) || 0;
    return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------- carga: TODOS os produtos, sem filtro de vitrine ---------- */
  function carregar() {
    if (PRODS) return Promise.resolve(PRODS);
    if (CARREGANDO) return CARREGANDO;
    var tok = localStorage.getItem(TOKKEY) || '';
    var url = SB + '/rest/v1/produtos'
            + '?select=id,sku,nome,preco,categoria,colecao,publicar_site,estoque_disponivel,ativo'
            + '&ativo=eq.true&order=nome.asc&limit=5000';   // <-- sem publicar_site de propósito
    CARREGANDO = fetch(url, { headers: { apikey: KEY, Authorization: 'Bearer ' + tok } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        PRODS = Array.isArray(rows) ? rows : [];
        PRODS.forEach(function (p) {
          p.__n   = norm(p.nome);
          p.__sku = norm(p.sku);
          p.__ctx = norm([p.nome, p.sku, p.categoria, p.colecao].filter(Boolean).join(' '));
        });
        return PRODS;
      })
      .catch(function () { PRODS = []; return PRODS; });
    return CARREGANDO;
  }

  /* ---------- ORDENAÇÃO POR RELEVÂNCIA (o item 6) ----------
     0 = SKU exato · 1 = nome começa com · 2 = alguma palavra começa com
     3 = nome contém · 4 = categoria/coleção/SKU contém. Empate: A-Z.       */
  function ranquear(p, q) {
    if (!q) return 5;
    if (p.__sku === q) return 0;
    if (p.__n.indexOf(q) === 0) return 1;
    if ((' ' + p.__n).indexOf(' ' + q) >= 0) return 2;
    if (p.__n.indexOf(q) >= 0) return 3;
    if (p.__ctx.indexOf(q) >= 0) return 4;
    return -1;                                   // não casa
  }
  function filtrar(q) {
    var nq = norm(q);
    var out = [];
    (PRODS || []).forEach(function (p) {
      var r = ranquear(p, nq);
      if (r >= 0) out.push({ p: p, r: r });
    });
    out.sort(function (a, b) {
      if (a.r !== b.r) return a.r - b.r;
      return a.p.__n < b.p.__n ? -1 : (a.p.__n > b.p.__n ? 1 : 0);
    });
    return out.map(function (o) { return o.p; });
  }

  /* ---------- estilo ---------- */
  function estilo() {
    if (document.getElementById('km-prodv-css')) return;
    var st = document.createElement('style');
    st.id = 'km-prodv-css';
    st.textContent = ''
      + '.km-pv-wrap{position:relative;display:block;min-width:0}'
      + '.km-pv-inp{width:100%;box-sizing:border-box}'
      + '.km-pv-list{position:absolute;z-index:9999;left:0;right:0;top:100%;max-height:290px;overflow:auto;'
      + 'display:none;background:#1b160f;border:1px solid rgba(203,152,76,.35);border-radius:6px;'
      + 'box-shadow:0 18px 44px rgba(0,0,0,.55);margin-top:2px}'
      + 'html.km-light .km-pv-list{background:#F7F1E1;box-shadow:0 18px 40px rgba(8,8,7,.18)}'
      + '.km-pv-list .it{padding:8px 10px;font-size:13px;cursor:pointer;border-bottom:1px solid rgba(203,152,76,.14);color:var(--text)}'
      + '.km-pv-list .it small{display:block;font-size:11px;color:var(--muted);margin-top:2px}'
      + '.km-pv-list .it:hover,.km-pv-list .it.on{background:rgba(203,152,76,.16)}'
      + 'html.km-light .km-pv-list .it:hover,html.km-light .km-pv-list .it.on{background:rgba(8,8,7,.07)}'
      + '.km-pv-list .vazio{padding:12px;font-size:12px;color:var(--muted)}'
      + '.km-pv-tag{display:inline-block;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;'
      + 'padding:1px 6px;border-radius:10px;margin-left:6px;vertical-align:middle;'
      + 'background:rgba(203,152,76,.18);color:#CB984C;border:1px solid rgba(203,152,76,.4)}'
      + '.km-pv-tag.off{background:rgba(160,160,160,.14);color:#a9a9a9;border-color:rgba(160,160,160,.35)}'
      + '.km-pv-cnt{display:block;font-size:10.5px;color:var(--muted);margin-top:2px}';
    document.head.appendChild(st);
  }

  /* ---------- transforma um <select> de produto em combo de busca ---------- */
  function equipar(sel) {
    if (!sel || sel.__kmPV) return;
    sel.__kmPV = true;
    estilo();

    var wrap = document.createElement('span');
    wrap.className = 'km-pv-wrap';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);

    sel.style.display = 'none';   // continua sendo a fonte da verdade ao salvar

    var inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'km-pv-inp';
    inp.setAttribute('autocomplete', 'off');
    inp.placeholder = 'Digite o nome, SKU ou categoria do produto…';
    wrap.appendChild(inp);

    var lista = document.createElement('div');
    lista.className = 'km-pv-list';
    wrap.appendChild(lista);

    var cnt = document.createElement('span');
    cnt.className = 'km-pv-cnt';
    wrap.appendChild(cnt);

    var atual = [], idx = -1;

    function fechar() { lista.style.display = 'none'; idx = -1; }

    function rotulo(p) {
      var t = p.nome || '(sem nome)';
      return t;
    }

    function pintar() {
      var q = inp.value;
      atual = filtrar(q).slice(0, 60);
      if (!PRODS || !PRODS.length) {
        lista.innerHTML = '<div class="vazio">Carregando produtos…</div>';
        lista.style.display = 'block';
        return;
      }
      if (!atual.length) {
        lista.innerHTML = '<div class="vazio">Nenhum produto encontrado para “' + esc(q) + '”.</div>';
        lista.style.display = 'block';
        return;
      }
      lista.innerHTML = atual.map(function (p, i) {
        var tags = '';
        if (p.publicar_site === false) tags += '<span class="km-pv-tag off">fora do site</span>';
        var det = [];
        if (p.sku) det.push(p.sku);
        if (p.categoria) det.push(p.categoria);
        if (Number(p.preco) > 0) det.push(money(p.preco));
        else det.push('sem preço');
        if (p.estoque_disponivel != null) det.push('estoque ' + p.estoque_disponivel);
        return '<div class="it" data-i="' + i + '">' + esc(rotulo(p)) + tags
             + '<small>' + esc(det.join(' · ')) + '</small></div>';
      }).join('');
      lista.style.display = 'block';
      cnt.textContent = atual.length + ' de ' + PRODS.length + ' produto(s)';
    }

    /* BLINDAGEM (QA 06/08): o <select> original é preenchido por PROD_CACHE, que
       pode não conter o produto escolhido (cache antigo, limite, ou produto fora
       do site). Sem a <option> correspondente, sel.value = id FALHA EM SILÊNCIO e
       a venda seria salva sem produto_id. Aqui a opção é criada antes. */
    function garantirOption(p) {
      if (!p) return;
      var achou = Array.prototype.some.call(sel.options, function (o) {
        return String(o.value) === String(p.id);
      });
      if (achou) return;
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.nome || '(sem nome)';
      o.setAttribute('data-preco', String(Number(p.preco) || 0));
      sel.appendChild(o);
    }

    function escolher(p) {
      garantirOption(p);
      sel.value = p ? p.id : '';
      inp.value = p ? rotulo(p) : '';
      cnt.textContent = p
        ? ((p.sku ? p.sku + ' · ' : '') + (Number(p.preco) > 0 ? money(p.preco) : 'sem preço')
           + (p.publicar_site === false ? ' · fora do site' : ''))
        : '';
      fechar();
      // dispara o change do <select> original: é ele que preenche o valor unitário
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function marcar() {
      Array.prototype.forEach.call(lista.querySelectorAll('.it'), function (e, i) {
        e.classList.toggle('on', i === idx);
      });
      var on = lista.querySelector('.it.on');
      if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    }

    inp.addEventListener('focus', function () { carregar().then(pintar); });
    inp.addEventListener('input', function () { sel.value = ''; carregar().then(pintar); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (idx < atual.length - 1) idx++; marcar(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (idx > 0) idx--; marcar(); }
      else if (e.key === 'Enter') {
        if (lista.style.display === 'block' && atual.length) {
          e.preventDefault();
          escolher(atual[idx >= 0 ? idx : 0]);
        }
      } else if (e.key === 'Escape') { fechar(); }
    });
    lista.addEventListener('mousedown', function (e) {
      var it = e.target.closest ? e.target.closest('.it') : null;
      if (!it) return;
      e.preventDefault();
      escolher(atual[Number(it.getAttribute('data-i'))]);
    });
    inp.addEventListener('blur', function () { setTimeout(fechar, 160); });

    // já vinha com produto escolhido (editar pedido): mostra o nome no campo
    carregar().then(function () {
      if (sel.value) {
        var p = (PRODS || []).filter(function (x) { return String(x.id) === String(sel.value); })[0];
        if (p) { inp.value = rotulo(p); cnt.textContent = (p.sku ? p.sku + ' · ' : '') + (Number(p.preco) > 0 ? money(p.preco) : 'sem preço'); }
      }
    });
  }

  /* ---------- varredura + sobrevivência ao re-render ---------- */
  var ALVOS = '.vi-prod, .km-vi-prod, .ci_prod';
  function varrer() {
    Array.prototype.forEach.call(document.querySelectorAll(ALVOS), equipar);
  }

  function iniciar() {
    varrer();
    if (window.__kmProdVObs) return;
    var obs = new MutationObserver(function () {
      clearTimeout(window.__kmProdVT);
      window.__kmProdVT = setTimeout(varrer, 60);
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    window.__kmProdVObs = obs;
    carregar();   // adianta a carga
  }

  if (document.body) iniciar();
  document.addEventListener('DOMContentLoaded', iniciar);
})();

/* =============================================================================
   PARTE 2 · CATEGORIA ÚNICA NO CADASTRO DE PRODUTO   (item 2 de 06/08/2026)
   -----------------------------------------------------------------------------
   O banco já canoniza a grafia na gravação (trg_km_produtos_categoria_canon),
   então "SOFA", "sofás" e " Sofa " caem todos em "Sofás". Mas o gestor continuava
   digitando no escuro. Aqui o campo Categoria do cadastro de produto passa a
   sugerir a lista oficial (tabela produto_categorias) — ele escolhe em vez de
   redigitar, e a grafia errada deixa de nascer.
   Não bloqueia: categoria nova continua podendo ser criada, e entra sozinha no
   dicionário na primeira gravação.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__kmCatUnica) return;
  window.__kmCatUnica = true;

  var SB  = window.SB  || 'https://hpbtnlfihbwwawgtesvm.supabase.co';
  var KEY = window.KEY || 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
  var CATS = null;

  function carregarCats() {
    if (CATS) return Promise.resolve(CATS);
    return fetch(SB + '/rest/v1/produto_categorias?select=rotulo,ordem&order=ordem.asc,rotulo.asc',
                 { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        CATS = (Array.isArray(rows) ? rows : []).map(function (x) { return x.rotulo; }).filter(Boolean);
        return CATS;
      })
      .catch(function () { CATS = []; return CATS; });
  }

  function equiparCategoria() {
    var campo = document.querySelector('#form-prod [data-k="categoria"]');
    if (!campo || campo.__kmCat) return;
    campo.__kmCat = true;
    carregarCats().then(function (lista) {
      if (!lista.length) return;
      var dl = document.getElementById('km-cat-dl');
      if (!dl) { dl = document.createElement('datalist'); dl.id = 'km-cat-dl'; document.body.appendChild(dl); }
      dl.innerHTML = lista.map(function (c) { return '<option value="' + c.replace(/"/g, '&quot;') + '">'; }).join('');
      if (campo.tagName === 'INPUT') {
        campo.setAttribute('list', 'km-cat-dl');
        campo.setAttribute('autocomplete', 'off');
        if (!campo.placeholder) campo.placeholder = 'Escolha uma categoria da lista…';
        campo.title = 'Escolha da lista sempre que possível. A grafia é padronizada automaticamente ao salvar.';
      }
    });
  }

  function iniciar() {
    equiparCategoria();
    if (window.__kmCatObs) return;
    var obs = new MutationObserver(function () {
      clearTimeout(window.__kmCatT);
      window.__kmCatT = setTimeout(equiparCategoria, 80);
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    window.__kmCatObs = obs;
  }

  if (document.body) iniciar();
  document.addEventListener('DOMContentLoaded', iniciar);
})();
