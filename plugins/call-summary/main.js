// Call Summary — the host half (runs inside Echo).
//
// Turns one Echo call into a summary to share as a PDF. Claude writes the summary from the call (Echo's
// minutes, the transcript, the invite, the chat, the shared screens and the Meeting Notebook page when there is
// one); the user edits it, asks Claude for changes in their own words (each one can be undone), and the window
// builds the PDF, which is saved here.
//
//   drafts/<call>.json   {call, state: idle|running|done|failed, error, at, audience, doc, history[{doc, ask, at}], model}
//   pdfs/<file>.pdf      the saved PDFs (plain ASCII PDF files, so the text store can hold them)
//   made.json            [{call, file, title, date, pages, bytes, at}], newest first
//   runs/<stamp>/        each Claude run's prompt, answer and log (the last 30 kept)

const KEEP_RUNS = 30
const KEEP_HISTORY = 20
const MAX_TRANSCRIPT = 100000

const str = (v) => (v == null ? '' : String(v))
const strs = (v) => (Array.isArray(v) ? v.map(str).map((x) => x.trim()).filter(Boolean) : [])
const ymd = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : '')
const validCall = (name) => /^[^\\/]{1,200}$/.test(str(name)) && !str(name).includes('..') && !/^\./.test(str(name))
const callName = (id) => str(id).replace(/^(call|memo):/, '')
const cut = (s, n) => (s.length > n ? s.slice(0, n) + '\n[… the rest is left out]' : s)

/** A summary as Claude (or the window) gave it, cleaned to its shape. */
export function cleanDoc(d, fallback = {}) {
  d = d && typeof d === 'object' ? d : {}
  const line = (v, n) => str(v).replace(/\s+/g, ' ').trim().slice(0, n)
  const para = (v, n) => str(v).replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n)
  return {
    title: line(d.title, 160) || fallback.title || 'Meeting summary',
    date: ymd(d.date) || fallback.date || '',
    time: line(d.time, 40),
    attendees: (Array.isArray(d.attendees) ? d.attendees : []).map((a) => (typeof a === 'string' ? { name: line(a, 80), org: '' } : { name: line(a && a.name, 80), org: line(a && a.org, 80) })).filter((a) => a.name).slice(0, 40),
    summary: para(d.summary, 2500),
    topics: (Array.isArray(d.topics) ? d.topics : []).map((t) => ({ heading: line(t && t.heading, 100), body: para(t && t.body, 3000) })).filter((t) => t.heading || t.body).slice(0, 14),
    decisions: strs(d.decisions).map((x) => line(x, 400)).slice(0, 20),
    actions: (Array.isArray(d.actions) ? d.actions : []).map((a) => ({ text: line(a && a.text, 300), owner: line(a && a.owner, 80), due: ymd(a && a.due) })).filter((a) => a.text).slice(0, 40),
    questions: strs(d.questions).map((x) => line(x, 300)).slice(0, 15),
    screens: (Array.isArray(d.screens) ? d.screens : []).map((s) => ({ t: typeof (s && s.t) === 'number' && s.t >= 0 ? Math.round(s.t) : -1, caption: line(s && s.caption, 300), include: !!(s && s.include) })).filter((s) => s.t >= 0).slice(0, 40),
    email: { subject: line(d.email && d.email.subject, 200), body: para(d.email && d.email.body, 4000) },
    asks: strs(d.asks).map((x) => line(x, 60)).slice(0, 4),
  }
}

/** The JSON object in a model's answer. */
export function parseAnswer(text) {
  const t = str(text)
  const a = t.indexOf('{'), b = t.lastIndexOf('}')
  if (a < 0 || b <= a) throw new Error('Claude answered without a summary')
  return JSON.parse(t.slice(a, b + 1))
}

const SHAPE = '{"title":"","date":"YYYY-MM-DD","time":"HH:MM–HH:MM","attendees":[{"name":"","org":""}],"summary":"","topics":[{"heading":"","body":""}],"decisions":[""],"actions":[{"text":"","owner":"","due":"YYYY-MM-DD or empty"}],"questions":[""],"screens":[{"t":0,"caption":"","include":true}],"email":{"subject":"","body":""},"asks":[""]}'

function sourcesText({ call, source }) {
  return `Read these in the data folder if they are there (read-only; skip any that is missing):
- \`calls/${call}/meeting.json\`: the invite (subject, start, end, organizer, attendees with email addresses).
- \`calls/${call}/actions.json\`: Echo's action items (task, owner, due).
- \`calls/${call}/chat.json\`: the meeting's Teams chat.
- \`calls/${call}/my-notes.md\`: notes the user typed during the call.
- \`calls/${call}/frames.jsonl\`: snapshots of what someone shared on screen, one per line {t (seconds into the call), file}. You may Read up to 6 of the images (\`calls/${call}/<file>\`) to see what they show.
- The user's Meeting Notebook page for this call, if there is one: \`.echo/plugins/meeting-notebook/filed.json\` maps call folders to page ids (the "${call}" entry's id; a folder may have been renamed, so match its date and time prefix), and the page is \`.echo/plugins/meeting-notebook/notes/<id>.json\`. Its summary, decisions, action items and the user's notes are the user's own corrections: they win over the minutes.
Use the Read tool, never Bash. Do not change anything.

ECHO'S TITLE FOR THE CALL: ${str(source.title) || '(none)'}
ECHO'S DATE: ${str(source.date) || '(unknown)'}

ECHO'S MINUTES (its "On screen" section describes the snapshots, by time):
${str(source.text) || '(none)'}

TRANSCRIPT:
${cut(str(source.transcript), MAX_TRANSCRIPT) || '(none)'}
`
}

const audienceRule = (audience) => audience === 'team'
  ? "It is for the user's own team: internal context, pricing and candid remarks may stay when they matter."
  : "It goes to everyone who was on the call, including people outside the user's company. Leave out anything not meant for them: colleagues' internal remarks about the client or partner, pricing and margin talk among colleagues, side conversations, gossip, and what was said before or after the others were there."

export function draftPrompt({ call, source, me, audience }) {
  return `You write the summary of one recorded call that the user will share as a PDF. ${audienceRule(audience)} Answer with JSON only, no other text.

${sourcesText({ call, source })}
The user is ${me ? `“${me}”` : 'the speaker called “Me” in the transcript'}.

Answer in exactly this shape:
${SHAPE}

How to fill it (plain text everywhere, no Markdown, no [mm:ss] times; write dates in words, like “Thursday, November 12”, and times like “8:30 am”, never as 2026-11-12):
- title: the meeting's subject, cleaned up. date: from the invite, else the call. time: local start and end, like "11:00–11:30".
- attendees: everyone who took part, full names, with their organisation when you know it.
- summary: 3 to 5 sentences: why the meeting happened, what came out of it, what happens next.
- topics: the 3 to 7 subjects discussed, in the order they came up. heading: 2 to 6 words. body: 2 to 6 sentences with the substance: names, numbers, dates, options weighed, what was agreed and what was left open. Thorough, but no filler and no repetition of the summary.
- decisions: what was clearly agreed, one plain sentence each. Empty when nothing was decided.
- actions: every commitment made: text (starting with a verb), owner (full name), due (a date only when one was said, else empty).
- questions: questions, risks and dependencies still open at the end. Empty when none.
- screens: one per useful snapshot in frames.jsonl, by its t: caption = what it shows, only what you can read or see (from the minutes' "On screen" line at that time, or the image); include = true when it is worth putting in the PDF. Leave out video tiles, the Teams interface and near-duplicates.
- email: a cover email for the PDF: subject, and body as plain text: a greeting, one line of thanks, 2 to 4 "- " bullets with the outcomes, the next steps with owners, a line saying the summary is attached, and the sign-off${me ? ` as ${me.split(' ')[0]}` : ''}.
- asks: 3 changes the user might want to ask for this summary, 2 to 6 words each (like "Shorter" or "More detail on the pilot").
Use only what the call says. Never invent names, numbers or dates; leave a field empty instead.
`
}

export function revisePrompt({ call, source, me, audience, doc, ask }) {
  return `You change the summary of a recorded call that the user will share as a PDF. ${audienceRule(audience)} Answer with JSON only, no other text.

THE USER ASKS: ${ask}

THE SUMMARY NOW (it includes the user's own edits):
${JSON.stringify(doc, null, 1)}

Make the change the user asks for, going back to the call itself when it needs more (the sources are below). Keep everything the request doesn't touch word for word, the user's own edits included. Answer with the whole summary in exactly the same shape, plain text, no Markdown, no [mm:ss] times, dates in words (like “November 12”). Keep "asks": 3 further changes the user might want, 2 to 6 words each. Never invent names, numbers or dates.
${me ? `The user is “${me}”.` : ''}

THE CALL
${sourcesText({ call, source })}`
}

/** A file name for the PDF: "<date> <title> - Summary.pdf", without characters a file name can't hold. */
export function pdfName(doc) {
  const base = `${doc.date ? doc.date + ' ' : ''}${doc.title || 'Meeting'}`.replace(/[\\/:*?"<>|#%{}~&]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110)
  return `${base} - Summary.pdf`
}

export function apply(ctx) {
  const running = new Set()
  const readJson = (path, d) => { try { const t = ctx.store.read(path); return t == null ? d : JSON.parse(t) } catch { return d } }
  const writeJson = (path, v) => ctx.store.write(path, JSON.stringify(v, null, 2))
  const setting = (key, d) => { try { const v = ctx.settings.get(key); return v == null || v === '' ? d : v } catch { return d } }
  const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  const prune = () => { const runs = ctx.store.list('runs'); while (runs.length > KEEP_RUNS) ctx.store.remove(`runs/${runs.shift()}`) }
  const dKey = (call) => `drafts/${call}.json`
  const getDraft = (call) => readJson(dKey(call), { call, state: 'idle', doc: null, history: [] })
  const putDraft = (rec) => writeJson(dKey(rec.call), rec)

  // A run cut off by a restart is not running any more.
  for (const f of ctx.store.list('drafts')) {
    const r = readJson(`drafts/${f}`, null)
    if (r && r.state === 'running') { r.state = r.doc ? 'done' : 'failed'; r.error = r.doc ? '' : 'Echo stopped while Claude was writing. Try again.'; writeJson(`drafts/${f}`, r) }
  }

  /** The call as Echo has it now; a folder renamed after its minutes is found again by its date and time. */
  const findCall = (call) => {
    try { const s = ctx.echo.read('source', `call:${call}`); if (s) return { call, source: s } } catch { /* renamed, or gone */ }
    const m = /^\d{4}-\d{2}-\d{2}_\d{6}/.exec(call)
    if (!m) return null
    let list = []
    try { list = ctx.echo.read('sources', { limit: 400 }) || [] } catch { list = [] }
    const hit = list.map((s) => callName(s && s.id)).find((n) => n && n !== call && n.startsWith(m[0]))
    if (!hit) return null
    try { const s = ctx.echo.read('source', `call:${hit}`); return s ? { call: hit, source: s } : null } catch { return null }
  }

  const me = () => str(setting('me', '')).trim()
  const work = async (call, kind, ask, docIn, audienceIn) => {
    if (!validCall(call)) throw new Error(`no call “${call}”`)
    if (running.has(call)) throw new Error('Claude is already working on this summary')
    const found = findCall(call)
    if (!found) {
      // Said on the draft, so the window shows it instead of waiting.
      const msg = "Echo hasn't written the minutes for this call yet. It does that about 15 minutes after a call ends (later while another call is recording). Then try again."
      putDraft({ ...getDraft(call), call, state: 'failed', error: msg, at: new Date().toISOString(), lastAsk: kind === 'revise' ? ask : '' })
      throw new Error(msg)
    }
    running.add(call)
    const rec = getDraft(call)
    const audience = audienceIn === 'team' || audienceIn === 'everyone' ? audienceIn : rec.audience || 'everyone'
    const before = kind === 'revise' ? cleanDoc(docIn || rec.doc || {}) : rec.doc
    putDraft({ ...rec, call, state: 'running', error: '', at: new Date().toISOString(), audience, lastAsk: kind === 'revise' ? ask : '', doc: kind === 'revise' ? before : rec.doc })
    try {
      const prompt = kind === 'revise'
        ? revisePrompt({ call: found.call, source: found.source, me: me(), audience, doc: before, ask })
        : draftPrompt({ call: found.call, source: found.source, me: me(), audience })
      const out = await ctx.claude.run({ title: `Summary: ${str(found.source.title) || call}`.slice(0, 80), prompt, tools: 'read', dir: `runs/${stamp()}` })
      prune()
      const doc = cleanDoc(parseAnswer(out.answer), { title: str(found.source.title), date: str(found.source.date).slice(0, 10) })
      const cur = getDraft(call)
      const history = before ? [...(cur.history || []), { doc: before, ask: kind === 'revise' ? ask : `Written again (${audience === 'team' ? 'my team' : 'everyone'})`, at: new Date().toISOString() }].slice(-KEEP_HISTORY) : (cur.history || [])
      const next = { ...cur, call, state: 'done', error: '', at: new Date().toISOString(), audience, doc, history, model: out.model || '', lastAsk: kind === 'revise' ? ask : '' }
      putDraft(next)
      return next
    } catch (e) {
      const cur = getDraft(call)
      putDraft({ ...cur, call, state: 'failed', error: String((e && e.message) || e), at: new Date().toISOString() })
      throw e
    } finally {
      running.delete(call)
    }
  }
  const start = (p) => { p.catch((e) => ctx.log('summary', (e && e.message) || e)); return { started: true } }

  const made = () => readJson('made.json', [])
  ctx.command('view', ({ call } = {}) => {
    const all = made()
    return {
      draft: call && validCall(call) ? getDraft(call) : null,
      running: [...running],
      made: call ? all.filter((m) => m.call === call) : all.slice(0, 40),
      madeCalls: [...new Set(all.map((m) => m.call))],
      me: me(),
      paper: /^a4$/i.test(str(setting('paper', 'letter')).trim()) ? 'a4' : 'letter',
      folder: ctx.store.path('pdfs'),
    }
  })
  ctx.command('draft', ({ call, audience }) => start(work(call, 'draft', '', null, audience)))
  ctx.command('draft_wait', ({ call, audience }) => work(call, 'draft', '', null, audience))
  ctx.command('revise', ({ call, ask, doc }) => { if (!str(ask).trim()) throw new Error('say what to change'); return start(work(call, 'revise', str(ask).trim().slice(0, 1000), doc)) })
  ctx.command('revise_wait', ({ call, ask, doc }) => work(call, 'revise', str(ask).trim().slice(0, 1000), doc))
  // The user's own edits in the window: kept as they are, no history entry.
  ctx.command('save_doc', ({ call, doc }) => {
    if (!validCall(call)) throw new Error(`no call “${call}”`)
    const rec = getDraft(call)
    if (rec.state === 'running') throw new Error('Claude is working on it: your edit would be lost')
    rec.doc = cleanDoc(doc, rec.doc || {})
    putDraft(rec)
    return { ok: true }
  })
  ctx.command('undo', ({ call }) => {
    const rec = getDraft(call)
    if (rec.state === 'running') throw new Error('Claude is working on it')
    const last = (rec.history || []).pop()
    if (!last) throw new Error('nothing to undo')
    rec.doc = last.doc
    putDraft(rec)
    return { draft: rec, undid: last.ask }
  })
  // The window's PDF comes in parts (a command's arguments travel in its URL, which holds about 64 KB):
  // save_part {id, i, data} for each, then save_pdf {id, count, …}. Parts not finished in 10 minutes go.
  const uploads = new Map()
  ctx.command('save_part', ({ id, i, data }) => {
    const key = str(id).slice(0, 40)
    if (!/^[a-z0-9-]{6,40}$/.test(key) || !(i >= 0 && i < 4000)) throw new Error('bad part')
    const now = Date.now()
    for (const [k, u] of uploads) if (now - u.at > 600000) uploads.delete(k)
    const u = uploads.get(key) || { parts: [], at: now }
    u.parts[i] = str(data); u.at = now
    uploads.set(key, u)
    return { ok: true }
  })
  /** The PDF (ASCII only), saved under pdfs/; an earlier one of the same name is replaced. */
  ctx.command('save_pdf', ({ id, count, call, name, pages, title, date }) => {
    const u = uploads.get(str(id))
    if (!u || u.parts.length !== count || u.parts.some((p) => p == null)) throw new Error('the PDF arrived incomplete: save it again')
    uploads.delete(str(id))
    const file = str(name).replace(/[\\/]+/g, ' ').trim()
    if (!/\.pdf$/i.test(file) || file.startsWith('.') || file.length > 140) throw new Error('bad file name')
    const body = u.parts.join('')
    if (!body.startsWith('%PDF-') || /[^\x09\x0a\x0d\x20-\x7e]/.test(body)) throw new Error("that isn't a PDF this plugin made")
    ctx.store.write(`pdfs/${file}`, body)
    const rec = { call: str(call), file, title: str(title).slice(0, 160), date: ymd(date), pages: Math.max(1, Math.round(+pages || 1)), bytes: body.length, at: new Date().toISOString() }
    writeJson('made.json', [rec, ...made().filter((m) => m.file !== file)].slice(0, 300))
    return { ...rec, path: ctx.store.path(`pdfs/${file}`) }
  })
}
