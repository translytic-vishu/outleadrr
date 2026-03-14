import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "email",
  "profile",
];

export function getOAuthClient() {
  // APP_URL must be set in Vercel environment variables to your stable production URL
  // e.g. APP_URL=https://outleadrr.vercel.app
  let redirectUri: string;

  if (process.env.APP_URL) {
    redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;
  } else if (process.env.REPLIT_DOMAINS) {
    redirectUri = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
  } else {
    // Local dev fallback
    redirectUri = "http://localhost:5000/api/auth/google/callback";
  }

  console.log("[OAuth] redirect_uri:", redirectUri);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: "gmail",
  });
}

export function getLoginAuthUrl() {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state: "login",
  });
}

export async function getUserInfo(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
}

export async function sendEmailViaGmail(
  accessToken: string,
  refreshToken: string,
  from: string,
  to: string,
  subject: string,
  body: string
) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];

  const email = emailLines.join("\r\n");
  const encodedEmail = Buffer.from(email).toString("base64url");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedEmail },
  });

  return result.data;
}

export async function fetchInboxMessages(accessToken: string, refreshToken: string, maxResults = 20) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Get list of inbox message IDs
  const list = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
  });

  const messages = list.data.messages || [];
  if (messages.length === 0) return [];

  // Fetch full details for each message in parallel
  const details = await Promise.all(
    messages.map(m =>
      gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: ["From","Subject","Date"] })
        .then(r => r.data)
        .catch(() => null)
    )
  );

  return details.filter(Boolean).map(msg => {
    const headers = msg!.payload?.headers || [];
    const get = (name: string) => headers.find(h => h.name === name)?.value || "";
    return {
      id: msg!.id!,
      from: get("From"),
      subject: get("Subject"),
      date: get("Date"),
      snippet: msg!.snippet || "",
      isUnread: (msg!.labelIds || []).includes("UNREAD"),
    };
  });
}
