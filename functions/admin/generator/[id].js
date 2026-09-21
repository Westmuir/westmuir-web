// functions/admin/generator/[id].js

export async function onRequestDelete(context) {
  try {
    const { env, params } = context;
    const db = env.village_hall;
    const logId = params.id;

    if (!logId) {
      return new Response(JSON.stringify({ error: 'Missing log entry identifier.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clear the single flat record straight out of D1
    await db.prepare(`DELETE FROM generator_logs WHERE id = ?`).bind(logId).run();

    // Return confirmation to instantly sync your client-side memory view
    return new Response(JSON.stringify({ success: true, id: logId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
