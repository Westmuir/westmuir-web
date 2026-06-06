CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'tentative'
);

-- Insert dummy data to test your local view
INSERT INTO bookings (date, name, email, status) VALUES ('2026-07-10', 'Bridge Club', 'bridge@example.com', 'approved');
INSERT INTO bookings (date, name, email, status) VALUES ('2026-07-15', 'Birthday Party', 'party@example.com', 'tentative');


