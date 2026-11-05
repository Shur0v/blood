import type {IndiaArea,IndiaConfig} from '@/src/lib/indiaLocal';
import type {IndiaCoverage} from '@/src/backend/services/indiaLocalContent';
import type {DonorLocation} from '@/src/backend/services/donorLocations';
import type {getRegionalContent} from '@/src/backend/services/regionalContent';
import type {ReactNode} from 'react';
export type IndiaContext={area:IndiaArea;config:IndiaConfig;coverage:IndiaCoverage;locations:DonorLocation[];published:IndiaArea[];regional:Awaited<ReturnType<typeof getRegionalContent>>;city?:string;group?:string;organ?:string;mode:'blood'|'organ';legacy:boolean;ordinal?:number;introduction?:ReactNode;services?:ReactNode;articles:{slug:string|null;title:string}[]};
