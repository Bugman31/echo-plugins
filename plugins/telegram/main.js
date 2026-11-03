// Telegram — the host half. Your own bot (Echo keeps its token, Settings → Plugins → Echo sends to you)
// reaches your Claude · Echo folder session through Claude Code's official Telegram channel plugin, while
// that session is open. Only you: the channel's access list holds your Telegram id alone (pairing is off),
// written here from the pairing Echo already did.

const SPEC = 'telegram@claude-plugins-official'

export function apply(ctx) {
  let last = ''
  // The channel's state lives in this plugin's folder; its access list is you.
  const setup = () => {
    const d = ctx.deliver.status()
    const t = d && d.telegram
    if (!t || !t.paired || t.chat_id == null) {
      ctx.sessions.clearChannel()
      last = 'no-bot'
      return
    }
    const access = { dmPolicy: 'allowlist', allowFrom: [String(t.chat_id)], groups: {}, pending: {}, ackReaction: '👀' }
    const text = JSON.stringify(access, null, 2)
    if (ctx.store.read('channel/access.json') !== text) ctx.store.write('channel/access.json', text)
    ctx.sessions.channel({ plugin: SPEC, token: 'telegram', env: { TELEGRAM_STATE_DIR: ctx.store.path('channel'), TELEGRAM_ACCESS_MODE: 'static' } })
    last = 'ready'
  }
  setup()
  // A bot connected or forgotten later is followed.
  ctx.every(30, setup)

  ctx.command('status', async () => {
    setup()
    const d = ctx.deliver.status()
    let plugin = null, pluginError = ''
    try { plugin = await ctx.claude.hasPlugin(SPEC) } catch (e) { pluginError = String(e.message || e) }
    return { bot: d.telegram || null, bun: ctx.system.which('bun'), plugin, plugin_error: pluginError, channel: last === 'ready', spec: SPEC }
  })
  ctx.command('install', async () => { await ctx.claude.installPlugin(SPEC); return true })
  ctx.command('test', async () => {
    await ctx.deliver.send('telegram', { title: 'Echo', markdown: 'This chat reaches your **Claude · Echo folder** session while it is open in Echo.' })
    return true
  })
}
