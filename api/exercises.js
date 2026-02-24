// Vercel Serverless Function — actúa como proxy para wger.de
// Evita CORS en producción sin exponer la API al cliente
export default async function handler(req, res) {
  // Permitir CORS desde nuestro dominio
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const params = new URLSearchParams(req.query);
  const url = `https://wger.de/api/v2/exerciseinfo/?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "N360CES/1.0",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Error al conectar con wger" });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
