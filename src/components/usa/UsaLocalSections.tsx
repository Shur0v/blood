import Link from 'next/link';
import {USA_FAMILIES,USA_RESOURCES,type UsaLocalId} from '@/src/lib/usaEdition';
import {USA_CITY_REFERENCES} from '@/src/lib/usaGeography';
import {USA_LOCAL_COPY} from '@/src/lib/usaLocalContent';
import {bloodGroupToSlug} from '@/src/lib/seoRouting';
import {donorLocationPath} from '@/src/backend/services/donorLocations';
import {MedicalProfileDemo} from '../PublicServiceContent';
import UsaActions from './UsaActions';
import {UsaSection} from './UsaSection';
import type {UsaContext} from './types';

function LocalSection({id,context}:{id:UsaLocalId;context:UsaContext}){
 const [family,ids]=Object.entries(USA_FAMILIES).find(([,items])=>(items as readonly string[]).includes(id))!;
 const variant=(ids as readonly string[]).indexOf(id),copy=USA_LOCAL_COPY[id];
 const layouts=['editorial','tiles','timeline','notebook','accordion'];
 const related=context.publishedAreas.filter(area=>area.id!==context.area?.id).sort((a,b)=>Number(b.state===context.area?.state)-Number(a.state===context.area?.state));
 const resources=USA_RESOURCES.filter(resource=>!context.config.resources||context.config.resources.includes(resource.id));
 const localLocations=context.area?context.locations.filter(row=>context.area!.directoryCities.some(city=>city.toLowerCase()===row.city.toLowerCase())):context.locations;
 return <UsaSection id={id} context={context} title={copy.title} kicker={`${context.place} / ${family}`} layout={layouts[variant]}>
   <p className="us-local-lead">{copy.text}</p>
   {family==='orientation'&&<aside className="us-area-note"><span>{context.area?.kind==='state'?'State context':'City context'}</span><h3>{context.place}{context.area?.kind==='city'?', '+context.area.stateCode:''}</h3><p>{context.config.editorialNote||context.area?.context}</p>{context.area&&<a href={context.area.source} target="_blank" rel="noopener noreferrer">Official area website ↗</a>}{context.area&&<div className="us-link-row">{[...new Set(context.area.directoryCities.map(city=>USA_CITY_REFERENCES[city]?.geonameId).filter(Boolean))].map(id=><a key={id} href={'https://www.geonames.org/'+id+'/'} target="_blank" rel="noopener noreferrer">GeoNames location reference ↗</a>)}</div>}</aside>}
   {variant===0?<dl className="us-definition-list">{copy.items.map(([title,text])=><div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl>:
    variant===1?<div className="us-mini-grid">{copy.items.map(([title,text],i)=><article key={title}><span className="us-index">{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p></article>)}</div>:
    variant===2?<ol className="us-step-rail">{copy.items.map(([title,text],i)=><li key={title}><span>{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>:
    variant===3?<div className="us-checklist"><p className="us-kicker">A practical note to keep</p>{copy.items.map(([title,text])=><p key={title}><span aria-hidden="true">✓</span><strong>{title}</strong>{text}</p>)}</div>:
    <div className="us-answers">{copy.items.map(([title,text])=><details key={title}><summary>{title}</summary><p>{text}</p></details>)}</div>}
   {family==='motivation'&&<div className="us-local-action"><p>Joining is voluntary. Keep the information you share accurate.</p><UsaActions/></div>}
   {family==='discovery'&&<nav className="us-link-row" aria-label="Discovery guidance"><a href="#regional-donor-search">Try the local search ↑</a><Link href="/guides/understand-blood-group-search">Understand matching ↗</Link></nav>}
   {family==='preparation'&&<aside className="us-care-note"><strong>Hospital-led coordination</strong><p>For urgent medical needs, contact a hospital or emergency service. Do not wait for a directory reply.</p><Link href="/guides/coordinate-an-urgent-blood-request">Prepare a request ↗</Link></aside>}
   {family==='privacy'&&<nav className="us-link-row" aria-label="Privacy controls"><Link href="/?profile=1">Review your profile ↗</Link><Link href="/privacy-policy">Privacy policy ↗</Link></nav>}
   {family==='records'&&(id==='profile-preview'?<MedicalProfileDemo/>:<nav className="us-link-row" aria-label="Medical-profile tools"><Link href="/medical-profile">Free medical profiles ↗</Link><Link href={id==='prescription-context'?'/prescriptions':'/medical-reports'}>Read how it works ↗</Link></nav>)}
   {family==='community'&&<div className="us-community-invite"><span aria-hidden="true">✦</span><p>No affiliation with local schools, employers or organizations is implied. Share information and let people choose for themselves.</p><UsaActions label="Add your own details"/></div>}
   {family==='evidence'&&<ul className="us-resource-list">{resources.map(resource=><li key={resource.id}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.label} ↗</a><span>External guidance · reviewed 5 November 2026</span></li>)}</ul>}
   {family==='exploration'&&<div className="us-explore-grid">{id==='group-links'?localLocations.flatMap(row=>row.bloodGroups.filter(group=>bloodGroupToSlug(group)).slice(0,4).map(group=><Link key={row.city+group} href={donorLocationPath(row,'blood')+'/'+bloodGroupToSlug(group)}>{group} in {row.city} ↗</Link>)).slice(0,8):id==='reading-links'?<><Link href="/guides/coordinate-an-urgent-blood-request">Coordinate an urgent request ↗</Link><Link href="/guides/read-donor-data-responsibly">Read directory data responsibly ↗</Link><Link href="/guides/protect-medical-records">Protect medical records ↗</Link></>:related.slice(0,5).map(area=><Link key={area.id} href={area.path}>{area.name}, {area.stateCode} ↗</Link>)}{id==='group-links'&&!localLocations.some(row=>row.bloodGroups.length>0)&&<p>No group-specific local links are supported by the current records.</p>}<Link href="/us">Explore the USA edition ↗</Link></div>}
   {family==='action'&&<div className="us-action-band"><a href="#regional-donor-search">Explore current listings ↑</a><UsaActions/></div>}
 </UsaSection>;
}

// Each exported section owns a reviewed content concept and one of five family compositions.
export const AreaIntroduction=({context}:{context:UsaContext})=><LocalSection id="area-introduction" context={context}/>;
export const StateCity=({context}:{context:UsaContext})=><LocalSection id="state-city" context={context}/>;
export const LocationExplorer=({context}:{context:UsaContext})=><LocalSection id="location-explorer" context={context}/>;
export const CoverageContext=({context}:{context:UsaContext})=><LocalSection id="coverage-context" context={context}/>;
export const StartingPoint=({context}:{context:UsaContext})=><LocalSection id="starting-point" context={context}/>;
export const ParticipationGap=({context}:{context:UsaContext})=><LocalSection id="participation-gap" context={context}/>;
export const ContributionChecklist=({context}:{context:UsaContext})=><LocalSection id="contribution-checklist" context={context}/>;
export const AccountBenefits=({context}:{context:UsaContext})=><LocalSection id="account-benefits" context={context}/>;
export const RegistrationQuestions=({context}:{context:UsaContext})=><LocalSection id="registration-questions" context={context}/>;
export const FirstRegistration=({context}:{context:UsaContext})=><LocalSection id="first-registration" context={context}/>;
export const SearchWalkthrough=({context}:{context:UsaContext})=><LocalSection id="search-walkthrough" context={context}/>;
export const SourceComparison=({context}:{context:UsaContext})=><LocalSection id="source-comparison" context={context}/>;
export const BroaderFlow=({context}:{context:UsaContext})=><LocalSection id="broader-flow" context={context}/>;
export const GroupNavigation=({context}:{context:UsaContext})=><LocalSection id="group-navigation" context={context}/>;
export const ReadingResults=({context}:{context:UsaContext})=><LocalSection id="reading-results" context={context}/>;
export const HospitalChecklist=({context}:{context:UsaContext})=><LocalSection id="hospital-checklist" context={context}/>;
export const FirstCall=({context}:{context:UsaContext})=><LocalSection id="first-call" context={context}/>;
export const Scheduling=({context}:{context:UsaContext})=><LocalSection id="scheduling" context={context}/>;
export const Travel=({context}:{context:UsaContext})=><LocalSection id="travel" context={context}/>;
export const Confirmation=({context}:{context:UsaContext})=><LocalSection id="confirmation" context={context}/>;
export const PublicPrivate=({context}:{context:UsaContext})=><LocalSection id="public-private" context={context}/>;
export const ContactChoices=({context}:{context:UsaContext})=><LocalSection id="contact-choices" context={context}/>;
export const AvailabilityControl=({context}:{context:UsaContext})=><LocalSection id="availability-control" context={context}/>;
export const ServiceCities=({context}:{context:UsaContext})=><LocalSection id="service-cities" context={context}/>;
export const Consent=({context}:{context:UsaContext})=><LocalSection id="consent" context={context}/>;
export const ProfilePreview=({context}:{context:UsaContext})=><LocalSection id="profile-preview" context={context}/>;
export const ReportOrganization=({context}:{context:UsaContext})=><LocalSection id="report-organization" context={context}/>;
export const Timeline=({context}:{context:UsaContext})=><LocalSection id="timeline" context={context}/>;
export const PrescriptionContext=({context}:{context:UsaContext})=><LocalSection id="prescription-context" context={context}/>;
export const AppointmentPreparation=({context}:{context:UsaContext})=><LocalSection id="appointment-preparation" context={context}/>;
export const Individuals=({context}:{context:UsaContext})=><LocalSection id="individuals" context={context}/>;
export const Families=({context}:{context:UsaContext})=><LocalSection id="families" context={context}/>;
export const Students=({context}:{context:UsaContext})=><LocalSection id="students" context={context}/>;
export const Workplaces=({context}:{context:UsaContext})=><LocalSection id="workplaces" context={context}/>;
export const Organizers=({context}:{context:UsaContext})=><LocalSection id="organizers" context={context}/>;
export const OfficialResources=({context}:{context:UsaContext})=><LocalSection id="official-resources" context={context}/>;
export const SourceNotes=({context}:{context:UsaContext})=><LocalSection id="source-notes" context={context}/>;
export const CoverageDefinitions=({context}:{context:UsaContext})=><LocalSection id="coverage-definitions" context={context}/>;
export const ReviewedGuidance=({context}:{context:UsaContext})=><LocalSection id="reviewed-guidance" context={context}/>;
export const MythFact=({context}:{context:UsaContext})=><LocalSection id="myth-fact" context={context}/>;
export const NearbyCities=({context}:{context:UsaContext})=><LocalSection id="nearby-cities" context={context}/>;
export const StateConnections=({context}:{context:UsaContext})=><LocalSection id="state-connections" context={context}/>;
export const GroupLinks=({context}:{context:UsaContext})=><LocalSection id="group-links" context={context}/>;
export const ReadingLinks=({context}:{context:UsaContext})=><LocalSection id="reading-links" context={context}/>;
export const NextStep=({context}:{context:UsaContext})=><LocalSection id="next-step" context={context}/>;
export const LocalQuestions=({context}:{context:UsaContext})=><LocalSection id="local-questions" context={context}/>;
export const Concerns=({context}:{context:UsaContext})=><LocalSection id="concerns" context={context}/>;
export const SignupChecklist=({context}:{context:UsaContext})=><LocalSection id="signup-checklist" context={context}/>;
export const AccountMaintenance=({context}:{context:UsaContext})=><LocalSection id="account-maintenance" context={context}/>;
export const LocalClosing=({context}:{context:UsaContext})=><LocalSection id="local-closing" context={context}/>;
export const USA_LOCAL_COMPONENTS={
 'area-introduction':AreaIntroduction,'state-city':StateCity,'location-explorer':LocationExplorer,'coverage-context':CoverageContext,'starting-point':StartingPoint,
 'participation-gap':ParticipationGap,'contribution-checklist':ContributionChecklist,'account-benefits':AccountBenefits,'registration-questions':RegistrationQuestions,'first-registration':FirstRegistration,
 'search-walkthrough':SearchWalkthrough,'source-comparison':SourceComparison,'broader-flow':BroaderFlow,'group-navigation':GroupNavigation,'reading-results':ReadingResults,
 'hospital-checklist':HospitalChecklist,'first-call':FirstCall,scheduling:Scheduling,travel:Travel,confirmation:Confirmation,
 'public-private':PublicPrivate,'contact-choices':ContactChoices,'availability-control':AvailabilityControl,'service-cities':ServiceCities,consent:Consent,
 'profile-preview':ProfilePreview,'report-organization':ReportOrganization,timeline:Timeline,'prescription-context':PrescriptionContext,'appointment-preparation':AppointmentPreparation,
 individuals:Individuals,families:Families,students:Students,workplaces:Workplaces,organizers:Organizers,
 'official-resources':OfficialResources,'source-notes':SourceNotes,'coverage-definitions':CoverageDefinitions,'reviewed-guidance':ReviewedGuidance,'myth-fact':MythFact,
 'nearby-cities':NearbyCities,'state-connections':StateConnections,'group-links':GroupLinks,'reading-links':ReadingLinks,'next-step':NextStep,
 'local-questions':LocalQuestions,concerns:Concerns,'signup-checklist':SignupChecklist,'account-maintenance':AccountMaintenance,'local-closing':LocalClosing,
} satisfies Record<UsaLocalId,(props:{context:UsaContext})=>React.ReactNode>;
