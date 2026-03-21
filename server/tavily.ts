/**
 * Tavily AI Search — business research + email discovery
 * Env var: TAVILY_API_KEY  (from app.tavily.com)
 *
 * Used for:
 *  1. Finding real business emails when website scraping fails
 *  2. Researching the local market before AI email generation
 *     (gives the AI real context about the area + industry)
 */
import { tavily } from "@tavily/core";

let _client: ReturnType<typeof tavily> | null = null;
function getClient() {
  if (!_client && process.env.TAVILY_API_KEY) {
    _client = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }
  return _client;
}

const EMAIL_RE = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;
const SKIP_EMAIL = /noreply|no-reply|mailer|daemon|bounce|sentry|example\.|w3\.org|schema\.org|googleapis|cloudflare|privacy@|legal@|dmca@|abuse@|unsubscribe@/i;
const HOSTED = /wixsite|squarespace|weebly|godaddysites|business\.site|yelp\.com|yellowpages|facebook|instagram|twitter/i;

/**
 * Search Tavily for a real email address for a specific business.
 * Falls back gracefully if API key not set.
 */
export async function tavilyFindEmail(
  businessName: string,
  location: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const result = await client.search(`"${businessName}" ${location} contact email`, {
      searchDepth: "basic",
      maxResults: 5,
      includeAnswer: false,
    });

    // Scan all result snippets + content for email addresses
    const candidates: string[] = [];
    for (const r of result.results || []) {
      const text = `${r.title || ""} ${r.content || ""} ${r.url || ""}`;
      let m: RegExpExecArray | null;
      const re = new RegExp(EMAIL_RE.source, "g");
      while ((m = re.exec(text)) !== null) {
        const email = m[1].toLowerCase();
        const domain = email.split("@")[1] || "";
        if (!SKIP_EMAIL.test(email) && !HOSTED.test(domain)) {
          candidates.push(email);
        }
      }
    }

    if (candidates.length === 0) return null;

    // Prefer contact/info/hello@ prefixes
    const PREFERRED = /^(info|contact|hello|office|admin|mail|team|sales|support|booking|reception)@/i;
    return candidates.find(e => PREFERRED.test(e)) || candidates[0];
  } catch (err: any) {
    console.warn("[Tavily] Email search failed:", err.message);
    return null;
  }
}

/**
 * Research the local market for a business type + location.
 * Returns a compact string the AI can use as context when writing emails.
 * E.g. — "Denver has a competitive plumbing market with ~140 local firms.
 *  Many lack modern websites. Common pain points: seasonal demand spikes,
 *  difficulty standing out on Google Maps."
 */
export async function tavilyResearchMarket(
  businessType: string,
  location: string,
): Promise<string> {
  const client = getClient();
  if (!client) return "";

  try {
    const result = await client.search(
      `${businessType} businesses market overview challenges opportunities ${location}`,
      {
        searchDepth: "basic",
        maxResults: 3,
        includeAnswer: true,
      },
    );

    // Use Tavily's synthesised answer if available, otherwise concat snippets
    if (result.answer && result.answer.length > 40) {
      return result.answer.slice(0, 600);
    }

    const snippets = (result.results || [])
      .map(r => r.content?.slice(0, 200) || "")
      .filter(Boolean)
      .join(" ");

    return snippets.slice(0, 600);
  } catch (err: any) {
    console.warn("[Tavily] Market research failed:", err.message);
    return "";
  }
}

/**
 * Enrich a list of business names with extra context snippets from Tavily.
 * Used to give the AI real details (notable facts, reviews, news) about each business.
 */
export async function tavilyEnrichBusinesses(
  businesses: { name: string; location: string }[],
): Promise<Record<string, string>> {
  const client = getClient();
  if (!client || businesses.length === 0) return {};

  const results: Record<string, string> = {};

  // Run in parallel but cap at 5 concurrent searches to avoid rate limits
  const BATCH = 5;
  for (let i = 0; i < businesses.length; i += BATCH) {
    const batch = businesses.slice(i, i + BATCH);
    await Promise.all(batch.map(async ({ name, location }) => {
      try {
        const res = await client.search(`"${name}" ${location} reviews reputation`, {
          searchDepth: "basic",
          maxResults: 2,
          includeAnswer: false,
        });
        const snippet = (res.results || [])
          .map(r => r.content?.slice(0, 150) || "")
          .filter(Boolean)
          .join(" ")
          .slice(0, 300);
        if (snippet) results[name] = snippet;
      } catch { /* ignore per-business errors */ }
    }));
  }

  return results;
}
