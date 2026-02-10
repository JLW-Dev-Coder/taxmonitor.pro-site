export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stripe/checkout" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const code = String(body.code || "").trim();
      const item = String(body.item || "").trim();

      if (!code || !item) return json({ error: "Missing code or item" }, 400);

      // TODO: create Stripe Checkout Session here and return { url }
      return json({ url: "https://example.com/replace-with-stripe-session-url" }, 200);
    }

    return new Response("Not found", { status: 404 });
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
