// Call Summary — the PDF writer (used by the window half; no dependencies).
//
// The whole file is plain ASCII, so Echo's text store can hold it: text in the standard Helvetica fonts with
// WinAnsi encoding (characters outside it are spelled in Latin letters), JPEG screenshots as hex
// (ASCIIHexDecode + DCTDecode), uncompressed content streams. Letter or A4.

// Helvetica and Helvetica-Bold advance widths (1/1000 em) for 32–126.
const W_REG = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584]
const W_BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584]
// WinAnsi's 0x80–0x9F, from Unicode.
const WIN = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f }
const W_HIGH = { 0x80: 556, 0x82: 222, 0x84: 333, 0x85: 1000, 0x86: 556, 0x87: 556, 0x89: 1000, 0x8b: 333, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x95: 350, 0x96: 556, 0x97: 1000, 0x99: 1000, 0x9b: 333, 0xa0: 278, 0xb7: 278, 0xd7: 584, 0xb0: 400, 0xa9: 737, 0xae: 737 }
const W_HIGH_BOLD = { ...W_HIGH, 0x91: 278, 0x92: 278, 0x93: 500, 0x94: 500, 0x84: 500, 0x82: 278 }
const TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', ё: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'i', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia' }
const OTHER = { '→': '->', '←': '<-', '≤': '<=', '≥': '>=', '≈': '~', '≠': '!=', ' ': ' ', ' ': ' ', ' ': ' ', '−': '-', '‑': '-', '‐': '-', '′': "'", '″': '"' }

/** Text as WinAnsi codes (an array of numbers 32–255). */
export function winAnsi(s) {
  const out = []
  for (const ch of String(s ?? '').replace(/[\r\n\t]+/g, ' ')) {
    const c = ch.codePointAt(0)
    if (c >= 32 && c < 127) { out.push(c); continue }
    if (c >= 0xa0 && c <= 0xff) { out.push(c); continue }
    if (WIN[c]) { out.push(WIN[c]); continue }
    if (OTHER[ch] != null) { for (const x of OTHER[ch]) out.push(x.charCodeAt(0)); continue }
    const low = ch.toLowerCase()
    if (TRANSLIT[low] != null) { let t = TRANSLIT[low]; if (ch !== low && t) t = t[0].toUpperCase() + t.slice(1); for (const x of t) out.push(x.charCodeAt(0)); continue }
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (base && base !== ch && [...base].every((x) => x.charCodeAt(0) < 256)) { for (const x of base) out.push(x.charCodeAt(0)); continue }
    if (c >= 0x2000 && c <= 0x200b) { out.push(32); continue }
    out.push(63)
  }
  return out
}
const codeWidth = (c, bold) => (c >= 32 && c < 127 ? (bold ? W_BOLD : W_REG)[c - 32] : (bold ? W_HIGH_BOLD : W_HIGH)[c] || 556)
/** Width in points of text set in Helvetica (bold or not) at `size`, with extra `spacing` per character. */
export function textWidth(s, size, bold, spacing = 0) {
  const codes = Array.isArray(s) ? s : winAnsi(s)
  return codes.reduce((t, c) => t + codeWidth(c, bold), 0) * size / 1000 + spacing * codes.length
}
/** A PDF string literal: ( … ) with \ ( ) escaped and codes over 126 as octal, so the file stays ASCII. */
const lit = (codes) => '(' + codes.map((c) => (c === 40 || c === 41 || c === 92 ? '\\' + String.fromCharCode(c) : c > 126 ? '\\' + c.toString(8).padStart(3, '0') : String.fromCharCode(c))).join('') + ')'

/** Lines of at most `width` points (a word longer than a line is cut). */
export function wrap(s, size, width, bold) {
  const words = String(s ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const lines = []
  let cur = ''
  const fits = (t) => textWidth(t, size, bold) <= width
  for (let w of words) {
    const next = cur ? cur + ' ' + w : w
    if (fits(next)) { cur = next; continue }
    if (cur) lines.push(cur)
    while (!fits(w) && w.length > 1) {
      let n = w.length - 1
      while (n > 1 && !fits(w.slice(0, n))) n--
      lines.push(w.slice(0, n)); w = w.slice(n)
    }
    cur = w
  }
  if (cur) lines.push(cur)
  return lines
}

const n2 = (x) => (Math.round(x * 100) / 100).toString()
const ACCENT = [0, 0.278, 1]
const INK = [0, 0, 0]
const MUTED = [0.33, 0.33, 0.33]
const RULE = [0.72, 0.72, 0.72]
const longDate = (ymd) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || '')) return ''; const d = new Date(ymd + 'T12:00:00'); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }
const shortDate = (ymd) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || '')) return ''; const d = new Date(ymd + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
export const clock = (t) => { t = Math.max(0, Math.round(t)); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0') }

/**
 * The PDF for a summary.
 * doc: the summary (title, date, time, attendees, summary, topics, decisions, actions, questions)
 * opts: {paper: 'letter'|'a4', me, sections: {summary, decisions, actions, topics, questions, screens, attendees},
 *        images: [{t, caption, hex (the JPEG as hex), w, h}]}
 * → {pdf (the file as a string), pages}
 */
export function makePdf(doc, opts = {}) {
  const [PW, PH] = opts.paper === 'a4' ? [595.28, 841.89] : [612, 792]
  const ML = 56, MR = 56, MT = 58, MB = 62
  const CW = PW - ML - MR
  const on = (k) => !opts.sections || opts.sections[k] !== false
  const pages = []
  let ops = null, y = 0
  const newPage = () => { ops = []; pages.push(ops); y = PH - MT }
  const color = (c, stroke) => `${c.map(n2).join(' ')} ${stroke ? 'RG' : 'rg'}`
  const text = (s, x, yy, size, bold, c = INK, spacing = 0) => {
    ops.push(`BT ${color(c)} /${bold ? 'F2' : 'F1'} ${n2(size)} Tf ${n2(spacing)} Tc ${n2(x)} ${n2(yy)} Td ${lit(winAnsi(s))} Tj ET`)
  }
  const rect = (x, yy, w, h, c) => ops.push(`${color(c)} ${n2(x)} ${n2(yy)} ${n2(w)} ${n2(h)} re f`)
  const hline = (x1, x2, yy, c = RULE, w = 0.5) => ops.push(`${color(c, true)} ${n2(w)} w ${n2(x1)} ${n2(yy)} m ${n2(x2)} ${n2(yy)} l S`)
  const room = (h) => { if (y - h < MB) newPage() }

  // A block of wrapped lines; the first line keeps with its block when it can.
  const para = (s, { size = 10.5, lead = 15.5, bold = false, c = INK, x = ML, w = CW, after = 8 } = {}) => {
    const lines = wrap(s, size, w, bold)
    room(Math.min(lines.length, 3) * lead)
    for (const l of lines) { room(lead); y -= lead; text(l, x, y + (lead - size) * 0.35, size, bold, c) }
    y -= after
  }
  const bullets = (items, opt = {}) => {
    for (const it of items) {
      const size = opt.size || 10.5, lead = opt.lead || 15.5
      const lines = wrap(it, size, CW - 14, false)
      room(Math.min(lines.length, 2) * lead)
      lines.forEach((l, i) => { room(lead); y -= lead; const by = y + (lead - size) * 0.35; if (i === 0) text('•', ML + 1, by, size, false, ACCENT); text(l, ML + 14, by, size) })
      y -= 3
    }
    y -= 5
  }
  let firstSection = true
  const eyebrow = (s) => {
    room(60)
    if (!firstSection) { y -= 8; hline(ML, PW - MR, y); y -= 16 } else y -= 4
    firstSection = false
    text(s.toUpperCase(), ML, y - 8, 8, true, ACCENT, 1.6)
    y -= 20
  }
  // Body text with blank-line paragraphs and "- " bullets.
  const rich = (s) => {
    // Runs of "- " lines are bullets; the other lines, up to a blank line or a bullet, are a paragraph.
    let txt = [], list = []
    const flush = () => { if (txt.length) para(txt.join(' ')); if (list.length) bullets(list); txt = []; list = [] }
    for (const raw of String(s || '').split('\n')) {
      const l = raw.trim()
      if (!l) { flush(); continue }
      if (/^[-*•]\s+/.test(l)) { if (txt.length) { para(txt.join(' '), { after: 4 }); txt = [] } list.push(l.replace(/^[-*•]\s+/, '')) } else { if (list.length) { bullets(list); list = [] } txt.push(l) }
    }
    flush()
  }

  newPage()
  // Header
  rect(ML, y - 4, 64, 4, ACCENT)
  y -= 22
  const when = [longDate(doc.date), doc.time].filter(Boolean).join(' · ')
  text(('Meeting summary' + (when ? ' · ' + when : '')).toUpperCase(), ML, y, 7.5, true, MUTED, 1.4)
  y -= 12
  para(doc.title || 'Meeting summary', { size: 22, lead: 27, after: 4 })
  const people = (doc.attendees || []).map((a) => (a.org ? `${a.name} (${a.org})` : a.name))
  if (people.length) para(people.join(', '), { size: 9.5, lead: 13.5, c: MUTED, after: 10 })

  if (on('summary') && doc.summary) { eyebrow('Summary'); rich(doc.summary) }
  if (on('decisions') && (doc.decisions || []).length) { eyebrow('Decisions'); bullets(doc.decisions) }
  if (on('actions') && (doc.actions || []).length) {
    eyebrow('Action items')
    const cO = 128, cD = 62, cA = CW - cO - cD - 16
    const row = (a, header) => {
      const size = header ? 8.5 : 9.5, lead = header ? 12 : 13.5
      const la = wrap(a.text, size, cA, header), lo = wrap(a.owner || (header ? '' : '—'), size, cO - 8, header), ld = wrap(a.due, size, cD, header)
      const h = Math.max(la.length, lo.length, ld.length, 1) * lead + 8
      room(h)
      const top = y
      la.forEach((l, i) => text(l, ML, top - 4 - (i + 1) * lead + (lead - size) * 0.35, size, header))
      lo.forEach((l, i) => text(l, ML + cA + 8, top - 4 - (i + 1) * lead + (lead - size) * 0.35, size, header))
      ld.forEach((l, i) => text(l, ML + cA + cO + 16, top - 4 - (i + 1) * lead + (lead - size) * 0.35, size, header))
      y -= h
      hline(ML, PW - MR, y + 2, header ? [0.45, 0.45, 0.45] : RULE)
    }
    row({ text: 'Action', owner: 'Owner', due: 'Due' }, true)
    for (const a of doc.actions) row({ text: a.text, owner: a.owner, due: shortDate(a.due) || '—' }, false)
    y -= 8
  }
  if (on('topics') && (doc.topics || []).length) {
    eyebrow('Discussion')
    for (const t of doc.topics) {
      if (t.heading) { room(17 + 2 + 3 * 15.5 + 6); para(t.heading, { size: 12, lead: 17, bold: true, after: 2 }) }
      rich(t.body)
      y -= 2
    }
  }
  if (on('questions') && (doc.questions || []).length) { eyebrow('Open questions'); bullets(doc.questions) }
  const imgs = (opts.images || []).filter((im) => im && im.hex && im.w > 0 && im.h > 0)
  if (on('screens') && imgs.length) {
    // Two to a page: each at most half the page's text height.
    const size = (im) => { let w = CW, h = (im.h / im.w) * w; const maxH = (PH - MT - MB) / 2 - 56; if (h > maxH) { h = maxH; w = (im.w / im.h) * h } return [w, h] }
    room(size(imgs[0])[1] + 110)
    eyebrow('Shared on screen')
    imgs.forEach((im, i) => {
      const [w, h] = size(im)
      const cap = wrap(im.caption || 'Shared screen', 9.5, CW - 40, false)
      room(h + 14 + cap.length * 13.5)
      y -= h
      ops.push(`q ${n2(w)} 0 0 ${n2(h)} ${n2(ML)} ${n2(y)} cm /Im${i + 1} Do Q`)
      ops.push(`${color(RULE, true)} 0.5 w ${n2(ML)} ${n2(y)} ${n2(w)} ${n2(h)} re S`)
      y -= 6
      const tStr = im.t != null ? clock(im.t) : ''
      cap.forEach((l, k) => { y -= 13.5; if (k === 0 && tStr) text(tStr, ML, y + 3, 9.5, true, ACCENT); text(l, ML + (tStr ? 40 : 0), y + 3, 9.5) })
      y -= 16
    })
  }
  if (on('attendees') && people.length) { eyebrow('Attendees'); bullets(people, { size: 10, lead: 14.5 }) }

  // Footers, now that the page count is known.
  const total = pages.length
  pages.forEach((p, i) => {
    ops = p
    const left = i === 0 ? `Prepared by ${opts.me || 'the organiser'} from the call recording` : [doc.title, shortDate(doc.date)].filter(Boolean).join(' · ')
    const leftCodes = winAnsi(left)
    const num = `${i + 1} / ${total}`
    const maxLeft = CW - 60
    let lc = leftCodes
    while (lc.length > 4 && textWidth(lc, 7.5, false) > maxLeft) lc = lc.slice(0, -1)
    if (lc.length < leftCodes.length) lc = [...lc.slice(0, -1), 0x85]
    ops.push(`BT ${color(MUTED)} /F1 7.5 Tf 0 Tc ${n2(ML)} ${n2(MB - 30)} Td ${lit(lc)} Tj ET`)
    text(num, PW - MR - textWidth(num, 7.5, false), MB - 30, 7.5, false, MUTED)
  })

  // The file: catalog, pages, two fonts, the images, then each page and its content.
  const objs = []
  const add = (s) => { objs.push(s); return objs.length }
  const catalog = add(null), pagesObj = add(null)
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const imgRefs = imgs.map((im) => {
    const hex = im.hex.replace(/[^0-9a-fA-F]/g, '').replace(/(.{128})/g, '$1\n') + '>'
    return add(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${hex.length} >>\nstream\n${hex}\nendstream`)
  })
  const xo = imgRefs.length ? ` /XObject << ${imgRefs.map((r, i) => `/Im${i + 1} ${r} 0 R`).join(' ')} >>` : ''
  const kids = pages.map((p) => {
    const body = p.join('\n')
    const content = add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`)
    return add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${n2(PW)} ${n2(PH)}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >>${xo} >> /Contents ${content} 0 R >>`)
  })
  objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`
  objs[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`
  const d = new Date(), p2 = (x) => String(x).padStart(2, '0')
  const stampD = `D:${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`
  const info = add(`<< /Title ${lit(winAnsi(doc.title || 'Meeting summary'))} /Author ${lit(winAnsi(opts.me || ''))} /Producer (Echo Call Summary) /CreationDate (${stampD}) >>`)
  let out = '%PDF-1.4\n'
  const offs = []
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return { pdf: out, pages: total }
}
