import { useEffect, useState, type ReactElement } from 'react';
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
  { id: 'html', label: 'Web component', detail: 'One element for a page.', icon: CodeXml },
  { id: 'react', label: 'React', detail: 'A component with these settings.', icon: Component },
  { id: 'json', label: 'JSON', detail: 'The settings as data.', icon: Braces },
  { id: 'link', label: 'Link', detail: 'A URL that opens this background.', icon: LinkIcon },
  { id: 'png', label: 'PNG', detail: 'A still image of this frame.', icon: ImageIcon },
];

const STEP_COPY = [
  'The heading and the paragraph are sitting on this background.',
  'Choose what you want to take with you.',
  'This is what you will copy or download.',
];

export function useFlow() {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<FormatId>('react');
  return { step, setStep, format, setFormat, back: () => setStep((s) => Math.max(0, s - 1)), next: () => setStep((s) => Math.min(2, s + 1)) };
}

export function SampleType({ kind, step = 2 }: { kind: 'poster' | 'column' | 'frame' | 'cinema'; step?: number }) {
  const showDek = kind !== 'cinema' || step > 0;
  return (
    <div className={`pt-sample pt-sample-${kind}`}>
      <p className="pt-kicker">topography.js</p>
      <h2>Quiet lines behind the words.</h2>
      {showDek && <p className="pt-dek">The background stays out of the way. This is how a heading and a paragraph sit on the field.</p>}
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
        <SampleType kind="frame" />
      </Topography>
    </div>
  );
}

export function FormatGrid({ value, onChange, ids }: { value: FormatId; onChange: (id: FormatId) => void; ids?: FormatId[] }) {
  const list = ids ? FORMATS.filter((f) => ids.includes(f.id)) : FORMATS;
  return (
    <ToggleGroup className="pt-formats" value={[value]} onValueChange={(v) => { if (v[0]) onChange(v[0] as FormatId); }} aria-label="Export format">
      {list.map((f) => {
        const Ico = f.icon;
        return (
          <Toggle key={f.id} className="pt-format" value={f.id} aria-label={`${f.label}. ${f.detail}`}>
            <Ico size={18} strokeWidth={1.75} />
            <b>{f.label}</b>
            <small>{f.detail}</small>
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}

export function TakePanel({ pg, format }: { pg: Playground; format: FormatId }) {
  const [copied, copy] = useCopy();
  const meta = FORMATS.find((f) => f.id === format) ?? FORMATS[1];
  if (format === 'png') {
    const sizes = PNG_SIZES.filter((s) => s.id === 'screen' || s.id === '1080p' || s.id === 'phone');
    return (
      <div className="pt-take">
        <p className="pt-hint">{meta.detail}</p>
        <div className="pt-sizes">
          {sizes.map((s) => (
            <button key={s.id} type="button" className="pt-size" onClick={() => pg.instance.current && downloadPng(pg.instance.current, s)}>
              <i className={`pt-ratio pt-ratio-${s.id}`} aria-hidden="true" />
              <b>{s.id === 'screen' ? 'This screen' : s.id === 'phone' ? 'Phone' : '1920 × 1080'}</b>
              <small>Download PNG</small>
            </button>
          ))}
        </div>
      </div>
    );
  }
  const text = format === 'link' ? shareUrl(pg.settings) : embedCode(pg.settings, format === 'html' ? 'html' : format === 'react' ? 'react' : 'json');
  const action = copied === format ? 'Copied' : format === 'link' ? 'Copy link' : format === 'html' ? 'Copy HTML' : format === 'react' ? 'Copy React' : 'Copy JSON';
  return (
    <div className="pt-take">
      <p className="pt-hint">{meta.detail}</p>
      <pre className="pt-snippet">{text}</pre>
      <Button className="pt-action" onClick={() => copy(format, text)}>{action}</Button>
    </div>
  );
}

export function FlowNav({ step, last, onBack, onNext }: { step: number; last: number; onBack: () => void; onNext: () => void }) {
  return (
    <div className="pt-nav">
      {step > 0 ? <IconButton label="Back" side="top" onClick={onBack}><ChevronLeft size={18} strokeWidth={1.75} /></IconButton> : <span className="pt-nav-spacer" />}
      <div className="pt-dots" aria-label={`Step ${step + 1} of ${last + 1}`}>
        {Array.from({ length: last + 1 }, (_, i) => <i key={i} className={i === step ? 'is-on' : ''} />)}
      </div>
      {step < last ? <IconButton label="Next" side="top" onClick={onNext}><ChevronRight size={18} strokeWidth={1.75} /></IconButton> : <span className="pt-nav-spacer" />}
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

export function SceneExport({ pg, layout, onClose }: { pg: Playground; layout: 'poster' | 'column' | 'cinema'; onClose: () => void }) {
  const flow = useFlow();
  const guide = (
    <div className="pt-guide pt-glass pt-solid">
      {layout !== 'cinema' && (
        <div className="pt-guide-top">
          <p className="pt-hint">{STEP_COPY[flow.step]}</p>
          <IconButton label="Close" onClick={onClose}><X size={16} strokeWidth={1.75} /></IconButton>
        </div>
      )}
      {layout === 'cinema' && flow.step < 2 && <p className="pt-hint">{flow.step === 0 ? 'A heading, on the lines.' : 'Then the paragraph.'}</p>}
      {(layout !== 'cinema' ? flow.step === 1 : flow.step === 2) && <FormatGrid value={flow.format} onChange={flow.setFormat} />}
      {(layout !== 'cinema' ? flow.step === 2 : flow.step === 2) && <TakePanel pg={pg} format={flow.format} />}
      <FlowNav step={flow.step} last={2} onBack={flow.back} onNext={flow.next} />
    </div>
  );
  return (
    <div className={`pt-scene pt-scene-${layout} pt-panel`}>
      <div className="pt-scrim" onClick={onClose} />
      <div className="pt-scene-body">
        <SampleType kind={layout === 'column' ? 'column' : layout === 'cinema' ? 'cinema' : 'poster'} step={flow.step} />
        {guide}
      </div>
    </div>
  );
}

export function SplitDialog({ pg, open, onOpenChange }: { pg: Playground; open: boolean; onOpenChange: (open: boolean) => void }) {
  const flow = useFlow();
  const { setStep } = flow;
  useEffect(() => { if (open) setStep(0); }, [open, setStep]);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="pt-backdrop" />
        <Dialog.Popup className="pt-dialog pt-panel">
          <div className="pt-dialog-head">
            <div>
              <Dialog.Title className="pt-dtitle">Export</Dialog.Title>
              <Dialog.Description className="pt-hint">See the words on the lines, then take a copy.</Dialog.Description>
            </div>
            <CloseTip render={<Dialog.Close className="pt-ibtn" aria-label="Close" />} />
          </div>
          <div className="pt-dialog-split">
            <LiveFrame pg={pg} />
            <div className="pt-dialog-steps">
              {flow.step === 0 && <p className="pt-hint">The frame is this background, with a heading and a paragraph on it.</p>}
              {flow.step === 1 && <FormatGrid value={flow.format} onChange={flow.setFormat} />}
              {flow.step === 2 && <TakePanel pg={pg} format={flow.format} />}
              <FlowNav step={flow.step} last={2} onBack={flow.back} onNext={flow.next} />
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
