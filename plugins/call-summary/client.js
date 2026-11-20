// Call Summary — the window half: the Summaries activity (pick a call → build the summary → PDF saved), a
// "Create summary PDF" item in each call's menu, and ⌘K entries. The PDF is built here (pdf.js) and saved by
// the host half, in parts.

const VERSION = '0.2.1'
const ACTIVITY = 'call-summary:summaries'
const ICON = (s) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 15h5M10 18h3"/></svg>`
const SECTIONS = [['summary', 'Summary'], ['decisions', 'Decisions'], ['actions', 'Action items (owner, due date)'], ['topics', 'Discussion, by topic'], ['questions', 'Open questions'], ['screens', 'Shared screens'], ['attendees', 'Attendees']]

const CSS = `
.cs-host{flex:1;min-height:0;display:flex}
.cs{flex:1;min-width:0;min-height:0;display:flex;position:relative;
  --paper:#fbfafa;--sheet:#ffffff;--ink:#000000;--muted:#666666;--rule:rgba(0,0,0,.2);--hover:#f3f3f3;--desk:#e9e9e9;
  --accent:#0047ff;--accent-ink:#ffffff;--accent-soft:rgba(0,71,255,.08);--warn:#c50303;--band:#000000;--band-ink:#ffffff;--band-accent:#00f6ff;
  --f-ui:"Museo Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  background:var(--paper);color:var(--ink);font-family:var(--f-ui);font-size:14px;line-height:1.45;letter-spacing:.02em}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .cs{
  --paper:#000000;--sheet:#060606;--ink:#ffffff;--muted:#bdb8b8;--rule:rgba(255,255,255,.22);--hover:#161616;--desk:#121212;
  --accent:#00f6ff;--accent-ink:#000000;--accent-soft:rgba(0,246,255,.12);--warn:#ff4d40;--band:#161616;color-scheme:dark}}
:root[data-theme="dark"] .cs{
  --paper:#000000;--sheet:#060606;--ink:#ffffff;--muted:#bdb8b8;--rule:rgba(255,255,255,.22);--hover:#161616;--desk:#121212;
  --accent:#00f6ff;--accent-ink:#000000;--accent-soft:rgba(0,246,255,.12);--warn:#ff4d40;--band:#161616;color-scheme:dark}
.cs *{box-sizing:border-box}
.cs [hidden]{display:none!important}
.cs button{font:inherit;color:inherit;cursor:pointer}
.cs button:disabled{opacity:.45;cursor:default}
.cs .cs-lbl{margin:0;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.cs .cs-pill{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:10px 18px;border-radius:100px;border:1px solid var(--rule);background:transparent;white-space:nowrap}
.cs .cs-pill:hover:not(:disabled){opacity:.8}
.cs .cs-pill.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.cs .cs-pill.ink{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.cs .cs-chip{font-size:12px;padding:5px 12px;border-radius:100px;border:1px solid var(--rule);background:transparent}
.cs .cs-chip.on{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.cs .cs-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cs .cs-note{font-size:12.5px;color:var(--muted);font-weight:300;margin:0}
.cs .cs-err{color:var(--warn)}
/* list */
.cs .cs-list{width:min(520px,45%);min-width:320px;border-right:1px solid var(--rule);display:flex;flex-direction:column;min-height:0}
.cs .cs-band{background:var(--band);color:var(--band-ink);padding:24px 28px 20px;display:flex;flex-direction:column;gap:8px}
.cs .cs-band .cs-lbl{color:var(--band-accent)}
.cs .cs-band h1{margin:0;font-size:34px;font-weight:250;letter-spacing:-.01em;line-height:1.1}
.cs .cs-band p{margin:0;font-size:13.5px;font-weight:300;color:#d0d0d0}
.cs .cs-find{display:flex;gap:8px;padding:14px 28px;align-items:center}
.cs .cs-find input{flex:1;min-width:0;font:inherit;font-size:14px;padding:8px 14px;border:1px solid var(--rule);border-radius:100px;background:var(--sheet);color:var(--ink)}
.cs .cs-rows{flex:1;min-height:0;overflow:auto}
.cs .cs-row{width:100%;text-align:left;border:0;border-bottom:1px solid var(--rule);background:transparent;padding:13px 28px;display:grid;grid-template-columns:78px minmax(0,1fr) auto;gap:3px 12px;align-items:center}
.cs .cs-row:hover{background:var(--hover)}
.cs .cs-row.on{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--accent)}
.cs .cs-row .t{font-size:12px;color:var(--muted)}
.cs .cs-row .nm{font-size:14.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cs .cs-row .sub{grid-column:2;font-size:12px;color:var(--muted)}
.cs .cs-tag{font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:100px;border:1px solid var(--accent);color:var(--accent);white-space:nowrap}
.cs .cs-more{margin:14px 28px;align-self:flex-start}
.cs .cs-pane{flex:1;min-width:0;overflow:auto;padding:36px 44px;display:flex;flex-direction:column;gap:20px}
.cs .cs-pane h2{margin:0;font-size:32px;font-weight:250;line-height:1.15}
.cs dl.cs-facts{margin:0;display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px 18px;font-size:14px;font-weight:300}
.cs dl.cs-facts dt{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding-top:2px}
.cs dl.cs-facts dd{margin:0}
.cs .cs-made{display:flex;flex-direction:column}
.cs .cs-made div{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;padding:9px 0;border-bottom:1px solid var(--rule);font-size:13.5px;font-weight:300;align-items:center}
.cs .cs-made div span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* build */
.cs .cs-opts{width:380px;min-width:320px;border-right:1px solid var(--rule);overflow:auto;padding:22px 24px;display:flex;flex-direction:column;gap:18px}
.cs .cs-opts h1{margin:0;font-size:22px;font-weight:300;line-height:1.2}
.cs .cs-back{border:0;background:none;padding:0;text-align:left;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.cs .cs-back:hover{color:var(--ink)}
.cs fieldset{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.cs legend{padding:0;margin-bottom:8px}
.cs .cs-check{display:flex;gap:10px;align-items:center;font-size:14px;font-weight:300;cursor:pointer}
.cs .cs-check input{accent-color:var(--accent);width:16px;height:16px}
.cs .cs-shots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.cs .cs-shot{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--muted);cursor:pointer}
.cs .cs-shot .im{aspect-ratio:16/10;border:2px solid var(--rule);border-radius:5px;overflow:hidden;background:var(--hover)}
.cs .cs-shot.on .im{border-color:var(--accent)}
.cs .cs-shot img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.cs .cs-shot input{accent-color:var(--accent)}
.cs .cs-desk{flex:1;min-width:0;background:var(--desk);display:flex;flex-direction:column;min-height:0}
.cs .cs-scroll{flex:1;min-height:0;overflow:auto;padding:22px 24px;display:flex;flex-direction:column;align-items:center;gap:10px}
.cs .cs-page{width:min(640px,100%);background:#ffffff;color:#000000;padding:44px 48px;display:flex;flex-direction:column;gap:12px;font-family:Helvetica,Arial,sans-serif;letter-spacing:0}
.cs .cs-page .bar{width:64px;height:4px;background:#0047ff}
.cs .cs-page .eb{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#555}
.cs .cs-page .sec{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#0047ff;margin-top:8px;padding-top:12px;border-top:1px solid #ddd}
.cs .cs-page .ttl{font-size:26px;line-height:1.2}
.cs .cs-page .ppl{font-size:11px;color:#555}
.cs .cs-page p,.cs .cs-page li,.cs .cs-page .ed{font-size:12.5px;line-height:1.55}
.cs .cs-page h4{margin:6px 0 0;font-size:14px}
.cs .cs-page .ed{outline:none;border-radius:3px;white-space:pre-wrap}
.cs .cs-page .ed.ttl{font-size:26px;line-height:1.2}
.cs .cs-page h4 .ed{font-size:14px;font-weight:700}
.cs .cs-page figcaption .ed{font-size:11.5px}
.cs .cs-page .ed:hover{background:rgba(0,71,255,.05)}
.cs .cs-page .ed:focus{background:rgba(0,71,255,.07);box-shadow:0 0 0 1px rgba(0,71,255,.35)}
.cs .cs-page .ed:empty::before{content:attr(data-ph);color:#999}
.cs .cs-page .li{display:grid;grid-template-columns:14px minmax(0,1fr) 22px;gap:4px;align-items:start}
.cs .cs-page .li .dot{color:#0047ff;font-size:12.5px;line-height:1.55}
.cs .cs-page .x{border:0;background:none;color:#999;padding:0 2px;font-size:12px;line-height:1.7;opacity:0}
.cs .cs-page .li:hover .x,.cs .cs-page .ar:hover .x{opacity:1}
.cs .cs-page .x:hover{color:#c50303}
.cs .cs-page .tbl .x{opacity:.5}
.cs .cs-page .add{border:0;background:none;color:#0047ff;font-size:11.5px;padding:2px 0;text-align:left;align-self:flex-start}
.cs .cs-page .tbl{display:grid;grid-template-columns:minmax(0,1fr) 130px 90px 22px;font-size:12px}
.cs .cs-page .tbl>*{padding:5px 4px 5px 0;border-bottom:1px solid #ddd}
.cs .cs-page .tbl .h{font-weight:700;font-size:11px;border-bottom-color:#888}
.cs .cs-page .ar{display:contents}
.cs .cs-page .tbl input[type=date]{font:inherit;font-size:11.5px;border:0;background:transparent;width:100%;color:#000}
.cs .cs-page figure{margin:0;display:flex;flex-direction:column;gap:6px}
.cs .cs-page figure img{width:100%;border:1px solid #ddd;display:block}
.cs .cs-page figcaption{display:flex;gap:8px;font-size:11.5px}
.cs .cs-page figcaption b{color:#0047ff}
.cs .cs-wait{position:sticky;top:0;align-self:stretch;background:var(--accent-soft);border:1px solid var(--accent);color:var(--ink);border-radius:5px;padding:9px 14px;font-size:13px;text-align:center}
.cs .cs-ask{border-top:1px solid var(--rule);background:var(--sheet);padding:12px 20px 14px;display:flex;flex-direction:column;gap:8px}
.cs .cs-ask textarea{flex:1;min-width:0;font:inherit;font-size:13.5px;line-height:1.45;padding:8px 10px;border:1px solid var(--rule);border-radius:5px;resize:none;background:var(--paper);color:var(--ink)}
.cs .cs-last{margin-left:auto;font-size:12px;color:var(--accent)}
.cs .cs-last button{border:0;background:none;color:var(--accent);text-decoration:underline;padding:0 0 0 4px;font-size:12px}
/* saved */
.cs .cs-saved{flex:1;overflow:auto;padding:44px 56px;display:flex;gap:48px;flex-wrap:wrap;align-items:flex-start}
.cs .cs-saved section{flex:1 1 480px;min-width:0;display:flex;flex-direction:column;gap:20px}
.cs .cs-saved h1{margin:0;font-size:36px;font-weight:250;line-height:1.15}
.cs .cs-file{background:var(--sheet);border:1px solid var(--rule);border-radius:5px;padding:16px 18px;display:grid;grid-template-columns:40px minmax(0,1fr);gap:4px 14px;align-items:center}
.cs .cs-file b{font-weight:500;overflow-wrap:anywhere}
.cs .cs-mail{flex:0 1 380px;background:var(--sheet);border:1px solid var(--rule);border-radius:5px;padding:20px 22px;display:flex;flex-direction:column;gap:10px}
.cs .cs-mail pre{margin:0;white-space:pre-wrap;font:inherit;font-size:13px;line-height:1.6;font-weight:300}
.cs .cs-subin{flex:1;min-width:0;font:inherit;font-size:13.5px;padding:7px 10px;border:1px solid var(--rule);border-radius:5px;background:var(--sheet);color:var(--ink)}
.cs .cs-toast{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:8px 14px;border-radius:5px;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:40;max-width:80%}
.cs .cs-toast.show{opacity:1}
.cs .cs-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;z-index:60;cursor:zoom-out;padding:16px}
.cs .cs-lightbox img{max-width:96vw;max-height:94vh;background:#fff}
@media (max-width:900px){.cs{flex-direction:column;overflow:auto}.cs .cs-list,.cs .cs-opts{width:auto;border-right:0;border-bottom:1px solid var(--rule)}.cs .cs-rows{max-height:50vh}}
`

export function apply(ctx) {
  ctx.ui.style(CSS)
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const pad2 = (n) => String(n).padStart(2, '0')
  const clock = (t) => { t = Math.max(0, Math.round(t)); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return (h ? h + ':' + pad2(m) : String(m)) + ':' + pad2(s) }
  const getJson = async (p) => { const r = await fetch(p); if (!r.ok) throw new Error(`${r.status}`); return r.json() }
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch { return d } }
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private window */ } }
  let pdfMod = null
  const pdfLib = async () => pdfMod || (pdfMod = await import(new URL(`./pdf.js?v=${VERSION}`, import.meta.url).href))

  const root = document.createElement('div')
  root.className = 'cs'
  const toastEl = document.createElement('div'); toastEl.className = 'cs-toast'
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 2600) }

  // ---- state
  let callsTotal = 0
  let screen = 'list', calls = [], callsNext = null, q = '', week = lsGet('cs-week2', false), sel = null, loadingCalls = false
  let info = null, rec = null, frames = [], saved = null, saving = '', lastLoad = 0
  const sections = lsGet('cs-sections', {})
  let sub = lsGet('cs-sub', ''), newSub = false
  const secOn = (k) => sections[k] !== false

  // ---- data
  async function loadCalls(more) {
    if (loadingCalls) return
    loadingCalls = true
    try {
      // Every call, 500 a page (Echo's largest), following its cursor to the end.
      let rows = more ? [...calls] : [], before = more ? callsNext : null
      for (let n = 0; n < 20; n++) {
        const d = await getJson(`api/calls?limit=500${q ? `&q=${encodeURIComponent(q)}` : ''}${before ? `&before=${encodeURIComponent(before)}` : ''}`)
        rows = rows.concat((d.calls || []).filter((c) => c && c.name && !c.memo && c.status !== 'recording'))
        before = d.next || null
        if (!before) break
      }
      calls = rows
      callsNext = before
      callsTotal = calls.length
      // The selection follows the list: a call the search hides gives way to the first one shown.
      if (screen === 'list' && !calls.some((c) => c.name === sel)) { sel = calls.length ? (calls.find(ready) || calls[0]).name : null; rec = null; if (sel) loadView() }
    } catch (e) { toast("Couldn't read your calls: " + (e.message || e)) } finally { loadingCalls = false; draw() }
  }
  async function loadView() {
    lastLoad = Date.now()
    try {
      const keep = pending && rec && rec.doc && rec.call === sel ? rec.doc : null
      info = await ctx.call('view', { call: sel || '' }); rec = info.draft
      // An edit not saved yet stays (the host's copy is older), unless Claude is rewriting.
      if (keep && rec && rec.state !== 'running') rec.doc = keep
    } catch (e) { toast("Couldn't read the summary: " + (e.message || e)) }
    draw()
  }
  async function loadFrames(call) {
    try { const d = await getJson(`api/call/${encodeURIComponent(call)}`); frames = (d.frames || []).filter((f) => f && f.url && typeof f.t === 'number').sort((a, b) => a.t - b.t) } catch { frames = [] }
    draw()
  }
  const busy = () => rec && rec.state === 'running'
  const ready = (c) => !c || !c.status || c.status === 'notes'
  const callOf = (name) => calls.find((c) => c.name === name) || { name, title: name }

  /** Echo loads a plugin's window half when it starts: after an update, say so until it is reopened. */
  const staleHtml = () => {
    const v = info && (info.installed || info.version)
    return v && v !== VERSION ? `<div class="cs-wait" style="margin:12px 28px 0;text-align:left">Call Summary ${esc(v)} is installed, but this window still runs ${VERSION}. Quit Echo and open it again to use the new version.</div>` : ''
  }
  // ---- list
  const startedAt = (c) => (c.started_at ? new Date(c.started_at) : null)
  const whenShort = (c) => { const d = startedAt(c); return d ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '' }
  const whenLong = (c) => { const d = startedAt(c); if (!d) return ''; const end = c.minutes ? new Date(d.getTime() + c.minutes * 60000) : null; const t = (x) => x.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); return `${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · ${t(d)}${end ? ' to ' + t(end) : ''}` }
  function listHtml() {
    const madeSet = new Set((info && info.madeCalls) || [])
    const cutoff = Date.now() - 7 * 864e5
    const rows = calls.filter((c) => !week || q || (startedAt(c) && startedAt(c).getTime() >= cutoff))
    const row = (c) => `<button class="cs-row${c.name === sel ? ' on' : ''}" data-cs-sel="${esc(c.name)}"><span class="t">${esc(whenShort(c))}</span><span class="nm">${esc(c.title || c.name)}</span>${madeSet.has(c.name) ? '<span class="cs-tag">PDF made</span>' : !ready(c) ? '<span class="cs-tag" style="border-color:var(--rule);color:var(--muted)">No minutes yet</span>' : '<span></span>'}<span class="sub">${esc([c.minutes ? `${c.minutes} min` : '', (c.people || []).length ? `${c.people.length} people` : '', c.frames ? 'shared screens' : '', c.imported ? 'from a Teams transcript' : ''].filter(Boolean).join(' · '))}</span></button>`
    const c = sel && callOf(sel)
    const made = ((info && info.made) || []).filter((m) => m.call === sel)
    const people = c && (c.people || []).map((p) => (typeof p === 'string' ? p : p.name || p.display || '')).filter(Boolean)
    return `<div class="cs-list">
      <header class="cs-band"><p class="cs-lbl">Call summaries</p><h1>Share a call as a PDF</h1><p>Pick any call Echo recorded. Claude writes the notes, you choose the screens and check it, and the PDF is saved for you to email.</p></header>
      ${staleHtml()}
      <div class="cs-find"><label for="cs-q" style="position:absolute;left:-9999px">Search calls</label><input id="cs-q" placeholder="Search calls, people, clients" value="${esc(q)}" autocomplete="off">
        <button class="cs-chip${!week ? ' on' : ''}" data-cs-week="0">All${callsTotal ? ` · ${callsTotal}` : ''}</button><button class="cs-chip${week ? ' on' : ''}" data-cs-week="1">This week</button></div>
      <div class="cs-rows">${rows.length ? rows.map(row).join('') : `<p class="cs-note" style="padding:18px 28px">${loadingCalls ? 'Reading your calls…' : q ? `No calls match “${esc(q)}”.` : 'No calls this week. Choose All to see older ones.'}</p>`}
        ${callsNext && (!week || q) ? '<button class="cs-pill cs-more" data-cs-more>Show older calls</button>' : ''}</div>
    </div>
    <div class="cs-pane">${c ? `
      <p class="cs-lbl">${esc(whenLong(c))}</p><h2>${esc(c.title || c.name)}</h2>
      ${!ready(c) && !(rec && rec.doc) ? `<p class="cs-note" style="font-size:14px;line-height:1.55">Echo hasn't written the minutes for this call yet${c.status === 'transcribing' ? ' (it is still transcribing)' : c.status === 'recording' ? ' (it is still recording)' : ''}. It does that about 15 minutes after a call ends, or later while another call is recording. A summary can be made once they're there.</p>` : ''}
      <div class="cs-bar"><button class="cs-pill pri" data-cs-open ${!ready(c) && !(rec && rec.doc) ? 'disabled' : ''}>${rec && rec.doc ? 'Open the summary' : 'Create summary PDF'}</button>${made.length ? '<button class="cs-pill" data-cs-copypath="0">Copy last PDF’s location</button>' : ''}</div>
      ${rec && rec.state === 'running' ? '<p class="cs-note">Claude is writing the summary…</p>' : rec && rec.state === 'failed' ? `<p class="cs-note cs-err">The last try failed: ${esc(rec.error || '')}</p>` : ''}
      <dl class="cs-facts">
        <dt>From the call</dt><dd>Echo's minutes, the transcript${c.chat ? ', the chat' : ''}${c.frames ? ' and the shared screens' : ''}; your Meeting Notebook page, if it has one</dd>
        ${people && people.length ? `<dt>People</dt><dd>${esc(people.slice(0, 14).join(', '))}${people.length > 14 ? ` and ${people.length - 14} more` : ''}</dd>` : ''}
        ${made.length ? `<dt>Last PDF</dt><dd>${esc(new Date(made[0].at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))} · ${made[0].pages} page${made[0].pages === 1 ? '' : 's'} · ${esc(size(made[0].bytes))}</dd>` : ''}
      </dl>
      <p class="cs-note" style="margin-top:auto">Also in Echo: <b>Create summary PDF</b> in a call's menu, and in ⌘K.</p>` : '<p class="cs-note">Pick a call on the left.</p>'}
    </div>`
  }
  const size = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB')

  // ---- build
  /** The call's frames, each with the summary's screen entry nearest to it (Claude's caption, include). */
  function shots() {
    const ds = (rec && rec.doc && rec.doc.screens) || []
    return frames.map((f) => {
      let best = null, d = 5
      for (const s of ds) { const e = Math.abs(s.t - f.t); if (e < d) { d = e; best = s } }
      return { t: f.t, url: f.url, entry: best, caption: best ? best.caption : '', include: best ? best.include : false }
    })
  }
  const ed = (path, value, ph, tag = 'div', cls = '') => `<${tag} class="ed ${cls}" contenteditable="${busy() ? 'false' : 'plaintext-only'}" data-cs-f="${esc(path)}" data-ph="${esc(ph)}" spellcheck="true">${esc(value)}</${tag}>`
  function pageHtml(d) {
    const sh = shots().filter((x) => x.include)
    const when = [d.date ? new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '', d.time].filter(Boolean).join(' · ')
    const list = (key, items, ph) => `${items.map((x, i) => `<div class="li"><span class="dot">•</span>${ed(`${key}.${i}`, x, ph)}<button class="x" data-cs-del="${key}.${i}" aria-label="Remove">✕</button></div>`).join('')}<button class="add" data-cs-add="${key}">+ Add</button>`
    const out = [`<div class="bar"></div><div class="eb">Meeting summary${when ? ' · ' + esc(when) : ''}</div>`, ed('title', d.title, 'Title', 'div', 'ttl'),
      `<div class="ppl">${esc((d.attendees || []).map((a) => (a.org ? `${a.name} (${a.org})` : a.name)).join(', '))}</div>`]
    if (secOn('summary')) out.push('<div class="sec">Summary</div>', ed('summary', d.summary, 'What the meeting was for and what came out of it'))
    if (secOn('decisions')) out.push('<div class="sec">Decisions</div>', list('decisions', d.decisions || [], 'A decision'))
    if (secOn('actions')) out.push('<div class="sec">Action items</div>', `<div class="tbl"><span class="h">Action</span><span class="h">Owner</span><span class="h">Due</span><span class="h"></span>${(d.actions || []).map((a, i) => `<span class="ar">${ed(`actions.${i}.text`, a.text, 'What')}${ed(`actions.${i}.owner`, a.owner, 'Who')}<span><input type="date" data-cs-f="actions.${i}.due" value="${esc(a.due)}" aria-label="Due date" ${busy() ? 'disabled' : ''}></span><button class="x" data-cs-del="actions.${i}" aria-label="Remove action">✕</button></span>`).join('')}</div><button class="add" data-cs-add="actions">+ Add</button>`)
    if (secOn('topics')) out.push('<div class="sec">Discussion</div>', ...(d.topics || []).map((t, i) => `<h4>${ed(`topics.${i}.heading`, t.heading, 'Topic')}</h4>${ed(`topics.${i}.body`, t.body, 'What was said and agreed')}`))
    if (secOn('questions') && (d.questions || []).length) out.push('<div class="sec">Open questions</div>', list('questions', d.questions, 'An open question'))
    if (secOn('screens') && sh.length) out.push('<div class="sec">Shared on screen</div>', ...sh.map((x) => `<figure><img src="${esc(x.url)}" alt="${esc(x.caption || 'Shared screen')}" data-cs-zoom="${esc(x.url)}"><figcaption><b>${clock(x.t)}</b>${x.entry ? ed(`screens.${(rec.doc.screens || []).indexOf(x.entry)}.caption`, x.caption, 'What it shows', 'span') : '<span>Shared screen</span>'}</figcaption></figure>`))
    if (secOn('attendees') && (d.attendees || []).length) out.push('<div class="sec">Attendees</div>', `<p style="margin:0">${esc(d.attendees.map((a) => (a.org ? `${a.name} (${a.org})` : a.name)).join(' · '))}</p>`)
    return out.join('')
  }
  function buildHtml() {
    const c = callOf(sel), d = rec && rec.doc, sh = shots()
    const aud = (rec && rec.audience) || lsGet('cs-aud', 'everyone')
    const hist = (rec && rec.history) || []
    const lastAsk = rec && rec.lastAsk
    const asks = (d && d.asks) || []
    return `<aside class="cs-opts" aria-label="Summary options">
      ${staleHtml().replace('margin:12px 28px 0', 'margin:0')}
      <div style="display:flex;flex-direction:column;gap:6px"><button class="cs-back" data-cs-go="list">‹ Calls · Summary PDF</button><h1>${esc(c.title || sel)}</h1></div>
      <fieldset><legend class="cs-lbl">Written for</legend><div class="cs-bar"><button class="cs-chip${aud === 'everyone' ? ' on' : ''}" data-cs-aud="everyone" ${busy() ? 'disabled' : ''}>Everyone on the call</button><button class="cs-chip${aud === 'team' ? ' on' : ''}" data-cs-aud="team" ${busy() ? 'disabled' : ''}>My team only</button></div>
        <p class="cs-note">${aud === 'team' ? 'For your team: internal context and candid remarks can stay.' : 'For everyone: no internal remarks, pricing talk or side conversations.'} Changing it writes the summary again.</p></fieldset>
      <fieldset><legend class="cs-lbl">Sections</legend>${SECTIONS.map(([k, label]) => `<label class="cs-check"><input type="checkbox" data-cs-sec="${k}" ${secOn(k) ? 'checked' : ''}> ${label}</label>`).join('')}</fieldset>
      ${sh.length ? `<fieldset><legend class="cs-lbl">Screens to include · ${sh.filter((x) => x.include).length} of ${sh.length}</legend><div class="cs-shots">${sh.map((x, i) => `<label class="cs-shot${x.include ? ' on' : ''}"><span class="im"><img loading="lazy" src="${esc(x.url)}" alt="${esc(x.caption || 'Shared screen')}"></span><span><input type="checkbox" data-cs-shot="${i}" ${x.include ? 'checked' : ''} ${busy() || !d ? 'disabled' : ''}> ${clock(x.t)}</span></label>`).join('')}</div></fieldset>` : ''}
      ${saveInHtml()}
      <div class="cs-bar"><button class="cs-pill pri" data-cs-save ${!d || busy() || saving ? 'disabled' : ''}>${saving ? esc(saving) : 'Save PDF'}</button><button class="cs-pill" data-cs-redo ${busy() ? 'disabled' : ''}>${d ? 'Write again' : 'Write it'}</button></div>
    </aside>
    <div class="cs-desk">
      <div class="cs-scroll">
        ${busy() ? `<div class="cs-wait">${rec.lastAsk ? `Claude is making your change: “${esc(rec.lastAsk)}”…` : 'Claude is writing the summary from the call. This takes a minute or two.'}</div>` : ''}
        ${rec && rec.state === 'failed' ? `<div class="cs-wait cs-err">Couldn't ${rec.lastAsk ? 'make the change' : 'write the summary'}: ${esc(rec.error || '')} <button class="cs-chip" data-cs-redo style="margin-left:8px">Try again</button></div>` : ''}
        ${d ? `<p class="cs-note">Preview · click any text to change it before you save</p><article class="cs-page" id="cs-page" aria-label="Summary preview">${pageHtml(d)}</article>` : busy() ? '' : '<p class="cs-note" style="margin-top:40px">No summary yet. Choose who it\'s for, then <b>Write it</b>.</p>'}
      </div>
      ${d ? `<section class="cs-ask" aria-label="Ask Claude to change the summary">
        <div class="cs-bar"><span class="cs-lbl">Ask Claude</span>${asks.map((a, i) => `<button class="cs-chip" data-cs-askchip="${i}" ${busy() ? 'disabled' : ''}>${esc(a)}</button>`).join('')}
          ${hist.length ? `<span class="cs-last">${lastAsk ? `Last change: “${esc(lastAsk.slice(0, 50))}${lastAsk.length > 50 ? '…' : ''}”` : 'Earlier version kept'}<button data-cs-undo ${busy() ? 'disabled' : ''}>Undo</button></span>` : ''}</div>
        <div class="cs-bar" style="flex-wrap:nowrap;align-items:flex-end"><label for="cs-askbox" style="position:absolute;left:-9999px">What should Claude change?</label><textarea id="cs-askbox" rows="2" placeholder="For example: lead with the pilot date, and say the security review is the main risk" ${busy() ? 'disabled' : ''}></textarea><button class="cs-pill ink" data-cs-ask ${busy() ? 'disabled' : ''}>Change it</button></div>
        <p class="cs-note">Claude rewrites from the same call, keeping your edits unless you ask otherwise. Every change can be undone.</p>
      </section>` : ''}
    </div>`
  }

  // ---- where the PDF goes
  const lastPart = (p) => String(p || '').replace(/\/+$/, '').split('/').pop()
  function saveInHtml() {
    const sv = (info && info.save) || {}
    const subs = [...new Set([...(sv.subfolders || []), ...(sub ? [sub] : [])])].sort((a, b) => a.localeCompare(b))
    const where = sv.linked && sv.chosen ? lastPart(sv.chosen) : 'Call Summary’s own folder'
    return `<fieldset style="margin-top:auto"><legend class="cs-lbl">Save in</legend>
      <div class="cs-bar" style="flex-wrap:nowrap"><span style="font-size:13.5px;white-space:nowrap">${esc(where)} ›</span>
        ${newSub ? `<label for="cs-newsub" style="position:absolute;left:-9999px">New folder name</label><input id="cs-newsub" class="cs-subin" placeholder="New folder, e.g. Corning" value="${esc(sub)}" maxlength="80">`
          : `<label for="cs-sub" style="position:absolute;left:-9999px">Subfolder</label><select id="cs-sub" class="cs-subin"><option value=""${sub ? '' : ' selected'}>(the folder itself)</option>${subs.map((x) => `<option${x === sub ? ' selected' : ''}>${esc(x)}</option>`).join('')}<option value="__new">New folder…</option></select>`}</div>
      ${sv.chosen && !sv.linked ? '<p class="cs-note cs-err">Your folder isn’t linked yet, so PDFs go to the plugin’s own folder. Settings → Call Summary has the one-time Terminal command.</p>' : !sv.chosen ? '<p class="cs-note">Choose your folder in Settings → Plugins → Call Summary → Save PDFs in.</p>' : ''}
    </fieldset>`
  }
  // ---- saved
  function savedHtml() {
    const s = saved, d = rec && rec.doc
    const all = ((info && info.made) || []).filter((m) => m.path !== (s && s.path)).slice(0, 8)
    return `<div class="cs-saved">
      <section>
        <p class="cs-lbl" style="color:var(--accent)">PDF saved</p><h1>${esc((d && d.title) || (s && s.title) || '')}</h1>
        <div class="cs-file"><svg width="36" height="44" viewBox="0 0 40 48" aria-hidden="true"><path d="M2 2h26l10 10v34H2z" fill="none" stroke="currentColor"/><path d="M28 2v10h10" fill="none" stroke="currentColor"/><rect x="6" y="30" width="24" height="10" fill="var(--accent)"/></svg>
          <div style="display:flex;flex-direction:column;gap:3px;min-width:0"><b>${esc(s.file)}</b><span class="cs-note">${s.pages} page${s.pages === 1 ? '' : 's'} · ${esc(size(s.bytes))} · in ${esc(s.path.slice(0, s.path.length - s.file.length - 1))}</span></div></div>
        <div class="cs-bar"><button class="cs-pill pri" data-cs-copypath="1">Copy file location</button><button class="cs-pill" data-cs-copymail>Copy email text</button><button class="cs-pill" data-cs-go="build">Back to the summary</button></div>
        <p class="cs-note" style="font-size:13.5px;line-height:1.6">Attach it in Outlook from that folder, or in the file picker press ⌘⇧G and paste the copied location. <b>Copy email text</b> gives you a subject and a short cover note, ready to paste.</p>
        ${all.length ? `<div><p class="cs-lbl" style="margin-bottom:4px">Earlier PDFs</p><div class="cs-made">${all.map((m, i) => `<div><span>${esc(m.file)}</span><span class="cs-note">${esc(new Date(m.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))} · ${m.pages} p.</span><button class="cs-chip" data-cs-copyold="${i}">Copy location</button></div>`).join('')}</div></div>` : ''}
      </section>
      ${d && d.email && (d.email.subject || d.email.body) ? `<aside class="cs-mail" aria-label="Email text"><p class="cs-lbl">Email text</p><p style="margin:0;font-size:13px"><b>Subject:</b> ${esc(d.email.subject)}</p><pre>${esc(d.email.body)}</pre></aside>` : ''}
    </div>`
  }

  // ---- drawing (never while the user types in the preview or the ask box)
  // Only the summary's own fields hold a redraw back; the search, ask and folder boxes are put back as they were.
  const typing = () => { const a = document.activeElement; return !!(a && root.contains(a) && (a.isContentEditable || (a.dataset && a.dataset.csF != null))) }
  let lastHtml = ''
  function draw(force) {
    if (!force && typing()) return
    const html = screen === 'build' ? buildHtml() : screen === 'saved' && saved ? savedHtml() : listHtml()
    if (html === lastHtml) return
    const scroller = root.querySelector('.cs-scroll'), top = scroller ? scroller.scrollTop : 0
    const askVal = (root.querySelector('#cs-askbox') || {}).value || ''
    const a = document.activeElement, keepId = a && root.contains(a) && a.id ? a.id : ''
    let selr = null; try { selr = keepId && a.selectionStart != null ? [a.selectionStart, a.selectionEnd] : null } catch { selr = null }
    root.innerHTML = html
    root.appendChild(toastEl)
    lastHtml = html
    const sc = root.querySelector('.cs-scroll'); if (sc) sc.scrollTop = top
    const ab = root.querySelector('#cs-askbox'); if (ab && askVal) ab.value = askVal
    if (keepId) { const el = root.querySelector('#' + keepId); if (el) { el.focus(); if (selr) try { el.setSelectionRange(selr[0], selr[1]) } catch { /* not a text box */ } } }
  }

  // ---- edits in the preview
  const setPath = (obj, path, v) => { const ks = path.split('.'); let o = obj; for (let i = 0; i < ks.length - 1; i++) { o = o[/^\d+$/.test(ks[i]) ? +ks[i] : ks[i]]; if (o == null) return } o[/^\d+$/.test(ks[ks.length - 1]) ? +ks[ks.length - 1] : ks[ks.length - 1]] = v }
  let saveT = null, pending = false
  const saveDoc = () => {
    pending = true; clearTimeout(saveT)
    saveT = setTimeout(() => { if (!rec || !rec.doc || busy()) { pending = false; return } ctx.call('save_doc', { call: sel, doc: rec.doc }).catch((e) => toast("Couldn't keep your edit: " + (e.message || e))).finally(() => { pending = false }) }, 700)
  }
  root.addEventListener('input', (e) => {
    const f = e.target.closest && e.target.closest('[data-cs-f]')
    if (f && rec && rec.doc) { setPath(rec.doc, f.dataset.csF, f.isContentEditable ? f.textContent : f.value); lastHtml = ''; saveDoc() }
    if (e.target.id === 'cs-newsub') { sub = e.target.value.trim() }
    if (e.target.id === 'cs-q') { q = e.target.value.trim(); clearTimeout(root._qt); root._qt = setTimeout(() => { callsNext = null; loadCalls(false) }, 300) }
  })
  root.addEventListener('focusout', () => setTimeout(() => { if (!typing()) draw() }, 50))
  root.addEventListener('change', (e) => {
    const t = e.target
    if (t.id === 'cs-sub') { if (t.value === '__new') { newSub = true; sub = ''; draw(true); const i = root.querySelector('#cs-newsub'); if (i) i.focus() } else { sub = t.value; lsSet('cs-sub', sub) } return }
    if (t.id === 'cs-newsub') { sub = t.value.trim(); lsSet('cs-sub', sub); return }
    if (t.dataset.csSec) { sections[t.dataset.csSec] = t.checked; lsSet('cs-sections', sections); draw(true); return }
    if (t.dataset.csShot != null && rec && rec.doc) {
      const x = shots()[+t.dataset.csShot]; if (!x) return
      if (x.entry) x.entry.include = t.checked
      else rec.doc.screens.push({ t: Math.round(x.t), caption: '', include: t.checked })
      saveDoc(); draw(true)
    }
  })
  root.addEventListener('keydown', (e) => {
    if (e.target.id === 'cs-askbox' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(e.target.value) }
    if (e.key === 'Escape') { const l = root.querySelector('.cs-lightbox'); if (l) l.remove() }
  })

  // ---- actions
  async function openBuild(call) {
    sel = call; screen = 'build'; saved = null; frames = []; draw(true)
    await loadView()
    loadFrames(call)
    // The first time only: a failed try is shown, with Try again, never retried by itself.
    if (!rec || (!rec.doc && (!rec.state || rec.state === 'idle'))) write()
  }
  async function write(audience) {
    const aud = audience || (rec && rec.audience) || lsGet('cs-aud', 'everyone')
    try { await ctx.call('draft', { call: sel, audience: aud }); rec = { ...(rec || {}), state: 'running', lastAsk: '', audience: aud }; draw(true); poll() } catch (e) { toast("Couldn't start: " + (e.message || e)) }
  }
  async function ask(text) {
    text = String(text || '').trim(); if (!text) { toast('Say what to change first'); return }
    clearTimeout(saveT); pending = false
    try { await ctx.call('revise', { call: sel, ask: text, doc: rec.doc }); rec = { ...rec, state: 'running', lastAsk: text }; const ab = root.querySelector('#cs-askbox'); if (ab) ab.value = ''; draw(true); poll() } catch (e) { toast("Couldn't start: " + (e.message || e)) }
  }
  function poll() { clearTimeout(poll.t); poll.t = setTimeout(async () => { await loadView(); if (busy()) poll(); else if (rec && rec.state === 'done') toast(rec.lastAsk ? 'Changed' : 'Summary written'); else if (rec && rec.state === 'failed') toast("Couldn't: " + (rec.error || 'something went wrong')) }, 3000) }
  const copy = async (s, ok) => { try { await navigator.clipboard.writeText(s); toast(ok) } catch { toast("Couldn't copy") } }

  async function jpegHex(url) {
    const im = new Image(); im.src = url; await im.decode()
    const sc = Math.min(1, 1400 / im.naturalWidth)
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc)
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height)
    const b64 = c.toDataURL('image/jpeg', 0.8).split(',')[1]
    const bin = atob(b64); let hex = ''
    for (let i = 0; i < bin.length; i++) hex += (bin.charCodeAt(i) + 256).toString(16).slice(1)
    return { hex, w: c.width, h: c.height }
  }
  async function savePdf() {
    if (!rec || !rec.doc) return
    clearTimeout(saveT); pending = false
    const d = rec.doc
    try {
      saving = 'Making the PDF…'; draw(true)
      await ctx.call('save_doc', { call: sel, doc: d })
      const lib = await pdfLib()
      const images = []
      if (secOn('screens')) for (const x of shots().filter((s) => s.include)) { try { images.push({ t: x.t, caption: x.caption, ...(await jpegHex(x.url)) }) } catch { /* that image is gone */ } }
      const { pdf, pages } = lib.makePdf(d, { paper: (info && info.paper) || 'letter', me: (info && info.me) || '', sections: Object.fromEntries(SECTIONS.map(([k]) => [k, secOn(k)])), images })
      // Parts that stay under the URL limit once encoded.
      const parts = []
      for (let i = 0; i < pdf.length;) { let n = 30000; while (n > 1000 && encodeURIComponent(pdf.slice(i, i + n)).length > 45000) n = Math.floor(n * 0.7); parts.push(pdf.slice(i, i + n)); i += n }
      const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
      for (let i = 0; i < parts.length; i++) { saving = `Saving… ${Math.round((i / parts.length) * 100)}%`; if (i % 4 === 0) draw(true); await ctx.call('save_part', { id, i, data: parts[i] }) }
      const name = `${d.date ? d.date + ' ' : ''}${d.title || 'Meeting'}`.replace(/[\\/:*?"<>|#%{}~&]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110) + ' - Summary.pdf'
      saved = await ctx.call('save_pdf', { id, count: parts.length, call: sel, name, pages, title: d.title, date: d.date, sub })
      newSub = false; lsSet('cs-sub', sub)
      saving = ''; screen = 'saved'
      await loadView()
      copy(saved.path, 'PDF saved · its location is copied')
    } catch (e) { saving = ''; draw(true); toast("Couldn't save the PDF: " + (e.message || e)) }
  }

  root.addEventListener('click', async (e) => {
    const z = e.target.closest('[data-cs-zoom]')
    if (z && !e.target.closest('[contenteditable="plaintext-only"]')) { const o = document.createElement('div'); o.className = 'cs-lightbox'; const im = document.createElement('img'); im.src = z.dataset.csZoom; o.appendChild(im); o.onclick = () => o.remove(); root.appendChild(o); return }
    const b = e.target.closest('button'); if (!b) return
    const ds = b.dataset
    if (ds.csSel) { sel = ds.csSel; rec = null; draw(true); loadView(); return }
    if (ds.csWeek) { week = ds.csWeek === '1'; lsSet('cs-week2', week); draw(true); return }
    if (ds.csMore !== undefined) { loadCalls(true); return }
    if (ds.csOpen !== undefined) { openBuild(sel); return }
    if (ds.csGo) { screen = ds.csGo; if (screen === 'list') loadView(); draw(true); return }
    if (ds.csAud) { if ((rec && rec.audience) === ds.csAud && rec.doc) return; lsSet('cs-aud', ds.csAud); write(ds.csAud); return }
    if (ds.csRedo !== undefined) { write(); return }
    if (ds.csAsk !== undefined) { ask((root.querySelector('#cs-askbox') || {}).value); return }
    if (ds.csAskchip != null) { const a = ((rec && rec.doc && rec.doc.asks) || [])[+ds.csAskchip]; if (a) ask(a); return }
    if (ds.csUndo !== undefined) { try { const r = await ctx.call('undo', { call: sel }); rec = r.draft; lastHtml = ''; draw(true); toast(`Undone: ${r.undid}`) } catch (err) { toast("Couldn't undo: " + (err.message || err)) } return }
    if (ds.csSave !== undefined) { savePdf(); return }
    const pathOf = (m) => (m && (m.path || `${info.legacy}/${m.file}`)) || ''
    if (ds.csCopypath) { const p = ds.csCopypath === '1' && saved ? saved.path : pathOf(((info && info.made) || []).find((m) => m.call === sel)); if (p) copy(p, 'Location copied'); return }
    if (ds.csCopyold != null) { const all = ((info && info.made) || []).filter((m) => m.path !== (saved && saved.path)); const m = all[+ds.csCopyold]; if (m) copy(pathOf(m), 'Location copied'); return }
    if (ds.csCopymail !== undefined) { const d = rec && rec.doc; if (d) copy(`Subject: ${d.email.subject}\n\n${d.email.body}`, 'Email text copied'); return }
    if (ds.csDel && rec && rec.doc) { const [k, i] = ds.csDel.split('.'); rec.doc[k].splice(+i, 1); saveDoc(); draw(true); return }
    if (ds.csAdd && rec && rec.doc) {
      const k = ds.csAdd; rec.doc[k] = rec.doc[k] || []
      rec.doc[k].push(k === 'actions' ? { text: '', owner: '', due: '' } : '')
      draw(true)
      const sel2 = k === 'actions' ? `[data-cs-f="actions.${rec.doc[k].length - 1}.text"]` : `[data-cs-f="${k}.${rec.doc[k].length - 1}"]`
      const el = root.querySelector(sel2); if (el) el.focus()
    }
  })

  // ---- Echo's side
  ctx.activities.add({
    id: 'summaries',
    label: 'Summaries',
    icon: ICON(20),
    render: () => '<div class="cs-host"></div>',
    after(box) {
      const host = box.querySelector('.cs-host')
      if (host && root.parentNode !== host) host.appendChild(root)
      if (!calls.length && !loadingCalls) loadCalls(false)
      if (!info || (Date.now() - lastLoad > (busy() ? 3000 : 30000) && !typing())) loadView()
    },
  })
  if (ctx.slots) ctx.slots.add('call.menu', {
    label: 'Create summary PDF',
    icon: ICON(16),
    run: (t) => { const call = t && t.call && t.call.name; if (!call) return; ctx.go(ACTIVITY); setTimeout(() => openBuild(call), 50) },
  })
  // Settings → Call Summary: where PDFs go, and the one-time link to the chosen folder.
  let setInfo = null
  const loadSet = () => ctx.call('settings_view').then((v) => { setInfo = v; ctx.render && ctx.render() }).catch(() => {})
  if (ctx.settings && ctx.settings.section) ctx.settings.section({
    id: 'main',
    label: 'Call Summary',
    icon: ICON(18),
    render() {
      if (!setInfo) { loadSet(); return '<p class="set-sub">Reading…</p>' }
      const v = setInfo
      const state = !v.chosen ? 'No folder chosen: PDFs are saved in Call Summary’s own folder.' : v.linked ? `PDFs are saved in ${v.chosen}.` : `You chose ${v.chosen}, but it isn’t linked yet: PDFs still go to Call Summary’s own folder.`
      return ctx.ui.setCard('Where PDFs are saved', [
        `<p class="set-sub">${esc(state)}</p>`,
        `<p class="set-sub">1. Choose the folder in Settings → Plugins → Call Summary → <b>Save PDFs in</b>. When you save a PDF you pick one of its subfolders, or make one (a folder per client, say).</p>`,
        `<p class="set-sub">2. Echo lets a plugin write only inside its own folder, so link yours to it once: run this in Terminal${v.linked ? ' (again, if you chose a different folder since)' : ''}.</p>`,
        v.command ? `<pre class="cs-setcmd" style="white-space:pre-wrap;font-size:12px;padding:10px 12px;border:1px solid var(--line);border-radius:6px">${esc(v.command)}</pre><div style="display:flex;gap:8px;margin-top:8px"><button class="btn primary" data-cs-setcopy>Copy the command</button><button class="btn" data-cs-setcheck>Check again</button></div>` : '<p class="set-sub"><i>The command shows here once a folder is chosen.</i></p>',
      ])
    },
  })
  if (ctx.listen) ctx.listen('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-cs-setcopy],[data-cs-setcheck]')
    if (!b) return
    if (b.dataset.csSetcopy !== undefined && setInfo) navigator.clipboard.writeText(setInfo.command).then(() => ctx.ui.notice('Command copied: paste it in Terminal and press Return.')).catch(() => {})
    if (b.dataset.csSetcheck !== undefined) { setInfo = null; loadSet() }
  })
  if (ctx.palette) ctx.palette.add({ label: 'Create a call summary PDF', group: 'Call Summary', keywords: 'summary pdf share email minutes', run: () => { screen = 'list'; ctx.go(ACTIVITY) } })
}
