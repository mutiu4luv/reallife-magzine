const API_BASE_URL = process.env.VITE_API_BASE_URL || "https://reallife-magzine-backend.vercel.app";

const endpointsByKind = {
  post: ["/api/posts"],
  news: ["/api/news"],
  event: ["/api/upcoming-events", "/api/events"],
};

const labelsByKind = {
  post: "Article",
  news: "News",
  event: "Event",
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const toExcerpt = (value = "", maxLength = 180) => {
  const text = stripHtml(value);

  if (text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  return `${trimmed || text.slice(0, maxLength).trim()}...`;
};

const toAbsoluteUrl = (value, origin) => {
  if (!value) {
    return `${origin}/hero.jpeg`;
  }

  try {
    return new URL(value, origin).toString();
  } catch {
    return `${origin}/hero.jpeg`;
  }
};

const loadItem = async (kind, id) => {
  const endpoints = endpointsByKind[kind] || [];
  let lastError = "Unable to load preview.";

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        lastError = `Preview request failed with status ${response.status}.`;
        continue;
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  throw new Error(lastError);
};

const getBody = (kind, item) => {
  if (kind === "post") {
    return item.desc || item.description || "";
  }

  return item.description || item.desc || "";
};

const getImage = (kind, item) => {
  if (kind === "event") {
    return Array.isArray(item.images) ? item.images[0] : "";
  }

  return item.image || (Array.isArray(item.images) ? item.images[0] : "");
};

export default async function handler(req, res) {
  const kind = String(req.query.kind || "");
  const id = String(req.query.id || "");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const origin = `${protocol}://${host}`;
  const path =
    kind === "event" ? `/events/${encodeURIComponent(id)}` : kind === "news" ? `/news/${encodeURIComponent(id)}` : `/blog/${encodeURIComponent(id)}`;
  const pageUrl = `${origin}${path}`;
  const previewUrl = `${origin}/api/share?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`;

  try {
    if (!id || !endpointsByKind[kind]) {
      res.status(404).send("Preview not found.");
      return;
    }

    const item = await loadItem(kind, id);
    const title = item.title || "Reality Life Magazine";
    const description = toExcerpt(getBody(kind, item)) || "Read the full story on Reality Life Magazine.";
    const image = toAbsoluteUrl(getImage(kind, item), origin);
    const label = labelsByKind[kind] || "Article";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Reality Life Magazine">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(previewUrl)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:secure_url" content="${escapeHtml(image)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeHtml(title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <link rel="canonical" href="${escapeHtml(pageUrl)}">
    <script>
      window.setTimeout(function () {
        window.location.replace(${JSON.stringify(pageUrl)});
      }, 400);
    </script>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(label)}</p>
      <p>${escapeHtml(description)}</p>
      <p><a href="${escapeHtml(pageUrl)}">Read article</a></p>
    </main>
  </body>
</html>`);
  } catch {
    res.status(500).send("Unable to load preview.");
  }
}
