import { useEffect, useState } from 'react'
import { on } from '../lib/bus'
import { useFound, SECRETS } from '../lib/store'
import { coin } from '../lib/audio'

export default function Toasts() {
  const [list, setList] = useState([])
  const found = useFound()
  useEffect(() => on('toast', (s) => {
    coin()
    const id = Math.random()
    setList((l) => [...l, { ...s, id }])
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 4200)
  }), [])
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast">
          <b>secret unlocked</b> {t.name}
          <span>{found.length}/{SECRETS.length}{found.length === SECRETS.length ? ' — you found everything. email me.' : ''}</span>
        </div>
      ))}
    </div>
  )
}
