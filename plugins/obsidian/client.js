// Obsidian — the client half: its own Settings section. Vaults as vertical tabs (those waiting for the user first);
// the chosen vault: who it is for, what is inside, and what Claude will be told about it — each part edited in place.

const GEM = (n) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5 19 8l-2 10-5 3.5L7 18 5 8z"/><path d="M12 2.5 10 12l2 9.5M5 8l5 4 7 6M19 8l-9 4"/></svg>`
const SECTION = 'obsidian:main'
const PARTS = [
  ['what', 'What it is'],
  ['where', 'Where things are'],
  ['how', 'How notes are written'],
  ['can', 'What Claude can do'],
  ['leave', 'Leave alone'],
]
const KINDS = { engagement: 'Engagement', team: 'Team wiki', personal: 'Personal knowledge', journal: 'Journal', other: 'Notes' }
const COLORS = ['#4fb3d9', '#5f8fe0', '#e0a96d', '#b98cff', '#3ccf91', '#e07fa3', '#d9c84f', '#7fd0c0']

const CSS = `
.obs { display: flex; height: 100%; min-height: 0; margin: -24px -28px; }
.obs-tabs { width: 236px; flex: 0 0 236px; border-right: 1px solid var(--line); display: flex; flex-direction: column; gap: 1px; overflow: auto; padding-bottom: 10px; }
.obs-tabs .obs-top { display: flex; align-items: center; gap: 8px; padding: 16px 12px 8px; }
.obs-tabs .obs-top b { font-size: 16px; font-weight: 650; flex: 1; }
.obs-q { margin: 0 12px 6px; }
.obs-g { font-size: 10.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; margin: 10px 14px 4px; }
.obs-t { display: flex; align-items: center; gap: 9px; margin: 0 6px; padding: 6px 8px; border-radius: 7px; border: 0; background: none; color: inherit; font: inherit; text-align: left; }
.obs-t:hover { background: var(--hover); }
.obs-t.on { background: var(--accent-soft); box-shadow: inset 2px 0 0 var(--accent); }
.obs-t .n { font-size: 13px; font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.obs-t.on .n { font-weight: 650; }
.obs-t .s { font-size: 11.5px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.obs-dot { width: 7px; height: 7px; border-radius: 4px; flex: none; background: var(--text-3); }
.obs-dot.ok { background: var(--ok, #3ccf91); } .obs-dot.warn { background: var(--warn, #f0a24a); } .obs-dot.bad { background: var(--danger, #ff6b81); }
.obs-main { flex: 1; min-width: 0; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; overflow: auto; }
.obs-head { display: flex; align-items: center; gap: 12px; }
.obs-icon { width: 42px; height: 42px; border-radius: 12px; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; flex: none; }
.obs-name { font-size: 19px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.obs-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); margin-top: 2px; white-space: nowrap; overflow: hidden; flex-wrap: wrap; }
.obs-meta .sep { opacity: 0.6; }
.obs-cl { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 8px; border-radius: 10px; font-size: 11.5px; font-weight: 600; background: rgba(79,179,217,0.16); color: #3a9cc4; }
.obs-cl button { border: 0; background: none; color: inherit; padding: 0; font: inherit; opacity: 0.7; }
.obs-meta select { height: 22px; font-size: 11.5px; border-radius: 6px; border: 1px dashed var(--line-strong); background: transparent; color: var(--text-2); }
.obs-ib { width: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
.obs-banner { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; background: rgba(240,162,74,0.08); border: 1px solid rgba(240,162,74,0.3); font-size: 13px; }
.obs-banner.busy { background: var(--accent-soft); border-color: var(--line); }
.obs-banner.bad { background: rgba(255,107,129,0.08); border-color: rgba(255,107,129,0.35); }
.obs-bar { display: flex; gap: 2px; height: 12px; border-radius: 6px; overflow: hidden; }
.obs-bar i { display: block; height: 100%; }
.obs-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 8px; }
.obs-legend span { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.obs-legend .sk { color: var(--text-3); }
.obs-legend .sw { width: 9px; height: 9px; border-radius: 3px; }
.obs-legend .c { color: var(--text-3); }
.obs-card { border: 1px solid var(--line); border-radius: 10px; padding: 10px 16px 12px; }
.obs-when { border: 1px solid var(--accent-line, rgba(155,120,255,0.35)); background: var(--accent-soft); border-radius: 8px; padding: 9px 12px; margin: 4px 0 6px; cursor: text; }
.obs-when .l { font-size: 11px; font-weight: 650; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; }
.obs-when .t { font-size: 13.5px; line-height: 1.55; margin-top: 2px; }
.obs-part { display: grid; grid-template-columns: 160px minmax(0,1fr); gap: 14px; padding: 8px 6px; border-radius: 8px; border-top: 1px solid var(--line); cursor: text; }
.obs-part:hover, .obs-when:hover { background: var(--hover); }
.obs-part .l { font-size: 12px; font-weight: 600; color: var(--text-2); padding-top: 1px; }
.obs-part .t { font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.obs-part .t:empty::before { content: 'Nothing yet — click to write it'; color: var(--text-3); }
.obs-edit textarea { width: 100%; box-sizing: border-box; min-height: 90px; resize: vertical; font: inherit; font-size: 13px; line-height: 1.55; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--accent); background: var(--bg); color: var(--text); }
.obs-edit .row { display: flex; gap: 6px; justify-content: flex-end; margin-top: 6px; }
.obs-empty { margin: auto; max-width: 440px; text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; }
.obs-menu { position: relative; }
.obs-menu .pop { position: absolute; right: 0; top: 32px; z-index: 5; background: var(--panel, var(--bg)); border: 1px solid var(--line-strong); border-radius: 8px; padding: 4px; min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.obs-menu .pop button { display: block; width: 100%; text-align: left; border: 0; background: none; color: inherit; font: inherit; font-size: 12.5px; padding: 6px 10px; border-radius: 5px; }
.obs-menu .pop button:hover { background: var(--hover); }
.obs-menu .pop .danger { color: var(--danger, #ff6b81); }
`

export function apply(ctx) {
  const { esc } = ctx.ui
  let data = null, error = '', sel = null, q = '', editing = null, draft = '', menu = false, removing = false

  if (!document.getElementById('obs-css')) {
    const st = document.createElement('style')
    st.id = 'obs-css'
    st.textContent = CSS
    document.head.appendChild(st)
  }
  const here = () => { const w = ctx.where(); return w.view === 'settings' && w.section === SECTION }
  const load = async () => {
    try { data = await ctx.call('view'); error = '' } catch (e) { error = e.message }
    if (data && (!sel || !data.vaults.some((v) => v.id === sel))) sel = (data.vaults.find((v) => v.state !== 'ready') || data.vaults[0] || {}).id || null
    if (!editing) ctx.render()
    if (here() && data && data.vaults.some((v) => v.state === 'analysing')) setTimeout(load, 2500)
  }
  const op = async (command, args) => {
    try { const r = await ctx.call(command, args); error = ''; await load(); return r } catch (e) { error = e.message; ctx.render(); return null }
  }
  const ago = (secs) => { if (!secs) return ''; const m = Math.round((Date.now() / 1000 - secs) / 60); return m < 60 ? `changed ${Math.max(1, m)} min ago` : m < 48 * 60 ? `changed ${Math.round(m / 60)} h ago` : `changed ${Math.round(m / 1440)} days ago` }
  const nameOf = (b) => (b.client ? (data.clients.find((c) => c.id === b.client) || {}).name : (data.threads.find((t) => t.id === b.thread) || {}).name) || b.client || b.thread
  const forWhom = (v) => (v.belongs || []).map(nameOf).join(', ')
  const dot = (v) => (v.state === 'ready' ? 'ok' : v.state === 'failed' ? 'bad' : v.state === 'review' ? 'warn' : '')
  const sub = (v) => v.state === 'analysing' ? 'Reading it…' : v.state === 'failed' ? 'Couldn’t be read' : v.state === 'review' ? 'Check the description' : `${v.notes != null ? `${Number(v.notes).toLocaleString()} notes · ` : ''}${forWhom(v) || 'yours'}`

  const tabs = () => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const match = (v) => !words.length || words.every((w) => `${v.name} ${forWhom(v)} ${(v.description || {}).when || ''}`.toLowerCase().includes(w))
    const shown = data.vaults.filter(match)
    const needs = shown.filter((v) => v.state !== 'ready')
    const ready = shown.filter((v) => v.state === 'ready').sort((a, b) => a.name.localeCompare(b.name))
    const tab = (v) => `<button class="obs-t${v.id === sel ? ' on' : ''}" data-obs-sel="${esc(v.id)}"><span class="obs-dot ${dot(v)}"></span><span style="min-width:0;flex:1"><div class="n">${esc(v.name)}</div><div class="s">${esc(sub(v))}</div></span></button>`
    return `<div class="obs-tabs">
      <div class="obs-top"><b>Obsidian</b><button class="btn primary" data-obs-add style="height:24px;padding:0 9px">+ Vault</button></div>
      ${data.vaults.length > 6 ? `<input class="search obs-q" id="obs-q" value="${esc(q)}" placeholder="Find a vault or client" aria-label="Find a vault">` : ''}
      ${needs.length ? `<div class="obs-g">Needs you</div>${needs.map(tab).join('')}` : ''}
      ${ready.length ? `<div class="obs-g">Vaults · ${ready.length}</div>${ready.map(tab).join('')}` : ''}
      ${words.length && !shown.length ? '<p class="set-sub" style="padding:0 14px">Nothing matches.</p>' : ''}
    </div>`
  }

  const part = (v, key, label, text) => {
    if (editing === key) {
      return `<div class="obs-part obs-edit" style="cursor:default"><div class="l">${esc(label)}</div><div><textarea id="obs-draft" data-obs-key="${key}" ${key === 'when' ? 'maxlength="250"' : ''}>${esc(draft)}</textarea>
        <div class="row">${key === 'when' ? `<span class="set-sub" style="margin-right:auto">${draft.length}/250 — the only line Claude sees until it opens the vault</span>` : ''}<button class="btn" data-obs-cancel>Cancel</button><button class="btn primary" data-obs-save="${key}">Save</button></div></div></div>`
    }
    if (key === 'when') return `<div class="obs-when" data-obs-edit="when" title="Click to change it"><div class="l">When Claude looks here</div><div class="t">${esc(text || 'Nothing yet — click to write it')}</div><div class="set-sub" style="margin-top:4px">Claude finds your vaults by this line when an answer may be in your notes, and reads the rest only then${forWhom(v) ? ` · on ${esc(forWhom(v))}’s pages it is pointed straight here` : ''}</div></div>`
    return `<div class="obs-part" data-obs-edit="${key}" title="Click to change it"><div class="l">${esc(label)}</div><div class="t">${esc(text || '')}</div></div>`
  }

  const detail = (v) => {
    const d = v.description || {}
    const kind = KINDS[v.kind] || 'Vault'
    const chips = (v.belongs || []).map((b, i) => `<span class="obs-cl">${esc(nameOf(b))}<button data-obs-unbelong="${i}" aria-label="Not for ${esc(nameOf(b))}">×</button></span>`).join('')
    const taken = new Set((v.belongs || []).map((b) => b.client || b.thread))
    const options = [...data.clients.filter((c) => !taken.has(c.id)).map((c) => `<option value="client:${esc(c.id)}">${esc(c.name)}</option>`), ...data.threads.filter((t) => !taken.has(t.id)).map((t) => `<option value="thread:${esc(t.id)}">Thread · ${esc(t.name)}</option>`)].join('')
    const add = options ? `<select data-obs-belong aria-label="For a client or thread"><option value="">+ for…</option>${options}</select>` : ''
    const meta = [`<span>${esc(kind)}</span>`, chips || add ? `<span class="sep">·</span><span>for</span>${chips}${add}` : '', v.notes != null ? `<span class="sep">·</span><span>${Number(v.notes).toLocaleString()} notes</span>` : '', v.latest ? `<span class="sep">·</span><span>${ago(v.latest)}</span>` : '', v.git ? '<span class="sep">·</span><span>kept in git</span>' : ''].join('')
    const openUrl = `obsidian://open?path=${encodeURIComponent(v.root)}`
    const head = `<div class="obs-head"><span class="obs-icon">${GEM(22)}</span>
      <div style="flex:1;min-width:0"><div class="obs-name" title="${esc(v.root)}">${esc(v.name)}</div><div class="obs-meta">${meta}</div></div>
      <a class="btn obs-ib" data-ext href="${esc(openUrl)}" title="Open in Obsidian" aria-label="Open in Obsidian">↗</a>
      <span class="obs-menu"><button class="btn obs-ib" data-obs-menu aria-label="More">⋯</button>${menu ? `<div class="pop"><button data-obs-again>Read it again</button><button data-obs-rename>Rename…</button><button class="danger" data-obs-remove>Remove from Echo</button></div>` : ''}</span></div>`
    const banner = v.state === 'analysing' ? `<div class="obs-banner busy"><span class="spinner"></span><div style="flex:1"><b>Echo is reading ${esc(v.name)}.</b> It looks at the folders and the first lines of some notes, then Claude describes it — about a minute.</div></div>`
      : v.state === 'failed' ? `<div class="obs-banner bad"><div style="flex:1"><b>It couldn’t be read.</b> ${esc(v.error || '')}</div><button class="btn primary" data-obs-again>Try again</button></div>`
      : v.state === 'review' ? `<div class="obs-banner"><span class="obs-dot warn"></span><div style="flex:1"><b>Echo read this vault for the first time.</b> Check what Claude will be told about it, fix what’s wrong, then confirm.</div><button class="btn primary" data-obs-confirm>Looks right</button></div>`
      : v.proposed ? `<div class="obs-banner"><div style="flex:1"><b>Echo read it again.</b> A new description is ready — yours stays until you choose.</div><button class="btn" data-obs-proposed="0">Keep mine</button><button class="btn primary" data-obs-proposed="1">Use the new one</button></div>` : ''
    const removeAsk = removing ? `<div class="confirm"><span>Remove ${esc(v.name)} from Echo? Claude in Echo stops seeing it; the vault itself isn’t touched.</span><button class="btn" data-obs-remove-cancel>Cancel</button><button class="btn primary" style="background:var(--danger);border-color:var(--danger)" data-obs-remove-yes>Remove</button></div>` : ''
    const inside = (v.inside || []).slice(0, 10)
    const total = inside.reduce((n, f) => n + f.n, 0)
    const insideCard = inside.length ? `<section><div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px"><b style="font-size:13px;font-weight:650;flex:1">What’s inside</b><span class="set-sub">${Number(v.notes || total).toLocaleString()} notes</span></div>
      <div class="obs-bar">${inside.map((f, i) => `<i style="flex:${f.n};background:${f.skip ? 'var(--line-strong)' : COLORS[i % COLORS.length]}" title="${esc(f.name)}: ${f.n}"></i>`).join('')}</div>
      <div class="obs-legend">${inside.map((f, i) => `<span class="${f.skip ? 'sk' : ''}"><span class="sw" style="background:${f.skip ? 'var(--line-strong)' : COLORS[i % COLORS.length]}"></span>${esc(f.name)}${f.skip ? ' · left alone' : ''} <span class="c">${f.n}</span></span>`).join('')}</div></section>` : ''
    const desc = v.state === 'analysing' && !d.when ? '' : `<section class="obs-card"><div style="display:flex;align-items:center;gap:8px;margin:2px 0 4px"><b style="font-size:13px;font-weight:650;flex:1">What Claude knows about it</b><span class="set-sub">click any part to change it</span></div>
      ${part(v, 'when', 'When Claude looks here', d.when)}${PARTS.map(([k, l]) => part(v, k, l, d[k])).join('')}</section>`
    return `<div class="obs-main">${head}${removeAsk}${banner}${error ? `<p class="error">${esc(error)}</p>` : ''}${insideCard}${desc}</div>`
  }

  ctx.settings.section({
    id: 'main',
    label: 'Obsidian',
    icon: GEM(16),
    badge: () => (data ? data.vaults.filter((v) => v.state === 'review' || v.state === 'failed').length || '' : ''),
    render() {
      if (!data) { if (!error) load(); return error ? `<p class="error">${esc(error)}</p>` : '<div class="skeleton" style="padding:20px"><i></i><i></i></div>' }
      if (!data.vaults.length) {
        return `<div class="obs-empty" style="padding-top:80px"><span class="obs-icon">${GEM(22)}</span><h2 style="margin:0">Your Obsidian vaults</h2>
          <p class="set-sub">Connect a vault you already have. Echo reads it and describes it for Claude — what it is, where things are, what Claude may do with it — you correct that, and Claude in Echo knows where to look. Your vault isn’t changed by Echo.</p>
          <button class="btn primary" data-obs-add>+ Vault</button>${error ? `<p class="error">${esc(error)}</p>` : ''}</div>`
      }
      const v = data.vaults.find((x) => x.id === sel) || data.vaults[0]
      return `<div class="obs">${tabs()}${detail(v)}</div>`
    },
  })
  ctx.settings.add({ render: () => ctx.ui.setCard('', [ctx.ui.setRow('Vaults', `${data ? data.vaults.length : '…'} connected — set them up in their own section.`, '<button class="btn" data-obs-open>Open</button>')]) })
  ctx.palette.add({ label: 'Obsidian: vaults', keywords: 'obsidian vault notes knowledge', run: () => ctx.go(`settings/${SECTION}`) })
  ctx.palette.add({ label: 'Obsidian: connect a vault', keywords: 'obsidian vault add connect', run: () => { ctx.go(`settings/${SECTION}`); op('add') } })

  const cur = () => data && data.vaults.find((v) => v.id === sel)
  document.addEventListener('click', async (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-obs-sel],[data-obs-add],[data-obs-edit],[data-obs-cancel],[data-obs-save],[data-obs-confirm],[data-obs-again],[data-obs-menu],[data-obs-remove],[data-obs-remove-yes],[data-obs-remove-cancel],[data-obs-rename],[data-obs-unbelong],[data-obs-proposed],[data-obs-open]')
    if (!t) { if (menu && here()) { menu = false; ctx.render() } return }
    const d = t.dataset
    if ('obsOpen' in d) return ctx.go(`settings/${SECTION}`)
    if (d.obsSel) { sel = d.obsSel; editing = null; menu = false; removing = false; return ctx.render() }
    if ('obsAdd' in d) { const r = await op('add'); if (r && r.id) { sel = r.id; await load() } return }
    if (d.obsEdit) { if (editing) return; const v = cur(); editing = d.obsEdit; draft = (v.description || {})[editing] || ''; ctx.render(); const ta = document.getElementById('obs-draft'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) } return }
    if ('obsCancel' in d) { editing = null; return ctx.render() }
    if (d.obsSave) { const ta = document.getElementById('obs-draft'); const key = d.obsSave; editing = null; await op('save', { id: sel, key, text: ta ? ta.value : draft }); return }
    if ('obsConfirm' in d) return op('confirm', { id: sel })
    if ('obsAgain' in d) { menu = false; return op('analyse', { id: sel }) }
    if ('obsMenu' in d) { ev.stopPropagation(); menu = !menu; return ctx.render() }
    if ('obsRemove' in d) { menu = false; removing = true; return ctx.render() }
    if ('obsRemoveCancel' in d) { removing = false; return ctx.render() }
    if ('obsRemoveYes' in d) { removing = false; const id = sel; sel = null; return op('remove', { id }) }
    if ('obsRename' in d) {
      menu = false
      const v = cur()
      editing = null
      ctx.render()
      // Renamed in place (the window has no prompt dialog): Enter keeps it, Esc drops it.
      const el = document.querySelector('.obs-name')
      if (el) {
        el.contentEditable = 'true'; el.focus()
        const done = (keep) => { el.contentEditable = 'false'; const n = el.textContent.trim(); if (keep && n && n !== v.name) op('rename', { id: v.id, name: n }); else ctx.render() }
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(true) } if (e.key === 'Escape') done(false) })
        el.addEventListener('blur', () => done(true), { once: true })
      }
      return
    }
    if (d.obsUnbelong != null) { const v = cur(); const b = (v.belongs || []).filter((_, i) => i !== +d.obsUnbelong); return op('belongs', { id: v.id, belongs: b }) }
    if (d.obsProposed != null) return op('take_proposed', { id: sel, take: d.obsProposed === '1' })
  })
  document.addEventListener('change', (ev) => {
    const t = ev.target
    if (t.matches && t.matches('[data-obs-belong]') && t.value) {
      const v = cur()
      const [kind, id] = t.value.split(':')
      op('belongs', { id: v.id, belongs: [...(v.belongs || []), { [kind]: id }] })
    }
  })
  document.addEventListener('input', (ev) => {
    if (ev.target.id === 'obs-q') { q = ev.target.value; ctx.render(); const el = document.getElementById('obs-q'); if (el) { el.focus(); el.setSelectionRange(q.length, q.length) } }
    if (ev.target.id === 'obs-draft') { draft = ev.target.value; const c = ev.target.closest('.obs-edit') && ev.target.closest('.obs-edit').querySelector('.set-sub'); if (c && ev.target.dataset.obsKey === 'when') c.textContent = `${draft.length}/250 — the only line Claude sees until it opens the vault` }
  })
}
