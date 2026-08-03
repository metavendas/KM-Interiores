/* ============================================================================
   KM Interiores — Painel de Campanha  ·  03/08/2026
   Mede a cadeia inteira: investimento → lead → card no funil → pedido → receita.

   ONDE APARECE: no topo da tela FUNIL do CRM.
   POR QUE ALI e não numa aba nova: aba nova exige entrar em MODULOS + showView
   e o admin liberar acesso pessoa por pessoa (armadilha nº 1 do projeto). O funil
   é onde o gestor já olha o pipeline — o dinheiro que gerou o pipeline pertence
   à mesma tela.

   ARQUIVO PRÓPRIO de propósito: em 21/07 um recurso escrito dentro de um HTML
   grande foi perdido na reescrita seguinte. Aqui isso não se repete.

   BACKEND: RPC km_campanha_painel(de, ate) · km_ads_lancar(jsonb)
            Edge km-ads-sync (Marketing API da Meta)
   ========================================================================== */
(function () {
  'use strict';

  var SB     = window.SB     || 'https://hpbtnlfihbwwawgtesvm.supabase.co';
  var KEY    = window.KEY    || 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
  var TOKKEY = window.TOKKEY || 'km_crm_token';

  function tok() { try { return localStorage.getItem(TOKKEY) || ''; } catch (e) { return ''; } }
  function H() {
    return { apikey: KEY, Authorization: 'Bearer ' + (tok() || KEY), 'Content-Type': 'application/json' };
  }
  function rpc(nome, corpo) {
    return fetch(SB + '/rest/v1/rpc/' + nome, { method: 'POST', headers: H(), body: JSON.stringify(corpo || {}) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function brl(v) {
    var n = Number(v || 0);
    try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    catch (e) { return 'R$ ' + n.toFixed(2); }
  }
  function num(v) { try { return Number(v || 0).toLocaleString('pt-BR'); } catch (e) { return String(v || 0); } }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function diasAtras(n) { var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function ddmm(s) { var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : s; }

  var CSS = ''
    + '#kmCamp{border:1px solid var(--line);border-radius:12px;background:var(--bg2);padding:18px 18px 20px;margin:0 0 22px}'
    + '#kmCamp .kc-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px}'
    + '#kmCamp h3{font-size:16px;color:var(--text);margin:0;font-weight:600;letter-spacing:.02em}'
    + '#kmCamp .kc-sub{font-size:11.5px;color:var(--muted);margin:2px 0 16px}'
    + '#kmCamp .kc-per{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}'
    + '#kmCamp .kc-per button{font-size:11.5px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer;transition:.15s}'
    + '#kmCamp .kc-per button:hover{border-color:var(--accent);color:var(--text)}'
    + '#kmCamp .kc-per button.on{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:600}'
    + '#kmCamp .kc-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:10px;margin-bottom:16px}'
    + '#kmCamp .kc-k{border:1px solid var(--line);border-radius:10px;padding:11px 13px;background:var(--bg3)}'
    + '#kmCamp .kc-k .t{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '#kmCamp .kc-k .v{font-size:19px;color:var(--text);margin-top:5px;font-weight:600;font-variant-numeric:tabular-nums}'
    + '#kmCamp .kc-k .h{font-size:10.5px;color:var(--muted);margin-top:3px}'
    + '#kmCamp .kc-k.destaque{border-color:var(--accent)}'
    + '#kmCamp .kc-k.destaque .v{color:var(--accent)}'
    + '#kmCamp .kc-aviso{border:1px solid var(--accent);border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12.5px;line-height:1.6;color:var(--text);background:rgba(203,152,76,.10)}'
    + '#kmCamp .kc-aviso b{color:var(--accent)}'
    + '#kmCamp h4{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:20px 0 10px;font-weight:600}'
    + '#kmCamp .kc-graf{display:flex;align-items:flex-end;gap:3px;height:112px;border-bottom:1px solid var(--line);padding-bottom:2px;overflow-x:auto}'
    + '#kmCamp .kc-col{flex:1 0 16px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:2px;height:100%;position:relative}'
    + '#kmCamp .kc-b1{width:70%;background:var(--accent);opacity:.85;border-radius:2px 2px 0 0;min-height:1px}'
    + '#kmCamp .kc-b2{width:70%;background:var(--muted);opacity:.45;border-radius:2px 2px 0 0;min-height:1px}'
    + '#kmCamp .kc-dias{display:flex;gap:3px;margin-top:5px;overflow-x:auto}'
    + '#kmCamp .kc-dias span{flex:1 0 16px;text-align:center;font-size:8.5px;color:var(--muted)}'
    + '#kmCamp .kc-leg{display:flex;gap:16px;margin-top:8px;font-size:11px;color:var(--muted)}'
    + '#kmCamp .kc-leg i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:-1px}'
    + '#kmCamp table{width:100%;border-collapse:collapse;font-size:12.5px}'
    + '#kmCamp th{text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:7px 8px;border-bottom:1px solid var(--line);font-weight:600}'
    + '#kmCamp td{padding:8px;border-bottom:1px solid var(--line);color:var(--text)}'
    + '#kmCamp td.n,#kmCamp th.n{text-align:right;font-variant-numeric:tabular-nums}'
    + '#kmCamp .kc-vazio{font-size:12.5px;color:var(--muted);padding:14px 0}'
    + '#kmCamp .kc-lanc{margin-top:20px;border-top:1px solid var(--line);padding-top:16px}'
    + '#kmCamp .kc-lanc .lin{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}'
    + '#kmCamp .kc-lanc label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:4px}'
    + '#kmCamp .kc-lanc input{background:var(--bg3);border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;outline:none;width:130px}'
    + '#kmCamp .kc-lanc input:focus{border-color:var(--accent)}'
    + '#kmCamp .kc-btn{border:1px solid var(--accent);background:var(--accent);color:var(--bg);font-size:12px;padding:9px 18px;border-radius:8px;cursor:pointer;font-weight:600;transition:.15s}'
    + '#kmCamp .kc-btn:hover{filter:brightness(1.08)}'
    + '#kmCamp .kc-btn.ghost{background:transparent;color:var(--text);border-color:var(--line)}'
    + '#kmCamp .kc-btn.ghost:hover{border-color:var(--accent);color:var(--accent)}'
    + '#kmCamp .kc-msg{font-size:12px;color:var(--accent);margin-top:10px;min-height:16px}';

  var DE = diasAtras(29), ATE = iso(new Date()), PER = 30;

  function html() {
    return ''
      + '<div class="kc-top"><h3>📊 Campanha em andamento</h3>'
      +   '<div class="kc-per">'
      +     '<button data-p="7">7 dias</button>'
      +     '<button data-p="30" class="on">30 dias</button>'
      +     '<button data-p="90">90 dias</button>'
      +     '<button data-p="r" class="kc-refresh" title="Atualizar">↻</button>'
      +   '</div></div>'
      + '<div class="kc-sub" id="kcSub">Do anúncio ao pedido faturado.</div>'
      + '<div id="kcAviso"></div>'
      + '<div class="kc-kpis" id="kcKpis"></div>'
      + '<h4>Investimento e leads por dia</h4>'
      + '<div class="kc-graf" id="kcGraf"></div><div class="kc-dias" id="kcDias"></div>'
      + '<div class="kc-leg"><span><i style="background:var(--accent)"></i>Investido no dia</span>'
      +   '<span><i style="background:var(--muted);opacity:.45"></i>Leads no dia</span></div>'
      + '<h4>Por anúncio</h4><div id="kcAnuncios"></div>'
      + '<h4>De onde vieram os leads</h4><div id="kcCanais"></div>'
      + '<div class="kc-lanc">'
      +   '<h4 style="margin-top:0">Lançar investimento do dia</h4>'
      +   '<div class="lin">'
      +     '<div><label>Dia</label><input type="date" id="kcDia"></div>'
      +     '<div><label>Investido (R$)</label><input type="number" id="kcGasto" step="0.01" min="0" placeholder="10,00"></div>'
      +     '<div><label>Cliques</label><input type="number" id="kcCliques" min="0" placeholder="0"></div>'
      +     '<div><label>Impressões</label><input type="number" id="kcImp" min="0" placeholder="0"></div>'
      +     '<button class="kc-btn" id="kcSalvar">Salvar</button>'
      +     '<button class="kc-btn ghost" id="kcTestar">Testar conexão com a Meta</button>'
      +   '</div>'
      +   '<div class="kc-msg" id="kcMsg"></div>'
      + '</div>';
  }

  function kpi(t, v, h, destaque) {
    return '<div class="kc-k' + (destaque ? ' destaque' : '') + '"><div class="t">' + t + '</div>'
         + '<div class="v">' + v + '</div>' + (h ? '<div class="h">' + h + '</div>' : '') + '</div>';
  }

  function render(d) {
    var el = document.getElementById('kmCamp');
    if (!el || !d) return;

    if (d.ok === false) {
      document.getElementById('kcKpis').innerHTML =
        '<div class="kc-vazio">Sem permissão para ver o painel. Peça ao administrador o acesso de gestor.</div>';
      return;
    }

    var gasto = Number(d.gasto || 0), leadsT = Number(d.leads_total || 0), leadsA = Number(d.leads_atrib || 0);
    var pedidos = Number(d.pedidos || 0), rPaga = Number(d.receita_paga || 0), rAberta = Number(d.receita_aberta || 0);
    var cpl = leadsA > 0 ? gasto / leadsA : 0;
    var cac = pedidos > 0 ? gasto / pedidos : 0;
    var roas = gasto > 0 ? rPaga / gasto : 0;

    /* O aviso mais importante do painel: gasto lançado sem nenhum lead atribuído
       significa que o rastreamento não está no ar — não que o anúncio não funciona.
       Sem esse alerta o gestor tomaria a decisão errada (matar uma campanha boa). */
    var av = document.getElementById('kcAviso');
    if (gasto > 0 && leadsA === 0) {
      av.innerHTML = '<div class="kc-aviso"><b>Atenção:</b> há investimento lançado e <b>nenhum lead com origem identificada</b>. '
        + 'Quase sempre isso quer dizer que o <b>km-track.js ainda não está publicado no site</b> — e não que a campanha esteja ruim. '
        + 'Enquanto ele não subir, os leads aparecem sem origem e o custo por lead fica sem base. '
        + 'Os ' + num(leadsT) + ' leads do período continuam no funil normalmente.</div>';
    } else if (gasto === 0) {
      av.innerHTML = '<div class="kc-aviso"><b>Nenhum investimento lançado neste período.</b> '
        + 'Assim que a conexão com a Meta estiver ativa o valor entra sozinho todo dia. '
        + 'Até lá, lance o valor do dia no campo abaixo — leva 20 segundos e já libera o custo por lead.</div>';
    } else av.innerHTML = '';

    document.getElementById('kcKpis').innerHTML =
        kpi('Investido', brl(gasto), num(d.cliques) + ' cliques · ' + num(d.impressoes) + ' impressões')
      + kpi('Leads no período', num(leadsT), num(leadsA) + ' com origem identificada')
      + kpi('Custo por lead', leadsA > 0 ? brl(cpl) : '—', leadsA > 0 ? 'sobre leads atribuídos' : 'depende do rastreamento')
      + kpi('Oportunidades', num(d.oportunidades), num(d.perdidas) + ' perdidas/arquivadas')
      + kpi('Pedidos', num(pedidos), cac > 0 ? 'custo de aquisição ' + brl(cac) : 'nenhuma venda atribuída ainda')
      + kpi('Receita paga', brl(rPaga), rAberta > 0 ? brl(rAberta) + ' aguardando pagamento' : 'nada em aberto')
      + kpi('Retorno', gasto > 0 ? roas.toFixed(2) + '×' : '—', gasto > 0 ? 'cada R$ 1 virou ' + brl(roas) : 'sem investimento lançado', true);

    var serie = d.serie || [];
    var maxG = 0, maxL = 0;
    serie.forEach(function (x) { maxG = Math.max(maxG, Number(x.gasto || 0)); maxL = Math.max(maxL, Number(x.leads || 0)); });
    document.getElementById('kcGraf').innerHTML = serie.map(function (x) {
      var hg = maxG > 0 ? Math.round(Number(x.gasto || 0) / maxG * 92) : 0;
      var hl = maxL > 0 ? Math.round(Number(x.leads || 0) / maxL * 92) : 0;
      return '<div class="kc-col" title="' + ddmm(x.dia) + ' · ' + brl(x.gasto) + ' · ' + num(x.leads) + ' leads">'
           + '<div class="kc-b1" style="height:' + hg + '%"></div>'
           + '<div class="kc-b2" style="height:' + hl + '%"></div></div>';
    }).join('');
    var passo = Math.max(1, Math.ceil(serie.length / 12));
    document.getElementById('kcDias').innerHTML = serie.map(function (x, i) {
      return '<span>' + (i % passo === 0 ? ddmm(x.dia) : '') + '</span>';
    }).join('');

    var an = d.anuncios || [];
    document.getElementById('kcAnuncios').innerHTML = an.length
      ? '<table><tr><th>Anúncio</th><th class="n">Leads</th><th class="n">Oportunidades</th><th class="n">Pedidos</th><th class="n">Receita</th></tr>'
        + an.map(function (a) {
            return '<tr><td>' + esc(a.anuncio) + '</td><td class="n">' + num(a.leads) + '</td><td class="n">'
                 + num(a.oportunidades) + '</td><td class="n">' + num(a.pedidos) + '</td><td class="n">' + brl(a.receita) + '</td></tr>';
          }).join('') + '</table>'
      : '<div class="kc-vazio">Nenhum lead com anúncio identificado ainda. Aparece aqui assim que o rastreamento estiver no ar.</div>';

    var ca = d.canais || [];
    document.getElementById('kcCanais').innerHTML = ca.length
      ? '<table><tr><th>Canal</th><th class="n">Leads</th><th class="n">Participação</th></tr>'
        + ca.map(function (c) {
            var pct = leadsT > 0 ? Math.round(Number(c.leads) / leadsT * 100) : 0;
            return '<tr><td>' + esc(c.canal) + '</td><td class="n">' + num(c.leads) + '</td><td class="n">' + pct + '%</td></tr>';
          }).join('') + '</table>'
      : '<div class="kc-vazio">Nenhum lead no período.</div>';

    document.getElementById('kcSub').textContent =
      'Do anúncio ao pedido faturado · ' + ddmm(DE) + ' a ' + ddmm(ATE)
      + (d.linhas_api > 0 ? ' · investimento vindo da Meta' : (d.linhas_manual > 0 ? ' · investimento lançado à mão' : ''));
  }

  function carregar() {
    var k = document.getElementById('kcKpis');
    if (k) k.innerHTML = '<div class="kc-vazio">Carregando…</div>';
    rpc('km_campanha_painel', { p_de: DE, p_ate: ATE }).then(render);
  }

  function montar() {
    var view = document.querySelector('.view[data-v="funil"]');
    if (!view || document.getElementById('kmCamp')) return;

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var box = document.createElement('section'); box.id = 'kmCamp'; box.innerHTML = html();
    view.insertBefore(box, view.firstChild);

    box.querySelector('.kc-per').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var p = b.getAttribute('data-p');
      if (p !== 'r') {
        PER = Number(p); DE = diasAtras(PER - 1); ATE = iso(new Date());
        Array.prototype.forEach.call(box.querySelectorAll('.kc-per button'), function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      }
      carregar();
    });

    var hoje = iso(new Date());
    document.getElementById('kcDia').value = hoje;
    document.getElementById('kcDia').max = hoje;

    document.getElementById('kcSalvar').onclick = function () {
      var msg = document.getElementById('kcMsg');
      var dia = document.getElementById('kcDia').value;
      var g = document.getElementById('kcGasto').value;
      if (!dia) { msg.textContent = 'Escolha o dia.'; return; }
      if (g === '' || Number(g) < 0) { msg.textContent = 'Informe o valor investido.'; return; }
      this.disabled = true; msg.textContent = 'Salvando…';
      var self = this;
      rpc('km_ads_lancar', { p: {
        dia: dia, gasto: Number(g),
        cliques: Number(document.getElementById('kcCliques').value || 0),
        impressoes: Number(document.getElementById('kcImp').value || 0)
      } }).then(function (r) {
        self.disabled = false;
        if (r && r.ok) {
          msg.textContent = 'Investimento de ' + ddmm(dia) + ' registrado. Relançar o mesmo dia corrige o valor — não soma.';
          carregar();
        } else {
          msg.textContent = (r && r.erro === 'sem_permissao')
            ? 'Você não tem permissão para lançar investimento.'
            : 'Não foi possível salvar agora.';
        }
      });
    };

    document.getElementById('kcTestar').onclick = function () {
      var msg = document.getElementById('kcMsg');
      this.disabled = true; msg.textContent = 'Consultando a Meta…';
      var self = this;
      fetch(SB + '/functions/v1/km-ads-sync', {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + (tok() || KEY), 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: 'status' })
      }).then(function (r) { return r.json(); }).then(function (j) {
        self.disabled = false;
        if (j && j.pronto) msg.textContent = 'Conectado à conta ' + (j.conta || '') + ' (' + (j.moeda || '') + '). O investimento passa a entrar sozinho.';
        else if (j && j.faltando) msg.textContent = 'Faltam os segredos: ' + j.faltando.join(', ') + '. Cadastre em Supabase → Edge Functions → Secrets.';
        else if (j && j.erro_meta) msg.textContent = 'A Meta recusou: ' + j.erro_meta;
        else msg.textContent = 'Não foi possível falar com a função agora.';
      }).catch(function () { self.disabled = false; msg.textContent = 'Não foi possível falar com a função agora.'; });
    };

    /* recarrega sempre que a tela do funil volta a aparecer (o CRM só troca o
       atributo hidden das seções — não recarrega a página) */
    try {
      new MutationObserver(function () { if (!view.hidden) carregar(); })
        .observe(view, { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) { }

    if (!view.hidden) carregar();
  }

  function boot() {
    montar();
    if (!document.getElementById('kmCamp')) {
      // o CRM monta as telas depois do login — tenta de novo por até 30s
      var t = 0, iv = setInterval(function () {
        montar();
        if (document.getElementById('kmCamp') || ++t > 60) clearInterval(iv);
      }, 500);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
