import { useEffect, useRef, useState } from 'react'
import { ME, PROJECTS, WINS, TOOLS, EDU, FORTUNES } from '../data/content'
import { emit, on } from '../lib/bus'
import { loadGithub, streaks } from '../lib/github'
import { SECRETS } from '../lib/store'
import { useFound } from '../lib/store'
import { WORLDS } from '../worlds'
import { scrollToEl } from '../lib/scroll'

const T0 = Date.now()

const FS = {
  'about.txt': 'rishit tandon. final-year cse at srm ist.\nstudent convenor of robofest 2.0 (and built the portal that ran it).\nbuilds robots, ai glasses, a bci rover, drone swarms and too many side projects.\n100+ repos. 9,000+ contributions this year. goal: 10,000+.',
  'wins.log': WINS.map((w) => `${w.place}  ${w.name}`).join('\n'),
  'skills.json': JSON.stringify(TOOLS.map((t) => t[0])),
  'contact.txt': `hub       rishit.site
email     ${ME.email}\ngithub    ${ME.github}\nlinkedin  ${ME.linkedin}\nwhatsapp  ${ME.whatsapp}`,
  'todo.txt': '[x] win hackathons\n[x] build the thing\n[ ] hit 10,000 contributions\n[ ] sleep\n[ ] sleep (again)',
  'resume.pdf': '(binary file. try: resume)',
  projects: Object.fromEntries(PROJECTS.map((p) => [p.id + '.md', `# ${p.name}  [${p.tag}]\n\nproblem: ${p.problem}\nbuilt:   ${p.built}\nimpact:  ${p.impact}\ntech:    ${p.tech.join(', ')}`])),
  '.secrets': 'nice, you checked hidden files. that is the right instinct.\nthere are ' + SECRETS.length + ' secrets on this site. run `secrets` to see how many you have.',
}

const CMDS = ['help', 'ls', 'cd', 'cat', 'pwd', 'whoami', 'about', 'projects', 'wins', 'skills', 'contact', 'resume', 'github', 'open', 'clear', 'echo', 'date', 'uptime', 'history', 'neofetch', 'fortune', 'secrets', 'coffee', 'matrix', 'crash', 'sudo', 'exit', 'readme']

// [[label|url]] makes a link, {{id|label}} jumps to a world
function Line({ text }) {
  const parts = String(text).split(/(\[\[[^\]]+\]\]|\{\{[^}]+\}\})/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('[[')) { const [l, u] = p.slice(2, -2).split('|'); return <a key={i} href={u} target="_blank" rel="noreferrer">{l}</a> }
        if (p.startsWith('{{')) { const [id, l] = p.slice(2, -2).split('|'); return <button key={i} className="t-link" onClick={() => emit('wipe', id)}>{l}</button> }
        return p
      })}
    </>
  )
}

export default function Terminal() {
  const [lines, setLines] = useState([
    { t: 'rishit_os 4.2.0 — type "help". or just poke around. nothing here is load-bearing.' },
  ])
  const [val, setVal] = useState('')
  const [cwd, setCwd] = useState('~')
  const hist = useRef([])
  const hi = useRef(-1)
  const box = useRef()
  const inp = useRef()
  const found = useFound()

  const out = (...t) => setLines((l) => [...l, ...t.flat().map((x) => (typeof x === 'string' ? { t: x } : x))])
  useEffect(() => { const b = box.current; b.scrollTop = b.scrollHeight }, [lines])
  useEffect(() => on('focus-term', () => inp.current?.focus({ preventScroll: true })), [])

  const node = () => (cwd === '~' ? FS : FS.projects)

  async function run(raw) {
    const line = raw.trim()
    setLines((l) => [...l, { t: `visitor@rishit_os:${cwd}$ ${raw}`, cmd: true }])
    if (!line) return
    hist.current.unshift(line); hi.current = -1
    const [c, ...a] = line.split(/\s+/)
    const arg = a.join(' ')
    switch (c) {
      case 'help':
        return out('commands:', '  about  projects  wins  skills  contact  resume  github', '  ls  cd  cat  pwd  whoami  open <world>  clear', '  neofetch  fortune  secrets  date  uptime  history  readme', 'and a few that are not listed. i would try things.')
      case 'ls': {
        const keys = Object.keys(node()).filter((k) => a.includes('-a') || !k.startsWith('.'))
        return out(keys.map((k) => (typeof node()[k] === 'object' ? k + '/' : k)).join('   '))
      }
      case 'cd':
        if (!arg || arg === '~' || arg === '/' || arg === '..') return setCwd('~')
        if (arg.replace('/', '') === 'projects') return setCwd('~/projects')
        return out(`cd: ${arg}: no such directory (it is a portfolio, not a filesystem)`)
      case 'pwd': return out(cwd === '~' ? '/home/visitor' : '/home/visitor/projects')
      case 'cat': {
        if (!arg) return out('cat: which file? try `ls`')
        const f = node()[arg]
        if (f == null || typeof f === 'object') return out(`cat: ${arg}: no such file`)
        return out(f.split('\n'))
      }
      case 'whoami': return out('visitor. but rishit is the one worth hiring.')
      case 'about': return out(FS['about.txt'].split('\n'), `{{notebook|→ see the notebook}}`)
      case 'projects': return out(PROJECTS.map((p) => `${p.n}  ${p.name.padEnd(20)} ${p.tag}`), '{{projects|→ open projects}}   (or: cd projects, cat aisgr.md)')
      case 'wins': return out(WINS.map((w) => `${w.place}  ${w.name}`), '{{arcade|→ play for them in the arcade}}')
      case 'skills': return out(TOOLS.map((t) => t[0]).join(', '), '{{workshop|→ throw them around in the workshop}}')
      case 'contact': return out(FS['contact.txt'].split('\n'), `[[send an email|mailto:${ME.email}]]  {{contact|→ boarding pass}}`)
      case 'resume': window.open(ME.resume, '_blank'); return out('opening resume.pdf ...')
      case 'github': {
        out('fetching from the github api ...')
        const d = await loadGithub()
        const s = streaks(d.days)
        return out(`${d.live ? 'live' : 'offline snapshot'}  ·  ${d.total.toLocaleString()} contributions in the last year  ·  ${d.user.public_repos} public repos`, `current streak ${s.cur}d  ·  longest ${s.longest}d  ·  ${(10000 - d.total).toLocaleString()} to go until 10,000`, '{{forge|→ the forge}}')
      }
      case 'open': {
        const w = WORLDS.find((x) => x.id === arg || x.label === arg)
        if (!w) return out(`open: ${arg || '?'} — try: ${WORLDS.map((x) => x.id).join(', ')}`)
        out(`opening ${w.label}.app ...`); return emit('wipe', w.id)
      }
      case 'readme': {
        const d = document.querySelector('#text-version details')
        if (!d) return out('readme.txt: no such file')
        d.open = true; out('opening readme.txt (the plain text version, at the very bottom) ...')
        return setTimeout(() => scrollToEl(document.querySelector('#text-version'), false, 20), 150)
      }
      case 'clear': return setLines([])
      case 'echo': return out(arg)
      case 'date': return out(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST')
      case 'uptime': return out(`up ${Math.round((Date.now() - T0) / 1000)}s, 1 user, load average: 0.42, 0.37, 0.31 (the fans are fine)`)
      case 'history': return out(hist.current.slice().reverse().map((h, i) => `${i + 1}  ${h}`))
      case 'neofetch':
        return out(
          '  ┌──────┐   visitor@rishit_os',
          '  │ >_RT │   ------------------',
          '  └──────┘   os      rishit_os 4.2',
          '             host    srm ist, kattankulathur',
          '             kernel  react 19 + r3f',
          '             shell   too many tabs',
          '             cpu     caffeine (3 cups)',
          '             gpu     yours. hopefully 60fps',
          `             secrets ${found.length}/${SECRETS.length}`,
        )
      case 'fortune': return out(FORTUNES[(Math.random() * FORTUNES.length) | 0])
      case 'secrets': return out(`${found.length}/${SECRETS.length} found. ${found.length === SECRETS.length ? 'you found all of them. who are you.' : 'keep poking.'}`)
      case 'coffee': return out('brewing... [########..] 80%', 'error: 418 i am a teapot')
      case 'matrix': return emit('fx', 'matrix')
      case 'crash': out('rm -rf --no-preserve-root /sanity'); return setTimeout(() => emit('fx', 'crash'), 500)
      case 'rm': return out('rm: permission denied. nice try though.')
      case 'vim': case 'nano': case 'emacs': return out(`${c}: you can enter. you cannot leave. (try :q! — kidding, it's not installed)`)
      case 'exit': return out('there is no exit. only more portfolio.')
      case 'ping': return out('pong. i replied faster than most recruiters.')
      case 'sudo':
        if (/^hire\s+rishit$/i.test(arg)) { out('[sudo] password for visitor: ********', 'access granted. executing hire.sh ...'); return setTimeout(() => emit('fx', 'hire'), 700) }
        return out('visitor is not in the sudoers file. this incident will be reported (to nobody).', 'psst: there is exactly one sudo command that works here.')
      default: return out(`${c}: command not found. try "help".`)
    }
  }

  const key = (e) => {
    if (e.key === 'Enter') { run(val); setVal('') }
    else if (e.key === 'ArrowUp') { e.preventDefault(); hi.current = Math.min(hi.current + 1, hist.current.length - 1); setVal(hist.current[hi.current] ?? '') }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi.current = Math.max(hi.current - 1, -1); setVal(hist.current[hi.current] ?? '') }
    else if (e.key === 'Tab') {
      e.preventDefault()
      const parts = val.split(' ')
      if (parts.length === 1) { const m = CMDS.filter((c) => c.startsWith(val)); if (m.length === 1) setVal(m[0] + ' '); else if (m.length) out(m.join('  ')) }
      else { const m = Object.keys(node()).filter((k) => k.startsWith(parts[1])); if (m.length === 1) setVal(parts[0] + ' ' + m[0]) }
    } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]) }
  }

  return (
    <div className="term" onClick={() => inp.current?.focus({ preventScroll: true })}>
      <div className="term-out" ref={box} data-lenis-prevent>
        {lines.map((l, i) => <div key={i} className={l.cmd ? 'cmd' : ''}><Line text={l.t} /></div>)}
        <label className="term-in">
          <span>visitor@rishit_os:{cwd}$</span>
          <input ref={inp} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={key} spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" aria-label="terminal input" />
        </label>
      </div>
      <div className="term-chips">
        {['help', 'projects', 'github', 'sudo hire rishit', 'matrix'].map((c) => <button key={c} onClick={() => run(c)}>{c}</button>)}
      </div>
    </div>
  )
}
