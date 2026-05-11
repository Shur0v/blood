type KeywordCategory =
  | "blood_finder"
  | "urgent_blood"
  | "city_blood"
  | "organ_finder"
  | "blood_education"
  | "donation_motivation"
  | "blood_bank"
  | "search_help";

type ContentBlock = {
  title: string;
  paragraphs: string[];
};

type KeywordPageContent = {
  category: KeywordCategory;
  tags: string[];
  blocks: ContentBlock[];
};

const cleanKeyword = (keyword: string) => keyword.replace(/-/g, " ").replace(/\s+/g, " ").trim();

const extractCity = (keyword: string): string | null => {
  const m = keyword.toLowerCase().match(/\b(?:in|near)\s+([a-z\s]+)$/);
  if (!m?.[1]) return null;
  return m[1]
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const extractGroup = (keyword: string): string | null => {
  const m = keyword.toUpperCase().match(/\b(AB\+|AB\-|A\+|A\-|B\+|B\-|O\+|O\-)\b/);
  return m?.[1] || null;
};

const detectCategory = (keyword: string): KeywordCategory => {
  const k = keyword.toLowerCase();
  if (k.includes("blood bank") || k.includes("community blood")) return "blood_bank";
  if (k.includes("urgent blood") || k.includes("blood needed") || k.includes("emergency blood")) return "urgent_blood";
  if (k.includes("organ donor") || k.includes("kidney donor") || k.includes("liver donor") || k.includes("organ donation")) return "organ_finder";
  if (k.includes("who can donate blood") || k.includes("requirements") || k.includes("how to donate") || k.includes("donation process")) return "blood_education";
  if (k.includes("save lives") || k.includes("become a blood donor") || k.includes("join blood donor") || k.includes("life saver")) return "donation_motivation";
  if (k.includes(" in ")) return "city_blood";
  if (k.includes("how to find blood donor") || k.includes("where can i get blood") || k.includes("how to contact blood donors")) return "search_help";
  return "blood_finder";
};

const addIf = (arr: string[], text: string, cond = true) => {
  if (cond) arr.push(text);
};

const buildTags = (keyword: string, category: KeywordCategory, city: string | null, group: string | null): string[] => {
  const tags = new Set<string>();
  tags.add(cleanKeyword(keyword).toLowerCase());
  tags.add("blood donor support");
  tags.add("community donor network");

  if (category === "organ_finder") {
    tags.add("organ donor registry");
    tags.add("ethical transplant support");
  } else {
    tags.add("urgent blood request");
    tags.add("city-wise donor list");
  }

  if (city) tags.add(`donors in ${city.toLowerCase()}`);
  if (group) tags.add(`${group.toLowerCase()} donor coverage`);

  return Array.from(tags).slice(0, 10);
};

const buildBlocks = (keyword: string, category: KeywordCategory, city: string | null, group: string | null): ContentBlock[] => {
  const intent = cleanKeyword(keyword);
  const local = city ? `${city}` : "your target region";
  const groupLabel = group || "required blood group";

  const overview: string[] = [];
  addIf(overview, `${intent} is usually searched when families need to move quickly but still want reliable information. This page is built to reduce confusion and show a practical path from search to verified outreach.`);
  addIf(overview, `In ${local}, requests often come with time pressure. A useful response is to shortlist nearby donors, confirm availability immediately, and keep hospital requirements in the loop before finalizing any donor contact.`);
  addIf(overview, `Our regional listings now include stronger community coverage across the United States, United Kingdom, Australia, Spain, Netherlands, Italy, Poland, and other connected locations. That wider network helps improve first-response options.`);
  if (group) {
    addIf(
      overview,
      `For ${group} cases, speed matters, but compatibility matters more. Start with exact blood-group filtering, then verify current readiness, location, and travel time before escalating the call.`,
    );
  }

  const process: string[] = [];
  addIf(process, `A practical workflow is: identify local matches, call primary contacts, confirm hospital instructions, and keep one backup donor line active in case availability changes.`);
  addIf(process, `Community organizations are especially useful when individual donor response is delayed. They can help route calls, validate urgency, and direct families to active support hubs.`);
  addIf(process, `If you are handling cross-city or cross-country requests, prioritize entries with clear location metadata and recent platform activity. That usually improves success rate compared with blind outreach.`);
  addIf(process, `Keep one written checklist during calls: patient location, required blood/organ context, hospital reference, callback number, and immediate decision deadline.`);

  const safety: string[] = [];
  addIf(safety, `Safety is non-negotiable. Platform listings should support discovery, but clinical decisions must remain with licensed medical teams and authorized facilities.`);
  addIf(safety, `Never finalize blood or organ coordination based only on online text. Always confirm identity, compatibility, and hospital acceptance before proceeding.`);
  addIf(safety, category === "organ_finder" ? `Organ donor coordination requires strict legal and ethical compliance in each country. Use only lawful channels with documented medical oversight.` : `For blood emergencies, verify transfusion instructions with the receiving clinical team to avoid preventable mismatch risk.`);
  addIf(safety, `If a number is unreachable, move quickly to secondary options instead of waiting too long on a single lead. Balanced urgency and verification usually produces better outcomes.`);

  const coverage: string[] = [];
  addIf(coverage, `Regional coverage pages are designed to look and read like practical field guidance instead of generic filler text. This improves usability for real users and better communicates page intent to search engines.`);
  addIf(coverage, `As community data grows, pages become more location-aware and more actionable. You should see stronger result quality in routes that map directly to country intent.`);
  addIf(coverage, `For recurring requests, maintain a small trusted list of community contacts per city. Reusing verified channels can reduce response time on future emergencies.`);

  const localSignals: string[] = [];
  addIf(localSignals, `Location intent for "${intent}" is usually strongest in the first hour of search activity. In ${local}, users tend to prefer pages that show city relevance, clear blood-group context, and immediate action paths.`);
  addIf(localSignals, `When no exact donor is available in ${local}, nearest-region support is often the practical fallback. That includes nearby city donors, manual donor records, and verified community organizations.`);
  addIf(localSignals, `For ${groupLabel} demand, response quality improves when listings include direct contact attempts, quick callback windows, and clear cross-city travel constraints.`);

  const emergencyReadiness: string[] = [];
  addIf(emergencyReadiness, `Emergency readiness starts before a crisis: keep donor preferences updated, confirm current phone reachability, and maintain a short internal contact queue by city and blood group.`);
  addIf(emergencyReadiness, `Hospitals and families usually need rapid clarity on timing. A good page should reduce friction: show usable donor options first, keep community fallback visible, and avoid noisy or duplicate entries.`);
  addIf(emergencyReadiness, `If a request escalates, document every outreach attempt with timestamp and result. This simple practice helps teams avoid repeat calls and switch faster to the next valid option.`);

  const trustAndQuality: string[] = [];
  addIf(trustAndQuality, `Search visibility improves when content is specific, useful, and region-aware. This page format is intentionally long-form so users can act quickly while search engines understand real intent depth.`);
  addIf(trustAndQuality, `BloodNet pages prioritize lawful medical coordination and privacy-safe contact flow. Public listings support discovery, while treatment and compatibility remain under licensed clinical supervision.`);
  addIf(trustAndQuality, category === "organ_finder"
    ? `Organ-intent pages require extra care in wording and compliance. Never use non-medical promises; use verified pathways and transparent process notes.`
    : `Blood-intent pages should balance urgency and verification. Fast response is useful only when paired with correct group matching and hospital confirmation.`);

  return [
    { title: "Regional Search Overview", paragraphs: overview },
    { title: "How To Use This Page Effectively", paragraphs: process },
    { title: "Safety, Verification, And Clinical Coordination", paragraphs: safety },
    { title: "Coverage Notes For Community Data", paragraphs: coverage },
    { title: "Location Signals And Matching Priority", paragraphs: localSignals },
    { title: "Emergency Response Readiness", paragraphs: emergencyReadiness },
    { title: "Trust, Quality, And Responsible Use", paragraphs: trustAndQuality },
  ];
};

export const getKeywordPageContent = (keyword: string): KeywordPageContent => {
  const category = detectCategory(keyword);
  const city = extractCity(keyword);
  const group = extractGroup(keyword);
  return {
    category,
    tags: buildTags(keyword, category, city, group),
    blocks: buildBlocks(keyword, category, city, group),
  };
};

export const getKeywordParagraphBankSize = () => 0;
