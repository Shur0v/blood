// Preserve /pakistan's existing route rendering and metadata while adding nested editorial routes.
import RegionalLandingPage,{generateMetadata as regionMetadata} from '../[region]/page';
export const dynamic='force-dynamic';
export const generateMetadata=()=>regionMetadata({params:Promise.resolve({region:'pakistan'})});
export default function Page(){return <RegionalLandingPage params={Promise.resolve({region:'pakistan'})}/>;}
