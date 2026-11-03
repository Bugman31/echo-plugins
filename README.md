# Echo plugins

The built-in marketplace of [Echo](https://github.com/onetest-ai/echo): plugins you install from Echo's
Settings → Plugins (or `echoctl plugin install <id>`).

An Echo plugin is a **declarative package** — a manifest naming the Echo capabilities it uses, plus skills and
settings. It carries no code: everything that runs is Echo's own, and the permission sheet Echo shows before an
install is written by Echo from the manifest's `uses`, not by the plugin.

| Plugin | What it does |
|---|---|
| [Scheduler](plugins/scheduler) | Your own Claude prompts on a schedule, answers delivered to you in Telegram, Teams or mail |
| [Telegram](plugins/telegram) | Your Claude · Echo folder session from your phone, through your own bot |
| [Obsidian vault](plugins/obsidian) | Your vault as Echo's second brain; minutes and people written into it |

Scheduler needs Echo 0.7 or later; Telegram and Obsidian vault need capabilities that arrive after it — until then Echo lists them as "Needs a newer Echo". Your Telegram bot is set up once, in Echo (Settings → Plugins → Echo sends to you), and shared by the plugins that send to you.

## Make a marketplace of your own

Any git repository with `echo-marketplace.json` at its root — a team's or a company's — can be added in Echo's
Settings → Plugins → Marketplaces (`owner/repo`, a git URL, or a folder):

```json
{
  "name": "acme",
  "featured": ["acme-reports"],
  "plugins": [
    { "id": "acme-reports", "source": "./plugins/acme-reports", "categories": ["automation"] },
    { "id": "elsewhere", "source": { "github": "acme/echo-elsewhere", "ref": "v1.0.0", "path": "plugin" } }
  ]
}
```

Each plugin folder holds `echo-plugin.json`:

```json
{
  "id": "acme-reports",
  "name": "Acme reports",
  "version": "0.1.0",
  "summary": "One line on what it does",
  "echo": ">=0.7.0",
  "uses": { "deliver": { "to": ["mail"] } },
  "settings": [{ "key": "folder", "label": "Reports folder", "type": "folder" }]
}
```

Capabilities (`uses`): `routines`, `deliver` (`telegram`, `teams`, `mail` — always to the user), `channel`
(a Claude Code channel plugin of claude-plugins-official), `brain_source` (`vault`), `export` (`vault`: minutes,
people), `sessions` (`read`, `skills`). Setting types: `string`, `bool`, `folder`, `secret`. Folders may not
contain links; a plugin is at most 400 files / 20 MB. The design: `docs/plugins-design.md` in Echo.
