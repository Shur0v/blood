import type {UsaArea,UsaConfig} from '@/src/lib/usaEdition';
import type {UsaCoverage} from '@/src/backend/services/usaContent';
import type {DonorLocation} from '@/src/backend/services/donorLocations';
import type {PublicRegionalContent} from '@/src/lib/regionalContent';
import type {ManagedImage,PublicImagePlacement} from '@/src/lib/publicImages';
export type UsaContext={area?:UsaArea;place:string;config:UsaConfig;coverage:UsaCoverage;locations:DonorLocation[];publishedAreas:UsaArea[];regional:PublicRegionalContent|null;images?:Array<{image:ManagedImage;placement:PublicImagePlacement}>;preview?:boolean};
