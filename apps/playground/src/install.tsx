import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@base-ui-components/react/button';
import { Popover } from '@base-ui-components/react/popover';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Check, CodeXml, Link as LinkIcon, Package, Share, Sparkles } from 'lucide-react';
import { LOOKS, findShape } from 'topographic';
import { INSTALL, SKILL_INSTALL } from './content';
import { shareUrl } from './url';
import { type Playground } from './shared';
import { Tip } from './parts';
import { CodeView, CopyAction, CopyIcon, useViewPicture } from './exporting';
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

/** A command with its copy: the bright pill for the main one, or a quiet icon. */
function Command({ text, quiet = false, onCopy }: { text: string; quiet?: boolean; onCopy: () => void }) {
  return (
    <div className="pt-install">
      <span className="pt-install-mark" aria-hidden="true">$</span>
      <code title={text}>{text}</code>
      {quiet ? <CopyIcon text={text} label="Copy command" onCopy={onCopy} /> : <CopyAction text={text} onCopy={onCopy} />}
    </div>
  );
}

const q = (v: string) => `'${v}'`;

/** The view as one short call: the place or the shape, then the mode, the lines and, in 3D, the camera angle. */
export function sceneCode(pg: Playground, region: Pick<RegionController, 'placeId' | 'bbox'>): string {
  const s = pg.settings;
  const rows = region.bbox && region.placeId ? [`location: ${q(region.placeId)},`] : [`shape: ${q(s.shape)},`, `seed: ${s.seed},`];
  rows.push(`mode: ${q(s.mode)},`, `lines: { count: ${s.lines.count}, indexEvery: ${s.lines.indexEvery} },`);
  if (s.mode === '3d') rows.push(`camera: { azimuth: ${n1(s.camera.azimuth)}, elevation: ${n1(s.camera.elevation)} },`);
  return `createTopography(el, {\n${rows.map((r) => `  ${r}`).join('\n')}\n});`;
}

/** A quiet text action in the footer row. */
function FootAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <Button className="pt-install-foot-action" onClick={onClick}>{icon}<span>{label}</span></Button>;
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
  const code = sceneCode(pg, region);
  const url = shareUrl(pg.settings);
  const [linkCopied, setLinkCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    track('install_copied', { target: 'link' });
    setLinkCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLinkCopied(false), 1600);
  };
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
        <Command text={INSTALL.npm} quiet onCopy={() => track('install_copied', { target: 'npm' })} />
        <Command text={INSTALL.react} quiet onCopy={() => track('install_copied', { target: 'npm_react' })} />
        <div className="pt-install-code">
          <CodeView code={code} />
          <CopyIcon text={code} label="Copy this code" onCopy={() => track('install_copied', { target: 'code' })} />
        </div>
        <div className="pt-install-foot">
          <FootAction icon={linkCopied ? <Check size={13} strokeWidth={2.25} /> : <LinkIcon size={13} strokeWidth={1.75} />} label={linkCopied ? 'Copied' : 'Copy link'} onClick={copyLink} />
          <span className="pt-install-dot" aria-hidden="true">·</span>
          <FootAction icon={<Share size={13} strokeWidth={1.75} />} label="Export" onClick={onOpenExport} />
        </div>
      </Part>
    </div>
  );
}
