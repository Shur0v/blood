import type { ReactNode, CSSProperties } from 'react';
import { getRegionalContent } from '@/src/backend/services/regionalContent';
import { resolveRegionalDesign } from '@/src/lib/regionalDesign';

/** Used only after the page has resolved its country from directory data. */
export default async function IndiaSurface({
  children,
}: {
  children: ReactNode;
}) {
  const { colors } = resolveRegionalDesign(
    'India',
    (await getRegionalContent('India'))?.design,
  );
  return (
    <div
      className="india-page india-guide"
      style={
        {
          '--india-paper': colors.paper,
          '--india-ink': colors.ink,
          '--india-accent': colors.accent,
          '--india-green': colors.indigo,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
