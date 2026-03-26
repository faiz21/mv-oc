-- Migration 20260326000011: Feedback Hub
-- Tables: feedback, pulse_surveys, survey_responses, pulse_survey_summaries, changelog

-- ─────────────────────────────────────────────
-- feedback
-- ─────────────────────────────────────────────
create table if not exists feedback (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id),  -- nullable = anonymous
  category         text not null
                   check (category in ('idea', 'problem', 'request', 'general')),
  content          text not null,
  status           text not null default 'received'
                   check (status in ('received', 'under_review', 'responded', 'closed')),
  response         text,
  response_at      timestamptz,
  closed_reason    text,
  closed_at        timestamptz,
  related_changelog uuid[] default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "feedback_insert_all"
  on feedback for insert
  with check (true);  -- anyone can submit (including anonymous)

create policy "feedback_select_own"
  on feedback for select
  using (user_id = auth.uid());

create policy "feedback_admin_all"
  on feedback for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- pulse_surveys
-- ─────────────────────────────────────────────
create table if not exists pulse_surveys (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  questions   jsonb not null,
  status      text not null default 'draft'
              check (status in ('draft', 'published', 'closed')),
  created_by  uuid not null references profiles(id),
  sent_at     timestamptz,
  closes_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table pulse_surveys enable row level security;

create policy "pulse_surveys_published_select"
  on pulse_surveys for select
  using (
    status = 'published'
    or exists (select 1 from profiles where id = auth.uid() and role in ('director', 'admin'))
  );

create policy "pulse_surveys_admin_all"
  on pulse_surveys for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- survey_responses (intentionally anonymous — no user_id)
-- ─────────────────────────────────────────────
create table if not exists survey_responses (
  id         uuid primary key default gen_random_uuid(),
  survey_id  uuid not null references pulse_surveys(id) on delete cascade,
  answers    jsonb not null,
  created_at timestamptz not null default now()
);

alter table survey_responses enable row level security;

create policy "survey_responses_insert_authenticated"
  on survey_responses for insert
  with check (auth.uid() is not null);

-- No select policy for regular users — admin only
create policy "survey_responses_admin_all"
  on survey_responses for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- pulse_survey_summaries
-- ─────────────────────────────────────────────
create table if not exists pulse_survey_summaries (
  id               uuid primary key default gen_random_uuid(),
  survey_id        uuid not null references pulse_surveys(id) on delete cascade,
  summary_markdown text not null,
  status           text not null default 'draft'
                   check (status in ('draft', 'awaiting_approval', 'published', 'rejected')),
  artifact_id      uuid references artifacts(id),
  created_by       uuid references profiles(id),
  approved_by      uuid references profiles(id),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table pulse_survey_summaries enable row level security;

create policy "pulse_survey_summaries_published_select"
  on pulse_survey_summaries for select
  using (
    status = 'published'
    or exists (select 1 from profiles where id = auth.uid() and role in ('director', 'admin'))
  );

create policy "pulse_survey_summaries_admin_all"
  on pulse_survey_summaries for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- changelog
-- ─────────────────────────────────────────────
create table if not exists changelog (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text not null,
  status           text not null default 'draft'
                   check (status in ('draft', 'published')),
  created_by       uuid not null references profiles(id),
  published_by     uuid references profiles(id),
  related_feedback uuid[] default '{}',
  category         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz
);

alter table changelog enable row level security;

create policy "changelog_published_select"
  on changelog for select
  using (
    status = 'published'
    or exists (select 1 from profiles where id = auth.uid() and role in ('director', 'admin'))
  );

create policy "changelog_admin_all"
  on changelog for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
