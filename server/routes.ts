import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { createHmac } from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { generateLeadsSchema, signupSchema, loginSchema } from "../shared/schema.js";
import { getAuthUrl, getLoginAuthUrl, getOAuthClient, getUserInfo, sendEmailViaGmail, fetchInboxMessages } from "./gmail.js";
import { searchPlaces, getPlaceDetails, scorePlace, scrapeEmailFromWebsite, findEmailViaWebSearch, PlaceDetails } from "./places.js";
import { tavilyResearchMarket, tavilyEnrichBusinesses } from "./tavily.js";
import { youResearchMarket, youEnrichBusinesses } from "./yousearch.js";
import { sendWelcomeEmail } from "./email.js";
import { stripe, createCheckoutSession, createPortalSession, constructWebhookEvent, PLANS } from "./billing.js";
import { storage } from "./storage.js";
import { z } from "zod";

// ── Gemini 2.5 Flash via OpenRouter (primary AI — MAIN_AI_OUTLEADR) ──────────
const CLAUDE_MODEL = "google/gemini-2.5-flash-preview";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function getOpenRouterClient() {
  return new OpenAI({
    apiKey: process.env.MAIN_AI_OUTLEADR || "",
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "https://outleadrr.vercel.app",
      "X-Title": "Outleadrr",
    },
  });
}

// ── OpenAI fallback ──────────────────────────────────────────────────────────
function getOpenAI() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
  const isOpenRouter = baseURL.includes("openrouter.ai");
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "placeholder",
    baseURL,
    defaultHeaders: isOpenRouter ? {
      "HTTP-Referer": process.env.APP_URL || "https://outleadrr.vercel.app",
      "X-Title": "Outleadrr",
    } : undefined,
  });
}

function getModel() { return process.env.OPENAI_MODEL || "gpt-4o"; }

// ── Universal AI caller: Claude Opus 4.6 first → OpenAI fallback ────────────
async function aiCall(params: Omit<Parameters<OpenAI["chat"]["completions"]["create"]>[0], "model">) {
  if (process.env.MAIN_AI_OUTLEADR) {
    try {
      return await getOpenRouterClient().chat.completions.create({ ...params, model: CLAUDE_MODEL } as any);
    } catch (err: any) {
      console.warn("[AI] Claude Opus failed, falling back to OpenAI:", err.message);
    }
  }
  return getOpenAI().chat.completions.create({ ...params, model: getModel() } as any);
}

/* ── JWT Auth — serverless-safe cookie fallback (Vercel cold-start fix) ─── */
const JWT_COOKIE = "outleadrr_tk";
function jwtSign(userId: number): string {
  const secret = process.env.SESSION_SECRET || "ai-sales-agent-secret-key";
  const h = Buffer.from('{"alg":"HS256"}').toString("base64url");
  const p = Buffer.from(JSON.stringify({ uid: userId, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const sig = createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${sig}`;
}
function jwtVerify(token: string | null): number | null {
  if (!token) return null;
  try {
    const secret = process.env.SESSION_SECRET || "ai-sales-agent-secret-key";
    const [h, p, sig] = token.split(".");
    if (!h || !p || !sig) return null;
    const expected = createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(p, "base64url").toString());
    if (Math.floor(Date.now() / 1000) - (data.iat || 0) > 7 * 24 * 3600) return null;
    return typeof data.uid === "number" ? data.uid : null;
  } catch { return null; }
}
function jwtFromReq(req: Request): string | null {
  const h = req.headers.cookie || "";
  const m = h.match(new RegExp(`(?:^|;\\s*)${JWT_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function appendCookie(res: Response, cookie: string) {
  const existing = res.getHeader("Set-Cookie");
  if (Array.isArray(existing)) res.setHeader("Set-Cookie", [...existing, cookie]);
  else if (typeof existing === "string") res.setHeader("Set-Cookie", [existing, cookie]);
  else res.setHeader("Set-Cookie", cookie);
}
function setJwtCookie(res: Response, userId: number) {
  const prod = process.env.NODE_ENV === "production";
  const token = encodeURIComponent(jwtSign(userId));
  appendCookie(res, `${JWT_COOKIE}=${token}; Max-Age=${7 * 24 * 3600}; Path=/; HttpOnly; ${prod ? "Secure; SameSite=None" : "SameSite=Lax"}`);
}
function clearJwtCookie(res: Response) {
  const prod = process.env.NODE_ENV === "production";
  appendCookie(res, `${JWT_COOKIE}=; Max-Age=0; Path=/; HttpOnly; ${prod ? "Secure; SameSite=None" : "SameSite=Lax"}`);
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    gmailAccessToken?: string;
    gmailRefreshToken?: string;
    gmailEmail?: string;
    gmailName?: string;
  }
}

const MemStore = MemoryStore(session);
const PgSession = connectPgSimple(session);

function buildSessionStore() {
  // In production (Vercel) sessions MUST be stored in Postgres.
  // MemoryStore resets between serverless invocations, causing 401 on every request after login.
  if (process.env.DATABASE_URL) {
    return new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // auto-creates "session" table
      tableName: "session",
    });
  }
  // Local dev fallback (no DB)
  return new MemStore({ checkPeriod: 86400000 });
}

/* ─── auth middleware ─────────────────────────────────────────────── */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) return next();
  const uid = jwtVerify(jwtFromReq(req));
  if (uid) { req.session.userId = uid; return next(); }
  return res.status(401).json({ error: "Not authenticated" });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "ai-sales-agent-secret-key",
      resave: false,
      saveUninitialized: false,
      store: buildSessionStore(),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  /* ─── User auth ─────────────────────────────────────────────────── */

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { email, password } = parsed.data;
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser(email, passwordHash);
      req.session.userId = user.id;
      setJwtCookie(res, user.id);
      // Fire welcome email — non-blocking, don't fail signup if Resend is not configured
      sendWelcomeEmail(user.email).catch(() => {});
      return res.status(201).json({ id: user.id, email: user.email });
    } catch (e: any) {
      console.error("Signup error:", e);
      return res.status(500).json({ error: e.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid email or password" });
      }
      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      req.session.userId = user.id;
      setJwtCookie(res, user.id);
      return res.json({ id: user.id, email: user.email });
    } catch (e: any) {
      console.error("Login error:", e);
      return res.status(500).json({ error: e.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {});
    clearJwtCookie(res);
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        const uid = jwtVerify(jwtFromReq(req));
        if (uid) req.session.userId = uid;
      }
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      return res.json({ id: user.id, email: user.email });
    } catch (e: any) {
      console.error("Auth/me error:", e);
      return res.status(500).json({ error: e.message || "Auth check failed" });
    }
  });

  /* ─── Google OAuth ─────────────────────────────────────────────── */

  app.get("/api/auth/google", (_req: Request, res: Response) => {
    try { res.redirect(getAuthUrl()); }
    catch (e) { console.error("getAuthUrl error:", e); res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/auth/google-login", (_req: Request, res: Response) => {
    try { res.redirect(getLoginAuthUrl()); }
    catch (e) { console.error("getLoginAuthUrl error:", e); res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    if (!code || typeof code !== "string") {
      const dest = state === "login" ? "/login" : "/app";
      return res.redirect(`${dest}?error=oauth_failed`);
    }
    try {
      const oauth2Client = getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);
      const accessToken = tokens.access_token!;
      const refreshToken = tokens.refresh_token || "";
      const userInfo = await getUserInfo(accessToken, refreshToken);

      if (state === "login") {
        /* ── Google sign-in / sign-up ─────────────────────────── */
        if (!userInfo.id || !userInfo.email) {
          return res.redirect("/login?error=oauth_failed");
        }
        let user = await storage.getUserByGoogleId(userInfo.id);
        if (!user) {
          user = await storage.createGoogleUser(userInfo.email, userInfo.id);
        }
        req.session.userId = user.id;
        setJwtCookie(res, user.id);
        // Explicitly save session before redirect — critical in serverless
        // (Lambda terminates after res is sent, async auto-save never completes)
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        });
        return res.redirect("/app");
      } else {
        /* ── Gmail connect ────────────────────────────────────── */
        req.session.gmailAccessToken = accessToken;
        req.session.gmailRefreshToken = refreshToken;
        req.session.gmailEmail = userInfo.email || "";
        req.session.gmailName = userInfo.name || "";
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        });
        return res.redirect("/app?connected=true");
      }
    } catch (err: any) {
      console.error("OAuth callback error:", err);
      const dest = state === "login" ? "/login" : "/app";
      // Include error detail in URL so it's visible for debugging
      const detail = encodeURIComponent((err?.message || String(err)).slice(0, 200));
      return res.redirect(`${dest}?error=${detail}`);
    }
  });

  app.get("/api/auth/status", (req: Request, res: Response) => {
    if (req.session.gmailAccessToken) {
      res.json({ connected: true, email: req.session.gmailEmail, name: req.session.gmailName });
    } else {
      res.json({ connected: false });
    }
  });

  app.post("/api/auth/disconnect", (req: Request, res: Response) => {
    req.session.gmailAccessToken = undefined;
    req.session.gmailRefreshToken = undefined;
    req.session.gmailEmail = undefined;
    req.session.gmailName = undefined;
    res.json({ success: true });
  });

  /* ─── Generate Leads (protected) ──────────────────────────────── */

  app.post("/api/generate-leads", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = generateLeadsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      }

      const { businessType, location, intent, leadCount = 10, tone = "professional" } = parsed.data;

      /* ── 1. Require SerpAPI key ──────────────────────────────────── */
      if (!process.env.SERPAPI_KEY) {
        return res.status(503).json({
          error: "SERPAPI_KEY not configured",
          message: "Add SERPAPI_KEY to your Vercel environment variables to enable lead generation. Get a free key at serpapi.com.",
        });
      }

      /* ── 2. Search Google Places ─────────────────────────────────── */
      // Helper: merge extra candidates deduplicating by name
      function mergeUnique(
        existing: { placeId: string; name: string }[],
        extra: { placeId: string; name: string }[]
      ) {
        const seen = new Set(existing.map(r => r.name.toLowerCase()));
        for (const r of extra) {
          if (!seen.has(r.name.toLowerCase())) {
            existing.push(r);
            seen.add(r.name.toLowerCase());
          }
        }
      }

      // Helper: scrape email — You.com primary, Tavily fallback, info@ last
      async function getEmail(p: PlaceDetails): Promise<string | null> {
        if (p.listedEmail?.includes("@")) return p.listedEmail.toLowerCase();
        try {
          // scrapeEmailFromWebsite already calls You.com then Tavily internally
          if (p.website) {
            const scraped = await scrapeEmailFromWebsite(p.website, p.name, location);
            if (scraped) return scraped;
          }
          // No website at all — go straight to You.com search, then Tavily
          const { youFindEmail: youFind } = await import("./yousearch.js");
          const youEmail = await youFind(p.name, location);
          if (youEmail) return youEmail;
          const { tavilyFindEmail: tavilyFind } = await import("./tavily.js");
          return await tavilyFind(p.name, location);
        } catch { return null; }
      }

      // State → nearest major city (used when local area yields no emails)
      const STATE_MAJOR: Record<string, string> = {
        TX:"Houston TX", CA:"Los Angeles CA", FL:"Miami FL", NY:"New York NY",
        IL:"Chicago IL", PA:"Philadelphia PA", OH:"Columbus OH", GA:"Atlanta GA",
        NC:"Charlotte NC", MI:"Detroit MI", NJ:"Newark NJ", VA:"Richmond VA",
        WA:"Seattle WA", AZ:"Phoenix AZ", MA:"Boston MA", TN:"Nashville TN",
        IN:"Indianapolis IN", MO:"Kansas City MO", MD:"Baltimore MD", WI:"Milwaukee WI",
        CO:"Denver CO", MN:"Minneapolis MN", SC:"Columbia SC", AL:"Birmingham AL",
        LA:"New Orleans LA", KY:"Louisville KY", OR:"Portland OR", OK:"Oklahoma City OK",
        NV:"Las Vegas NV", UT:"Salt Lake City UT", NM:"Albuquerque NM", KS:"Wichita KS",
        AR:"Little Rock AR", MS:"Jackson MS", IA:"Des Moines IA", NE:"Omaha NE",
        WV:"Charleston WV", ID:"Boise ID", MT:"Billings MT", ND:"Fargo ND",
        SD:"Sioux Falls SD", WY:"Cheyenne WY", AK:"Anchorage AK", HI:"Honolulu HI",
        ME:"Portland ME", VT:"Burlington VT", NH:"Manchester NH", RI:"Providence RI",
        CT:"Hartford CT", DE:"Wilmington DE", DC:"Washington DC",
      };
      const stateMatch = location.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/i);
      const stateAbbr = stateMatch?.[1]?.toUpperCase();
      const majorCityFallback = stateAbbr ? STATE_MAJOR[stateAbbr] : null;

      let allCandidates: { placeId: string; name: string }[] = [];
      try { allCandidates = await searchPlaces(`${businessType} in ${location}`); } catch { /* continue */ }

      // Expand with nearby phrasing if candidate pool is thin
      if (allCandidates.length < leadCount * 2) {
        for (const q of [`${businessType} near ${location}`, `${businessType} in ${location} area`]) {
          if (allCandidates.length >= leadCount * 3) break;
          try { mergeUnique(allCandidates, await searchPlaces(q)); } catch { /* ignore */ }
        }
      }

      if (allCandidates.length === 0) {
        return res.status(404).json({
          error: "No businesses found",
          message: `No ${businessType} businesses found in or near ${location}. Try a different city or business type.`,
        });
      }

      /* ── 3. Detect pitch category ────────────────────────────────── */
      const intentLower = (intent || "").toLowerCase();
      const pitchingWebsite = /website|web design|web dev|landing page|redesign|online presence/i.test(intentLower);

      const HOSTED_SITE_PAT = /wixsite\.com|squarespace\.com|weebly\.com|godaddysites\.com|business\.site|myshopify\.com/i;
      function websiteQuality(p: PlaceDetails): 0 | 1 | 2 {
        if (!p.website) return 0;
        if (HOSTED_SITE_PAT.test(p.website)) return 1;
        return 2;
      }

      /* ── 4. Fetch details + scrape emails (primary area) ──────────── */
      const toFetch = allCandidates.slice(0, Math.min(allCandidates.length, leadCount * 5));
      const allDetails = await Promise.all(toFetch.map(p => getPlaceDetails(p.placeId).catch(() => null)));
      const placeDetails = allDetails.filter((p): p is PlaceDetails => !!p);

      const primaryEmails = await Promise.all(placeDetails.map(getEmail));

      let withEmails: { place: PlaceDetails; email: string; expandedFrom?: string }[] = placeDetails
        .map((p, i) => ({ place: p, email: primaryEmails[i] }))
        .filter((x): x is { place: PlaceDetails; email: string } => !!x.email && x.email.includes("@"));

      /* ── 5. Not enough emails? Expand to state's major city ───────── */
      if (withEmails.length < leadCount && majorCityFallback) {
        const locLower = location.toLowerCase();
        const majorCityName = majorCityFallback.split(" ")[0].toLowerCase();
        const alreadyInMajorCity = locLower.includes(majorCityName);

        if (!alreadyInMajorCity) {
          try {
            const fallbackCandidates = await searchPlaces(`${businessType} in ${majorCityFallback}`);
            // Deduplicate against what we already have
            const seenNames = new Set([
              ...allCandidates.map(r => r.name.toLowerCase()),
              ...withEmails.map(w => w.place.name.toLowerCase()),
            ]);
            const newOnes = fallbackCandidates
              .filter(r => !seenNames.has(r.name.toLowerCase()))
              .slice(0, (leadCount - withEmails.length) * 5);

            if (newOnes.length > 0) {
              const extraDetails = await Promise.all(newOnes.map(p => getPlaceDetails(p.placeId).catch(() => null)));
              const extraPlaces = extraDetails.filter((p): p is PlaceDetails => !!p);
              const extraEmails = await Promise.all(extraPlaces.map(getEmail));

              for (let i = 0; i < extraPlaces.length; i++) {
                const email = extraEmails[i];
                if (email?.includes("@")) withEmails.push({ place: extraPlaces[i], email, expandedFrom: majorCityFallback! });
              }
            }
          } catch { /* ignore fallback errors */ }
        }
      }

      /* ── 5b. Still short? Loop through state's major cities until quota met ── */
      if (withEmails.length < leadCount && stateAbbr) {
        const MULTI_CITY: Record<string, string[]> = {
          TX:["Houston TX","Dallas TX","San Antonio TX","Austin TX","Fort Worth TX","El Paso TX","Arlington TX","Lubbock TX"],
          CA:["Los Angeles CA","San Diego CA","San Jose CA","San Francisco CA","Fresno CA","Sacramento CA","Long Beach CA","Oakland CA"],
          FL:["Miami FL","Orlando FL","Tampa FL","Jacksonville FL","Fort Lauderdale FL","Tallahassee FL","Saint Petersburg FL"],
          NY:["New York NY","Buffalo NY","Rochester NY","Albany NY","Syracuse NY","Yonkers NY","New Rochelle NY"],
          IL:["Chicago IL","Aurora IL","Naperville IL","Rockford IL","Springfield IL","Joliet IL","Peoria IL"],
          PA:["Philadelphia PA","Pittsburgh PA","Allentown PA","Erie PA","Reading PA","Scranton PA","Bethlehem PA"],
          OH:["Columbus OH","Cleveland OH","Cincinnati OH","Toledo OH","Akron OH","Dayton OH","Youngstown OH"],
          GA:["Atlanta GA","Augusta GA","Columbus GA","Macon GA","Savannah GA","Athens GA"],
          NC:["Charlotte NC","Raleigh NC","Greensboro NC","Durham NC","Winston-Salem NC","Fayetteville NC","Cary NC"],
          MI:["Detroit MI","Grand Rapids MI","Warren MI","Ann Arbor MI","Lansing MI","Sterling Heights MI","Flint MI"],
          WA:["Seattle WA","Spokane WA","Tacoma WA","Bellevue WA","Kent WA","Everett WA"],
          AZ:["Phoenix AZ","Tucson AZ","Mesa AZ","Scottsdale AZ","Tempe AZ","Chandler AZ","Gilbert AZ"],
          MA:["Boston MA","Worcester MA","Springfield MA","Cambridge MA","Lowell MA","New Bedford MA"],
          TN:["Nashville TN","Memphis TN","Knoxville TN","Chattanooga TN","Clarksville TN","Murfreesboro TN"],
          CO:["Denver CO","Colorado Springs CO","Aurora CO","Fort Collins CO","Lakewood CO","Pueblo CO"],
          MN:["Minneapolis MN","Saint Paul MN","Rochester MN","Duluth MN","Bloomington MN"],
          OR:["Portland OR","Salem OR","Eugene OR","Bend OR","Gresham OR"],
          NV:["Las Vegas NV","Henderson NV","Reno NV","North Las Vegas NV","Sparks NV"],
          VA:["Richmond VA","Virginia Beach VA","Norfolk VA","Arlington VA","Alexandria VA","Chesapeake VA"],
          MO:["Kansas City MO","Saint Louis MO","Springfield MO","Columbia MO","Independence MO"],
          WI:["Milwaukee WI","Madison WI","Green Bay WI","Kenosha WI","Racine WI"],
          IN:["Indianapolis IN","Fort Wayne IN","Evansville IN","South Bend IN","Carmel IN"],
          MD:["Baltimore MD","Silver Spring MD","Rockville MD","Gaithersburg MD","Bowie MD"],
          SC:["Columbia SC","Charleston SC","Greenville SC","Rock Hill SC","Spartanburg SC"],
          AL:["Birmingham AL","Montgomery AL","Huntsville AL","Mobile AL","Tuscaloosa AL"],
          LA:["New Orleans LA","Baton Rouge LA","Shreveport LA","Metairie LA","Lafayette LA"],
          KY:["Louisville KY","Lexington KY","Bowling Green KY","Owensboro KY","Covington KY"],
          OK:["Oklahoma City OK","Tulsa OK","Norman OK","Broken Arrow OK","Lawton OK"],
          UT:["Salt Lake City UT","West Valley City UT","Provo UT","West Jordan UT","Orem UT"],
          NM:["Albuquerque NM","Las Cruces NM","Santa Fe NM","Rio Rancho NM"],
          KS:["Wichita KS","Overland Park KS","Kansas City KS","Topeka KS","Olathe KS"],
          NE:["Omaha NE","Lincoln NE","Bellevue NE","Grand Island NE"],
          MS:["Jackson MS","Gulfport MS","Biloxi MS","Hattiesburg MS"],
          AR:["Little Rock AR","Fort Smith AR","Fayetteville AR","Springdale AR"],
          IA:["Des Moines IA","Cedar Rapids IA","Davenport IA","Sioux City IA"],
          NJ:["Newark NJ","Jersey City NJ","Paterson NJ","Elizabeth NJ","Trenton NJ","Camden NJ"],
          CT:["Hartford CT","Bridgeport CT","New Haven CT","Stamford CT"],
          WV:["Charleston WV","Huntington WV","Morgantown WV"],
          ID:["Boise ID","Nampa ID","Meridian ID","Pocatello ID"],
          MT:["Billings MT","Missoula MT","Great Falls MT","Bozeman MT"],
          ND:["Fargo ND","Bismarck ND","Grand Forks ND"],
          SD:["Sioux Falls SD","Rapid City SD","Aberdeen SD"],
          WY:["Cheyenne WY","Casper WY","Laramie WY"],
          DE:["Wilmington DE","Dover DE","Newark DE"],
          ME:["Portland ME","Lewiston ME","Bangor ME"],
          NH:["Manchester NH","Nashua NH","Concord NH"],
          RI:["Providence RI","Cranston RI","Warwick RI"],
          VT:["Burlington VT","Rutland VT"],
          AK:["Anchorage AK","Fairbanks AK"],
          HI:["Honolulu HI","Hilo HI"],
          DC:["Washington DC"],
        };

        const alreadyTriedCity = majorCityFallback ? majorCityFallback.split(" ")[0].toLowerCase() : null;
        const locLower = location.toLowerCase();
        const citiesToTry = (MULTI_CITY[stateAbbr] || []).filter(c => {
          const cn = c.split(" ")[0].toLowerCase();
          return !locLower.includes(cn) && cn !== alreadyTriedCity;
        });

        const seenNamesGlobal = new Set([
          ...allCandidates.map(r => r.name.toLowerCase()),
          ...withEmails.map(w => w.place.name.toLowerCase()),
        ]);

        for (const city of citiesToTry) {
          if (withEmails.length >= leadCount) break;
          try {
            const fbCandidates = await searchPlaces(`${businessType} in ${city}`);
            const newOnes = fbCandidates
              .filter(r => !seenNamesGlobal.has(r.name.toLowerCase()))
              .slice(0, (leadCount - withEmails.length) * 4);
            if (newOnes.length === 0) continue;

            const extraDetails = await Promise.all(newOnes.map(p => getPlaceDetails(p.placeId).catch(() => null)));
            const extraPlaces = extraDetails.filter((p): p is PlaceDetails => !!p);
            const extraEmails = await Promise.all(extraPlaces.map(getEmail));

            for (let i = 0; i < extraPlaces.length; i++) {
              if (withEmails.length >= leadCount) break;
              const email = extraEmails[i];
              if (email?.includes("@")) {
                withEmails.push({ place: extraPlaces[i], email, expandedFrom: city });
                seenNamesGlobal.add(extraPlaces[i].name.toLowerCase());
              }
            }
          } catch { /* ignore, try next city */ }
        }
      }

      /* ── 6. Still short? Web-search for individual business emails ─── */
      // This handles suburbs where SerpAPI shows Yelp/Facebook as website.
      // We do a Google search for "{business name} {city} email" and extract
      // real emails from result snippets. Runs in parallel, max leadCount searches.
      if (withEmails.length < leadCount) {
        const serpKey = process.env.SERPAPI_KEY!;
        const alreadyHave = new Set(withEmails.map(w => w.place.placeId));
        const needed = leadCount - withEmails.length;

        // Candidates: primary area businesses that don't have an email yet
        const noEmailPool = placeDetails
          .filter(p => !alreadyHave.has(p.placeId))
          .slice(0, needed * 3); // 3× so we have backups for misses

        const webEmails = await Promise.all(
          noEmailPool.map(p => findEmailViaWebSearch(p.name, location, serpKey))
        );

        for (let i = 0; i < noEmailPool.length; i++) {
          if (withEmails.length >= leadCount) break;
          const email = webEmails[i];
          if (email?.includes("@")) withEmails.push({ place: noEmailPool[i], email });
        }
      }

      /* ── 7. Still nothing? 404 with helpful message ───────────────── */
      if (withEmails.length === 0) {
        return res.status(404).json({
          error: "No contactable businesses found",
          message: `Couldn't find email addresses for any ${businessType} businesses in or near ${location}. Try a nearby larger city.`,
        });
      }

      /* ── 7. Sort by pitch relevance ─────────────────────────────── */
      // For website pitch: businesses with no/basic sites first (they need websites most)
      // For all pitches: lower review count = less established = more open to new services
      const sortedWithEmails = pitchingWebsite
        ? [...withEmails].sort((a, b) => {
            const qDiff = websiteQuality(a.place) - websiteQuality(b.place);
            if (qDiff !== 0) return qDiff;
            return a.place.reviewCount - b.place.reviewCount;
          })
        : [...withEmails].sort((a, b) => {
            // For general pitches: moderate-review businesses are best prospects
            const aScore = (a.place.reviewCount >= 10 && a.place.reviewCount <= 200) ? 0 : 1;
            const bScore = (b.place.reviewCount >= 10 && b.place.reviewCount <= 200) ? 0 : 1;
            return aScore - bScore;
          });

      /* ── 8. Take exactly leadCount (or fewer if that's all we have) ── */
      const finalCandidates = sortedWithEmails.slice(0, leadCount);
      const sortedDetails = finalCandidates.map(c => c.place);
      const confirmedEmails = finalCandidates.map(c => c.email!);

      /* ── 9. You.com (primary) + Tavily (fallback): market research + enrichment ── */
      const bizLocList = sortedDetails.map(p => ({ name: p.name, location: p.address || location }));

      const [youMarket, youEnrich] = await Promise.all([
        youResearchMarket(businessType, location),
        youEnrichBusinesses(bizLocList),
      ]);

      // Tavily fills in what You.com missed
      const [tavilyMarket, tavilyEnrich] = await Promise.all([
        youMarket ? Promise.resolve("") : tavilyResearchMarket(businessType, location),
        tavilyEnrichBusinesses(bizLocList.filter(b => !youEnrich[b.name])),
      ]);

      const marketContext  = youMarket || tavilyMarket;
      const businessEnrichment = { ...tavilyEnrich, ...youEnrich }; // You.com wins on conflict

      /* ── 10. Build context list for AI ──────────────────────────── */
      const businessList = sortedDetails.map((p, i) => {
        const domainMatch = p.website?.match(/(?:https?:\/\/)?(?:www\.)?([^\/?\s]+)/);
        const domain = domainMatch?.[1] || "";
        const wq = websiteQuality(p);
        const webNote = pitchingWebsite
          ? wq === 0 ? " [no website — prime candidate for website creation]"
          : wq === 1 ? " [basic template site — strong candidate for professional website]"
          : ""
          : (p.reviewCount < 10 ? " [minimal online presence]" : "");
        const enrichNote = businessEnrichment[p.name] ? `\n   Context: ${businessEnrichment[p.name]}` : "";
        return [
          `${i + 1}. Business: "${p.name}"${webNote}`,
          `   Location: ${p.address || location}`,
          `   Phone: ${p.phone || "not listed"}`,
          `   Website: ${domain || "none"}`,
          `   Google rating: ${p.rating > 0 ? `${p.rating}/5 (${p.reviewCount} reviews)` : "not yet rated — new or under-the-radar business"}`,
          enrichNote,
        ].filter(Boolean).join("\n");
      }).join("\n\n");

      /* ── 10. Generate cold emails via Gemini (OpenAI fallback) ──── */
      const toneGuide: Record<string, { style: string; voice: string; cta: string; closing: string }> = {
        professional:  { style: "Polished, confident, results-oriented. No contractions unless it sounds natural. Precise word choice.", voice: "Senior account executive who has done their homework on this specific business.", cta: "Worth a 15-minute call this week?", closing: "Kind regards," },
        friendly:      { style: "Warm, conversational, genuine. Contractions throughout. Reads like an email from someone you already like.", voice: "Peer reaching out peer-to-peer, not salesperson to prospect.", cta: "Happy to share more — just reply and I'll send details.", closing: "Cheers," },
        direct:        { style: "Short sentences only. No filler words. One idea per sentence. Zero pleasantries.", voice: "Person who values time above everything and writes accordingly.", cta: "Open to a quick chat?", closing: "Best," },
        humorous:      { style: "One sharp, clever observation — then real value. Never try-hard. Wit earns trust; jokes don't close deals.", voice: "Smart person with a dry sense of humour who still has something real to offer.", cta: "Can I send you a 2-minute example?", closing: "Cheers," },
        persuasive:    { style: "Opens with a mild tension or overlooked opportunity. Builds urgency without pressure. Strong proof point.", voice: "Consultant who spotted something the business owner hasn't noticed yet.", cta: "Reply and I'll show you exactly how it works.", closing: "Best," },
        casual:        { style: "Breezy and short. Writes like a smart friend texting, not a vendor pitching. Informal but credible.", voice: "Someone the reader would actually want to grab coffee with.", cta: "Worth a quick chat?", closing: "Cheers," },
        consultative:  { style: "Lead with a specific insight before any offer. Position as advisor, not vendor. Ask one thoughtful question.", voice: "Industry expert who noticed something specific about this business and wants to share it.", cta: "Open to a 10-minute conversation about it?", closing: "Kind regards," },
        bold:          { style: "Opens with a strong, slightly provocative statement backed by a specific claim. Confident, never arrogant.", voice: "Someone who has achieved measurable results and isn't afraid to say so.", cta: "Happy to share how — reply and I'll send details.", closing: "Best," },
      };
      const toneConfig = toneGuide[tone as string] || toneGuide.professional;

      /* ── 11. AI email generation (emails already confirmed above) ── */
      const completion = await aiCall({
        messages: [
          {
            role: "system",
            content: `You are a top-performing cold email copywriter. Every email you write sounds like a real human spent 20 minutes researching that specific business — because each one is crafted specifically for them.
${marketContext ? `\n## LOCAL MARKET INTELLIGENCE (use to add credibility and local relevance)\n${marketContext}\n` : ""}

## CORE RULES
1. Each email MUST reference the specific business by name, location, or real data (rating/reviews).
2. Every email in the batch must have a DIFFERENT opening structure. No two can start the same way.
3. Vary email LENGTH across the batch: some are tight 3-sentence punchy emails, some are 5-sentence with more context. Never the same length twice in a row.

## PERSONA
${toneConfig.voice}

## TONE
${toneConfig.style}

## NEVER USE THESE OPENERS
"I hope this finds you", "I hope you're doing well", "I wanted to reach out", "My name is X and I", "I came across your business", "Are you struggling with", "We help companies like yours", "I'd love to connect", "I noticed your business online"

## BANNED WORDS (AI-detector words — never write these)
synergy, leverage, unlock, revolutionize, game-changer, cutting-edge, seamlessly, transform, streamline, elevate, empower, scalable, robust, innovative, pain points, deep dive, circle back, move the needle, best-in-class, world-class, tailored, comprehensive, actionable, impactful, holistic, robust, solutions

## SUBJECT LINE RULES (pick a different structure for each email)
- 4–7 words max, no trailing punctuation
- Structures to rotate: city + industry ("Austin plumbers doing this wrong"), business name specific ("re: [Name]'s Google reviews"), question-free observation, number hook ("3 dental clinics in Dallas that...")
- Never: "Quick question", "Partnership opportunity", "Growing your business"

## EMAIL BODY STRUCTURE — pick ONE variant per email (rotate variants across batch):
VARIANT A (INSIGHT-FIRST): Open with a sharp local observation → specific value claim with a real number → soft CTA
VARIANT B (RESULT-FIRST): Lead with a specific result you got for a similar business → explain why it applies to them → CTA
VARIANT C (HOOK-QUESTION): Single sharp observation about their niche → what you do and one real proof stat → CTA
VARIANT D (SHORT-PUNCH): 3 sentences total. No fluff. Specific hook, specific offer, specific CTA. Under 60 words.

## CTA FOR THIS BATCH
"${toneConfig.cta}"

## CLOSING
"${toneConfig.closing}"
Signature: {{YourName}}

## JSON OUTPUT ONLY — no markdown, no explanation
{"contacts":[{"contactName":"string","title":"string","email":"","emailSubject":"string","emailBody":"string"}]}

Rules:
- email: always ""
- contactName: real-sounding name for the region
- emailBody: includes salutation (Hi [Name],), body, blank line, closing, {{YourName}}`,
          },
          {
            role: "user",
            content: `Write ${sortedDetails.length} cold emails for ${businessType} businesses in ${location}.

OFFER BEING PITCHED: ${intent ? `"${intent}"` : `A relevant service for ${businessType} owners — infer something specific from context`}

IMPORTANT: If the offer mentions a demo, call, or trial — make sure the CTA references that specific action. Make the emails feel like they were written by someone who genuinely understands this business type. For businesses marked [no website] or [basic template site], reference their lack of a proper web presence naturally in the email.

BUSINESSES (write one email per business, vary structure for each):
${businessList}

Return exactly ${sortedDetails.length} JSON contact objects. Each email body must use a DIFFERENT variant structure. No two emails can open the same way.`,
          },
        ],
        max_tokens: 4096,
      });

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) return res.status(500).json({ error: "No response from AI" });

      const aiContent = rawContent
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      let aiData: any;
      try {
        aiData = JSON.parse(aiContent);
      } catch {
        const match = aiContent.match(/\{[\s\S]*\}/);
        if (!match) return res.status(500).json({ error: "AI returned invalid JSON" });
        aiData = JSON.parse(match[0]);
      }
      const contacts: any[] = aiData.contacts || [];

      /* ── 12. Merge — every lead already has a confirmed email ───────── */
      // No filtering needed here; confirmedEmails[idx] is guaranteed valid
      const finalLeads = sortedDetails.map((place, idx) => {
        const contact = contacts[idx] || {};
        const scoring = scorePlace(place, businessType);
        return {
          id: idx + 1,
          companyName:  place.name,
          address:      place.address,
          phone:        place.phone,
          website:      place.website,
          rating:       place.rating > 0 ? place.rating : undefined,
          reviewCount:  place.reviewCount > 0 ? place.reviewCount : undefined,
          contactName:  contact.contactName  || "",
          title:        contact.title        || "",
          email:        confirmedEmails[idx],
          emailVerified: true,
          emailSubject: contact.emailSubject || "",
          emailBody:    contact.emailBody    || "",
          industry:     businessType,
          status:       "new" as const,
          expandedFrom: finalCandidates[idx].expandedFrom,
          ...scoring,
        };
      });

      const expandedCount = finalLeads.filter(l => l.expandedFrom).length;
      const warning = expandedCount > 0
        ? `Only ${finalLeads.length - expandedCount} ${businessType} lead${finalLeads.length - expandedCount !== 1 ? "s" : ""} found in ${location}. ${expandedCount} additional lead${expandedCount !== 1 ? "s" : ""} came from ${majorCityFallback || "a nearby area"} to reach your requested count.`
        : undefined;

      return res.json({ leads: finalLeads, businessType, location, warning });
    } catch (error: any) {
      console.error("Error generating leads:", error);
      return res.status(500).json({ error: "Failed to generate leads", message: error.message });
    }
  });

  /* ─── Send All Emails via Gmail (protected) ─────────────────────── */

  const sendEmailsSchema = z.object({
    leads: z.array(
      z.object({
        email: z.string(),
        emailSubject: z.string(),
        emailBody: z.string(),
        companyName: z.string(),
        contactName: z.string(),
      })
    ),
    campaignName: z.string().optional(),
    businessType: z.string().optional(),
    location: z.string().optional(),
  });

  app.post("/api/send-emails", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.gmailAccessToken) {
      return res.status(401).json({ error: "Not authenticated with Gmail" });
    }

    const parsed = sendEmailsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { leads, campaignName, businessType, location } = parsed.data;
    const from = req.session.gmailEmail!;
    const accessToken = req.session.gmailAccessToken!;
    const refreshToken = req.session.gmailRefreshToken || "";

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const lead of leads) {
      // Skip leads with no valid email address
      if (!lead.email || !lead.email.includes("@")) {
        results.push({ email: lead.email || "", success: false, error: "No email address found for this lead" });
        continue;
      }
      try {
        await sendEmailViaGmail(accessToken, refreshToken, from, lead.email, lead.emailSubject, lead.emailBody);
        results.push({ email: lead.email, success: true });
        await new Promise((r) => setTimeout(r, 300));
      } catch (err: any) {
        console.error(`Failed to send to ${lead.email}:`, err.message);
        results.push({ email: lead.email, success: false, error: err.message });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Persist campaign record
    try {
      await storage.createCampaign({
        userId: req.session.userId!,
        name: campaignName || `${businessType || "Campaign"} — ${location || ""}`.trim(),
        businessType: businessType || "",
        location: location || "",
        totalLeads: leads.length,
        sent,
        failed,
      });
    } catch (e) {
      console.error("Failed to save campaign:", e);
    }

    return res.json({ results, sent, failed, total: leads.length });
  });

  /* ─── Campaigns (protected) ────────────────────────────────────── */

  app.get("/api/campaigns", requireAuth, async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns(req.session.userId!);
      return res.json({ campaigns });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── Gmail Inbox (protected) ──────────────────────────────────── */

  app.get("/api/inbox", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.gmailAccessToken) {
      return res.json({ messages: [], connected: false });
    }
    try {
      const messages = await fetchInboxMessages(
        req.session.gmailAccessToken,
        req.session.gmailRefreshToken || "",
        25
      );
      return res.json({ messages, connected: true });
    } catch (e: any) {
      console.error("Inbox fetch error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── Send reply from Inbox ─────────────────────────────────────── */

  const replySchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
  });

  app.post("/api/inbox/reply", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.gmailAccessToken) {
      return res.status(401).json({ error: "Gmail not connected" });
    }
    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const { to, subject, body } = parsed.data;
    const from = req.session.gmailEmail!;
    try {
      await sendEmailViaGmail(
        req.session.gmailAccessToken,
        req.session.gmailRefreshToken || "",
        from, to,
        subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        body
      );
      return res.json({ success: true });
    } catch (e: any) {
      console.error("Reply send error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── AI Inbox: Summarize email ─────────────────────────────────── */
  app.post("/api/inbox/summarize", requireAuth, async (req: Request, res: Response) => {
    const { subject, snippet, from } = req.body;
    if (!snippet) return res.status(400).json({ error: "snippet required" });
    try {
      const completion = await aiCall({
        max_tokens: 400,
        messages: [
          { role: "system", content: `You are an inbox assistant for a B2B outreach platform. Analyze the email and return a JSON object with:
- "summary": 1-2 sentences capturing the core message and any next step implied
- "sentiment": one of "positive", "neutral", "negative", "interested", "not_interested"
- "keyPoints": array of 2-3 concise bullet strings (the most actionable details)

Return ONLY valid JSON. No markdown. Schema: {"summary":"...","sentiment":"...","keyPoints":["...","..."]}` },
          { role: "user", content: `Subject: ${subject || "(none)"}\nFrom: ${from || "unknown"}\n\n${snippet}` },
        ],
      });
      const raw = (completion.choices[0]?.message?.content || "").replace(/```(?:json)?/g, "").trim();
      const data = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── AI Inbox: Smart reply suggestions ─────────────────────────── */
  app.post("/api/inbox/smart-replies", requireAuth, async (req: Request, res: Response) => {
    const { subject, snippet, from } = req.body;
    if (!snippet) return res.status(400).json({ error: "snippet required" });
    try {
      const completion = await aiCall({
        max_tokens: 250,
        messages: [
          { role: "system", content: `You are a smart reply assistant for a B2B sales inbox. Generate exactly 3 reply options that a sales rep might send. Rules:
- Each reply under 15 words
- Vary the intent: one accepting/positive, one asking a question, one soft decline or delay
- Match the tone of the incoming email (formal stays formal, casual stays casual)
- Sound like a human wrote them, not software
Return ONLY valid JSON: {"replies":["...","...","..."]}` },
          { role: "user", content: `Subject: ${subject || "(none)"}\nFrom: ${from || "unknown"}\n\n${snippet}` },
        ],
      });
      const raw = (completion.choices[0]?.message?.content || "").replace(/```(?:json)?/g, "").trim();
      const data = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /* ─── Global error handler (prevents unhandled rejections from crashing lambda) */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Express global error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  /* ─── Stripe Billing ────────────────────────────────────────────── */

  // GET /api/billing/plans — return available plans
  app.get("/api/billing/plans", (_req: Request, res: Response) => {
    res.json({ plans: PLANS, stripeEnabled: !!stripe });
  });

  // POST /api/billing/checkout — create a Stripe checkout session
  app.post("/api/billing/checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const { plan } = req.body as { plan: "starter" | "pro" | "agency" };
      if (!plan || !PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

      const me = await storage.getUser(req.session.userId!);
      if (!me) return res.status(404).json({ error: "User not found" });

      const origin = req.headers.origin || process.env.APP_URL || "https://outleadrr.vercel.app";
      const url = await createCheckoutSession({
        userEmail: me.email,
        planKey: plan,
        successUrl: `${origin}/settings?billing=success`,
        cancelUrl:  `${origin}/settings?billing=cancel`,
      });

      if (!url) return res.status(503).json({ error: "Stripe not configured — add STRIPE_SECRET_KEY and price IDs to your env vars." });
      res.json({ url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/billing/portal — open Stripe billing portal for existing subscriber
  app.post("/api/billing/portal", requireAuth, async (req: Request, res: Response) => {
    try {
      const { customerId } = req.body as { customerId: string };
      if (!customerId) return res.status(400).json({ error: "customerId required" });
      const origin = req.headers.origin || process.env.APP_URL || "https://outleadrr.vercel.app";
      const url = await createPortalSession(customerId, `${origin}/settings`);
      if (!url) return res.status(503).json({ error: "Stripe not configured" });
      res.json({ url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/billing/webhook — Stripe webhook (raw body required)
  app.post("/api/billing/webhook", (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const event = constructWebhookEvent(req.body as Buffer, sig);
    if (!event) return res.status(400).json({ error: "Invalid webhook signature" });

    switch (event.type) {
      case "checkout.session.completed":
        console.log("[Stripe] Checkout completed:", (event.data.object as any).customer_email);
        break;
      case "customer.subscription.deleted":
        console.log("[Stripe] Subscription cancelled:", (event.data.object as any).customer);
        break;
    }
    res.json({ received: true });
  });

  return httpServer;
}
