import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Window } from '../ui/Window'
import GL from '../ui/GL'
import snap from '../data/snapshot.json'
import { loadGithub, streaks, colorOf, LANG_COLORS, repoWeight, ago } from '../lib/github'
import { useVisible } from '../lib/hooks'
import './forge.css'

const GOAL = 10000
// on a phone the 3d scenes never capture the finger (orbit controls did, so the page couldn't be scrolled over them). they auto-rotate instead.
const COARSE = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
const GREENS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
const fmt = (n) => n.toLocaleString('en-US')

/* ---------- odometer: every digit is a column of 0-9 that slides ---------- */
function Odometer({ value }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), 300); return () => clearTimeout(t) }, [])
  const s = fmt(value)
  // the columns exist at 0 first, then slide to the real digit
  return (
    <div className="odo" aria-label={fmt(value)}>
      {[...s].map((ch, i) => /\d/.test(ch)
        ? <span className="odo-d" key={s.length - i}><span className="odo-col" style={{ '--d': on ? ch : 0, transitionDelay: `${(s.length - i) * 70}ms` }}>{'0123456789'.split('').map((n) => <i key={n}>{n}</i>)}</span></span>
        : <span className="odo-c" key={s.length - i}>,</span>)}
    </div>
  )
}

/* ---------- 50 segments, 200 contributions each ---------- */
function Progress({ total }) {
  const seg = GOAL / 50
  const filled = total / seg
  return (
    <div className="prog" role="progressbar" aria-valuenow={total} aria-valuemax={GOAL}>
      {Array.from({ length: 50 }, (_, i) => {
        const f = Math.max(0, Math.min(1, filled - i))
        return <i key={i} style={{ '--f': f, '--k': i / 49, animationDelay: `${i * 22}ms` }} className={f > 0 && f < 1 ? 'part' : ''} />
      })}
    </div>
  )
}

/* ---------- 3d skyline ---------- */
function Skyline({ days, onHover }) {
  const mesh = useRef(), t0 = useRef(null)
  const { cells, max } = useMemo(() => {
    const start = new Date(days[0][0] + 'T00:00:00Z').getUTCDay()
    const nz = days.map((d) => d[1]).filter(Boolean).sort((a, b) => a - b)
    const q = [0.25, 0.5, 0.75].map((p) => nz[Math.floor(nz.length * p)] || 1)
    const cells = days.map(([date, n], i) => {
      const wk = Math.floor((i + start) / 7), wd = (i + start) % 7
      const lvl = n === 0 ? 0 : n <= q[0] ? 1 : n <= q[1] ? 2 : n <= q[2] ? 3 : 4
      return { date, n, x: (wk - 26) * 0.56, z: (wd - 3) * 0.56, h: n === 0 ? 0.06 : 0.3 + Math.sqrt(n) * 0.85, lvl, wk }
    })
    return { cells, max: Math.max(...days.map((d) => d[1])) }
  }, [days])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    const c = new THREE.Color()
    cells.forEach((cell, i) => mesh.current.setColorAt(i, c.set(GREENS[cell.lvl])))
    mesh.current.instanceColor.needsUpdate = true
    t0.current = null
    mesh.current.userData.done = 0
  }, [cells])
  useFrame((s) => {
    if (t0.current == null) t0.current = s.clock.elapsedTime
    const t = s.clock.elapsedTime - t0.current
    if (t > 3.5 && mesh.current.userData.done === cells.length) return
    // buildings rise one week at a time, left to right
    cells.forEach((c, i) => {
      const k = Math.max(0, Math.min(1, (t - c.wk * 0.035) / 0.7))
      const e = 1 - Math.pow(1 - k, 3)
      dummy.position.set(c.x, (c.h * e) / 2, c.z)
      dummy.scale.set(0.46, Math.max(0.001, c.h * e), 0.46)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (t > 3.5) mesh.current.userData.done = cells.length
  })
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[8, 14, 6]} intensity={2.6} />
      <directionalLight position={[-10, 6, -8]} intensity={1} color="#39d353" />
      <instancedMesh ref={mesh} args={[null, null, cells.length]}
        onPointerMove={(e) => { e.stopPropagation(); onHover(cells[e.instanceId]) }} onPointerOut={() => onHover(null)}>
        <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[34, 8]} /><meshStandardMaterial color="#0d1117" /></mesh>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} enableDamping minPolarAngle={0.45} maxPolarAngle={1.45} target={[0, 0.5, 0]} enabled={!COARSE} />
    </>
  )
}

/* ---------- repo galaxy ---------- */
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000 }

function Galaxy({ repos, lang, onHover }) {
  const meshes = useRef([])
  const nodes = useMemo(() => {
    const sorted = [...repos].sort((a, b) => repoWeight(b) - repoWeight(a))
    return sorted.map((r, i) => {
      const arm = i % 3, ang = i * 0.62 + arm * 2.094, rad = 1.3 + Math.sqrt(i) * 0.95 + hash(r.name) * 0.6
      const w = repoWeight(r)
      return { r, w, x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, y: (hash(r.name + 'y') - 0.5) * 1.4 * (1 - i / sorted.length * 0.4), s: Math.min(0.46, 0.09 + w * 0.085) }
    })
  }, [repos])
  const core = useRef()
  useFrame((s) => {
    nodes.forEach((n, i) => {
      const m = meshes.current[i]; if (!m) return
      const on = !lang || n.r.language === lang
      const target = (on ? 1 : 0.35) * (m.userData.hot ? 1.5 : 1)
      m.scale.x += (target - m.scale.x) * 0.15; m.scale.setScalar(m.scale.x)
      m.material.emissiveIntensity += ((on ? 0.9 : 0.1) - m.material.emissiveIntensity) * 0.15
    })
    core.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 2) * 0.06)
  })
  return (
    <>
      <ambientLight intensity={0.5} /><pointLight position={[0, 0, 0]} intensity={30} color="#39d353" />
      <mesh ref={core}><icosahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color="#39d353" emissive="#26a641" emissiveIntensity={1.5} wireframe /></mesh>
      {[2.5, 4.5, 6.5, 8.5].map((r) => <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r, r + 0.012, 96]} /><meshBasicMaterial color="#30363d" transparent opacity={0.6} /></mesh>)}
      {nodes.map((n, i) => (
        <mesh key={n.r.name} ref={(el) => (meshes.current[i] = el)} position={[n.x, n.y, n.z]}
          onPointerOver={(e) => { e.stopPropagation(); meshes.current[i].userData.hot = true; onHover(n.r); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { meshes.current[i].userData.hot = false; onHover(null); document.body.style.cursor = '' }}
          onClick={(e) => { if (e.delta < 5) window.open(n.r.url, '_blank', 'noopener') }}>
          <sphereGeometry args={[n.s, 18, 14]} />
          <meshStandardMaterial color={colorOf(n.r.language)} emissive={colorOf(n.r.language)} emissiveIntensity={0.9} roughness={0.4} />
        </mesh>
      ))}
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.35} enableDamping minPolarAngle={0.3} maxPolarAngle={1.5} enabled={!COARSE} />
    </>
  )
}

/* ---------- language ring ---------- */
function Ring({ repos, lang, setLang }) {
  const data = useMemo(() => {
    const c = {}
    repos.forEach((r) => { const l = r.language || 'other'; c[l] = (c[l] || 0) + 1 })
    const all = Object.entries(c).sort((a, b) => b[1] - a[1])
    return all
  }, [repos])
  const total = data.reduce((s, d) => s + d[1], 0)
  const R = 72, C = 2 * Math.PI * R
  let off = 0
  const cur = data.find((d) => d[0] === lang)
  return (
    <div className="ring">
      <svg viewBox="0 0 200 200" role="img" aria-label="languages by repo count">
        <g transform="rotate(-90 100 100)">
          {data.map(([l, n]) => {
            const len = (n / total) * C
            const el = <circle key={l} cx="100" cy="100" r={R} fill="none" stroke={colorOf(l)} strokeWidth={lang === l ? 30 : 22} strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`} strokeDashoffset={-off} opacity={!lang || lang === l ? 1 : 0.25} style={{ transition: 'stroke-width .2s, opacity .2s', cursor: 'pointer' }} onClick={() => setLang(lang === l ? null : l)} onPointerEnter={() => setLang(l)} />
            off += len
            return el
          })}
        </g>
        <text x="100" y="96" textAnchor="middle" className="ring-big">{cur ? cur[1] : total}</text>
        <text x="100" y="114" textAnchor="middle" className="ring-sm">{cur ? cur[0] : 'repos'}</text>
      </svg>
      <ul className="legend">
        {data.slice(0, 8).map(([l, n]) => (
          <li key={l}><button className={lang === l ? 'on' : ''} onClick={() => setLang(lang === l ? null : l)}><i style={{ background: colorOf(l) }} />{l.toLowerCase()} <b>{n}</b></button></li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- commit log ---------- */
function CommitLog({ commits, live }) {
  const list = commits.length ? commits : snap.commits
  return (
    <div className="clog">
      <div className="clog-bar"><b>$ git log --all --author=RishitTandon7</b><span className={live ? 'live' : ''}>{live ? '● live' : '○ snapshot'}</span></div>
      <div className="clog-roll">
        <div className="clog-track" style={{ '--n': list.length }}>
          {[...list, ...list].map((c, i) => (
            <p key={i}><code>{c.sha}</code> <em>{c.repo}</em> {c.msg} <time>{ago(c.at)}</time></p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Forge() {
  const root = useRef()
  const vis = useVisible(root, '-10% 0px')
  const [d, setD] = useState({ ...snap, live: false })
  const [syncing, setSyncing] = useState(true)
  const [lang, setLang] = useState(null)
  const [day, setDay] = useState(null)
  const [repo, setRepo] = useState(null)
  const tip = useRef()

  useEffect(() => { loadGithub().then((x) => { setD(x); setSyncing(false) }) }, [])

  const st = useMemo(() => streaks(d.days), [d])
  const daysLeft = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), 11, 31) - new Date()) / 864e5))
  const toGo = Math.max(0, GOAL - d.total)
  const move = (e) => { if (tip.current) { tip.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)` } }
  const best = useMemo(() => d.days.reduce((b, x) => (x[1] > b[1] ? x : b), ['', 0]), [d])

  return (
    <section className="w-forge" ref={root} onPointerMove={move}>
      <Window title="forge.app" barClass="fg-bar">
        <div className="fg-head">
          <p className="fg-kicker">{syncing ? 'syncing with github ...' : d.live ? 'live · github api · refreshed every 30 min' : `offline snapshot · ${new Date(d.takenAt).toLocaleDateString('en-GB')}`}</p>
          <h2>the forge</h2>
          <p className="fg-sub">this is the thing i'm proudest of. every square is a day i showed up and shipped something. the number is real. it comes straight from github.</p>
        </div>

        <div className="fg-counter">
          <div className="fg-big">
            <Odometer value={d.total} />
            <span className="fg-of">/ 10,000 contributions · last 12 months</span>
            <Progress total={d.total} />
            <div className="fg-prog-meta"><span>{toGo ? `${fmt(toGo)} to go` : 'goal smashed. new goal: 20,000.'}</span><span>needs ~{(toGo / daysLeft).toFixed(1)}/day until dec 31</span></div>
          </div>
          <dl className="fg-stats">
            <div><dt>current streak</dt><dd>{st.cur}<small>d</small></dd></div>
            <div><dt>longest streak</dt><dd>{st.longest}<small>d</small></dd></div>
            <div><dt>best day</dt><dd>{best[1]}<small>{best[0].slice(5)}</small></dd></div>
            <div><dt>public repos</dt><dd>{d.user.public_repos}</dd></div>
            <div><dt>followers</dt><dd>{d.user.followers}</dd></div>
          </dl>
        </div>

        <div className="fg-sky">
          <GL camera={{ position: [0, 13, 31], fov: 38 }}>
            <Skyline days={d.days} onHover={setDay} />
          </GL>
          <p className="fg-cap">the skyline — {typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches ? 'auto-rotating · tap a day' : 'drag to orbit · hover a day'} · taller = more commits</p>
        </div>

        <div className="fg-mid">
          <div className="fg-galaxy">
            <h3>repo galaxy</h3>
            <GL camera={{ position: [0, 9, 14], fov: 40 }}>
              <Galaxy repos={d.repos} lang={lang} onHover={setRepo} />
            </GL>
            <p className="fg-cap">size = activity · color = language · {typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches ? 'auto-rotating · tap a planet to open the repo' : 'click a planet to open the repo'}</p>
          </div>
          <div className="fg-ringwrap">
            <h3>language ring</h3>
            <Ring repos={d.repos} lang={lang} setLang={setLang} />
          </div>
        </div>

        <CommitLog commits={d.commits} live={d.live} />

        <div className="fg-tip" ref={tip}>
          {day && <><b>{day.n} contribution{day.n === 1 ? '' : 's'}</b><span>{new Date(day.date + 'T00:00:00Z').toDateString().toLowerCase()}</span></>}
          {repo && !day && <><b>{repo.name}</b><span>{(repo.language || 'no language').toLowerCase()} · pushed {ago(repo.pushed_at)}{repo.stars ? ` · ${repo.stars} stars` : ''}</span></>}
        </div>
      </Window>
    </section>
  )
}
