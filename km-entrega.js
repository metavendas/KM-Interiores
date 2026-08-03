/* ============================================================================
   KM Interiores — Data de entrega no EDITAR PEDIDO  ·  03/08/2026

   O PROBLEMA: a data de entrega só existia no formulário de venda NOVA
   (patch de 27/07). Quem já tinha pedido na casa não tinha como informá-la —
   ao editar, só aparecia a data da venda.

   A BOA NOTÍCIA: o banco já estava pronto. A RPC editar_venda_completa já trata
   'data_entrega' — grava quando a chave vem no payload e PRESERVA o valor atual
   quando não vem. Não foi preciso mexer em nada no banco.

   COMO FUNCIONA (100% aditivo, sem tocar no código do modal):
     1. injeta o campo "Data de entrega" ao lado da "Data da venda";
     2. quando o modal abre, busca a data de entrega do pedido e preenche;
     3. na hora de salvar, injeta a data no payload que já está sendo enviado.

   Arquivo próprio de propósito — recurso escrito dentro do crm.html se perde
   na próxima reescrita do arquivo.
   ========================================================================== */
(function () {
  'use strict';

  var SB     = window.SB     || 'https://hpbtnlfihbwwawgtesvm.supabase.co';
  var KEY    = window.KEY    || 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
  var TOKKEY = window.TOKKEY || 'km_crm_token';

  function tok() { try { return localStorage.getItem(TOKKEY) || ''; } catch (e) { return ''; } }
  function el(id) { return document.getElementById(id); }

  var CSS = ''
    + '#km-ped-entrega-box label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;'
    +   'color:var(--muted);display:block;margin-bottom:4px}'
    + '#km-ped-entrega{background:var(--bg3);border:1px solid var(--line);border-radius:8px;'
    +   'padding:8px 10px;color:var(--text);font-size:13px;outline:none;width:100%;box-sizing:border-box}'
    + '#km-ped-entrega:focus{border-color:var(--accent)}'
    + '#km-ped-entrega-box .km-dica{font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}';

  var ULTIMO = null;

  /* ---------------------------------------------------------------- injeção */
  function injeta() {
    if (el('km-ped-entrega')) return true;
    var dataVenda = el('km-ped-data');
    if (!dataVenda) return false;

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    // pendura no mesmo pai do campo "data da venda", logo depois dele,
    // para herdar o grid/layout do modal seja ele qual for
    var alvo = dataVenda.parentNode;
    var box = document.createElement('div');
    box.id = 'km-ped-entrega-box';
    box.innerHTML = '<label for="km-ped-entrega">Data de entrega</label>'
      + '<input type="date" id="km-ped-entrega">'
      + '<div class="km-dica">Deixe vazio se ainda não houver data combinada.</div>';

    // se o campo de data estiver dentro de um wrapper próprio, insere ao lado do wrapper
    var refer = (alvo && alvo.children.length === 1 && alvo.parentNode) ? alvo : dataVenda;
    if (refer.parentNode) refer.parentNode.insertBefore(box, refer.nextSibling);
    else alvo.appendChild(box);
    return true;
  }

  /* ------------------------------------------------- carrega a data do pedido */
  function carrega(id) {
    var campo = el('km-ped-entrega');
    if (!campo) return;
    campo.value = '';
    fetch(SB + '/rest/v1/pedidos?id=eq.' + encodeURIComponent(id) + '&select=data_entrega&limit=1', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + (tok() || KEY) }
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (a) {
        var c = el('km-ped-entrega');
        if (c && a && a[0] && a[0].data_entrega) c.value = String(a[0].data_entrega).slice(0, 10);
      })
      .catch(function () { });
  }

  /* o modal não emite evento ao abrir; o sinal confiável é o campo escondido
     km-ped-id mudar de valor. Uma verificação leve a cada 400ms resolve sem
     depender de detalhe interno do CRM. */
  function vigia() {
    setInterval(function () {
      var idEl = el('km-ped-id');
      if (!idEl) return;
      if (!injeta()) return;
      var v = idEl.value || '';
      if (v !== ULTIMO) {
        ULTIMO = v;
        if (v) carrega(v); else { var c = el('km-ped-entrega'); if (c) c.value = ''; }
      }
    }, 400);
  }

  /* -------------------------------------- injeta a data no payload do salvar */
  var fetchOriginal = window.fetch;
  window.fetch = function (url, opt) {
    try {
      var u = String(url || '');
      if (u.indexOf('/rpc/editar_venda_completa') >= 0 && opt && typeof opt.body === 'string') {
        var b = JSON.parse(opt.body);
        var campo = el('km-ped-entrega');
        if (b && b.p && campo) {
          // string vazia vira null na RPC: é assim que o gestor APAGA uma data
          // de entrega que estava errada, sem precisar de outro botão.
          b.p.data_entrega = campo.value || '';
          opt = Object.assign({}, opt, { body: JSON.stringify(b) });
        }
      }
    } catch (e) { /* nunca deixar o interceptador derrubar um salvamento */ }
    return fetchOriginal.apply(this, [url, opt]);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigia);
  else vigia();
})();
