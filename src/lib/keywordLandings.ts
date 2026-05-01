export type KeywordLanding = {
  slug: string;
  keyword: string;
};

const RAW_KEYWORDS = `
Find Blood Donor Near Me Instantly | Free Online Search
Urgent Blood Donor Needed Near Me Today | Quick Help
Find Blood Donors Online by City and Blood Group
Emergency Blood Donor Contact Near You Now
Blood Donor List Near Me with Phone Number
Search Blood Donor in Your City | Fast & Free
Find O Positive Blood Donor Near Me Urgently
Online Blood Donor Finder by Location and Group
Find Verified Blood Donors Near Me Instantly
Blood Donor Directory Near Me | Real-Time Data
Get Blood Donor Contact in Minutes Near You
Find Blood Donor in Dhaka, Delhi, Mumbai & More
Search Active Blood Donors Available Now
Free Blood Donor Search Platform Near Me
Find Blood Donor Anytime Anywhere Instantly
Urgent Blood Needed Near Me Right Now | Get Help Fast
Emergency Blood Request Online | Find Donor Now
Need Blood Donor Urgently Near Me Today
Urgent O Positive Blood Needed in Your City
Emergency Blood Help Near Me | Instant Support
Request Blood Online Quickly | Emergency Service
Urgent Blood Donor Contact Needed Immediately
Hospital Emergency Blood Request Near Me
Blood Needed Today Urgent Help Near Me
Request Blood Donor Online in Minutes
Urgent Blood Donation Help Near You Now
Find Emergency Blood Support in Your Area
Quick Blood Request System for Emergency Cases
Get Blood Donor Urgently by Location
Emergency Blood Finder Online Near Me
Blood Donor in Dhaka | Find Donors Near You
Blood Donor in Delhi | Instant Search Online
Blood Donor in Mumbai | Get Help Fast
Blood Donor in Lahore | Emergency Support
Blood Donor in Chennai | Find Donors Now
Blood Donor in Kolkata | Quick Search System
Blood Donor in Bangladesh | Free Platform
Blood Donor in India | Find by City & Group
Blood Donor in Nepal | Emergency Help Online
Blood Donor in Pakistan | Instant Donor List
Blood Donor in USA | Find Nearby Donors
Blood Donor in Europe | Search by Location
Find Organ Donor Near Me | Emergency Help
Kidney Donor Needed Urgently Near Me
Find Liver Donor Online by City
Organ Donor Registration Online Platform
Emergency Organ Donor Finder Near Me
Find Organ Donor Contact Quickly Online
Organ Donation Near Me | Find Help Fast
Register as Organ Donor Online Today
Find Verified Organ Donors by Location
Organ Donor List Near Me with Details
Emergency Kidney Donor Needed Now
Online Organ Donation Network Worldwide
Organ Transplant Donor Finder Online
Free Organ Donor Search Platform
Who Can Donate Blood | Full Eligibility Guide
Blood Donation Requirements Explained Simply
How to Donate Blood Step by Step Guide
Blood Donation Benefits You Should Know
Is Blood Donation Safe | Full Guide
Minimum Age for Blood Donation Explained
Blood Donation Process from Start to End
Can I Donate Blood | Check Eligibility Now
Blood Donation Rules and Safety Tips
Everything About Blood Donation Basics
How Often Can You Donate Blood Safely
Blood Types and Donation Compatibility Guide
What Happens During Blood Donation
Blood Donation Health Benefits Explained
Complete Guide to Blood Donation Process
Donate Blood Save Lives | Join Today
Become a Blood Donor and Help Others
Your Blood Can Save Lives | Donate Now
Join Blood Donor Community Today
Be a Hero Donate Blood Today
One Donation Can Save Multiple Lives
Help People in Need Donate Blood Now
Start Saving Lives Become a Donor
Emergency Blood Help Starts With You
Join Life Saving Blood Donor Network
Make a Difference Donate Blood Today
Become a Lifesaver in Your Community
Give Blood Give Hope Save Lives
Help Patients by Donating Blood Today
Join Global Blood Donation Movement
Blood Bank Near Me | Find Blood Fast
Online Blood Bank System for Emergency
Find Hospital Blood Bank Near You
Digital Blood Donation Platform Online
Community Blood Bank Near Me
Blood Storage and Donation Centers Near Me
Online Blood Bank Directory by City
Emergency Blood Bank Finder Online
Find Blood Bank Contact Near Me
Best Blood Bank Near Me with Details
Hospital Blood Supply Near Me
Blood Donation Centers Near You Today
Free Blood Bank Search Platform
Locate Blood Bank Instantly Near Me
Blood Bank System for Quick Access
How to Find Blood Donor Quickly Near Me
Where Can I Get Blood Urgently Today
Best Way to Find Blood Donor Online Fast
How to Contact Blood Donors Near Me
Emergency Blood Help Website Free
Find Blood Donor Without Registration
Quick Blood Donor Finder Online Free
How to Get Blood in Emergency Situations
Find Blood Donor by Mobile Number Near Me
Free Blood Donor Platform Worldwide
Instant Blood Donor Search by Location
How to Request Blood Online Quickly
Find Active Blood Donors Near Me Now
Emergency Blood Support System Online
Fastest Way to Find Blood Donor Today
blood donor near me
find blood donor online
urgent blood donor needed
emergency blood donor contact
blood donation near me today
find blood donors by city
blood donor list near me
online blood donor directory
instant blood donor search
free blood donor platform
urgent blood needed near me
emergency blood request online
need blood donor urgently
urgent o positive blood donor
urgent a positive blood needed
emergency blood help now
hospital blood urgent request
blood needed immediately city name
blood donor in dhaka
blood donor in chennai
blood donor in mumbai
blood donor in lahore
blood donor in delhi
blood donor in bangladesh
blood donor in india
blood donor in nepal
blood donor in pakistan
blood donor in usa
blood donor in europe
organ donor near me
find organ donor online
kidney donor needed urgently
liver donor near me
organ donation registration online
organ donor list by city
emergency organ donor request
organ transplant donor finder
who can donate blood
blood donation requirements
blood donation benefits
how to donate blood
blood donation process step by step
is blood donation safe
minimum age for blood donation
blood donation rules
donate blood save life
become a blood donor today
help save lives donate blood
join blood donor community
be a life saver donate blood
one donation can save lives
blood bank near me
hospital blood bank
community blood bank
online blood bank system
digital blood donor network
blood donation organization
alternative to red cross blood donation
blood donor platform online
best website to find blood donors
online blood donation system
world blood donor day campaign
blood donation camp near me
blood donation event today
free blood donation camp
blood donors of bangladesh
blood donors of india
blood donors of nepal
blood donors of pakistan
blood donors of usa
blood donors worldwide
how to find blood donor quickly
where can i get blood urgently
how to contact blood donors near me
best way to find blood donor online
emergency blood help website
free blood donor finder system
`;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const CITIES = ["Dhaka", "Delhi", "Mumbai", "Lahore", "Chennai", "Kolkata", "Kathmandu", "Karachi", "New York", "London"] as const;

const buildDynamicKeywords = (): string[] => {
  const out: string[] = [];
  for (const group of BLOOD_GROUPS) {
    for (const city of CITIES) {
      out.push(`${group.toLowerCase()} blood donor in ${city.toLowerCase()}`);
      out.push(`find ${group.toLowerCase()} donor near ${city.toLowerCase()}`);
    }
  }
  return out;
};

const buildKeywordLandings = (): KeywordLanding[] => {
  const lines = RAW_KEYWORDS.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const allKeywords = [...lines, ...buildDynamicKeywords()];
  const deduped = Array.from(new Set(allKeywords.map((line) => line.toLowerCase())));

  const seen = new Map<string, number>();
  return deduped.map((keyword) => {
    const base = slugify(keyword) || "keyword-page";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    return { slug, keyword };
  });
};

export const KEYWORD_LANDINGS: KeywordLanding[] = buildKeywordLandings();

export const getKeywordLandingBySlug = (slug: string): KeywordLanding | null =>
  KEYWORD_LANDINGS.find((entry) => entry.slug === slug) || null;
