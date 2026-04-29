/**
 * Liste des commandes stand : lecture via clé service_role (serveur uniquement).
 * Auth : header Authorization: Bearer <STAND_ADMIN_TOKEN> (mot de passe défini dans Netlify env).
 *
 * Variables Netlify à définir :
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (secret — jamais dans le repo)
 * - STAND_ADMIN_TOKEN (secret fort choisi par vous)
 */

exports.handler = async (event) => {
  const jsonHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const expected = process.env.STAND_ADMIN_TOKEN;
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!expected || token !== expected) {
    return {
      statusCode: 401,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Server misconfigured (missing Supabase secrets)" }),
    };
  }

  const u = new URL(`${baseUrl}/rest/v1/stand_orders`);
  u.searchParams.set("select", "created_at,customer_name,customer_email,shipping_method,amount_total,amount_remaining,pos_reference");
  u.searchParams.set("order", "created_at.desc");
  u.searchParams.set("limit", "80");

  const res = await fetch(u.toString(), {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      statusCode: 502,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Invalid Supabase response", detail: text.slice(0, 200) }),
    };
  }

  if (!res.ok) {
    return {
      statusCode: res.status >= 400 ? res.status : 502,
      headers: jsonHeaders,
      body: JSON.stringify({ error: data }),
    };
  }

  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify(Array.isArray(data) ? data : []),
  };
};
