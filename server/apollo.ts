const APOLLO_BASE = "https://api.apollo.io/api/v1";

function apolloHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": process.env.APOLLO_API_KEY || "",
  };
}

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string | null;
  email: string | null;
  phone_numbers: { raw_number: string }[];
  organization_name: string | null;
  organization: {
    name: string | null;
    website_url: string | null;
    primary_domain: string | null;
    phone: string | null;
  } | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
}

interface SearchResponse {
  people: ApolloPerson[];
  pagination: { total_entries: number; total_pages: number };
}

interface EnrichResponse {
  person: ApolloPerson | null;
  match_status?: string;
}

/**
 * Search Apollo for people matching a business type and location.
 * Returns up to `limit` results.
 */
export async function searchApolloLeads(
  businessType: string,
  location: string,
  limit = 10
): Promise<ApolloPerson[]> {
  const body: Record<string, unknown> = {
    page: 1,
    per_page: Math.min(limit, 25),
    person_locations: [location],
    q_organization_keyword_tags: [businessType],
  };

  const res = await fetch(`${APOLLO_BASE}/mixed_people/api_search`, {
    method: "POST",
    headers: apolloHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apollo search failed (${res.status}): ${text}`);
  }

  const data: SearchResponse = await res.json();
  return (data.people || []).slice(0, limit);
}

/**
 * Enrich a single person to get their verified email.
 * Returns the enriched person or the original if enrichment fails/has no email.
 */
export async function enrichApolloEmail(
  person: ApolloPerson
): Promise<ApolloPerson> {
  if (person.email) return person;

  try {
    const body: Record<string, unknown> = {
      first_name: person.first_name,
      last_name: person.last_name,
      reveal_personal_emails: false,
    };

    if (person.organization?.primary_domain) {
      body.domain = person.organization.primary_domain;
    } else if (person.organization_name) {
      body.organization_name = person.organization_name;
    }

    const res = await fetch(`${APOLLO_BASE}/people/match`, {
      method: "POST",
      headers: apolloHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) return person;

    const data: EnrichResponse = await res.json();
    if (data.person?.email) {
      return { ...person, ...data.person };
    }
  } catch (_) {}

  return person;
}

/**
 * Search and enrich up to `limit` leads. Enrichment is done in parallel.
 */
export async function getApolloLeads(
  businessType: string,
  location: string,
  limit = 10
): Promise<ApolloPerson[]> {
  const people = await searchApolloLeads(businessType, location, limit);
  if (people.length === 0) return [];

  const enriched = await Promise.all(people.map((p) => enrichApolloEmail(p)));
  return enriched;
}
