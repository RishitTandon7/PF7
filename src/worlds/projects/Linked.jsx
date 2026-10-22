import { useEffect, useRef, useState } from 'react'
import { useTick, useVisible } from '../../lib/hooks'

// the feed that writes itself. the posts are a joke about the platform it's named after.
const POSTS = [
  { who: 'a founder', role: 'ceo, stealth', text: 'i got rejected 47 times. then i got a coffee. here are 9 lessons about leadership. (thread) #grindset #humbled' },
  { who: 'a recruiter', role: 'talent partner', text: 'thrilled to announce that i am humbled to be excited about this opportunity. agree? #blessed' },
  { who: 'a dev', role: 'senior engineer', text: 'i deleted prod today. here is what it taught me about resilience. #buildinpublic' },
  { who: 'rishit', role: 'builds the thing that writes these', text: 'this entire feed was written by a script i wrote at 3am. it has never once felt humbled.' },
]

function Post({ p, go, onDone }) {
  const [n, setN] = useState(0)
  const [likes, setLikes] = useState(0)
  const acc = useRef(0)
  const fired = useRef(false)
  useTick((_, dt) => {
    acc.current += dt * 55
    const step = Math.floor(acc.current)
    if (!step) return
    acc.current -= step
    if (n < p.text.length) setN((v) => Math.min(p.text.length, v + step))
    else if (likes < 9 + p.text.length % 40) setLikes((l) => l + 1 + (l > 8 ? 2 : 0))
    else if (!fired.current) { fired.current = true; onDone() }
  }, go)
  return (
    <article className="post">
      <header><i>{p.who[0]}</i><div><b>{p.who}</b><small>{p.role}</small></div></header>
      <p>{p.text.slice(0, n)}{n < p.text.length && <span className="caret" />}</p>
      <footer><span>▲ {likes}</span><span>{Math.floor(likes / 4)} comments</span><span>{Math.floor(likes / 9)} reposts</span></footer>
    </article>
  )
}

export default function Linked() {
  const wrap = useRef()
  const vis = useVisible(wrap)
  const [shown, setShown] = useState(1)
  useEffect(() => { if (!vis) return; const el = wrap.current.querySelector('.feed'); el.scrollTop = el.scrollHeight }, [shown, vis])
  return (
    <div className="vis linked-vis" ref={wrap}>
      <div className="li-top"><b>linkedout<span>pro</span></b><a href="https://linkedout.rishit.site" target="_blank" rel="noreferrer">open the real one ↗</a></div>
      <div className="feed" data-lenis-prevent>
        {POSTS.slice(0, shown).map((p, i) => (
          <Post key={i} p={p} go={vis && i === shown - 1} onDone={() => setTimeout(() => setShown((s) => Math.min(POSTS.length, s + 1)), 600)} />
        ))}
      </div>
      <small className="vis-cap">posts: {shown}/{POSTS.length} · typing speed: suspiciously human</small>
    </div>
  )
}
