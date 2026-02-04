-- Sessions for login state

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  session_token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

create index if not exists sessions_user_idx on sessions(user_id);
