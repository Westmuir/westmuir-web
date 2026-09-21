// functions/api/generator/index.js

export async function onRequestGet(context) {
  try {
    const { env } = context;
    const db = env.village_hall;

    // Pull logs out sorted newest-first based on your custom indexing rule
    const { results } = await db
      .prepare(
        `
      SELECT * FROM generator_logs
      ORDER BY date DESC, time_start DESC
    `,
      )
      .all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Ensures admins always fetch real-time log values
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
