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

Feedback, 2026-10-19.
The maintainer's words, kept near verbatim and grouped by board.
Only grammar and voice-transcription slips are fixed; fixes of a misheard word are marked in square brackets.
The screenshots the maintainer attached show the playground's Tune popover (the Lines and Terrain tabs) and the Export popover (the Link tab).

### positioning

> First of all for the positioning, I couldn't understand what this position is about.
> Is it for the homepage of the playground, the homepage of this website?
> Are you just moving playground to under /playground and showing this as kind of a landing page?
> I couldn't understand that.
> It'll be great if you can explain it.

### api-naming

> Now continuing with the API names, I didn't like the landform.
> Let's eliminate that.
> Shape might be handy.
> Land also could be useful but I think shape is a little bit easier to understand.
> I'm in between shape and [land] here.
> Maybe you can help me out: which one will work better and what are the trade-offs?

### docs-page: variant A

> Docs page: definitely prototype A is the best and I will give you a couple of pieces of feedback.
> Note them down so that you can use them.

1. Brand font.
   > At the top-left corner, the topographic name: I want you to use the font that we are using on the website currently (https://topographic.yahyapak.dev/).
   > I want you to use it as branding for this topographic website and application.
2. Links in the top-left area.
   > Other than that, I think those Playground, GitHub, and npm links look good.
   > Since we already have GitHub maybe you can add the GitHub icon next to it.
   > You can also add the npm icon but since we have them already at the top of the page, let's eliminate one of them.
   >
   > I want you to use that top-left area.
   > As I scroll down the left sidebar stays as is.
   > Let's move those GitHub and npm icons to the top-left area.
   > Think of it as a similar area to the top left of the current website, where you also link to my personal website.
   >
   > You will have links to the playground, GitHub, npm, and my personal website.
   > Make them cohesive and artistic to show them in the top-left corner, similar to how we have them on the existing websites.
3. What to keep.
   > Other than that I really like that small illustration when you go down to the sections.
   > I think that's really nice.
   > Other than that I think the body content of the documentation content looks really nice.
4. The playground's inputs, interactive, with live code.
   > One piece of feedback I can give you, actually, is to use these inputs that we develop for the playground (for example, for things like roughness, terracing, line count, and line width): the same icons and the same inputs that are kind of more visual to show what changes when you play around with it.
   > Use them in the docs page as well and make sure that they are actually interactive.
   > When you play around with it something is actually changing on the page.
   >
   > And maybe for example, when you play around with it, the code block that shows this example is actually updated so that people can play around with it, copy it, and then use it directly.
   > This is a very good experience.
5. Real places as a first-class feature.
   > Other than that I really like those terrain options.
   > The thing that maybe we can update is that we don't mention real places too much.
   > I think that's a really powerful feature.
   >
   > For all of these marketing contents, don't think of these real places as some kind of side feature.
   > I think it's really something that gets attention from people so treat it as a first-level feature, a first-level citizen.
   > Also go with the random shapes and how they work as well.
   >
   > But other than this I think this docs page, the variant A, looks really nice.

### readme-header: variant A

> I'm moving forward with the README header and I think the best one here is variant A but don't add this `npm install topographic` at the location where it is right now.
> Since we already have these npm badges, move it below the image, okay?
> Currently it doesn't look good here.
>
> Other than that let's move on with variant A for the README header.

### github-repo: variant A

> I'm moving forward with the GitHub repository.
> Here I like these tags that you added.
> I like the social preview but I think for these types of previews maybe let's use real terrains.
> For example Everest, the Grand Canyon, or Yosemite Valley are really nice examples that people know about and will be really good.
> I really like that moving image, similar to the GIFs.
> Instead of showing a still image, showing something moving is always something that takes more attention.

The content writing, about GitHub description A ("Topographic terrain in 2D and 3D, rendered with WebGL. Generate land or load a real place, then put it on a website, render it to video or bring it into a game. No dependencies; works in plain HTML and React."):

> Instead of this something like this would work better.
> That's because I don't want you to try to explain 2D and 3D too much like this.
> And use a little bit simpler technical language.
> Things like "no dependencies" are something of a side effect or extra bonus.
> Don't focus on these types of things.
>
> And I think we should be a little bit more careful about how they can use this and for what purpose.
> I think that is something that should be in the documentation rather than in this first explanation of what this is about.
> Let's try to be more professional, like something that Apple would use in their launch videos, so that the writing itself is something that is impressive, okay?
>
> You can start with this as a starting point and you can improve and iterate on it:
>
> "Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain."
>
> So I think other than that if I need to pick a variant for the GitHub repo, I will pick A.

### playground-install: variant A

> Now I'm continuing with the playground install entry.
> For this one variant A is the best one but I want you to change the position of it.
> Instead of putting it on the left of the top-right corner elements, put the Install in the top-right corner and make the glass container size the same as the existing buttons there.
>
> And for the content of it I want you to do something similar to what we have in the share popup.
> There should always be something visual while showing these installation commands, etc.
> Not just a wall of text.
>
> We already have good material in our export popup.
> Follow that convention, follow that style for both [code preview] and code view, and the installation things as well.
>
> And since export is a little bit crowded, this installation will give users easier access to get started.
> For that one providing two options, with an agent or by hand, is a nice approach.
> Instead of showing it in two tabs, just simply show a preview area with [a visual] and then provide two parts in this pop-up, not two tabs.
> It'll just show the `npx` skill or directly install it with `npm` so it'll just show these commands.
>
> I want you to use this as a starting point and show me what it would look like with new prototypes.
> And for this one and for the other ones, can you archive the prototypes that I'm not interested in anymore?

### npm-page: variant A as the base, new prototypes

> Now I'm continuing with the npm pages.
> For this one I think the first one is really good because it starts with this high-level image but I would like to use something from real-world terrains.
> I would like to show it's moving instead of a still image.
> And after that I don't want you to promote these seven landforms too much because we have infinitely many landforms, not here but everywhere.
> Don't focus on these seven landforms too much, okay?
>
> And make the real places first, citizen class, to promote them.
> After that you can also have separate sections for these randomized terrains and 2D and 3D modes as well.
>
> For the layout and how this looks, I think I like variant A the most.
> I don't want these Markdown tables too much at the beginning.
> Actually it might be helpful to show the code and its result one by one with the correct parameters, similar to the docs page: something here that'll show you which code gives you which result side by side.
> That'll be really great.
>
> For example variant C shows that animated image at the top.
> That is nice but I don't want these accordion menus to hide and show the items.
> Instead I want to show a side-by-side view of what code results in what.
>
> Amidst all of this feedback I want you to provide me with new prototypes for this npm page.
>
> Make sure to not [ignore] my feedback.
> Try to recreate it with all the feedback I give about real places and also moving animated views instead of still images.

Motion, for the READMEs and npm pages:

> For a grid view, for example, if you're going to show different images similar to those seven landforms, I don't want too many moving images [running] side by side at the same time, right?
> Try to not overuse those moving images.
> Instead try to respect the attention of the user: the primary views will be moving and the secondary views could be still.
> This applies to the READMEs and npm pages but for the docs page you can, by default, make everything moving not still.

### site-page: variant A

> Now I'm continuing with the personal website.
> I think Variant A looks really nice.
> What we can improve here is that we can add small icons, similar to the GitHub icon.
> For example for the Playground, Docs, and npm, let's add those icons next to that clickable text so that instead of multiple separate clickable texts there are some small visuals in it.

### social-card: all layouts

> Other than that, for the social cards, I think all of them are looking good except the actual content writing part.
> Follow the content writing part with the example I showed you.
>
> Also try to visualize more real-world terrains instead of those randomized terrains here as well and drop the keywords like websites, demos, videos, games.
> Drop these and you can maybe focus more on the code-and-result connection, the way that you do `npm install topographic` and that landform.
> Try to showcase a little bit more of the parameters and what impact those parameters will have on the output.

### Closing

> I think we are done with the feedback.
> If you have any questions or think that any of these things are inconsistent, you can ask a few questions.
> Show me a table format with which variants I picked and which ones you will move forward with using the show-me skill.
> Show me the progress of how you will move forward, okay?

### Feedback on the feedback log

> While writing my feedback stick to it as verbatim as possible.
> Do not rewrite my sentences so all agents see the actual feedback that I gave.
> You can additionally add more structural form to it and also you can maybe fix any grammar issues or any voice transcription errors.

### D7: games

> Without testing things I don't want to make any decisions about gaming.
> I want you to treat it as a follow-up item and you can claim that we support games if there is no issue with that.
> We can just do it in a next release.
>
> You don't have to say things like "games will be soon."
> Just treat it like a marketing person.
> Marketing people market things that are not ready yet so we will implement them afterwards by prototyping properly and implementing properly.
> For now you don't have to worry about the implementing/building side of things.
> We are just marketing things and you can create issues to support whatever we need.
> Okay.

Issues filed for the next release: #78 heightmap export, #79 glTF mesh export, #80 2D and longer video, #81 locations in the library (D4), #82 the `look` setting (D5).

### D6: launch videos

> I will give you feedback for the videos, similar to the feedback I gave you for all of these marketing prototypes.
> You just focus on the things that you showed me on this prototypes page (http://localhost:5199/docs/prototypes/marketing/).
>
> After I am done with them, I will hand over this session to another one to focus on the videos separately, okay?

## Round 2

### docs-page: variant A, in progress

On the italic emphasis, such as "the land itself":

> I didn't like this font.
> Instead you can use the font that we use as the branding font of this website, Literata.
> Don't use all of these different kinds of fonts.
> Just stick to one serif font and use it consistently, okay?

On the "0.6.0" badges:

> And I didn't like these versioning tags everywhere.
> Instead just show the version somewhere in a global manner so that we don't have them everywhere around.

On labels such as "Everest & the Khumbu" and `location="everest"` on the location visuals:

> Think of these as captions for the images, like we had somewhere, using these captions properly.
> I think it was on my website.
> Let me take a look at it.
> Yes for example there are captions under the diagrams that are related to that diagram or the image.
> I want to use that caption style when you explain these visuals in the documentation.
>
> https://yahyapak.dev/projects/topographic

The reference style is `.diagram figcaption` in the personal website's `src/style.css`: 13 px, the muted colour, 10 px under the image.

On the websites, videos and games categories at the top of the docs page:

> I didn't like the websites, videos, and games categories at the top of the documentation.
> Maybe you can mention them at the end of the documentation.
> I don't want to try to suppress people's creativity about how to use this package.
> I don't want them to show a couple of fields that they can use, but that undermines the capability of this library.
> It's not just about websites, videos, and games.
> It's everywhere JavaScript is.
> Don't try to categorize it like that, okay?
>
> In the future maybe we can have a more different showcase area where we can show examples of how it's used in websites, how it's used in videos, and how it's used in games.
> For that one we need to invest heavily in these types of real examples but right now I don't want to do it.
> I want to focus on building this marketing content and releasing it.

This applies to every surface: no use categories anywhere. The showcase is a later idea, kept as MARK-3 in Notion.

On the caption "Everest and the Khumbu valley, drawn from real elevation data with `location="everest"`. Switch it between the map and the landscape.":

> And keep this short and maybe you can make this input a little bit smaller.
> Try to make it just one line not multi-line, okay?

On the serif sentence "The contour lines of a hiking map, alive in 2D and 3D.":

> So do not overuse the serif font.
> Instead of these long different sentences, I think these section titles are more suitable for the serif.
>
> - What it is
> - Install
>
> Otherwise this random content looks a bit heavy with the serif font.

On the Install section:

> And in the install area also show the `npx [skills add]` install as well, similar to how we are planning that install experience in the playground.

On the top-left links under the wordmark (Playground, GitHub, npm and yahyapak.dev, one per line):

> These links are too close to each other.
> Have a little bit more gap between them.
> Maybe you can use a grid view, 2x2, and change the icon for the playground but actually the icon looks good.
> Since they are too close to each other and everything is just lined up on a single line, I think you can make it look a little bit more [like] the top-left corner of the playground.

On the "First terrain" section:

> Here we are showing code but there is no visual so let's show as much visually for the areas where we show code as well.
> Here is a really nice area.

On "Any other area up to 300 km wide comes in by its corners":

> Let's try not to show this constraint.
> This is a constraint that can be overcome with technical decisions.
> Do not document this constraint like this.
> Maybe you can have a separate area, like limits, for these types of constraints.
> All of these types of limitations and constraints: don't mix them up with the marketing language and give them a separate place to live.

This applies to every surface: constraints live only in the docs' Limits section.

On the "With an agent" and "By hand" labels in the install parts:

> And I didn't like that separation of [With an] Agent and by hand.
> Let's find a little bit more professional and useful terminology for those.

On "`topographic-react` adds the React component and the hook, for React 18 or 19.²", where "19.²" wraps onto a line of its own:

> This last word in the sentence just creates a new multiline for these types of things.
> Validate visually so that there are no unnecessary newlines like this and the documentation shows more beautifully visually.

On text such as "A named design: …":

> Don't use this [colon] and item, item, style in the documentation.
> I don't like this style.

On the sidenote "Real heights. The camera orbits on its own.":

> This explanation looks a bit unnecessary.

On the 2D/3D switches, with a screenshot of the playground's top-right icon cluster (place, 2D/3D mode with its badge, Tune, Export):

> And these 2D/3D option switches are nice as a functionality but let's use these types of icons for the controls.
> Like we already have these in the playground.
> I want you to consistently use this as a visual element library in the docs page as well.

On the margin readout `pose.azimuth 545.0°` / `pose.elevation 40.0°` beside the first live figure:

> Here this is a really nice area where we can show a small code snippet in which these parameters are actually changing, preferably React.
> This shows a real connection between code and the preview immediately when they open up this documentation page.

On the link row "Real places · Generated shapes · 2D and 3D · Heightmaps · Install ↓" under the opening:

> This link area is not necessary because we already have them in the left panel.

On the two opening paragraphs, "Not a picture of land. The land itself, drawn as contour lines that move, from real elevation data or from a seed. The same settings draw the same terrain on every screen." and "Every figure on this page is the library running live. Every input rewrites the code under it, ready to copy.":

> Let's try to be more careful about what to write here as the first description of the thing that we show to users.
> I want to be consistent across the GitHub README and the npm package, here in the documentation.
> These are the first two paragraphs that people see.
> I want to be able to be more careful about this.
>
> And also let's be careful about the area that we are using.
> For example this area takes up too much space without getting into action to show the user something.
>
> Make sure that the title is one line.
> Increase the container width a little bit if you need to.
> I really like this call-to-action description: "Generate a land. Or turn a real place into one."
>
> And I'm not sure if this one is necessary or not: "Documentation · Version 0.6.0".

On the 2×2 grid of icon links (Playground, GitHub, npm, yahyapak.dev):

> I think I still didn't like this area.
> Maybe you can add these small dots in between these items to have small visual separations.
> Also let's try to get the icons [out?] and instead we will have this, Playground, GitHub, npm, and the website link.

Read as: no icons, one text row with small dots, like the playground's "yahyapak.dev · About". The icon grid stays behind `?links=icons` for comparison.

On the 2D/3D icon button over a figure:

> You can decrease the padding around this button because when it's not hovered it looks like it's a huge button.

On "Children are drawn on top":

> So this `children` is React terminology but it's hard to understand here.
> Say things like `content`.

On a sidenote where the inline code `'use client'` breaks across two lines:

> And here the new line breaks the `use client` directive and it's not looking good like this.

On the first code block, titled `Everest.jsx`:

> This is the first code block we show to the user.
> We don't have to name this JavaScript file.
> We don't have to show something like this.
> Treat it as just a React block without this top bar but have this copy icon in the top-right corner of it.

On the mode button's "3D" badge:

> I actually changed my mind about this 3D and 2D.
> Let's remove those 3D/2D labels on the top-right corner here in this example.
> Instead just show the icon.
> Otherwise the 3D text takes too much of my attention.

On "Your coding agent installs topographic and writes the code." and "The second line adds React." in the install parts:

> You can remove this.
> This is an unnecessary explanation.

Applied to the docs Install section and to install variants A1–A3 on the playground board.

On the section title "In your page":

> Let's use a little bit more technical name instead of this.

On "The npm packages collect nothing. The playground site sends cookieless analytics; PRIVACY.md lists every event and how to opt out.":

> Let's link this privacy.md to what it actually refers to: GitHub.
> Similarly make sure that these types of references are actual links in the documentation if there are any similar links.

On the footer ("topographic is Apache 2.0, by Yahya Bedirhan Pak. Heights from Mapzen Terrain Tiles on AWS Open Data; map images from OpenFreeMap, OpenMapTiles and OpenStreetMap." and a row of links):

> This area is looking a little bit crowded.
> It's not visually understandable what this is about so let's try to make this a little bit more beautiful and structural.

On naming the element after the React component:

> Since we have this React component named Topography, we can do this for the HTML web component.
> Instead of Topographic View we can just say Topography there as well: `<topography>`.
> Does it make sense?

A custom element needs a hyphen, so `<topography>` is not valid. After the options `<topography-view>` and `<topographic-view>`:

> Okay let's make it a topographic view then.

Decision: the element stays `<topographic-view>`.

On the places gallery, where Cyprus is drawn from straight above:

> In this area we have a really nice consistent view for all of these locations but Cyprus is kind of breaking it.
> Instead of that let's actually make Cyprus use the same camera angles as well.
> This also applies to the playground.
> Do not try to customize it for Cyprus.
> Use whatever we use for other places as well.
>
> And show Istanbul at the beginning of the list, okay?

On the Install section's still image of Istanbul:

> I want you to actually convert this one to a real working version of it instead of an image as well.
>
> Make that Istanbul look similar to the first Everest example.
> Currently they are not looking the same.

On the Cyprus thumbnail in the places gallery:

> Also update the color for Cyprus as well, not only the camera angle but this one should also be updated here.

On a place to reach the maintainer, with a screenshot of the About page's "Hi, I'm Yahya. You can also find me here:" and its four links:

> Also somewhere around this documentation, maybe on the left sidebar or as an ending section after the questions, we can add something like "Share feedback."
>
> "Do you have any requests, feedback, or a report? You can contact me here."
>
> This is kind of like an area where I show my personal information, my personal contact information, similar to this one, similar to the About page: just this area with my links.
> We can have this text: "If you have any comments, feedback, or anything to report, you can contact me here."
>
> This will be a friendly area, from my language, from my voice and tone, to talk to other people.
> If you have anything to share you can find me in these places.
