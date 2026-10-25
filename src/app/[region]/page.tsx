import '@/src/app/regional.css';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RegionalCityExperience from '@/src/components/regional/RegionalCityExperience';
import RegionalSeoFooter from '@/src/components/RegionalSeoFooter';
import DonorLocationDirectory from '@/src/components/DonorLocationDirectory';
import {getDonorLocations} from '@/src/backend/services/donorLocations';
import { HomeExperience } from "@/src/components/HomeExperience";
import { getRegionBySlug } from "@/src/lib/regions";
import { stringifyJsonLd } from "@/src/lib/aiSeo";
import { getPublicBaseUrl } from "@/src/backend/config/env";

type Params = { region: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { region } = await params;
  const config = getRegionBySlug(region);
  if (!config) {
    return {};
  }

  const country = config.country;
  let cities:number|null=null;try{cities=(await getDonorLocations()).filter(row=>row.country.toLowerCase()===country.toLowerCase()).length;}catch{}
  const description=cities===null?'Explore BloodNet donor listings and local coordination in '+country+'. Check current directory coverage.':cities?'Browse BloodNet listings serving '+cities+' recorded cities in '+country+'. Find local blood donor entries and confirm availability with the collecting service.':'Explore BloodNet coverage in '+country+'. No participating city listings are currently recorded.';
  return {
    title: `${country} blood donor directory`,
    description,
    alternates: { canonical: `/${config.slug}` },
    openGraph: {
      title: `${country} Blood Donor List | BloodNet`,
      description,
      url: `${getPublicBaseUrl()}/${config.slug}`,
    },
  };
}

export default async function RegionalLandingPage({ params }: { params: Promise<Params> }) {
  const { region } = await params;
  const config = getRegionBySlug(region);
  if (!config) {
    notFound();
  }

  if(config.country==='Nepal')return <RegionalCityExperience country="Nepal" canonicalPath="/nepal" title="Nepal blood donor directory"/>;
  const baseUrl = getPublicBaseUrl().replace(/\/$/, "");
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${config.country} donor directory`,
    url: `${baseUrl}/${config.slug}`,
    about: [
      { "@type": "Thing", name: "Blood donation" },
      { "@type": "Thing", name: "Emergency blood donation" },
      { "@type": "Thing", name: "Organ donor registry" },
    ],
    inLanguage: "en",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd([
            collectionSchema,

          ]),
        }}
      />
      <HomeExperience forcedCountry={config.country} regionalFooter={<RegionalSeoFooter country={config.country}/>} locationDirectory={<DonorLocationDirectory country={config.country} limit={24}/>}/>
    </>
  );
}
