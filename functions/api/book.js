// functions/api/book.js

export async function onRequestPost(context) {
  try {
    const request = context.request;

    // 1. Parse the incoming standard HTML form data submitted via HTMX
    const formData = await request.formData();
    const date = formData.get('date');
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();

    // 2. Simple server-side validation check
    if (!date || !name || !email) {
      return new Response("<p class='error-msg'>⚠️ Missing required form fields. Please fill out all entries.</p>", {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 3. Insert the incoming booking safely using SQL parameterized variables (?)
    // This entirely blocks malicious SQL-injection attacks automatically
    await context.env.DB.prepare("INSERT INTO bookings (date, name, email, status) VALUES (?, ?, ?, 'tentative')")
      .bind(date, name, email)
      .run();

    // 4. Return a clean confirmation message fragment back to the browser
    // HTMX replaces the whole form window with this successful block
    return new Response(
      `
      <div class="booking-success-message">
        <h4>🎉 Request Submitted!</h4>
        <p>Thank you, <strong>${name}</strong>. Your tentative booking for <strong>${date}</strong> has been logged.</p>
        <p>A village hall administrator will review this shortly. A confirmation will be sent to <em>${email}</em> once approved.</p>
        <button class="btn-submit" onclick="window.location.reload()">Submit Another Request</button>
      </div>
    `,
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  } catch (error) {
    console.error('Database insert failed:', error);

    return new Response(
      "<p class='error-msg'>⚠️ System Error: Unable to save your booking slot at this time. Please try again.</p>",
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}
