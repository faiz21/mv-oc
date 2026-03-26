-- Migration 0016: Feedback Hub module

create table if not exists feedback (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  category            text not null check (category in ('idea', 'problem', 'request', 'general')),
  content             text not null check (char_length(content) >= 1 and char_length(content) <= 1000),
  status              text not null default 'received'
                      check (status in ('received', 'under_review', 'responded', 'closed')),
  response            text check (response is null or char_length(response) <= 2000),
  response_at         timestamptz,
  closed_reason       text check (closed_reason is null or char_length(closed_reason) <= 500),
  closed_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_feedback_user_id on feedback(user_id);
create index if not exists idx_feedback_status on feedback(status);
create index if not exists idx_feedback_category on feedback(category);
create index if not exists idx_feedback_created_at on feedback(created_at desc);

create table if not exists changelog (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (char_length(title) <= 200),
  description         text not null check (char_length(description) >= 1 and char_length(description) <= 2000),
  category            text,
  status              text not null default 'draft'
                      check (status in ('draft', 'published')),
  created_by          uuid not null references auth.users(id) on delete set null,
  published_by        uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  published_at        timestamptz
);

create index if not exists idx_changelog_status on changelog(status);
create index if not exists idx_changelog_published_at on changelog(published_at desc);

-- RLS
alter table feedback enable row level security;
alter table changelog enable row level security;

-- Feedback: users can see their own, admins see all
create policy "feedback_select_own" on feedback
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director'))
  );

-- Any authenticated user can insert feedback (anonymous = null user_id)
create policy "feedback_insert_all" on feedback
  for insert with check (
    auth.uid() = user_id or user_id is null
  );

-- Only admins can update feedback (status, response, closure)
create policy "feedback_update_admin" on feedback
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director'))
  );

-- Changelog: all authenticated users can read published entries
create policy "changelog_select_published" on changelog
  for select using (
    status = 'published'
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director'))
  );

-- Only admins can write changelog
create policy "changelog_write_admin" on changelog
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director'))
  );
