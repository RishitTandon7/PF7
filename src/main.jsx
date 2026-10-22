import { createRoot } from 'react-dom/client'
import App from './App'
import { unlock } from './lib/store'
import './styles/global.css'

createRoot(document.getElementById('root')).render(<App />)

// hello, person with devtools open
const art = String.raw`
 ____  ___ ____  _   _ ___ _____
|  _ \|_ _/ ___|| | | |_ _|_   _|
| |_) || |\___ \| |_| || |  | |
|  _ < | | ___) |  _  || |  | |
|_| \_\___|____/|_| |_|___| |_|   tandon
`
console.log('%c' + art, 'color:#39d353;font:700 12px monospace')
console.log('%chey, you\'re the kind of person i want to work with.\n%crishit.tandon.7@gmail.com', 'font:600 14px monospace;color:#ffb000', 'font:14px monospace;color:#f2ecdf')
console.log('%cps: there are 9 secrets on this site. you just found one.', 'color:#888;font:12px monospace')
// chrome evaluates getters on logged elements only when the console is actually open
const probe = new Image()
Object.defineProperty(probe, 'id', { get() { setTimeout(() => unlock('devtools'), 1500); return 'hi' } })
console.log('%c', probe)
