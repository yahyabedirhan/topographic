// The About page's opt-out row: the choice this browser has made, and one toggle. It renders to HTML at build time
// and hydrates as an island. The saved choice lives in this browser, so the row shows it once the island runs.
import { useEffect, useState } from 'react';
import { optIn, optOut } from './analytics';
import { consent, type Consent } from './consent';

const LABEL: Record<Consent, string> = {
  all: 'Analytics are on in this browser.',
  pageviews: "You're opted out from analytics events. We still count that the page was opened, nothing more.",
  none: 'Nothing is sent from this browser.',
};

export function OptOut() {
  // Null until the island runs: the build cannot know this browser's choice.
  const [state, setState] = useState<Consent | null>(null);
  useEffect(() => { setState(consent()); }, []);
  return (
    <div className="pt-optout">
      <p role="status" aria-live="polite">{state ? LABEL[state] : ''}</p>
      {state === null ? null : state === 'all'
        ? <button type="button" className="pt-pill" aria-label="Opt out of analytics" onClick={() => { optOut('pageviews'); setState('pageviews'); }}>Opt out</button>
        : <button type="button" className="pt-pill" aria-label="Opt in to analytics" onClick={() => { optIn(); setState('all'); }}>Opt in</button>}
    </div>
  );
}
