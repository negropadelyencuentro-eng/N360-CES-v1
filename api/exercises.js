export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Construir params para wger
  const { offset = 0, limit = 20, category, format = "json" } = req.query;
  const params = new URLSearchParams({ format, limit, offset });
  if (category) params.set("category", category);

  const url = `https://wger.de/api/v2/exerciseinfo/?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "N360CES/1.0",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `wger respondió ${response.status}` });
    }

    const data = await response.json();
    // Cache 10 minutos para no sobrecargar wger
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
    res.status(200).json(data);
  } catch (err) {
    console.error("[exercises proxy]", err);
    res.status(500).json({ error: err.message });
  }
}
