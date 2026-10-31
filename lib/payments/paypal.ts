import "server-only";

/** `PAYPAL_ENV` defaults to sandbox so a missing/unset value never accidentally targets live. */
export function paypalBaseUrl(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function requireCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required.");
  }
  return { clientId, clientSecret };
}

/** OAuth2 client-credentials token for calling the PayPal REST API. */
export async function getPaypalAccessToken(): Promise<string> {
  const { clientId, clientSecret } = requireCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal OAuth2 token request failed (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}
