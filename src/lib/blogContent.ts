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
  let html = value;

  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<(iframe|object|embed|form|input|button|textarea|select)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
  html = html.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, " $1=\"#\"");
  html = html.replace(/<table\b([^>]*)>/gi, "<div class=\"bn-table-wrap\"><table$1>");
  html = html.replace(/<\/table>/gi, "</table></div>");

  return html.trim();
};
