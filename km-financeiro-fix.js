/* ==========================================================================
   KM Interiores · FINANCEIRO — ERRO VISIVEL + ESTORNO   (03/08/2026 — 6a sessao)
   --------------------------------------------------------------------------
   DOIS BUGS QUE ESTE ARQUIVO FECHA NO FRONT (a causa raiz foi no banco):

   1) "APARECEU QUITADO SEM EU DAR BAIXA"
      Causa: registrar_venda gravava pago=true quando o pedido entrava com
      status 'pago' + forma pix/dinheiro/cartao/transferencia.
      Corrigido no banco pelo gatilho trg_km_receber_nasce_aberto: titulo de
      venda SEMPRE nasce em aberto. Aqui entra o antidoto para o que ja passou:
      o botao "↩ Estornar quitacao" no extrato de recebimentos.
      ESTORNO NAO APAGA NADA — o titulo continua, volta para "em aberto".

   2) "NAO CONSEGUI EXCLUIR"
      Causa: excluir_financeiro devolvia {ok:true} mesmo apagando ZERO linhas
      (titulo vindo de pedido tem origem nula e a funcao so apaga
      manual/importado). O front via ok:true, dava refresh e a linha continuava
      la — sem uma palavra de erro. Classica armadilha 30.
      Agora a funcao devolve o motivo real e aqui ele vira mensagem em portugues,
      com o caminho certo: titulo de venda se remove EXCLUINDO O PEDIDO.

   Arquivo proprio (armadilha 22). Nao altera dado nenhum sozinho.
   ========================================================================== */
(function () {
  'use strict';

  // ---- acesso ao helper de RPC do crm.html ---------------------------------
  // rpc() e local do IIFE (armadilha 31), entao falamos direto com o PostgREST.
  function SBURL() { return (typeof window.SB === 'string' && window.SB) || ''; }
  function tok() { try { return localStorage.getItem('km_crm_token'); } catch (e) { return null; } }
  function heads() {
    var h = { 'Content-Type': 'application/json' };
    if (typeof window.KEY === 'string' && window.KEY) h.apikey = window.KEY;
    var t = tok(); if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }
  function chamar(fn, body) {
    if (typeof window.authHeaders === 'function') {
      return fetch(SBURL() + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: Object.assign(window.authHeaders(tok()), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body || {})
      }).then(function (r) { return r.json().catch(function () { return null; }); });
    }
    return fetch(SBURL() + '/rest/v1/rpc/' + fn, { method: 'POST', headers: heads(), body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().catch(function () { return null; }); });
  }

  // ---- 2) EXCLUIR: traduzir o motivo real -----------------------------------
  var MOTIVO = {
    sem_permissao:  'Você não tem permissão de gestão para excluir lançamentos.',
    nao_encontrado: 'Lançamento não encontrado (a tela pode estar desatualizada).',
    ja_aberto:      'Este título já está em aberto — não há baixa para estornar.'
  };

  function explicar(r) {
    if (!r) return 'Erro de conexão com o servidor.';
    if (r.ok) return null;
    if (r.erro === 'vinculado') {
      if (r.pedido) {
        return 'Este título NÃO é um lançamento avulso: ele nasceu da venda ' + r.pedido + '.\n\n' +
               'Para removê-lo, exclua ou cancele o PEDIDO ' + r.pedido +
               ' (menu Pedidos & Vendas → botão Excluir). O título some junto, e o estoque volta.';
      }
      return 'Este título veio de outro registro (' + (r.ref_tipo || 'sistema') +
             ') e não pode ser apagado solto. Remova o registro de origem.';
    }
    if (r.erro === 'tem_baixas') {
      return 'Este título tem ' + r.baixas + ' baixa(s) lançada(s).\n\n' +
             'Estorne ou corrija a baixa em Contas a Receber (histórico de baixas) — ' +
             'assim o caixa e o DRE continuam batendo.';
    }
    return MOTIVO[r.erro] || ('Não foi possível: ' + (r.erro || 'erro desconhecido'));
  }

  function excluirComMotivo(id, depois) {
    if (!confirm('Excluir este lançamento?')) return;
    chamar('excluir_financeiro', { p_id: id }).then(function (r) {
      var msg = explicar(r);
      if (msg) { alert(msg); return; }
      if (typeof depois === 'function') depois();
    }).catch(function () { alert('Erro de conexão.'); });
  }

  function recarregarCR() {
    // crRefresh/fcReload sao locais do IIFE — recarregamos clicando no menu.
    var a = document.querySelector('a[data-view="financeiro"]') || document.querySelector('a[data-view="fluxo"]');
    if (a) a.click();
  }

  window.crDel     = function (id) { excluirComMotivo(id, recarregarCR); };
  window.fcDelLanc = function (id) { excluirComMotivo(id, recarregarCR); };

  // ---- 1) ESTORNO da quitacao indevida --------------------------------------
  window.kmEstornarPedido = function (numero) {
    if (!numero) return;
    if (!confirm('Estornar a quitação da venda ' + numero + '?\n\n' +
                 'O título volta para "em aberto" em Contas a Receber.\n' +
                 'NADA é apagado — a operação fica registrada na auditoria.')) return;
    chamar('estornar_recebimento_pedido', { p_numero: numero }).then(function (r) {
      if (r && r.ok) {
        alert('✓ Quitação estornada. A venda ' + numero + ' voltou para "em aberto".');
        var b = document.getElementById('kmExtGo'); if (b) b.click();
        return;
      }
      alert(explicar(r) || 'Não foi possível estornar.');
    }).catch(function () { alert('Erro de conexão.'); });
  };

  // Injeta o botao nas linhas "✅ quitado" do painel de extrato de recebimentos.
  // POR QUE por DOM e nao no template: o template mora dentro do crm.html e some
  // na proxima reescrita (armadilha 22). Aqui o botao se recoloca sozinho.
  function injetarEstorno() {
    var box = document.getElementById('kmExtrato'); if (!box) return;
    var trs = box.querySelectorAll('tr.tit');
    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      if (tr._kmEst) continue;
      var tdSit = tr.cells && tr.cells[tr.cells.length - 1];
      if (!tdSit || tdSit.textContent.indexOf('quitado') < 0) continue;
      var num = (tr.cells[0] && tr.cells[0].textContent || '').trim();
      if (!num || num === '—') continue;
      tr._kmEst = true;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '↩ estornar';
      b.title = 'Desfazer a quitação — o título volta para em aberto. Nada é apagado.';
      b.style.cssText = 'margin-left:8px;font-size:10px;padding:2px 7px;border:1px solid var(--line);' +
                        'border-radius:3px;background:transparent;color:#e5534b;cursor:pointer';
      b.setAttribute('data-num', num);
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        window.kmEstornarPedido(this.getAttribute('data-num'));
      });
      tdSit.appendChild(b);
    }
  }

  function observarExtrato() {
    var box = document.getElementById('kmExtrato');
    if (!box || box._kmObs) return;
    box._kmObs = true;
    var d = null;
    new MutationObserver(function () { clearTimeout(d); d = setTimeout(injetarEstorno, 60); })
      .observe(box, { childList: true, subtree: true });
    injetarEstorno();
  }

  function iniciar() { observarExtrato(); }
  iniciar();                                            // idempotente
  document.addEventListener('DOMContentLoaded', iniciar);
  document.addEventListener('click', function () { setTimeout(observarExtrato, 200); }, true);

  window.kmFinFixInjetar = injetarEstorno;   // util para QA
})();
