-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS predefined_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS gift_categories CASCADE;
DROP TABLE IF EXISTS gift_groups CASCADE;
DROP TABLE IF EXISTS group_participants CASCADE;
DROP TABLE IF EXISTS gifts CASCADE;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create reference tables first
CREATE TABLE countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    flag_emoji TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE predefined_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Grant select on reference tables
GRANT SELECT ON countries TO anon;
GRANT SELECT ON countries TO authenticated;
GRANT SELECT ON currencies TO anon;
GRANT SELECT ON currencies TO authenticated;
GRANT SELECT ON predefined_categories TO anon;
GRANT SELECT ON predefined_categories TO authenticated;

-- Enable RLS on reference tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for reference tables
CREATE POLICY "Allow public read access for countries"
    ON countries FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access for currencies"
    ON currencies FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access for predefined_categories"
    ON predefined_categories FOR SELECT
    USING (true);

-- Insert reference data
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
    ('DK', 'Denmark', '🇩🇰', true);

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
    ('HKD', 'Hong Kong Dollar', 'HK$', true);

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
    ('Collectibles', '🏆', 'Rare items and memorabilia', '#FF9500', true);

-- Create gift categories table
CREATE TABLE gift_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access to gift_categories
GRANT ALL ON gift_categories TO authenticated;

-- Enable RLS on gift_categories
ALTER TABLE gift_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for gift_categories
CREATE POLICY "Users can manage their own gift categories"
    ON gift_categories FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    avatar_url TEXT,
    country TEXT REFERENCES countries(code),
    currency TEXT REFERENCES currencies(code),
    google_calendar_enabled BOOLEAN DEFAULT false,
    google_calendar_refresh_token TEXT,
    apple_calendar_enabled BOOLEAN DEFAULT false,
    notifications_enabled BOOLEAN DEFAULT true,
    reminder_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions on profiles
GRANT ALL ON profiles TO authenticated;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create user interests table
CREATE TABLE user_interests (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES predefined_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, category_id)
);

-- Grant select on user interests
GRANT SELECT ON user_interests TO anon;
GRANT SELECT ON user_interests TO authenticated;

-- Enable RLS on user interests
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Create policy for user interests
CREATE POLICY "Users can view their own interests"
    ON user_interests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests"
    ON user_interests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access to notifications
GRANT SELECT, UPDATE ON notifications TO authenticated;

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = p_user_id AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- Create gift groups table
CREATE TABLE gift_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions on gift_groups
GRANT ALL ON gift_groups TO authenticated;

-- Enable RLS on gift_groups
ALTER TABLE gift_groups ENABLE ROW LEVEL SECURITY;

-- Create group participants table
CREATE TABLE group_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES gift_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    participation_status TEXT NOT NULL CHECK (participation_status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id),
    UNIQUE(group_id, email)
);

-- Grant permissions on group_participants
GRANT ALL ON group_participants TO authenticated;

-- Enable RLS on group_participants
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

-- Create minimal policies that don't create circular dependencies
CREATE POLICY "Users can manage their own groups"
    ON gift_groups FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own participations"
    ON group_participants FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group owners can manage participants"
    ON group_participants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM gift_groups
            WHERE gift_groups.id = group_id
            AND gift_groups.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM gift_groups
            WHERE gift_groups.id = group_id
            AND gift_groups.user_id = auth.uid()
        )
    );

-- Create gifts table
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES gift_categories(id) ON DELETE CASCADE,
    recipient TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL,
    url TEXT,
    image_url TEXT,
    is_purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access to gifts
GRANT ALL ON gifts TO authenticated;

-- Enable RLS on gifts
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Create policy for gifts
CREATE POLICY "Users can manage their own gifts"
    ON gifts FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();