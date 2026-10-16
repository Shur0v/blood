import type { DonationGuide, DonationSource } from '@/src/lib/donationGuides';
import type { ResearchSnapshot } from '@/src/backend/services/donorResearch';
export type ResearchContext = {guide:DonationGuide;snapshot:ResearchSnapshot;evidence:{value:string;label:string;detail:string;source?:DonationSource};sources:DonationSource[]};
export type ResearchProps = {context:ResearchContext};
