import { useState, type ReactNode, type RefObject } from 'react';
import { Button } from '@base-ui-components/react/button';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Braces, CodeXml, Component, Download, Image as ImageIcon, Link as LinkIcon, Share } from 'lucide-react';
import { INSTALL } from '../content';
import { embedCode } from '../embed';
import { PNG_SIZES, downloadPng } from '../png';
import { shareUrl } from '../url';
import { useCopy, type Playground } from './shared';
import { Tip } from './ui';

type FormatId = 'link' | 'png' | 'react' | 'html' | 'json';

const FORMATS: { id: FormatId; label: string; icon: typeof LinkIcon }[] = [
  { id: 'link', label: 'Link', icon: LinkIcon },
  { id: 'png', label: 'PNG', icon: ImageIcon },
  { id: 'react', label: 'React', icon: Component },
  { id: 'html', label: 'HTML', icon: CodeXml },
  { id: 'json', label: 'JSON', icon: Braces },
];

const KEYS = /^(import|from|const|let|return|export|function|type|interface)$/;

function Highlight({ code }: { code: string }) {
  const re = /<\/?[A-Za-z][\w:-]*|\/?>|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|from|const|let|return|export|function|type|interface)\b|\b\d+(?:\.\d+)?\b|[{}()[\]:,.]/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(re)) {
    const index = m.index ?? 0;
    if (index > last) parts.push(code.slice(last, index));
    const v = m[0];
    const cls = v[0] === '"' || v[0] === "'" || v[0] === '`'
      ? 'pt-syn-str'
      : /^\d/.test(v)
        ? 'pt-syn-num'
        : KEYS.test(v)
          ? 'pt-syn-key'
          : v.startsWith('<') || v === '/>' || v === '>'
            ? 'pt-syn-tag'
            : 'pt-syn-pun';
    parts.push(<span key={i++} className={cls}>{v}</span>);
    last = index + v.length;
  }
  if (last < code.length) parts.push(code.slice(last));
  return <>{parts}</>;
}

function CopyButton({ label, text, copied, onCopy }: { label: string; text: string; copied: string; onCopy: (label: string, text: string) => void }) {
  return <Button className="pt-action" onClick={() => onCopy(label, text)}>{copied === label ? 'Copied' : label}</Button>;
}

function LinkBlock({ pg }: { pg: Playground }) {
  const [copied, copy] = useCopy();
  const url = shareUrl(pg.settings);
  return (
    <div className="pt-export-block">
      <p className="pt-hint">A URL that opens this background.</p>
      <div className="pt-linkrow">
        <code title={url}>{url}</code>
        <CopyButton label="Copy" text={url} copied={copied} onCopy={copy} />
      </div>
    </div>
  );
}

function PngBlock({ pg }: { pg: Playground }) {
  const order = ['screen', 'phone', '1080p'] as const;
  const sizes = order.map((id) => PNG_SIZES.find((s) => s.id === id)!);
  const row = (id: (typeof order)[number]) => id === 'screen'
    ? { name: 'This screen', detail: '2× this window' }
    : id === 'phone'
      ? { name: 'Phone', detail: '1170 × 2532' }
      : { name: '1920 × 1080', detail: '16:9' };
  return (
    <div className="pt-export-block">
      <p className="pt-hint">A still image of this frame.</p>
      <div className="pt-pngs">
        {sizes.map((s) => {
          const { name, detail } = row(s.id as (typeof order)[number]);
          return (
            <button key={s.id} type="button" className="pt-size" onClick={() => pg.instance.current && downloadPng(pg.instance.current, s)}>
              <span className="pt-size-copy">
                <b>{name}</b>
                <small>{detail}</small>
              </span>
              <Download size={15} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CodeBlock({ pg, format }: { pg: Playground; format: 'react' | 'html' | 'json' }) {
  const [copied, copy] = useCopy();
  const usage = format === 'json' ? embedCode(pg.settings, 'json') : embedCode(pg.settings, format);
  const install = format === 'react' ? INSTALL.react : '';
  const text = install ? `${install}\n\n${usage}` : usage;
  const hint = format === 'react'
    ? 'Install the packages, then place this component on the page.'
    : format === 'html'
      ? 'Add the element script, then place this background on the page.'
      : 'The settings as data.';
  return (
    <div className="pt-export-block">
      <div className="pt-export-head">
        <p className="pt-hint">{hint}</p>
        <CopyButton label="Copy" text={text} copied={copied} onCopy={copy} />
      </div>
      {install && <pre className="pt-install"><code>{install}</code></pre>}
      <pre className="pt-code" tabIndex={0}><code><Highlight code={usage} /></code></pre>
    </div>
  );
}

export function ExportMenu({ pg, open, onOpenChange, clusterRef }: {
  pg: Playground;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterRef: RefObject<HTMLDivElement | null>;
}) {
  const [format, setFormat] = useState<FormatId>('link');
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Tooltip.Root>
        <Tooltip.Trigger delay={180} render={<Popover.Trigger className="pt-ibtn" aria-label="Export" />}>
          <Share size={18} strokeWidth={1.75} />
        </Tooltip.Trigger>
        <Tip>Export</Tip>
      </Tooltip.Root>
      <Popover.Portal>
        <Popover.Positioner anchor={clusterRef} side="bottom" align="end" sideOffset={10} collisionPadding={{ top: 12, right: 8, bottom: 16, left: 8 }} positionMethod="fixed" className="pt-layer">
          <Popover.Popup className="pt-pop pt-glass pt-export" initialFocus={false}>
            <Popover.Title className="pt-pop-title">Export</Popover.Title>
            <ToggleGroup
              className="pt-fmtbar"
              value={[format]}
              onValueChange={(v) => { if (v[0]) setFormat(v[0] as FormatId); }}
              aria-label="Export format"
            >
              {FORMATS.map((f) => {
                const Ico = f.icon;
                return (
                  <Toggle key={f.id} className="pt-fmt" value={f.id} aria-label={f.label}>
                    <Ico size={15} strokeWidth={1.75} />
                    <span>{f.label}</span>
                  </Toggle>
                );
              })}
            </ToggleGroup>
            {format === 'link' && <LinkBlock pg={pg} />}
            {format === 'png' && <PngBlock pg={pg} />}
            {format === 'react' && <CodeBlock pg={pg} format="react" />}
            {format === 'html' && <CodeBlock pg={pg} format="html" />}
            {format === 'json' && <CodeBlock pg={pg} format="json" />}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
