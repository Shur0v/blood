import type {ManagedImage,PublicImagePlacement} from './publicImages';
export function imageSrcSet(image:ManagedImage){return image.variants.map(item=>`${item.url} ${item.width}w`).join(', ');}
export function imageObject(image:ManagedImage,placement:PublicImagePlacement){return {'@context':'https://schema.org','@type':'ImageObject',contentUrl:new URL(image.url,process.env.NEXT_PUBLIC_BASE_URL||'https://bloodnet.live').href,width:image.width,height:image.height,caption:placement.caption||undefined,creditText:image.metadata.credit||undefined,license:image.metadata.licenseUrl||undefined};}
