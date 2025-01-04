-- Step 1: Drop everything in reverse dependency order
do $$ 
begin
  -- Drop triggers
  drop trigger if exists on_auth_user_created on auth.users;
  drop trigger if exists handle_updated_at on gift_categories;
  drop trigger if exists handle_updated_at on gift_groups;
  drop trigger if exists handle_updated_at on gifts;

  -- Drop functions
  drop function if exists public.handle_new_user() cascade;
  drop function if exists public.handle_updated_at() cascade;
  drop function if exists public.lookup_user_by_email(lookup_email text) cascade;

  -- Drop policies
  drop policy if exists "Avatar images are publicly accessible" on storage.objects;
  drop policy if exists "Anyone can upload an avatar" on storage.objects;
  drop policy if exists "Users can update their own avatar" on storage.objects;
  drop policy if exists "Users can delete their own avatar" on storage.objects;
  drop policy if exists "Gift images are publicly accessible" on storage.objects;
  drop policy if exists "Anyone can upload a gift image" on storage.objects;
  
  -- Drop existing policies
  drop policy if exists "Enable all actions for users based on id" on profiles;
  drop policy if exists "Public profiles are viewable by everyone" on profiles;
  drop policy if exists "Users can insert their own profile" on profiles;
  drop policy if exists "Users can update their own profile" on profiles;

  -- Drop tables in correct order
  drop table if exists gifts cascade;
  drop table if exists gift_groups cascade;
  drop table if exists gift_categories cascade;
  drop table if exists profiles cascade;

  -- Drop domains if they exist
  drop domain if exists valid_email cascade;
  drop domain if exists valid_url cascade;
end $$;

-- Step 2: Create extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";  -- For case-insensitive text comparisons

-- Step 3: Create storage buckets
insert into storage.buckets (id, name)
values ('avatars', 'avatars')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('gifts', 'gifts', true)
on conflict (id) do nothing;

-- Step 4: Create domains for validation
create domain valid_email as text
  check ( value ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' );

create domain valid_url as text
  check ( value ~* '^https?://.+' );

-- Step 5: Create base tables
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text not null,
  avatar_url valid_url,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  google_calendar_enabled boolean default false not null,
  google_calendar_refresh_token text,
  apple_calendar_enabled boolean default false not null,
  notifications_enabled boolean default true not null,
  reminder_time integer default 1440 not null check (reminder_time > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists gift_categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text check (color ~* '^#[A-Fa-f0-9]{6}$'),  -- Validate hex color format
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)  -- Prevent duplicate category names per user
);

create table if not exists gift_groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)  -- Prevent duplicate group names per user
);

create table if not exists gifts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references gift_categories on delete cascade not null,
  recipient_email valid_email,
  recipient text not null,
  name text not null,
  description text,
  price decimal(10,2) check (price > 0 OR price IS NULL),
  url valid_url,
  image_url valid_url,
  is_purchased boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Step 6: Create indexes
create index if not exists idx_gift_categories_user_id on gift_categories(user_id);
create index if not exists idx_gift_categories_created_at on gift_categories(created_at desc);
create index if not exists idx_gifts_category_id on gifts(category_id);
create index if not exists idx_gifts_user_id on gifts(user_id);
create index if not exists idx_gifts_recipient_email on gifts(recipient_email);
create index if not exists idx_gifts_created_at on gifts(created_at desc);

-- Step 7: Enable RLS
alter table profiles enable row level security;
alter table gift_categories enable row level security;
alter table gift_groups enable row level security;
alter table gifts enable row level security;

-- Step 8: Create storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( auth.uid() = owner );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using ( auth.uid() = owner );

create policy "Gift images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'gifts' );

create policy "Anyone can upload a gift image"
  on storage.objects for insert
  with check ( bucket_id = 'gifts' );

-- Step 9: Create RLS policies
do $$ 
begin
  -- Profiles policies
  if not exists (select 1 from pg_policies where policyname = 'Profiles are viewable by everyone') then
    create policy "Profiles are viewable by everyone"
      on profiles for select
      using ( true );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own profile') then
    create policy "Users can manage their own profile"
      on profiles for all
      using ( auth.uid() = id );
  end if;

  -- Gift categories policies
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own gift categories') then
    create policy "Users can manage their own gift categories"
      on gift_categories for all
      using ( auth.uid() = user_id );
  end if;

  -- Gift groups policies
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own gift groups') then
    create policy "Users can manage their own gift groups"
      on gift_groups for all
      using ( auth.uid() = user_id );
  end if;

  -- Gifts policies
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own gifts') then
    create policy "Users can manage their own gifts"
      on gifts for all
      using ( auth.uid() = user_id );
  end if;
end $$;

-- Step 10: Create view
create or replace view public.profile_emails as
select 
  p.id,
  p.nickname,
  u.email
from 
  public.profiles p
  join auth.users u on u.id = p.id;

-- Grant access to the view
grant select on public.profile_emails to authenticated;

-- Step 11: Create functions
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  nickname_val text;
begin
  -- Get nickname from metadata or email
  nickname_val := coalesce(
    new.raw_user_meta_data->>'nickname',  -- First try to get nickname from metadata
    new.raw_user_meta_data->>'full_name', -- Then try full_name
    split_part(new.email, '@', 1)         -- Finally fallback to email
  );

  -- Insert profile with all required fields
  insert into public.profiles (
    id,
    nickname,
    avatar_url,
    updated_at,
    google_calendar_enabled,
    google_calendar_refresh_token,
    apple_calendar_enabled,
    notifications_enabled,
    reminder_time,
    created_at
  )
  values (
    new.id,
    nickname_val,
    null,
    now(),
    false,
    null,
    false,
    true,
    1440,
    now()
  );
  return new;
end;
$$;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.lookup_user_by_email(lookup_email text)
returns table (
  nickname text
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select p.nickname
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.email = lookup_email;
end;
$$;

-- Step 12: Create triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists handle_updated_at on gift_categories;
create trigger handle_updated_at
  before update on gift_categories
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_updated_at on gift_groups;
create trigger handle_updated_at
  before update on gift_groups
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_updated_at on gifts;
create trigger handle_updated_at
  before update on gifts
  for each row
  execute function public.handle_updated_at();

-- Step 13: Grant permissions
grant execute on function public.lookup_user_by_email(text) to authenticated; 