import snap from '../data/snapshot.json'

const U = 'RishitTandon7'
const KEY = 'rt_gh_v2'
const TTL = 30 * 60 * 1000

export const LANG_COLORS = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219',
  'C++': '#f34b7d', 'Jupyter Notebook': '#DA5B0B', Dart: '#00B4AB', PHP: '#4F5D95', other: '#8b949e',
}
export const colorOf = (l) => LANG_COLORS[l] || LANG_COLORS.other

const get = async (u) => {
  const r = await fetch(u)
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

async function fetchLive() {
  const [user, repos, contrib] = await Promise.all([
    get(`https://api.github.com/users/${U}`),
    get(`https://api.github.com/users/${U}/repos?per_page=100&sort=pushed`),
    get(`https://github-contributions-api.jogruber.de/v4/${U}?y=last`),
  ])
  const commits = []
  // events api dropped commit messages, so read the commit lists of the freshest repos
  await Promise.all(repos.filter((r) => r.size > 0).slice(0, 5).map(async (r) => {
    try {
      const cs = await get(`https://api.github.com/repos/${U}/${r.name}/commits?per_page=8&author=${U}`)
      for (const c of cs) commits.push({ repo: r.name, sha: c.sha.slice(0, 7), msg: c.commit.message.split('\n')[0].slice(0, 90), at: c.commit.author.date })
    } catch {}
  }))
  commits.sort((a, b) => b.at.localeCompare(a.at))
  return {
    takenAt: new Date().toISOString(),
    user: { followers: user.followers, following: user.following, public_repos: user.public_repos, created_at: user.created_at },
    repos: repos.map((r) => ({ name: r.name, language: r.language, stars: r.stargazers_count, size: r.size, pushed_at: r.pushed_at, url: r.html_url, fork: r.fork, description: r.description })),
    total: contrib.total.lastYear,
    days: contrib.contributions.map((d) => [d.date, d.count]),
    commits: commits.slice(0, 40),
    live: true,
  }
}

let inflight
export function loadGithub() {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (c && Date.now() - c.t < TTL) return c.d
    } catch {}
    try {
      const d = await fetchLive()
      try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d })) } catch {}
      return d
    } catch {
      return { ...snap, live: false }
    }
  })()
  return inflight
}

export function streaks(days) {
  let longest = 0, run = 0
  for (const [, n] of days) { run = n > 0 ? run + 1 : 0; longest = Math.max(longest, run) }
  // today may still be empty, so don't let it break the current streak
  let cur = 0, i = days.length - 1
  if (days[i] && days[i][1] === 0) i--
  for (; i >= 0 && days[i][1] > 0; i--) cur++
  return { cur, longest }
}

export function repoWeight(r) {
  const age = (Date.now() - new Date(r.pushed_at)) / 864e5
  return Math.max(0.15, Math.log10(r.size + 10) * 0.55 + r.stars * 1.2 + Math.max(0, 1 - age / 400) * 1.4)
}

export const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 90) return 'just now'
  if (s < 3600) return Math.round(s / 60) + 'm ago'
  if (s < 86400) return Math.round(s / 3600) + 'h ago'
  return Math.round(s / 86400) + 'd ago'
}
