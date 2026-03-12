import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
  "profile",
];

export function getOAuthClient() {
  let redirectUri = "http://localhost:5000/api/auth/google/callback";

  if (process.env.APP_URL) {
    // Explicit production URL — set APP_URL=https://yourdomain.vercel.app in Vercel env vars
    redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;
  } else if (process.env.REPLIT_DOMAINS) {
    redirectUri = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
  } else if (process.env.VERCEL_URL) {
    // Auto-injected by Vercel on every deployment
    redirectUri = `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
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
