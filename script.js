function getCookie(name) {
  const v = document.cookie.split('; ').find(r => r.startsWith(name + '='));
  return v ? decodeURIComponent(v.split('=')[1]) : '';
}
function esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
function $(id) { return document.getElementById(id); }

function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast-msg ' + (type || 'ok');
  t.textContent = msg;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* ================= Theme ================= */
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-bs-theme') !== 'dark';
  html.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  $('themeBtn').innerText = dark ? '☀️ Light' : '🌙 Dark';
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
}

/* ================= Animated particle background ================= */
const cv = $('bg'), cx = cv.getContext('2d');
let pts = [], mouse = { x: -999, y: -999 };
function resizeBg() { cv.width = innerWidth; cv.height = innerHeight; }
resizeBg(); addEventListener('resize', resizeBg);
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
for (let i = 0; i < 65; i++) pts.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5 });
function drawBg() {
  cx.clearRect(0, 0, cv.width, cv.height);
  const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  const col = dark ? '139,143,232' : '79,70,229';
  pts.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > cv.width) p.vx *= -1;
    if (p.y < 0 || p.y > cv.height) p.vy *= -1;
    const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
    if (dm < 110) { p.x += (p.x - mouse.x) * .02; p.y += (p.y - mouse.y) * .02; }
    cx.beginPath(); cx.arc(p.x, p.y, 2.2, 0, 6.28); cx.fillStyle = 'rgba(' + col + ',.55)'; cx.fill();
    for (let j = i + 1; j < pts.length; j++) {
      const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 130) { cx.strokeStyle = 'rgba(' + col + ',' + (0.18 * (1 - d / 130)) + ')'; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(q.x, q.y); cx.stroke(); }
    }
  });
  requestAnimationFrame(drawBg);
}
drawBg();

/* ================= Confetti ================= */
const cf = $('confetti'), cfx = cf.getContext('2d');
function confettiBurst() {
  cf.width = innerWidth; cf.height = innerHeight;
  const colors = ['#4f46e5', '#7c3aed', '#db2777', '#22c55e', '#f59e0b', '#06b6d4'];
  const ps = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 3,
    s: Math.random() * 7 + 4, c: colors[Math.floor(Math.random() * colors.length)], r: Math.random() * 6
  }));
  let frames = 0;
  (function tick() {
    cfx.clearRect(0, 0, cf.width, cf.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.r += .2; cfx.save(); cfx.translate(p.x, p.y); cfx.rotate(p.r); cfx.fillStyle = p.c; cfx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); cfx.restore(); });
    if (++frames < 130) requestAnimationFrame(tick); else cfx.clearRect(0, 0, cf.width, cf.height);
  })();
}

/* ================= Hero typing ================= */
const phrases = ['Pehle documentation dhoondhta hai, phir jawab deta hai.', 'Grounded answers. No hallucination.', 'Code samjho, bugs pakdo, fix paao.', 'Bolkar poochho. Sunkar samjho. 🎤🔊'];
let pi = 0, ci = 0, del = false;
function typeLoop() {
  const el = $('typed'), full = phrases[pi];
  el.textContent = full.slice(0, ci);
  if (!del && ci < full.length) ci++;
  else if (!del) { del = true; return setTimeout(typeLoop, 1600); }
  else if (ci > 0) ci--;
  else { del = false; pi = (pi + 1) % phrases.length; }
  setTimeout(typeLoop, del ? 25 : 55);
}
typeLoop();

/* ================= Counters / stats ================= */
function countTo(el, target) {
  const start = parseInt(el.innerText) || 0, t0 = performance.now();
  (function f(t) {
    const k = Math.min((t - t0) / 700, 1);
    el.innerText = Math.round(start + (target - start) * k);
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}
let queries = 0, groundedCount = 0;
function updateStats() {
  countTo($('statQueries'), queries);
  $('statGrounded').innerText = queries ? Math.round(groundedCount * 100 / queries) + '%' : '0%';
}
function addChunks(n) { countTo($('statChunks'), (parseInt($('statChunks').innerText) || 0) + n); }

/* ================= 3D tilt on stat cards ================= */
document.querySelectorAll('[data-tilt]').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transform = 'perspective(500px) rotateY(' + (x * 18) + 'deg) rotateX(' + (-y * 18) + 'deg) scale(1.05)';
  });
  el.addEventListener('mouseleave', () => el.style.transform = '');
});

/* ================= Scroll reveal ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } }), { threshold: .1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ================= Pipeline ================= */
function setStep(n) {
  for (let i = 1; i <= 5; i++) {
    const el = $('st' + i);
    el.classList.remove('active', 'done');
    if (i < n) el.classList.add('done');
    if (i === n) el.classList.add('active');
  }
}
function resetSteps() { for (let i = 1; i <= 5; i++) $('st' + i).classList.remove('active', 'done'); }
function allDone() { for (let i = 1; i <= 5; i++) { $('st' + i).classList.remove('active'); $('st' + i).classList.add('done'); } }

/* ================= Examples ================= */
const EXAMPLES = {
  1: { code: "numbers = [10, 20, 30]\nfor i in range(len(numbers) + 1):\n    print(numbers[i])", q: "Why am I getting IndexError?" },
  2: { code: "student = {'name': 'Asha', 'age': 20}\nprint(student['marks'])", q: "Why am I getting KeyError?" },
  3: { code: "age = 20\nprint('My age is ' + age)", q: "Why am I getting TypeError?" },
  4: { code: "print('hi')", q: "How do I connect to MySQL?" }
};
function loadExample(n) { $('code').value = EXAMPLES[n].code; $('question').value = EXAMPLES[n].q; toast('Example loaded'); }

/* ================= Drag & drop ================= */
const dz = $('dropzone');
['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('over'); }));
['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', ev => { $('docs').files = ev.dataTransfer.files; showNames(); });
$('docs').addEventListener('change', showNames);
function showNames() {
  const f = $('docs').files;
  $('fileNames').innerText = f.length ? Array.from(f).map(x => x.name).join(', ') : '';
}

/* ================= Upload / Clear ================= */
async function uploadDocs() {
  const files = $('docs').files;
  const msg = $('uploadMsg');
  if (!files.length) { toast('Pehle file select karo', 'err'); return; }
  const fd = new FormData();
  for (const f of files) fd.append('docs', f);
  msg.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing... (chunking + embeddings)';
  setStep(1); setTimeout(() => setStep(2), 500); setTimeout(() => setStep(3), 1100);
  let d;
  try {
    const r = await fetch('/upload/', { method: 'POST', body: fd, headers: { 'X-CSRFToken': getCookie('csrftoken') } });
    d = await r.json();
  } catch (e) {
    msg.innerHTML = '<span class="text-danger">Upload fail hua. Ctrl+F5 karke dobara try karo.</span>';
    resetSteps(); return;
  }
  if (d.ok) {
    msg.innerHTML = '<span class="text-success">✅ ' + esc(d.files.join(', ')) + ' → ' + d.chunks + ' chunks added</span>';
    addChunks(d.chunks);
    allDone(); setTimeout(resetSteps, 1800);
    toast('Knowledge base updated: +' + d.chunks + ' chunks');
  } else {
    msg.innerHTML = '<span class="text-danger">' + esc(d.error) + '</span>';
    toast('Upload failed', 'err'); resetSteps();
  }
}

async function clearKB() {
  await fetch('/clear/', { method: 'POST', headers: { 'X-CSRFToken': getCookie('csrftoken') } });
  countTo($('statChunks'), 0);
  $('uploadMsg').innerHTML = 'Knowledge base cleared.';
  $('fileNames').innerText = '';
  toast('Knowledge base cleared');
}

/* ================= Voice: Mic (speech to text) ================= */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false, micError = false;
function toggleMic() {
  if (!SR) { toast('Is browser mein mic support nahi hai. Chrome use karo.', 'err'); return; }
  if (listening) { rec.stop(); return; }
  stopSpeak();
  rec = new SR();
  rec.lang = $('voiceLang').value;
  rec.interimResults = true;
  rec.continuous = false;
  micError = false;
  rec.onstart = () => { listening = true; $('micBtn').classList.add('on'); $('micStatus').classList.remove('d-none'); };
  rec.onresult = e => {
    let t = '';
    for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
    $('question').value = t;
  };
  rec.onerror = e => { micError = true; toast('Mic error: ' + e.error + (e.error === 'not-allowed' ? ' (mic permission Allow karo)' : ''), 'err'); };
  rec.onend = () => {
    listening = false; $('micBtn').classList.remove('on'); $('micStatus').classList.add('d-none');
    if (!micError && $('autoRun').checked && $('question').value.trim()) askAI();
  };
  rec.start();
}

/* ================= Voice: Speak (text to speech) ================= */
$('rate').addEventListener('input', () => $('rateTxt').innerText = parseFloat($('rate').value).toFixed(1) + 'x');

function pickVoice() {
  const vs = speechSynthesis.getVoices();
  return vs.find(v => v.lang === 'en-IN') || vs.find(v => v.lang.startsWith('en')) || null;
}
function stopSpeak() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  document.body.classList.remove('speaking');
}
function speakText(text) {
  if (!('speechSynthesis' in window)) { toast('Voice output support nahi hai', 'err'); return; }
  stopSpeak();
  const parts = (text.replace(/[`*#_]/g, '').match(/[^.!?\n]+[.!?]?/g) || []).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return;
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = 'en-IN';
    u.rate = parseFloat($('rate').value);
    const v = pickVoice(); if (v) u.voice = v;
    if (i === 0) u.onstart = () => document.body.classList.add('speaking');
    if (i === parts.length - 1) u.onend = () => document.body.classList.remove('speaking');
    u.onerror = () => document.body.classList.remove('speaking');
    speechSynthesis.speak(u);
  });
}
function speakResult() {
  if (!lastResult) { toast('Pehle koi answer generate karo', 'err'); return; }
  const d = lastResult;
  let t = d.found ? 'This answer is grounded in your documentation. ' : 'Not found in knowledge base. This is general guidance only. ';
  t += (d.explanation || '') + ' ';
  if (d.issues && d.issues.length) t += 'Issues found. ' + d.issues.join('. ') + '. ';
  if (d.fix_notes) t += 'Fix notes. ' + d.fix_notes;
  speakText(t);
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

/* ================= Ask ================= */
let lastResult = null, lastCode = '';
async function askAI() {
  const code = $('code').value, question = $('question').value;
  if (!code.trim() && !question.trim()) { toast('Code ya problem likho', 'err'); return; }
  const fd = new FormData();
  fd.append('code', code);
  fd.append('question', question);
  fd.append('level', $('level').value);
  const btn = $('askBtn'), loading = $('loading');
  btn.disabled = true; loading.classList.remove('d-none');
  let st = 3; setStep(3);
  const timer = setInterval(() => { if (st < 5) setStep(++st); }, 1200);
  try {
    const r = await fetch('/ask/', { method: 'POST', body: fd, headers: { 'X-CSRFToken': getCookie('csrftoken') } });
    const d = await r.json();
    if (!d.ok) { toast('Error: ' + d.error, 'err'); resetSteps(); return; }
    lastResult = d; lastCode = code;
    queries++; if (d.found) groundedCount++; updateStats();
    showResult(d, code);
    addHistory(code, question);
    allDone();
    if (d.found) confettiBurst();
    toast(d.found ? 'Answer grounded in your docs ✅' : 'Not found in knowledge base ⚠️', d.found ? 'ok' : 'err');
    if ($('autoSpeak').checked) speakResult();
  } catch (e) {
    toast('Something went wrong: ' + e, 'err'); resetSteps();
  } finally {
    clearInterval(timer);
    btn.disabled = false; loading.classList.add('d-none');
  }
}

/* ================= Result ================= */
function showTab(id) {
  document.querySelectorAll('.tabpane').forEach(p => p.classList.add('d-none'));
  $(id).classList.remove('d-none');
  document.querySelectorAll('.tabbtn').forEach(b => b.classList.toggle('active', b.dataset.t === id));
}

function typeWrite(el, text) {
  el.textContent = '';
  let i = 0;
  const step = Math.max(3, Math.ceil(text.length / 120));
  const t = setInterval(() => {
    el.textContent = text.slice(0, i += step);
    if (i >= text.length) { el.textContent = text; clearInterval(t); }
  }, 15);
}

function renderDiff(oldCode, newCode) {
  const oldL = (oldCode || '').split('\n'), newL = (newCode || '').split('\n');
  const oldSet = new Set(oldL.map(l => l.trim())), newSet = new Set(newL.map(l => l.trim()));
  $('diffOld').innerHTML = oldL.map(l => '<div class="dl ' + (l.trim() && !newSet.has(l.trim()) ? 'del' : '') + '">' + (esc(l) || ' ') + '</div>').join('');
  $('diffNew').innerHTML = newL.map(l => '<div class="dl ' + (l.trim() && !oldSet.has(l.trim()) ? 'add' : '') + '">' + (esc(l) || ' ') + '</div>').join('');
}

function showResult(d, originalCode) {
  $('result').classList.remove('d-none');
  showTab('tExp');

  $('badge').innerHTML = d.found
    ? '<span class="badge bg-success fs-6">✅ Grounded in your documentation</span>'
    : '<span class="badge bg-warning text-dark fs-6">⚠️ Not found in knowledge base (general guidance only)</span>';

  const top = (d.sources && d.sources.length) ? Math.max(...d.sources.map(p => p.score)) : 0;
  const pct = Math.round(top * 100);
  $('confTxt').innerText = d.found ? pct + '%' : 'No match';
  const bar = $('confBar');
  bar.style.width = '0%';
  setTimeout(() => bar.style.width = (d.found ? pct : 5) + '%', 50);
  bar.className = 'progress-bar ' + (d.found ? 'bg-success' : 'bg-warning');

  typeWrite($('explanation'), d.explanation || '');

  const ul = $('issues'); ul.innerHTML = '';
  (d.issues && d.issues.length ? d.issues : ['No issues detected.']).forEach(i => {
    const li = document.createElement('li'); li.textContent = i; ul.appendChild(li);
  });

  const cc = $('corrected');
  cc.textContent = d.corrected_code || '(no correction needed)';
  cc.removeAttribute('data-highlighted');
  if (window.hljs) hljs.highlightElement(cc);
  $('fixNotes').textContent = d.fix_notes || '';

  renderDiff(originalCode, d.corrected_code || '');

  const s = $('sources');
  s.innerHTML = (d.sources && d.sources.length)
    ? d.sources.map(p => {
        const sp = Math.round(p.score * 100);
        return '<div class="src"><div class="d-flex justify-content-between">' +
          '<b>' + esc(p.source) + ' · chunk ' + p.chunk_no + '</b>' +
          '<span class="badge bg-primary">' + sp + '% match</span></div>' +
          '<div class="progress my-2" style="height:6px"><div class="progress-bar" style="width:' + sp + '%"></div></div>' +
          esc(p.text) + '</div>';
      }).join('')
    : '<span class="text-muted">No relevant passage retrieved.</span>';

  $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================= Copy / Download ================= */
function copyCode() {
  navigator.clipboard.writeText($('corrected').textContent);
  const b = $('copyBtn'); b.innerText = '✅ Copied!';
  setTimeout(() => b.innerText = '📋 Copy', 1500);
}

function downloadReport() {
  if (!lastResult) return;
  const d = lastResult;
  const txt = 'DOCS-GROUNDED CODE MENTOR REPORT\n\n' +
    'Grounded in docs: ' + (d.found ? 'YES' : 'NO (general guidance)') + '\n\n' +
    'ORIGINAL CODE:\n' + lastCode + '\n\n' +
    'EXPLANATION:\n' + (d.explanation || '') + '\n\n' +
    'ISSUES:\n- ' + ((d.issues || []).join('\n- ') || 'None') + '\n\n' +
    'CORRECTED CODE:\n' + (d.corrected_code || '') + '\n\n' +
    'NOTES:\n' + (d.fix_notes || '') + '\n\n' +
    'SOURCES:\n' + ((d.sources || []).map(p => '- ' + p.source + ' chunk ' + p.chunk_no + ' (' + Math.round(p.score * 100) + '%)').join('\n') || 'None');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
  a.download = 'code_mentor_report.txt';
  a.click();
  toast('Report downloaded');
}

/* ================= History ================= */
let hist = [];
function renderHistory() {
  $('history').innerHTML = hist.length
    ? hist.map((h, i) => '<div class="hist-item" onclick="reuse(' + i + ')">💬 ' + esc((h.q || h.code).slice(0, 45)) + '</div>').join('')
    : '<span class="text-muted">No questions yet.</span>';
}
function addHistory(code, q) {
  hist.unshift({ code, q });
  hist = hist.slice(0, 8);
  try { localStorage.setItem('hist', JSON.stringify(hist)); } catch (e) {}
  renderHistory();
}
function reuse(i) { $('code').value = hist[i].code; $('question').value = hist[i].q; toast('Loaded from history'); }
function clearHistory() { hist = []; try { localStorage.removeItem('hist'); } catch (e) {} renderHistory(); }

/* ================= Init ================= */
(function init() {
  try {
    if (localStorage.getItem('theme') === 'dark') toggleTheme();
    hist = JSON.parse(localStorage.getItem('hist') || '[]');
  } catch (e) {}
  renderHistory();
  updateStats();
})();