import { PrismaClient } from '@prisma/client';

export interface HomepageSlideDto {
  id: string;
  title: string;
  description: string;
  image_url: string;
  order: number;
  status: string;
}

const DEFAULT_SLIDES: Array<{
  title: string;
  description: string;
  image_url: string;
  order: number;
  status: string;
}> = [
  {
    title: 'Saving Lives Together',
    description: 'Your donation can save up to three lives.',
    image_url: 'https://surgmedia.com/wp-content/uploads/2020/10/2171-blood-donation.jpg',
    order: 1,
    status: 'ACTIVE',
  },
  {
    title: 'Advanced Medical Care',
    description: 'State-of-the-art facilities for a safe experience.',
    image_url: 'https://ichef.bbci.co.uk/news/480/cpsprodpb/a97f/live/81fd48e0-fddb-11ef-ab73-2916b85f325b.jpg.webp',
    order: 2,
    status: 'ACTIVE',
  },
  {
    title: 'Community Support',
    description: 'A network of heroes ready to help.',
    image_url: 'https://www.manipalhospitals.com/uploads/blog/Blood_Donation.png',
    order: 3,
    status: 'ACTIVE',
  },
];

export const ensureHomepageSlidesSeeded = async (prisma: PrismaClient): Promise<void> => {
  const count = await prisma.homepageSlider.count();
  if (count > 0) return;

  await prisma.homepageSlider.createMany({
    data: DEFAULT_SLIDES,
  });
};

export const listHomepageSlides = async (
  prisma: PrismaClient,
  options?: { includeInactive?: boolean },
): Promise<HomepageSlideDto[]> => {
  await ensureHomepageSlidesSeeded(prisma);
  const includeInactive = options?.includeInactive ?? false;

  return prisma.homepageSlider.findMany({
    where: includeInactive ? undefined : { status: 'ACTIVE' },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });
};

