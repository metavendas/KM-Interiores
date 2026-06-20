/* ===== KM Interiores · Concierge de IA do site =====
   Widget de chat flutuante, on-brand (ébano + dourado).
   Conversa via Edge Function assistente-site (Groq) e captura leads no CRM.
   Uso: <script defer src="assistente.js"></script> antes de </body>.
*/
(function () {
  "use strict";
  var API = "https://hpbtnlfihbwwawgtesvm.supabase.co/functions/v1/assistente-site";
  if (window.__kmConcierge) return; window.__kmConcierge = true;

  var historico = [];           // {role, content}
  var aberto = false;
  var enviando = false;

  // ---------- estilos ----------
  var css = ''
  + '.kmc-launch{position:fixed;right:22px;bottom:22px;z-index:99998;display:flex;align-items:center;gap:10px;'
  + 'background:linear-gradient(135deg,#CB984C,#9D7D31);color:#0d0b08;border:none;cursor:pointer;'
  + 'padding:13px 18px;border-radius:40px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;'
  + 'letter-spacing:.04em;box-shadow:0 10px 30px rgba(0,0,0,.4);transition:.25s}'
  + '.kmc-launch:hover{transform:translateY(-2px);box-shadow:0 14px 38px rgba(203,152,76,.4)}'
  + '.kmc-launch svg{width:20px;height:20px}'
  + '.kmc-panel{position:fixed;right:22px;bottom:22px;z-index:99999;width:370px;max-width:calc(100vw - 28px);'
  + 'height:560px;max-height:calc(100vh - 40px);background:#0f0e0c;border:1px solid rgba(203,152,76,.28);'
  + 'border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:none;flex-direction:column;overflow:hidden;'
  + 'font-family:Inter,system-ui,sans-serif}'
  + '.kmc-panel.kmc-on{display:flex}'
  + '.kmc-head{display:flex;align-items:center;gap:11px;padding:16px 18px;background:linear-gradient(135deg,#1b160d,#14100a);'
  + 'border-bottom:1px solid rgba(203,152,76,.2)}'
  + '.kmc-mark{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#CB984C,#9D7D31);'
  + 'display:flex;align-items:center;justify-content:center;color:#0d0b08;font-family:Georgia,serif;font-weight:700;font-size:15px}'
  + '.kmc-ht{flex:1;min-width:0}'
  + '.kmc-ht b{display:block;font-family:Georgia,"Playfair Display",serif;color:#F1E4C9;font-size:15px;font-weight:600;letter-spacing:.02em}'
  + '.kmc-ht span{font-size:11px;color:rgba(241,228,201,.6);letter-spacing:.05em}'
  + '.kmc-x{background:none;border:none;color:rgba(241,228,201,.6);font-size:20px;cursor:pointer;line-height:1;padding:4px}'
  + '.kmc-x:hover{color:#CB984C}'
  + '.kmc-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:12px;background:'
  + 'radial-gradient(90% 60% at 90% 0%,rgba(203,152,76,.06),transparent 60%),#0f0e0c}'
  + '.kmc-body::-webkit-scrollbar{width:7px}.kmc-body::-webkit-scrollbar-thumb{background:rgba(203,152,76,.3);border-radius:4px}'
  + '.kmc-msg{max-width:84%;padding:11px 14px;font-size:13.5px;line-height:1.55;border-radius:12px;white-space:pre-wrap;word-break:break-word}'
  + '.kmc-bot{align-self:flex-start;background:#15130f;border:1px solid rgba(203,152,76,.16);color:#F1E9D2;border-bottom-left-radius:3px}'
  + '.kmc-user{align-self:flex-end;background:linear-gradient(135deg,#CB984C,#9D7D31);color:#0d0b08;border-bottom-right-radius:3px;font-weight:500}'
  + '.kmc-typing{align-self:flex-start;color:rgba(241,228,201,.5);font-size:13px;font-style:italic;padding:6px 4px}'
  + '.kmc-quick{display:flex;flex-wrap:wrap;gap:7px;margin-top:2px}'
  + '.kmc-quick button{background:transparent;border:1px solid rgba(203,152,76,.35);color:#CB984C;font-size:11.5px;'
  + 'padding:6px 11px;border-radius:20px;cursor:pointer;transition:.2s;font-family:inherit}'
  + '.kmc-quick button:hover{background:rgba(203,152,76,.12)}'
  + '.kmc-foot{border-top:1px solid rgba(203,152,76,.18);padding:12px;background:#0d0b08}'
  + '.kmc-inrow{display:flex;gap:8px;align-items:flex-end}'
  + '.kmc-in{flex:1;background:#15130f;border:1px solid rgba(203,152,76,.22);color:#F1E9D2;border-radius:9px;'
  + 'padding:10px 12px;font-family:inherit;font-size:13.5px;resize:none;max-height:90px;outline:none}'
  + '.kmc-in:focus{border-color:#CB984C}'
  + '.kmc-send{background:linear-gradient(135deg,#CB984C,#9D7D31);border:none;color:#0d0b08;width:40px;height:40px;'
  + 'border-radius:9px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center}'
  + '.kmc-send:disabled{opacity:.5;cursor:default}.kmc-send svg{width:18px;height:18px}'
  + '.kmc-cta{margin-top:9px;text-align:center;font-size:11.5px;color:rgba(241,228,201,.55)}'
  + '.kmc-cta a{color:#CB984C;cursor:pointer;text-decoration:underline}'
  + '.kmc-lead{display:none;flex-direction:column;gap:8px;margin-top:10px;padding:12px;background:#15130f;'
  + 'border:1px solid rgba(203,152,76,.2);border-radius:10px}'
  + '.kmc-lead.kmc-on{display:flex}'
  + '.kmc-lead input{background:#0d0b08;border:1px solid rgba(203,152,76,.22);color:#F1E9D2;border-radius:7px;'
  + 'padding:9px 11px;font-family:inherit;font-size:13px;outline:none}.kmc-lead input:focus{border-color:#CB984C}'
  + '.kmc-lead .kmc-go{background:linear-gradient(135deg,#CB984C,#9D7D31);border:none;color:#0d0b08;font-weight:600;'
  + 'padding:10px;border-radius:7px;cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:.06em;text-transform:uppercase}'
  + '.kmc-note{font-size:11px;text-align:center;padding:8px;color:rgba(241,228,201,.4)}'
  + '@media(max-width:480px){.kmc-panel{right:8px;bottom:8px;width:calc(100vw - 16px);height:calc(100vh - 24px)}.kmc-launch span{display:none}}';

  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  // ---------- launcher ----------
  var launch = document.createElement("button");
  launch.className = "kmc-launch"; launch.setAttribute("aria-label", "Falar com a concierge KM");
  launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg><span>Concierge KM</span>';
  document.body.appendChild(launch);

  // ---------- painel ----------
  var panel = document.createElement("div"); panel.className = "kmc-panel"; panel.setAttribute("role", "dialog");
  panel.innerHTML = ''
  + '<div class="kmc-head"><div class="kmc-mark">KM</div>'
  + '<div class="kmc-ht"><b>Concierge KM</b><span>Curadoria de alto luxo</span></div>'
  + '<button class="kmc-x" aria-label="Fechar">&times;</button></div>'
  + '<div class="kmc-body" id="kmcBody"></div>'
  + '<div class="kmc-foot">'
  + '<div class="kmc-inrow"><textarea class="kmc-in" id="kmcIn" rows="1" placeholder="Escreva sua mensagem..."></textarea>'
  + '<button class="kmc-send" id="kmcSend" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg></button></div>'
  + '<div class="kmc-cta">Prefere falar com um especialista? <a id="kmcLeadToggle">Deixe seu contato</a></div>'
  + '<div class="kmc-lead" id="kmcLead">'
  + '<input id="kmcNome" placeholder="Seu nome" autocomplete="name">'
  + '<input id="kmcFone" placeholder="WhatsApp (com DDD)" inputmode="tel" autocomplete="tel">'
  + '<button class="kmc-go" id="kmcLeadGo">Solicitar curadoria</button>'
  + '</div></div>';
  document.body.appendChild(panel);

  var body = panel.querySelector("#kmcBody");
  var input = panel.querySelector("#kmcIn");
  var sendBtn = panel.querySelector("#kmcSend");

  function scrollBottom() { body.scrollTop = body.scrollHeight; }
  function addMsg(texto, who) {
    var d = document.createElement("div");
    d.className = "kmc-msg " + (who === "user" ? "kmc-user" : "kmc-bot");
    d.textContent = texto; body.appendChild(d); scrollBottom(); return d;
  }
  function addQuick(opcoes, handler) {
    var w = document.createElement("div"); w.className = "kmc-quick";
    opcoes.forEach(function (o) {
      var label = (o && typeof o === "object") ? o.label : o;
      var b = document.createElement("button"); b.textContent = label;
      b.onclick = function () { w.remove(); (handler || enviar)(o); };
      w.appendChild(b);
    });
    body.appendChild(w); scrollBottom();
  }
  function api(payload) {
    return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(function (r) { return r.json(); });
  }
  function addLink(texto, url) {
    var d = document.createElement("div"); d.className = "kmc-msg kmc-bot";
    var a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.style.color = "#CB984C"; a.style.textDecoration = "underline"; a.textContent = texto;
    d.appendChild(a); body.appendChild(d); scrollBottom();
  }
  function roteiro(o) {
    var label = (o && typeof o === "object") ? o.label : o;
    if (label === "Quero conhecer os móveis") { addMsg(label, "user"); mostrarCategorias(); return; }
    if (label === "Falar com um especialista") { addMsg(label, "user"); addMsg("Com prazer. Deixe seu nome e WhatsApp abaixo e um especialista da KM falará com você em breve.", "bot"); mostrarLead(); return; }
    enviar(label);
  }
  function mostrarCategorias() {
    var carregando = addMsg("Apresentando nossas coleções…", "bot");
    api({ acao: "catalogo" }).then(function (j) {
      carregando.remove();
      var cats = (j && j.categorias) || [];
      if (!cats.length) { addMsg("No momento estamos atualizando o catálogo. Posso conduzir uma curadoria — deseja deixar seu contato?", "bot"); mostrarLead(); return; }
      addMsg("Com prazer. Estas são as nossas coleções de mobiliário — selecione uma para conhecer as peças:", "bot");
      addQuick(cats.map(function (c) { return { label: c.categoria + " (" + c.total + ")", categoria: c.categoria }; }), function (o) { mostrarPecas(o.categoria); });
    }).catch(function () { carregando.remove(); addMsg("Tive uma instabilidade ao carregar o catálogo. Se preferir, deixe seu contato que um especialista o apresentará.", "bot"); mostrarLead(); });
  }
  function mostrarPecas(categoria) {
    addMsg(categoria, "user");
    var carregando = addMsg("Reunindo as peças de " + categoria + "…", "bot");
    api({ acao: "catalogo", categoria: categoria }).then(function (j) {
      carregando.remove();
      var pecas = (j && j.pecas) || [];
      if (!pecas.length) { addMsg("Esta coleção está em curadoria. Posso conduzir uma seleção sob medida — deseja deixar seu contato?", "bot"); mostrarLead(); return; }
      var nomes = pecas.map(function (p) { return "•  " + p.nome; }).join("\n");
      addMsg("Em " + categoria + ", algumas de nossas peças:\n" + nomes + "\n\nOs acabamentos são sob medida e o valor é apresentado em proposta exclusiva.", "bot");
      addLink("Ver a coleção completa no catálogo →", "catalogo.html");
      addQuick(["Solicitar curadoria", "Ver outra categoria"], function (o) {
        var label = (o && typeof o === "object") ? o.label : o;
        if (label === "Ver outra categoria") mostrarCategorias();
        else { addMsg(label, "user"); addMsg("Perfeito. Deixe seu nome e WhatsApp e um especialista conduzirá sua curadoria.", "bot"); mostrarLead(); }
      });
    }).catch(function () { carregando.remove(); addMsg("Tive uma instabilidade. Se preferir, deixe seu contato que um especialista o apresentará.", "bot"); mostrarLead(); });
  }

  var saudou = false;
  function saudar() {
    if (saudou) return; saudou = true;
    addMsg("É uma satisfação recebê-lo na KM Interiores. Sou a concierge da casa e posso conduzir sua curadoria — móveis de luxo, locação premium ou impressão 3D de decoração. Em que posso ajudá-lo?", "bot");
    addQuick(["Quero conhecer os móveis", "Locação para evento", "Impressão 3D personalizada", "Falar com um especialista"], roteiro);
  }

  function abrir() { panel.classList.add("kmc-on"); launch.style.display = "none"; aberto = true; saudar(); setTimeout(function(){ input.focus(); }, 100); }
  function fechar() { panel.classList.remove("kmc-on"); launch.style.display = "flex"; aberto = false; }

  launch.onclick = abrir;
  panel.querySelector(".kmc-x").onclick = fechar;

  input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 90) + "px"; });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } });
  sendBtn.onclick = function () { enviar(); };

  function enviar(texto) {
    texto = (texto != null ? texto : input.value).trim();
    if (!texto || enviando) return;
    if (texto === input.value.trim()) { input.value = ""; input.style.height = "auto"; }
    addMsg(texto, "user");
    historico.push({ role: "user", content: texto });
    if (/especialista|atend|contato|humano|vendedor/i.test(texto)) { mostrarLead(); }
    enviando = true; sendBtn.disabled = true;
    var typing = document.createElement("div"); typing.className = "kmc-typing"; typing.textContent = "A concierge está escrevendo…";
    body.appendChild(typing); scrollBottom();
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensagem: texto, historico: historico.slice(0, -1) }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        typing.remove();
        var resp = (j && j.resposta) ? j.resposta : "Peço desculpas, tive uma instabilidade. Poderia repetir, por gentileza?";
        addMsg(resp, "bot");
        historico.push({ role: "assistant", content: resp });
      })
      .catch(function () { typing.remove(); addMsg("Estamos com uma instabilidade momentânea. Se preferir, deixe seu contato que um especialista falará com você.", "bot"); mostrarLead(); })
      .finally(function () { enviando = false; sendBtn.disabled = false; });
  }

  // ---------- captura de lead ----------
  var leadBox = panel.querySelector("#kmcLead");
  function mostrarLead() { leadBox.classList.add("kmc-on"); }
  panel.querySelector("#kmcLeadToggle").onclick = function () { leadBox.classList.toggle("kmc-on"); };
  panel.querySelector("#kmcLeadGo").onclick = function () {
    var nome = panel.querySelector("#kmcNome").value.trim();
    var fone = panel.querySelector("#kmcFone").value.trim();
    if (!nome || !fone) { addMsg("Por gentileza, informe seu nome e WhatsApp para que um especialista entre em contato.", "bot"); return; }
    var resumo = historico.filter(function (m) { return m.role === "user"; }).map(function (m) { return m.content; }).slice(-3).join(" | ");
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "lead", nome: nome, telefone: fone, mensagem: resumo, interesse: "site-chat" }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        leadBox.classList.remove("kmc-on");
        if (j && j.ok) addMsg("Obrigada, " + nome.split(" ")[0] + ". Seu contato foi registrado e um especialista da KM Interiores falará com você em breve. Será uma honra conduzir sua curadoria.", "bot");
        else addMsg("Não consegui registrar agora. Se preferir, fale conosco pelo Instagram @kminteriores.", "bot");
      })
      .catch(function () { addMsg("Não consegui registrar agora. Se preferir, fale conosco pelo Instagram @kminteriores.", "bot"); });
  };
})();
