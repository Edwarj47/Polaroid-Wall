create table if not exists picker_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete cascade not null,
  session_id text unique not null,
  created_at timestamptz default now() not null
);

create index if not exists picker_sessions_user_idx on picker_sessions(user_id);
create index if not exists picker_sessions_collection_idx on picker_sessions(collection_id);
