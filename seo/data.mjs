// single source of truth for every page, json-ld block, sitemap entry, llms.txt line and og image.
// facts come from the brief + what is already on the site. anything unknown is a TODO(rishit) in an html comment, never visible text.

export const SITE = 'https://portfolio.rishit.site'
export const NAME = 'Rishit Tandon'
export const LINKS = {
  github: 'https://github.com/RishitTandon7',
  linkedin: 'https://www.linkedin.com/in/rishit-tandon-928661287',
  hub: 'https://rishit.site',
  email: 'rishit.tandon.7@gmail.com',
}
export const INTRO = 'I am Rishit Tandon, a final-year B.Tech computer science student at SRM Institute of Science and Technology (Kattankulathur, Chennai), graduating in 2027. I build AI agents, autonomous drones, smart glasses, hardware with Arduino and ESP32, and full-stack products. I have 12+ hackathon wins, 6 of them first places, and 100+ public GitHub repositories. I am looking for SDE and AI/ML engineer roles from 2027.'

export const HOME = {
  path: '/',
  title: 'Rishit Tandon | AI/ML Engineer & Full-Stack Dev Portfolio',
  desc: 'Rishit Tandon, final-year CSE student at SRM IST. AI/ML engineer and full-stack developer building AI agents, drones and smart glasses. 12+ hackathon wins.',
  h1: 'Rishit Tandon — AI/ML Engineer & Full-Stack Developer',
  og: '/og/home.png',
}

// ---------- projects ----------
export const PROJECTS = [
  {
    slug: 'arclyth', name: 'Arclyth', tag: 'Disaster relief drone swarm',
    title: 'Arclyth: 3-Drone Disaster Relief Swarm | Rishit Tandon',
    desc: 'Arclyth is a three-drone disaster relief swarm built by Rishit Tandon, a national hackathon winner. Read the problem, the swarm approach and the tech behind it.',
    short: 'A three-drone disaster relief swarm that won a national hackathon.',
    kw: 'disaster relief drone swarm project',
    problem: [
      'When a flood, landslide or earthquake hits, the first hours decide how many people can be reached. Roads are often cut, the area is large, and one aircraft can only look at one place at a time. A single drone is useful, but it is a camera on a stick. It cannot cover a wide area quickly, and when it fails the mission ends.',
      'Arclyth was built around a simple idea: one operator, several aircraft that cooperate. A swarm covers more ground, keeps working if one unit drops out, and lets different drones take different jobs at the same time.',
    ],
    approach: [
      'Arclyth is a swarm of three drones, named Crux, Oberon and Capella. The three aircraft fly as one coordinated group instead of three separate machines, sharing the work of searching an area. The project won a national hackathon.',
      'The portfolio shows the swarm as a 3D scene: three drones flying a breathing triangle formation over terrain, each leaving a coloured trail and carrying its name.',
    ],
    results: [
      'National hackathon winner.',
      'Three named aircraft flying together as one system, built for disaster relief scenarios.',
    ],
    stack: ['Drones and flight control', 'Swarm coordination logic', 'Embedded hardware'],
    links: [],
    todo: 'which national hackathon, flight controller, drone hardware, comms link, number of people on the team, GitHub repo link, screenshots/photos',
    related: ['slam-drone', 'glof-early-warning', 'neurovibe-bci'],
    about: 'Arclyth, a three-drone swarm for disaster relief, built by Rishit Tandon. National hackathon winner.',
  },
  {
    slug: 'aisgr-smart-glasses', name: 'A.I.S.G.R. Smart Glasses', tag: 'AI smart glasses with a Jarvis assistant',
    title: 'A.I.S.G.R. AI Smart Glasses with Jarvis | Rishit Tandon',
    desc: 'A.I.S.G.R. is a pair of AI smart glasses with a Jarvis voice assistant, started by Rishit Tandon in 2021, before smart glasses became a product category.',
    short: 'AI smart glasses with a Jarvis assistant, started in 2021.',
    kw: 'AI smart glasses project',
    problem: [
      'In 2021 the idea of everyday smart glasses had barely started. Your phone was still the only way to ask what you were looking at: you had to stop, take it out and point it. The idea behind A.I.S.G.R. was to put the camera, the intelligence and the answer on your face, so the question and the answer happen where you are already looking.',
    ],
    approach: [
      'A.I.S.G.R. (version 1 is shown in the photo on this page) is a pair of glasses with a camera in the frame, a battery in the arm and a physical power switch. It works with Jarvis, an AI assistant built by Rishit that you talk to and that can create projects, deploy them and write short research papers.',
      'Rishit started building the glasses in 2021, the same concept as the Meta Ray-Ban glasses that came later, before smart glasses were a recognised product category. The portfolio includes a demo of a first-person heads-up display with detection boxes, labels and live captions.',
    ],
    results: [
      'A working first version of the hardware, shown in the photo.',
      'A voice assistant, Jarvis, with its own demo video on the portfolio.',
      'Started in 2021, years before consumer smart glasses took off.',
    ],
    stack: ['Computer vision', 'Embedded hardware', 'LLM assistant (Jarvis)', 'Python'],
    links: [{ t: 'A.I.S.G.R. on GitHub', u: 'https://github.com/RishitTandon7/A.I.S.G.R.' }, { t: 'Jarvis on GitHub', u: 'https://github.com/RishitTandon7/JARVIS' }],
    todo: 'exact hardware (camera module, board, display, battery), which models run on-device vs in the cloud, battery life, what Jarvis can do on the glasses',
    img: { src: '/media/aisgr-v1.webp', alt: 'A.I.S.G.R. v1 smart glasses with camera in the frame, battery in the arm and a power switch', w: 1200, h: 600 },
    related: ['documind', 'agenthub', 'neurovibe-bci'],
    about: 'A.I.S.G.R., AI smart glasses with the Jarvis assistant, started by Rishit Tandon in 2021.',
  },
  {
    slug: 'documind', name: 'DocuMind', tag: 'Agentic document intelligence',
    title: 'DocuMind: Agentic Document Intelligence with RAG | Rishit Tandon',
    desc: 'DocuMind turns documents into answers: adaptive DIP, OCR, a knowledge graph and hybrid RAG in one agentic pipeline, built by Rishit Tandon.',
    short: 'Agentic document intelligence: adaptive DIP, OCR, knowledge graph and hybrid RAG.',
    kw: 'agentic document intelligence RAG',
    problem: [
      'Most of the useful knowledge in an organisation is locked in documents: scans, PDFs, photos of whiteboards, forms. A person has to read them to find anything. A plain keyword search misses scans entirely, and a plain chatbot over raw text often loses the structure that makes a document meaningful.',
    ],
    approach: [
      'DocuMind is an agentic document intelligence system. It combines four ideas: adaptive digital image processing (DIP) to clean up scans before they are read, OCR to turn the image into text, a knowledge graph that connects the people, dates, amounts and organisations found in the documents, and hybrid RAG (retrieval-augmented generation) that answers questions using both the graph and the text.',
      'In plain terms: scan a document, read it, understand how its facts connect, and then ask questions about it. The portfolio demo shows the flow as a scan line, then recognised text boxes, then a small knowledge graph forming.',
    ],
    results: [
      'One pipeline from a raw scan to answers.',
      'A knowledge graph that makes the documents queryable, not just searchable.',
    ],
    stack: ['OCR', 'Adaptive image processing', 'Knowledge graph', 'Hybrid RAG', 'LLM agents', 'TypeScript'],
    links: [{ t: 'DocuMind on GitHub', u: 'https://github.com/RishitTandon7/DocuMind' }],
    todo: 'OCR engine used, graph database, embedding/LLM models, accuracy or latency numbers, live demo URL, screenshots',
    related: ['agenthub', 'linkedout-pro', 'aisgr-smart-glasses'],
    about: 'DocuMind, agentic document intelligence with adaptive DIP, OCR, a knowledge graph and hybrid RAG.',
  },
  {
    slug: 'glof-early-warning', name: 'GLOF Early-Warning Pipeline', tag: 'SRM × NIDM research, Upper Tista Basin',
    title: 'GLOF Early-Warning Machine Learning Pipeline | Rishit Tandon',
    desc: 'A GLOF early-warning ML pipeline for the Upper Tista Basin, built by Rishit Tandon in SRM and NIDM research. Alert latency cut by 40%.',
    short: 'A GLOF early-warning ML pipeline for the Upper Tista Basin (SRM × NIDM research).',
    kw: 'GLOF early warning machine learning',
    problem: [
      'A glacial lake outburst flood, or GLOF, happens when a lake held back by ice or loose rock suddenly empties. The water races down the valley with very little notice. In October 2023 South Lhonak Lake in the Upper Tista catchment, Sikkim, burst, and the flood travelled down the Teesta valley. For the people downstream, the warning time is measured in minutes, so every second between a sensor reading and an alert matters.',
    ],
    approach: [
      'This was research done at SRM Institute of Science and Technology together with NIDM, India\'s National Institute of Disaster Management, as a research intern. Rishit worked on a machine learning early-warning pipeline for the Upper Tista Basin, focused on making the alert arrive faster.',
      'The result of the work was a 40% reduction in alert latency. The portfolio presents it as a guided walkthrough: from Earth to Chennai to Sikkim, down to South Lhonak Lake, then the alert pipeline firing.',
    ],
    results: [
      '40% lower alert latency.',
      'Research code that ran as a pipeline, not just a notebook.',
    ],
    stack: ['Machine learning', 'Python', 'Time-series and sensor data', 'Geospatial data'],
    links: [{ t: 'Research repository on GitHub', u: 'https://github.com/RishitTandon7/NIDM-PROJECT' }],
    todo: 'model type, features and datasets, how latency was measured (before/after), the sensors involved, any publication or report link, supervisor names if public',
    img: { src: '/media/lhonak-3.jpg', alt: 'Satellite view of South Lhonak Lake in the Upper Tista catchment, Sikkim', w: 1280, h: 870 },
    related: ['arclyth', 'slam-drone', 'documind'],
    about: 'A GLOF early-warning ML pipeline for the Upper Tista Basin, SRM and NIDM research, with a 40% reduction in alert latency.',
  },
  {
    slug: 'agenthub', name: 'AgentHub', tag: 'AI agent marketplace',
    title: 'AgentHub: AI Agent Marketplace | Rishit Tandon',
    desc: 'AgentHub is an app store for AI agents: browse, install and get an API key in one click. Built by Rishit Tandon. Live demo and source code linked.',
    short: 'An AI agent marketplace: browse agents and generate an API key.',
    kw: 'AI agent marketplace',
    problem: [
      'Everyone is building AI agents, and almost nobody can find one they can trust and start using quickly. Each agent usually lives in its own repository with its own setup, so trying one means reading a readme and wiring up credentials. There is no shelf to pick from.',
    ],
    approach: [
      'AgentHub is a marketplace for AI agents, shaped like an app store: browse the available agents, pick one, and generate an API key to start using it. On the portfolio it also appears under the name Agent Marketplace, with an interactive demo where you can search agents and mint a demo key.',
      'The goal is to make an agent something you pick off a shelf, instead of something you rebuild from scratch.',
    ],
    results: [
      'A live deployment you can open and click through.',
      'An app-store style flow from browsing to an API key.',
    ],
    stack: ['TypeScript', 'React', 'API key generation', 'AI agents'],
    links: [{ t: 'Live site', u: 'https://agentlab.rishit.site' }, { t: 'Source on GitHub', u: 'https://github.com/RishitTandon7/Agent-Marketplace' }],
    todo: 'auth and billing approach, how agents are hosted, number of agents listed, screenshots',
    related: ['linkedout-pro', 'documind', 'aisgr-smart-glasses'],
    about: 'AgentHub, an AI agent marketplace with API key generation, live at agentlab.rishit.site.',
  },
  {
    slug: 'linkedout-pro', name: 'LinkedOut Pro', tag: 'AI LinkedIn content platform',
    title: 'LinkedOut Pro: AI LinkedIn Content Platform | Rishit Tandon',
    desc: 'LinkedOut Pro is an AI platform that drafts, tunes and queues LinkedIn content so you spend time building, not posting. Built by Rishit Tandon, live demo.',
    short: 'An AI LinkedIn content platform that drafts, tunes and queues posts.',
    kw: 'AI LinkedIn content platform',
    problem: [
      'Writing posts, replies and outreach on LinkedIn eats hours that could go into building. Most people either skip it or write posts they are not proud of. Doing it consistently takes more time than most students and engineers have, and the hours it takes come straight out of the time you would spend building things.',
    ],
    approach: [
      'LinkedOut Pro is an AI LinkedIn content platform: it drafts posts, lets you tune them, and queues them. A live version runs at linkedout.rishit.site. The portfolio shows a feed that writes itself, with a deliberately self-aware sense of humour about the platform it is named after. The joke posts are only the demo; the live site is the serious version of the idea, and both are linked below.',
    ],
    results: [
      'A working product with a real URL, not a slide.',
      'A draft, tune and queue workflow for content.',
    ],
    stack: ['JavaScript', 'LLM-powered text generation', 'Automation'],
    links: [{ t: 'Live site', u: 'https://linkedout.rishit.site' }, { t: 'Source on GitHub', u: 'https://github.com/RishitTandon7/Linked-Out-Pro' }],
    todo: 'which LLM provider, how posting/scheduling works, the number of users, screenshots',
    related: ['agenthub', 'documind', 'splitfair'],
    about: 'LinkedOut Pro, an AI LinkedIn content platform, live at linkedout.rishit.site.',
  },
  {
    slug: 'splitfair', name: 'SplitFair', tag: 'Expense-splitting PWA',
    title: 'SplitFair: Expense-Splitting Progressive Web App | Rishit Tandon',
    desc: 'SplitFair is an expense-splitting progressive web app (PWA) for groups, built by Rishit Tandon as a full-stack project. See what it solves and how it works.',
    short: 'An expense-splitting progressive web app (PWA).',
    kw: 'expense splitting PWA',
    problem: [
      'Group trips, shared flats and hackathon teams all hit the same small problem: someone pays, everyone owes a little, and nobody remembers who owes whom. Doing it in a chat or a spreadsheet leads to arguments, forgotten payments and awkward reminders. The hard part is not adding up one bill, it is keeping a fair running balance across many small expenses and many people.',
    ],
    approach: [
      'SplitFair is an expense-splitting PWA. A progressive web app installs from the browser onto a phone like a normal app, works with weak connections and does not need an app store, which suits a tool used mostly on a phone in the middle of a trip.',
      'It is one of the full-stack products in the portfolio, alongside the AI and hardware projects.',
    ],
    results: [
      'A product that installs from the browser and works like an app.',
      'A full-stack project that shows the same engineering applied outside AI and hardware.',
    ],
    stack: ['Progressive web app', 'Full-stack web', 'TypeScript'],
    links: [{ t: 'More on GitHub', u: 'https://github.com/RishitTandon7?tab=repositories&q=split' }],
    todo: 'exact repo link, live URL, how debts are simplified, database and auth, screenshots',
    related: ['linkedout-pro', 'agenthub', 'documind'],
    about: 'SplitFair, an expense-splitting progressive web app built by Rishit Tandon.',
  },
  {
    slug: 'slam-drone', name: 'Autonomous SLAM Drone', tag: 'Indoor mapping drone',
    title: 'Autonomous SLAM Drone: Indoor Mapping | Rishit Tandon',
    desc: 'An autonomous drone that uses SLAM to map and navigate indoors without GPS, built by Rishit Tandon. What SLAM is and how it fits his robotics work.',
    short: 'An autonomous drone that uses SLAM to map and navigate without GPS.',
    kw: 'SLAM drone indoor mapping',
    problem: [
      'GPS does not work well indoors, in tunnels or between tall buildings, and those are exactly the places where a drone can be most useful, such as inspecting a collapsed building or searching a warehouse. Without GPS the drone needs another way to know where it is.',
    ],
    approach: [
      'SLAM stands for simultaneous localisation and mapping. The drone builds a map of its surroundings from its sensors while working out its own position inside that map, so it can navigate without relying on satellites.',
      'This autonomous SLAM drone sits alongside Arclyth, the three-drone disaster relief swarm, as part of Rishit\'s work on autonomous aerial robots.',
    ],
    results: [
      'A drone that can map and move through a space without GPS.',
      'A second robotics project that complements the drone swarm.',
    ],
    stack: ['SLAM', 'Autonomous flight', 'Embedded hardware', 'Robotics'],
    links: [],
    todo: 'SLAM method and sensor (lidar, depth camera, monocular), flight controller and compute board, results on mapping accuracy, repo or video link, photos',
    related: ['arclyth', 'glof-early-warning', 'neurovibe-bci'],
    about: 'An autonomous SLAM drone that maps and navigates indoor spaces without GPS.',
  },
  {
    slug: 'neurovibe-bci', name: 'NeuroVibe BCI Rover', tag: 'Brain-computer interface rover',
    title: 'NeuroVibe: Brain-Computer Interface (BCI) Rover | Rishit Tandon',
    desc: 'NeuroVibe is a brain-computer interface rover steered by EEG signals, built by Rishit Tandon. Video demo, source code and the idea behind it.',
    short: 'A brain-computer interface rover steered by EEG signals.',
    kw: 'brain-computer interface projects',
    problem: [
      'A normal joystick or steering wheel is no use to someone who cannot use their hands. A brain-computer interface, or BCI, reads signals from the brain and turns them into commands, which opens up control without any movement at all.',
    ],
    approach: [
      'NeuroVibe is a BCI rover. EEG signals from the head are read, an intention such as left, forward, right or stop is classified from them, and a command goes to the motors. In other words, it moves when you think at it. Rishit has also published a related wheelchair repository, NeuroVibe-Wheelchair, that applies the same idea to mobility.',
      'The portfolio shows the idea with a particle brain and live EEG traces, and links a video demo of the real project.',
    ],
    results: [
      'A working BCI-controlled rover with a recorded video demo.',
      'A concept that extends to assistive mobility.',
    ],
    stack: ['EEG signal processing', 'Brain-computer interface', 'Arduino/ESP32 hardware', 'C++'],
    links: [{ t: 'NeuroVibe on GitHub', u: 'https://github.com/RishitTandon7/NeuroVibe' }, { t: 'NeuroVibe-Wheelchair on GitHub', u: 'https://github.com/RishitTandon7/NeuroVibe-Wheelchair' }, { t: 'Video demo', u: 'https://drive.google.com/file/d/1Srq_t-Rbzm9CPYDdRB-g8Yhbs1Diwa6S/view' }],
    todo: 'EEG headset, classifier and accuracy, command latency, the rover vs wheelchair relationship (the portfolio previously called it a BCI wheelchair), photos',
    related: ['aisgr-smart-glasses', 'arclyth', 'slam-drone'],
    about: 'NeuroVibe, a brain-computer interface rover controlled by EEG signals.',
  },
]
export const projectUrl = (p) => `${SITE}/projects/${p.slug}`

// ---------- pages ----------
export const ABOUT = {
  path: '/about',
  title: 'About Rishit Tandon | CSE Student, AI Engineer, Hackathon Winner',
  desc: 'About Rishit Tandon: final-year CSE student at SRM IST, AI/ML and full-stack developer, 12+ hackathon wins, 100+ GitHub repos, open to SDE roles from 2027.',
  h1: 'About Rishit Tandon',
  og: '/og/about.png',
}
export const SKILLS = {
  path: '/skills',
  title: 'Skills of Rishit Tandon | AI/ML, Full-Stack, Embedded, Robotics',
  desc: 'Skills of Rishit Tandon, AI/ML and full-stack developer: LLM agents, RAG, computer vision, React and Next.js, Arduino and ESP32, drones and robotics.',
  h1: 'Skills — AI/ML, Full-Stack, Embedded & Robotics',
  og: '/og/skills.png',
}
export const BUILT = {
  path: '/how-its-built',
  title: 'How This Interactive Portfolio Website Is Built | Rishit Tandon',
  desc: 'How Rishit Tandon built an interactive 3D developer portfolio website: React, Three.js, GSAP, lazy-loaded worlds and a measured Lighthouse score.',
  h1: 'How this portfolio is built',
  og: '/og/how-its-built.png',
}

export const WINS = {
  first: ['SUTD Smorphi (Singapore)', 'CismoHack (national)', 'ML Project Expo', 'South India Conclave', 'Semiconductor Expo', 'NWC Expo'],
  second: ['C.Tech Expo', 'Arduino Hackathon'],
  other: ['BIS Hackathon — 3rd', 'Hack Sustain — 4th', 'SRM Founder\'s Hack — 5th'],
}

export const SKILL_GROUPS = [
  { g: 'AI / ML', items: ['LLM agents and tool use', 'RAG (retrieval-augmented generation), including hybrid RAG', 'Computer vision and OCR', 'Knowledge graphs', 'Machine learning pipelines', 'Python'] },
  { g: 'Full-Stack', items: ['React', 'Next.js', 'TypeScript and JavaScript', 'Progressive web apps (PWAs)', 'HTML and CSS', 'Java, C++, Dart and PHP in smaller projects'] },
  { g: 'Embedded / Hardware', items: ['Arduino', 'ESP32 and IoT', 'Drones and autonomous flight', 'SLAM', 'Brain-computer interfaces (EEG)', 'Smart glasses hardware'] },
  { g: 'Tools', items: ['Git and GitHub (100+ public repositories)', 'Three.js and React Three Fiber', 'GSAP', 'Vite', 'Blender'] },
]

export const FAQ = [
  ['Who is Rishit Tandon?', 'Rishit Tandon is a final-year B.Tech computer science student at SRM Institute of Science and Technology (Kattankulathur, Chennai), graduating in 2027. He is an AI/ML engineer and full-stack developer who builds AI agents, autonomous drones, smart glasses and hardware.'],
  ['What has Rishit Tandon built?', 'He has built Arclyth (a three-drone disaster relief swarm), A.I.S.G.R. AI smart glasses with a Jarvis assistant, DocuMind (agentic document intelligence with hybrid RAG), a GLOF early-warning machine learning pipeline, AgentHub (an AI agent marketplace), LinkedOut Pro (an AI LinkedIn content platform), SplitFair (an expense-splitting PWA), an autonomous SLAM drone and NeuroVibe (a brain-computer interface rover).'],
  ['How many hackathons has Rishit Tandon won?', 'Rishit has 12+ hackathon and expo wins, including 6 first-place finishes, among them the SUTD Smorphi challenge in Singapore, CismoHack and the NWC Expo.'],
  ['Where does Rishit Tandon study?', 'He studies B.Tech Computer Science and Engineering at SRM Institute of Science and Technology in Kattankulathur, Chennai, from 2023 to 2027.'],
  ['What is Arclyth?', 'Arclyth is a three-drone disaster relief swarm built by Rishit Tandon. The drones, named Crux, Oberon and Capella, work together as one system, and the project won a national hackathon.'],
  ['What is DocuMind?', 'DocuMind is an agentic document intelligence system. It uses adaptive digital image processing, OCR, a knowledge graph and hybrid RAG to turn scanned documents into answers.'],
  ['What is A.I.S.G.R.?', 'A.I.S.G.R. is a pair of AI smart glasses, with a Jarvis voice assistant, that Rishit Tandon started building in 2021, before smart glasses became a mainstream product.'],
  ['What tech stack does Rishit Tandon use?', 'Python and LLM agents for AI work, React, Next.js and TypeScript for full-stack products, Arduino and ESP32 for hardware, and Three.js with GSAP for interactive front ends like this portfolio.'],
  ['Is Rishit Tandon available for hire?', 'Yes. He is looking for SDE and AI/ML engineer roles starting in 2027, and is open to internships before then.'],
  ['How can I contact Rishit Tandon?', 'Email rishit.tandon.7@gmail.com, or reach him on GitHub (github.com/RishitTandon7) or LinkedIn (linkedin.com/in/rishit-tandon-928661287). His other work is linked from rishit.site.'],
]

export const ALL_PAGES = () => [
  { ...HOME, kind: 'home' },
  { ...ABOUT, kind: 'about' }, { ...SKILLS, kind: 'skills' }, { ...BUILT, kind: 'built' },
  ...PROJECTS.map((p) => ({ path: `/projects/${p.slug}`, title: p.title, desc: p.desc, h1: p.name + ': ' + p.tag, og: `/og/${p.slug}.png`, kind: 'project', slug: p.slug })),
]
