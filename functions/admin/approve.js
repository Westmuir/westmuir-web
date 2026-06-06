// functions/admin/approve.js

export async function onRequestPost(context) {
  try {
    // Authenticated state is guaranteed by the middleware!
    const formData = await context.request.formData();
    const id = formData.get('id');

    if (!id) return new Response('Missing booking ID identifier', { status: 400 });

    // Update status column directly inside D1 SQL database
    await context.env.DB.prepare("UPDATE bookings SET status = 'approved' WHERE id = ?").bind(id).run();

    const booking = await context.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();

    // Send back the replacement row snippet back to the admin dashboard
    return new Response(
      `
      <div class="booking-row">
        <div class="booking-info">
          <span class="date">${booking.date}</span>
          <span class="name">${booking.name} (${booking.email})</span>
        </div>
        <div>
          <span class="badge badge-approved">Approved</span>
        </div>
      </div>
    `,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  } catch (error) {
    return new Response('Failed to complete administrative action', {
      status: 500,
    });
  }
}
