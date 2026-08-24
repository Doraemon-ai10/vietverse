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
-- Server routes use the Supabase service-role key. Never expose that key in NEXT_PUBLIC_* variables.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
