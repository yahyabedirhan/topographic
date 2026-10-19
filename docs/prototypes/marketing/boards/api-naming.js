// PROTOTYPE board: the 0.6.0 public names, judged as the code a reader sees first.
import { h } from '../live.js';

const css = `
.an{position:absolute;inset:0;background:#0b0b0d;color:#ecebe8;font-family:Inter,sans-serif;padding:56px 64px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr 1fr;gap:22px 28px}
.an header{grid-column:1/-1;display:flex;gap:28px;align-items:baseline;flex-wrap:wrap}
.an header b{font:600 13px/1 Inter;letter-spacing:.08em;text-transform:uppercase;color:#8b8a86}
.an header span{font:500 15px 'JetBrains Mono';color:#d8d7d3}
.an figure{margin:0;display:grid;grid-template-rows:auto 1fr;gap:10px}
.an figcaption{font:500 13px Inter;color:#8b8a86}
.an pre{margin:0;padding:22px 24px;border-radius:14px;background:#141418;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);font:400 16px/1.7 'JetBrains Mono';color:#cfcdc7;white-space:pre}
.an .k{color:#8b8a86}.an .s{color:#a9c7e4}.an .n{color:#e0a24a}.an .t{color:#c9a7e4}
`;

/** One naming scheme rendered as four snippets: JS, React, HTML and a real location. */
function scheme({ create, type, component, hook, tag, land, loc, look, locFn, entry }) {
  return (stage) => stage.append(h`<style>${css}</style><div class="an">
    <header>
      <span><b>create</b> ${create}</span><span><b>React</b> ${component} · ${hook}</span><span><b>element</b> &lt;${tag}&gt;</span>
      <span><b>shape</b> ${land}</span><span><b>real place</b> ${loc}</span><span><b>named design</b> ${look}</span>
    </header>
    <figure><figcaption>JavaScript</figcaption><pre><span class="k">import</span> { ${create} } <span class="k">from</span> <span class="s">'topographic'</span>;

<span class="k">const</span> topography = ${create}(el, {
  ${land}: <span class="s">'long-ridge'</span>,
  seed: <span class="n">12</span>,
  mode: <span class="s">'3d'</span>,
});
topography.update({ terrain: { peaks: <span class="n">3</span> } });</pre></figure>
    <figure><figcaption>React</figcaption><pre><span class="k">import</span> { ${component} } <span class="k">from</span> <span class="s">'topographic-react'</span>;

&lt;<span class="t">${component}</span>
  ${land}=<span class="s">"long-ridge"</span>
  ${look}=<span class="s">"survey-map"</span>
  mode=<span class="s">"3d"</span>
  camera={{ motion: <span class="s">'orbit'</span> }}
/&gt;</pre></figure>
    <figure><figcaption>HTML</figcaption><pre>&lt;<span class="k">script</span> type=<span class="s">"module"</span>&gt;
  <span class="k">import</span> <span class="s">'topographic/element'</span>;
&lt;/<span class="k">script</span>&gt;

&lt;<span class="t">${tag}</span> ${land}=<span class="s">"dunes"</span> ${look}=<span class="s">"sea-dunes"</span>&gt;&lt;/<span class="t">${tag}</span>&gt;</pre></figure>
    <figure><figcaption>A real place</figcaption><pre><span class="k">import</span> { ${component} } <span class="k">from</span> <span class="s">'topographic-react'</span>;

&lt;<span class="t">${component}</span> ${loc}=<span class="s">"fuji"</span> mode=<span class="s">"3d"</span> /&gt;

<span class="k">// any area, in your own code</span>
<span class="k">import</span> { ${locFn} } <span class="k">from</span> <span class="s">'${entry}'</span>;
<span class="k">const</span> field = <span class="k">await</span> ${locFn}({ west, south, east, north });</pre></figure>
  </div>`);
}

export default {
  id: 'api-naming',
  title: 'API names',
  question: 'Which names read best in the first code a developer sees? The type, ref and instance names follow the same choice.',
  surface: 'README, package READMEs, guide, llms.txt, playground Export code, videos that show code',
  variants: [
    {
      key: 'A', name: 'landform · location · look',
      note: 'The current proposal: your createTopography and Topography, landform for the generated shape, location for a real place, look for a named design, <topographic-map>.',
      render: scheme({ create: 'createTopography', component: 'Topography', hook: 'useTopography()', tag: 'topographic-map', land: 'landform', loc: 'location', look: 'look', locFn: 'fetchLocation', entry: 'topographic/locations' }),
    },
    {
      key: 'B', name: 'shape · location · preset',
      note: 'Plainer words. "shape" is short but generic; "preset" is the word most libraries use for a saved design. Element <topography-view>.',
      render: scheme({ create: 'createTopography', component: 'Topography', hook: 'useTopography()', tag: 'topography-view', land: 'shape', loc: 'location', look: 'preset', locFn: 'fetchLocation', entry: 'topographic/locations' }),
    },
    {
      key: 'C', name: 'land · place · look',
      note: 'The shortest words. "land" pairs with "place": made-up land or a real place. Element <topographic-terrain>, which reads well for 3D but less for 2D maps.',
      render: scheme({ create: 'createTopography', component: 'Topography', hook: 'useTopography()', tag: 'topographic-terrain', land: 'land', loc: 'place', look: 'look', locFn: 'fetchPlace', entry: 'topographic/places' }),
    },
  ],
};
