# Privacy

This covers the playground at https://topographic.yahyapak.dev. The `topographic` and `topographic-react` npm packages collect nothing and contain no analytics or error reporting.

The playground counts visits and how its tools are used, so they can be improved. It uses no cookies, has no accounts, and does not record sessions. It keeps one random visitor id in your browser's local storage. The same list is on the [About page](https://topographic.yahyapak.dev/about#analytics).

## Opting out

Add one of these to any playground address:

| Parameter | Effect |
| --- | --- |
| `?optout` | Pageviews only: no other events and no error reports. |
| `?optout=all` | Nothing is sent. The analytics and error scripts are not loaded. |
| `?optin` | Undoes either. |

The Analytics section of the About page also has an Opt out button. It sends one last `analytics_opted_out` event, then nothing.

The choice is saved in the browser's local storage under `topographic:analytics`, so each browser and device keeps its own and must opt out separately. Clearing site data resets it. Either opt out also deletes the visitor id. Browsers with Do Not Track on send no analytics.

## Pageviews

PostHog records a pageview and a page leave with the page path, referrer, UTM campaign parameters and time on page. From the request it derives country, browser, device type and OS. The IP address is discarded and not stored. PostHog runs with `persistence: 'memory'` and `cookieless_mode: 'always'`: PostHog's own id is a salted hash that the server rotates daily.

## Visitor id

The first visit makes a random id (a UUID) and saves it in local storage under `topographic:visitor`. Every event carries it as `visitor_id`, so the visits of one browser can be counted together across days. The id is random: it holds nothing about you, and it differs per browser and device. Either opt out deletes it and stops sending it, and clearing site data removes it. The playground settings in the query string are not sent.

## Events

Every event also carries: site and app name, app version, a coarse screen class (phone, tablet or desktop), mobile or desktop, OS family, the view the visit started in, and the random visitor id.

| Event | Contains | Why |
| --- | --- | --- |
| `ui_click` | Which header link (GitHub or the project page), its address, and that it leaves the site | To see which links are useful |
| `view_mode_changed` | The view before and after (2D or 3D) | To see how much the 3D view is used |
| `panel_opened` | Which panel (Map, Tune or Export) and its tab | To see which tools are used |
| `panel_closed` | Which panel, its tab, and how long it was open | To find panels that are hard to use |
| `export_tab_changed` | The export format before and after, and time on the first one | To see which formats are wanted |
| `dock_item_clicked` | The kind of item (look, map look or saved terrain), its preset id and position | To see which presets are popular |
| `saved_terrain_deleted` | The position of the deleted item | To improve saved terrains |
| `place_applied` | The preset place id, or "custom" for your own area (never coordinates) | To see which places are drawn |
| `region_loaded` | Load time, success, preset place id or "custom", and tile count | To keep map loading fast and reliable |
| `setting_changed` | The settings group and key that changed (not the value) | To see which settings matter |
| `quality_changed` | Detail or budget, and the chosen level | To tune graphics defaults |
| `theme_toggled` | Light or dark | To set a good default theme |
| `shuffle_clicked` | What was shuffled (all, paper or ink) | To improve random looks |
| `colour_changed` | Paper or ink, and how it was picked (picker, swatch or hex); not the colour | To improve the colour controls |
| `link_copied` | How many settings the link holds (not the link) | To see how sharing is used |
| `code_copied` | Which snippet (install, React, HTML or JSON) | To see how the library is set up |
| `export_image_downloaded` | Size option, width, height, style id, theme, view and render time | To keep image export fast |
| `export_image_failed` | Size option, a short error label and time taken | To fix failing exports |
| `export_video_started` | Camera motion, MP4 or WebM, duration, frame rate, width and height | To see which video options are used |
| `export_video_completed` | The same video options, preparation time and file size | To keep video export fast |
| `export_video_failed` | The same video options, preparation time and a short error label | To fix failing videos |
| `performance_sample` | Once per visit, about 20 seconds in: median and low frame rate, refresh rate, graphics tier, viewport, pixel ratio, GPU name, device memory, browser, OS family, long frames, lost WebGL contexts, time to first frame and view | To keep the animation smooth on every device |
| `low_performance_prompt_shown` | The frame rate, the view, and the detail and budget levels | To see how often the default graphics are too heavy |
| `low_performance_prompt_clicked` | Nothing more | To see if the prompt helps |
| `analytics_opted_out` | The previous level (all or pageviews only) | Sent once when you opt out, to count opt outs |

## Error reports

Sentry receives crash reports: the error message and stack trace, browser and OS, the page path without the query string, the graphics tier and GPU name. Lost WebGL contexts are reported the same way. There is no user data, cookies, headers, tracing or replay, and one page sends at most 10 reports.

## Never collected

- Cookies or fingerprints. Local storage only holds the opt out choice and the random visitor id.
- IP addresses, names, emails or accounts.
- Typed text, colours, hex values, coordinates of custom areas, or the settings in a link.
- Exported images or videos.
- Session recordings, heatmaps or automatic click capture.

Analytics are processed by PostHog in the EU, and error reports by Sentry. A build without `VITE_POSTHOG_KEY` or `VITE_SENTRY_DSN` contains neither client.
