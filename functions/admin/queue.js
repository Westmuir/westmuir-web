// functions/admin/queue.js

export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare('SELECT * FROM bookings ORDER BY date ASC').all();

    if (!results || results.length === 0) {
      return new Response('<p>No bookings found in the database.</p>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    let html = '';
    results.forEach(b => {
      // 1. Determine status badge classes
      let badgeClass = 'badge-tentative';
      if (b.status === 'approved') badgeClass = 'badge-approved';
      if (b.status === 'denied') badgeClass = 'badge-denied';
      if (b.status === 'cancelled') badgeClass = 'badge-cancelled';

      let statusLabel = b.status.charAt(0).toUpperCase() + b.status.slice(1);
      const eventDetails = b.is_recurring ? `🔄 Weekly (Day ${b.day_of_week})` : b.date;

      // 2. We add 'status-${b.status}' as a class name so our CSS body filter can grab it
      html += `
        <div class="booking-row status-${b.status}" id="booking-container-${b.id}" style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-2); padding: var(--size-3); margin-bottom: var(--size-2); border-radius: var(--radius-2); border: var(--border-size-1) solid var(--surface-3);">
          <div class="booking-info">
            <span class="date" style="font-weight: bold; color: ${b.is_recurring ? 'var(--purple-6)' : 'var(--text-1)'};">${eventDetails}</span>
            <span class="name" style="color: var(--text-1);">— ${b.name} (${b.email})</span>
            <span class="badge ${badgeClass}" style="padding: 2px 6px; border-radius: var(--radius-1); font-size: var(--font-size-0); font-weight: bold;">${statusLabel}</span>
          </div>
          <div class="action-cell" style="display: flex; gap: var(--size-2); align-items: center;">

            <!-- Standard Action Buttons -->
            ${
              b.status !== 'approved' && b.status !== 'cancelled'
                ? `
              <button style="background: var(--blue-6); color: white; border: none; padding: 6px 12px; border-radius: var(--radius-1); cursor: pointer;" hx-post="/admin/approve" hx-vals='{"id": ${b.id}, "status": "approved"}' hx-target="#booking-container-${b.id}" hx-swap="outerHTML">Approve</button>
            `
                : ''
            }

            ${
              b.status !== 'denied' && b.status !== 'cancelled'
                ? `
              <button style="background: var(--red-6); color: white; border: none; padding: 6px 12px; border-radius: var(--radius-1); cursor: pointer;" hx-post="/admin/approve" hx-vals='{"id": ${b.id}, "status": "denied"}' hx-target="#booking-container-${b.id}" hx-swap="outerHTML">Deny</button>
            `
                : ''
            }

            <!-- Reset Button: Allows reviving Denied or Cancelled items back into the queue -->
            ${
              b.status !== 'tentative'
                ? `
              <button style="background: var(--stone-6); color: white; border: none; padding: 6px 12px; border-radius: var(--radius-1); cursor: pointer;" hx-post="/admin/approve" hx-vals='{"id": ${b.id}, "status": "tentative"}' hx-target="#booking-container-${b.id}" hx-swap="outerHTML">Reset</button>
            `
                : ''
            }

            <!-- Cancel Button: Only available for Active, Approved, or Pending items -->
            ${
              b.status !== 'cancelled'
                ? `
              <button style="background: var(--orange-7); color: white; border: none; padding: 6px 12px; border-radius: var(--radius-1); cursor: pointer;"
                hx-post="/admin/approve"
                hx-vals='{"id": ${b.id}, "status": "cancelled"}'
                hx-confirm="Are you sure you want to flag this event as Cancelled?"
                hx-target="#booking-container-${b.id}"
                hx-swap="outerHTML">
                Cancel Booking
              </button>
            `
                : ''
            }

          </div>
        </div>
      `;
    });

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    return new Response('<p>Error loading log entries.</p>', { status: 500 });
  }
}
