import {getManagedImage} from './publicImages';
import {validateImagePlacement} from './publicImages';
import {markHomepagePublication} from './homepageContent';
import {getPrisma} from '../config/db';
import {MedicalError} from '../utils/medicalPrivacy';
import {Prisma} from '@prisma/client';
import {PublicImagePlacementSchema,type ManagedImage,type PublicImagePlacement} from '@/src/lib/publicImages';
import { PrismaClient } from '@prisma/client';

export interface HomepageSlideDto {
 image?:ManagedImage|null;
 public_image?:PublicImagePlacement|null;
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

type SlideInput={title:string;description?:string;image_url:string;status:string;public_image?:PublicImagePlacement|null};
const signature=(value:unknown)=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
export async function saveHomepageSlide(input:SlideInput,id?:string){
 if(input.public_image)await validateImagePlacement(input.public_image);
 const url=input.public_image?(await getManagedImage(input.public_image.assetId))!.url:input.image_url;
 return getPrisma().$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended('homepage-slides',0))`;
  const previous=id?await tx.homepageSlider.findUnique({where:{id}}):null;if(id&&!previous)throw new MedicalError('Slide not found.',404);
  const legacyReplacement=input.public_image===undefined&&previous&&url!==previous.image_url;
  const data={title:input.title,description:input.description||null,image_url:url,status:input.status,...(input.public_image!==undefined?{public_image:input.public_image===null?Prisma.JsonNull:input.public_image}:legacyReplacement?{public_image:Prisma.JsonNull}:{})};
  const row=id?await tx.homepageSlider.update({where:{id},data}):await tx.homepageSlider.create({data:{...data,order:((await tx.homepageSlider.aggregate({_max:{order:true}}))._max.order||0)+1}});
  const changed=!previous||['title','description','image_url','status','public_image'].some(key=>signature(previous[key as keyof typeof previous])!==signature(row[key as keyof typeof row]));
  if(changed&&(previous?.status==='ACTIVE'||row.status==='ACTIVE'))await markHomepagePublication(tx);
  return row;
 });
}
export async function deleteHomepageSlide(id:string){return getPrisma().$transaction(async tx=>{await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended('homepage-slides',0))`;const previous=await tx.homepageSlider.findUnique({where:{id}});if(!previous)throw new MedicalError('Slide not found.',404);await tx.homepageSlider.delete({where:{id}});if(previous.status==='ACTIVE')await markHomepagePublication(tx);});}
export async function reorderHomepageSlides(ids:string[]){return getPrisma().$transaction(async tx=>{await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended('homepage-slides',0))`;const before=await tx.homepageSlider.findMany({where:{status:'ACTIVE'},orderBy:[{order:'asc'},{id:'asc'}],select:{id:true}});for(const [index,id] of ids.entries())await tx.homepageSlider.update({where:{id},data:{order:index+1}});const after=await tx.homepageSlider.findMany({where:{status:'ACTIVE'},orderBy:[{order:'asc'},{id:'asc'}],select:{id:true}});if(signature(before)!==signature(after))await markHomepagePublication(tx);});}

export const listHomepageSlides = async (
  prisma: PrismaClient,
  options?: { includeInactive?: boolean },
): Promise<HomepageSlideDto[]> => {
  await ensureHomepageSlidesSeeded(prisma);
  const includeInactive = options?.includeInactive ?? false;

  const rows=await prisma.homepageSlider.findMany({
    where: includeInactive ? undefined : { status: 'ACTIVE' },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });
  return Promise.all(rows.map(async row=>{const parsed=PublicImagePlacementSchema.safeParse(row.public_image);return {...row,description:row.description||'',public_image:parsed.success?parsed.data:null,image:parsed.success?await getManagedImage(parsed.data.assetId):null};}));
};

