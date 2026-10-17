export interface Update {
  version: string;
  summary: string;
}

/** Turns one changelog bullet into plain text and keeps its first sentence. */
function summarize(bullet: string): string {
  const text = bullet
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s*[\u2013\u2014]\s*/g, ', ')
    .trim();
  const end = text.search(/\.(\s|$)/);
  const sentence = end > 0 ? text.slice(0, end + 1) : text;
  return sentence ? sentence[0].toUpperCase() + sentence.slice(1) : sentence;
}

/** The newest `count` bullets of CHANGELOG.md, each labelled with its version heading. */
export function latestUpdates(markdown: string, count = 3): Update[] {
  const out: Update[] = [];
  let version = '';
  for (const line of markdown.split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) version = heading[1];
    else if (version && /^[-*]\s+/.test(line)) out.push({ version, summary: summarize(line.replace(/^[-*]\s+/, '')) });
    if (out.length === count) break;
  }
  return out;
}
