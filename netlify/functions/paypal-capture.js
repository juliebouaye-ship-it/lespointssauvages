const PAYPAL_API_LIVE = "https://api-m.paypal.com";
const PAYPAL_API_SANDBOX = "https://api-m.sandbox.paypal.com";

function getPayPalBaseUrl() {
  const explicit = String(process.env.PAYPAL_API_BASE_URL || "").trim();
  if (explicit) return explicit;
  const context = String(process.env.CONTEXT || "").toLowerCase();
  return context === "production" ? PAYPAL_API_LIVE : PAYPAL_API_SANDBOX;
}

function getPayPalCredentials() {
  const clientId = String(process.env.LPS_PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.LPS_PAYPAL_CLIENT_SECRET || "").trim();
  return { clientId, clientSecret };
}

function buildBasicAuth(clientId, clientSecret) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { clientId, clientSecret } = getPayPalCredentials();
  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "PayPal credentials missing" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    payload = {};
  }

  const orderId = String(payload.orderID || payload.orderId || "").trim();
  if (!orderId) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "Missing orderID" }),
    };
  }

  const baseUrl = getPayPalBaseUrl();
  try {
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${buildBasicAuth(clientId, clientSecret)}`,
        "content-type": "application/json",
      },
      body: "{}",
    });

    const text = await captureResponse.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    if (!captureResponse.ok) {
      return {
        statusCode: captureResponse.status,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          error: "PayPal capture failed",
          details: json,
          status: captureResponse.status,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: true,
        capture: json,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        error: "Capture request failed",
        message: err?.message || "unknown_error",
      }),
    };
  }
};
