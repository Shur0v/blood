import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  ArrowUpRight,
  Droplets,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  FileHeart,
  Search,
  Phone,
  Hospital,
  BookOpen,
  Fingerprint,
  ArrowRight,
} from 'lucide-react';
import Hero from '../Hero';
import DonorDiscoveryPanel from '../DonorDiscoveryPanel';
import MedicalAidFund from '../MedicalAidFund';
import RegionalSeoFooter from '../RegionalSeoFooter';
import {
  MedicalProfileDemo,
  RegionalDoctorServices,
} from '../PublicServiceContent';
import {
  RegionalAuthActions,
  RegionalGallery,
  RegionalRequestBuilder,
} from '../regional/RegionalInteractions';
import {
  getDonorLocations,
  donorLocationPath,
} from '@/src/backend/services/donorLocations';
import { getBloodCountryEntryCount } from '@/src/backend/services/donorCounts';
import { getRegionalContent } from '@/src/backend/services/regionalContent';
import { getPrisma } from '@/src/backend/config/db';
import {
  regionalCopy,
  formatRegionalText,
  resolveRegionalDesign,
  type RegionalCopyKey,
  type RegionalSectionKey,
} from '@/src/lib/regionalDesign';
import { bloodGroupToSlug } from '@/src/lib/seoRouting';

export default async function IndiaLanding() {
  const [locations, content, entries, articles] = await Promise.all([
    getDonorLocations(),
    getRegionalContent('India'),
    getBloodCountryEntryCount('India'),
    getPrisma().blog.findMany({
      where: {
        status: 'PUBLISHED',
        slug: { not: null },
        OR: [
          { title: { contains: 'blood donation', mode: 'insensitive' } },
          { title: { contains: 'donor', mode: 'insensitive' } },
        ],
      },
      select: { slug: true, title: true },
      orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
      take: 3,
    }),
  ]);
  const cities = locations
    .filter(
      (row) => row.country.toLowerCase() === 'india' && row.bloodCount > 0,
    )
    .sort((a, b) => a.city.localeCompare(b.city));
  const organCities = locations.filter(
    (row) => row.country.toLowerCase() === 'india' && row.organCount > 0,
  );
  const design = content?.design,
    { colors } = resolveRegionalDesign('India', design);
  const style = {
    '--india-paper': colors.paper,
    '--india-ink': colors.ink,
    '--india-accent': colors.accent,
    '--india-green': colors.indigo,
  } as CSSProperties;
  const text = (key: RegionalCopyKey, fallback: string) =>
    regionalCopy(design, key, { country: 'India' }, fallback);
  const visible = (key: RegionalSectionKey) =>
    !design?.hiddenSections?.includes(key);
  const groups = [...new Set(cities.flatMap((row) => row.bloodGroups))].filter(
    (group) => bloodGroupToSlug(group),
  );
  const faqs = design?.faqs?.length
    ? design.faqs.map((f) => ({
        question: formatRegionalText(f.question, { country: 'India' }),
        answer: formatRegionalText(f.answer, { country: 'India' }),
      }))
    : [
        {
          question: 'Does a donor listing guarantee availability?',
          answer:
            'No. Contact the donor and collecting hospital to confirm availability, medical requirements and arrangements before travel.',
        },
        {
          question: 'Why are some results outside my city?',
          answer:
            'Local matches lead the directory. Broader suggestions can appear when local matches are limited. Read the location on each card.',
        },
        {
          question: 'Are medical records shown on donor cards?',
          answer:
            'No. Private reports and prescriptions are separate from the public donor listing. Public contact visibility follows the existing publication controls.',
        },
        {
          question: 'How are the directory figures counted?',
          answer:
            'Entries can include registered accounts, manual listings and community organisations. A person may serve more than one city; city totals are not an unduplicated person count.',
        },
      ];
  return (
    <main
      className="india-page india-landing"
      data-india-edition="landing"
      data-region-layout={design?.layout}
      data-region-spacing={design?.spacing}
      style={style}
    >
      <section className="india-hero india-section" data-india-section="1">
        <div className="india-hero-copy">
          <p className="india-kicker">
            <span /> BloodNet · India edition
          </p>
          <h1>
            {text('introTitle', 'A little closer.')}
            <br />
            <em>
              {design?.copy?.introTitle
                ? 'For your community.'
                : 'A lot more connected.'}
            </em>
          </h1>
          <p>
            {text(
              'introText',
              'Find a local starting point for blood support. Connect with recorded donor entries, confirm the next step and keep your care records together.',
            )}
          </p>
          <div className="india-actions">
            <a className="india-button" href="#regional-donor-search">
              Find a donor <ArrowUpRight size={19} />
            </a>
            <RegionalAuthActions registrationOnly />
          </div>
          <ul className="india-trust">
            <li>
              <MapPin />
              Local first
            </li>
            <li>
              <ShieldCheck />
              Confirm directly
            </li>
            <li>
              <FileHeart />
              Private records
            </li>
          </ul>
        </div>
        <div
          className="india-connection"
          aria-label="Search, connect and coordinate"
        >
          <div className="india-orbit" aria-hidden="true">
            <Droplets />
            <span />
            <span />
          </div>
          <div className="india-note note-top">
            <Search />
            <strong>
              A search.
              <br />A starting point.
            </strong>
            <span>People, not blood inventory.</span>
          </div>
          <div className="india-note note-bottom">
            <HeartHandshake />
            <strong>
              Your city.
              <br />A shared purpose.
            </strong>
            <span>Confirm with your hospital.</span>
          </div>
          <span className="india-coordinate">
            INDIA / COMMUNITY CONNECTIONS
          </span>
        </div>
      </section>
      <div className="india-search-wrap" data-india-section="2">
        <Hero
          forcedCountry="India"
          headingLevel={2}
          presentation="regional"
          regionalSections
          contentOverride={{
            heading: text('searchTitle', 'Someone nearby. A next step.'),
            description: text(
              'searchText',
              'Search recorded donor entries by blood group, city or name. Local matches lead, with broader suggestions when needed. Confirm availability directly.',
            ),
          }}
        />
      </div>
      <DonorDiscoveryPanel forcedCountry="India" />
      <section className="india-section india-coverage" data-india-section="4">
        <div>
          <p className="india-kicker">The local picture</p>
          <h2>{content?.title || 'Real records. Clear context.'}</h2>
          <p>
            {content?.summary ||
              'Explore the places represented in the current India directory. A listing is a contact to check, not a promise of available blood or a completed donation.'}
          </p>
          <Link className="india-text-link" href="/statistics">
            Understand the network figures <ArrowUpRight />
          </Link>
        </div>
        <div className="india-metrics">
          <div>
            <strong>{entries.toLocaleString()}</strong>
            <span>country donor entries</span>
          </div>
          <div>
            <strong>{cities.length}</strong>
            <span>recorded blood-donor locations</span>
          </div>
          <div>
            <strong>{groups.length}</strong>
            <span>represented blood groups</span>
          </div>
        </div>
        <details className="india-count-note">
          <summary>What do these numbers mean?</summary>
          <p>
            Entries include registered accounts, manual listings and community
            organisations. Service-city participation may appear in several city
            counts. Do not add city totals to estimate unique people.
          </p>
        </details>
        {visible('gallery') && content?.slides.length ? (
          <div className="india-published-gallery">
            <RegionalGallery content={content} />
          </div>
        ) : null}
      </section>
      {visible('home5') && (
        <section className="india-section" data-india-section="5">
          <SectionHeading
            kicker="Three simple steps"
            title={text('home5Title', 'From searching to a clearer next step.')}
            description={text(
              'home5Text',
              'Start with the right location and blood group. Check the person’s availability and coordinate with your collecting hospital.',
            )}
          />
          <div className="india-step-grid">
            {[
              [
                Search,
                '01',
                'Find a local contact',
                'Choose your blood group and location. Read the details on each donor card.',
              ],
              [
                Phone,
                '02',
                'Confirm availability',
                'Contact the listed person. Confirm identity, timing and travel arrangements directly.',
              ],
              [
                Hospital,
                '03',
                'Coordinate with the hospital',
                'Follow the collecting team’s screening, matching and donation requirements.',
              ],
            ].map(([Icon, n, title, body]) => {
              const I = Icon as typeof Search;
              return (
                <article key={String(n)}>
                  <span className="india-step-no">{String(n)}</span>
                  <I />
                  <h3>{String(title)}</h3>
                  <p>{String(body)}</p>
                </article>
              );
            })}
          </div>
          <Link className="india-text-link" href="/how-it-works">
            {text('home5Button', 'How BloodNet works')} <ArrowUpRight />
          </Link>
        </section>
      )}
      <section className="india-section india-request" data-india-section="6">
        <div>
          <p className="india-kicker">Before you reach out</p>
          <h2>
            Make the request
            <br />
            <em>easier to understand.</em>
          </h2>
          <p>
            Have the collecting hospital, requested component, timing and
            coordinator ready. Confirm availability before travel.
          </p>
          <Link
            className="india-text-link"
            href="/guides/coordinate-an-urgent-blood-request"
          >
            Prepare an urgent blood request <ArrowUpRight />
          </Link>
        </div>
        <div className="india-request-list">
          <span>
            <Hospital /> Collecting hospital
          </span>
          <span>
            <Droplets /> Blood group and component
          </span>
          <span>
            <Phone /> Coordinator and timing
          </span>
          <RegionalRequestBuilder city="India" />
        </div>
      </section>
      <section className="india-section" data-india-section="7">
        <SectionHeading
          kicker="Start with the right group"
          title="Different groups. One shared purpose."
          description="Open an existing city and blood-group directory. Hospital screening and matching remain essential."
        />
        <div className="india-blood-grid">
          {groups.map((group) => {
            const row = cities.find((city) =>
              city.bloodGroups.includes(group),
            )!;
            return (
              <Link
                key={group}
                href={
                  donorLocationPath(row, 'blood') +
                  '/' +
                  bloodGroupToSlug(group)
                }
              >
                <Droplets />
                <strong>{group}</strong>
                <span>
                  {row.city} <ArrowUpRight />
                </span>
              </Link>
            );
          })}
        </div>
        {!groups.length && (
          <p>
            No blood-group city listings are currently recorded in India. Use
            the search to check broader directory suggestions.
          </p>
        )}
      </section>
      {visible('join') && (
        <section className="india-section india-join" data-india-section="8">
          <div>
            <p className="india-kicker">Be part of the local picture</p>
            <h2>
              {text('joinTitle', 'Your willingness. Someone’s starting point.')}
            </h2>
            <p>
              {text(
                'joinText',
                'Register with your own accurate details, keep availability current and manage the cities you serve. Contact and publication controls stay in your existing account workflow.',
              )}
            </p>
            <RegionalAuthActions
              registrationOnly
              registrationLabel={
                design?.copy?.joinButton ? text('joinButton', '') : undefined
              }
            />
          </div>
          <div className="india-membership">
            <Fingerprint aria-hidden="true" />
            <span>YOUR BLOODNET PROFILE</span>
            <strong>
              Accurate details.
              <br />
              Intentional sharing.
            </strong>
            <Link href="/?profile=1">
              Manage your profile <ArrowUpRight />
            </Link>
          </div>
        </section>
      )}
      <section className="india-section india-organ" data-india-section="9">
        <HeartHandshake className="india-feature-icon" />
        <div>
          <p className="india-kicker">An intention to help</p>
          <h2>
            Organ pledges,
            <br />
            with the right safeguards.
          </h2>
          <p>
            A pledge expresses willingness. Eligibility, consent and matching
            must be confirmed by licensed transplant professionals. Never buy or
            sell organs.
          </p>
          <div className="india-link-chips">
            {organCities.slice(0, 6).map((row) => (
              <Link key={row.city} href={donorLocationPath(row, 'organ')}>
                {row.city} <ArrowUpRight />
              </Link>
            ))}
          </div>
          <Link className="india-text-link" href="/organ-donation-ethics">
            Understand organ donation ethics <ArrowUpRight />
          </Link>
        </div>
      </section>
      <section className="india-section" data-india-section="10">
        <SectionHeading
          kicker="Your care, together"
          title="A private place for your medical history."
          description="Keep reports and prescriptions in your account. Private medical records are separate from the public donor directory."
        />
        <MedicalProfileDemo />
        <Link className="india-text-link" href="/medical-profile">
          Explore your free medical profile <ArrowUpRight />
        </Link>
      </section>
      {visible('guidance') && (
        <section
          className="india-section india-record-grid"
          data-india-section="11"
        >
          <div>
            <p className="india-kicker">Continuity beyond a contact</p>
            <h2>
              {text('guidanceTitle', 'Less searching for the right document.')}
            </h2>
            <p>
              {text(
                'guidanceText',
                'Upload existing reports and prescriptions, keep their original dates and find them again in your private timeline. Clinician-submitted prescriptions require an authorized, configured integration and patient consent.',
              )}
            </p>
            <Link className="india-text-link" href="/medical-reports">
              Medical reports <ArrowUpRight />
            </Link>
            <Link className="india-text-link" href="/prescriptions">
              Prescription delivery <ArrowUpRight />
            </Link>
          </div>
          <aside>
            <FileHeart />
            <h3>Keep the original date.</h3>
            <p>
              A readable file and clear title help you prepare for an
              appointment. Storage does not provide clinical interpretation or a
              diagnosis.
            </p>
            <ShieldCheck />
            <h3>Confirm the patient ID.</h3>
            <p>
              A name alone does not identify a prescription recipient. Confirm
              participation with your clinician.
            </p>
          </aside>
        </section>
      )}
      {(visible('home9') || visible('home12')) && (
        <section
          className="india-section india-services"
          data-india-section="12"
        >
          <SectionHeading
            kicker="Know what is available"
            title="Care connections, with clear expectations."
            description="Provider availability depends on location and configuration. BloodNet does not promise immediate doctor access."
          />
          <div className="india-two-grid">
            {visible('home9') && (
              <div>
                <RegionalDoctorServices country="India" mode="booking" />
                <Link className="india-text-link" href="/doctor-appointments">
                  {text('home9Button', 'Understand appointment options')}{' '}
                  <ArrowUpRight />
                </Link>
              </div>
            )}
            {visible('home12') && (
              <div>
                <RegionalDoctorServices country="India" mode="contact" />
                <Link className="india-text-link" href="/doctor-appointments">
                  {text('home12Button', 'Read service expectations')}{' '}
                  <ArrowUpRight />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
      <div data-india-section="13" className="india-support">
        <MedicalAidFund presentation="india" />
      </div>
      {(visible('faq') || visible('guidance')) && (
        <section
          className="india-section india-reading"
          data-india-section="14"
        >
          {visible('guidance') && (
            <>
              <SectionHeading
                kicker="A little clarity goes a long way"
                title="Useful reading. Practical answers."
              />
              <div className="india-reading-grid">
                <Link href="/guides/coordinate-an-urgent-blood-request">
                  <BookOpen />
                  <h3>Coordinate an urgent blood request</h3>
                  <span>
                    Practical guide <ArrowUpRight />
                  </span>
                </Link>
                <Link href="/guides/protect-medical-records">
                  <ShieldCheck />
                  <h3>Protect reports and prescriptions</h3>
                  <span>
                    Private records <ArrowUpRight />
                  </span>
                </Link>
                {articles.map((article) => (
                  <Link key={article.slug} href={'/blog/' + article.slug}>
                    <BookOpen />
                    <h3>{article.title}</h3>
                    <span>
                      BloodNet Journal <ArrowUpRight />
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
          {visible('faq') && (
            <div className="india-faq">
              <div>
                <p className="india-kicker">Before your next step</p>
                <h2>{text('faqTitle', 'Good questions. Clear answers.')}</h2>
                <p>
                  {text(
                    'faqText',
                    'A few things to know about using the directory.',
                  )}
                </p>
              </div>
              <div>
                {faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      <section className="india-section india-closing" data-india-section="15">
        <div className="india-closing-banner">
          <p className="india-kicker">India / Local connections</p>
          <h2>
            Start close.
            <br />
            <em>Stay connected.</em>
          </h2>
          <div className="india-actions">
            <a href="#regional-donor-search" className="india-button">
              Return to donor search <ArrowRight />
            </a>
            <RegionalAuthActions registrationOnly />
          </div>
        </div>
        {visible('locations') && (
          <>
            <SectionHeading
              kicker="Explore the directory"
              title={text('locationsTitle', 'Find your local starting point.')}
              description={text(
                'locationsText',
                'Browse recorded cities across India. Every city opens with its own local context.',
              )}
            />
            <div className="india-city-grid">
              {cities.map((row) => (
                <Link key={row.city} href={donorLocationPath(row, 'blood')}>
                  <MapPin />
                  <h3>{row.city}</h3>
                  <span>
                    {row.bloodCount.toLocaleString()} recorded entries
                  </span>
                  <ArrowUpRight />
                </Link>
              ))}
            </div>
          </>
        )}
        <RegionalSeoFooter country="India" />
      </section>
    </main>
  );
}
function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="india-section-heading">
      <div>
        <p className="india-kicker">{kicker}</p>
        <h2>{title}</h2>
      </div>
      {description && <p>{description}</p>}
    </header>
  );
}
