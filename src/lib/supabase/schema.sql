-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create tables
create table if not exists subscription_tiers (
  id text primary key,
  name text not null,
  description text,
  features jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Insert initial subscription tiers
INSERT INTO subscription_tiers (id, name, description, features) VALUES
('free', 'Free', 'Basic features for personal use', '{"max_gifts": 10, "max_groups": 3}'::jsonb),
('premium', 'Premium', 'Advanced features for power users', '{"max_gifts": 100, "max_groups": 20, "premium_features": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create predefined_categories table
CREATE TABLE IF NOT EXISTS predefined_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT predefined_categories_name_key UNIQUE (name)
);

create table if not exists profiles (
  id uuid primary key not null,
  email text,
  nickname text not null default 'User'::text,
  avatar_url text,
  subscription_tier text not null default 'free'::text,
  subscription_end_date timestamp with time zone,
  google_calendar_refresh_token text,
  subscription_start_date timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  reminder_time integer not null default 1440,
  notifications_enabled boolean not null default true,
  apple_calendar_enabled boolean not null default false,
  google_calendar_enabled boolean not null default false,
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists profiles_backup (
  id uuid,
  nickname text,
  avatar_url text,
  google_calendar_refresh_token text,
  reminder_time integer,
  notifications_enabled boolean,
  apple_calendar_enabled boolean,
  google_calendar_enabled boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

create table if not exists gift_categories (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null,
  name text not null,
  description text,
  color text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists gift_categories_backup (
  id uuid,
  user_id uuid,
  name text,
  description text,
  color text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

create table if not exists gift_groups (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null,
  name text not null,
  title text not null,
  description text not null,
  occasion text not null,
  amount numeric not null,
  price numeric not null,
  currency text not null default 'EUR'::text,
  date timestamp with time zone not null default now(),
  color text default 'blue'::text,
  image_url text,
  product_url text,
  product_image_url text,
  comments text,
  participants text[] default '{}'::text[],
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists gift_groups_backup (
  id uuid,
  user_id uuid,
  title text,
  occasion text,
  date timestamp with time zone,
  price numeric,
  product_url text,
  product_image_url text,
  comments text,
  participants text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

create table if not exists group_participants (
  id uuid not null default gen_random_uuid() primary key,
  group_id uuid not null,
  user_id uuid,
  email text not null,
  participation_status text default 'pending'::text,
  contribution_amount numeric default 0,
  agreed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists gifts (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null,
  category_id uuid not null,
  name text not null,
  description text,
  recipient text not null,
  recipient_email text,
  price numeric,
  url text,
  image_url text,
  is_purchased boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists gifts_backup (
  id uuid,
  user_id uuid,
  category_id uuid,
  name text,
  description text,
  recipient text,
  recipient_email text,
  price numeric,
  url text,
  image_url text,
  is_purchased boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

create table if not exists gift_invitations (
  id uuid not null default uuid_generate_v4() primary key,
  group_id uuid not null,
  inviter_id uuid not null,
  invitee_email text not null,
  notification_id uuid,
  status text default 'pending'::text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists notifications (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid,
  group_id uuid,
  type text not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists mailbox_notifications (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null,
  title text not null,
  message text not null,
  category text not null,
  type text default 'info'::text,
  priority text default 'medium'::text,
  status text default 'active'::text,
  requires_action boolean default false,
  action_text text,
  action_url text,
  metadata jsonb default '{}'::jsonb,
  read_at timestamp with time zone,
  archived_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists subscription_history (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null,
  old_tier text,
  new_tier text not null,
  changed_by uuid,
  reason text,
  metadata jsonb,
  changed_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Add foreign key constraints
alter table profiles add constraint profiles_subscription_tier_fkey 
  foreign key (subscription_tier) references subscription_tiers(id);

alter table gift_categories add constraint gift_categories_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table gift_groups add constraint gift_groups_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table group_participants add constraint group_participants_group_id_fkey 
  foreign key (group_id) references gift_groups(id) on delete cascade;

alter table group_participants add constraint group_participants_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete set null;

alter table gifts add constraint gifts_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table gifts add constraint gifts_category_id_fkey 
  foreign key (category_id) references gift_categories(id) on delete cascade;

alter table gift_invitations add constraint gift_invitations_group_id_fkey 
  foreign key (group_id) references gift_groups(id) on delete cascade;

alter table gift_invitations add constraint gift_invitations_inviter_id_fkey 
  foreign key (inviter_id) references auth.users(id) on delete cascade;

alter table notifications add constraint notifications_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table notifications add constraint notifications_group_id_fkey 
  foreign key (group_id) references gift_groups(id) on delete cascade;

alter table mailbox_notifications add constraint mailbox_notifications_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table subscription_history add constraint subscription_history_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table subscription_history add constraint subscription_history_changed_by_fkey 
  foreign key (changed_by) references auth.users(id) on delete set null;

alter table subscription_history add constraint subscription_history_old_tier_fkey 
  foreign key (old_tier) references subscription_tiers(id);

alter table subscription_history add constraint subscription_history_new_tier_fkey 
  foreign key (new_tier) references subscription_tiers(id);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table gift_categories enable row level security;
alter table gift_groups enable row level security;
alter table group_participants enable row level security;
alter table gifts enable row level security;
alter table gift_invitations enable row level security;
alter table notifications enable row level security;
alter table mailbox_notifications enable row level security;
alter table subscription_tiers enable row level security;
alter table subscription_history enable row level security;
alter table predefined_categories enable row level security;

-- Create policies
CREATE POLICY IF NOT EXISTS "Allow public read access to predefined_categories" ON predefined_categories
    FOR SELECT USING (true);

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT countries_code_key UNIQUE (code)
);

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT currencies_code_key UNIQUE (code)
);

-- Enable RLS for new tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY IF NOT EXISTS "Allow public read access to countries" ON countries
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access to currencies" ON currencies
    FOR SELECT USING (true);

-- Insert countries
INSERT INTO countries (code, name, flag_emoji) VALUES
('US', 'United States', '🇺🇸'),
('GB', 'United Kingdom', '🇬🇧'),
('CA', 'Canada', '🇨🇦'),
('AU', 'Australia', '🇦🇺'),
('DE', 'Germany', '🇩🇪'),
('FR', 'France', '🇫🇷'),
('IT', 'Italy', '🇮🇹'),
('ES', 'Spain', '🇪🇸'),
('JP', 'Japan', '🇯🇵'),
('CN', 'China', '🇨🇳'),
('IN', 'India', '🇮🇳'),
('BR', 'Brazil', '🇧🇷'),
('MX', 'Mexico', '🇲🇽'),
('NL', 'Netherlands', '🇳🇱'),
('SE', 'Sweden', '🇸🇪'),
('NO', 'Norway', '🇳🇴'),
('DK', 'Denmark', '🇩🇰'),
('FI', 'Finland', '🇫🇮'),
('NZ', 'New Zealand', '🇳🇿'),
('SG', 'Singapore', '🇸🇬'),
('GR', 'Greece', '🇬🇷')
ON CONFLICT (code) DO NOTHING;

-- Insert currencies
INSERT INTO currencies (code, name, symbol) VALUES
('USD', 'US Dollar', '$'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£'),
('CAD', 'Canadian Dollar', 'C$'),
('AUD', 'Australian Dollar', 'A$'),
('JPY', 'Japanese Yen', '¥'),
('CNY', 'Chinese Yuan', '¥'),
('INR', 'Indian Rupee', '₹'),
('BRL', 'Brazilian Real', 'R$'),
('MXN', 'Mexican Peso', '$'),
('CHF', 'Swiss Franc', 'Fr'),
('SEK', 'Swedish Krona', 'kr'),
('NOK', 'Norwegian Krone', 'kr'),
('DKK', 'Danish Krone', 'kr'),
('NZD', 'New Zealand Dollar', 'NZ$'),
('SGD', 'Singapore Dollar', 'S$')
ON CONFLICT (code) DO NOTHING;

-- Insert categories
INSERT INTO predefined_categories (name, icon, description, color, is_active) VALUES
('Electronics', '🔌', 'Gadgets, devices, and tech accessories', '#007AFF', true),
('Books & Media', '📚', 'Books, e-books, movies, and music', '#FF2D55', true),
('Fashion', '👕', 'Clothing, accessories, and jewelry', '#AF52DE', true),
('Home & Living', '🏠', 'Home decor, furniture, and kitchen items', '#5856D6', true),
('Sports & Outdoors', '⚽', 'Sports equipment and outdoor gear', '#34C759', true),
('Beauty & Health', '💄', 'Cosmetics, skincare, and wellness products', '#FF9500', true),
('Toys & Games', '🎮', 'Board games, video games, and toys', '#FF3B30', true),
('Art & Crafts', '🎨', 'Art supplies and handmade items', '#5856D6', true),
('Food & Drinks', '🍷', 'Gourmet food, beverages, and treats', '#FF9500', true),
('Travel & Experiences', '✈️', 'Travel gear and experience gifts', '#007AFF', true),
('Pets', '🐾', 'Pet supplies and accessories', '#34C759', true),
('Music & Instruments', '🎸', 'Musical instruments and accessories', '#FF2D55', true),
('Garden & Plants', '🌿', 'Gardening tools and plants', '#34C759', true),
('Stationery', '✏️', 'Writing supplies and paper goods', '#5856D6', true),
('Collectibles', '🏆', 'Rare items and memorabilia', '#FF9500', true)
ON CONFLICT (name) DO NOTHING;