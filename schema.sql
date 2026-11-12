CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    name       TEXT     NOT NULL,
    password   TEXT     NOT NULL,
    content    TEXT     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('guestbook_locked', '0');

CREATE TABLE IF NOT EXISTS rsvp (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    attend       TEXT     NOT NULL,
    name         TEXT,
    side         TEXT,
    phone        TEXT,
    extra_guests INTEGER  DEFAULT 0,
    meal         TEXT,
    message      TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
