# Feedback log

One section for each round.
Each section lists the boards shown, the maintainer's feedback by variant id, and what was chosen.

## Round 1

Boards: `positioning`, `api-naming`, `docs-page`, `readme-header`, `github-repo`, `npm-page`, `playground-install`, `site-page`, `social-card`.

Direction given before round 1:

- Present topographic as a general library for 2D and 3D topographic terrain, for websites, videos and games, and do not fit it to one use.
- Rename the public API: `createTopography`, a `topography` instance, the React `Topography` component.
- Replace `styleName` with a name that does not clash with React's `style` prop.
- Use `location` for a real place, such as `location="fuji"`.
- Keep `className` and other CSS details out of the headline examples, and put them in the developer docs.
- Make the path from the README, the playground and yahyapak.dev to install and usage as short as possible.
- Build a docs page at `/docs` at the level of detail of `skills.wheresryan.sh/anatomy`, in dark mode, linked next to About at the top left of the playground.
- Update the GitHub repository description.

Feedback, 2026-10-19:

- **Rules for every surface:**
  - Treat real places as a first-class feature, beside generated shapes.
  - Use real terrains in visuals, such as Everest, the Grand Canyon and Yosemite Valley.
  - Show motion in primary views and stills in secondary views. Grids stay mostly still. The docs page may move everywhere.
  - Do not promote the seven base shapes as the whole range: shapes are unlimited.
  - Write like an Apple launch: short, confident, plain technical words. Leave "no dependencies" and lists of uses out of the first line; uses belong in the docs.
  - Starting line to iterate on: "Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain."
- `positioning`: unclear what surface it is for. No pick.
- `api-naming`: drop `landform`. Choose between `shape` and `land`.
- `docs-page`: **A**, with changes:
  - The playground's wordmark font as the brand.
  - Playground, GitHub, npm and yahyapak.dev as icon links in the top-left area, as on the playground; drop the duplicate icons in the header.
  - Keep the section illustrations and the body.
  - Use the playground's visual inputs (Tune popover sliders and icons). They drive the live figure and update the code block, ready to copy.
  - Real places as a first-class section.
- `readme-header`: **A**, with the install line moved below the image.
- `github-repo`: **A**, with the topics kept, real terrains in the social preview, motion where possible, and the new line.
- `playground-install`: **A**, with changes:
  - The button sits in the top-right corner, in a glass container the size of the other buttons.
  - The popover follows the Export popover's style: a visual preview, then two parts, with an agent (the skill) and by hand (npm). No tabs.
- `npm-page`: **A** as the base, with changes:
  - A moving real-terrain hero.
  - Real places first, then generated shapes, then 2D and 3D.
  - Code beside its result, one pair after another, instead of tables or accordions.
  - New variants to show.
- `site-page`: **A**, with small icons on the Playground, Docs and npm links.
- `social-card`: all layouts are fine. Use the new copy and real terrains, drop the use keywords, and show code with the result its settings give.
- Archive the variants not picked.
