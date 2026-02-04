-- Polaroid Wall Online: initial schema
-- Compatible with Supabase Postgres

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  google_user_id text unique not null,
  email text not null,
  name text,
  created_at timestamptz default now() not null
);

create table if not exists auth_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

create table if not exists albums (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  google_album_id text not null,
  title text not null,
  created_at timestamptz default now() not null,
  unique (user_id, google_album_id)
);

create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  album_id uuid references albums(id) on delete cascade not null,
  google_media_item_id text not null,
  base_url text not null,
  is_hidden boolean default false not null,
  note text,
  updated_at timestamptz default now() not null,
  unique (user_id, google_media_item_id)
);

create index if not exists photos_album_idx on photos(album_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger photos_set_updated_at
before update on photos
for each row
execute procedure set_updated_at();
