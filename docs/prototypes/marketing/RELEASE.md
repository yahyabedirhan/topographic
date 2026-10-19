# 0.6.0 release runbook

The steps after the maintainer says "I approve".
Agents run every step except the ones marked **Maintainer**.
Pull request numbers that are still open are filled in as the pull requests open.

## 1. Merge the effort's pull requests into `effort/topography-api`

Each of these is stacked on `effort/topography-api`, the branch of #77.
Merge them in this order, rebasing each on the branch after the one before it lands, and run the checks after each merge.

1. #85, the `look` setting.
2. The locations pull request (#81).
3. The banding fix, if the diagnosis opens one.
4. #83, the agent skill.
5. The docs page pull request.
6. The launch surfaces pull request: README, npm READMEs, Install popover, social cards, rendered assets.

After the last merge, render the README and npm assets again with `node scripts/render-readme-assets.mjs`, so every image comes from the final library.

## 2. Merge into `main`

1. The bug-fix session's pull requests #72 to #76, after the maintainer's review in step 2 of the plan.
2. #84, Cyprus with the shared camera.
3. Rebase `effort/topography-api` on `main`, run every check, then merge #77.

A push to `main` deploys the playground through Cloudflare Workers Builds.
Check https://topographic.yahyapak.dev and https://topographic.yahyapak.dev/docs after the deploy, as a testing agent (`?analytics_agent=claude&analytics_purpose=testing`).

## 3. Release 0.6.0

1. Bump `packages/core`, `packages/react` (and its `topographic` dependency to `^0.6.0`) and `apps/playground` to 0.6.0, date the CHANGELOG section, and commit "release 0.6.0".
2. Tag `v0.6.0` and push the tag.
3. Publish: `npm publish -w packages/core --access public`, then `npm publish -w packages/react --access public`.
   **Maintainer:** enter the npm one-time code if npm asks for it.
4. Create the GitHub release `v0.6.0` with the CHANGELOG section as its notes.
5. Check https://www.npmjs.com/package/topographic and https://www.npmjs.com/package/topographic-react: the README images load and the description is the approved line.
6. Check `npx skills add yahyabedirhan/topographic --list` finds the skill on `main`.

## 4. GitHub repository settings

1. Description: the approved line, "Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain."
2. Website: https://topographic.yahyapak.dev
3. Topics: the 20 topics in `kit.js` (`COPY.topics`).
4. **Maintainer:** upload `assets/social/github-preview.png` (Yosemite) in Settings > General > Social preview. GitHub has no API for it.

## 5. Personal website

Merge personal-website #26. A push to `main` deploys yahyapak.dev through Cloudflare Workers Builds.
Check https://yahyapak.dev/projects/topographic.

## 6. Close the loop

1. Tick every item in the Notion launch checklist (MARK-2) with its proof link.
2. Close #78 to #80 only if they shipped; they are next-release work and stay open otherwise.
3. Move the prototype branch with its full history to a private repository, `yahyabedirhan/topographic-marketing`, cloned at `~/Developer/yahyabedirhan/topographic-marketing`.
4. Hand the launch videos to their own session (D6).
5. Settle the session.
