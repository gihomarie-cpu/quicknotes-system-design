# QuickNotes Data Model

## Entities and columns

- **users:** `id INTEGER PRIMARY KEY`; `email TEXT NOT NULL UNIQUE`; `display_name TEXT NOT NULL`; `password_hash TEXT NOT NULL`; `created_at TEXT NOT NULL`.
- **notes:** `id INTEGER PRIMARY KEY`; `user_id INTEGER NOT NULL` foreign key to `users.id`; `title TEXT NOT NULL` (1–100 characters); `body TEXT` optional; `created_at TEXT NOT NULL`; `updated_at TEXT NOT NULL`.
- **tags:** `id INTEGER PRIMARY KEY`; `user_id INTEGER NOT NULL` foreign key to `users.id`; `name TEXT NOT NULL`; `created_at TEXT NOT NULL`; tag name is unique per user.
- **note_tags:** `note_id INTEGER NOT NULL` foreign key to `notes.id`; `tag_id INTEGER NOT NULL` foreign key to `tags.id`; `created_at TEXT NOT NULL`; composite primary key `(note_id, tag_id)`.

## Relationships

- Users to notes is **one-to-many**: one user can own many notes, but each note has one owner.
- Users to tags is **one-to-many**: one user can create many tags, but each tag belongs to one user.
- Notes to tags is **many-to-many**: a note can have multiple tags and each tag can be applied to multiple notes. `note_tags` resolves the many-to-many relationship and prevents duplicate note/tag pairs.

## SQLite table definitions

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 100),
    body TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

## Example queries

### 1. List notes for one user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

### 2. JOIN notes with their owners

```sql
SELECT notes.title, users.display_name, users.email
FROM notes
JOIN users ON users.id = notes.user_id
ORDER BY notes.created_at DESC;
```

### 3. List notes with tags

```sql
SELECT notes.title, tags.name AS tag_name
FROM notes
JOIN note_tags ON note_tags.note_id = notes.id
JOIN tags ON tags.id = note_tags.tag_id
WHERE notes.user_id = 1
ORDER BY notes.title, tags.name;
```

### 4. Count notes per user, including users without notes

```sql
SELECT users.id, users.display_name, COUNT(notes.id) AS note_count
FROM users
LEFT JOIN notes ON notes.user_id = users.id
GROUP BY users.id, users.display_name
ORDER BY note_count DESC;
```

## Indexes

```sql
CREATE INDEX idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);
```

`idx_notes_user_updated` helps retrieve a user's notes ordered by update time. The composite primary key on `note_tags(note_id, tag_id)` already supports lookups by `note_id`; the second index helps queries that start from a `tag_id`.

## SQL or NoSQL?

I would choose a relational database such as PostgreSQL for QuickNotes. Users, notes, and tags have clear relationships, and foreign keys, unique constraints, transactions, and JOINs help maintain data integrity. PostgreSQL also supports indexes and read replicas as usage grows. NoSQL can suit some flexible or specialized high-volume workloads, but it is not necessary for this structured relational model.
