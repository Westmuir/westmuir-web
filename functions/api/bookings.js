// functions/api/bookings.js

export async function onRequestGet(context) {
  try {
    // 1. Query the Cloudflare D1 database (bound to 'DB' in wrangler.json)
    // We sort the bookings by date so they display chronologically
    const { results } = await context.env.DB.prepare('SELECT * FROM bookings ORDER BY date ASC').all();

    // 2. Handle the empty state gracefully
    if (!results || results.length === 0) {
      return new Response("<p class='no-bookings'>No bookings scheduled at the moment.</p>", {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 3. Build a simple HTML string to return to the browser
    // HTMX will seamlessly inject this string right into your WebC component
    let html = "<ul class='bookings-list'>";

    results.forEach(booking => {
      // Clean up the status text formatting for presentation
      const isApproved = booking.status === 'approved';
      const statusLabel = isApproved ? '✅ Approved' : '⏳ Pending Approval';

      html += `
        <li class="booking-item status-${booking.status}">
          <strong class="booking-date">${booking.date}</strong>
          <span class="booking-name">— ${booking.name}</span>
          <span class="booking-badge">${statusLabel}</span>
        </li>
      `;
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
