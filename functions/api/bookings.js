// functions/api/bookings.js

export async function onRequestGet(context) {
  try {
    // 1. Query the Cloudflare D1 database (bound to 'DB' in wrangler.json)
    // We sort the bookings by date so they display chronologically

    // Inside functions/api/bookings.js
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM bookings WHERE status = 'approved' ORDER BY is_recurring DESC, date ASC",
    ).all();

    // 2. Handle the empty state gracefully
    if (!results || results.length === 0) {
      return new Response("<p class='no-bookings'>No bookings scheduled at the moment.</p>", {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 3. Build a simple HTML string to return to the browser
    // HTMX will seamlessly inject this string right into your WebC component
    let html = "<ul class='bookings-list'>";
    results.forEach(b => {
      if (b.is_recurring) {
        const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
        html += `
      <li class="booking-item recurring" style="border-left: var(--border-size-3) solid var(--cyan-7); padding-left: var(--size-4); margin-bottom: var(--size-4);">
        <strong>Every ${days[b.day_of_week]}</strong>
        <span class="booking-name">— ${b.name} (Until ${b.end_date})</span>
        <span class="badge" style="background:#edf2f7; font-size:0.8rem; padding:2px 6px; border-radius:4px;">🔄 Weekly</span>
      </li>
    `;
      } else {
        html += `
      <li class="booking-item status-approved" style="margin-bottom: var(--size-4);">
        <strong>${b.date}</strong> <span class="booking-name">— ${b.name}</span>
      </li>
    `;
      }
    });

    html += '</ul>';
    // 4. Return the server-rendered HTML back to the browser
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache', // Ensures the client always fetches fresh database entries
      },
    });
  } catch (error) {
    // Log errors cleanly inside your wrangler terminal output
    console.error('Database query failed:', error);

    return new Response("<p class='error-text'>⚠️ Unable to load bookings right now. Please try refreshing.</p>", {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
