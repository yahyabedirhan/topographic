import { useState } from 'react';
import { EVENT_NAMES, optIn, optOut } from './analytics';
import { consent, type Consent } from './consent';
import { EVENT_INFO, SUPER_PROPS } from './privacy-content';

const LABEL: Record<Consent, string> = {
  all: 'All events',
  pageviews: 'Pageviews only',
  none: 'Nothing is sent from this browser',
};

const ENABLED = Boolean(import.meta.env.VITE_POSTHOG_KEY || import.meta.env.VITE_SENTRY_DSN);

/** Settings style card: the current choice on the left, the actions on the right. */
function ChoiceCard() {
  const [state, setState] = useState<Consent>(consent());
  const lower = (to: 'pageviews' | 'none') => { optOut(to); setState(to); };
  const on = () => { optIn(); setState('all'); };
  return (
    <div className="pt-choice">
      <h3 id="pv-card">Analytics</h3>
      <div className="pt-choice-row">
        <p className="pt-choice-status" role="status" aria-live="polite">
          <span className="pt-choice-dot" data-state={ENABLED ? state : 'none'} aria-hidden="true" />
          {ENABLED ? LABEL[state] : 'This build sends no analytics or error reports.'}
        </p>
        {ENABLED && (
          <div className="pt-choice-actions" role="group" aria-labelledby="pv-card">
            {state === 'all' && <button type="button" onClick={() => lower('pageviews')} aria-label="Send pageviews only">Pageviews only</button>}
            {state === 'pageviews' && <button type="button" onClick={on} aria-label="Turn analytics on">Turn on</button>}
            {state !== 'none' && <button type="button" onClick={() => lower('none')} aria-label="Turn analytics off">Turn off</button>}
            {state === 'none' && <button type="button" onClick={on} aria-label="Opt back in to analytics">Opt back in</button>}
          </div>
        )}
      </div>
      {ENABLED && <p className="pt-choice-note">Saved in this browser only. Lowering it stops events now. Turning it on applies on the next page load.</p>}
    </div>
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
        <ChoiceCard />
        <p>You can also add one of these to any playground address:</p>
        <ul>
          <li><code>?optout</code> keeps pageviews only: no other events and no error reports.</li>
          <li><code>?optout=all</code> sends nothing. The analytics and error scripts are not loaded.</li>
          <li><code>?optin</code> undoes either.</li>
        </ul>
        <p>Leaving all events sends one last <code>analytics_opted_out</code> event, then nothing. Your choice is saved in this browser&apos;s local storage, so each browser and device keeps its own. Clearing site data resets it. Browsers with Do Not Track on send no analytics.</p>
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
