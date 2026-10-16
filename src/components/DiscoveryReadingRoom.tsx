"use client";

import { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';

const guides = [
  ['find-blood-donors-near-you', 'Find blood donors nearby', 'Choose a city and blood group, then confirm the next step.', 'Finding donors'],
  ['coordinate-an-urgent-blood-request', 'Organise an urgent blood request', 'Keep the hospital details, contact person and request status together.', 'Coordination'],
  ['first-time-donor-planning', 'Prepare for your first donation conversation', 'Understand registration, appointments and the collection service’s assessment.', 'Volunteering'],
  ['understand-blood-group-search', 'Understand blood-group filters', 'Use directory filters without treating a listing as a clinical match.', 'Finding donors'],
  ['build-a-community-donor-network', 'Build a local volunteer network', 'Create a useful contact process and keep participation voluntary.', 'Volunteering'],
  ['keep-donor-availability-current', 'Keep your availability current', 'Help coordinators see when you are ready to discuss a request.', 'Volunteering'],
  ['understand-organ-donation-pledges', 'Understand organ donation pledges', 'Learn how a pledge differs from an authorised transplant arrangement.', 'Organ donation'],
  ['coordinate-with-a-transplant-centre', 'Coordinate with a transplant centre', 'Keep practical questions connected to the authorised care team.', 'Organ donation'],
  ['protect-medical-records', 'Protect reports and prescriptions', 'Share medical information through the appropriate private channel.', 'Privacy & data'],
  ['travel-and-donor-search', 'Find support away from home', 'Search the place where help is needed and confirm local arrangements.', 'Finding donors'],
  ['read-donor-data-responsibly', 'Understand the network numbers', 'Read listing totals with their definitions, source and update time.', 'Privacy & data'],
  ['donor-privacy-and-public-profiles', 'Understand public donor profiles', 'Learn what appears publicly and how to request a correction or removal.', 'Privacy & data'],
] as const;

export default function DiscoveryReadingRoom() {
  const [query, setQuery] = useState('');
  const results = guides.filter(guide => guide.join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="discovery-reading" aria-labelledby="discovery-reading-title">
    <p className="discovery-eyebrow">The BloodNet reading room</p>
    <h2 id="discovery-reading-title">A clearer next step.</h2>
    <p>Find local volunteers, understand the directory and plan a considerate conversation. These guides explain how to use BloodNet alongside your hospital or authorised donation service.</p>
    <label className="discovery-guide-search"><Search size={18} aria-hidden="true"/><span className="sr-only">Search donation guides</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search guides: blood group, privacy, organ donation…" aria-controls="discovery-guide-results"/></label>
    <p role="status" className="discovery-result-count">{results.length} {results.length === 1 ? 'guide' : 'guides'}{query ? ' found' : ' to explore'}</p>
    <ul id="discovery-guide-results" className="discovery-guide-grid">{results.map(([slug, title, description, category]) => <li key={slug}><a href={`/guides/${slug}`}><span className="discovery-eyebrow">{category}</span><h3>{title}<ArrowUpRight size={16} aria-hidden="true"/></h3><p>{description}</p></a></li>)}</ul>
    {!results.length && <p>Try “blood”, “privacy” or “organ”, or <a href="/guides">browse every guide</a>.</p>}
    <div className="discovery-help">
      <div><h3>Before contacting a donor</h3><ol><li>Get the hospital’s current request and collection location.</li><li>Choose the relevant city and blood-group filter.</li><li>Ask about availability and let the hospital confirm the arrangements.</li><li>Update the people you contacted when the request changes.</li></ol><a href="/guides/coordinate-an-urgent-blood-request">Read the coordination checklist <ArrowUpRight size={14}/></a></div>
      <div><h3>Questions about the directory</h3>
        <details><summary>Does an active listing mean someone can donate today?</summary><p>No. It describes a platform listing. Confirm current availability directly; the collecting service assesses eligibility and suitability.</p></details>
        <details><summary>What do the network totals count?</summary><p>Listings and coverage recorded on BloodNet, rather than available blood units or confirmed donations. <a href="/network">See the live definitions and coverage.</a></p></details>
        <details><summary>Where can I ask about a public profile?</summary><p>Use <a href="/contact">BloodNet contact</a> for corrections or removal requests. Keep reports, prescriptions and other private medical details out of public messages.</p></details>
      </div>
    </div>
    <p className="discovery-source-note">Guides include their sources and editorial information. <a href="/guides">Explore the guide library</a> · <a href="/safety-policy">Safety policy</a> · <a href="/privacy">Privacy policy</a></p>
  </section>;
}
