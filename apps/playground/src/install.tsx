import { useRef, type ReactNode } from 'react';
import { Button } from '@base-ui-components/react/button';
import { Popover } from '@base-ui-components/react/popover';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { ArrowUpRight, CodeXml, Package, Sparkles } from 'lucide-react';
import { findShape } from 'topographic';
import { INSTALL, SKILL_INSTALL } from './content';
import { embedCode } from './embed';
import { LOOKS } from './looks';
import { shareUrl } from './url';
import { type Playground } from './shared';
import { Tip } from './parts';
import { CopyAction, CopyIcon, useViewPicture } from './exporting';
import { track } from './analytics';
import type { RegionController } from './region/useRegion';

const n1 = (v: number) => String(Math.round(v * 10) / 10);

/** What the preview shows, in a few words: the place or the look or the shape, then the mode. */
export function sceneLabel(pg: Playground, region: Pick<RegionController, 'bbox' | 'name'>): string {
  const what = region.bbox ? region.name : LOOKS[pg.lookIndex]?.name ?? findShape(pg.settings.shape)?.name ?? pg.settings.shape;
  return `${what} · ${pg.settings.mode === '3d' ? '3D' : '2D'}`;
}

/** The settings that matter most for the view, as key and value chips. */
export function sceneChips(pg: Playground, region: Pick<RegionController, 'placeId' | 'bbox'>): [string, string][] {
  const s = pg.settings;
  const chips: [string, string][] = region.bbox ? [['location', region.placeId ?? 'area']] : [['shape', s.shape], ['seed', String(s.seed)]];
  chips.push(['mode', s.mode], ['lines', String(s.lines.count)], ['indexEvery', String(s.lines.indexEvery)]);
  if (s.mode === '3d') chips.push(['azimuth', `${n1(s.camera.azimuth)}°`], ['elevation', `${n1(s.camera.elevation)}°`]);
  return chips;
}

function Part({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="pt-install-part">
      <h3 className="pt-install-title">{icon}{title}</h3>
      {children}
    </section>
  );
}

/** A command with its copy: the primary pill, or a quiet icon for a second line. */
function Command({ text, quiet = false, onCopy }: { text: string; quiet?: boolean; onCopy: () => void }) {
  return (
    <div className="pt-install">
      <span className="pt-install-mark" aria-hidden="true">$</span>
      <code title={text}>{text}</code>
      {quiet ? <CopyIcon text={text} label="Copy command" onCopy={onCopy} /> : <CopyAction text={text} onCopy={onCopy} />}
    </div>
  );
}

/**
 * Install, alone in the top-right corner: a preview of the view with its main settings, the agent
 * skill and the npm packages, and this view's code and link as a shortcut to Export.
 */
export function InstallMenu({ pg, region, open, onOpenChange, onOpenExport }: {
  pg: Playground;
  region: RegionController;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenExport: () => void;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  return (
    <div className="pt-cluster pt-glass pt-install-solo" ref={anchor}>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Tooltip.Root>
          <Tooltip.Trigger delay={180} render={<Popover.Trigger className="pt-ibtn" aria-label="Install" />}>
            <CodeXml size={18} strokeWidth={1.75} />
          </Tooltip.Trigger>
          <Tip>Install</Tip>
        </Tooltip.Root>
        <Popover.Portal>
          <Popover.Positioner anchor={anchor} side="bottom" align="end" sideOffset={10} collisionPadding={{ top: 12, right: 8, bottom: 16, left: 8 }} positionMethod="fixed" className="pt-layer">
            <Popover.Popup className="pt-pop pt-glass pt-install-pop" aria-label="Install" initialFocus={false}>
              {open ? <InstallBody pg={pg} region={region} onOpenExport={onOpenExport} /> : null}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function InstallBody({ pg, region, onOpenExport }: { pg: Playground; region: RegionController; onOpenExport: () => void }) {
  const src = useViewPicture(pg, 456, 148);
  const code = embedCode(pg.settings, 'react');
  const url = shareUrl(pg.settings);
  return (
    <div className="pt-export-block">
      <figure className="pt-link-shot">
        {src ? <img src={src} alt="The view on screen" /> : <div className="pt-link-wait" aria-hidden="true" />}
        <figcaption>{sceneLabel(pg, region)}</figcaption>
      </figure>
      <ul className="pt-urlchips" aria-label="Settings of this view">
        {sceneChips(pg, region).map(([k, v]) => (
          <li key={k} className="pt-urlchip" title={`${k}: ${v}`}><i>{k}</i><span>{v}</span></li>
        ))}
      </ul>
      <Part icon={<Sparkles size={13} strokeWidth={1.75} />} title="Agent skill">
        <Command text={SKILL_INSTALL} onCopy={() => track('install_copied', { target: 'skill' })} />
      </Part>
      <Part icon={<Package size={13} strokeWidth={1.75} />} title="npm package">
        <Command text={INSTALL.npm} onCopy={() => track('install_copied', { target: 'npm' })} />
        <Command text={INSTALL.react} quiet onCopy={() => track('install_copied', { target: 'npm_react' })} />
      </Part>
      <div className="pt-install-scene">
        <CopyAction text={code} label="Copy code" quiet onCopy={() => track('install_copied', { target: 'code' })} />
        <CopyAction text={url} label="Copy link" quiet onCopy={() => track('install_copied', { target: 'link' })} />
        <Button className="pt-action pt-action-quiet pt-copy" onClick={onOpenExport}>
          <span className="pt-copy-ico"><ArrowUpRight size={14} strokeWidth={1.75} /></span>
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
}
