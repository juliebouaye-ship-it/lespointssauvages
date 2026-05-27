/* Galerie aperçu box — photos depuis Supabase (table + Storage). */

const BOX_MOTIF_GALLERY_BUCKET = "box-motifs";

async function loadBoxMotifGallery() {
  const root = document.getElementById("box-motifs-preview");
  const trigger = document.getElementById("box-motifs-preview-btn");
  if (!root || !trigger) return { ok: false, reason: "missing_dom" };

  const client = typeof getSharedSupabaseClient === "function" ? getSharedSupabaseClient() : null;
  if (!client) {
    root.hidden = true;
    return { ok: false, reason: "missing_supabase" };
  }

  try {
    const { data, error } = await client
      .from("box_motif_gallery")
      .select("caption,storage_path,sort_order")
      .eq("is_published", true)
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      root.hidden = true;
      return { ok: false, reason: error.message };
    }

    const rows = (data || []).filter((row) => String(row?.storage_path || "").trim());
    if (!rows.length) {
      root.hidden = true;
      trigger.setAttribute("data-gallery-images", "");
      trigger.setAttribute("data-gallery-alts", "");
      trigger.setAttribute("data-gallery-rotations", "");
      return { ok: true, count: 0 };
    }

    const galleryItems = rows
      .map((row) => {
        const path = String(row.storage_path).trim();
        const { data: urlData } = client.storage.from(BOX_MOTIF_GALLERY_BUCKET).getPublicUrl(path);
        const src = String(urlData?.publicUrl || "").trim();
        const alt = String(row.caption || "").trim() || "Aperçu d’une box broderie Les Points Rebelles";
        if (!src) return null;
        return { src, alt };
      })
      .filter(Boolean);
    if (!galleryItems.length) {
      root.hidden = true;
      return { ok: true, count: 0 };
    }

    trigger.setAttribute("data-gallery-images", galleryItems.map((item) => item.src).join("|"));
    trigger.setAttribute("data-gallery-alts", galleryItems.map((item) => item.alt).join("|"));
    trigger.setAttribute("data-gallery-rotations", galleryItems.map(() => "0").join("|"));

    root.hidden = false;
    return { ok: true, count: galleryItems.length };
  } catch (err) {
    root.hidden = true;
    return { ok: false, reason: err?.message || "box_gallery_load_failed" };
  }
}

if (typeof window !== "undefined") {
  window.loadBoxMotifGallery = loadBoxMotifGallery;
}
