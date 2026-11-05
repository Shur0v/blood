import Link from 'next/link';
import {usaAreaQuestions} from '@/src/lib/usaSeo';
import type {UsaArea} from '@/src/lib/usaEdition';
export default function UsaLocalGuidance({area}:{area:UsaArea}){
 return <div className="us-local-guidance"><h3>Using the {area.name} blood donor directory</h3><div className="us-answers">{usaAreaQuestions(area).map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div><nav className="us-link-row" aria-label={`${area.name} donor information`}><a href="https://www.fda.gov/consumers/consumer-updates/have-you-given-blood-lately" target="_blank" rel="noopener noreferrer">FDA blood donation information ↗</a><Link href="/guides/coordinate-an-urgent-blood-request">Preparing a blood request ↗</Link><Link href="/medical-profile">Free private medical profiles ↗</Link></nav><p className="us-small">BloodNet directory guidance · checked 6 November 2026. General information; donation decisions remain with the collecting service.</p></div>;
}
