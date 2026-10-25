import type {ManagedImage,PublicImagePlacement} from '@/src/lib/publicImages';
export interface HomepageSlide {
 image?:ManagedImage|null;
 public_image?:PublicImagePlacement|null;
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  order: number;
  status: string;
}

