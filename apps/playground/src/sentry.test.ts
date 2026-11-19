// @vitest-environment happy-dom
import { flush, getClient } from '@sentry/browser';
import type { Event } from '@sentry/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { playgroundScriptRoot, startSentry } from './sentry';

const DSN = 'https://public@o0.ingest.sentry.io/1';

function withStack(name: string, message: string, filename: string): Error {
  const error = new Error(message);
  error.name = name;
  error.stack = `${name}: ${message}\n    at render (${filename}:1:1)`;
  return error;
}

function eventsOf(envelopes: Array<[unknown, Array<[{ type?: string }, unknown]>]>): Event[] {
  return envelopes.flatMap(([, items]) => items
    .filter(([header]) => header.type === 'event')
    .map(([, body]) => body as Event));
}

describe('Sentry client', () => {
  const envelopes: Array<[unknown, Array<[{ type?: string }, unknown]>]> = [];

  afterEach(async () => {
    envelopes.length = 0;
    await getClient()?.close(2000);
  });

  function listen() {
    return startSentry(DSN, 10, () => ({
      send(envelope) {
        envelopes.push(envelope as [unknown, Array<[{ type?: string }, unknown]>]);
        return Promise.resolve({});
      },
      flush() { return Promise.resolve(true); },
    }));
  }

  it('sends infer_ip never and does not set a user ip', async () => {
    const root = playgroundScriptRoot();
    expect(root).toBe(`${location.origin}/_astro/`);

    const reporter = listen();
    expect(getClient()?.getOptions().allowUrls).toEqual([`${location.origin}/_astro/`]);
    reporter.report({ kind: 'error', error: withStack('Error', 'render failed', `${root}index.js`) });
    await flush(2000);

    const sent = eventsOf(envelopes);
    expect(sent).toHaveLength(1);
    expect(sent[0].sdk?.settings?.infer_ip).toBe('never');
    expect(sent[0].user?.ip_address).toBeUndefined();
    expect(JSON.stringify(sent[0])).not.toContain('{{auto}}');
    expect(JSON.stringify(sent[0])).not.toContain('"infer_ip":"auto"');
    expect(JSON.stringify(sent[0])).not.toContain('ip_address');
    const frame = sent[0].exception?.values?.[0]?.stacktrace?.frames?.at(-1);
    expect(frame?.filename).toBe(`${root}index.js`);
  });

  it('drops aborted view transitions and errors from other scripts', async () => {
    const root = playgroundScriptRoot();
    const reporter = listen();
    reporter.report({ kind: 'error', error: withStack('InvalidStateError', 'Transition was skipped', `${root}app.js`) });
    reporter.report({ kind: 'error', error: withStack('AbortError', 'Transition was aborted', `${root}app.js`) });
    reporter.report({ kind: 'error', error: withStack('Error', 'extension blew up', 'chrome-extension://abc/content.js') });
    reporter.report({ kind: 'error', error: withStack('Error', 'translate blew up', 'https://translate.googleapis.com/element.js') });
    reporter.report({ kind: 'error', error: withStack('Error', 'in-app browser', `${location.origin}/`) });
    reporter.report({ kind: 'error', error: withStack('Error', 'render failed', `${root}index.js`) });
    const bare = new Error('no stack');
    bare.stack = '';
    reporter.report({ kind: 'error', error: bare });
    await flush(2000);

    const kept = eventsOf(envelopes);
    expect(kept.map((event) => event.exception?.values?.[0]?.value)).toEqual(['render failed', 'no stack']);
    for (const event of kept) {
      expect(event.sdk?.settings?.infer_ip).toBe('never');
      expect(event.user?.ip_address).toBeUndefined();
    }
  });
});
