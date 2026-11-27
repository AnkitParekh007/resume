import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const origin = 'https://ankit-parekh.org';
const categories = ['ai-engineering','system-architecture','harness-engineering','frontend-engineering','forward-deployed-engineering','building-in-public'];
const fixed = new Set(['index.html','feed.xml','sitemap.xml','assets/blog.css','assets/theme.js','assets/ui.js',...categories.map(c=>'category/'+c+'/index.html')]);
const article = /^articles\/\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\/index\.html$/;
const page = /^page\/[1-9]\d*\/index\.html$/;
const search = /^pagefind\/[A-Za-z0-9_./-]+\.(?:js|css|json|wasm|pagefind|pf_index|pf_meta|pf_fragment|gz|map)$/;
const found = [];
function visit(dir, prefix='') {
  for (const name of readdirSync(dir)) {
    const rel = prefix + name, full = join(dir,name), stat = lstatSync(full);
    assert.ok(!stat.isSymbolicLink(), 'Blog bundle contains a symlink: '+rel);
    if (stat.isDirectory()) visit(full,rel+'/');
    else {
      assert.ok(stat.isFile() && (fixed.has(rel)||article.test(rel)||page.test(rel)||search.test(rel)), 'Unexpected blog bundle path: '+rel);
      found.push(rel);
    }
  }
}
visit('blog');
for (const file of fixed) assert.ok(found.includes(file), 'Missing blog file: '+file);
const sitemap = readFileSync('blog/sitemap.xml','utf8');
const urls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]));
assert.ok([...urls].every(url=>url.startsWith(origin+'/blog/')), 'Non-blog URL in blog sitemap');
const articles = found.filter(f=>article.test(f));
for (const file of found.filter(f=>f.endsWith('/index.html')||f==='index.html')) {
  const url = origin+'/blog/'+file.replace(/index\.html$/,'');
  const html = readFileSync('blog/'+file,'utf8');
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'), file+': canonical mismatch');
  assert.equal((html.match(/<h1\b/gi)||[]).length,1,file+': expected one H1');
  assert.ok(!/\bdraft:\s*true\b/i.test(html),file+': draft metadata leaked');
  if (!page.test(file)) assert.ok(urls.has(url),file+': missing from blog sitemap');
}
const feed=readFileSync('blog/feed.xml','utf8');
assert.match(feed,/<rss\b/);
for(const item of feed.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)) assert.ok(urls.has(item[1]), 'RSS item not in sitemap');
if(articles.length) assert.ok(existsSync('blog/pagefind/pagefind-entry.json'),'Missing static search index');
assert.match(readFileSync('index.html','utf8'),/href="\/blog\/"/);
assert.match(readFileSync('open-source-projects.html','utf8'),/href="\/blog\/"/);
assert.ok(readFileSync('robots.txt','utf8').includes('Sitemap: '+origin+'/blog/sitemap.xml'));
assert.ok(readFileSync('sitemap.xml','utf8').includes('<loc>'+origin+'/blog/</loc>'));
console.log('PASS blog publication boundary, '+categories.length+' categories, '+articles.length+' reviewed articles, SEO and navigation');
