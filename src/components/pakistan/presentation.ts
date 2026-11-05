import type { CSSProperties } from 'react';
import type { resolveRegionalDesign } from '@/src/lib/regionalDesign';

export function pakistanStyle(colors: ReturnType<typeof resolveRegionalDesign>['colors']): CSSProperties {
  return {'--pk-paper':colors.paper,'--pk-ink':colors.ink,'--pk-green':colors.accent,'--pk-forest':colors.indigo} as CSSProperties;
}
