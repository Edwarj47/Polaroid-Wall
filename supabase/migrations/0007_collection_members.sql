-- Collection collaborators

create table if not exists collection_members (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade,
  email text not null,
  role text not null,
  created_at timestamptz default now() not null,
  unique (collection_id, email),
  unique (collection_id, user_id)
);

create index if not exists collection_members_collection_idx on collection_members(collection_id);
create index if not exists collection_members_user_idx on collection_members(user_id);
