import {sanitizeBlogHtml,hasHtmlMarkup,stripHtmlTags} from './blogContent';
export function blogText(value:string){return stripHtmlTags(value).replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,entity=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[entity]||' ')).replace(/\s+/g,' ').replace(/\s+([,.;:!?])/g,'$1').trim();}
export function blogDescription(content:string,preferred?:string|null){const text=blogText(preferred||content);return text.length<=170?text:text.slice(0,167).replace(/\s+\S*$/,'')+'…';}
export function blogCanonical(slug:string,custom:string|null|undefined,base:string){try{if(custom){const url=new URL(custom,base);if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password){url.hash='';return url.href;}}}catch{}return new URL('/blog/'+encodeURIComponent(slug),base).href;}
export function prepareBlogReading(content:string){
 const escape=(text:string)=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 let html=hasHtmlMarkup(content)?sanitizeBlogHtml(content):content.split(/\n{2,}/).filter(chunk=>chunk.trim()).map(chunk=>{const heading=chunk.trim().match(/^(#{1,3})\s+([^\n]+)$/);return heading?`<h${heading[1].length===3?3:2}>${escape(heading[2])}</h${heading[1].length===3?3:2}>`:`<p>${escape(chunk.trim()).replace(/\n/g,'<br/>')}</p>`;}).join('');
 const headings:Array<{id:string;title:string;level:number}>=[];
 html=html.replace(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi,(_,level,text)=>{const id='article-section-'+(headings.length+1),tag=Number(level)===3?3:2;headings.push({id,title:blogText(text),level:tag});return `<h${tag} id="${id}">${text}</h${tag}>`;});
 const wordCount=blogText(content).split(/\s+/).filter(Boolean).length;
 return {html,headings,wordCount,readingMinutes:Math.max(1,Math.ceil(wordCount/200))};
}
export function archivePage(value:unknown){const number=typeof value==='string'&&/^\d+$/.test(value)?Number(value):1;return Number.isSafeInteger(number)&&number>0&&number<=100000?number:1;}
export function relatedBlogScore(query:string,title:string){const stop=new Set(['the','and','for','with','that','this','from','your','what','how','why','bloodnet','medical']);const terms=new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter(word=>!stop.has(word))||[]),words=new Set(title.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]);return [...terms].reduce((score,term)=>score+(words.has(term)?1:0),0);}
