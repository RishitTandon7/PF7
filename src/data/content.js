// every word on the site lives here. lowercase on purpose.
// TODO(rishit): project blurbs were written from repo names + what you told me. check the details, fix anything i guessed.

export const REPO_TOTAL = 104 // repos on github (public + private), per rishit. the live api only sees the public ones.
export const ME = {
  name: 'rishit tandon',
  email: 'rishit.tandon.7@gmail.com',
  github: 'https://github.com/RishitTandon7',
  linkedin: 'https://www.linkedin.com/in/rishit-tandon-928661287',
  whatsapp: 'https://wa.me/917394865520',
  resume: '/Rishit-Tandon-Resume.pdf', // public/Rishit-Tandon-Resume.pdf
  hub: 'https://rishit.site', // the hub where everything of mine is connected
}

export const BOOT_STACK = [
  'python 3.12', 'typescript', 'react 19', 'three.js / r3f', 'gsap + lenis', 'pytorch', 'opencv',
  'arduino / esp32', 'unity', 'blender', 'node', 'java', 'c++', 'flutter', 'docker', 'linux',
]

export const EDU = {
  degree: 'b.tech, computer science & engineering',
  school: 'srm institute of science and technology',
  years: '2023 — 2027',
  cgpa: '9.2',
  electives: [
    { name: 'metaverse', rank: 'top 80 / batch' },
    { name: 'responsible ai', rank: 'top 120 / batch' },
  ],
  before: [
    { name: 'dps lucknow', year: '2023', cls: 'class 12' },
    { name: 'jaipuria', year: '2021', cls: 'class 10' },
  ],
}

export const NIDM = {
  role: 'research intern',
  org: 'srm ist × nidm',
  line: 'south lhonak lake sits in the upper teesta (tista) catchment in sikkim. in oct 2023 it burst and the flood ran down the valley past chungthang. minutes matter there. my job was making the warning arrive faster.',
  stat: '40%',
  statLabel: 'lower alert latency',
  bullets: [
    'built the glof (glacial lake outburst flood) alert pipeline',
    'cut alert latency by 40% — fewer seconds between sensor and siren',
    'research code that actually ran, not a notebook that lived and died on my laptop',
  ],
}

export const DGTL = {
  role: 'developer intern',
  org: 'dgtl innovations',
  query: '-20%',
  retention: '+15%',
}

export const PROJECTS = [
  {
    id: 'aisgr', n: '01', name: 'aisgr glasses', tag: 'smart glasses, since 2021', cls: 'p-aisgr',
    problem: 'in 2021 "smart glasses" was not a thing people wanted yet. nobody was building them, and your phone was still the only way to ask "what am i looking at?".',
    built: 'i started building my own smart glasses in 2021, the same idea as the meta ray-bans of today, before it was a product category. a first-person hud with detection boxes, labels and live captions, on a pair i put together myself.',
    impact: 'i was building a replica of what meta ships now, years before it was obvious. the demo below is the hud, move your cursor to look around.',
    tech: ['python', 'opencv', 'ml', 'embedded'],
    links: [{ t: 'github', u: 'https://github.com/RishitTandon7/A.I.S.G.R.' }],
  },
  {
    id: 'neurovibe', n: '02', name: 'neurovibe', tag: 'bci wheelchair', cls: 'p-neuro',
    problem: 'a wheelchair with a joystick is useless if you can\'t use your hands.',
    built: 'a brain-computer-interface wheelchair. eeg in, intent classified, motors out. yes, it moves when you think at it.',
    impact: 'mobility without hands. the one project i still get a little emotional about.',
    tech: ['c++', 'eeg', 'signal processing', 'arduino'],
    video: '1Srq_t-Rbzm9CPYDdRB-g8Yhbs1Diwa6S',
    links: [
      { t: 'neurovibe', u: 'https://github.com/RishitTandon7/NeuroVibe' },
      { t: 'wheelchair', u: 'https://github.com/RishitTandon7/NeuroVibe-Wheelchair' },
    ],
  },
  {
    id: 'arclyth', n: '03', name: 'arclyth swarm', tag: 'drone swarm', cls: 'p-arc',
    problem: 'one drone is a toy. three drones that agree with each other is a system.',
    built: 'a three-drone swarm — crux, oberon, capella — that flies formations over terrain and covers ground together.',
    impact: 'one operator, three aircraft, zero collisions (so far. knock on wood).',
    tech: ['python', 'control', 'swarm logic', 'telemetry'],
    links: [],
  },
  {
    id: 'agentmarket', n: '04', name: 'agent marketplace', tag: 'app store for agents', cls: 'p-market',
    problem: 'everyone is building ai agents. nobody can find or trust one.',
    built: 'an app store for agents: browse, install, and mint an api key for the one you want, in one click.',
    impact: 'agents become something you pick off a shelf instead of rebuild from scratch.',
    tech: ['typescript', 'react', 'api keys', 'auth'],
    links: [{ t: 'live', u: 'https://agentlab.rishit.site' }, { t: 'github', u: 'https://github.com/RishitTandon7/Agent-Marketplace' }],
  },
  {
    id: 'linkedout', n: '05', name: 'linkedout pro', tag: 'live', cls: 'p-linked',
    problem: 'writing posts, replies and outreach on linkedin eats hours that should go to building.',
    built: 'a feed that writes itself. draft, tune, queue. the demo is live, go click around.',
    impact: 'a working product with a real url, not a screenshot in a slide.',
    tech: ['javascript', 'llm', 'automation'],
    links: [
      { t: 'live', u: 'https://linkedout.rishit.site' },
      { t: 'github', u: 'https://github.com/RishitTandon7/Linked-Out-Pro' },
    ],
  },
  {
    id: 'multiverse', n: '06', name: 'multiverse', tag: 'digital twin', cls: 'p-multi',
    problem: 'you can\'t babysit a physical system from a spreadsheet of sensor readings.',
    built: 'a digital twin with a unity-style viewport. live sensor nodes sit in a 3d scene and tell you when something drifts.',
    impact: 'see the whole system at a glance, then click into the node that\'s lying.',
    tech: ['three.js', 'unity', 'iot', 'websockets'],
    links: [],
  },
  {
    id: 'documind', n: '07', name: 'documind', tag: 'ocr → graph', cls: 'p-doc',
    problem: 'documents are where knowledge goes to die. pdfs, scans, photos of whiteboards.',
    built: 'scan a document, ocr it, pull out the entities, and wire them into a knowledge graph you can actually query.',
    impact: 'a pile of paper becomes a map you can walk around.',
    tech: ['typescript', 'ocr', 'knowledge graph', 'llm'],
    links: [{ t: 'github', u: 'https://github.com/RishitTandon7/DocuMind' }],
  },
]

// leadership: listed first on the site. TODO(rishit): add real numbers (teams, judges, attendees, seats) if you want them shown.
export const JARVIS = {
  id: 'jarvis', n: '02', name: 'jarvis', tag: 'ai assistant', cls: 'p-jarvis',
  problem: 'most assistants are either dumb, or they belong to somebody else and only do what their app allows.',
  built: 'jarvis: my own ai assistant, and it talks back. it can create a project, deploy it, and write you a short research paper. you speak, it does the work.',
  impact: 'the most powerful thing i have built. try the demo below, it speaks (turn your sound on).',
  tech: ['python', 'llm', 'voice', 'automation', 'deploy'],
  video: '1E2VRHPcc-AkKqp-KyoyC5gsT9SFug6pp', // google drive file id of the demo video
  links: [{ t: 'github', u: 'https://github.com/RishitTandon7/JARVIS' }],
}
PROJECTS.unshift(JARVIS)
PROJECTS.forEach((p, i) => (p.n = String(i + 1).padStart(2, '0')))

export const WINS = [
  { place: '1ST', name: 'sutd smorphi — singapore', note: 'international. yes, i flew for this.' },
  { place: '1ST', name: 'cismohack', note: 'national' },
  { place: '1ST', name: 'ml project expo', note: '' },
  { place: '1ST', name: 'south india conclave', note: '' },
  { place: '1ST', name: 'semiconductor expo', note: '' },
  { place: '1ST', name: 'nwc expo', note: '' },
  { place: '2ND', name: 'c.tech expo', note: 'so close' },
  { place: '2ND', name: 'arduino hackathon', note: 'wires everywhere' },
  { place: '3RD', name: 'bis', note: '' },
  { place: '4TH', name: 'hack sustain', note: 'fourth is the worst place. respectfully.' },
  { place: '5TH', name: 'srm founder\'s hack', note: 'still counts' },
]

// skill -> shape of the tool it hangs as on the pegboard
export const TOOLS = [
  ['python', 'wrench'], ['typescript', 'hammer'], ['javascript', 'screwdriver'], ['react', 'pliers'],
  ['three.js', 'drill'], ['pytorch', 'saw'], ['opencv', 'multimeter'], ['arduino', 'iron'],
  ['c++', 'wrench'], ['java', 'hammer'], ['unity', 'drill'], ['blender', 'pliers'],
  ['node', 'screwdriver'], ['docker', 'tape'], ['git', 'saw'], ['linux', 'iron'],
  ['flutter', 'tape'], ['esp32', 'multimeter'],
]

export const CERT_COUNT = 40

export const CHANGELOG = [
  ['feat', 'nine secrets. i will not tell you where'],
  ['fix', 'stopped crying about the physics engine'],
  ['perf', 'one raf to rule them all'],
  ['feat', 'boarding pass you can actually tear'],
  ['chore', 'deleted the glowing orb. you\'re welcome'],
  ['fix', 'it worked on my machine (it was my machine)'],
  ['wip', 'sleep'],
]

export const FORTUNES = [
  'it works on my machine. ship my machine.',
  'a bug is just a feature with bad pr.',
  'commit early, commit often, never read the log.',
  'there are 10 kinds of people. you opened a terminal on a portfolio, so you\'re the fun kind.',
  'sleep is just compile time for your brain.',
  'the best code is the code you deleted in the last commit.',
]

// the three roles, shown as hanging id badges. TODO(rishit): add what the isd lab builds + your dates if you want them on the badge.
export const ROLES = [
  { id: 'intern', kind: 'intern', title: 'research intern', org: 'srm ist × nidm', tag: 'RESEARCH', line: 'glacial lake flood early warnings.', back: ['built the glof alert pipeline', 'cut alert latency by 40%', 'research code that actually ran'], go: ['mission', 'take the tour →'] },
  { id: 'convenor', kind: 'convenor', title: 'student convenor', org: 'robofest 2.0 · srm ist', tag: 'ORGANISER', line: 'one of the biggest international events at srm.', back: ['led the team that ran the event', 'built the judging, attendance and seat portal'], go: ['contact', 'work with me →'] },
  // lab facts are from srmist.edu.in/lab/intelligent-system-design-lab. TODO(rishit): add what YOU lead there (projects, team size).
  { id: 'lead', kind: 'lead', title: 'technical lead', org: 'isd lab · srm ist', tag: 'ALL AREAS', line: 'intelligent system design lab: robotics, embedded + edge ai. project-based: build, test, deploy real systems.', back: ['robotics: cars, arms, sensor systems', 'embedded + iot: stm32, esp32, pcbs', 'edge ai: jetson, lidar, cameras', 'e-yantra partner lab'], go: ['https://www.srmist.edu.in/lab/intelligent-system-design-lab/', 'about the lab ↗'] },
]
