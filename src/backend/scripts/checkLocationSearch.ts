import nextEnv from '@next/env';

async function main() {
  nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development');
  if (!process.env.GEOAPIFY_API_KEY)
    throw new Error(
      'Configure the server GEOAPIFY_API_KEY before checking live location coverage.',
    );
  const { searchLocations } = await import('../services/neighborhoods');
  const context = { country: 'Bangladesh', countryCode: 'bd', bias: { lat: 23.46, lng: 91.18 } };
  for (const query of ['Dhanmondi', 'Gabtoli', 'Badda', 'Rampura', 'Banasree']) {
    const result = await searchLocations(query, context);
    console.log(
      JSON.stringify(
        {
          query,
          count: result.data.length,
          limited: result.limited,
          unavailable: result.unavailable,
          places: result.data.map((place) => ({
            name: place.registrationArea?.name || place.city,
            city: place.city,
            district: place.district,
            country: place.country,
          })),
        },
        null,
        2,
      ),
    );
    if (result.unavailable || !result.data.length) process.exitCode = 1;
  }
}

main().catch(() => {
  console.error(
    'Live location coverage could not be verified. Check the configured Geoapify key, connectivity and provider quota.',
  );
  process.exitCode = 1;
});
