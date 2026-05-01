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

const cleanKeyword = (keyword: string) =>
  keyword
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
  if (!m?.[1]) return null;
  return m[1];
};

const detectCategory = (keyword: string): KeywordCategory => {
  const k = keyword.toLowerCase();
  if (k.includes("blood bank")) return "blood_bank";
  if (k.includes("urgent blood") || k.includes("blood needed") || k.includes("emergency blood")) return "urgent_blood";
  if (k.includes("organ donor") || k.includes("kidney donor") || k.includes("liver donor") || k.includes("organ donation")) return "organ_finder";
  if (k.includes("who can donate blood") || k.includes("requirements") || k.includes("how to donate") || k.includes("donation process")) return "blood_education";
  if (k.includes("save lives") || k.includes("become a blood donor") || k.includes("join blood donor") || k.includes("life saver")) return "donation_motivation";
  if (k.includes(" in dhaka") || k.includes(" in delhi") || k.includes(" in mumbai") || k.includes(" in lahore") || k.includes(" in chennai")) return "city_blood";
  if (k.includes("how to find blood donor") || k.includes("where can i get blood") || k.includes("how to contact blood donors")) return "search_help";
  return "blood_finder";
};

const hashText = (input: string) => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
};

const buildParagraphBank = () => {
  const intents = [
    "find verified donors quickly",
    "match emergency requests with active donors",
    "reduce response delay for patient families",
    "improve donor discovery confidence",
    "connect hospitals and communities faster",
    "support urgent medical coordination",
    "improve search quality for life saving cases",
    "increase trust during emergency outreach",
    "provide clear donor visibility by location",
    "make urgent contact flow simple",
    "support cross border donor discovery in regional networks",
    "improve discoverability for city and blood group search pages",
    "help families identify legitimate support channels",
    "create fast pathways from query to donor response",
    "support better request handling during peak emergency hours",
  ];

  const methods = [
    "by showing recent donor activity and response signals",
    "through clear blood group and city focused filtering",
    "with practical contact steps and transparent availability details",
    "through structured pages that are easy to scan under pressure",
    "with safety first guidance aligned with medical workflows",
    "through direct routing to relevant donor profiles",
    "with search patterns designed for emergency behavior",
    "through visible demand context and local support indicators",
    "with reliable category sections for fast decision making",
    "through simple content architecture for urgent users",
    "through regional page consistency with local search relevance",
    "with clear narrative blocks that reduce decision fatigue",
    "through practical location aware signals for donor matching",
    "with verified profile visibility and structured query pathways",
  ];

  const outcomes = [
    "This helps families take the next step with less confusion.",
    "This supports faster triage and better communication.",
    "This improves coordination between donors and caregivers.",
    "This reduces friction in high stress moments.",
    "This encourages timely outreach and safer planning.",
    "This improves the probability of a successful match.",
    "This strengthens emergency readiness at community level.",
    "This gives users clearer options when every minute matters.",
    "This helps align donor action with hospital requirements.",
    "This improves confidence in urgent donor search.",
    "This helps reduce uncertainty in time critical coordination.",
    "This increases practical readiness for donor outreach.",
    "This improves continuity between digital search and hospital action.",
    "This supports better public trust in donor discovery pages.",
  ];

  const safeguards = [
    "Users should always confirm compatibility and hospital approval before finalizing any donation step.",
    "Every contact decision should remain under licensed medical supervision for patient safety.",
    "Platform discovery should be followed by direct clinical verification to avoid unsafe assumptions.",
    "Blood and organ support decisions must follow legal and ethical requirements in each country.",
  ];

  const paragraphs: string[] = [];
  for (const intent of intents) {
    for (const method of methods) {
      for (const outcome of outcomes) {
        paragraphs.push(`This page helps users ${intent} ${method}. ${outcome}`);
        if (paragraphs.length >= 540) break;
      }
      if (paragraphs.length >= 540) break;
    }
    if (paragraphs.length >= 540) break;
  }

  for (const safeguard of safeguards) {
    paragraphs.push(safeguard);
  }
  return paragraphs.map((p) => p.replace(/-/g, " "));
};

const PARAGRAPH_BANK = buildParagraphBank();

const pickParagraphs = (keyword: string, count: number, offsetSalt: number): string[] => {
  const seed = hashText(`${keyword}:${offsetSalt}`);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = (seed + i * 17) % PARAGRAPH_BANK.length;
    out.push(PARAGRAPH_BANK[idx]);
  }
  return out;
};

const buildTags = (keyword: string, category: KeywordCategory, city: string | null, group: string | null): string[] => {
  const tags = new Set<string>();
  tags.add(cleanKeyword(keyword).toLowerCase());
  tags.add("emergency donation support");

  const organCategories: KeywordCategory[] = ["organ_finder"];
  const bloodCategories: KeywordCategory[] = [
    "blood_finder",
    "urgent_blood",
    "city_blood",
    "blood_education",
    "donation_motivation",
    "blood_bank",
    "search_help",
  ];

  if (organCategories.includes(category)) {
    tags.add("organ donor registry");
    tags.add("organ donation support");
    tags.add("transplant donor search");
    tags.add("ethical organ coordination");
    tags.add("hospital transplant workflow");
  }

  if (bloodCategories.includes(category)) {
    tags.add("blood donor platform");
    tags.add("blood donor search");
    tags.add("urgent blood request");
    tags.add("blood donation network");
    tags.add("hospital transfusion support");
  }

  if (category === "blood_bank") {
    tags.add("hospital blood bank");
    tags.add("blood inventory access");
  }

  if (category === "blood_education") {
    tags.add("blood donation guide");
    tags.add("donor eligibility rules");
  }

  if (city) tags.add(`blood donor in ${city.toLowerCase()}`);
  if (group) tags.add(`${group.toLowerCase()} donor search`);
  return Array.from(tags).slice(0, 10);
};

const buildBlocks = (keyword: string, category: KeywordCategory, city: string | null, group: string | null): ContentBlock[] => {
  const safeKeyword = cleanKeyword(keyword);

  const contextLead = city
    ? `This section explains how ${safeKeyword} can be used for faster donor discovery in ${city}.`
    : `This section explains how ${safeKeyword} can be used for faster donor discovery.`;

  const groupLead = group
    ? `This section focuses on ${group} matching context to improve relevant donor outreach.`
    : `This section focuses on compatibility and practical response planning for urgent needs.`;

  const ethicsLead =
    category === "organ_finder"
      ? "This section emphasizes legal and ethical pathways for lawful organ donor support."
      : "This section emphasizes safety first donor coordination with hospital aligned decision making.";

  return [
    {
      title: "Instant Search Overview",
      paragraphs: [contextLead, ...pickParagraphs(keyword, 4, 1)],
    },
    {
      title: "Local Match Guidance",
      paragraphs: [groupLead, ...pickParagraphs(keyword, 4, 2)],
    },
    {
      title: "Safety And Trust Signals",
      paragraphs: [ethicsLead, ...pickParagraphs(keyword, 4, 3)],
    },
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

export const getKeywordParagraphBankSize = () => PARAGRAPH_BANK.length;
