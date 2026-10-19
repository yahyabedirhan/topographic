# Privacy

This covers the playground at https://topographic.yahyapak.dev. The `topographic` and `topographic-react` npm packages collect nothing and contain no analytics or error reporting.

The playground counts visits and how its tools are used, so they can be improved. It uses no cookies, has no accounts, and does not record sessions. It keeps one random visitor id in your browser's local storage. It counts AI agents apart from people. The same list is on the [About page](https://topographic.yahyapak.dev/about#analytics).

## Opting out

Add one of these to any playground address:

| Parameter | Effect |
| --- | --- |
| `?analytics_optout` | Pageviews only: no other events and no error reports. |
| `?analytics_optout=all` | Nothing is sent. The analytics and error scripts are not loaded. |
| `?analytics_optin` | Undoes either. |

The Analytics section of the About page also has an Opt out button. It sends one last `analytics_opted_out` event, then nothing.

The choice is saved in the browser's local storage under `topographic:analytics`, so each browser and device keeps its own and must opt out separately. Clearing site data resets it. Either opt out also deletes the visitor id and the tab's agent id. Browsers with Do Not Track on send no analytics.

## Pageviews

PostHog records a pageview and a page leave with the page path, referrer, UTM campaign parameters and time on page. The browser also sends its name, device type, OS, screen size, language and timezone. Country and city are not recorded: in cookieless mode PostHog drops the IP address before it could look them up. The IP address is never stored. PostHog runs with `persistence: 'memory'` and `cookieless_mode: 'always'`: PostHog's own id is a salted hash that the server rotates daily.

## Visitor id

The first visit makes a random UUID and saves it in local storage under `topographic:visitor`. Every event carries it as `visitor_id`, so the visits of one browser can be counted together across days. The id is random: it holds nothing about you, and it differs per browser and device. Either opt out deletes it and stops sending it, and clearing site data removes it. The playground settings in the query string are not sent.

## People and agents

The playground counts AI agents apart from people, to see how agents use it. A person's events carry the `visitor_id`. An agent's events carry a random `agent_id` instead, kept for one browser tab.

A visit counts as an agent's when the agent identifies itself, which is optional, or when the browser is run by automation such as Playwright. Automated browsers also send whether they were headless or visible. Agents can identify with the `identify_agent` tool or with `?analytics_agent=<name>&analytics_purpose=<purpose>`. Only a name and a purpose from these lists are recorded, never free text:

- Names: claude, chatgpt, gemini, jules, copilot, cursor, windsurf, opencode, pi, amp, droid, cline, roo, kilo, aider, goose, kiro, devin, manus, grok, perplexity, other. chatgpt covers ChatGPT and Codex.
- Purposes: testing, demo, creating, exploring, integrating, research, reverse-engineering, other.

## Events

Every event also carries: site and app name, app version, a coarse screen class such as phone, tablet or desktop, mobile or desktop, OS family, the view the visit started in, and the random visitor id.

| Event | Contains | Why |
| --- | --- | --- |
| `ui_click` | Which header link was clicked, its address, and that it leaves the site | To see which links are useful |
| `view_mode_changed` | Whether the view changed from 2D to 3D or back | To see how much the 3D view is used |
| `panel_opened` | Which panel was opened and its tab | To see which tools are used |
| `panel_closed` | Which panel, its tab, and how long it was open | To find panels that are hard to use |
| `export_tab_changed` | The export format before and after, and time on the first one | To see which formats are wanted |
| `dock_item_clicked` | Whether it was a look, a map look or a saved terrain, with its preset id and position | To see which presets are popular |
| `saved_terrain_deleted` | The position of the deleted item | To improve saved terrains |
| `place_applied` | The preset place id, or "custom" for your own area, never coordinates | To see which places are drawn |
| `region_loaded` | Load time, success, preset place id or "custom", and tile count | To keep map loading fast and reliable |
| `setting_changed` | The settings group and key that changed, never the value | To see which settings matter |
| `quality_changed` | Detail or budget, and the chosen level | To tune graphics defaults |
| `theme_toggled` | Light or dark | To set a good default theme |
| `shuffle_clicked` | Whether all, paper or ink was shuffled | To improve random looks |
| `colour_changed` | Paper or ink, and whether the picker, a swatch or a hex code was used, never the colour | To improve the colour controls |
| `link_copied` | How many settings the link holds, never the link | To see how sharing is used |
| `code_copied` | Which snippet was copied: install, React, HTML or JSON | To see how the library is set up |
| `export_image_downloaded` | Size option, width, height, style id, theme, view and render time | To keep image export fast |
| `export_image_failed` | Size option, a short error label and time taken | To fix failing exports |
| `export_video_started` | Camera motion, MP4 or WebM, duration, frame rate, width and height | To see which video options are used |
| `export_video_completed` | The same video options, preparation time and file size | To keep video export fast |
| `export_video_failed` | The same video options, preparation time and a short error label | To fix failing videos |
| `performance_sample` | Once per visit, about 20 seconds in: median and low frame rate, refresh rate, graphics tier, viewport, pixel ratio, GPU name, device memory, browser, OS family, long frames, lost WebGL contexts, time to first frame and view | To keep the animation smooth on every device |
| `low_performance_prompt_shown` | The frame rate, the view, and the detail and budget levels | To see how often the default graphics are too heavy |
| `low_performance_prompt_clicked` | Nothing more | To see if the prompt helps |
| `analytics_opted_out` | The previous level: all, or pageviews only | Sent once when you opt out, to count opt outs |
| `agent_tool_called` | When an agent uses a playground tool: the tool's name, whether it worked, and a rough duration. Never the agent's input or the result | To see which tools agents use |

## Error reports

Sentry receives crash reports: the error message and stack trace, browser and OS, the page path without the query string, the graphics tier and GPU name. Lost WebGL contexts are reported the same way. There is no user data, cookies, headers, tracing or replay, and one page sends at most 10 reports.

## Never collected

- Cookies or fingerprints. Local storage only holds the opt out choice and the random visitor id; session storage holds an agent's id for one tab.
- What an agent types or receives through the tools.
- IP addresses, names, emails or accounts.
- Typed text, colours, hex values, coordinates of custom areas, or the settings in a link.
- Exported images or videos.
- Session recordings, heatmaps or automatic click capture.

Analytics are processed by PostHog in the EU, and error reports by Sentry. A build without `VITE_POSTHOG_KEY` or `VITE_SENTRY_DSN` contains neither client.
