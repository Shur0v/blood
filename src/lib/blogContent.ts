import sanitizeHtml from 'sanitize-html';

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

export const hasHtmlMarkup = (value: string): boolean => HTML_TAG_REGEX.test(value);

export const stripHtmlTags = (value: string): string =>
  value
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const sanitizeBlogHtml = (value: string): string => {
  const html=sanitizeHtml(value,{
    allowedTags:sanitizeHtml.defaults.allowedTags.concat(['img','h1','h2','span']),
    allowedAttributes:{a:['href','name','target','rel'],img:['src','alt','width','height','loading'],th:['colspan','rowspan','scope'],td:['colspan','rowspan'],'*':['class','style']},
    allowedSchemes:['http','https','mailto','tel'],allowProtocolRelative:false,
    allowedStyles:{'*':{'text-align':[/^(left|right|center|justify)$/],'color':[/^#[0-9a-fA-F]{3,8}$/,/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],'font-weight':[/^(normal|bold|[1-9]00)$/]}},
    transformTags:{a:(tagName,attributes)=>({tagName,attribs:{...attributes,rel:'noopener noreferrer'}})},
  });
  return html.replace(/<table\b([^>]*)>/gi,'<div class="bn-table-wrap"><table$1>').replace(/<\/table>/gi,'</table></div>').trim();
};
