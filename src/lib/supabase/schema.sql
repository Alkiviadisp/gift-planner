-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS predefined_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;

-- Create subscription_tiers table first
CREATE TABLE subscription_tiers (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    features jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert subscription tiers BEFORE creating profiles table
INSERT INTO subscription_tiers (id, name, description, features) VALUES
('free', 'Free', 'Basic features for personal use', '{"max_gifts": 10, "max_groups": 3}'::jsonb),
('premium', 'Premium', 'Advanced features for power users', '{"max_gifts": 100, "max_groups": 20, "premium_features": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Recreate profiles table with simpler constraints
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    nickname text DEFAULT 'User',
    subscription_tier text DEFAULT 'free' REFERENCES subscription_tiers(id),
    country varchar NULL,
    currency varchar NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Set up RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Enable read for authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Enable update for users"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for service role"
    ON profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Enable all for service role"
    ON profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create countries table
CREATE TABLE countries (
    code varchar NOT NULL PRIMARY KEY,
    name varchar NOT NULL,
    flag_emoji varchar NOT NULL,
    is_active boolean DEFAULT true
);

-- Create currencies table
CREATE TABLE currencies (
    code varchar NOT NULL PRIMARY KEY,
    name varchar NOT NULL,
    symbol varchar NOT NULL,
    is_active boolean DEFAULT true
);

-- Create predefined_categories table
CREATE TABLE predefined_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    icon text NOT NULL,
    description text,
    color text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create user_interests table
CREATE TABLE user_interests (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES predefined_categories(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, category_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Insert predefined categories
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

-- Insert countries
INSERT INTO countries (code, name, flag_emoji, is_active) VALUES
('US', 'United States', '🇺🇸', true),
('GB', 'United Kingdom', '🇬🇧', true),
('CA', 'Canada', '🇨🇦', true),
('AU', 'Australia', '🇦🇺', true),
('DE', 'Germany', '🇩🇪', true),
('FR', 'France', '🇫🇷', true),
('IT', 'Italy', '🇮🇹', true),
('ES', 'Spain', '🇪🇸', true),
('JP', 'Japan', '🇯🇵', true),
('CN', 'China', '🇨🇳', true),
('BR', 'Brazil', '🇧🇷', true),
('IN', 'India', '🇮🇳', true),
('RU', 'Russia', '🇷🇺', true),
('ZA', 'South Africa', '🇿🇦', true),
('MX', 'Mexico', '🇲🇽', true),
('AR', 'Argentina', '🇦🇷', true),
('NL', 'Netherlands', '🇳🇱', true),
('SE', 'Sweden', '🇸🇪', true),
('NO', 'Norway', '🇳🇴', true),
('DK', 'Denmark', '🇩🇰', true)
ON CONFLICT (code) DO NOTHING;

-- Insert currencies
INSERT INTO currencies (code, name, symbol, is_active) VALUES
('USD', 'US Dollar', '$', true),
('EUR', 'Euro', '€', true),
('GBP', 'British Pound', '£', true),
('JPY', 'Japanese Yen', '¥', true),
('AUD', 'Australian Dollar', 'A$', true),
('CAD', 'Canadian Dollar', 'C$', true),
('CHF', 'Swiss Franc', 'Fr', true),
('CNY', 'Chinese Yuan', '¥', true),
('INR', 'Indian Rupee', '₹', true),
('BRL', 'Brazilian Real', 'R$', true),
('RUB', 'Russian Ruble', '₽', true),
('ZAR', 'South African Rand', 'R', true),
('MXN', 'Mexican Peso', '$', true),
('ARS', 'Argentine Peso', '$', true),
('SEK', 'Swedish Krona', 'kr', true),
('NOK', 'Norwegian Krone', 'kr', true),
('DKK', 'Danish Krone', 'kr', true),
('NZD', 'New Zealand Dollar', 'NZ$', true),
('SGD', 'Singapore Dollar', 'S$', true),
('HKD', 'Hong Kong Dollar', 'HK$', true)
ON CONFLICT (code) DO NOTHING;