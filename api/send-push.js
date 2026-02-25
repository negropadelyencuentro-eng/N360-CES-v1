export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { createClient } = await import("@supabase/supabase-js");
  const webpush = await import("web-push");

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  webpush.default.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@n360ces.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { userId, userIds, title, body, url = "/" } = req.body;
  const targets = userIds || (userId ? [userId] : []);
  if (!targets.length) return res.status(400).json({ error: "userId o userIds requerido" });

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .in("user_id", targets);

  if (error) return res.status(500).json({ error: error.message });
  if (!subs?.length) return res.status(200).json({ sent: 0, message: "Sin subscripciones registradas" });

  const results = await Promise.allSettled(
    subs.map((row) =>
      webpush.default.sendNotification(
        row.subscription,
        JSON.stringify({ title, body, url })
      )
    )
  );

  res.status(200).json({
    sent: results.filter((r) => r.status === "fulfilled").length,
    total: subs.length,
  });
}
