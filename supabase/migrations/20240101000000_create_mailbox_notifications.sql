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
create index idx_notifications_user_id on public.mailbox_notifications(user_id);
create index idx_notifications_status on public.mailbox_notifications(status);
create index idx_notifications_created_at on public.mailbox_notifications(created_at);

-- Enable RLS
alter table public.mailbox_notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view their own notifications"
    on public.mailbox_notifications for select
    using (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
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
security definer
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
security definer
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
security definer
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
security definer
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