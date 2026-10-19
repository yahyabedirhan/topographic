import { useEffect, useState } from 'react';
import { optIn, optOut } from './analytics';
import { consent, type Consent } from './consent';
import { latestUpdates } from './changelog';
import changelog from '../../../CHANGELOG.md?raw';
import hero from './assets/hero.webp';
import { EMAIL, SOCIALS } from './contact';

const LABEL: Record<Consent, string> = {
  all: 'Analytics are on in this browser.',
  pageviews: "You're opted out from analytics events. We still count that the page was opened, nothing more.",
  none: 'Nothing is sent from this browser.',
};

const REPO = 'https://github.com/yahyabedirhan/topographic';
const CHANGELOG_URL = `${REPO}/blob/main/CHANGELOG.md`;
const UPDATES = latestUpdates(changelog);


function Socials() {
  return (
    <nav className="pt-socials" aria-label="Yahya Bedirhan Pak elsewhere">
      {SOCIALS.map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
        </a>
      ))}
      <a href={EMAIL} aria-label="Email">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
      </a>
    </nav>
  );
}

const PRIVACY_MD = 'https://github.com/yahyabedirhan/topographic/blob/main/PRIVACY.md';

/** Compact opt out row: the current state on the left, one toggle on the right. */
function OptOut() {
  const [state, setState] = useState<Consent>(consent());
  return (
    <>
      <div className="pt-optout">
        <p role="status" aria-live="polite">{LABEL[state]}</p>
        {state === 'all'
          ? <button type="button" className="pt-pill" aria-label="Opt out of analytics" onClick={() => { optOut('pageviews'); setState('pageviews'); }}>Opt out</button>
          : <button type="button" className="pt-pill" aria-label="Opt in to analytics" onClick={() => { optIn(); setState('all'); }}>Opt in</button>}
      </div>
      <p className="pt-muted">Your choice is saved in this browser, so each browser and device opts out separately.</p>
      <p>Full detail in <a href={PRIVACY_MD}>PRIVACY.md</a>.</p>
    </>
  );
}

/** The About page at /about: the project, its maintainer, and the analytics section. */
export function About({ home }: { home: string }) {
  // The page renders after a lazy import, so jump to a #section once it exists.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return (
    <main className="pt-privacy">
      <p><a href={home}>topographic</a></p>
      <h1>About</h1>
      <img className="pt-hero" src={hero} alt="Fine granite in 3D: a summit ringed by pale contour lines, gullies fanning out to a dark horizon" width={1280} height={720} />
      <p className="pt-lead">Topographic draws animated topographic contour backgrounds in 2D or 3D, from generated terrain or real places picked on a map. Export a scene as an image, a video, a React component, HTML or JSON. It is open source under the Apache 2.0 license.</p>

      <section aria-labelledby="pv-maintainer">
        <h2 id="pv-maintainer">Maintainer</h2>
        <p>Made and maintained by <a href="https://yahyapak.dev/">Yahya Bedirhan Pak</a> since October 2026.</p>
        <Socials />
        <ul className="pt-rows">
          <li><a href={REPO} target="_blank" rel="noopener noreferrer"><span>GitHub</span><span>yahyabedirhan/topographic</span></a></li>
          <li><a href="https://www.npmjs.com/package/topographic" target="_blank" rel="noopener noreferrer"><span>npm</span><span>topographic</span></a></li>
          <li><a href="https://www.npmjs.com/package/topographic-react" target="_blank" rel="noopener noreferrer"><span>npm</span><span>topographic-react</span></a></li>
        </ul>
      </section>

      <section aria-labelledby="pv-updates">
        <h2 id="pv-updates">Latest updates</h2>
        <ul className="pt-rows">
          {UPDATES.map((u, i) => (
            <li key={i}><div><span>{u.version}</span><span>{u.summary}</span></div></li>
          ))}
        </ul>
        <p className="pt-small"><a href={CHANGELOG_URL} target="_blank" rel="noopener noreferrer">Full changelog</a></p>
      </section>

      <section id="analytics" aria-labelledby="pv-analytics">
      <h2 id="pv-analytics">Analytics</h2>
      <p>The playground keeps anonymous stats with no cookies. They show which tools people and AI agents use, so the playground can get better. Opting out keeps your visits out of these stats. The topographic npm packages collect nothing.</p>

      <section aria-labelledby="pv-collected">
        <h3 id="pv-collected">What is collected</h3>
        <ul>
          <li>Pages visited, and the site you came from.</li>
          <li>Which tools, looks and exports are used, never their values.</li>
          <li>Frame rate and load times, to keep the playground smooth.</li>
          <li>Device type and timezone, to fit how people browse.</li>
          <li>Whether a visit comes from a person or an AI agent.</li>
          <li>Crash reports, to fix bugs.</li>
        </ul>
      </section>

      <section aria-labelledby="pv-never">
        <h3 id="pv-never">What is never collected</h3>
        <p>The playground never sets cookies, never stores IP addresses, and never collects names, emails, what you type or the images and videos you export.</p>
      </section>

      <section aria-labelledby="pv-where">
        <h3 id="pv-where">Where it goes</h3>
        <ul>
          <li>PostHog: analytics, stored in the EU.</li>
          <li>Sentry: error reports, stored in the EU.</li>
        </ul>
      </section>

      <section aria-labelledby="pv-choice">
        <h3 id="pv-choice">Opt out</h3>
        <OptOut />
      </section>
      </section>
    </main>
  );
}
