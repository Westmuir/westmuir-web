// functions/api/generator/summary.js

export async function onRequestGet(context) {
  try {
    const { env } = context;
    const db = env.village_hall;

    const { results } = await db
      .prepare(
        `
      SELECT
          strftime('%Y', date) AS summary_year,
          COUNT(id) AS total_runs,
          ROUND(SUM(unixepoch(date || 'T' || time_end) - unixepoch(date || 'T' || time_start)) / 3600.0, 1) AS total_hours_run,
          SUM(fuel_start - fuel_end) AS total_fuel_used,
          ROUND(SUM(fuel_start - fuel_end) / (SUM(unixepoch(date || 'T' || time_end) - unixepoch(date || 'T' || time_start)) / 3600.0), 2) AS avg_burn_rate
      FROM generator_logs
      WHERE fuel_start IS NOT NULL AND fuel_end IS NOT NULL
      GROUP BY summary_year
      ORDER BY summary_year DESC
    `,
      )
      .all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600', // Safe to cache for 10 minutes since metrics don't change every second
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
