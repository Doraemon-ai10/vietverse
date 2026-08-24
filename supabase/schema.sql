create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  coins integer not null default 1000,
  xp integer not null default 0,
  level integer not null default 1,
  avatar text not null default 'noob',
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users(lower(email));
create index if not exists users_username_idx on public.users(lower(username));
alter table public.users enable row level security;

create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists email_verification_token_lookup_idx on public.email_verification_tokens(token_hash, used);
alter table public.email_verification_tokens enable row level security;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
