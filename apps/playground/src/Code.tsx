import { useState } from 'react';

export function Code({ id, label, code }: { id: string; label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <figure className="code" aria-labelledby={`${id}-label`}>
      <figcaption>
        <span id={`${id}-label`}>{label}</span>
        <button id={`${id}-copy`} aria-label={`Copy ${label}`} onClick={async () => {
          await navigator.clipboard.writeText(code).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}>{copied ? 'Copied' : 'Copy'}</button>
      </figcaption>
      <pre id={id}><code>{code}</code></pre>
    </figure>
  );
}
