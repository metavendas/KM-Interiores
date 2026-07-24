/* ===== KM Interiores · Busca do site (lupa) — compartilhada em TODAS as páginas =====
   Clicar na lupa do cabeçalho abre um campo de busca elegante (overlay) que consulta o
   catálogo real (tabela produtos) por nome, categoria ou coleção e leva à peça (produto.html?sku=).
   Fecha no ✕, clicando fora ou com ESC. Enter vai ao 1º resultado.
   Uso: <script defer src="busca.js"></script> antes de </body>. Aditivo/reversível. */
(function () {
  "use strict";
  if (window.__kmSearch) return; window.__kmSearch = true;
  var SB = 'https://hpbtnlfihbwwawgtesvm.supabase.co', KEY = 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
  var box, input, res, tmr, lastq = '';

  var css = ''
    + '#kmSearch{position:fixed;inset:0;z-index:99998;display:none;align-items:flex-start;justify-content:center;'
    + 'background:rgba(8,8,7,.92);backdrop-filter:blur(3px);padding:11vh 20px 20px;box-sizing:border-box;opacity:0;transition:opacity .18s ease}'
    + '#kmSearch.on{display:flex;opacity:1}'
    + '#kmSearch .km-sbox{width:100%;max-width:640px}'
    + '#kmSearch .km-sform{display:flex;align-items:center;gap:12px;border:1px solid #CB984C;background:#14100a;padding:15px 18px;border-radius:4px}'
    + '#kmSearch .km-sform svg{width:22px;height:22px;stroke:#CB984C;flex:0 0 auto}'
    + '#kmSearch input{flex:1;background:transparent;border:none;outline:none;color:#F1E4C9;font-family:Inter,system-ui,sans-serif;font-size:17px;font-weight:300}'
    + '#kmSearch input::placeholder{color:rgba(241,228,201,.5)}'
    + '#kmSearch .km-sx{cursor:pointer;color:rgba(241,228,201,.6);font-size:22px;line-height:1;background:none;border:none;font-family:Arial,sans-serif;padding:0 2px}'
    + '#kmSearch .km-sx:hover{color:#CB984C}'
    + '#kmSearch .km-sres{margin-top:12px;background:#14100a;border:1px solid rgba(203,152,76,.26);border-radius:4px;max-height:56vh;overflow:auto}'
    + '#kmSearch a.km-sitem{display:flex;align-items:center;gap:14px;padding:12px 16px;border-bottom:1px solid rgba(203,152,76,.12);color:#F1E4C9;text-decoration:none}'
    + '#kmSearch a.km-sitem:last-child{border-bottom:none}'
    + '#kmSearch a.km-sitem:hover{background:rgba(203,152,76,.10)}'
    + '#kmSearch .km-sthumb{width:52px;height:52px;object-fit:cover;border-radius:4px;background:#0f0c07;flex:0 0 auto;display:block}'
    + '#kmSearch .km-snome{font-family:"Playfair Display",Georgia,serif;font-size:15px}'
    + '#kmSearch .km-scat{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#9D7D31;margin-top:2px}'
    + '#kmSearch .km-spreco{margin-left:auto;color:#CB984C;font-size:13px;white-space:nowrap;font-family:"Playfair Display",Georgia,serif}'
    + '#kmSearch .km-smsg{padding:16px;color:rgba(241,228,201,.62);font-size:14px;line-height:1.5}';
  var st = document.createElement('style'); st.id = 'km-search-css'; st.textContent = css; document.head.appendChild(st);

  function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }
  function brl(v) { var n = Number(v || 0); if (!n) return ''; try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); } catch (e) { return 'R$ ' + n; } }

  function build() {
    if (box) return;
    box = document.createElement('div'); box.id = 'kmSearch';
    box.innerHTML = '<div class="km-sbox">' +
      '<div class="km-sform"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input id="kmSearchIn" type="search" placeholder="Buscar peças, coleções, categorias…" autocomplete="off" aria-label="Buscar no catálogo">' +
      '<button class="km-sx" id="kmSearchX" type="button" aria-label="Fechar">✕</button></div>' +
      '<div class="km-sres" id="kmSearchRes" style="display:none"></div></div>';
    document.body.appendChild(box);
    input = document.getElementById('kmSearchIn'); res = document.getElementById('kmSearchRes');
    document.getElementById('kmSearchX').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    input.addEventListener('input', function () { schedule(input.value.trim()); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var first = res && res.querySelector('a.km-sitem'); if (first) { location.href = first.getAttribute('href'); } }
    });
  }
  function open() { build(); box.classList.add('on'); document.documentElement.style.overflow = 'hidden'; setTimeout(function () { if (input) input.focus(); }, 60); }
  function close() { if (!box) return; box.classList.remove('on'); document.documentElement.style.overflow = ''; }
  function schedule(q) { clearTimeout(tmr); if (q.length < 2) { res.style.display = 'none'; res.innerHTML = ''; lastq = ''; return; } tmr = setTimeout(function () { run(q); }, 220); }
  function run(q) {
    lastq = q;
    res.style.display = 'block'; res.innerHTML = '<div class="km-smsg">Buscando…</div>';
    var like = encodeURIComponent('%' + q + '%');
    var url = SB + '/rest/v1/produtos?select=sku,nome,categoria,colecao,foto_url,preco&ativo=eq.true&or=(nome.ilike.' + like + ',categoria.ilike.' + like + ',colecao.ilike.' + like + ')&order=destaque.desc.nullslast,nome.asc&limit=12';
    fetch(url, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        if (q !== lastq) return;
        rows = rows || [];
        if (!rows.length) { res.innerHTML = '<div class="km-smsg">Nada encontrado para “' + esc(q) + '”. <a href="catalogo.html" style="color:#CB984C">Ver catálogo completo →</a></div>'; return; }
        res.innerHTML = rows.map(function (p) {
          var thumb = p.foto_url ? '<img class="km-sthumb" src="' + esc(p.foto_url) + '" alt="' + esc(p.nome) + '" loading="lazy">' : '<div class="km-sthumb"></div>';
          return '<a class="km-sitem" href="produto.html?sku=' + encodeURIComponent(p.sku || '') + '">' + thumb +
            '<div><div class="km-snome">' + esc(p.nome) + '</div><div class="km-scat">' + esc(p.categoria || '') + (p.colecao ? ' · ' + esc(p.colecao) : '') + '</div></div>' +
            (p.preco ? '<span class="km-spreco">' + brl(p.preco) + '</span>' : '') + '</a>';
        }).join('');
      }).catch(function () { if (q === lastq) res.innerHTML = '<div class="km-smsg">Não foi possível buscar agora. Tente novamente.</div>'; });
  }
  function wire() {
    var mag = document.querySelector('header .icons svg'); // 1º ícone do cabeçalho = lupa
    if (mag) {
      mag.style.cursor = 'pointer'; mag.setAttribute('role', 'button'); mag.setAttribute('aria-label', 'Buscar');
      mag.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); });
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && box.classList.contains('on')) close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
