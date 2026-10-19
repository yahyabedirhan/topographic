# topographic

## Analytics

The production playground, https://topographic.yahyapak.dev, sends cookieless PostHog analytics.
A visit you make there while developing, testing, or recording a demo or video counts as a real visitor unless you opt out.

- Open the production playground with `?optout=all` on the first page load, such as `https://topographic.yahyapak.dev/?optout=all&look=night-lobes`.
  The page saves the choice in that browser's local storage under `topographic:analytics` and removes the parameter from the address bar, so later loads in the same browser stay opted out.
- A browser you drive through an extension, such as Claude in Chrome, sends events like a person's, so it needs the opt-out.
- Playwright, Puppeteer and other WebDriver browsers send nothing: posthog-js drops every event when `navigator.webdriver` is true.
- Local and preview builds without `VITE_POSTHOG_KEY` send nothing.
- To check the analytics themselves, load the playground without the opt-out, or with `?optin` to clear a saved one.

The events and their properties are typed in `apps/playground/src/analytics.ts`.
`PRIVACY.md` and `docs/guide.md` > 'Analytics and error reports' describe what is sent and every opt-out level.
