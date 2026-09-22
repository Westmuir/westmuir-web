// functions/api/generator/index.js

// Keep your existing onRequestGet here...

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const db = env.village_hall;
    const formData = await request.formData();

    // Setup keys to clean and pull out of the payload
    const fields = [
      'date',
      'time_start',
      'time_end',
      'battery_start',
      'battery_end',
      'fuel_start',
      'fuel_end',
      'oil_press_start',
      'oil_press_end',
      'oil_level',
      'coolant',
      'reason',
      'initials',
      'notes',
    ];

    const logEntry = {};

    // Fallback to a brand new native UUID if the id field is blank (Create mode)
    logEntry.id = formData.get('id') || crypto.randomUUID();

    // Transform empty strings or hyphens from mobile touch inputs into clean SQL NULL values
    for (const key of fields) {
      const value = formData.get(key);
      if (value === null || value === undefined) {
        logEntry[key] = null;
        continue;
      }
      const trimmed = value.toString().trim();
      logEntry[key] = trimmed === '' || trimmed === '-' ? null : trimmed;
    }

    // Explicit type normalization for SQLite execution boundaries
    if (logEntry.battery_start) logEntry.battery_start = parseFloat(logEntry.battery_start);
    if (logEntry.battery_end) logEntry.battery_end = parseFloat(logEntry.battery_end);
    if (logEntry.fuel_start) logEntry.fuel_start = parseInt(logEntry.fuel_start, 10);
    if (logEntry.fuel_end) logEntry.fuel_end = parseInt(logEntry.fuel_end, 10);
    if (logEntry.oil_press_start) logEntry.oil_press_start = parseInt(logEntry.oil_press_start, 10);
    if (logEntry.oil_press_end) logEntry.oil_press_end = parseInt(logEntry.oil_press_end, 10);

    // Save or update seamlessly via an idempotent UPSERT block
    await db
      .prepare(
        `
      INSERT INTO generator_logs (
        id, date, time_start, time_end,
        battery_start, battery_end, fuel_start, fuel_end,
        oil_press_start, oil_press_end, oil_level, coolant,
        reason, initials, notes
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
      ON CONFLICT(id) DO UPDATE SET
        date=excluded.date, time_start=excluded.time_start, time_end=excluded.time_end,
        battery_start=excluded.battery_start, battery_end=excluded.battery_end,
        fuel_start=excluded.fuel_start, fuel_end=excluded.fuel_end,
        oil_press_start=excluded.oil_press_start, oil_press_end=excluded.oil_press_end,
        oil_level=excluded.oil_level, coolant=excluded.coolant,
        reason=excluded.reason, initials=excluded.initials, notes=excluded.notes
    `,
      )
      .bind(
        logEntry.id,
        logEntry.date,
        logEntry.time_start,
        logEntry.time_end,
        logEntry.battery_start,
        logEntry.battery_end,
        logEntry.fuel_start,
        logEntry.fuel_end,
        logEntry.oil_press_start,
        logEntry.oil_press_end,
        logEntry.oil_level,
        logEntry.coolant,
        logEntry.reason,
        logEntry.initials,
        logEntry.notes,
      )
      .run();

    // Return the saved object back so your client side updates its collection model instantly
    return new Response(JSON.stringify({ success: true, log: logEntry }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
