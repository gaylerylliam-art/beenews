// Builds the publishable site.
//   node tools/build-www.mjs         → www/  for the iOS and Android apps (adds js/native.js, no service worker)
//   node tools/build-www.mjs --web   → dist/ for Netlify (the website)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
const web = process.argv.includes("--web");
const out = web ? "dist" : "www";
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
const pages = ["index.html", "story.html", "privacy.html", "terms.html", "editorial.html", "contact.html", "corrections.html"];
const files = [...pages, "config.js", "manifest.webmanifest", ...(web ? ["admin.html", "sw.js", "robots.txt"] : [])];
const dirs = ["css", "js", "images", "icons"];
for (const f of files) cpSync(f, `${out}/${f}`);
for (const d of dirs) cpSync(d, `${out}/${d}`, { recursive: true });
if (!web) {
  // In the app: load native.js before everything else.
  for (const f of pages) {
    const html = readFileSync(`${out}/${f}`, "utf8").replace(/<head>/, '<head>\n<script src="/js/native.js"></script>');
    writeFileSync(`${out}/${f}`, html);
  }
  if (!existsSync(`${out}/js/native.js`)) throw new Error("js/native.js missing");
}
console.log(`${out}/ ready: ${files.length} files + ${dirs.join(", ")}`);
