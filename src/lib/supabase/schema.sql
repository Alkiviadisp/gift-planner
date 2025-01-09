-- Step 1: Drop everything in reverse dependency order
do $$ 
begin
  -- Drop triggers
  drop trigger if exists on_auth_user_created on auth.users;
  drop trigger if exists handle_updated_at on gift_categories;
  drop trigger if exists handle_updated_at on gift_groups;
  drop trigger if exists handle_updated_at on gifts;
  drop trigger if exists handle_updated_at on mailbox_notifications;

  -- Drop functions
  drop function if exists public.handle_new_user() cascade;
  drop function if exists public.handle_updated_at() cascade;
  drop function if exists public.lookup_user_by_email(lookup_email text) cascade;
  drop function if exists public.send_notification(p_user_id uuid, p_title text, p_message text, p_type text, p_priority text, p_category text, p_requires_action boolean, p_action_url text, p_action_text text, p_metadata jsonb) cascade;
  drop function if exists public.mark_notification_read(p_notification_id uuid) cascade;
  drop function if exists public.archive_notification(p_notification_id uuid) cascade;
  drop function if exists public.get_unread_notification_count(p_user_id uuid) cascade;

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
  drop table if exists mailbox_notifications cascade;
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
  nickname text default 'User' not null,
  avatar_url text,  -- Changed from valid_url to text to be more flexible
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

-- First, drop the existing gift_groups table
drop table if exists gift_groups cascade;

-- Create the gift_groups table with the correct structure
create table if not exists gift_groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  occasion text not null,
  date timestamp with time zone not null,
  price decimal(10,2) not null check (price > 0),
  product_url text,
  product_image_url text,
  comments text,
  participants text[] default '{}',
  color text check (color ~* '^#[A-Fa-f0-9]{6}$'),  -- Validate hex color format
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_gift_groups_user_id on gift_groups(user_id);
create index if not exists idx_gift_groups_created_at on gift_groups(created_at desc);

-- Enable RLS
alter table gift_groups enable row level security;

-- Create RLS policies
create policy "Users can view their own gift groups"
  on gift_groups for select
  using (auth.uid() = user_id);

create policy "Users can create their own gift groups"
  on gift_groups for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own gift groups"
  on gift_groups for update
  using (auth.uid() = user_id);

create policy "Users can delete their own gift groups"
  on gift_groups for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
drop trigger if exists handle_updated_at on gift_groups;
create trigger handle_updated_at
  before update on gift_groups
  for each row
  execute function public.handle_updated_at();

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
  -- Drop existing profile policies
  drop policy if exists "Profiles are viewable by everyone" on profiles;
  drop policy if exists "Users can manage their own profile" on profiles;
  drop policy if exists "Users can view their own profile" on profiles;
  drop policy if exists "Users can insert their own profile" on profiles;
  drop policy if exists "Users can update their own profile" on profiles;
  drop policy if exists "Users can delete their own profile" on profiles;

  -- Create new profile policies with more permissive rules
  create policy "Users can view their own profile"
    on profiles for select
    using (auth.uid() = id OR auth.role() = 'service_role');

  create policy "Users can insert their own profile"
    on profiles for insert
    with check (auth.uid() = id OR auth.role() = 'service_role');

  create policy "Users can update their own profile"
    on profiles for update
    using (auth.uid() = id OR auth.role() = 'service_role');

  create policy "Users can delete their own profile"
    on profiles for delete
    using (auth.uid() = id OR auth.role() = 'service_role');

  -- Drop existing gift category policies
  drop policy if exists "Users can manage their own gift categories" on gift_categories;
  
  -- Create separate policies for gift categories
  create policy "Users can view their own gift categories"
    on gift_categories for select
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can create their own gift categories"
    on gift_categories for insert
    with check (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can update their own gift categories"
    on gift_categories for update
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can delete their own gift categories"
    on gift_categories for delete
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  -- Drop existing gift groups policies
  drop policy if exists "Users can manage their own gift groups" on gift_groups;
  
  -- Create separate policies for gift groups
  create policy "Users can view their own gift groups"
    on gift_groups for select
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can create their own gift groups"
    on gift_groups for insert
    with check (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can update their own gift groups"
    on gift_groups for update
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can delete their own gift groups"
    on gift_groups for delete
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  -- Drop existing gifts policies
  drop policy if exists "Users can manage their own gifts" on gifts;
  
  -- Create separate policies for gifts
  create policy "Users can view their own gifts"
    on gifts for select
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can create their own gifts"
    on gifts for insert
    with check (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can update their own gifts"
    on gifts for update
    using (auth.uid() = user_id OR auth.role() = 'service_role');

  create policy "Users can delete their own gifts"
    on gifts for delete
    using (auth.uid() = user_id OR auth.role() = 'service_role');
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
begin
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
    created_at,
    subscription_tier,
    subscription_start_date
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1), 'User'),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    false,
    null,
    false,
    true,
    1440,
    now(),
    'free',  -- Default subscription tier
    now()    -- Subscription start date
  );
  return new;
end;
$$;

-- Create trigger for new user creation
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

-- Add better constraints and indexes to profiles table
alter table profiles
  add constraint nickname_length check (char_length(nickname) between 1 and 50),
  add constraint reminder_time_range check (reminder_time between 1 and 10080), -- 1 minute to 1 week
  alter column updated_at set default now(),
  alter column created_at set default now();

-- Add useful indexes
create index if not exists profiles_user_lookup_idx on profiles (nickname, avatar_url);
create index if not exists profiles_notification_idx on profiles (notifications_enabled, reminder_time)
  where notifications_enabled = true;

-- Add trigger for automatic updated_at
create trigger set_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column(); 

-- Enable RLS on backup tables
alter table if exists public.profiles_backup enable row level security;
alter table if exists public.gift_categories_backup enable row level security;
alter table if exists public.gift_groups_backup enable row level security;
alter table if exists public.gifts_backup enable row level security;

-- Create policies for backup tables
do $$ 
begin
  -- Profiles backup policies
  drop policy if exists "Only service role can access profiles backup" on profiles_backup;
  create policy "Only service role can access profiles backup"
    on profiles_backup
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

  -- Gift categories backup policies
  drop policy if exists "Only service role can access gift categories backup" on gift_categories_backup;
  create policy "Only service role can access gift categories backup"
    on gift_categories_backup
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

  -- Gift groups backup policies
  drop policy if exists "Only service role can access gift groups backup" on gift_groups_backup;
  create policy "Only service role can access gift groups backup"
    on gift_groups_backup
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

  -- Gifts backup policies
  drop policy if exists "Only service role can access gifts backup" on gifts_backup;
  create policy "Only service role can access gifts backup"
    on gifts_backup
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
end $$; 

-- Create mailbox notifications table
create table if not exists public.mailbox_notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null default 'info',
    status text not null default 'unread',
    priority text not null default 'normal',
    category text,
    requires_action boolean default false,
    action_url text,
    action_text text,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    read_at timestamp with time zone,
    archived_at timestamp with time zone
);

-- Add indexes for better performance
create index if not exists idx_notifications_user_id on public.mailbox_notifications(user_id);
create index if not exists idx_notifications_status on public.mailbox_notifications(status);
create index if not exists idx_notifications_created_at on public.mailbox_notifications(created_at);

-- Enable RLS
alter table public.mailbox_notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view their own notifications"
    on public.mailbox_notifications for select
    using (auth.uid() = user_id);

-- Users can update their own notifications
create policy "Users can update their own notifications"
    on public.mailbox_notifications for update
    using (auth.uid() = user_id);

-- Only service role can create notifications
create policy "Service role can create notifications"
    on public.mailbox_notifications for insert
    to service_role
    with check (true);

-- Function to send notification
create or replace function public.send_notification(
    p_user_id uuid,
    p_title text,
    p_message text,
    p_type text default 'info',
    p_priority text default 'normal',
    p_category text default null,
    p_requires_action boolean default false,
    p_action_url text default null,
    p_action_text text default null,
    p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
    v_notification_id uuid;
begin
    insert into public.mailbox_notifications (
        user_id,
        title,
        message,
        type,
        priority,
        category,
        requires_action,
        action_url,
        action_text,
        metadata
    )
    values (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_priority,
        p_category,
        p_requires_action,
        p_action_url,
        p_action_text,
        p_metadata
    )
    returning id into v_notification_id;

    return v_notification_id;
end;
$$;

-- Function to mark notification as read
create or replace function public.mark_notification_read(
    p_notification_id uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
    update public.mailbox_notifications
    set
        status = 'read',
        read_at = now(),
        updated_at = now()
    where id = p_notification_id
    and auth.uid() = user_id;
end;
$$;

-- Function to archive notification
create or replace function public.archive_notification(
    p_notification_id uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
    update public.mailbox_notifications
    set
        status = 'archived',
        archived_at = now(),
        updated_at = now()
    where id = p_notification_id
    and auth.uid() = user_id;
end;
$$;

-- Function to get unread notification count
create or replace function public.get_unread_notification_count(
    p_user_id uuid
)
returns bigint
language plpgsql
security definer set search_path = public
as $$
declare
    v_count bigint;
begin
    select count(*)
    into v_count
    from public.mailbox_notifications
    where user_id = p_user_id
    and status = 'unread';

    return v_count;
end;
$$; 

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

-- Add subscription fields to profiles table
alter table if not exists profiles 
  add column if not exists subscription_tier text references subscription_tiers(id) default 'free' not null,
  add column if not exists subscription_start_date timestamp with time zone default timezone('utc'::text, now()),
  add column if not exists subscription_end_date timestamp with time zone;

-- Create subscription_history table for tracking changes
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

-- Enable RLS on new tables
alter table subscription_history enable row level security;

-- Create policies for subscription_history
create policy "Users can view their own subscription history"
  on subscription_history for select
  using (auth.uid() = user_id);

create policy "Only admins can insert subscription history"
  on subscription_history for insert
  with check (auth.uid() in (
    select p.id from profiles p where p.subscription_tier = 'admin'
  ));

create policy "Only admins can update subscription history"
  on subscription_history for update
  using (auth.uid() in (
    select p.id from profiles p where p.subscription_tier = 'admin'
  ));

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