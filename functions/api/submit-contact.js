export async function onRequestPost(context) {
  try {
    const { request } = context; // 1. Grab the Turnstile token sent by htmx
    const turnstileToken = formData.get('cf-turnstile-response');

    // 2. Get the user's IP address (highly recommended by Cloudflare for accurate checks)
    const ip = request.headers.get('CF-Connecting-IP');

    // 3. Fallback to Cloudflare's testing secret key if your production environment variable isn't set yet
    const secretKey = env.TURNSTILE_SECRET_KEY || '1x00000000000000000000000000000000AA';

    // 4. Validate the token against Cloudflare's verification endpoint
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: turnstileToken,
        remoteip: ip,
      }),
    });

    const verifyResult = await verifyResponse.json();

    // 5. If Turnstile flags the submission as a bot, reject the request immediately!
    if (!verifyResult.success) {
      return new Response(
        `<p style="color: var(--red); padding: 1rem; border: 1px solid var(--red); border-radius: 0.5rem;">
          Security verification failed. Please refresh and try again.
         </p>`,
        { status: 403, headers: { 'Content-Type': 'text/html' } },
      );
    }

    // Parse the incoming standard URL-encoded form data sent by htmx
    const formData = await request.formData();
    const firstName = formData.get('first_name');
    const email = formData.get('email');
    const queryType = formData.get('query');
    const message = formData.get('message');

    // Optional: Put your backend notification or database logging logic here
    // e.g., Send an email via Resend, post to a database, or trigger a Slack webhook.

    // Return the clean HTML layout structure that htmx will swap into the DOM
    const successHTML = `
      <div id="contact-container" style="text-align: center; padding: var(--size-4) 0;">
        <h1 style="color: var(--primary, #000); margin-bottom: var(--size-2);">Thank You!</h1>
        <p>Thanks for reaching out, <strong>${firstName}</strong>. We've received your request regarding "${queryType}" and our team will be in touch with you soon.</p>
      </div>
    `;

    return new Response(successHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    // Graceful error fallback if something goes wrong on the server side
    return new Response(`<p style="color: var(--red);">Server error. Please try submitting again later.</p>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
