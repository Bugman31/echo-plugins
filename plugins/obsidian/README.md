# Obsidian vaults

Connect the Obsidian vaults you already have. Echo reads each one and Claude describes it: what it is, where things
are, how notes are written, what Claude may do with it and what to leave alone. You correct the description, and from
then on Claude in Echo knows where to look.

- **One skill for all vaults** (`obsidian-vaults`), given only to Echo's own Claude sessions — never installed in your
  Claude Code. Its description names your vaults; the catalog and each vault's description are read only when needed.
  Rebuilt whenever a vault is added, removed, read again or its description edited.
- **Claude in Echo may read the vaults** (the Claude · Echo folder session, Scheduler routines). Writing into a vault is
  the folder session's, under your own Claude Code permissions, guided by the description.
- **The window points Claude to a client's or thread's vault** when that client or thread is open.
- Your vault isn't changed by Echo itself. Removing a vault from Echo takes all of this back.

Needs Echo 0.7.2 or later. Part of the [Echo plugins](../../README.md) marketplace.
