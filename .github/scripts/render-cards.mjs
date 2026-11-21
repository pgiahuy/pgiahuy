// Renders the stats and top-langs cards by calling github-readme-stats' own request handlers, so the
// cards look exactly as they did when they came from a hosted deployment, without depending on one.
// The workflow checks the project out at a pinned commit into .cards/readme-stats and passes a token
// as PAT_1. Each card is written only when the handler returned a real SVG, not an error card.
import { mkdirSync, writeFileSync } from "node:fs";

const root = new URL("../../.cards/readme-stats/api/", import.meta.url);
const colors = { bg_color: "00000000", title_color: "58a6ff", text_color: "8b949e", icon_color: "8b949e", border_color: "30363d" };

const cards = [
  {
    name: "stats",
    handler: "index.js",
    query: { username: "pgiahuy", show_icons: "true", include_all_commits: "true", hide_title: "true", ...colors },
  },
  {
    name: "top-langs",
    handler: "top-langs.js",
    query: { username: "pgiahuy", hide: "css,html,jupyter notebook", hide_title: "true", langs_count: "5", card_width: "320", ...colors },
  },
];

async function render({ name, handler, query }) {
  const { default: handle } = await import(new URL(handler, root));
  let body = "";
  const res = { setHeader() {}, send(value) { body = String(value); return body; } };
  await handle({ query }, res);
  if (!body.trimStart().startsWith("<svg") || /Something went wrong|Maximum retries exceeded/i.test(body)) {
    throw new Error(`${name}: github-readme-stats returned an error card:\n${body.slice(0, 500)}`);
  }
  // The language bars ship #ddd tracks that read as bright frames on a dark README; use GitHub's border grey.
  writeFileSync(`profile/${name}.svg`, body.replaceAll('"#ddd"', '"#30363d"').replaceAll("#E4E2E2", "#30363d"));
  console.log(`${name}: updated`);
}

mkdirSync("profile", { recursive: true });
for (const card of cards) await render(card);
