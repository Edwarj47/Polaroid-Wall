# Supabase setup

1) Create a Supabase project (Free).
2) In the Supabase SQL editor, run the migration SQL in `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_sessions.sql`, `supabase/migrations/0003_collections.sql`, `supabase/migrations/0004_picker_sessions.sql`, `supabase/migrations/0005_collection_text.sql`, `supabase/migrations/0006_share_and_layout.sql`, and `supabase/migrations/0007_collection_members.sql`.
3) Enable Row Level Security (RLS) on all tables and add policies.
4) Copy project keys into `.env.local` (see `.env.example`).

## RLS (recommended policies)

```
-- Enable RLS
alter table users enable row level security;
alter table auth_tokens enable row level security;
alter table albums enable row level security;
alter table photos enable row level security;
alter table collections enable row level security;
alter table picker_sessions enable row level security;

-- Users: allow access to own row by matching google_user_id in JWT
create policy "users_select_own" on users
for select using (google_user_id = auth.jwt() ->> 'sub');

-- Tokens: allow access to own tokens
create policy "tokens_select_own" on auth_tokens
for select using (user_id in (select id from users where google_user_id = auth.jwt() ->> 'sub'));

-- Albums: own albums
create policy "albums_select_own" on albums
for select using (user_id in (select id from users where google_user_id = auth.jwt() ->> 'sub'));

-- Collections: own collections
create policy "collections_select_own" on collections
for select using (user_id in (select id from users where google_user_id = auth.jwt() ->> 'sub'));

-- Photos: own photos
create policy "photos_select_own" on photos
for select using (user_id in (select id from users where google_user_id = auth.jwt() ->> 'sub'));

-- Picker sessions: own sessions
create policy "picker_sessions_select_own" on picker_sessions
for select using (user_id in (select id from users where google_user_id = auth.jwt() ->> 'sub'));

-- Collection members: own rows
create policy "collection_members_select_own" on collection_members
for select using (user_id in (select id from users where google_user_id = auth.jwt() ->> 'sub'));
```

Adjust policies as needed when auth is wired up.
