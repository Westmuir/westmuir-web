ALTER TABLE bookings ADD COLUMN is_recurring INTEGER DEFAULT 0; -- 0 = False, 1 = True
ALTER TABLE bookings ADD COLUMN day_of_week INTEGER;            -- 0 (Sun) to 6 (Sat)
ALTER TABLE bookings ADD COLUMN end_date TEXT;                  -- e.g., "2026-12-31"

-- Insert a mock recurring Tuesday Yoga Class (Tuesday is day 2)
INSERT INTO bookings (date, name, email, status, is_recurring, day_of_week, end_date)
VALUES ('2026-06-09', 'Yoga Class', 'yoga@example.com', 'approved', 1, 2, '2026-12-29');

