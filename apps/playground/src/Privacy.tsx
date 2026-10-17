import { useState } from 'react';
import { EVENT_NAMES, optIn, optOut } from './analytics';
import { consent, type Consent } from './consent';
import { EVENT_INFO, SUPER_PROPS } from './privacy-content';

const LABEL: Record<Consent, string> = {
  all: 'Analytics are on in this browser.',
  pageviews: 'Only page views are sent from this browser.',
  none: 'Nothing is sent from this browser.',
};

const ENABLED = Boolean(import.meta.env.VITE_POSTHOG_KEY || import.meta.env.VITE_SENTRY_DSN);
const PRIVACY_MD = 'https://github.com/yahyabedirhan/topographic/blob/main/PRIVACY.md';

/** Compact opt out row: the current state on the left, one toggle on the right. */
function OptOut() {
  const [state, setState] = useState<Consent>(consent());
  return (
    <>
      <div className="pt-optout">
        <p role="status" aria-live="polite">{ENABLED ? LABEL[state] : 'This build sends no analytics or error reports.'}</p>
        {ENABLED && (state === 'all'
          ? <button type="button" className="pt-pill" aria-label="Opt out of analytics" onClick={() => { optOut(); setState('none'); }}>Opt out</button>
          : <button type="button" className="pt-pill" aria-label="Opt in to analytics" onClick={() => { optIn(); setState('all'); }}>Opt in</button>)}
      </div>
      <p className="pt-muted">The choice is saved in this browser, so each browser and device opts out separately. Opting out sends one last <code>analytics_opted_out</code> event, then nothing. Opting in applies on the next page load.</p>
      <p className="pt-small">You can also add <code>?optout</code> (page views only), <code>?optout=all</code> (nothing at all) or <code>?optin</code> to any address.</p>
      <p className="pt-small"><a href={PRIVACY_MD}>PRIVACY.md</a></p>
    </>
  );
}

/** The privacy page at /privacy: what is collected, why, and an opt out control. */
export function Privacy({ home }: { home: string }) {
  return (
    <main className="pt-privacy">
      <p><a href={home}>topographic</a></p>
      <h1>Privacy</h1>
      <p>The playground counts visits and how its tools are used, so they can be improved. It uses no cookies and no stored ids, has no accounts, and does not record sessions. The topographic npm packages collect nothing.</p>

      <section aria-labelledby="pv-choice">
        <h2 id="pv-choice">Your choice</h2>
        <OptOut />
      </section>

      <section aria-labelledby="pv-auto">
        <h2 id="pv-auto">Pageviews</h2>
        <p>PostHog records a pageview and a page leave with the page path, referrer, UTM campaign parameters and time on page. From the request it derives country, browser, device type and OS. The IP address is discarded and not stored. Unique visitors are counted per day from a salted hash that the server rotates daily, so a visit cannot be linked to another day. The playground settings in the address bar are not sent.</p>
      </section>

      <section aria-labelledby="pv-events">
        <h2 id="pv-events">Events</h2>
        <p>{SUPER_PROPS}</p>
        <dl>
          {EVENT_NAMES.map((name) => (
            <div key={name}>
              <dt><code>{name}</code></dt>
              <dd>{EVENT_INFO[name].props}. Why: {EVENT_INFO[name].why}.</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="pv-errors">
        <h2 id="pv-errors">Error reports</h2>
        <p>Sentry receives crash reports: the error message and stack trace, browser and OS, the page path without the query string, the graphics tier and GPU name. Lost WebGL contexts are reported the same way. There is no user data, cookies, headers, tracing or replay, and one page sends at most 10 reports.</p>
      </section>

      <section aria-labelledby="pv-never">
        <h2 id="pv-never">Never collected</h2>
        <ul>
          <li>Cookies, local storage ids or fingerprints. Local storage only holds your opt out choice.</li>
          <li>Your IP address, name, email or any account.</li>
          <li>Text you type, colours, hex values, coordinates of your own areas, or the settings in a link.</li>
          <li>Images or videos you export.</li>
          <li>Session recordings, heatmaps or automatic click capture.</li>
        </ul>
        <p>Analytics are processed by PostHog in the EU, and error reports by Sentry.</p>
      </section>
    </main>
  );
}
