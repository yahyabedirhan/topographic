import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from './errors';

interface State {
  failed: boolean;
  tried: boolean;
}

/**
 * A render error used to unmount the canvas, the dock and the readout, leaving a black page.
 * This keeps that from happening. It shows the same line as a lost WebGL context. Activating
 * the line mounts the tree again. A second failure stays on the line.
 */
export class TerrainBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, tried: false };

  static getDerivedStateFromError(): Pick<State, 'failed'> {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    reportError(error, { source: 'boundary' });
  }

  private retry = (): void => {
    if (this.state.tried) return;
    this.setState({ failed: false, tried: true });
  };

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <button type="button" className="pt-recover" role="status" onClick={this.retry}>
          Bringing the terrain back
        </button>
      );
    }
    return this.props.children;
  }
}
