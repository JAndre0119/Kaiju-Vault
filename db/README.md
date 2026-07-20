# Database Schema

Kaiju Vault's Postgres schema, managed via Supabase migrations in [`supabase/migrations/`](../supabase/migrations/). The canonical schema file is [`20260720221721_initial_schema.sql`](../supabase/migrations/20260720221721_initial_schema.sql).

## Tables

### `users`
Registered accounts. `role` distinguishes regular users from admins (default `'user'`). `password_hash` stores a hashed password, never plaintext.

### `films`
The kaiju movie catalog. `slug` is a unique, URL-friendly identifier for routing (e.g. `/films/godzilla-1954`). `tmdb_id` links back to the corresponding TMDB movie record for poster/metadata lookups.

### `reviews`
User-written reviews of a film. Each row belongs to one `film` and one `user` (both required, both cascade-deleted). `rating` is constrained to 1–5.

### `watchlist`
Many-to-many join table between `users` and `films` — the films a user has bookmarked to watch. Composite primary key (`user_id`, `film_id`) prevents duplicate entries; both sides cascade-delete.

### `showdowns`
Head-to-head matchups between two films (`film_a_id` vs `film_b_id`), used for the voting/comparison feature. `status` tracks whether voting is `'open'` or `'closed'`.

### `votes`
One vote per user per showdown. `choice` is either `'film_a'` or `'film_b'`, and the `UNIQUE (showdown_id, user_id)` constraint prevents a user from voting twice on the same showdown.

## Relationships

```
users ──< reviews >── films
users ──< watchlist >── films
films ──< showdowns >── films   (film_a_id, film_b_id)
showdowns ──< votes >── users
```

- A `film` can have many `reviews`, each from a different `user`.
- A `user` can have many `films` on their `watchlist`, and a `film` can be on many users' watchlists.
- A `showdown` references two `films` (no FK cascade — deleting a film does not delete its showdowns).
- A `showdown` can have many `votes`, but only one per `user`.

## Notes for later work

- No Row Level Security (RLS) policies are defined yet — add these before exposing tables to the Supabase client directly from the frontend.
- No indexes beyond primary/unique keys yet — revisit if `reviews`, `watchlist`, or `votes` lookups by `film_id`/`user_id` become a bottleneck.
- No seed data or auth routes are included in this migration; scope was schema-only.
