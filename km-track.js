/* ===== KM Interiores · km-track.js — instrumentação de tráfego pago =====
   Criado em 26/07/2026 para a campanha de R$ 300 (Meta Ads).

   O que faz, sem quebrar nada do que já existe:
   1) Meta Pixel (Facebook/Instagram) + eventos padrão — só liga se PIXEL_ID estiver preenchido.
   2) Captura e GUARDA as UTMs (+ fbclid/gclid) por 30 dias, com "primeiro toque" preservado.
      É isso que permite saber, no CRM, qual anúncio trouxe cada lead.
   3) Helper window.kmWhats(ctx) — monta o link do WhatsApp já com a origem e o produto,
      e dispara o evento Contact no Pixel.
   4) Helper window.kmUTM() — devolve as UTMs guardadas (usado pelo chat e pelos formulários).

   NÃO cria bolha flutuante: a Concierge fica à DIREITA e o chat ao vivo à ESQUERDA.
   O WhatsApp entra como BOTÃO nas páginas (produto/rodapé) e como saída do chat.

   Uso: <script defer src="km-track.js"></script> antes de </body>. Aditivo e reversível. */
(function () {
  "use strict";
  if (window.__kmTrack) return; window.__kmTrack = true;

  /* ================= CONFIGURE AQUI ================= */
  var CFG = {
    // Cole o ID do Pixel da Meta (Gerenciador de Eventos → Fontes de dados → seu Pixel).
    // Enquanto estiver vazio, o script NÃO carrega o Pixel (nenhum erro, nenhum request).
    PIXEL_ID: '',
    // WhatsApp oficial da KM (somente números, com DDI 55)
    WHATSAPP: '5532999974419',
    // Opcional: ID de métrica do Google Analytics 4 (ex.: 'G-XXXXXXX'). Vazio = desligado.
    GA4_ID: '',
    // Dias que a origem do visitante fica guardada no navegador
    JANELA_DIAS: 30
  };
  /* ================================================== */

  var LS = 'km_atrib_v1';

  /* ---------- 1) UTMs: captura, guarda e devolve ---------- */
  var CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid'];

  function agora() { return new Date().getTime(); }
  function ler() {
    try { var o = JSON.parse(localStorage.getItem(LS) || 'null'); return (o && typeof o === 'object') ? o : null; }
    catch (e) { return null; }
  }
  function gravar(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { } }

  function capturar() {
    var q, novo = {}, tem = false;
    try { q = new URLSearchParams(location.search); } catch (e) { return; }
    CAMPOS.forEach(function (k) { var v = q.get(k); if (v) { novo[k] = String(v).slice(0, 180); tem = true; } });

    var atual = ler();
    var expirado = !atual || !atual.em || (agora() - atual.em) > (CFG.JANELA_DIAS * 86400000);

    if (tem) {
      // Primeiro toque preservado: a primeira campanha que trouxe a pessoa não se perde.
      var primeiro = (atual && !expirado && atual.primeiro) ? atual.primeiro : novo;
      gravar({ primeiro: primeiro, ultimo: novo, em: agora(), lp: location.pathname, ref: document.referrer || '' });
    } else if (expirado) {
      // Sem UTM e sem registro válido: guarda ao menos a origem de referência (orgânico/direto).
      var org = {};
      var r = document.referrer || '';
      if (/instagram\./i.test(r)) org = { utm_source: 'instagram', utm_medium: 'organico' };
      else if (/facebook\.|fb\.com/i.test(r)) org = { utm_source: 'facebook', utm_medium: 'organico' };
      else if (/google\./i.test(r)) org = { utm_source: 'google', utm_medium: 'organico' };
      else if (r) org = { utm_source: 'referencia', utm_medium: 'site', utm_content: r.slice(0, 120) };
      else org = { utm_source: 'direto', utm_medium: 'nenhum' };
      gravar({ primeiro: org, ultimo: org, em: agora(), lp: location.pathname, ref: r });
    }
  }
  capturar();

  // Devolve a atribuição guardada. window.kmUTM() → objeto pronto para mandar ao CRM.
  window.kmUTM = function () {
    var a = ler() || {};
    var p = a.primeiro || {}, u = a.ultimo || {};
    return {
      utm_source: u.utm_source || p.utm_source || '',
      utm_medium: u.utm_medium || p.utm_medium || '',
      utm_campaign: u.utm_campaign || p.utm_campaign || '',
      utm_content: u.utm_content || p.utm_content || '',
      utm_term: u.utm_term || p.utm_term || '',
      fbclid: u.fbclid || p.fbclid || '',
      gclid: u.gclid || p.gclid || '',
      primeiro_source: p.utm_source || '',
      primeiro_campaign: p.utm_campaign || '',
      landing: a.lp || '',
      referrer: a.ref || ''
    };
  };
  // Texto curto de origem, para colar em mensagem/observação (ex.: "meta/cpc · km-catalogo-nucleo")
  window.kmOrigemTxt = function () {
    var u = window.kmUTM();
    var s = [u.utm_source, u.utm_medium].filter(Boolean).join('/');
    return [s, u.utm_campaign, u.utm_content].filter(Boolean).join(' · ');
  };

  /* ---------- 2) Meta Pixel ---------- */
  var pixelOn = false;
  if (CFG.PIXEL_ID) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CFG.PIXEL_ID);
    window.fbq('track', 'PageView');
    pixelOn = true;
  }
  function ev(nome, dados) {
    try { if (pixelOn && window.fbq) window.fbq('track', nome, dados || {}); } catch (e) { }
    try { if (window.gtag) window.gtag('event', nome, dados || {}); } catch (e) { }
  }
  window.kmEvento = ev;

  /* ---------- 3) Google Analytics 4 (opcional) ---------- */
  if (CFG.GA4_ID) {
    var g = document.createElement('script'); g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.GA4_ID; document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', CFG.GA4_ID);
  }

  /* ---------- 4) WhatsApp com contexto + origem ---------- */
  // ctx: {produto, sku, preco, assunto}
  window.kmWhatsUrl = function (ctx) {
    ctx = ctx || {};
    var linhas = ['Olá! Vim pelo site da KM Interiores.'];
    if (ctx.produto) linhas.push('Tenho interesse na peça: ' + ctx.produto + (ctx.sku ? ' (' + ctx.sku + ')' : ''));
    else if (ctx.assunto) linhas.push(ctx.assunto);
    if (ctx.preco) linhas.push('Valor exibido: ' + ctx.preco);
    if (ctx.url !== false) linhas.push(location.href.split('#')[0]);
    var org = window.kmOrigemTxt();
    if (org && org !== 'direto/nenhum') linhas.push('[origem: ' + org + ']');
    return 'https://wa.me/' + CFG.WHATSAPP + '?text=' + encodeURIComponent(linhas.join('\n'));
  };
  window.kmWhats = function (ctx) {
    ev('Contact', { content_name: (ctx && ctx.produto) || 'WhatsApp', source: 'site' });
    window.open(window.kmWhatsUrl(ctx), '_blank', 'noopener');
  };
  window.kmWhatsNumero = CFG.WHATSAPP;

  /* ---------- 5) Eventos automáticos por página ---------- */
  function auto() {
    var p = (location.pathname || '').toLowerCase();

    // Página de produto → ViewContent (espera o catálogo carregar o nome)
    if (/produto\.html/.test(p)) {
      var t = 0, iv = setInterval(function () {
        var nome = (document.getElementById('nome') || {}).textContent || '';
        if (nome && nome !== '—') {
          clearInterval(iv);
          var preco = (document.getElementById('price') || {}).textContent || '';
          var sku = ''; try { sku = new URLSearchParams(location.search).get('sku') || ''; } catch (e) { }
          ev('ViewContent', { content_name: nome, content_ids: [sku], content_type: 'product', currency: 'BRL' });
        }
        if (++t > 40) clearInterval(iv);
      }, 250);
    }
    if (/carrinho\.html/.test(p)) ev('InitiateCheckout', { currency: 'BRL' });
    if (/curadoria\.html/.test(p)) ev('Lead', { content_name: 'Curadoria' });
    if (/catalogo\.html/.test(p)) ev('ViewContent', { content_type: 'product_group', content_name: 'Catálogo' });

    // Qualquer clique em "+ Carrinho" / "Adicionar ao carrinho" → AddToCart
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('.addbtn, #cta1, [data-km-wa]') : null;
      if (!el) return;
      if (el.hasAttribute && el.hasAttribute('data-km-wa')) return; // tratado no próprio botão
      var txt = (el.textContent || '').toLowerCase();
      if (/carrinho/.test(txt)) ev('AddToCart', { currency: 'BRL', content_name: el.getAttribute('data-nome') || (document.getElementById('nome') || {}).textContent || '' });
      else if (/curadoria/.test(txt)) ev('Lead', { content_name: 'Solicitar curadoria' });
    }, true);

    // Botões marcados com data-km-wa abrem o WhatsApp com contexto
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-km-wa]') : null;
      if (!b) return;
      e.preventDefault();
      window.kmWhats({
        produto: b.getAttribute('data-wa-produto') || '',
        sku: b.getAttribute('data-wa-sku') || '',
        preco: b.getAttribute('data-wa-preco') || '',
        assunto: b.getAttribute('data-wa-assunto') || ''
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
