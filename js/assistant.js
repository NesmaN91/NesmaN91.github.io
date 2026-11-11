// "Ask Nesma" assistant: a guided request helper that emails Nesma.
// It follows a fixed script. It is not an AI and it does not answer as Nesma.
//
// HOW REQUESTS REACH YOUR INBOX
// Requests are posted to FormSubmit (https://formsubmit.co), a free relay that forwards them to EMAIL.
// The very first request triggers one activation email from FormSubmit: open it and press "Activate".
// If the relay ever fails, the visitor gets a button that opens their own email app with the request filled in.
// To change the address, edit EMAIL. To turn the relay off and always use the visitor's email app, set RELAY to "".
(function () {
  const EMAIL = "nesmanagar15@gmail.com";
  const RELAY = "https://formsubmit.co/ajax/" + EMAIL;

  // ---- The script: topics, what the guide says, and the questions it asks ----
  const ASK = {
    name: { q: "What is your name?", label: "Your name" },
    email: { q: "What email address should Nesma reply to?", label: "Your email address", type: "email" },
    org: { q: "Where do you work or study, and what is your role?", label: "Your institution and role" },
  };
  const TOPICS = {
    collab: {
      label: "Research collaboration", subject: "Research collaboration request",
      intro: "Nesma welcomes collaborations on AI literacy, critical thinking with generative AI, professional learning design, and instrument validation. I will ask five short questions and send your answers to her.",
      fields: ["name", "email", "org",
        { key: "idea", q: "What would you like to work on together?", label: "Your collaboration idea" },
        { key: "timeline", q: "Is there a deadline or timeline? (Type “skip” if not.)", label: "Timeline", optional: true }],
    },
    picp: {
      label: "PICP Human-in-the-Loop survey", subject: "Request: PICP Human-in-the-Loop survey",
      intro: "You can request the PICP Human-in-the-Loop survey for your own research or teaching. I will ask five short questions; Nesma will reply by email with the survey and how to cite it.",
      fields: ["name", "email", "org",
        { key: "use", q: "How do you plan to use the survey? Please mention your participants and country.", label: "Planned use" },
        { key: "adapt", q: "Do you plan to translate or adapt it? (Type “no” if not.)", label: "Translation or adaptation" }],
    },
    ferpai: {
      label: "FERPAI scale", subject: "Request: FERPAI scale",
      intro: "FERPAI measures educators’ functional, ethical, rhetorical, and pedagogical AI literacy. I will ask five short questions; Nesma will reply by email with the scale and how to cite it.",
      fields: ["name", "email", "org",
        { key: "use", q: "How do you plan to use the scale? Please mention who will take it (for example preservice teachers, K–12 teachers, or faculty) and your country.", label: "Planned use" },
        { key: "adapt", q: "Do you plan to translate or adapt it? (Type “no” if not.)", label: "Translation or adaptation" }],
    },
    workshop: {
      label: "Workshop or invited talk", subject: "Workshop or talk invitation",
      intro: "Nesma leads AI literacy workshops and professional development for schools, universities, and organizations. I will ask five short questions.",
      fields: ["name", "email", "org",
        { key: "event", q: "What is the event, who is the audience, and is it online or in person?", label: "Event and audience" },
        { key: "date", q: "What date or time frame do you have in mind? (Type “skip” if not set.)", label: "Date", optional: true }],
    },
    cv: {
      label: "Request Nesma’s CV", subject: "CV request",
      intro: "Nesma shares her CV on request. I will ask three short questions and she will reply by email.",
      fields: ["name", "email", { key: "reason", q: "Where do you work or study, and why would you like her CV?", label: "Institution and reason" }],
    },
    other: {
      label: "Something else", subject: "Message from your website",
      intro: "Of course. I will take a short message for Nesma.",
      fields: ["name", "email", { key: "message", q: "What would you like to tell or ask Nesma?", label: "Your message" }],
    },
  };
  const QUICK = [
    [/\bcv\b|resume|résumé|curriculum vitae/i, "cv"],
    [/ferpai|\bscale\b/i, "ferpai"], [/picp|survey|human.?in.?the.?loop|questionnaire/i, "picp"],
    [/collab|co-?author|grant|partner|research with/i, "collab"], [/workshop|talk|speak|keynote|training|\bpd\b|webinar/i, "workshop"],
  ];
  const LINKS = [
    [/publication|paper|article|cite/i, "Her articles and presentations are listed here: ", "publications.html", "Publications"],
    [/video|recording|youtube/i, "Workshop recordings are linked from this page: ", "design.html", "Design & PD"],
    [/teach|course/i, "Her courses and student feedback are here: ", "teaching.html", "Teaching"],
  ];

  // ---- Build the launcher and the panel ----
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const launch = el("button", "assist-launch"); launch.type = "button";
  launch.setAttribute("aria-expanded", "false"); launch.setAttribute("aria-controls", "assist-panel");
  const SPHINX = '<svg class="sphinx" viewBox="0 0 48 40" aria-hidden="true"><path class="sx-tail" d="M39 31 c6 0 7-6 3.5-9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M17 35 V23 c7-4 16-2.5 20 3 c2 2.7 3 5.5 3 9 z" fill="#fff"/><rect x="6" y="30.5" width="20" height="4.6" rx="2.3" fill="#fff"/><path d="M26 35 v-4 a3 3 0 0 1 6 0 v4" fill="none" stroke="#0E6F6B" stroke-width="1.2" opacity=".5"/><g class="sx-head"><path d="M9.5 25 L11.5 9 Q17 2.5 22.5 9 L25.5 25 Z" fill="#F5C76B"/><path d="M11 13.5 h12.5 M10.4 17.5 h13.8 M9.9 21.5 h14.9" stroke="#0E6F6B" stroke-width="1.3" opacity=".75"/><path d="M12.3 10 q4.7-4.6 9.4 0 v9.5 q-4.7 4.5-9.4 0 z" fill="#fff"/><rect x="15.4" y="21.5" width="3.2" height="5" rx="1.2" fill="#F5C76B"/><g class="sx-eyes" fill="#1B2333"><ellipse cx="14.9" cy="14" rx="1.1" ry="1.4"/><ellipse cx="19.1" cy="14" rx="1.1" ry="1.4"/></g><path d="M15.3 17.6 q1.7 1.3 3.4 0" fill="none" stroke="#1B2333" stroke-width="1" stroke-linecap="round"/><circle cx="17" cy="6.3" r="1.3" fill="#fff"/></g></svg>';
  launch.innerHTML = SPHINX + '<span class="label">Ask Nesma</span><span class="ping" aria-hidden="true"></span>';
  launch.setAttribute("aria-label", "Ask Nesma: open the guided request assistant");

  const panel = el("section", "assist"); panel.id = "assist-panel"; panel.hidden = true;
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-labelledby", "assist-title");
  const head = el("header"); const titles = el("div");
  const h = el("h2", "", "Ask Nesma"); h.id = "assist-title";
  titles.append(h, el("p", "", "Guided request assistant"));
  const brand = el("div"); brand.style.cssText = "display:flex;align-items:center;gap:10px"; brand.innerHTML = SPHINX; brand.append(titles);
  const tools = el("div"); tools.style.cssText = "display:flex;gap:6px";
  const restartBtn = el("button", "", "Start over"); restartBtn.type = "button";
  const closeBtn = el("button", "", "Close"); closeBtn.type = "button";
  tools.append(restartBtn, closeBtn); head.append(brand, tools);
  const log = el("div", "assist-log"); log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite"); log.tabIndex = 0; log.setAttribute("aria-label", "Conversation");
  const form = el("form"); form.noValidate = true;
  const inputLabel = el("label", "vh", "Your answer"); inputLabel.htmlFor = "assist-input";
  const input = el("input"); input.type = "text"; input.id = "assist-input"; input.autocomplete = "off"; input.maxLength = 1500;
  const sendBtn = el("button", "", "Send"); sendBtn.type = "submit";
  form.append(inputLabel, input, sendBtn);
  const fine = el("p", "fine", "This guide follows a script. It is not an AI and it is not Nesma. Your answers are emailed to her (through the FormSubmit relay) only when you press “Send to Nesma.”");
  panel.append(head, log, form, fine);
  document.body.append(launch, panel);

  // ---- Conversation engine ----
  let state = { topic: null, step: 0, data: {}, stage: "menu" }, started = false, lastSend = 0;
  const still = () => !document.documentElement.classList.contains("motion");
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  function say(parts, who) {
    const m = el("div", "msg " + (who || "bot"));
    (Array.isArray(parts) ? parts : [parts]).forEach((p) => {
      if (typeof p === "string") m.append(document.createTextNode(p));
      else { const a = el("a", "", p.label); a.href = p.href; m.append(a); }
    });
    log.append(m); scroll(); return m;
  }
  function bot(parts, then) {
    if (still()) { say(parts); if (then) then(); return; }
    const t = el("div", "msg bot typing"); t.setAttribute("aria-hidden", "true"); t.append(el("i"), el("i"), el("i")); log.append(t); scroll();
    setTimeout(() => { t.remove(); say(parts); if (then) then(); }, 450);
  }
  function choices(list) {
    const box = el("div", "assist-choices"); box.setAttribute("role", "group"); box.setAttribute("aria-label", "Choose an option");
    list.forEach(([label, fn]) => {
      const b = el("button", "", label); b.type = "button";
      b.addEventListener("click", () => { box.querySelectorAll("button").forEach((x) => { x.disabled = true; }); say(label, "me"); if (!panel.hidden) input.focus(); fn(); });
      box.append(b);
    });
    log.append(box); scroll();
  }
  function prompt(label, type) {
    inputLabel.textContent = label; input.placeholder = label; input.inputMode = type === "email" ? "email" : "text";
    input.autocomplete = type === "email" ? "email" : "off"; input.disabled = false; sendBtn.disabled = false;
    if (!panel.hidden) input.focus();
  }
  function menu(first) {
    state = { topic: null, step: 0, data: {}, stage: "menu" };
    bot(first ? "Hello, and welcome. I am a guided assistant for Nesma R. Nasr’s website. What can I help you with?" : "What else can I help you with?", () => {
      choices(Object.keys(TOPICS).map((k) => [TOPICS[k].label, () => begin(k)]));
      prompt("Choose an option above, or type a question");
    });
  }
  const fieldAt = (t, i) => { const f = TOPICS[t].fields[i]; return typeof f === "string" ? Object.assign({ key: f }, ASK[f]) : f; };
  function begin(k) { state = { topic: k, step: 0, data: {}, stage: "ask" }; bot(TOPICS[k].intro, ask); }
  function ask() {
    const f = fieldAt(state.topic, state.step);
    bot(f.q, () => prompt(f.label, f.type));
  }
  function summary() {
    state.stage = "confirm";
    const t = TOPICS[state.topic];
    const lines = t.fields.map((_, i) => { const f = fieldAt(state.topic, i); return f.label + ": " + (state.data[f.key] || "(not given)"); });
    bot("Thank you. Here is what I will send to Nesma:\n\n" + t.label + "\n" + lines.join("\n"), () => {
      choices([["Send to Nesma", send], ["Change my answers", () => begin(state.topic)], ["Cancel", () => menu(false)]]);
      prompt("Choose an option above");
    });
  }
  function body() {
    const t = TOPICS[state.topic];
    return t.fields.map((_, i) => { const f = fieldAt(state.topic, i); return f.label + ": " + (state.data[f.key] || "(not given)"); }).join("\n");
  }
  function mailto() {
    const t = TOPICS[state.topic];
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent(t.subject) + "&body=" + encodeURIComponent(t.label + "\n\n" + body() + "\n\nSent from nesman91.github.io");
  }
  function fallback(why) {
    const lead = /activ/i.test(why || "") ? "Automatic sending is waiting for a one-time activation of Nesma’s inbox, so I could not send that yet. " : "I could not send that automatically. ";
    bot([lead + "Please send it from your own email instead: ", { href: mailto(), label: "open my email app with the request filled in" }, ". You can also write to " + EMAIL + "."], () => {
      choices([["Start another request", () => menu(false)]]);
    });
  }
  function send() {
    if (Date.now() - lastSend < 20000) { bot("That was just sent. Please wait a moment before sending again."); return; }
    const t = TOPICS[state.topic]; const d = state.data;
    if (!RELAY) { fallback(); return; }
    input.disabled = true; sendBtn.disabled = true;
    const payload = { _subject: t.subject + " (" + (d.name || "website visitor") + ")", _template: "table", _captcha: "false",
      _autoresponse: "Thank you for your request. Nesma R. Nasr has received it and will reply to you by email.",
      Request: t.label, name: d.name || "", email: d.email || "" };
    t.fields.forEach((_, i) => { const f = fieldAt(state.topic, i); if (f.key !== "name" && f.key !== "email") payload[f.label] = d[f.key] || "(not given)"; });
    const ctrl = "AbortController" in window ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), 12000);
    fetch(RELAY, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        clearTimeout(timer);
        if (ok && String(j.success) === "true") {
          lastSend = Date.now();
          bot("Sent. Nesma has your request and will reply to " + d.email + ". Thank you for your interest in her work.", () => choices([["Start another request", () => menu(false)], ["Close", close]]));
        } else fallback(j && j.message);
      })
      .catch(() => { clearTimeout(timer); fallback(); });
  }
  function answer(text) {
    say(text, "me");
    if (state.stage === "menu" || state.stage === "confirm") {
      const hit = QUICK.find(([re]) => re.test(text));
      if (hit) { begin(hit[1]); return; }
      const link = LINKS.find(([re]) => re.test(text));
      if (link) { bot([link[1], { href: link[2], label: link[3] }, "."]); return; }
      if (/email|contact|reach/i.test(text)) { bot(["You can write to Nesma at ", { href: "mailto:" + EMAIL, label: EMAIL }, ", or choose a topic and I will send your request for you."]); return; }
      bot("I am a simple guide, so I can only help with the topics below. Choose one, or pick “Something else” to leave Nesma a message.", () => choices(Object.keys(TOPICS).map((k) => [TOPICS[k].label, () => begin(k)])));
      return;
    }
    const f = fieldAt(state.topic, state.step);
    const skip = /^(skip|none|n\/a)$/i.test(text);
    if (skip && !f.optional) { bot("I need this one to send your request. " + f.q); return; }
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) { bot("That does not look like an email address. Please type it again, for example name@university.edu."); return; }
    state.data[f.key] = skip ? "" : text;
    state.step += 1;
    if (state.step < TOPICS[state.topic].fields.length) ask(); else summary();
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim(); if (!text) return;
    input.value = ""; answer(text);
  });

  // ---- Open, close, start over ----
  let opener = null;
  function open(topic, from) {
    opener = from || launch; panel.hidden = false; launch.setAttribute("aria-expanded", "true");
    if (topic && TOPICS[topic]) { started = true; say(TOPICS[topic].label, "me"); begin(topic); }
    else if (!started) { started = true; menu(true); }
    input.focus(); scroll();
  }
  function close() { panel.hidden = true; launch.setAttribute("aria-expanded", "false"); (opener && document.contains(opener) ? opener : launch).focus(); }
  launch.addEventListener("click", () => (panel.hidden ? open(null, launch) : close()));
  closeBtn.addEventListener("click", close);
  restartBtn.addEventListener("click", () => { log.textContent = ""; menu(true); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden && !document.querySelector(".lightbox")) close(); });
  document.querySelectorAll("[data-assistant-open]").forEach((b) => b.addEventListener("click", () => open(b.getAttribute("data-assistant-open"), b)));
})();
