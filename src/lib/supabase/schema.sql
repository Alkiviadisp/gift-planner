-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create storage buckets
insert into storage.buckets (id, name)
values ('avatars', 'avatars')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('gifts', 'gifts', true)
on conflict (id) do nothing;

-- Drop existing storage policies
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Gift images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload a gift image" on storage.objects;

-- Set up storage policies
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

-- Create tables
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  google_calendar_enabled boolean default false,
  google_calendar_refresh_token text,
  apple_calendar_enabled boolean default false,
  notifications_enabled boolean default true,
  reminder_time integer default 1440
);

create table gift_categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table gift_groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table gifts (
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

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

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

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, updated_at)
  values (new.id, new.raw_user_meta_data->>'nickname', now());
  return new;
end;
$$;

-- Set up the trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 