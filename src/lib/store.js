import { useSyncExternalStore } from 'react'
import { emit } from './bus'

// achievements. 9 hidden things, saved in localStorage so refreshing doesn't un-find them
export const SECRETS = [
  { id: 'konami', name: 'old school', hint: 'a famous cheat code. you know the one.' },
  { id: 'hired', name: 'good decision', hint: 'there is a sudo command for this' },
  { id: 'matrix', name: 'red pill', hint: 'the terminal has opinions about movies' },
  { id: 'crash', name: 'kernel panic', hint: 'break the terminal. on purpose.' },
  { id: 'devtools', name: 'nosy', hint: 'f12 is a lifestyle' },
  { id: 'torn', name: 'boarding', hint: 'one-way ticket. rip it.' },
  { id: 'insomnia', name: 'sleep is a bug', hint: 'a todo comment is begging to be clicked' },
  { id: 'highscore', name: 'hall of fame', hint: 'put your initials in the arcade table' },
  { id: 'fling', name: 'workplace hazard', hint: 'throw a tool. hard.' },
]
let found = new Set()
try { found = new Set(JSON.parse(localStorage.getItem('rt_secrets') || '[]')) } catch {}
let snap = [...found]
const subs = new Set()
const notify = () => { snap = [...found]; subs.forEach((f) => f()) }

export function unlock(id) {
  if (found.has(id)) return
  found.add(id)
  try { localStorage.setItem('rt_secrets', JSON.stringify([...found])) } catch {}
  notify()
  emit('toast', SECRETS.find((s) => s.id === id))
}
export function resetSecrets() {
  found = new Set()
  try { localStorage.removeItem('rt_secrets') } catch {}
  notify()
}
export const useFound = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => snap)
