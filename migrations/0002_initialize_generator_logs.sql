-- Migration number: 0002 	 2026-09-21T14:42:45.727Z

-- Migration: Initialize Generator Maintenance Logs Table
CREATE TABLE generator_logs (
    id TEXT PRIMARY KEY,               -- Unique UUID / NanoID string
    date TEXT NOT NULL,                -- Log Date (YYYY-MM-DD)
    time_start TEXT NOT NULL,          -- Generator Activation Time (HH:MM)
    time_end TEXT NOT NULL,            -- Generator Deactivation Time (HH:MM)
    battery_start REAL,                -- Decimal floating voltages
    battery_end REAL,
    fuel_start INTEGER,                -- Whole integer percentages
    fuel_end INTEGER,
    oil_press_start INTEGER,           -- Whole integer pressures
    oil_press_end INTEGER,
    oil_level TEXT,                    -- Categorical tags (e.g., "F", "L", "100")
    coolant TEXT,                      -- Categorical tags (e.g., "F", "L")
    reason TEXT NOT NULL,              -- Run code definitions ("M", "R", "A", "S")
    initials TEXT NOT NULL,            -- Up to 3-character operator initials
    notes TEXT,                        -- Maintenance descriptions
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Optimize queries by adding an index for fast chronological lookups
CREATE INDEX idx_generator_logs_date ON generator_logs(date DESC);

-- (Optional) Inject some baseline paper log entries instantly for initial layout verification
INSERT INTO generator_logs (id, date, time_start, time_end, battery_start, battery_end, fuel_start, fuel_end, oil_press_start, oil_press_end, oil_level, coolant, reason, initials, notes)
VALUES
('test-1', '2025-02-12', '13:50', '14:34', 12.5, 14.3, 75, 66, 620, 620, 'F', 'F', 'M', 'PR', ''),
('test-2', '2025-03-22', '10:50', '11:25', 12.5, 14.7, 50, 50, 670, 700, 'F', 'F', 'R', 'PR', ''),
('test-3', '2026-04-02', '14:25', '14:48', 12.2, 13.2, 50, 50, 690, 710, 'F', 'F', 'A', 'PR', 'Maintenance run as well'),
('test-4', '2026-06-15', '10:00', '11:30', NULL, NULL, 39, 37, NULL, 660, '100', 'F', 'S', 'PR', '');

