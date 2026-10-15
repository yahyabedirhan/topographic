import { useCallback, useState } from 'react';
import { SceneExport } from './exporting';
import type { Playground } from './shared';
import { ExportButton, Sheet, Shell, TuneBody, TuneButton, useDismiss } from './ui';

export function VariantA3({ pg }: { pg: Playground }) {
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
        <Sheet side="right" onClose={() => setTune(false)}>
          <TuneBody pg={pg} />
        </Sheet>
      )}
      {exp && <SceneExport pg={pg} layout="column" onClose={() => setExp(false)} />}
    </Shell>
  );
}
