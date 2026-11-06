import type {PakistanArea,PakistanConfig} from '@/src/lib/pakistanLocal';
import type {PakistanCoverage} from '@/src/backend/services/pakistanLocalContent';
import type {DonorLocation} from '@/src/backend/services/donorLocations';
import type {getRegionalContent} from '@/src/backend/services/regionalContent';
import type {ReactNode} from 'react';
export type PakistanContext={area:PakistanArea;config:PakistanConfig;coverage:PakistanCoverage;locations:DonorLocation[];published:PakistanArea[];regional:Awaited<ReturnType<typeof getRegionalContent>>;city?:string;group?:string;organ?:string;mode:'blood'|'organ';legacy:boolean;ordinal?:number;introduction?:ReactNode;services?:ReactNode;articles:{slug:string|null;title:string}[]};
