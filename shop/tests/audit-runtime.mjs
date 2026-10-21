/**
 * Runtime audit of every storefront page: status, console errors, failed
 * requests, broken images, accessibility basics and layout overflow, at phone
 * and desktop width, in both languages.
 *
 *   node tests/audit-runtime.mjs            # against localhost:3000
 *   BASE=http://host node tests/audit-runtime.mjs
 */
// Playwright is a local audit tool, not a dependency of the shop, so it is
// resolved from wherever it already lives. Override with PLAYWRIGHT_PATH.
const playwrightModule =
  process.env.PLAYWRIGHT_PATH ||
  "/Users/othmarcasilla/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs";
const { chromium } = await import(playwrightModule);

const BASE = process.env.BASE || "http://localhost:3000";
const SLUGS = [
  "sweat-and-sunsets-tee", "meet-me-at-sunset-tee", "butterfly-soul-tee",
  "do-it-for-her-tee", "sunrise-performance-sun-shirt", "sunrise-tote-bag",
  "pocket-tote", "crossbody-bag", "zip-pouch", "stemless-tumbler",
  "glass-can", "skinny-tumbler", "tumbler-40oz", "travel-mug",
];
const PATHS = ["/shop", "/shop/all", "/shop/thank-you", ...SLUGS.map((s) => `/shop/p/${s}`)];
const WIDTHS = [[375, 812, "phone"], [1280, 900, "desktop"]];
const LOCALES = ["", "?lang=es"];

// Dev-only noise that says nothing about the shipped app.
const IGNORE = [/webpack-hmr/i, /react-devtools/i, /Download the React DevTools/i];

const problems = [];
const note = (where, kind, detail) => problems.push({ where, kind, detail });

// Use whichever Chromium this machine already has rather than pulling one.
const CHROME = process.env.CHROME_PATH ||
  "/Users/othmarcasilla/Library/Caches/ms-playwright/chromium-1181/chrome-mac/Chromium.app/Contents/MacOS/Chromium";
const browser = await chromium.launch({ executablePath: CHROME });
let checked = 0;

for (const [w, h, label] of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  for (const path of PATHS) {
    for (const lang of LOCALES) {
      // The product pages are the bulk; only sweep them at one width per locale
      // to keep the run bounded, but cover every slug.
      if (path.includes("/p/") && label === "phone" && lang === "") continue;

      const url = `${BASE}${path}${lang}`;
      const page = await ctx.newPage();
      const consoleErrors = [];
      const failed = [];
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const text = m.text();
        if (!IGNORE.some((re) => re.test(text))) consoleErrors.push(text.slice(0, 160));
      });
      page.on("requestfailed", (r) => {
        if (IGNORE.some((re) => re.test(r.url()))) return;
        const why = r.failure()?.errorText ?? "";
        // Next prefetches every linked route. Closing the page cancels the ones
        // still in flight, which is teardown, not a broken link -- the same
        // URLs answer 200 on their own. Only this exact pair is forgiven.
        if (why === "net::ERR_ABORTED" && r.url().includes("_rsc=")) return;
        failed.push(`${r.url().slice(-70)} ${why}`);
      });
      page.on("response", (r) => {
        if (r.status() >= 400 && !IGNORE.some((re) => re.test(r.url()))) {
          failed.push(`${r.status()} ${r.url().slice(-70)}`);
        }
      });

      let res;
      try {
        res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      } catch (e) {
        note(`${label} ${path}${lang}`, "navigation", String(e).slice(0, 120));
        await page.close();
        continue;
      }
      await page.waitForTimeout(600);

      const where = `${label} ${path}${lang}`;
      if (res.status() !== 200) note(where, "status", res.status());

      const audit = await page.evaluate(async () => {
        const imgs = [...document.querySelectorAll("img")];
        imgs.forEach((i) => { i.loading = "eager"; });
        await Promise.all(imgs.map((i) => i.complete ? null : new Promise((r) => {
          i.addEventListener("load", r, { once: true });
          i.addEventListener("error", r, { once: true });
        })));
        await new Promise((r) => setTimeout(r, 400));

        const de = document.documentElement;
        const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((x) => +x.tagName[1]);
        let jumps = 0;
        for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) jumps++;

        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);

        return {
          title: document.title,
          overflow: de.scrollWidth - de.clientWidth,
          h1: document.querySelectorAll("h1").length,
          headingJumps: jumps,
          brokenImages: imgs.filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute("src")?.slice(-50)),
          imagesMissingAlt: imgs.filter((i) => i.alt === null).length,
          duplicateIds: ids.filter((v, i) => ids.indexOf(v) !== i),
          smallTargets: [...document.querySelectorAll("a,button,input,summary")]
            .map((el) => ({ el, b: el.getBoundingClientRect() }))
            .filter(({ el, b }) => b.width > 0 && !el.closest('[class*="sr-only"]') && (b.height < 24 || b.width < 24))
            .map(({ el, b }) => `${el.textContent.trim().slice(0, 16)}|${Math.round(b.width)}x${Math.round(b.height)}`),
          unlabelledLinks: [...document.querySelectorAll("a,button")]
            .filter((el) => el.getBoundingClientRect().width > 0 &&
                            !el.textContent.trim() && !el.getAttribute("aria-label") && !el.querySelector("[alt]:not([alt=''])"))
            .length,
          emDashes: (document.body.innerText.match(/[—–]/g) || []).length,
          hiddenReveals: [...document.querySelectorAll("[data-reveal]")]
            .filter((n) => parseFloat(getComputedStyle(n).opacity) < 0.9).length,
        };
      });

      if (!audit.title) note(where, "title", "empty <title>");
      if (audit.overflow > 0) note(where, "overflow", `${audit.overflow}px`);
      if (audit.h1 !== 1) note(where, "h1", `${audit.h1} h1 elements`);
      if (audit.headingJumps) note(where, "headings", `${audit.headingJumps} level jump(s)`);
      if (audit.brokenImages.length) note(where, "images", audit.brokenImages.join(", "));
      if (audit.imagesMissingAlt) note(where, "alt", `${audit.imagesMissingAlt} img without alt`);
      if (audit.duplicateIds.length) note(where, "dup-id", audit.duplicateIds.join(", "));
      if (audit.smallTargets.length) note(where, "tap-target", audit.smallTargets.join(", "));
      if (audit.unlabelledLinks) note(where, "a11y", `${audit.unlabelledLinks} unlabelled link/button`);
      if (audit.emDashes) note(where, "em-dash", `${audit.emDashes} on page`);
      if (consoleErrors.length) note(where, "console", consoleErrors.join(" | "));
      if (failed.length) note(where, "network", [...new Set(failed)].join(" | "));

      // reveals are allowed to be mid-animation; only flag if still hidden after a scroll
      if (audit.hiddenReveals) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1200);
        const stuck = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")]
          .filter((n) => parseFloat(getComputedStyle(n).opacity) < 0.9).length);
        if (stuck) note(where, "reveal", `${stuck} element(s) stuck hidden`);
      }

      checked += 1;
      await page.close();
    }
  }
  await ctx.close();
}
await browser.close();

console.log(`\nchecked ${checked} page loads`);
if (!problems.length) {
  console.log("NO PROBLEMS FOUND");
} else {
  const byKind = {};
  for (const p of problems) (byKind[p.kind] ||= []).push(p);
  console.log(`${problems.length} problem(s) across ${Object.keys(byKind).length} kind(s):\n`);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`--- ${kind} (${list.length}) ---`);
    for (const p of list.slice(0, 8)) console.log(`  ${p.where.padEnd(42)} ${p.detail}`);
    if (list.length > 8) console.log(`  ... and ${list.length - 8} more`);
  }
}
