/* =============================================================================
   KM Interiores · km-redes.js  —  REDES SOCIAIS OFICIAIS NO RODAPÉ
   -----------------------------------------------------------------------------
   Por que um .js e não HTML colado em cada página:
   são 15+ páginas públicas. Link de rede social muda (troca de perfil, entra um
   canal novo). Colado no HTML, cada mudança vira 15 edições e uma delas fica
   para trás. Aqui é UM lugar só — o array REDES abaixo.

   Onde entra: no rodapé (<footer>) de qualquer página que carregue este arquivo.
   Se a página não tiver <footer>, o bloco é criado no fim do <body>.
   Idempotente: rodar duas vezes não duplica.
   Criado em 06/08/2026.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__kmRedes) return;
  window.__kmRedes = true;

  /* ---- FONTE DA VERDADE — mexer só aqui para trocar/adicionar rede ---- */
  var REDES = [
    { nome: 'Instagram', url: 'https://www.instagram.com/kminteriores.dec/',                 svg: 'ig' },
    { nome: 'YouTube',   url: 'https://www.youtube.com/@tvkminteriores/',                    svg: 'yt' },
    { nome: 'Facebook',  url: 'https://www.facebook.com/profile.php?id=61590476544809',      svg: 'fb' },
    { nome: 'LinkedIn',  url: 'https://www.linkedin.com/in/km-interiores-772015416/',        svg: 'li' },
    { nome: 'Pinterest', url: 'https://br.pinterest.com/kminterioresmarketing/',             svg: 'pi' }
  ];

  var ICONES = {
    ig: '<path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.83-.4.4-.63.8-.83 1.3-.16.4-.35 1-.4 2.1C2.6 9.9 2.6 10.3 2.6 12s0 2.1.07 3.3c.05 1.1.24 1.7.4 2.1.2.5.44.9.83 1.3.4.4.8.63 1.3.83.4.16 1 .35 2.1.4 1.2.07 1.6.07 4.7.07s3.5 0 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.83.4-.4.63-.8.83-1.3.16-.4.35-1 .4-2.1.07-1.2.07-1.6.07-3.3s0-2.1-.07-3.3c-.05-1.1-.24-1.7-.4-2.1-.2-.5-.44-.9-.83-1.3-.4-.4-.8-.63-1.3-.83-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.08a3.18 3.18 0 1 0 0-6.36 3.18 3.18 0 0 0 0 6.36zM18.4 6.9a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z"/>',
    yt: '<path d="M21.6 7.2s-.2-1.4-.8-2c-.75-.8-1.6-.8-2-.85C16 4.2 12 4.2 12 4.2h-.01s-4 0-6.8.2c-.4.05-1.24.05-2 .85-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.5v1.6c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.76.8 1.75.77 2.2.86 1.6.15 6.8.2 6.8.2s4 0 6.8-.21c.4-.05 1.25-.06 2-.86.6-.6.8-2 .8-2s.2-1.65.2-3.3v-1.6c0-1.65-.2-3.3-.2-3.3zM9.95 14.2V8.6l5.15 2.8-5.15 2.8z"/>',
    fb: '<path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.09 0 2.24.19 2.24.19v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z"/>',
    li: '<path d="M6.94 8.9v11.2H3.2V8.9h3.74zM5.07 3.2c1.2 0 2.17.97 2.17 2.17 0 1.2-.97 2.17-2.17 2.17-1.2 0-2.17-.97-2.17-2.17 0-1.2.97-2.17 2.17-2.17zM20.8 20.1h-3.73v-5.45c0-1.3-.02-2.97-1.81-2.97-1.82 0-2.1 1.42-2.1 2.88v5.54H9.44V8.9h3.58v1.53h.05c.5-.94 1.72-1.94 3.53-1.94 3.78 0 4.48 2.49 4.48 5.72v5.89z"/>',
    pi: '<path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2.01.04-2.88.19-.78 1.22-4.97 1.22-4.97s-.31-.62-.31-1.55c0-1.45.84-2.53 1.89-2.53.89 0 1.32.67 1.32 1.47 0 .9-.57 2.24-.87 3.48-.25 1.05.53 1.9 1.56 1.9 1.87 0 3.31-1.97 3.31-4.82 0-2.52-1.81-4.28-4.4-4.28-3 0-4.76 2.25-4.76 4.57 0 .9.35 1.87.78 2.4.09.1.1.19.07.3-.08.32-.25.98-.28 1.12-.04.18-.15.22-.34.13-1.26-.59-2.05-2.43-2.05-3.91 0-3.18 2.31-6.1 6.67-6.1 3.5 0 6.22 2.49 6.22 5.83 0 3.48-2.19 6.28-5.24 6.28-1.02 0-1.98-.53-2.31-1.16l-.63 2.4c-.23.87-.84 1.97-1.25 2.64.94.29 1.94.45 2.98.45 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>'
  };

  var CSS = ''
    + '.km-redes{display:flex;gap:14px;justify-content:center;align-items:center;flex-wrap:wrap;margin:22px 0 6px}'
    + '.km-redes a{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;'
    + 'border:1px solid rgba(203,152,76,.42);border-radius:50%;color:#CB984C;transition:.28s ease;text-decoration:none}'
    + '.km-redes a:hover,.km-redes a:focus-visible{background:#CB984C;color:#14100a;border-color:#CB984C;transform:translateY(-2px)}'
    + '.km-redes a:focus-visible{outline:2px solid #F1E4C9;outline-offset:3px}'
    + '.km-redes svg{width:19px;height:19px;fill:currentColor;display:block}'
    + '.km-redes-tit{text-align:center;font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.6;margin:26px 0 0}'
    + 'html.km-light .km-redes a{border-color:rgba(20,16,10,.3);color:#8a6a22}'
    + 'html.km-light .km-redes a:hover{background:#CB984C;color:#fff}';

  function montar() {
    if (document.querySelector('.km-redes')) return;   // idempotente

    var st = document.createElement('style');
    st.setAttribute('data-km', 'redes');
    st.textContent = CSS;
    document.head.appendChild(st);

    var box = document.createElement('div');
    box.innerHTML =
      '<p class="km-redes-tit">Siga a KM Interiores</p>'
      + '<nav class="km-redes" aria-label="Redes sociais da KM Interiores">'
      + REDES.map(function (r) {
          return '<a href="' + r.url + '" target="_blank" rel="noopener noreferrer me"'
               + ' title="' + r.nome + '" aria-label="KM Interiores no ' + r.nome + '">'
               + '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONES[r.svg] + '</svg>'
               + '</a>';
        }).join('')
      + '</nav>';

    var foot = document.querySelector('footer .wrap') || document.querySelector('footer');
    if (foot) {
      // entra ANTES do crédito da Rede Global, para o crédito continuar sendo a última linha
      var credito = foot.querySelector('p:last-of-type');
      if (credito && /Rede Global/i.test(credito.textContent || '')) foot.insertBefore(box, credito);
      else foot.appendChild(box);
    } else {
      box.style.padding = '30px 16px';
      document.body.appendChild(box);
    }
  }

  // jsdom/DOM já pronto ou não: chamar nos dois casos (a função é idempotente)
  montar();
  document.addEventListener('DOMContentLoaded', montar);
})();
