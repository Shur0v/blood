import type {ReactNode} from 'react';
import type {UsaContext} from './types';
export function UsaSection({id,context,title,kicker,children,layout='cards'}:{id:string;context:UsaContext;title:string;kicker:string;children:ReactNode;layout?:string}){
 const settings=context.config.sections?.[id];if(settings?.hidden)return null;
 return <section className={'us-section us-layout-'+layout+' us-variant-'+(settings?.variant||'default')} data-us-component={id} id={'us-'+id}><header className="us-section-head"><p className="us-kicker"><span aria-hidden="true">✦</span>{kicker}</p><h2>{settings?.title||title}</h2>{settings?.text&&<p>{settings.text}</p>}</header><div className="us-section-content">{children}</div></section>;
}
