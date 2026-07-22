/**
 * Keep-alive Supabase — doublon du workflow GitHub Actions.
 *
 * Supabase met en pause un projet gratuit qui reçoit trop peu de requêtes base
 * sur 7 jours glissants ; leur doc parle de « quelques requêtes par jour ».
 * Deux planificateurs indépendants (GitHub Actions + Netlify) évitent qu'un cron
 * sauté — ou un workflow GitHub désactivé après 60 jours sans commit — laisse
 * passer la fenêtre.
 *
 * Planification : voir `[functions."supabase-keepalive"]` dans netlify.toml.
 * Cette fonction n'est pas appelable en HTTP public (fonction planifiée).
 *
 * Variables Netlify utilisées (déjà en place pour stand-orders-list) :
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (secret — jamais dans le repo)
 */

// Les pings au-delà de cet âge sont supprimés : la table reste petite et la
// purge est une requête base de plus, donc un signal d'activité de plus.
const RETENTION_DAYS = 30;

export const handler = async () => {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    console.error("keepalive: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
    return { statusCode: 500 };
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: "application/json",
  };

  const call = async (label, path, init = {}) => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
          ...init,
          headers: { ...headers, ...(init.headers || {}) },
        });
        if (res.ok) return true;
        console.warn(`keepalive: ${label} → HTTP ${res.status} (tentative ${attempt}/3)`, (await res.text()).slice(0, 200));
      } catch (err) {
        console.warn(`keepalive: ${label} → ${err?.message || err} (tentative ${attempt}/3)`);
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2000));
    }
    console.error(`keepalive: ${label} a échoué après 3 tentatives`);
    return false;
  };

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();

  const results = {
    insert: await call("insert", "keepalive", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: "{}",
    }),
    select: await call("select", "keepalive?select=id,pinged_at&order=pinged_at.desc&limit=1"),
    prune: await call("prune", `keepalive?pinged_at=lt.${encodeURIComponent(cutoff)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    }),
  };

  const ok = Object.values(results).every(Boolean);
  console.log(`keepalive: ${JSON.stringify(results)}`);
  return { statusCode: ok ? 200 : 500 };
};
