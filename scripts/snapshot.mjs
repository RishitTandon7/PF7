// npm run snapshot -> refreshes the offline fallback used by the forge when the github api is rate limited
import { writeFileSync } from 'node:fs'
const U = 'RishitTandon7'
const j = async (u) => (await fetch(u, { headers: { 'User-Agent': 'rishit-os' } })).json()
const user = await j(`https://api.github.com/users/${U}`)
const repos = await j(`https://api.github.com/users/${U}/repos?per_page=100&sort=pushed`)
const contrib = await j(`https://github-contributions-api.jogruber.de/v4/${U}?y=last`)
const commits = []
for (const r of repos.filter((r) => r.size > 0).slice(0, 6)) {
  const cs = await j(`https://api.github.com/repos/${U}/${r.name}/commits?per_page=8&author=${U}`)
  if (Array.isArray(cs)) for (const c of cs) commits.push({ repo: r.name, sha: c.sha.slice(0, 7), msg: c.commit.message.split('\n')[0].slice(0, 90), at: c.commit.author.date })
}
commits.sort((a, b) => b.at.localeCompare(a.at))
const snap = {
  takenAt: new Date().toISOString(),
  user: { followers: user.followers, following: user.following, public_repos: user.public_repos, created_at: user.created_at },
  repos: repos.map((r) => ({ name: r.name, language: r.language, stars: r.stargazers_count, size: r.size, pushed_at: r.pushed_at, url: r.html_url, fork: r.fork, description: r.description })),
  total: contrib.total.lastYear,
  days: contrib.contributions.map((d) => [d.date, d.count]),
  commits: commits.slice(0, 40),
}
writeFileSync(new URL('../src/data/snapshot.json', import.meta.url), JSON.stringify(snap))
console.log('snapshot ok', snap.repos.length, 'repos', snap.days.length, 'days', snap.commits.length, 'commits', snap.total, 'contribs')
