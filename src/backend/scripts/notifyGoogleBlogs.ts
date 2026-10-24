import nextEnv from '@next/env';
import {readFile} from 'node:fs/promises';
import {notifyGoogleBlogs} from '../services/googleBlogDiscovery';
import {getPublicBaseUrl} from '../config/env';

nextEnv.loadEnvConfig(process.cwd(),false);
// Submit sitemaps, not ordinary articles to the restricted Google Indexing API.
async function main() {
  const file=process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE;
  if(!file) {
    if(!process.argv.includes('--optional')) throw new Error('Set GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE to a private service-account JSON file authorized on your Search Console property.');
    console.log('Google sitemap submission skipped: no Search Console credentials configured. Submit sitemap-blog.xml and blog/feed.xml once in Search Console; both update automatically.');
    return;
  }
  let credentials;
  try { credentials=JSON.parse(await readFile(file,'utf8')); }
  catch { throw new Error('Could not read a valid Search Console credentials file. Check its path, permissions and JSON format.'); }
  const submitted=await notifyGoogleBlogs(getPublicBaseUrl(),process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY,credentials);
  for(const url of submitted) console.log(`Submitted ${url}. Google determines crawling and indexing.`);
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Google sitemap submission failed.');process.exitCode=1;});
