import type { ExpressionSpecification, FilterSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';

/** The previous OpenFreeMap look, kept for a side-by-side comparison. */
export const LIBERTY_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** OpenMapTiles planet. The TileJSON follows their latest deploy, so the tile path can change. */
export const PLANET_TILEJSON = 'https://tiles.openfreemap.org/planet';

export const MAP_CREDIT = 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap';

export type BasemapId = 'quiet' | 'liberty';
export type MapAppearance = 'light' | 'dark';

/** `basemap=liberty` selects the old style. Anything else, including an empty query, is the quiet map. */
export function readBasemap(search: string): BasemapId {
  return new URLSearchParams(search).get('basemap') === 'liberty' ? 'liberty' : 'quiet';
}

export function mapStyle(search: string, appearance: MapAppearance): string | StyleSpecification {
  return readBasemap(search) === 'liberty' ? LIBERTY_STYLE : quietStyle(appearance);
}

interface Ink {
  land: string;
  water: string;
  park: string;
  wood: string;
  building: string;
  street: string;
  road: string;
  label: string;
  place: string;
  edge: string;
}

/** Paper and ink from the playground, with a calm water tone so a strait still reads. */
const INK: Record<MapAppearance, Ink> = {
  dark: {
    land: '#121214',
    water: '#1a3144',
    park: '#18241c',
    wood: '#141e18',
    building: '#1c1c20',
    street: '#3a3a3e',
    road: '#8a8884',
    label: '#8b8a86',
    place: '#d4d2cc',
    edge: '#3c3c40',
  },
  light: {
    land: '#f4f2ee',
    water: '#c9d6e0',
    park: '#e2ebe3',
    wood: '#d7e3d9',
    building: '#e7e3dc',
    street: '#ffffff',
    road: '#b7b2a9',
    label: '#7c7a76',
    place: '#2a2926',
    edge: '#d4d0c8',
  },
};

function zoomWidth(stops: number[]): ExpressionSpecification {
  return ['interpolate', ['exponential', 1.2], ['zoom'], ...stops] as ExpressionSpecification;
}

function classIs(names: string[]): FilterSpecification {
  return ['match', ['get', 'class'], names, true, false] as FilterSpecification;
}

/** A quiet basemap. Land, water, a few roads, and place names. No pins, shields, or hatched rails. */
export function quietStyle(appearance: MapAppearance): StyleSpecification {
  const ink = INK[appearance];
  const road = (id: string, classes: string[], widths: number[], color: string, minzoom?: number): LayerSpecification => ({
    id,
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    minzoom,
    filter: classIs(classes),
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': zoomWidth(widths) },
  });
  const label = (id: string, cls: string, minzoom: number, size: number[], color: string): LayerSpecification => ({
    id,
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'place',
    minzoom,
    filter: ['==', ['get', 'class'], cls] as FilterSpecification,
    layout: {
      'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']] as ExpressionSpecification,
      'text-font': ['Noto Sans Regular'],
      'text-size': zoomWidth(size),
      'text-max-width': 8,
      'text-letter-spacing': 0.01,
    },
    paint: {
      'text-color': color,
      'text-halo-color': ink.land,
      'text-halo-width': 1.1,
    },
  });

  return {
    version: 8,
    name: 'topographic-quiet',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      openmaptiles: {
        type: 'vector',
        url: PLANET_TILEJSON,
        attribution: MAP_CREDIT,
      },
    },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': ink.land } },
      {
        id: 'park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': ink.park, 'fill-opacity': 0.85 },
      },
      {
        id: 'wood',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: { 'fill-color': ink.wood, 'fill-opacity': 0.7 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': ink.water },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        minzoom: 8,
        filter: classIs(['river', 'canal']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ink.water, 'line-width': zoomWidth([8, 0.6, 14, 2.4]) as ExpressionSpecification },
      },
      road('street', ['minor', 'service'], [13, 0.2, 14, 0.7, 16, 1.6], ink.street, 13),
      road('arterial', ['secondary', 'tertiary'], [11, 0.3, 14, 1.1, 16, 2.2], ink.road, 11),
      road('highway', ['motorway', 'trunk', 'primary'], [6, 0.4, 12, 1.2, 16, 2.6], ink.road, 6),
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: { 'fill-color': ink.building, 'fill-outline-color': ink.edge },
      },
      {
        id: 'boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
        paint: { 'line-color': ink.edge, 'line-width': 0.8, 'line-opacity': 0.7 },
      },
      label('country', 'country', 2, [2, 11, 5, 15], ink.label),
      label('city', 'city', 4, [4, 12, 8, 15], ink.place),
      label('town', 'town', 9, [9, 11, 13, 13], ink.label),
      {
        id: 'road-name',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 13,
        filter: classIs(['motorway', 'trunk', 'primary']),
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']] as ExpressionSpecification,
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
        },
        paint: {
          'text-color': ink.label,
          'text-halo-color': ink.land,
          'text-halo-width': 1,
        },
      },
    ],
  };
}
