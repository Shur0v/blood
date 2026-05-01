"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { BLOOD_GROUP_TO_SLUG, BLOOD_GROUPS } from "@/src/lib/seoRouting";

type Props = {
  forcedCountry?: string;
};

type CountryCities = Record<string, string[]>;

const COUNTRY_CITIES: CountryCities = {
  Bangladesh: ["Dhaka", "Chattogram", "Cumilla", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh", "Narayanganj"],
  India: ["Delhi", "Mumbai", "Chennai", "Kolkata", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"],
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala"],
  Nepal: ["Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Birgunj", "Dharan", "Janakpur", "Butwal", "Hetauda"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
};

const REGION_TO_COUNTRY: Record<string, string> = {
  bangladesh: "Bangladesh",
  india: "India",
  pakistan: "Pakistan",
  nepal: "Nepal",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const findCountryByCity = (city: string): string | null => {
  const target = city.trim().toLowerCase();
  for (const [country, cities] of Object.entries(COUNTRY_CITIES)) {
    if (cities.some((c) => c.toLowerCase() === target)) return country;
  }
  return null;
};

const toTitleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function LocalizedSeoFooter({ forcedCountry }: Props) {
  const pathname = usePathname();

  const context = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    let country: string | null = forcedCountry || null;
    let city: string | null = null;

    if (segments.length === 1 && REGION_TO_COUNTRY[segments[0]]) {
      country = REGION_TO_COUNTRY[segments[0]];
    }

    if (segments[0] === "blood-donors" || segments[0] === "organ-donors") {
      country = toTitleCase(segments[1] || "");
      city = toTitleCase(segments[2] || "");
    }

    if (segments[0] === "city" && segments[1]) {
      city = toTitleCase(segments[1]);
      country = country || findCountryByCity(city);
    }

    if (segments[0] === "blood" && segments.length >= 3) {
      city = toTitleCase(segments[2]);
      country = country || findCountryByCity(city);
    }

    if (segments[0] === "organ" && segments.length >= 3) {
      city = toTitleCase(segments[2]);
      country = country || findCountryByCity(city);
    }

    const isRegionalOrCity =
      Boolean(REGION_TO_COUNTRY[segments[0] || ""]) ||
      segments[0] === "blood-donors" ||
      segments[0] === "organ-donors" ||
      segments[0] === "city" ||
      (segments[0] === "blood" && segments.length >= 3) ||
      (segments[0] === "organ" && segments.length >= 3);

    return { country, city, isRegionalOrCity };
  }, [forcedCountry, pathname]);

  if (!context.isRegionalOrCity || !context.country) return null;

  const countryCities = COUNTRY_CITIES[context.country] || COUNTRY_CITIES.Bangladesh;
  const activeCity = context.city || countryCities[0];
  const nearbyCityLinks = countryCities.filter((city) => city.toLowerCase() !== activeCity.toLowerCase()).slice(0, 10);
  const countrySlug = slugify(context.country);
  const citySlug = slugify(activeCity);

  return (
    <section className="mx-auto mt-8 mb-10 max-w-7xl px-4">
      <div className="rounded-[8px] border border-border/20 bg-white/90 p-6 shadow-card">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-black text-gray-900">Nearby Cities in {context.country}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {nearbyCityLinks.map((city) => (
                <Link
                  key={`nearby-${city}`}
                  href={`/blood-donors/${countrySlug}/${slugify(city)}`}
                  className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
                >
                  Blood Donors in {city}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900">Emergency Blood Groups in {activeCity}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {BLOOD_GROUPS.map((group) => (
                <Link
                  key={`group-${group}`}
                  href={`/blood/${BLOOD_GROUP_TO_SLUG[group]}/${citySlug}`}
                  className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
                >
                  {group} in {activeCity}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
