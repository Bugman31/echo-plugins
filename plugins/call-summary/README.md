# Call Summary

Turn any call Echo recorded into a summary PDF you can share: robust notes, decisions, action items with
owners and due dates, and the screens that were shared. You check it, ask Claude to change it in your own
words, save the PDF, and email it yourself.

## Make one

Open **Summaries** in Echo's activity bar, or choose **Create summary PDF** in a call's menu (also in ⌘K).

1. **Pick a call.** Every recorded call is listed, newest first; search by title, person or client, or
   switch from *This week* to *All*.
2. **Claude writes the summary** from the call: Echo's minutes, the transcript, the invite, the meeting chat,
   the shared screens and your Meeting Notebook page when there is one (your corrections there win). It takes
   about a minute.
3. **Check it.**
   - *Written for*: **Everyone on the call** leaves out internal remarks, pricing talk and side
     conversations; **My team only** keeps them.
   - Choose the sections and the shared screens to include.
   - Click any text in the preview to change it; add or remove decisions, actions and questions.
   - **Ask Claude** for a change in your own words ("lead with the pilot date, say the security review is
     the main risk"), or pick one of its suggestions. Claude rewrites from the call itself, keeping your edits
     unless you ask otherwise. **Undo** takes any change back.
4. **Save PDF.** Then **Copy file location** to attach it in Outlook (in the file picker press ⌘⇧G and
   paste), and **Copy email text** for a subject and a short cover note.

## The PDF

US Letter or A4 (Settings → Plugins → Call Summary → Paper size): a header with the date, time and
attendees; summary, decisions, an action-items table, the discussion by topic, open questions, the shared
screens with their captions and times, and the attendees. "Prepared by" uses *Your name* from the
plugin's settings.

It uses the standard Helvetica fonts, so names in other scripts (Cyrillic, for example) are spelled in
Latin letters. Screenshots are the call window as Echo captured it.

## Where the PDFs are

In the plugin's data folder in Echo: `<Echo folder>/.echo/plugins/call-summary/pdfs/`. The saved screen
shows the full path and copies it for you. To reach them from Finder, make a shortcut once in Terminal:

```bash
ln -s ~/OctoDeck/.echo/plugins/call-summary/pdfs ~/Documents/"Call summaries"
```

(with your own Echo folder in place of `~/OctoDeck`).

## Needs

Echo 0.8.0 or later, with Claude Code signed in for Echo. Nothing is sent anywhere: the plugin only writes
the summary and the PDF on your computer.
