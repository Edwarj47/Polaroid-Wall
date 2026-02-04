-- Collections for user-managed sets

create table if not exists collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  created_at timestamptz default now() not null
);

alter table photos add column if not exists collection_id uuid references collections(id) on delete cascade;
alter table photos alter column album_id drop not null;

create index if not exists photos_collection_idx on photos(collection_id);
