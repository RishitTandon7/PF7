// long-form copy for the two content pages (/how-its-built, /portfolio-design-tips). plain html strings, first person.
// every number here is either measured (seo/lighthouse.json) or visible in the code. nothing is invented.
import { SITE } from './data.mjs'

export const win = (file, inner, id) => `<section class="win"${id ? ` id="${id}"` : ''}><div class="tb" aria-hidden="true"><i></i><i></i><i></i><span>${file}</span></div><div class="bd">${inner}</div></section>`

/* ---------------------------------------------------------- how it is built */
export const HOWTO = {
  name: 'How to build an OS-style interactive developer portfolio',
  desc: 'The steps I followed to turn a developer portfolio into a small operating system with themed worlds, 3D, smooth scrolling and a perfect-score static layer.',
  steps: [
    ['Pick one metaphor', 'Choose a single idea the whole site obeys. Mine is an operating system: a menu bar, a dock, app windows and a terminal that boots first.'],
    ['Give every section its own world', 'Give each section its own palette, fonts and signature motion so scrolling feels like switching apps, not reading one long page.'],
    ['Run everything on one animation clock', 'Drive smooth scrolling, scroll animations, 3D and 2D canvases from a single requestAnimationFrame loop so they never fight.'],
    ['Lazy-load every world', 'Make each world its own code chunk and load it only when the visitor scrolls near it, with a placeholder of the exact final height.'],
    ['Design the phone version separately', 'Use native scrolling, touch-first interactions and fewer effects on phones instead of squeezing the desktop layout.'],
    ['Ship plain HTML for crawlers', 'Prerender real text, structured data, a sitemap and an llms.txt file so search engines and AI assistants can read the site without running JavaScript.'],
    ['Measure, then fix the biggest number', 'Run Lighthouse and layout-shift traces on a production build and fix the root cause of each regression instead of guessing.'],
  ],
}

export const builtBody = (lh) => {
  const scores = lh ? `Performance <strong>${lh.performance}</strong>, Accessibility <strong>${lh.accessibility}</strong>, Best Practices <strong>${lh['best-practices']}</strong> and SEO <strong>${lh.seo}</strong>` : ''
  const fig = (src, alt, cap, w = 1440, h = 900) => `<figure><img src="${src}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" /><figcaption>${cap}</figcaption></figure>`
  return `<p class="lead">This is the full case study of my portfolio: an interactive, OS-style developer portfolio website with nine themed worlds, 3D, smooth scrolling, live GitHub data and a terminal you can break on purpose. Below is the concept, the stack, the design decisions, the performance work, the easter eggs and a before and after against the portfolio it replaced.</p>
<p>If you only want the short version: it is called rishit_os, it is built with React, Three.js, GSAP and Lenis, every section is its own world, and the plain-HTML layer underneath scores 100 on Lighthouse SEO. <a href="/">Open the live site</a> first if you have not seen it; this page makes more sense after.</p>
${win('concept.md', `<h2>The concept: a portfolio that behaves like an operating system</h2>
<p>Most developer portfolios are one long page with a hero, a grid of cards and a contact form. They are fine, and they are forgettable. I wanted a creative developer portfolio that a recruiter or another developer would remember a week later, so I picked one metaphor and refused to break it: the site is a tiny operating system called rishit_os.</p>
<p>That decision made the rest of the design almost automatic. There is a menu bar with a clock and a frame counter. There is a dock with one icon per app. Every section is an app window with a title bar and a path like <code>~/rishit_os/forge.app</code>. And before any of that, a terminal boots, because an operating system needs to boot.</p>
${fig('/media/built/terminal.jpg', 'The rishit_os boot terminal with the animated headline, menu bar and dock', 'the first screen: a terminal that boots, a menu bar with a clock and fps counter, and a dock.')}
<p>The nine worlds are the terminal, a notebook (education on a paper desk), badges (leadership roles), mission control (research), projects, the forge (GitHub data), an arcade (hackathon wins), a workshop (skills on a pegboard) and a museum (certificates), finishing with a boarding pass for contact. Each one is built to feel like a different app rather than a different section.</p>`)}
${win('stack.json', `<h2>The stack, and why each piece is there</h2>
<ul>
<li><strong>Vite and React 19</strong> for the shell. Vite keeps builds fast and makes lazy chunks one line each; React holds the state that connects the dock, the menu bar, the terminal and the worlds.</li>
<li><strong>React Three Fiber and Three.js</strong> for everything in 3D: the little robot that follows you around, the GitHub contribution skyline, the repo galaxy, the globe in mission control and the drone scenes in the project cards.</li>
<li><strong>GSAP and ScrollTrigger</strong> for scroll-driven animation. Each world has its own signature motion, such as pinned scenes, scrubbed timelines and staggered reveals, and ScrollTrigger keeps them in sync with the scroll position.</li>
<li><strong>Lenis</strong> for smooth scrolling with a mouse wheel. Phones do not use it; they scroll natively, which is smoother and costs no JavaScript per frame.</li>
<li><strong>Matter.js</strong> for the workshop pegboard, where the tools are real rigid bodies you can pick up and throw.</li>
<li><strong>The Web Audio and Web Speech APIs</strong> for the synthesised sound effects, an optional generative background track and the voice of the assistant. Music is off by default.</li>
<li><strong>Vercel</strong> for hosting, plus a post-build Node script that writes the plain HTML for every page.</li>
</ul>
<p>There is no CSS framework and no animation library beyond GSAP. Each world has its own stylesheet, which keeps the palettes from leaking into each other.</p>`)}
${win('design.md', `<h2>Design decisions that made it feel different</h2>
<h3>Every world has its own palette, fonts and motion</h3>
<p>The notebook is warm paper with a red pen. Mission control is dark green phosphor. The arcade is a CRT with scanlines. The workshop is orange pegboard. The museum is gold on charcoal. Switching worlds changes the colour, the typography and the way things move, so scrolling feels like opening a different app.</p>
${fig('/media/built/arcade.jpg', 'The arcade world: a CRT-style screen listing hackathon wins', 'the arcade: hackathon wins on a crt, with a real high-score table for visitors.')}
<h3>Real things instead of stock imagery</h3>
<p>The research walkthrough uses real satellite imagery: the Earth, then Chennai, then South Lhonak Lake in the Upper Tista catchment, where the research I did as an intern with NIDM was focused. The smart-glasses card shows a photo of the actual first version. The GitHub world reads my real contribution data. If a visitor can tell something is a placeholder, it is not allowed to stay.</p>
${fig('/media/built/mission.jpg', 'The mission control world with the research internship walkthrough over satellite imagery of South Lhonak Lake', 'mission control: a guided research walkthrough, from earth down to south lhonak lake.')}
<h3>A voice, not a template</h3>
<p>The copy is lowercase, direct and a little cocky, but always honest. No invented metrics, no corporate vocabulary. A small pet robot only speaks when you have skipped something, never at random.</p>
<h3>Phones get their own design</h3>
<p>The phone version is not a squeezed desktop. Badges become a horizontal swipe row, the research walkthrough becomes a tap-through story with three stills instead of a scrubbed video, tools in the workshop are picked up with a press and hold, and every 3D canvas lets vertical swipes pass through to the page.</p>`)}
${win('performance.log', `<h2>Performance: a 3D site that still loads fast</h2>
<p>Performance work on an animated site is mostly about deciding what must not run yet. These are the tricks that mattered, in the order I found them.</p>
<ul>
<li><strong>One clock.</strong> Lenis, ScrollTrigger, the 3D renderer and every 2D canvas run inside a single GSAP ticker. React Three Fiber is set to render on demand and is advanced from that same ticker, so nothing runs a second animation loop.</li>
<li><strong>Lazy worlds.</strong> Each world is its own chunk and loads about a screen before you reach it. A measured placeholder height keeps the page from jumping when it arrives.</li>
<li><strong>The robot waits.</strong> The 3D robot is around a megabyte of code, so it mounts after first paint or on first interaction, whichever comes first.</li>
<li><strong>Fonts are self-hosted and preloaded</strong> for the first screen only; the rest load without blocking.</li>
<li><strong>The GitHub API waits for a touch.</strong> A bundled snapshot paints instantly and live data arrives after the first interaction, which also avoids rate-limit errors in the console.</li>
<li><strong>Canvases only render while visible</strong>, with the device pixel ratio capped.</li>
<li><strong>The boot sequence scrolls with transforms,</strong> not layout, which removed most of the layout shift.</li>
</ul>
<p>Layout shift was the worst offender. A first measurement gave a cumulative layout shift of 0.335; after reserving space for lazy worlds, fixing the boot scroll and self-hosting fonts it dropped to 0.065. Largest contentful paint went from 4.6 seconds to 2.6 seconds on simulated slow 4G with a 4x CPU slowdown.</p>
${scores ? `<p>Lighthouse on the production build, mobile, simulated throttling: ${scores}. The static pages score 100 in all four categories. The homepage performance score is the honest number for a page that ships WebGL.</p>` : ''}
<p>Two experiments did not make it. Deferring the smooth-scroll libraries until after first paint made the measured score slightly worse and broke the crash-and-reboot easter egg, so I reverted it. Manually splitting vendor chunks accidentally put React inside the 3D bundle, so the first load downloaded Three.js; removing the manual split fixed it.</p>`)}
${win('secrets.exe', `<h2>Easter eggs: nine things to find</h2>
<p>A site that rewards poking around gets poked around. There are nine hidden achievements, saved in the browser so a refresh does not un-find them, and the menu bar shows how many you have. They include a famous cheat code, a terminal that can be crashed on purpose, a nod to anyone who opens developer tools, a boarding pass you can tear and a high-score table that takes your initials. I will not list them all here. The hints live in the site itself, and the terminal has opinions about movies.</p>
<p>There is also a console message for the people who do open the developer tools, and a command in the terminal that hires me. It works, as far as I know.</p>`)}
${win('before-after.diff', `<h2>Before and after: the old portfolio versus rishit_os</h2>
<p>My previous portfolio is still online as the <a href="https://dev.rishit.site">old portfolio at dev.rishit.site</a>, and it was a good first version: an outlined name, a floating terminal window, a pill-shaped navigation bar and a neon green accent. It worked like a normal website with a nicer skin.</p>
${fig('/media/built/old-site.jpg', 'The previous version of the portfolio, with an outlined name headline, a terminal window and a navigation pill', 'before: the previous portfolio, still online at dev.rishit.site. one page, one palette, one mood.')}
<p>The new one changes the model rather than the paint. The old site had one palette and one kind of motion; the new one has nine. The old site presented sections; the new one presents apps. The old site was a page you read; the new one is a place you move through, with sound, 3D, physics and a few secrets. It also finally has real text in the HTML, so a search engine sees a person instead of an empty page.</p>
${fig('/media/built/workshop.jpg', 'The workshop world: skills as tools on a pegboard that can be picked up and thrown', 'the workshop: skills as tools on a pegboard. pick one up and throw it.')}
${fig('/media/built/forge.jpg', 'The forge world: a 3D GitHub contribution skyline and a repo galaxy', 'the forge: a 3d contribution skyline and a repo galaxy, from real github data.')}`)}
${win('crawlable.txt', `<h2>Crawlable by design</h2>
<p>An interactive portfolio is a JavaScript app, and a crawler that does not run JavaScript would see an empty page. So the build does a second job. After Vite finishes, a Node script writes plain HTML for the homepage and every other page: a title, a description, a canonical URL, social images, structured data (Person, ProfilePage, FAQ, project and article schema), real text and links, a sitemap and an <code>llms.txt</code> file for AI assistants. The animated site mounts on top of it, and visitors never notice the difference.</p>
<p>It is the same idea as any good progressive enhancement: the content is the foundation, the experience is the layer. If you are building something similar, my <a href="/portfolio-design-tips">ten portfolio design tips</a> cover what I would do again and what I would skip.</p>`)}
${win('what-id-change.md', `<h2>What I would change next time</h2>
<p>I would measure performance from the first week instead of the last. The layout shift that cost me the most time was baked in early, when the lazy worlds had no reserved height. I would also write the plain-HTML layer first and add the animation on top, rather than the other way round, because it forces you to decide what the content actually is.</p>
<p>Want to see the work this design was built to hold? Start with the <a href="/projects/arclyth">Arclyth drone swarm</a>, the <a href="/projects/documind">DocuMind document intelligence system</a> or the <a href="/projects/aisgr-smart-glasses">A.I.S.G.R. smart glasses</a>, read <a href="/about">about me</a>, or go back to the <a href="/">interactive portfolio</a>.</p>`)}`
}

/* -------------------------------------------------------- portfolio design tips */
export const TIPS = [
  ['Pick one metaphor and never break it', 'A portfolio gets memorable when it obeys one idea. Mine is an operating system: a menu bar with a clock, a dock, app windows with file paths and a terminal that boots first. Once the metaphor was set, a hundred small decisions answered themselves. Ask what your portfolio is, then make every element agree.', 'The whole homepage, from the boot terminal to the dock.', '/'],
  ['Give each section its own world', 'A template repeats one layout down the page. Give each section its own palette, typography and signature motion and scrolling stops being reading and starts being exploring. Keep a shared frame, in my case the menu bar and dock, so it still feels like one product.', 'Nine worlds: a paper notebook, a green-phosphor mission control, a CRT arcade, an orange pegboard workshop.', '/how-its-built'],
  ['Make the first ten seconds interactive', 'Do not make people scroll to find out whether you are good. The first screen of my site is a terminal that answers commands. Typing something and getting a reply is a stronger hello than any hero image.', 'The boot terminal. Type help.', '/'],
  ['Write like yourself, and cut the buzzwords', 'Read your copy aloud. If it sounds like a LinkedIn headline, delete it. My site is lowercase, direct and a little cocky, and it never claims a number I cannot back up. A real voice is the cheapest design upgrade there is.', 'The headline: i write code that writes code, build robots, and win hackathons.', '/about'],
  ['Show real things, not placeholders', 'Real photos, real data and real links beat stock imagery every time. The research walkthrough uses real satellite imagery of the lake it is about, the glasses card shows the real first prototype and the GitHub world reads live contributions. Replace anything a visitor could recognise as filler.', 'The glacial-lake research walkthrough and the smart-glasses photo.', '/projects/glof-early-warning'],
  ['Hide something to find', 'Easter eggs make a site feel built by a person. Mine has nine hidden achievements, saved so a refresh does not undo them, and a counter in the menu bar. They cost little to build and give people a reason to stay and a story to tell.', 'Nine secrets, from a cheat code to a crashable terminal.', '/how-its-built'],
  ['Design the phone version on its own', 'Most visitors open a portfolio on a phone from a link. Do not shrink the desktop. Use native scrolling, make hover ideas into taps or press-and-hold, let vertical swipes pass through canvases and drop effects that do not survive a small screen.', 'Badges that swipe sideways and a tap-through research walkthrough on phones.', '/'],
  ['Treat performance as part of the design', 'A beautiful site that loads in six seconds is a bad site. Lazy-load heavy parts, reserve space for them so nothing jumps, self-host the first-screen fonts and measure on a throttled mobile profile. I took layout shift from 0.335 to 0.065 by fixing causes, not by removing animation.', 'Lazy worlds, a deferred 3D robot and deferred GitHub data.', '/how-its-built'],
  ['Make it readable without JavaScript', 'Search engines and AI assistants read your HTML, and an animated single-page app is often an empty div. Prerender real text, add structured data, a sitemap and an llms.txt file, and give every project a page of its own. It is what lets a person find you when they search your name.', 'A plain-HTML page for every project, such as Arclyth and DocuMind.', '/projects/documind'],
  ['Keep the boring parts boring', 'Be as inventive as you like, but never make people hunt for your email, your resume or your GitHub. The creative layer should sit on top of an obvious path to contact. My boarding pass is playful, and the email address on it is still plain text.', 'The contact world and the footer links on every page.', '/about'],
]

export const TIPS_FAQ = [
  ['How do I make a developer portfolio that does not look like a template?', 'Pick one strong metaphor and apply it everywhere, give each section its own palette and motion, use real content instead of stock images and write in your own voice. These are the choices behind the rishit_os portfolio, covered in the ten tips above.'],
  ['Should a developer portfolio use 3D and animation?', 'Yes, if it is lazy-loaded and measured, because it shows range that a static page cannot. Load heavy parts after first paint, reserve their space and test on a throttled phone profile, as described in tips 7 and 8.'],
  ['Does an animated portfolio hurt SEO?', 'Not if the content also exists as plain HTML. Prerender text, structured data, a sitemap and one page per project so crawlers and AI assistants can read the site without running JavaScript, as in tip 9.'],
]

export const tipsBody = () => `<p class="lead">What I learned building a portfolio that does not look like a template: ten practical tips for anyone searching for how to make a good portfolio website, each one illustrated by my own site, the interactive portfolio at <a href="/">portfolio.rishit.site</a>.</p>
<p>These are lessons from building a creative developer portfolio from scratch and getting it to load fast. They are opinionated, and they are things I did, not things I read. For the full build story, see <a href="/how-its-built">how this portfolio is built</a>.</p>
${TIPS.map(([t, body, ex, href], i) => win(`tip-${String(i + 1).padStart(2, '0')}.md`, `<h2>${i + 1}. ${t}</h2><p>${body}</p><p class="ex"><strong>On this site:</strong> <a href="${href}">${ex}</a></p>`)).join('\n')}
${win('faq.txt', `<h2>Portfolio design questions</h2><dl class="faq">${TIPS_FAQ.map(([q, a]) => `<dt>${q}</dt><dd>${a}</dd>`).join('')}</dl>`)}
${win('next.sh', `<h2>See the tips in action</h2><p>The fastest way to understand these ten tips is to open the site they came from. Start at the <a href="/">interactive portfolio</a>, read the <a href="/how-its-built">full case study</a>, or look at what it holds: the <a href="/projects/arclyth">Arclyth drone swarm</a>, <a href="/projects/aisgr-smart-glasses">A.I.S.G.R. smart glasses</a> and <a href="/projects/neurovibe-bci">NeuroVibe brain-computer interface rover</a>.</p>`)}`

export const SITE_URL = SITE
