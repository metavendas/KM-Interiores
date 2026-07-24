/* ===== KM Interiores · Chat de Atendimento ao Vivo (site) =====
   Widget flutuante para o cliente falar AO VIVO com a equipe (canto INFERIOR ESQUERDO,
   para não colidir com a Concierge de IA, que fica à direita). Fala via Edge Function
   chat-atendimento (cliente anônimo, validado por visitante_key). Opção de OUVIR (TTS).
   Uso: <script defer src="chat-widget.js"></script> antes de </body>.
   Mobile: launcher só-ícone + painel em tela cheia. Aditivo/reversível. */
(function () {
  "use strict";
  if (window.__kmChatVivo) return; window.__kmChatVivo = true;
  var FN = "https://hpbtnlfihbwwawgtesvm.supabase.co/functions/v1/chat-atendimento";
  var VK_KEY = "km_chat_vk", CID_KEY = "km_chat_cid", SEEN_KEY = "km_chat_seen";

  // horário de atendimento: Seg–Sex 9–19 · Sáb 9–13 (America/Sao_Paulo ~ -3)
  function noHorario() {
    try { var d = new Date(); var dia = d.getDay(), h = d.getHours();
      if (dia >= 1 && dia <= 5) return h >= 9 && h < 19;
      if (dia === 6) return h >= 9 && h < 13; return false;
    } catch (e) { return true; }
  }
  function vk() { var v = localStorage.getItem(VK_KEY); if (!v) { v = "vk_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(VK_KEY, v); } return v; }
  function cid() { return localStorage.getItem(CID_KEY) || ""; }
  function setCid(v) { localStorage.setItem(CID_KEY, v); }

  var css = ''
  + '.kmv-launch{position:fixed;left:22px;bottom:22px;z-index:99990;display:flex;align-items:center;gap:9px;'
  + 'background:#15130f;color:#F1E4C9;border:1px solid rgba(203,152,76,.5);cursor:pointer;padding:12px 17px;'
  + 'border-radius:40px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:.03em;'
  + 'box-shadow:0 10px 30px rgba(0,0,0,.4);transition:.25s}'
  + '.kmv-launch:hover{transform:translateY(-2px);border-color:#CB984C}'
  + '.kmv-launch svg{width:19px;height:19px;stroke:#CB984C}'
  + '.kmv-live{width:8px;height:8px;border-radius:50%;background:#7fbf6a;box-shadow:0 0 0 0 rgba(127,191,106,.7);animation:kmvpulse 2s infinite}'
  + '@keyframes kmvpulse{0%{box-shadow:0 0 0 0 rgba(127,191,106,.6)}70%{box-shadow:0 0 0 7px rgba(127,191,106,0)}100%{box-shadow:0 0 0 0 rgba(127,191,106,0)}}'
  + '.kmv-badge{position:absolute;top:-6px;right:-6px;background:#b3331f;color:#fff;font-size:10px;min-width:17px;height:17px;'
  + 'border-radius:9px;display:none;align-items:center;justify-content:center;font-weight:700;padding:0 4px}'
  + '.kmv-panel{position:fixed;left:22px;bottom:22px;z-index:99991;width:360px;max-width:calc(100vw - 28px);height:540px;'
  + 'max-height:calc(100vh - 40px);background:#0f0e0c;border:1px solid rgba(203,152,76,.28);border-radius:14px;'
  + 'box-shadow:0 30px 80px rgba(0,0,0,.6);display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif}'
  + '.kmv-panel.kmv-on{display:flex}'
  + '.kmv-head{display:flex;align-items:center;gap:11px;padding:15px 17px;background:linear-gradient(135deg,#1b160d,#14100a);border-bottom:1px solid rgba(203,152,76,.2)}'
  + '.kmv-mark{width:34px;height:34px;border-radius:50%;background:#15130f;border:1px solid rgba(203,152,76,.5);display:flex;align-items:center;justify-content:center}'
  + '.kmv-mark svg{width:18px;height:18px;stroke:#CB984C}'
  + '.kmv-ht{flex:1;min-width:0}.kmv-ht b{display:block;font-family:Georgia,serif;color:#F1E4C9;font-size:14.5px}'
  + '.kmv-ht span{font-size:11px;color:rgba(241,228,201,.6);display:flex;align-items:center;gap:6px}'
  + '.kmv-x{background:none;border:none;color:rgba(241,228,201,.6);font-size:20px;cursor:pointer;line-height:1;padding:4px}.kmv-x:hover{color:#CB984C}'
  + '.kmv-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#0f0e0c}'
  + '.kmv-body::-webkit-scrollbar{width:7px}.kmv-body::-webkit-scrollbar-thumb{background:rgba(203,152,76,.3);border-radius:4px}'
  + '.kmv-row{display:flex;flex-direction:column;max-width:85%}.kmv-row.eu{align-self:flex-end}.kmv-row.eles{align-self:flex-start}'
  + '.kmv-msg{padding:10px 13px;font-size:13.5px;line-height:1.5;border-radius:12px;white-space:pre-wrap;word-break:break-word}'
  + '.kmv-row.eles .kmv-msg{background:#15130f;border:1px solid rgba(203,152,76,.16);color:#F1E9D2;border-bottom-left-radius:3px}'
  + '.kmv-row.eu .kmv-msg{background:linear-gradient(135deg,#CB984C,#9D7D31);color:#0d0b08;border-bottom-right-radius:3px;font-weight:500}'
  + '.kmv-tools{display:flex;gap:8px;align-items:center;margin-top:3px}.kmv-row.eu .kmv-tools{justify-content:flex-end}'
  + '.kmv-hear{background:none;border:none;cursor:pointer;color:rgba(241,228,201,.5);font-size:11px;display:inline-flex;align-items:center;gap:4px;padding:2px}'
  + '.kmv-hear:hover{color:#CB984C}.kmv-hear svg{width:13px;height:13px}'
  + '.kmv-note{font-size:11.5px;color:rgba(241,228,201,.5);text-align:center;padding:6px 10px;line-height:1.5}'
  + '.kmv-foot{border-top:1px solid rgba(203,152,76,.18);padding:11px;background:#0d0b08}'
  + '.kmv-inrow{display:flex;gap:8px;align-items:flex-end}'
  + '.kmv-in{flex:1;background:#15130f;border:1px solid rgba(203,152,76,.22);color:#F1E9D2;border-radius:9px;padding:10px 12px;font-family:inherit;font-size:13.5px;resize:none;max-height:90px;outline:none}'
  + '.kmv-in:focus{border-color:#CB984C}'
  + '.kmv-send{background:linear-gradient(135deg,#CB984C,#9D7D31);border:none;color:#0d0b08;width:40px;height:40px;border-radius:9px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center}'
  + '.kmv-send:disabled{opacity:.5;cursor:default}.kmv-send svg{width:18px;height:18px}'
  + '.kmv-name{display:flex;gap:8px;margin-bottom:8px}.kmv-name input{flex:1;background:#15130f;border:1px solid rgba(203,152,76,.22);color:#F1E9D2;border-radius:8px;padding:9px 11px;font-family:inherit;font-size:13px;outline:none}.kmv-name input:focus{border-color:#CB984C}'
  + '@media(max-width:480px){.kmv-panel{left:8px;bottom:8px;width:calc(100vw - 16px);height:calc(100vh - 24px)}.kmv-launch span{display:none}.kmv-launch{padding:13px;gap:0}}';
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  var ICON_HEAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/><path d="M20 14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/><path d="M20 18a5 5 0 0 1-5 4h-3"/></svg>';
  var ICON_HEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';

  var launch = document.createElement("button");
  launch.className = "kmv-launch"; launch.setAttribute("aria-label", "Atendimento ao vivo com a equipe KM");
  launch.innerHTML = '<span class="kmv-live" style="flex:0 0 auto"></span>' + ICON_HEAD + '<span>Atendimento ao vivo</span><span class="kmv-badge" id="kmvBadge">1</span>';
  launch.style.position = "fixed"; document.body.appendChild(launch);

  var panel = document.createElement("div"); panel.className = "kmv-panel"; panel.setAttribute("role", "dialog");
  panel.innerHTML = ''
  + '<div class="kmv-head"><div class="kmv-mark">' + ICON_HEAD + '</div>'
  + '<div class="kmv-ht"><b>Atendimento ao vivo</b><span><span class="kmv-live"></span> Equipe KM Interiores</span></div>'
  + '<button class="kmv-x" aria-label="Fechar">&times;</button></div>'
  + '<div class="kmv-body" id="kmvBody"></div>'
  + '<div class="kmv-foot">'
  + '<div class="kmv-name" id="kmvNameRow"><input id="kmvNome" placeholder="Seu nome (opcional)" autocomplete="name"></div>'
  + '<div class="kmv-inrow"><textarea class="kmv-in" id="kmvIn" rows="1" placeholder="Escreva para a equipe..."></textarea>'
  + '<button class="kmv-send" id="kmvSend" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg></button></div>'
  + '</div>';
  document.body.appendChild(panel);

  var body = panel.querySelector("#kmvBody");
  var input = panel.querySelector("#kmvIn");
  var sendBtn = panel.querySelector("#kmvSend");
  var nameRow = panel.querySelector("#kmvNameRow");
  var aberto = false, enviando = false, pollTimer = null, bgTimer = null;
  var lastTs = "", vistos = {}, msgCount = 0;

  function scrollBottom() { body.scrollTop = body.scrollHeight; }
  function speak(txt) {
    try { if (!("speechSynthesis" in window)) return; window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(txt); u.lang = "pt-BR"; u.rate = 1;
      var vs = window.speechSynthesis.getVoices() || []; var v = vs.filter(function (x) { return /pt[-_]?br/i.test(x.lang); })[0]; if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function nota(txt) { var d = document.createElement("div"); d.className = "kmv-note"; d.textContent = txt; body.appendChild(d); scrollBottom(); }
  function addMsg(corpo, autor, id) {
    if (id) { if (vistos[id]) return; vistos[id] = 1; }
    var eu = autor === "cliente";
    var row = document.createElement("div"); row.className = "kmv-row " + (eu ? "eu" : "eles");
    var m = document.createElement("div"); m.className = "kmv-msg"; m.textContent = corpo; row.appendChild(m);
    if (!eu) { var tools = document.createElement("div"); tools.className = "kmv-tools";
      var h = document.createElement("button"); h.className = "kmv-hear"; h.type = "button"; h.innerHTML = ICON_HEAR + "ouvir";
      h.onclick = function () { speak(corpo); }; tools.appendChild(h); row.appendChild(tools); }
    body.appendChild(row); scrollBottom(); msgCount++;
  }

  function fn(payload) {
    return fetch(FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }

  function aplicar(msgs, falar) {
    (msgs || []).forEach(function (m) {
      addMsg(m.corpo, m.autor, m.id);
      if (m.created_at && m.created_at > lastTs) lastTs = m.created_at;
      if (falar && m.autor === "equipe") speak(m.corpo);
    });
  }

  function startPoll() {
    stopPoll();
    pollTimer = setInterval(function () {
      var c = cid(); if (!c) return;
      fn({ action: "poll", conversa_id: c, vkey: vk(), since: lastTs }).then(function (j) {
        if (j && j.mensagens && j.mensagens.length) aplicar(j.mensagens, aberto); // fala só se estiver aberto
        if (!aberto && j && j.mensagens && j.mensagens.some(function (m) { return m.autor === "equipe"; })) marcaBadge(true);
      }).catch(function () {});
    }, 3500);
  }
  function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function marcaBadge(on) { var b = document.getElementById("kmvBadge"); if (b) b.style.display = on ? "flex" : "none"; }

  function primeiraCarga() {
    var c = cid(); if (!c) { saudacao(); return; }
    fn({ action: "poll", conversa_id: c, vkey: vk(), since: "" }).then(function (j) {
      if (j && j.erro) { localStorage.removeItem(CID_KEY); saudacao(); return; } // conversa inválida: recomeça
      if (j && j.mensagens && j.mensagens.length) { nameRow.style.display = "none"; aplicar(j.mensagens, false); }
      else saudacao();
    }).catch(function () { saudacao(); });
  }
  var saudou = false;
  function saudacao() {
    if (saudou) return; saudou = true;
    if (noHorario()) addMsg("Olá! Você está falando com o atendimento ao vivo da KM Interiores. Como podemos ajudar?", "equipe");
    else { addMsg("Olá! Nosso atendimento ao vivo funciona de segunda a sexta, das 9h às 19h, e sábado das 9h às 13h.", "equipe");
      nota("Deixe sua mensagem — assim que a equipe voltar, respondemos por aqui. Se preferir, informe seu nome."); }
  }

  function enviar(texto) {
    texto = (texto != null ? texto : input.value).trim();
    if (!texto || enviando) return;
    input.value = ""; input.style.height = "auto";
    addMsg(texto, "cliente");
    enviando = true; sendBtn.disabled = true;
    var nome = (panel.querySelector("#kmvNome") || {}).value || "";
    var c = cid();
    var base = { vkey: vk() };
    var req = c
      ? fn({ action: "send", conversa_id: c, corpo: texto, vkey: vk() })
      : fn({ action: "start", corpo: texto, nome: nome, origem: (location.pathname.indexOf("catalogo") >= 0 ? "catalogo" : "site"), pagina: location.pathname, vkey: vk() });
    req.then(function (j) {
      if (j && j.conversa_id) { setCid(j.conversa_id); nameRow.style.display = "none"; lastTs = new Date().toISOString(); startPoll(); }
      else if (j && j.ok) { /* enviado */ }
      else { nota("Não foi possível enviar agora. Tente novamente em instantes."); }
    }).catch(function () { nota("Falha de conexão. Sua mensagem pode não ter sido enviada."); })
      .finally(function () { enviando = false; sendBtn.disabled = false; });
  }

  function abrir() { panel.classList.add("kmv-on"); launch.style.display = "none"; aberto = true; marcaBadge(false);
    if (!msgCount) primeiraCarga(); if (cid()) startPoll(); setTimeout(function () { input.focus(); }, 100); }
  function fechar() { panel.classList.remove("kmv-on"); launch.style.display = "flex"; aberto = false; }

  launch.onclick = abrir;
  panel.querySelector(".kmv-x").onclick = fechar;
  input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 90) + "px"; });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } });
  sendBtn.onclick = function () { enviar(); };

  // poll leve em segundo plano p/ acender o badge quando a equipe responde e o chat está fechado
  if (cid()) { bgTimer = setInterval(function () {
    if (aberto) return; var c = cid(); if (!c) return;
    fn({ action: "poll", conversa_id: c, vkey: vk(), since: lastTs }).then(function (j) {
      if (j && j.mensagens && j.mensagens.length) { j.mensagens.forEach(function (m) { if (m.created_at > lastTs) lastTs = m.created_at; });
        if (j.mensagens.some(function (m) { return m.autor === "equipe"; })) marcaBadge(true); }
    }).catch(function () {});
  }, 15000); }
})();
