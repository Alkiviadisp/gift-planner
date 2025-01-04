-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create storage buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('gifts', 'gifts', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Gift images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload a gift image" on storage.objects;

-- Create storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Gift images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'gifts' );

create policy "Anyone can upload a gift image"
  on storage.objects for insert
  with check ( bucket_id = 'gifts' );

-- Create tables if they don't exist
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nickname text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  google_calendar_refresh_token text,
  google_calendar_access_token text,
  google_calendar_token_expiry timestamp with time zone,
  apple_calendar_sync_enabled boolean default false,
  calendar_preferences jsonb default '{"notifications": {"enabled": false, "beforeEvent": 60}}'::jsonb
);

create table if not exists gift_categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists gift_groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists gifts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references gift_categories on delete set null,
  group_id uuid references gift_groups on delete set null,
  name text not null,
  description text,
  price decimal(10,2),
  url text,
  image_url text,
  recipient text,
  occasion text,
  date date,
  status text default 'pending' check (status in ('pending', 'purchased', 'wrapped', 'given')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table gift_categories enable row level security;
alter table gift_groups enable row level security;
alter table gifts enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can view their own gift categories" on gift_categories;
drop policy if exists "Users can create their own gift categories" on gift_categories;
drop policy if exists "Users can update their own gift categories" on gift_categories;
drop policy if exists "Users can delete their own gift categories" on gift_categories;
drop policy if exists "Users can view their own gift groups" on gift_groups;
drop policy if exists "Users can create their own gift groups" on gift_groups;
drop policy if exists "Users can update their own gift groups" on gift_groups;
drop policy if exists "Users can delete their own gift groups" on gift_groups;
drop policy if exists "Users can view their own gifts" on gifts;
drop policy if exists "Users can create their own gifts" on gifts;
drop policy if exists "Users can update their own gifts" on gifts;
drop policy if exists "Users can delete their own gifts" on gifts;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can view their own gift categories"
  on gift_categories for select
  using ( auth.uid() = user_id );

create policy "Users can create their own gift categories"
  on gift_categories for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own gift categories"
  on gift_categories for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own gift categories"
  on gift_categories for delete
  using ( auth.uid() = user_id );

create policy "Users can view their own gift groups"
  on gift_groups for select
  using ( auth.uid() = user_id );

create policy "Users can create their own gift groups"
  on gift_groups for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own gift groups"
  on gift_groups for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own gift groups"
  on gift_groups for delete
  using ( auth.uid() = user_id );

create policy "Users can view their own gifts"
  on gifts for select
  using ( auth.uid() = user_id );

create policy "Users can create their own gifts"
  on gifts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own gifts"
  on gifts for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own gifts"
  on gifts for delete
  using ( auth.uid() = user_id );

-- Drop existing function and trigger if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nickname)
  values (new.id, new.email, new.raw_user_meta_data->>'nickname');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 