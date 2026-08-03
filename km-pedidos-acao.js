/* =============================================================================
   KM Interiores · CRM · km-pedidos-acao.js — 03/08/2026
   Cancelar / Excluir pedido — versão definitiva, com erro VISÍVEL.

   POR QUÊ ESTE ARQUIVO EXISTE
   ---------------------------
   O botão "Excluir" da tela Pedidos chamava a RPC cancelar_ou_excluir_venda e,
   quando o Postgres recusava o UPDATE (constraint pedidos_cliente_obrigatorio,
   criada em 27/07 e violada por pedidos órfãos do histórico), o helper rpc() do
   crm.html devolvia o corpo do erro sem checar r.ok. O resultado era o alerta
   inútil "Não foi possível: erro" — ou nada visível. A causa raiz foi corrigida
   no banco (migration km_fix_excluir_pedido_orfao_2026_08_03); este arquivo
   garante que, se QUALQUER outra recusa aparecer no futuro, ela apareça na tela
   com o motivo real, em vez de morrer em silêncio.

   Arquivo .js próprio (e não bloco dentro do crm.html) por causa da armadilha 22:
   recurso escrito dentro de HTML grande morre na próxima reescrita da página.

   NADA É APAGADO: a RPC só troca o status para 'cancelado' ou 'excluido'.
   A linha continua no banco e é reversível.
   ============================================================================= */
(function () {
  'use strict';

  var SB     = window.SB || 'https://hpbtnlfihbwwawgtesvm.supabase.co';
  var KEY    = window.KEY || 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
  var TOKKEY = 'km_crm_token';

  function tok() { try { return localStorage.getItem(TOKKEY) || ''; } catch (e) { return ''; } }

  function heads() {
    var t = tok();
    if (typeof window.authHeaders === 'function') {
      try { var h = window.authHeaders(t); h['Content-Type'] = 'application/json'; return h; } catch (e) {}
    }
    return { apikey: KEY, Authorization: 'Bearer ' + (t || KEY), 'Content-Type': 'application/json' };
  }

  // Traduz o código seco da RPC para uma frase que o consultor entende.
  var MOTIVO = {
    sem_permissao:  'Você não tem permissão para isso. Entre com um usuário de gestão (admin, gestor ou vendas).',
    status_invalido:'Status inválido — só é possível cancelar ou excluir.',
    nao_encontrado: 'Pedido não encontrado. Atualize a lista e tente de novo.'
  };

  function explicar(httpStatus, corpo) {
    if (httpStatus === 401 || httpStatus === 403) {
      return 'Sua sessão expirou. Saia e entre de novo no CRM.';
    }
    var m = (corpo && (corpo.message || corpo.msg || corpo.hint || corpo.details)) || '';
    if (/pedidos_cliente_obrigatorio/.test(m)) {
      return 'Este pedido está sem cliente e o banco ainda exige cliente para gravar. '
           + 'Vincule o cliente pelo link "vincular" na própria linha e tente de novo.';
    }
    if (/violates foreign key/.test(m)) {
      return 'Existe um registro ligado a este pedido que impede a operação. Avise o suporte.';
    }
    return m ? ('O banco recusou: ' + m) : ('Falha de comunicação (HTTP ' + httpStatus + ').');
  }

  // Remove a linha da tabela na hora — feedback imediato, sem esperar o recarregamento.
  function tirarLinha(id) {
    var tb = document.getElementById('pedidosBody');
    if (!tb) return;
    var trs = tb.querySelectorAll('tr');
    for (var i = 0; i < trs.length; i++) {
      if (trs[i].innerHTML.indexOf(id) >= 0) { trs[i].parentNode.removeChild(trs[i]); break; }
    }
  }

  // Recarrega a tela Pedidos inteira (lista + Fechamento do dia) pelo caminho que
  // o CRM já usa: o item do menu. loadPedidos NÃO está em window — é local do IIFE.
  function recarregar() {
    var a = document.querySelector('a[data-view="pedidos"]');
    if (a && typeof a.click === 'function') { try { a.click(); return; } catch (e) {} }
    if (typeof window.loadPedidos === 'function') { try { window.loadPedidos(); } catch (e) {} }
  }

  window.acaoVenda = function (id, status) {
    if (!id) { window.alert('Pedido sem identificador — atualize a página.'); return; }
    if (status !== 'cancelado' && status !== 'excluido') { return; }

    var txt = status === 'cancelado'
      ? 'Cancelar esta venda?\n\nEla sai do Fechamento do dia e da comissão do consultor. A OS ligada será cancelada.\nO registro NÃO é apagado — fica no histórico e é reversível.'
      : 'Excluir esta venda?\n\nEla some da lista, do Fechamento e da comissão.\nO registro NÃO é apagado do banco — fica marcado como excluído e é reversível pelo suporte.';
    if (!window.confirm(txt)) return;

    var httpStatus = 0;
    fetch(SB + '/rest/v1/rpc/cancelar_ou_excluir_venda', {
      method: 'POST',
      headers: heads(),
      body: JSON.stringify({ p_pedido_id: id, p_status: status })
    })
      .then(function (r) {
        httpStatus = r.status;
        return r.text().then(function (t) { try { return JSON.parse(t); } catch (e) { return { message: t }; } });
      })
      .then(function (j) {
        if (httpStatus >= 400) { window.alert('Não foi possível.\n\n' + explicar(httpStatus, j)); return; }
        if (j && j.erro) { window.alert('Não foi possível.\n\n' + (MOTIVO[j.erro] || j.erro)); return; }
        if (!j || j.ok !== true) { window.alert('Não foi possível.\n\n' + explicar(httpStatus, j)); return; }
        tirarLinha(id);
        recarregar();
      })
      .catch(function (e) {
        window.alert('Erro de conexão com o servidor. Verifique a internet e tente de novo.');
        if (window.console) console.error('[km-pedidos-acao]', e);
      });
  };

  window.__kmPedidosAcao = '2026-08-03';
})();
