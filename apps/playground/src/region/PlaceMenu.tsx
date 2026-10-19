import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Search } from 'lucide-react';
import { useAllPlaces } from './places';
import { searchPlaces } from './search';

/**
 * The place menu under the map badge: a search field over the places, grouped by continent.
 * Picking a place only moves the map to it. The field filters by name, note, country, continent and
 * kind; typing anywhere in the menu goes to the field, the arrow keys move through the results and
 * Enter picks one. The rows are jump-to-place actions, so none of them shows as selected.
 */
export function PlaceMenu({ trigger, label, onPick }: {
  /** The badge's content. */
  trigger: ReactNode;
  /** The badge's accessible name. */
  label: string;
  onPick: (id: string) => void;
}) {
  const places = useAllPlaces();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // The highlighted result, or -1 for none: a mouse open highlights nothing.
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const groups = useMemo(() => searchPlaces(places, query), [places, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.places), [groups]);
  const optionId = (index: number) => `${id}-place-${index}`;

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pick = (index: number) => {
    const place = flat[index];
    if (!place) return;
    setOpen(false);
    onPick(place.id);
  };

  const search = (text: string) => {
    setQuery(text);
    // A search highlights its first result, so Enter picks it.
    setActive(text.trim() ? 0 : -1);
    if (list.current) list.current.scrollTop = 0;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flat.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i < 0 ? (step > 0 ? 0 : flat.length - 1) : Math.min(flat.length - 1, Math.max(0, i + step))));
      input.current?.focus();
    } else if (e.key === 'Enter') {
      if (active < 0) return;
      e.preventDefault();
      pick(active);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement !== input.current) {
      // Typing anywhere in the menu types into the field.
      e.preventDefault();
      input.current?.focus();
      search(query + e.key);
    }
  };

  const fine = !(typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  let index = -1;
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) { setQuery(''); setActive(-1); }
      }}
    >
      <Popover.Trigger className="pt-map-badge" aria-label={label}>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="pt-layer pt-layer-menu">
          {/* A phone keeps its keyboard down until the field is tapped. */}
          <Popover.Popup className="pt-menu pt-place-menu pt-glass" aria-label="Places" initialFocus={fine ? input : true} onKeyDown={onKeyDown}>
            <div className="pt-menu-search">
              <Search size={13} strokeWidth={1.9} aria-hidden="true" />
              <input
                ref={input}
                type="search"
                role="combobox"
                aria-label="Search places"
                aria-expanded="true"
                aria-controls={`${id}-list`}
                aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                aria-autocomplete="list"
                placeholder="Search places"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => search(e.target.value)}
              />
            </div>
            <div ref={list} id={`${id}-list`} role="listbox" aria-label="Places" className="pt-menu-list">
              {groups.map(({ group, places: rows }, g) => (
                <div key={group} role="group" aria-labelledby={`${id}-group-${g}`} className="pt-menu-group">
                  <div id={`${id}-group-${g}`} role="presentation" className="pt-menu-label">{group}</div>
                  {rows.map((place) => {
                    const i = ++index;
                    return (
                      <div
                        key={place.id}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === active}
                        data-highlighted={i === active ? '' : undefined}
                        data-place={place.id}
                        className="pt-menu-item"
                        onPointerMove={() => { if (i !== active) setActive(i); }}
                        onClick={() => pick(i)}
                      >
                        <b>{place.name}</b>
                        <small>{place.note}</small>
                      </div>
                    );
                  })}
                </div>
              ))}
              {flat.length === 0 && <div className="pt-menu-empty">No places</div>}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
