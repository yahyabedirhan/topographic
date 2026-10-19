# Privacy

This page explains what the topographic playground at https://topographic.yahyapak.dev collects when you or an AI agent use it, what it never collects, why, where the data goes, and how to opt out. It also covers the npm packages, which collect nothing.

## The npm packages

The `topographic` and `topographic-react` npm packages collect nothing. They contain no analytics and no error reporting.

## What the playground collects

- Page views: the page, the site you came from, and the time on the page.
- Which tools, looks, settings and exports are used, never their values. The Events section lists each one.
- Frame rate and load times.
- Your browser's type, screen size, language and timezone.
- One random visitor id, saved in your browser, so return visits count once.
- Whether a visit comes from a person or an AI agent.
- Crash reports.

## What the playground never collects

- The playground never sets cookies and never fingerprints your browser.
- It never stores your IP address, and never collects your name, email or any account.
- It never collects text you type, colours, hex values, the coordinates of your own areas, or the settings in a link.
- It never collects the images or videos you export.
- It never records sessions, heatmaps or clicks on its own.
- It never collects what an agent types into the playground's tools or receives from them.

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

Each page view records the page, the site you came from, any campaign tags in the link, and the time on the page. Your browser also shares its type, screen size, language and timezone. Your IP address is never stored, and your country and city are not recorded.

## Visitor id

The first visit saves a random id in your browser under `topographic:visitor`, so return visits count once. It holds nothing about you. Opting out deletes it.

## People and agents

AI agents are counted apart from people. An agent gets its own random id for one browser tab. Browsers run by automation, such as Playwright, count as agents.

An agent can say which agent it is and why it is here, with the `identify_agent` tool or `?analytics_agent=<name>&analytics_purpose=<purpose>`. This is optional, and only these values are recorded:

- Names: claude, chatgpt, gemini, jules, copilot, cursor, windsurf, opencode, pi, amp, droid, cline, roo, kilo, aider, goose, kiro, devin, manus, grok, perplexity, other.
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

## Where it goes

- **PostHog:** analytics, stored in the EU.
- **Sentry:** error reports, stored in the EU.
