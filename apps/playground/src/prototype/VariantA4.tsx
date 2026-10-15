import { useCallback, useEffect, useState } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { X } from 'lucide-react';
import { FlowNav, FormatGrid, LiveFrame, TakePanel, type FormatId } from './exporting';
import type { Playground } from './shared';
import { DragCard, ExportButton, Shell, Tip, TuneBody, TuneButton, useDismiss } from './ui';

const OUTCOMES: { id: string; label: string; detail: string; formats: FormatId[] }[] = [
  { id: 'page', label: 'On a page', detail: 'The background behind your own text.', formats: ['html', 'react'] },
  { id: 'keep', label: 'The settings', detail: 'Bring this exact look back later.', formats: ['json', 'link'] },
  { id: 'still', label: 'A still image', detail: 'A PNG of this frame.', formats: ['png'] },
];

function WizardDialog({ pg, open, onOpenChange }: { pg: Playground; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState('page');
  const [format, setFormat] = useState<FormatId>('react');
  useEffect(() => { if (open) setStep(0); }, [open]);
  const formats = OUTCOMES.find((o) => o.id === outcome)?.formats ?? ['react'];
  const pickOutcome = (id: string) => {
    setOutcome(id);
    const next = OUTCOMES.find((o) => o.id === id)?.formats[0];
    if (next) setFormat(next);
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="pt-backdrop" />
        <Dialog.Popup className="pt-dialog pt-panel">
          <div className="pt-dialog-head">
            <div>
              <Dialog.Title className="pt-dtitle">Export</Dialog.Title>
              <Dialog.Description className="pt-hint">Pick the kind of thing you want, then look at it, then take it.</Dialog.Description>
            </div>
            <Tooltip.Root>
              <Tooltip.Trigger delay={180} render={<Dialog.Close className="pt-ibtn" aria-label="Close" />}>
                <X size={16} strokeWidth={1.75} />
              </Tooltip.Trigger>
              <Tip>Close</Tip>
            </Tooltip.Root>
          </div>
          {step === 0 && (
            <ToggleGroup className="pt-outcomes" value={[outcome]} onValueChange={(v) => { if (v[0]) pickOutcome(String(v[0])); }} aria-label="What to export">
              {OUTCOMES.map((o) => (
                <Toggle key={o.id} className="pt-outcome" value={o.id} aria-label={`${o.label}. ${o.detail}`}>
                  <span className={`pt-outcome-art pt-outcome-${o.id}`} aria-hidden="true">
                    {o.id === 'page' && <><i /><i /><i /></>}
                    {o.id === 'keep' && <b>{'{ }'}</b>}
                    {o.id === 'still' && <em />}
                  </span>
                  <b>{o.label}</b>
                  <small>{o.detail}</small>
                </Toggle>
              ))}
            </ToggleGroup>
          )}
          {step === 1 && (
            outcome === 'page' ? (
              <div className="pt-dialog-split">
                <LiveFrame pg={pg} />
                <FormatGrid ids={formats} value={formats.includes(format) ? format : formats[0]} onChange={setFormat} />
              </div>
            ) : (
              <FormatGrid ids={formats} value={formats.includes(format) ? format : formats[0]} onChange={setFormat} />
            )
          )}
          {step === 2 && (
            <div className="pt-dialog-split">
              {outcome === 'page' && <LiveFrame pg={pg} />}
              <TakePanel pg={pg} format={formats.includes(format) ? format : formats[0]} />
            </div>
          )}
          <FlowNav step={step} last={2} onBack={() => setStep((s) => Math.max(0, s - 1))} onNext={() => setStep((s) => Math.min(2, s + 1))} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function VariantA4({ pg }: { pg: Playground }) {
  const [tune, setTune] = useState(false);
  const [exp, setExp] = useState(false);
  const close = useCallback(() => { setTune(false); setExp(false); }, []);
  useDismiss(close);
  return (
    <Shell
      pg={pg}
      tune={<TuneButton pressed={tune} onClick={() => { setTune((v) => !v); setExp(false); }} />}
      exporting={<ExportButton pressed={exp} onClick={() => { setExp((v) => !v); setTune(false); }} />}
    >
      {tune && (
        <DragCard origin="dock" wide onClose={() => setTune(false)}>
          <TuneBody pg={pg} layout="row" />
        </DragCard>
      )}
      <WizardDialog pg={pg} open={exp} onOpenChange={setExp} />
    </Shell>
  );
}
