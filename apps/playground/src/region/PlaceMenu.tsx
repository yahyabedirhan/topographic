import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Check, Search } from 'lucide-react';
import { useAllPlaces } from './places';
import { searchPlaces } from './search';

/** How the list scrolls after the next render: the selected row to the top, the active row into view, or not at all. */
type Scroll = 'selected' | 'active' | null;

/** The height of the sticky continent heading above a row. */
function headingOf(row: HTMLElement): number {
  return row.closest('.pt-menu-group')?.querySelector<HTMLElement>('.pt-menu-label')?.offsetHeight ?? 0;
}

/**
 * The place menu under the map badge: a search field over the places, grouped by continent under
 * sticky headings. Picking a place only moves the map to it. The field filters by name, note,
 * country, continent and kind; typing anywhere in the menu goes to the field, the arrow keys move
 * through the results and Enter picks one. The framed place shows as selected, and the menu opens
 * with it as the first row under its heading.
 */
export function PlaceMenu({ trigger, label, selectedId, onPick }: {
  /** The badge's content. */
  trigger: ReactNode;
  /** The badge's accessible name. */
  label: string;
  /** The place the frame holds now, or null for any other area. */
  selectedId: string | null;
  onPick: (id: string) => void;
}) {
  const places = useAllPlaces();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // The highlighted result, or -1 for none.
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement | null>(null);
  const scroll = useRef<Scroll>(null);
  const id = useId();
  const groups = useMemo(() => searchPlaces(places, query), [places, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.places), [groups]);
  const optionId = (index: number) => `${id}-place-${index}`;
  const selectedIndex = flat.findIndex((place) => place.id === selectedId);
  // Where the selected place sits in the whole list, before any search.
  const selectedInAll = useMemo(() => searchPlaces(places, '').flatMap((g) => g.places).findIndex((p) => p.id === selectedId), [places, selectedId]);

  const applyScroll = useCallback(() => {
    const el = list.current;
    const mode = scroll.current;
    if (!el || !mode) return;
    scroll.current = null;
    const index = mode === 'selected' ? selectedIndex : active;
    const row = index >= 0 ? el.querySelector<HTMLElement>(`[id="${optionId(index)}"]`) : null;
    if (!row) { if (mode === 'selected') el.scrollTop = 0; return; }
    const top = row.offsetTop - headingOf(row);
    const bottom = row.offsetTop + row.offsetHeight;
    if (mode === 'selected') el.scrollTop = top;
    // Like a native listbox: scroll only as far as the row needs, and keep it below its heading.
    else if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, active]);
  useLayoutEffect(applyScroll);
  // The list mounts a moment after the popover opens; it scrolls as soon as it is there.
  const listRef = useCallback((el: HTMLDivElement | null) => { list.current = el; applyScroll(); }, [applyScroll]);

  const pick = (index: number) => {
    const place = flat[index];
    if (!place) return;
    setOpen(false);
    onPick(place.id);
  };

  const search = (text: string) => {
    setQuery(text);
    if (text.trim()) {
      // A search shows its matches from the top and highlights the first, so Enter picks it.
      setActive(0);
      if (list.current) list.current.scrollTop = 0;
    } else {
      // A cleared search goes back to the selected place.
      setActive(selectedInAll);
      scroll.current = 'selected';
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flat.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i < 0 ? (step > 0 ? 0 : flat.length - 1) : Math.min(flat.length - 1, Math.max(0, i + step))));
      scroll.current = 'active';
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
        if (next) {
          setQuery('');
          // The menu opens on the selected place, or at the top when the frame holds no place.
          setActive(selectedInAll);
          scroll.current = 'selected';
        }
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
            <div ref={listRef} id={`${id}-list`} role="listbox" aria-label="Places" className="pt-menu-list">
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
                        aria-selected={place.id === selectedId}
                        data-highlighted={i === active ? '' : undefined}
                        data-selected={place.id === selectedId ? '' : undefined}
                        data-place={place.id}
                        className="pt-menu-item"
                        onPointerMove={() => { if (i !== active) setActive(i); }}
                        onClick={() => pick(i)}
                      >
                        <b>{place.name}</b>
                        <small>{place.note}</small>
                        {place.id === selectedId && <Check size={14} strokeWidth={2} aria-hidden="true" className="pt-menu-check" />}
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
