// Telegram — the host half. Everything Telegram is here, not in Echo:
// - your own bot: its token is this plugin's secret setting; pairing waits for your /start in its chat and
//   keeps your chat id (`pair.json` in its folder) — only you are ever let through;
// - a way Echo sends to you (`ctx.deliver.provide('telegram')`): Markdown in Telegram's HTML, a table as
//   lines, long text cut at line ends;
// - Claude Code's official Telegram channel on your Claude · Echo folder session, while it is open: its
//   access list is you alone (static, no pairing codes), written from the pairing above.
// It talks only to api.telegram.org (`uses.network`).

const SPEC = 'telegram@claude-plugins-official'
const MAX = 4000

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Inline Markdown → Telegram HTML: **bold**, *italic* / _italic_, ~~strike~~, `code`, [text](https://…). */
function inline(text) {
  let out = ''
  const re = /(`[^`]+`)|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0, m
  while ((m = re.exec(text))) {
    out += esc(text.slice(last, m.index))
    if (m[1]) out += `<code>${esc(m[1].slice(1, -1))}</code>`
    else if (m[2] || m[3]) out += `<b>${inline(m[2] || m[3])}</b>`
    else if (m[4]) out += `<s>${inline(m[4])}</s>`
    else if (m[5] || m[6]) out += `<i>${inline(m[5] || m[6])}</i>`
    else if (m[7]) out += /^https:\/\//.test(m[8]) ? `<a href="${esc(m[8])}">${inline(m[7])}</a>` : inline(m[7])
    last = re.lastIndex
  }
  return out + esc(text.slice(last))
}

/** Markdown → the HTML Telegram takes: headings bold, lists bulleted or numbered, a table's rows as lines
 *  ("• <b>10:00</b> Weekly sync · Open asks" — its first cell bold, empty or "—" cells left out; Telegram
 *  has no tables), quotes as <blockquote>, code blocks as <pre>. */
export function telegramHtml(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  const out = []
  let quote = [], code = null
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${quote.join('\n')}</blockquote>`); quote = [] } }
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (code != null) {
      if (/^\s*```/.test(l)) { out.push(`<pre>${esc(code.join('\n'))}</pre>`); code = null } else code.push(l)
      continue
    }
    if (/^\s*```/.test(l)) { flushQuote(); code = []; continue }
    const q = /^\s*>\s?(.*)$/.exec(l)
    if (q) { quote.push(inline(q[1])); continue }
    flushQuote()
    const h = /^\s*#{1,6}\s+(.*)$/.exec(l)
    if (h) { out.push(`<b>${inline(h[1].replace(/\s*#+\s*$/, ''))}</b>`); continue }
    if (/^\s*\|.*\|\s*$/.test(l)) {
      // A table: skip its head and the |---| line, each body row a line.
      const rows = []
      let j = i
      while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) rows.push(lines[j++])
      i = j - 1
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const body = rows.length > 1 && /^[\s|:-]+$/.test(rows[1]) ? rows.slice(2) : rows
      for (const r of body) {
        const c = cells(r).filter((x) => x && !['—', '–', '-'].includes(x))
        if (c.length) out.push(`• <b>${inline(c[0])}</b>${c.length > 1 ? ' ' + c.slice(1).map(inline).join(' · ') : ''}`)
      }
      continue
    }
    const b = /^(\s*)[-*+]\s+(.*)$/.exec(l)
    if (b) { out.push(`${'  '.repeat(Math.floor(b[1].length / 2))}• ${inline(b[2])}`); continue }
    const n = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(l)
    if (n) { out.push(`${'  '.repeat(Math.floor(n[1].length / 2))}${n[2]}. ${inline(n[3])}`); continue }
    if (/^\s*([-*_])\1{2,}\s*$/.test(l)) { out.push('—'); continue }
    out.push(inline(l))
  }
  flushQuote()
  if (code != null) out.push(`<pre>${esc(code.join('\n'))}</pre>`)
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Cut at line ends into pieces of at most `max` characters, closing tags a cut leaves open. */
export function split(text, max = MAX) {
  const parts = []
  let cur = ''
  for (const line of text.split(/(?<=\n)/)) {
    if (cur.length + line.length > max && cur) { parts.push(cur); cur = '' }
    let l = line
    while (l.length > max) { parts.push(l.slice(0, max)); l = l.slice(max) }
    cur += l
  }
  if (cur.trim()) parts.push(cur)
  return parts.map((p) => {
    let s = p
    for (const tag of ['b', 'i', 's', 'code', 'pre', 'blockquote']) {
      const open = (p.match(new RegExp(`<${tag}>`, 'g')) || []).length, close = (p.match(new RegExp(`</${tag}>`, 'g')) || []).length
      if (open > close) s += `</${tag}>`.repeat(open - close)
      else if (close > open) s = `<${tag}>`.repeat(close - open) + s
    }
    return s
  })
}

export function apply(ctx) {
  const token = () => ctx.settings.get('bot_token') || ''
  const pair = () => JSON.parse(ctx.store.read('pair.json') || '{}')
  const bot = async (method, body) => {
    const t = token()
    if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(t)) throw new Error('no bot token yet — add your bot first')
    const r = await ctx.http.fetch(`https://api.telegram.org/bot${t}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
    let v = null
    try { v = JSON.parse(r.body) } catch { throw new Error(`Telegram answered ${r.status}`) }
    if (!v.ok) throw new Error(`Telegram: ${v.description || r.status}`)
    return v.result
  }

  // Echo's state follows ours: whether Telegram can send, and the channel on the session.
  const sync = () => {
    const p = pair()
    const ok = !!(token() && p.chat_id)
    ctx.deliver.ready('telegram', ok, !token() ? 'No bot yet' : !p.chat_id ? `Press Start in @${p.bot || 'your bot'}’s chat` : '')
    if (!ok) return ctx.sessions.clearChannel()
    const access = JSON.stringify({ dmPolicy: 'allowlist', allowFrom: [String(p.chat_id)], groups: {}, pending: {}, ackReaction: '👀' }, null, 2)
    if (ctx.store.read('channel/access.json') !== access) ctx.store.write('channel/access.json', access)
    ctx.sessions.channel({ plugin: SPEC, env: { TELEGRAM_BOT_TOKEN: token(), TELEGRAM_STATE_DIR: ctx.store.path('channel'), TELEGRAM_ACCESS_MODE: 'static' } })
  }

  ctx.deliver.provide('telegram', {
    label: 'Telegram',
    send: async (msg) => {
      const p = pair()
      if (!p.chat_id) throw new Error('Telegram isn’t paired yet')
      const foot = [msg.about, msg.ai].filter(Boolean).map((x) => `\n\n<i>${esc(x)}</i>`).join('')
      const text = `<b>${esc(msg.title || 'Echo')}</b>\n\n${telegramHtml(msg.markdown || '')}${foot}`
      for (const part of split(text)) await bot('sendMessage', { chat_id: p.chat_id, text: part, parse_mode: 'HTML', disable_web_page_preview: true })
      return true
    },
  })
  sync()
  ctx.every(30, sync)

  ctx.command('status', async () => {
    sync()
    let plugin = null, pluginError = ''
    try { plugin = await ctx.claude.hasPlugin(SPEC) } catch (e) { pluginError = String(e.message || e) }
    const p = pair()
    return { bot: token() ? { bot: p.bot || '', paired: !!p.chat_id, user: p.user || '' } : null, bun: ctx.system.which('bun'), plugin, plugin_error: pluginError, spec: SPEC }
  })
  /** Check a token with getMe and keep it; pairing starts over. */
  ctx.command('connect', async ({ token: t }) => {
    t = String(t || '').trim()
    if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(t)) throw new Error('that isn’t a bot token (it looks like 123456:ABC-…)')
    const r = await ctx.http.fetch(`https://api.telegram.org/bot${t}/getMe`, { method: 'POST' })
    const v = JSON.parse(r.body || '{}')
    if (!v.ok) throw new Error(`Telegram: ${v.description || 'that token was refused'}`)
    ctx.settings.set('bot_token', t)
    ctx.store.write('pair.json', JSON.stringify({ bot: v.result.username }))
    sync()
    return { bot: v.result.username }
  })
  /** Wait (≤ 25 s a call) for the user's /start in the bot's private chat; the first one pairs. */
  ctx.command('pair', async () => {
    const p = pair()
    if (p.chat_id) return { paired: true, user: p.user }
    const ups = await bot('getUpdates', { offset: p.offset || 0, timeout: 20, allowed_updates: ['message'] })
    let offset = p.offset || 0
    for (const u of ups) {
      offset = Math.max(offset, u.update_id + 1)
      const m = u.message
      if (!m || m.chat.type !== 'private' || !/^\s*\/start/.test(m.text || '')) continue
      const user = m.from.username ? `@${m.from.username}` : m.from.first_name || 'you'
      await bot('getUpdates', { offset, timeout: 0 })
      ctx.store.write('pair.json', JSON.stringify({ bot: p.bot, chat_id: m.chat.id, user }))
      await bot('sendMessage', { chat_id: m.chat.id, text: 'Echo will send you what you ask it to here. ✓' })
      sync()
      return { paired: true, user }
    }
    ctx.store.write('pair.json', JSON.stringify({ ...p, offset }))
    return { paired: false }
  })
  ctx.command('forget', () => {
    ctx.settings.set('bot_token', '')
    ctx.store.remove('pair.json')
    sync()
    return true
  })
  ctx.command('install', async () => { await ctx.claude.installPlugin(SPEC); return true })
  ctx.command('test', async () => {
    await ctx.deliver.send('telegram', { title: 'Echo', markdown: 'This chat reaches you — and your **Claude · Echo folder** session while it is open.' })
    return true
  })
}
