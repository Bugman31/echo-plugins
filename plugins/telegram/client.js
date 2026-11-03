// Telegram — the client half: its Settings section, a checklist of what the channel needs, and the way to
// the session it reaches.

const PLANE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/></svg>'

export function apply(ctx) {
  const { esc, setCard, setRow } = ctx.ui
  let st = null, error = '', busy = ''

  const load = async () => {
    try { st = await ctx.call('status'); error = '' } catch (e) { error = e.message }
    ctx.render()
  }
  const ok = (yes) => (yes ? '<span class="set-ok">Ready ✓</span>' : '')

  ctx.settings.section({
    id: 'main',
    label: 'Telegram',
    icon: PLANE,
    render() {
      if (!st) { if (!error && !busy) { busy = 'loading'; load().then(() => { busy = '' }) } return error ? `<p class="error">${esc(error)}</p>` : '<div class="skeleton" style="padding:20px"><i></i><i></i></div>' }
      const bot = st.bot
      const steps = [
        setRow('Your bot', bot && bot.paired ? `<b>@${esc(bot.bot)}</b> talks to ${esc(bot.user || 'you')} — and only you: nobody else gets through.` : bot ? `@${esc(bot.bot)} is added; press <b>Start</b> in its chat, then pair it in Settings → Plugins.` : 'Make one: in Telegram, message <b>@BotFather</b>, send <code>/newbot</code>, then add its token in Settings → Plugins → Echo sends to you.',
          bot && bot.paired ? ok(true) + '<button class="btn ghost" data-tg-test>Send a test</button>' : '<button class="btn" data-tg-plugins>Set up the bot…</button>'),
        setRow('Bun', st.bun ? `Found at <code>${esc(st.bun)}</code> — Claude Code's Telegram plugin runs on it.` : 'Claude Code’s Telegram plugin runs on Bun. Install it: <code>brew install oven-sh/bun/bun</code> (or see bun.sh), then check again.',
          st.bun ? ok(true) : '<button class="btn" data-tg-recheck>Check again</button>'),
        setRow('Claude Code’s Telegram channel', st.plugin ? `<code>${esc(st.spec)}</code> is installed for your Claude Code.` : st.plugin_error ? `<span class="error">${esc(st.plugin_error)}</span>` : `Echo installs <code>${esc(st.spec)}</code> (Anthropic’s official channel plugin) for your Claude Code.`,
          st.plugin ? ok(true) : `<button class="btn primary" data-tg-install${busy === 'install' ? ' disabled' : ''}>${busy === 'install' ? 'Installing…' : 'Install'}</button>`),
      ]
      const ready = bot && bot.paired && st.bun && st.plugin
      const session = setRow('Your Claude · Echo folder session', ready
        ? 'Messages to your bot go to this session while it is open in Echo; Claude answers there. Open it — or close and open it again if it was open before you set this up. Tool approvals it would ask in the window arrive in Telegram as buttons.'
        : 'Once the steps above are done, it listens to your bot while it is open.',
        ready ? '<button class="btn primary" data-tg-open>Open the session</button>' : '')
      return `<div class="sch"><div class="sch-head"><div style="flex:1"><h2 style="margin:0;font-size:18px;font-weight:650">Telegram</h2><div class="set-sub">Your Claude · Echo folder session, from your phone.</div></div></div>
        ${setCard('', steps)}${setCard('', [session])}
        ${error ? `<p class="error">${esc(error)}</p>` : ''}
        <p class="set-sub">A research preview of Claude Code: it needs a claude.ai sign-in (or a Console key), not a gateway or Bedrock; on Team and Enterprise plans an admin switches channels on first.</p></div>`
    },
  })

  document.addEventListener('click', async (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-tg-test],[data-tg-plugins],[data-tg-recheck],[data-tg-install],[data-tg-open]')
    if (!t) return
    const d = t.dataset
    if ('tgPlugins' in d) return ctx.go('settings/plugins')
    if ('tgRecheck' in d) return load()
    if ('tgOpen' in d) return ctx.openEchoPanel('claude-folder')
    if ('tgTest' in d) { try { await ctx.call('test'); ctx.ui.notice('Sent — look in Telegram.') } catch (e) { ctx.ui.notice(e.message) } return }
    if ('tgInstall' in d) {
      busy = 'install'; ctx.render()
      try { await ctx.call('install'); error = '' } catch (e) { error = e.message }
      busy = ''
      return load()
    }
  })
}
