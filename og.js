/* =============================================================================
   KM Interiores · /api/og  —  PREVIEW CORRETO DO LINK DO PRODUTO
   -----------------------------------------------------------------------------
   O PROBLEMA (06/08/2026)
   Ao colar https://www.kminteriores.com.br/produto.html?sku=XXX no WhatsApp,
   o preview mostrava sempre a mesma imagem genérica (og-image.jpg) e o título
   "Mobiliário Autoral · KM Interiores" — nunca o produto.

   A CAUSA
   produto.html é uma página estática: o produto só é buscado DEPOIS, por
   JavaScript. O robô do WhatsApp/Facebook NÃO executa JavaScript — ele lê o
   HTML cru e leva as meta tags og:* fixas que estão lá.

   A SOLUÇÃO
   Quando quem pede a página é um robô de preview (WhatsApp, Facebook, Telegram,
   LinkedIn, Google...), o vercel.json manda a requisição para cá. Aqui o SKU é
   consultado no Supabase e devolvemos um HTML pequeno já com a foto, o nome e o
   preço do produto nas meta tags. Pessoa de verdade continua recebendo o
   produto.html normal, intacto — nada do site foi alterado.
   ========================================================================== */

const SB   = 'https://hpbtnlfihbwwawgtesvm.supabase.co';
const ANON = 'sb_publishable_zhEVk-8dxOCc8Hq5BuIZkA_fR_8gbOE';
const SITE = 'https://www.kminteriores.com.br';
const FALLBACK_IMG = SITE + '/og-image.jpg';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function money(n) {
  const v = Number(n);
  if (!v || v <= 0) return '';
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Só imagem https absoluta serve para preview. Qualquer outra coisa cai no fallback. */
function imagemValida(url) {
  if (!url) return null;
  const u = String(url).trim();
  if (!/^https:\/\//i.test(u)) return null;
  return u;
}

async function buscarProduto(sku) {
  const q = SB + '/rest/v1/produtos'
    + '?select=sku,nome,categoria,colecao,material,dimensoes,descricao,foto_url,fotos_extra,preco,disponibilidade'
    + '&sku=eq.' + encodeURIComponent(sku)
    + '&ativo=eq.true&limit=1';
  const r = await fetch(q, {
    headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, Accept: 'application/json' }
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return (Array.isArray(rows) && rows[0]) ? rows[0] : null;
}

module.exports = async function handler(req, res) {
  let sku = '';
  try {
    const u = new URL(req.url, SITE);
    sku = (u.searchParams.get('sku') || '').trim();
  } catch (e) { /* segue com sku vazio */ }

  let p = null;
  if (sku) {
    try { p = await buscarProduto(sku); } catch (e) { p = null; }
  }

  const destino = SITE + '/produto.html' + (sku ? ('?sku=' + encodeURIComponent(sku)) : '');

  let titulo, descricao, imagem;

  if (p) {
    const preco = money(p.preco);
    titulo = (p.nome || 'Peça autoral') + ' · KM Interiores';

    const partes = [];
    if (p.categoria) partes.push(p.categoria);
    if (p.colecao)   partes.push('Coleção ' + p.colecao);
    if (p.material)  partes.push(p.material);
    if (p.dimensoes) partes.push(p.dimensoes);
    if (preco)       partes.push(preco);

    let base = partes.join(' · ');
    const txt = (p.descricao || '').replace(/\s+/g, ' ').trim();
    if (txt) base = base ? (base + ' — ' + txt) : txt;
    if (!base) base = 'Mobiliário autoral de alto luxo, com acabamentos nobres e personalização sob medida.';
    descricao = base.length > 280 ? (base.slice(0, 277) + '…') : base;

    // foto principal; se não servir, tenta a 1ª das fotos extras; senão, fallback da marca
    imagem = imagemValida(p.foto_url);
    if (!imagem && Array.isArray(p.fotos_extra)) {
      for (const f of p.fotos_extra) { const v = imagemValida(f); if (v) { imagem = v; break; } }
    }
    if (!imagem) imagem = FALLBACK_IMG;
  } else {
    titulo = 'Mobiliário Autoral · KM Interiores';
    descricao = 'Peças autorais de mobiliário de alto luxo. Solicite a curadoria e leve a peça certa para o seu ambiente de alto padrão.';
    imagem = FALLBACK_IMG;
  }

  const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + esc(titulo) + '</title>'
    + '<meta name="description" content="' + esc(descricao) + '">'
    + '<link rel="canonical" href="' + esc(destino) + '">'
    + '<meta property="og:type" content="product">'
    + '<meta property="og:site_name" content="KM Interiores">'
    + '<meta property="og:locale" content="pt_BR">'
    + '<meta property="og:title" content="' + esc(titulo) + '">'
    + '<meta property="og:description" content="' + esc(descricao) + '">'
    + '<meta property="og:url" content="' + esc(destino) + '">'
    + '<meta property="og:image" content="' + esc(imagem) + '">'
    + '<meta property="og:image:secure_url" content="' + esc(imagem) + '">'
    + '<meta property="og:image:alt" content="' + esc(p ? (p.nome || 'Peça KM Interiores') : 'KM Interiores') + '">'
    /* 06/08 — NÃO declarar og:image:width/height: a foto do produto raramente é
       1200x630. Dimensão declarada que não bate faz o WhatsApp descartar a imagem
       e cair no ícone pequeno (ou em nada). Sem declarar, ele mede sozinho. */
    + (p && Number(p.preco) > 0
        ? '<meta property="product:price:amount" content="' + Number(p.preco).toFixed(2) + '">'
          + '<meta property="product:price:currency" content="BRL">'
          + '<meta property="product:availability" content="in stock">'
        : '')
    + '<meta name="twitter:card" content="summary_large_image">'
    + '<meta name="twitter:title" content="' + esc(titulo) + '">'
    + '<meta name="twitter:description" content="' + esc(descricao) + '">'
    + '<meta name="twitter:image" content="' + esc(imagem) + '">'
    /* 06/08 — NADA de <meta http-equiv="refresh"> aqui. O robô do Facebook/WhatsApp
       SEGUE o refresh, chega no produto.html estático e volta a ler as meta tags
       genéricas — desfazendo tudo o que esta função fez. O redirecionamento da
       pessoa é feito só por JavaScript (que o robô não executa) + link clicável. */
    + '</head><body>'
    + '<p>Redirecionando para <a href="' + esc(destino) + '">' + esc(titulo) + '</a>…</p>'
    + '<script>location.replace(' + JSON.stringify(destino) + ');<\/script>'
    + '</body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 10 min no CDN: preview atualiza rápido depois que a foto muda no CRM.
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  /* Cloudflare/CDN na frente: sem Vary, a resposta guardada para uma PESSOA pode
     ser entregue ao robô (e vice-versa). O desvio depende do user-agent. */
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('X-KM-OG', p ? 'produto' : 'fallback');
  res.status(200).send(html);
};
