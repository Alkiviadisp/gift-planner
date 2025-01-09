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

-- Create subscription_tiers table
create table if not exists subscription_tiers (
  id text primary key,  -- 'free', 'pro', 'admin'
  name text not null,
  description text,
  features jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default subscription tiers
insert into subscription_tiers (id, name, description, features) values
  ('free', 'Free', 'Basic features for personal use', '{"max_gifts": 10, "max_groups": 3, "max_categories": 5}'::jsonb),
  ('pro', 'Pro', 'Advanced features for power users', '{"max_gifts": 1000, "max_groups": 100, "max_categories": 50, "advanced_analytics": true, "priority_support": true}'::jsonb),
  ('admin', 'Admin', 'Administrative access', '{"max_gifts": -1, "max_groups": -1, "max_categories": -1, "admin_panel": true, "user_management": true}'::jsonb)
on conflict (id) do nothing;

-- Create profiles table
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
  calendar_preferences jsonb default '{"notifications": {"enabled": false, "beforeEvent": 60}}'::jsonb,
  subscription_tier text references subscription_tiers(id) default 'free' not null,
  subscription_start_date timestamp with time zone default timezone('utc'::text, now()),
  subscription_end_date timestamp with time zone
);

-- Create subscription_history table
create table if not exists subscription_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  old_tier text references subscription_tiers(id),
  new_tier text references subscription_tiers(id) not null,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  changed_by uuid references auth.users on delete set null,  -- Who made the change (null for automatic changes)
  reason text,  -- Reason for the change
  metadata jsonb  -- Additional metadata about the change
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
alter table subscription_tiers enable row level security;
alter table subscription_history enable row level security;

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

-- Create policies for all tables
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

-- Subscription related policies
create policy "Anyone can view subscription tiers"
  on subscription_tiers for select
  using (true);

create policy "Only admins can modify subscription tiers"
  on subscription_tiers for all
  using (
    auth.uid() in (
      select id from profiles where subscription_tier = 'admin'
    )
  )
  with check (
    auth.uid() in (
      select id from profiles where subscription_tier = 'admin'
    )
  );

create policy "Users can view their own subscription history"
  on subscription_history for select
  using ( auth.uid() = user_id );

create policy "Only admins can insert subscription history"
  on subscription_history for insert
  with check (
    auth.uid() in (
      select id from profiles where subscription_tier = 'admin'
    )
  );

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    nickname,
    subscription_tier,
    subscription_start_date
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nickname',
    'free',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create function to check subscription limits
create or replace function check_subscription_limits(
  user_id uuid,
  limit_type text,  -- 'gifts', 'groups', or 'categories'
  current_count integer
)
returns boolean
language plpgsql
security definer
as $$
declare
  user_tier text;
  tier_limits jsonb;
  max_items integer;
begin
  -- Get user's subscription tier and limits
  select p.subscription_tier, st.features
  into user_tier, tier_limits
  from profiles p
  join subscription_tiers st on st.id = p.subscription_tier
  where p.id = user_id;

  -- Get max items for the specific limit type
  max_items := (tier_limits->>'max_' || limit_type)::integer;

  -- -1 means unlimited
  if max_items = -1 then
    return true;
  end if;

  -- Check if current count is within limits
  return current_count < max_items;
end;
$$;

-- Triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create updated_at triggers for all relevant tables
drop trigger if exists handle_updated_at on gift_categories;
create trigger handle_updated_at
  before update on gift_categories
  for each row execute procedure handle_updated_at();

drop trigger if exists handle_updated_at on gift_groups;
create trigger handle_updated_at
  before update on gift_groups
  for each row execute procedure handle_updated_at();

drop trigger if exists handle_updated_at on gifts;
create trigger handle_updated_at
  before update on gifts
  for each row execute procedure handle_updated_at(); 