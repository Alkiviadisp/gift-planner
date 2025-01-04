-- Enable RLS (Row Level Security)
alter table profiles enable row level security;

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  nickname text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  
  -- Calendar Integration Fields
  google_calendar_refresh_token text,
  google_calendar_access_token text,
  google_calendar_token_expiry timestamp with time zone,
  apple_calendar_sync_enabled boolean default false,
  calendar_preferences jsonb default '{"notifications": {"enabled": false, "beforeEvent": 60}}'::jsonb,
  
  constraint email_unique unique(email)
);

-- Create RLS policies
create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Create function to handle new user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, nickname)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'nickname'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 