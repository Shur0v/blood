import {imageSrcSet,imageObject} from '@/src/lib/imagePresentation';
import {stringifyJsonLd} from '@/src/lib/aiSeo';
import type {UsaContext} from './types';
export default function UsaImages({context}:{context:UsaContext}){
 if(!context.images?.length)return null;
 return <div className="us-managed-images"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:stringifyJsonLd(context.images.filter(item=>!item.placement.decorative).map(({image,placement})=>imageObject(image,placement)))}}/>{context.images.map(({image,placement})=><figure key={image.id}><img src={image.url} srcSet={imageSrcSet(image)} sizes="(max-width: 700px) 100vw, 550px" alt={placement.decorative?'':placement.alt} width={image.width} height={image.height} loading="lazy"/>{placement.caption&&<figcaption>{placement.caption}{image.metadata.credit&&<> · {image.metadata.credit}</>}</figcaption>}</figure>)}</div>;
}
