export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const params = new URLSearchParams();
  params.set("format", "json");
  params.set("limit", req.query.limit || "20");
  params.set("offset", req.query.offset || "0");
  if (req.query.category) params.set("category", req.query.category);

  const url = `https://wger.de/api/v2/exerciseinfo/?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=600");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
