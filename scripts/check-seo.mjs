// Dependency-free technical SEO checks, also used by the GitHub Pages deployment workflow.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const base = 'https://ankit-parekh.org/';
const pages = [
  { file: 'index.html', url: base },
  { file: 'open-source-projects.html', url: base + 'open-source-projects.html' },
];
const sitemap = readFileSync('sitemap.xml', 'utf8');
const robots = readFileSync('robots.txt', 'utf8');
const titles = new Set();
assert.match(robots, /Sitemap:\s*https:\/\/ankit-parekh\.org\/sitemap\.xml/i);
assert.match(robots, /User-agent:\s*\*/i);
assert.match(sitemap, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
for (const {file, url} of pages) {
  const html = readFileSync(file, 'utf8');
  const head = html.split('</head>')[0];
  const capture = (regex, label) => {
    const match = head.match(regex);
    assert.ok(match, file + ': missing ' + label);
    return match[1];
  };
  const title = capture(/<title>([^<]+)<\/title>/i, 'title');
  const description = capture(/<meta name="description" content="([^"]+)"/i, 'meta description');
  const canonical = capture(/<link rel="canonical" href="([^"]+)"/i, 'canonical');
  const ogUrl = capture(/<meta property="og:url" content="([^"]+)"/i, 'og:url');
  const ogImage = capture(/<meta property="og:image" content="([^"]+)"/i, 'og:image');
  const jsonLd = capture(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, 'JSON-LD');
  const data = JSON.parse(jsonLd);
  assert.equal(canonical, url, file + ': canonical mismatch');
  assert.equal(ogUrl, url, file + ': social URL mismatch');
  assert.ok(ogImage.startsWith(base), file + ': OG image should be same-site');
  assert.ok(title.length > 25 && title.length < 75, file + ': title length');
  assert.ok(description.length > 90 && description.length < 185, file + ': description length');
  assert.ok(!titles.has(title), file + ': duplicate title');
  assert.ok(!/noindex|http-equiv="refresh"/i.test(head), file + ': must be indexable without a meta redirect');
  assert.match(head, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(head, /<meta name="robots" content="index,follow,max-image-preview:large"/);
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, file + ': expected one H1');
  assert.equal(data['@context'], 'https://schema.org');
  assert.ok(Array.isArray(data['@graph']), file + ': JSON-LD graph missing');
  assert.ok(sitemap.includes('<loc>' + url + '</loc>'), file + ': missing sitemap URL');
  titles.add(title);
  console.log('PASS', file, '—', title);
}
const home = readFileSync('index.html', 'utf8');
const projects = readFileSync('open-source-projects.html', 'utf8');
assert.match(home, /href="\/open-source-projects\.html"/);
assert.match(home, /location\.replace\('\/open-source-projects\.html'/);
assert.ok(!home.includes('id="open-source-projects" hidden'), 'homepage should not ship hidden gallery HTML');
assert.match(projects, /id="featured"/);
assert.equal((projects.match(/<article class="project"/g) || []).length, 8, 'all 8 projects must remain');
console.log('PASS sitemap, robots, social metadata, structured data, internal links and project gallery');
