import type {ReactNode,CSSProperties} from 'react';
import {getRegionalContent} from '@/src/backend/services/regionalContent';
import {resolveRegionalDesign} from '@/src/lib/regionalDesign';
export default async function UsaSurface({children}:{children:ReactNode}){const {colors}=resolveRegionalDesign('United States',(await getRegionalContent('United States'))?.design);return <div className="usa-page usa-seo" style={{'--us-paper':colors.paper,'--us-ink':colors.ink,'--us-red':colors.accent,'--us-blue':colors.indigo} as CSSProperties}>{children}</div>;}
