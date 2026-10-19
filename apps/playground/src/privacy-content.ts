/**
 * What the playground collects, for the privacy page. Typed against the event map, so a new event
 * cannot ship without a line here. PRIVACY.md at the repo root holds the same list.
 * Vendor names stay capitalised here, so a build without keys still has no client strings in it.
 */
import type { AnalyticsEvent } from './analytics';

export interface EventInfo { props: string; why: string }

export const EVENT_INFO: Record<AnalyticsEvent, EventInfo> = {
  ui_click: { props: 'Which header link (GitHub or the project page), its address, and that it leaves the site', why: 'to see which links are useful' },
  view_mode_changed: { props: 'The view before and after (2D or 3D)', why: 'to see how much the 3D view is used' },
  panel_opened: { props: 'Which panel (Map, Tune or Export) and its tab', why: 'to see which tools are used' },
  panel_closed: { props: 'Which panel, its tab, and how long it was open', why: 'to find panels that are hard to use' },
  export_tab_changed: { props: 'The export format before and after, and time on the first one', why: 'to see which formats are wanted' },
  dock_item_clicked: { props: 'The kind of item (look, map look or saved terrain), its preset id and position', why: 'to see which presets are popular' },
  saved_terrain_deleted: { props: 'The position of the deleted item', why: 'to improve saved terrains' },
  place_applied: { props: 'The preset place id, or "custom" for your own area (never coordinates)', why: 'to see which places are drawn' },
  region_loaded: { props: 'Load time, success, preset place id or "custom", and tile count', why: 'to keep map loading fast and reliable' },
  setting_changed: { props: 'The settings group and key that changed (not the value)', why: 'to see which settings matter' },
  quality_changed: { props: 'Detail or budget, and the chosen level', why: 'to tune graphics defaults' },
  theme_toggled: { props: 'Light or dark', why: 'to set a good default theme' },
  shuffle_clicked: { props: 'What was shuffled (all, paper or ink)', why: 'to improve random looks' },
  colour_changed: { props: 'Paper or ink, and how it was picked (picker, swatch or hex); not the colour', why: 'to improve the colour controls' },
  link_copied: { props: 'How many settings the link holds (not the link)', why: 'to see how sharing is used' },
  code_copied: { props: 'Which snippet (install, React, HTML or JSON)', why: 'to see how the library is set up' },
  export_image_downloaded: { props: 'Size option, width, height, style id, theme, view and render time', why: 'to keep image export fast' },
  export_image_failed: { props: 'Size option, a short error label and time taken', why: 'to fix failing exports' },
  export_video_started: { props: 'Camera motion, MP4 or WebM, duration, frame rate, width and height', why: 'to see which video options are used' },
  export_video_completed: { props: 'The same video options, preparation time and file size', why: 'to keep video export fast' },
  export_video_failed: { props: 'The same video options, preparation time and a short error label', why: 'to fix failing videos' },
  performance_sample: { props: 'Once per visit, about 20 seconds in: median and low frame rate, refresh rate, graphics tier, viewport, pixel ratio, GPU name, device memory, browser, OS family, long frames, lost WebGL contexts, time to first frame and view', why: 'to keep the animation smooth on every device' },
  low_performance_prompt_shown: { props: 'The frame rate, the view, and the detail and budget levels', why: 'to see how often the default graphics are too heavy' },
  low_performance_prompt_clicked: { props: 'Nothing more', why: 'to see if the prompt helps' },
  analytics_opted_out: { props: 'The previous level (all or pageviews only)', why: 'sent once when you opt out, to count opt outs' },
};

export const SUPER_PROPS = 'Every event also carries: site and app name, app version, a coarse screen class (phone, tablet or desktop), mobile or desktop, OS family, the view the visit started in, and the random visitor id.';
