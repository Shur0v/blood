import type { ReactNode } from 'react';
import { getRegionalContent } from '@/src/backend/services/regionalContent';
import { resolveRegionalDesign } from '@/src/lib/regionalDesign';
import { pakistanStyle } from './presentation';

/** Country is resolved by the caller from directory data, never visitor inference. */
export default async function PakistanSurface({children}:{children:ReactNode}) {
  const {colors}=resolveRegionalDesign('Pakistan',(await getRegionalContent('Pakistan'))?.design);
  return <div className="pakistan-page pakistan-guide" style={pakistanStyle(colors)}>{children}</div>;
}
