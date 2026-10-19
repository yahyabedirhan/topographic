import { build, type BuildErr, type BuildOk, type BuildRequest } from './build';

export type { BuildErr, BuildOk, BuildRequest } from './build';

interface WorkerScope {
  onmessage: ((event: MessageEvent<BuildRequest>) => void) | null;
  postMessage(message: BuildOk | BuildErr, transfer?: Transferable[]): void;
}
const scope = self as unknown as WorkerScope;
scope.onmessage = (event: MessageEvent<BuildRequest>) => {
  const req = event.data;
  build(req).then(
    (result) => scope.postMessage(result, [result.samples.buffer]),
    (error: unknown) => {
      // The library prefixes its errors for the console; the page shows the sentence alone.
      const message = error instanceof Error ? error.message.replace(/^\[topographic\] /, '') : 'The elevation could not be read.';
      const body: BuildErr = { id: req.id, ok: false, error: message };
      scope.postMessage(body);
    },
  );
};
