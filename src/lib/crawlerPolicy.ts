// Explicit search-bot groups must repeat exclusions: robots rules do not inherit from '*'.
export const PRIVATE_CRAWL_PATHS = [
  '/admin', '/dashboard', '/api', '/login', '/register$', '/register/', '/user', '/account',
  '/profile', '/settings', '/private', '/checkout', '/payment', '/success',
  '/failed', '/trash', '/backup', '/*?*profile=', '/*?*heatmapPreview=', '/*?*donorExplore=',
];
export const SEARCH_CRAWLERS = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot'];
