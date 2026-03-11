const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  types: string[];
}

export async function searchPlaces(query: string): Promise<{ placeId: string; name: string }[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const url = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
  const res = await fetch(url);
  const data = (await res.json()) as any;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API: ${data.status} — ${data.error_message || ""}`);
  }
  return ((data.results as any[]) || []).slice(0, 10).map((p: any) => ({
    placeId: p.place_id as string,
    name: p.name as string,
  }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const fields = "name,formatted_phone_number,website,rating,user_ratings_total,types,formatted_address";
  const url = `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${encodeURIComponent(fields)}&key=${key}`;
  const res = await fetch(url);
  const data = (await res.json()) as any;
  const r = data.result || {};

  return {
    placeId,
    name: r.name || "",
    address: r.formatted_address || "",
    phone: r.formatted_phone_number || "",
    website: r.website || "",
    rating: r.rating || 0,
    reviewCount: r.user_ratings_total || 0,
    types: r.types || [],
  };
}

export function scorePlace(details: PlaceDetails, businessType: string) {
  const { rating, reviewCount, phone, website, types } = details;
  const hasPhone = !!phone;
  const hasWebsite = !!website;

  const btype = businessType.toLowerCase().replace(/s$/, "");
  const typeStr = types.join(" ").toLowerCase();
  const industryFit =
    typeStr.includes(btype) || typeStr.includes(businessType.toLowerCase()) ? 90 : 68;

  const businessSize =
    reviewCount >= 500 ? 95 :
    reviewCount >= 200 ? 85 :
    reviewCount >= 100 ? 72 :
    reviewCount >= 50  ? 58 :
    reviewCount >= 20  ? 44 :
    reviewCount >= 5   ? 32 : 20;

  const reachability = 20 + (hasPhone ? 40 : 0) + (hasWebsite ? 40 : 0);

  const opportunity =
    rating === 0               ? 75 :
    rating >= 3.7 && rating <= 4.4 ? 88 :
    rating > 4.4               ? 62 :
    rating >= 3.0              ? 52 : 35;

  const reviewHealth = rating === 0 ? 50 : Math.round((rating / 5) * 100);

  const score = Math.round(
    industryFit  * 0.25 +
    businessSize * 0.20 +
    reachability * 0.25 +
    opportunity  * 0.15 +
    reviewHealth * 0.15,
  );

  const scoreLabel =
    score >= 75 ? "Strong Lead" :
    score >= 55 ? "Good Lead" : "Weak Lead";

  return {
    score,
    scoreLabel,
    scoreBreakdown: { industryFit, businessSize, reachability, opportunity, reviewHealth },
  };
}
