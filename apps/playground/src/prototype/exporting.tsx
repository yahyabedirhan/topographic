import { useState, type ReactElement, type ReactNode } from 'react';
import { Button } from '@base-ui-components/react/button';
import { Dialog } from '@base-ui-components/react/dialog';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Braces, ChevronLeft, ChevronRight, CodeXml, Component, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';
import { Topography } from 'topography-react';
import { embedCode } from '../embed';
import { PNG_SIZES, downloadPng } from '../png';
import { shareUrl } from '../url';
import { useCopy, type Playground } from './shared';
import { IconButton, Tip } from './ui';

export type FormatId = 'html' | 'react' | 'json' | 'link' | 'png';

const FORMATS: { id: FormatId; label: string; detail: string; icon: typeof CodeXml }[] = [
  { id: 'html', label: 'HTML', detail: 'One element for a page.', icon: CodeXml },
  { id: 'react', label: 'React', detail: 'A component with these settings.', icon: Component },
  { id: 'json', label: 'JSON', detail: 'The settings as data.', icon: Braces },
  { id: 'link', label: 'Link', detail: 'A URL that opens this background.', icon: LinkIcon },
  { id: 'png', label: 'PNG', detail: 'A still image of this frame.', icon: ImageIcon },
];

const KEYS = /^(import|from|const|let|return|export|function|type|interface)$/;

function Highlight({ code, format }: { code: string; format: FormatId }) {
  if (format === 'link' || format === 'png') return <>{code}</>;
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

function payload(pg: Playground, format: FormatId) {
  if (format === 'link') return shareUrl(pg.settings);
  if (format === 'png') return '';
  return embedCode(pg.settings, format === 'html' ? 'html' : format === 'react' ? 'react' : 'json');
}

function copyLabel(format: FormatId, copied: string) {
  if (copied === format) return 'Copied';
  if (format === 'html') return 'Copy HTML';
  if (format === 'json') return 'Copy JSON';
  if (format === 'link') return 'Copy link';
  return 'Copy React';
}

export function SampleType() {
  return (
    <div className="pt-sample pt-sample-frame">
      <p className="pt-kicker">topography.js</p>
      <h2>Quiet lines behind the words.</h2>
      <p className="pt-dek">The background stays out of the way. This is how a heading and a paragraph sit on the field.</p>
    </div>
  );
}

export function LiveFrame({ pg }: { pg: Playground }) {
  const s = pg.settings;
  return (
    <div className="pt-frame">
      <Topography
        className="pt-frame-map"
        aria-hidden="true"
        styleName={s.style}
        seed={s.seed}
        lines={s.lines}
        terrain={s.terrain}
        motion={s.motion}
        layout={{ ...s.layout, fade: Math.max(s.layout.fade, 0.55) }}
        theme={s.theme}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <SampleType />
      </Topography>
    </div>
  );
}

function FormatBar({ value, onChange, vertical = false }: { value: FormatId; onChange: (id: FormatId) => void; vertical?: boolean }) {
  return (
    <ToggleGroup
      className={vertical ? 'pt-fmtrail' : 'pt-fmtbar'}
      orientation={vertical ? 'vertical' : 'horizontal'}
      value={[value]}
      onValueChange={(v) => { if (v[0]) onChange(v[0] as FormatId); }}
      aria-label="Export format"
    >
      {FORMATS.map((f) => {
        const Ico = f.icon;
        return (
          <Toggle key={f.id} className="pt-fmt" value={f.id} aria-label={`${f.label}. ${f.detail}`}>
            <Ico size={15} strokeWidth={1.75} />
            <span>{f.label}</span>
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}

function PngChoices({ pg }: { pg: Playground }) {
  const sizes = PNG_SIZES.filter((s) => s.id === 'screen' || s.id === '1080p' || s.id === 'phone');
  return (
    <div className="pt-pngs">
      {sizes.map((s) => (
        <button key={s.id} type="button" className="pt-size" onClick={() => pg.instance.current && downloadPng(pg.instance.current, s)}>
          <i className={`pt-ratio pt-ratio-${s.id}`} aria-hidden="true" />
          <b>{s.id === 'screen' ? 'This screen' : s.id === 'phone' ? 'Phone' : '1920 × 1080'}</b>
          <small>Download PNG</small>
        </button>
      ))}
    </div>
  );
}

function CodeWell({ pg, format }: { pg: Playground; format: FormatId }) {
  const [copied, copy] = useCopy();
  if (format === 'png') return <PngChoices pg={pg} />;
  const text = payload(pg, format);
  return (
    <div className="pt-codewell">
      <pre className="pt-code" tabIndex={0} aria-label={`${FORMATS.find((f) => f.id === format)?.label} source`}><code><Highlight code={text} format={format} /></code></pre>
      <Button className="pt-action" onClick={() => copy(format, text)}>{copyLabel(format, copied)}</Button>
    </div>
  );
}

function CloseTip({ render }: { render: ReactElement }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger delay={180} render={render}><X size={16} strokeWidth={1.75} /></Tooltip.Trigger>
      <Tip>Close</Tip>
    </Tooltip.Root>
  );
}

function ExportShell({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="pt-backdrop" />
        <Dialog.Popup className="pt-dialog pt-glass pt-panel">
          <div className="pt-dialog-head">
            <div>
              <Dialog.Title className="pt-dtitle">Export</Dialog.Title>
              <Dialog.Description className="pt-hint">The lines stay behind the words. This is the copy you take.</Dialog.Description>
            </div>
            <CloseTip render={<Dialog.Close className="pt-ibtn" aria-label="Close" />} />
          </div>
          <div className="pt-dialog-body">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function useFormat() {
  const [format, setFormat] = useState<FormatId>('react');
  return { format, setFormat };
}

export function ExportBeside({ pg, open, onOpenChange }: { pg: Playground; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { format, setFormat } = useFormat();
  return (
    <ExportShell open={open} onOpenChange={onOpenChange}>
      <div className="pt-x-beside">
        <LiveFrame pg={pg} />
        <div className="pt-x-side">
          <FormatBar value={format} onChange={setFormat} />
          <CodeWell pg={pg} format={format} />
        </div>
      </div>
    </ExportShell>
  );
}

export function ExportSteps({ pg, open, onOpenChange }: { pg: Playground; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { format, setFormat } = useFormat();
  const [step, setStep] = useState(0);
  return (
    <ExportShell open={open} onOpenChange={onOpenChange}>
      <div className="pt-x-beside">
        <LiveFrame pg={pg} />
        <div className="pt-x-side pt-x-stepside">
          <div className="pt-x-slot">
            {step === 0 && <p className="pt-hint">A heading and a paragraph, sitting on this background.</p>}
            {step === 1 && <FormatBar value={format} onChange={setFormat} />}
            {step === 2 && <CodeWell pg={pg} format={format} />}
          </div>
          <div className="pt-nav">
            {step > 0 ? <IconButton label="Back" side="top" onClick={() => setStep((s) => s - 1)}><ChevronLeft size={18} strokeWidth={1.75} /></IconButton> : <span className="pt-nav-spacer" />}
            <div className="pt-dots" aria-label={`Step ${step + 1} of 3`}>
              {[0, 1, 2].map((i) => <i key={i} className={i === step ? 'is-on' : ''} />)}
            </div>
            {step < 2 ? <IconButton label="Next" side="top" onClick={() => setStep((s) => s + 1)}><ChevronRight size={18} strokeWidth={1.75} /></IconButton> : <span className="pt-nav-spacer" />}
          </div>
        </div>
      </div>
    </ExportShell>
  );
}

export function ExportStack({ pg, open, onOpenChange }: { pg: Playground; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { format, setFormat } = useFormat();
  return (
    <ExportShell open={open} onOpenChange={onOpenChange}>
      <div className="pt-x-stack">
        <LiveFrame pg={pg} />
        <FormatBar value={format} onChange={setFormat} />
        <CodeWell pg={pg} format={format} />
      </div>
    </ExportShell>
  );
}

export function ExportRail({ pg, open, onOpenChange }: { pg: Playground; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { format, setFormat } = useFormat();
  return (
    <ExportShell open={open} onOpenChange={onOpenChange}>
      <div className="pt-x-rail">
        <FormatBar value={format} onChange={setFormat} vertical />
        <LiveFrame pg={pg} />
        <CodeWell pg={pg} format={format} />
      </div>
    </ExportShell>
  );
}

export function ExportStage({ pg, open, onOpenChange }: { pg: Playground; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { format, setFormat } = useFormat();
  return (
    <ExportShell open={open} onOpenChange={onOpenChange}>
      <div className="pt-x-stage">
        <LiveFrame pg={pg} />
        <div className="pt-x-side pt-x-stage-side">
          <CodeWell pg={pg} format={format} />
          <FormatBar value={format} onChange={setFormat} />
        </div>
      </div>
    </ExportShell>
  );
}
