# topographic

## Analytics

The production playground, https://topographic.yahyapak.dev, sends cookieless PostHog analytics and counts AI agents apart from people.
When you use it while developing, testing, or recording a demo or video, identify as a testing agent so the dashboards leave your visit out:

- With WebMCP, call `identify_agent` once with your `name` and `purpose: "testing"` (`"demo"` for a demo or video).
- Without WebMCP, open the first page with `?analytics_agent=<name>&analytics_purpose=testing`, such as `https://topographic.yahyapak.dev/?analytics_agent=claude&analytics_purpose=testing`.
  The page saves it for that tab and removes it from the address bar.
- To send nothing at all, open the first page with `?analytics_optout=all` instead. The choice is saved in that browser until `?analytics_optin`.

Names and purposes come only from the fixed lists in `apps/playground/src/actor.ts`.
Playwright, Puppeteer and other WebDriver browsers count as agents by themselves, with `automation` set; identify them too when the run is a test.
Local and preview builds without `VITE_POSTHOG_KEY` send nothing.

The events and their properties are typed in `apps/playground/src/analytics.ts`.
`PRIVACY.md` and `docs/guide.md` > 'Analytics and error reports' describe what is sent, for people and for agents, and every opt-out level.

## Agent skills

### Releases

The version lives in `packages/core/package.json` and `packages/react/package.json`, and both packages publish to npm.
Before a release, and after merging a version bump, follow `docs/agents/releasing.md`.
