import { useCallback, useState } from 'react';
import { DragCard, ExportButton, Shell, TuneBody, TuneButton, useDismiss } from './ui';
import { SceneExport } from './exporting';
import type { Playground } from './shared';

export function VariantA1({ pg }: { pg: Playground }) {
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
        <DragCard origin="corner" onClose={() => setTune(false)}>
          <TuneBody pg={pg} />
        </DragCard>
      )}
      {exp && <SceneExport pg={pg} layout="poster" onClose={() => setExp(false)} />}
    </Shell>
  );
}
