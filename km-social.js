/* ============================================================================
   KM Interiores — Barra social da página de produto (PDP)
   Compartilhar · Curtir (público) · Favoritar (pessoal) · Comentários (moderados)

   POR QUE ARQUIVO SEPARADO (03/08/2026):
   este recurso já existiu (21/07/2026) escrito DENTRO do produto.html e foi
   perdido quando o produto.html foi sobrescrito por uma versão anterior.
   Em arquivo próprio, uma futura reescrita da PDP não apaga o recurso — no
   máximo tira a tag <script>, que é trivial de repor.

   BACKEND (já existia e continua intacto — nada foi criado nesta sessão):
     tabela produto_curtidas      + RPC produto_curtir / produto_curtida_estado
     tabela produto_comentarios   (RLS: anônimo só grava aprovado=false e
                                   só lê aprovado=true; staff modera no CRM)
   Moderação: CRM → tela Produtos → "💬 Comentários dos produtos".
   ========================================================================== */
(function () {
  'use strict';

  var SB  = 'https://hpbtnlfihbwwawgtesvm.supabase.co';
  var KEY = 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
  var H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* token anônimo do visitante — mesma chave usada desde 21/07, para não
     zerar as curtidas de quem já curtiu antes */
  function visitante() {
    var t = '';
    try { t = localStorage.getItem('km_visit') || ''; } catch (e) { }
    if (!t) {
      t = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { localStorage.setItem('km_visit', t); } catch (e) { }
    }
    return t;
  }

  function favoritos() {
    try { return JSON.parse(localStorage.getItem('km_favoritos') || '[]'); } catch (e) { return []; }
  }
  function salvaFavoritos(a) {
    try { localStorage.setItem('km_favoritos', JSON.stringify(a)); } catch (e) { }
  }

  function rpc(nome, corpo) {
    return fetch(SB + '/rest/v1/rpc/' + nome, {
      method: 'POST', headers: H, body: JSON.stringify(corpo)
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function sel(qs) {
    return fetch(SB + '/rest/v1/' + qs, { headers: H })
      .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }

  /* ----------------------------------------------------------------- estilo */
  var CSS = ''
    + '.km-social{margin-top:28px;padding-top:22px;border-top:1px solid var(--line,rgba(203,152,76,.26))}'
    + '.km-social .km-lbl{font-family:var(--sans,Inter,system-ui,sans-serif);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted,rgba(241,228,201,.74));margin-bottom:12px}'
    + '.km-share{display:flex;gap:9px;flex-wrap:wrap;align-items:center}'
    + '.km-share a,.km-share button{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line,rgba(203,152,76,.26));background:transparent;color:var(--text,#F1E4C9);font-family:var(--sans,Inter,system-ui,sans-serif);font-size:12.5px;padding:8px 13px;border-radius:999px;cursor:pointer;text-decoration:none;transition:.18s;line-height:1}'
    + '.km-share a:hover,.km-share button:hover{border-color:var(--accent,#CB984C);color:var(--accent,#CB984C);transform:translateY(-1px)}'
    + '.km-share svg{width:15px;height:15px;fill:currentColor;flex:none}'
    + '.km-reacoes{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}'
    + '.km-react{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line,rgba(203,152,76,.26));background:transparent;color:var(--text,#F1E4C9);font-family:var(--sans,Inter,system-ui,sans-serif);font-size:13px;padding:9px 16px;border-radius:999px;cursor:pointer;transition:.18s;line-height:1}'
    + '.km-react:hover{border-color:var(--accent,#CB984C)}'
    + '.km-react.on{border-color:var(--accent,#CB984C);color:var(--accent,#CB984C);background:rgba(203,152,76,.10)}'
    + '.km-react .km-n{font-variant-numeric:tabular-nums;opacity:.85}'
    + '.km-coment{margin:56px auto 0;max-width:1180px;padding:0 24px}'
    + '.km-coment h3{font-family:var(--serif,Georgia,serif);font-size:20px;color:var(--text,#F1E4C9);margin:0 0 6px;font-weight:400}'
    + '.km-coment .km-sub{font-family:var(--sans,Inter,system-ui,sans-serif);font-size:12.5px;color:var(--muted,rgba(241,228,201,.74));margin-bottom:20px}'
    + '.km-form{display:grid;gap:11px;max-width:620px;margin-bottom:30px}'
    + '.km-form input,.km-form textarea{width:100%;box-sizing:border-box;background:rgba(255,255,255,.03);border:1px solid var(--line,rgba(203,152,76,.26));border-radius:10px;padding:12px 14px;color:var(--text,#F1E4C9);font-family:var(--sans,Inter,system-ui,sans-serif);font-size:14px;outline:none}'
    + '.km-form input:focus,.km-form textarea:focus{border-color:var(--accent,#CB984C)}'
    + '.km-form textarea{min-height:96px;resize:vertical}'
    + '.km-form button{justify-self:start;border:1px solid var(--accent,#CB984C);background:var(--accent,#CB984C);color:#14100a;font-family:var(--sans,Inter,system-ui,sans-serif);font-size:13px;letter-spacing:.06em;padding:11px 26px;border-radius:999px;cursor:pointer;transition:.18s}'
    + '.km-form button:hover{filter:brightness(1.08)}'
    + '.km-form button[disabled]{opacity:.55;cursor:default}'
    + '.km-aviso{font-family:var(--sans,Inter,system-ui,sans-serif);font-size:12.5px;padding:11px 14px;border-radius:10px;border:1px solid var(--line,rgba(203,152,76,.26));color:var(--text,#F1E4C9);background:rgba(203,152,76,.09);display:none}'
    + '.km-lista{display:grid;gap:16px;max-width:760px}'
    + '.km-item{border-left:2px solid var(--line,rgba(203,152,76,.26));padding:2px 0 2px 16px}'
    + '.km-item .km-quem{font-family:var(--sans,Inter,system-ui,sans-serif);font-size:13px;color:var(--accent,#CB984C);letter-spacing:.04em}'
    + '.km-item .km-quando{font-family:var(--sans,Inter,system-ui,sans-serif);font-size:11px;color:var(--muted,rgba(241,228,201,.74));margin-left:8px}'
    + '.km-item p{font-family:var(--sans,Inter,system-ui,sans-serif);font-size:14px;line-height:1.65;color:var(--muted,rgba(241,228,201,.74));margin:6px 0 0}'
    + '.km-vazio{font-family:var(--sans,Inter,system-ui,sans-serif);font-size:13.5px;color:var(--muted,rgba(241,228,201,.74))}'
    + '@media(max-width:640px){.km-coment{padding:0 18px}.km-share a,.km-share button{font-size:12px;padding:8px 11px}}';

  /* ------------------------------------------------------------ ícones SVG */
  var IC = {
    whats: '<svg viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.73 2.64 4.19 3.7.59.26 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29"/></svg>',
    tg:    '<svg viewBox="0 0 24 24"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.86-3.58-2.34 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.54-.61-.19L6.36 12.1l-4.79-1.5c-1.04-.32-1.06-1.04.22-1.54l18.72-7.22c.87-.32 1.63.19 1.35 1.46"/></svg>',
    fb:    '<svg viewBox="0 0 24 24"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94"/></svg>',
    x:     '<svg viewBox="0 0 24 24"><path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.94 21H2.92l7.06-8.07L2.5 3h6.05l4.18 5.52zm-1.06 16.17h1.67L7.6 4.73H5.81z"/></svg>',
    ig:    '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16m0 5.68A4.16 4.16 0 1 0 16.16 12 4.16 4.16 0 0 0 12 7.84m0 6.86A2.7 2.7 0 1 1 14.7 12 2.7 2.7 0 0 1 12 14.7m5.31-7.03a.97.97 0 1 1-.97-.97.97.97 0 0 1 .97.97"/></svg>',
    link:  '<svg viewBox="0 0 24 24"><path d="M10.6 13.4a1 1 0 0 1 0-1.42l1.42-1.41a1 1 0 0 1 1.41 1.41l-1.41 1.42a1 1 0 0 1-1.42 0m3.54-6.37 2.83-2.83a4 4 0 0 1 5.66 5.66l-3.54 3.53a4 4 0 0 1-5.66 0 1 1 0 0 1 1.42-1.41 2 2 0 0 0 2.82 0l3.54-3.54a2 2 0 0 0-2.83-2.83l-2.12 2.12a1 1 0 0 1-1.41-1.41zM9.86 16.97l-2.83 2.83a4 4 0 0 1-5.66-5.66l3.54-3.53a4 4 0 0 1 5.66 0 1 1 0 1 1-1.42 1.41 2 2 0 0 0-2.82 0l-3.54 3.54a2 2 0 0 0 2.83 2.83l2.12-2.12a1 1 0 0 1 1.41 1.41z"/></svg>'
  };

  /* ------------------------------------------------------------------ start */
  function start(p) {
    var st = document.createElement('style'); st.textContent = CSS;
    document.head.appendChild(st);

    var url   = location.origin + '/p/' + encodeURIComponent(p.sku || '');
    var texto = (p.nome || 'KM Interiores') + ' — KM Interiores';
    var eu    = visitante();

    /* ---------- bloco 1: compartilhar + reações (dentro da coluna .info) --- */
    var box = document.createElement('div');
    box.className = 'km-social';
    box.innerHTML = ''
      + '<div class="km-lbl">Compartilhar</div>'
      + '<div class="km-share">'
      +   '<a target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(texto + ' ' + url) + '">' + IC.whats + 'WhatsApp</a>'
      +   '<a target="_blank" rel="noopener" href="https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(texto) + '">' + IC.tg + 'Telegram</a>'
      +   '<a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '">' + IC.fb + 'Facebook</a>'
      +   '<a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(texto) + '">' + IC.x + 'X</a>'
      +   '<button type="button" id="kmIg" title="O Instagram não tem link de compartilhamento na web — copiamos o link para você colar no Story ou na Direct">' + IC.ig + 'Instagram</button>'
      +   '<button type="button" id="kmCopy">' + IC.link + 'Copiar link</button>'
      + '</div>'
      + '<div class="km-reacoes">'
      +   '<button type="button" class="km-react" id="kmLike">♡ <span>Curtir</span> <span class="km-n" id="kmLikeN">0</span></button>'
      +   '<button type="button" class="km-react" id="kmFav">☆ <span id="kmFavT">Favoritar</span></button>'
      + '</div>';

    var ctaRow = document.querySelector('.cta-row');
    if (ctaRow && ctaRow.parentNode) ctaRow.parentNode.insertBefore(box, ctaRow.nextSibling);
    else (document.getElementById('pdp') || document.body).appendChild(box);

    /* copiar link (usado pelo Instagram e pelo "Copiar link") */
    function copiar(btn, okTxt) {
      var antigo = btn.innerHTML;
      function feito() { btn.innerHTML = '✓ ' + okTxt; setTimeout(function () { btn.innerHTML = antigo; }, 2200); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(feito, function () { fallback(); });
      } else fallback();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); feito(); } catch (e) { }
        document.body.removeChild(ta);
      }
    }
    document.getElementById('kmCopy').onclick = function () { copiar(this, 'Link copiado'); };
    document.getElementById('kmIg').onclick   = function () { copiar(this, 'Link copiado — cole no Story'); };

    /* ---------- curtir (público, via RPC) --------------------------------- */
    var bLike = document.getElementById('kmLike'), nLike = document.getElementById('kmLikeN');
    function pintaLike(j) {
      if (!j || !j.ok) return;
      nLike.textContent = j.total || 0;
      bLike.classList.toggle('on', !!j.curtido);
      bLike.firstChild.nodeValue = j.curtido ? '♥ ' : '♡ ';
      bLike.querySelector('span').textContent = j.curtido ? 'Curtido' : 'Curtir';
    }
    rpc('produto_curtida_estado', { p_produto: p.id, p_visitante: eu }).then(pintaLike);
    bLike.onclick = function () {
      bLike.disabled = true;
      rpc('produto_curtir', { p_produto: p.id, p_visitante: eu })
        .then(pintaLike).then(function () { bLike.disabled = false; });
    };

    /* ---------- favoritar (lista pessoal, sem login) ---------------------- */
    var bFav = document.getElementById('kmFav'), tFav = document.getElementById('kmFavT');
    function pintaFav() {
      var on = favoritos().indexOf(p.sku) >= 0;
      bFav.classList.toggle('on', on);
      bFav.firstChild.nodeValue = on ? '★ ' : '☆ ';
      tFav.textContent = on ? 'Nos seus favoritos' : 'Favoritar';
    }
    pintaFav();
    bFav.onclick = function () {
      var f = favoritos(), i = f.indexOf(p.sku);
      if (i >= 0) f.splice(i, 1); else f.push(p.sku);
      salvaFavoritos(f); pintaFav();
    };

    /* ---------- bloco 2: comentários (largura cheia, abaixo da PDP) ------- */
    var sec = document.createElement('section');
    sec.className = 'km-coment';
    sec.innerHTML = ''
      + '<h3>Comentários</h3>'
      + '<div class="km-sub">Conte o que achou desta peça. Os comentários passam por conferência antes de aparecer aqui.</div>'
      + '<div class="km-form">'
      +   '<input id="kmCNome" type="text" maxlength="60" placeholder="Seu nome" autocomplete="name">'
      +   '<textarea id="kmCTxt" maxlength="900" placeholder="Seu comentário sobre esta peça"></textarea>'
      +   '<div class="km-aviso" id="kmCAviso"></div>'
      +   '<button type="button" id="kmCEnv">Enviar comentário</button>'
      + '</div>'
      + '<div class="km-lista" id="kmCLista"><div class="km-vazio">Carregando…</div></div>';

    var pdp = document.getElementById('pdp');
    if (pdp && pdp.parentNode) pdp.parentNode.insertBefore(sec, pdp.nextSibling);
    else document.body.appendChild(sec);

    var lista = document.getElementById('kmCLista');
    function dataBr(s) {
      try { return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
      catch (e) { return ''; }
    }
    function carregaComentarios() {
      sel('produto_comentarios?select=nome,comentario,created_at&produto_id=eq.' + p.id
          + '&aprovado=is.true&order=created_at.desc&limit=50')
        .then(function (arr) {
          if (!arr || !arr.length) {
            lista.innerHTML = '<div class="km-vazio">Ainda não há comentários nesta peça. Seja o primeiro.</div>';
            return;
          }
          lista.innerHTML = arr.map(function (c) {
            return '<div class="km-item"><span class="km-quem">' + esc(c.nome || 'Cliente') + '</span>'
                 + '<span class="km-quando">' + dataBr(c.created_at) + '</span>'
                 + '<p>' + esc(c.comentario) + '</p></div>';
          }).join('');
        });
    }
    carregaComentarios();

    var aviso = document.getElementById('kmCAviso');
    function diz(msg) { aviso.textContent = msg; aviso.style.display = 'block'; }
    document.getElementById('kmCEnv').onclick = function () {
      var btn  = this;
      var nome = (document.getElementById('kmCNome').value || '').trim();
      var txt  = (document.getElementById('kmCTxt').value || '').trim();
      if (nome.length < 2) { diz('Por favor, informe o seu nome.'); return; }
      if (txt.length  < 3) { diz('Escreva o seu comentário.');      return; }
      btn.disabled = true; btn.textContent = 'Enviando…';
      /* aprovado:false é EXIGÊNCIA da política de RLS (pc_insert_publico) —
         o público nunca publica direto; quem aprova é a equipe, no CRM */
      fetch(SB + '/rest/v1/produto_comentarios', {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ produto_id: p.id, nome: nome, comentario: txt, aprovado: false })
      }).then(function (r) {
        btn.disabled = false; btn.textContent = 'Enviar comentário';
        if (r.ok) {
          document.getElementById('kmCNome').value = '';
          document.getElementById('kmCTxt').value  = '';
          diz('Comentário enviado. Ele aparece aqui assim que for conferido pela nossa equipe. Obrigado!');
        } else {
          diz('Não conseguimos enviar agora. Tente novamente em instantes.');
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Enviar comentário';
        diz('Não conseguimos enviar agora. Tente novamente em instantes.');
      });
    };
  }

  /* --------------------------------------------------- descoberta da peça --
     mesmo fallback do script principal do produto.html: sku da URL →
     KM-SOF-MILANO → primeira peça em destaque publicada.                    */
  function boot() {
    var sku = new URLSearchParams(location.search).get('sku') || 'KM-SOF-MILANO';
    sel('produtos?select=id,sku,nome&sku=eq.' + encodeURIComponent(sku) + '&limit=1')
      .then(function (a) {
        if (a && a[0]) return a[0];
        return sel('produtos?select=id,sku,nome&destaque=eq.true&publicar_site=is.true&limit=1')
          .then(function (b) { return b && b[0]; });
      })
      .then(function (p) { if (p && p.id) start(p); })
      .catch(function (e) { console.error('[km-social]', e); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
