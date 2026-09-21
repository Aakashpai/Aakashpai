// Sums language bytes over my non-fork repos and prints a compact SVG bar chart.
const user = process.env.GITHUB_REPOSITORY_OWNER ?? "Aakashpai";
const headers = { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "user-agent": user };
const get = async (url) => (await fetch(url, { headers })).json();

const repos = (await get(`https://api.github.com/users/${user}/repos?per_page=100&type=owner`)).filter((r) => !r.fork);
const colors = await get("https://raw.githubusercontent.com/ozh/github-colors/master/colors.json");
const bytes = {};
for (const r of repos) {
  for (const [lang, n] of Object.entries(await get(r.languages_url))) bytes[lang] = (bytes[lang] ?? 0) + n;
}
const total = Object.values(bytes).reduce((a, b) => a + b, 0);
const top = Object.entries(bytes).sort((a, b) => b[1] - a[1]).slice(0, 6);

const W = 880, BAR = 10, COL = W / 6;
let x = 0;
const bar = top
  .map(([lang, n]) => {
    const w = (n / total) * W;
    const s = `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${BAR}" fill="${colors[lang]?.color ?? "#8b949e"}"/>`;
    x += w;
    return s;
  })
  .join("");
const legend = top
  .map(([lang, n], i) =>
    `<g transform="translate(${(i * COL).toFixed(1)} 0)"><circle cx="6" cy="6" r="6" fill="${colors[lang]?.color ?? "#8b949e"}"/><text x="18" y="11">${lang} <tspan class="pct">${((n / total) * 100).toFixed(1)}%</tspan></text></g>`
  )
  .join("");
const H = BAR + 16 + 16;

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Most used languages">
<style>text{font:500 13px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;fill:#1f2328}.pct{fill:#656d76;font-weight:400}@media(prefers-color-scheme:dark){text{fill:#e6edf3}.pct{fill:#8d96a0}}</style>
<g clip-path="inset(0 round 5px)">${bar}</g>
<g transform="translate(0 ${BAR + 16})">${legend}</g>
</svg>
`);
