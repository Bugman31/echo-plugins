# Meeting Notebook for Echo

Your calls as a notebook, inside Echo. A **Notebook** activity in Echo's window:

- **Today:** today's calls and their filing state, pages Claude filed that you haven't opened, and what's
  due or overdue.
- **Three panes:** folders (Client, Partner, 1:1, Internal, Industry & Analyst, Other; rename, reorder,
  add), subfolders (a client, person or meeting series) with dated pages, and the open page. The page has
  title, type, client or person, date, attendees, a rich-text summary, decisions, action items and your
  own notes.
- **Views:** open action items (All, Claude can do, Manual), the last 14 days, and an overview of each
  subfolder (highlights from the last call, its open action items, a search).

## How pages are created

- **Automatically.** When Echo has written a call's minutes, one Claude run reads the minutes, the
  transcript, the invite (`meeting.json`), Echo's action items (`actions.json`) and your notes
  (`my-notes.md`). It files the call as a page: type and subfolder (reusing yours), a summary with
  Highlights and Risks & issues, decisions, and action items. Each action is tagged **Claude can do
  this**, with a prompt ready to use, or **Manual**, with how it gets done. Highlights, decisions and
  actions keep the moment they came from (`[mm:ss]`). Click one to see that part of the transcript. Turn
  this off in Settings → Plugins → Meeting Notebook → *File calls automatically*.
- **By hand.** *File an Echo call* in the notebook, *File in Notebook* in a call's menu, or ⌘K.
- **Your own pages.** *+ New page*.

## Filing again: review what changed

When Echo writes a call's minutes again, Claude files it again. The page then shows what changed:

- **Fields you haven't edited:** updated, with *Undo*.
- **Fields you edited:** Claude's version is offered with *Accept* or *Keep mine*.

Your notes are never replaced. A page you delete stays deleted until you file its call again.

## Action items are Echo's action items

A call page's action items are the call's own action items in Echo (`actions.json`), matched by id:

- Tick one here and it's ticked in Echo's call view, and the other way round.
- An item Echo has that the page doesn't gets added.
- An action you add on the page stays in the notebook only. Echo has no way for a plugin to add to a
  call's list, and the page marks such items *Notebook only*.

## Filing rules (Settings → Meeting Notebook)

How Claude picks a folder and subfolder is yours to set, in Echo's **Settings → From plugins → Meeting
Notebook**:

- **Folders, in order.** Claude tries them top to bottom. Each has a name, what goes in it in plain
  words, and how its subfolders are named: by organisation (clients, partners), by person (1:1s, a team)
  or by series or topic. Rename them, reorder them, add your own (a team, a programme, interviews) or
  remove ones you don't use.
- **Last-resort folder.** Used only when no other folder fits (Internal by default).
- **Client prep goes under the client.** A call among colleagues about one client or partner (prep, an
  RFP, a deal review) is filed under that client and marked *Internal call*. Off: calls are filed by who
  was on them.
- **1:1s follow the person.** A 1:1 goes to the folder where that person already has a subfolder, such as
  a team folder with a subfolder per team member.
- **Your own rules.** One per line in plain words ("Calls with Phil go to Client › and5"); they win over
  the rest.
- **Folder suggestions.** When the last-resort folder fills up with similar meetings, Claude proposes
  folders for them on the Today view, to make or turn down. You set how often it looks, and how many pages
  a new folder needs.
- **What Claude is told** shows the exact instructions these rules produce.

Folders you make in the notebook itself count as your own folders and are used even when they're not in
the list. Rules apply to calls filed from now on; pages already filed stay where they are.

## Shared screens

With **Save snapshots of shared screens** on in Echo's settings, Echo keeps a snapshot each time a shared
screen changes (slides, documents, demos), and its minutes describe each one under **On screen**. A
page shows them under **Shared screens**: the images with what each showed and the moment, which opens
the transcript there. Click one for a larger view, step through them, or **Add to My notes** to keep a
copy in your own notes. The captions also go to Claude when you run an action, and to Meeting Prep.
Pages filed before this version get their screens in the background a few minutes after the update.

Echo captures only what someone else shares, not your own screen. Calls imported from a Teams transcript
have no screens.

## Run an action with Claude

*Run with Claude* on a Claude action opens a side panel:

1. **Prompt:** edit what Claude should do, and choose whether it may use the subfolder's earlier pages.
2. **Draft:** Claude writes the deliverable (an email, message or plan) from this call's minutes,
   transcript and your notes. It runs with no tools.
3. **Your call:** *Copy*, *Save to page* (into My notes), *Send to me* (Teams chat with yourself or
   mail to your own address, when Echo is signed in to Microsoft 365), *Ask for changes*, or
   *Mark done*.

Nothing is sent to anyone else.

## Where the pages are

Each page is one file, `<data folder>/.echo/plugins/meeting-notebook/notes/<id>.json`, with the same
fields and ids as the Claude artifact the notebook started as. A scheduled job can copy pages in or out.

## Look

The notebook follows Echo's light and dark appearance. It uses Museo Sans when it is installed on your
computer, and the system font otherwise.

## Install or update

From a copy of this repository:

```sh
echoctl plugin marketplace add "<path to the folder with echo-marketplace.json>"
echoctl plugin install meeting-notebook --yes
```

After a change, raise `version` in `echo-plugin.json`, then run `echoctl plugin marketplace update <name>`
and `echoctl plugin update meeting-notebook`.

To try both halves in a browser against a fake Echo, serve the folder above `dev/` and open
`dev/harness.html`.
