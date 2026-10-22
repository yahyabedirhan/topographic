import { App } from './App';
import { TerrainBoundary } from './boundary';

/** The playground page's island: the app inside its error boundary. It renders only in the browser. */
export function Playground() {
  return (
    <TerrainBoundary>
      <App />
    </TerrainBoundary>
  );
}
