-- Observation Log MVP schema (initial)

create table if not exists users (
  id text primary key,
  email text unique,
  display_name text not null default '',
  avatar_url text,
  timezone text not null default 'UTC',
  created_at text not null,
  updated_at text not null
);

create table if not exists projects (
  id text primary key,
  user_id text not null,
  name text not null,
  created_at text not null,
  updated_at text not null
);

create table if not exists tags (
  id text primary key,
  user_id text not null,
  name text not null,
  created_at text not null,
  updated_at text not null
);

create table if not exists observations (
  id text primary key,
  user_id text not null,
  title text not null,
  observation text not null,
  context_json text not null,
  interpretation text not null,
  next_action text not null,
  status text not null,
  confidence text not null,
  project_id text,
  created_at text not null,
  updated_at text not null
);

create table if not exists observation_tags (
  observation_id text not null,
  tag_id text not null,
  primary key (observation_id, tag_id)
);

create table if not exists attachments (
  id text primary key,
  observation_id text not null,
  file_url text not null,
  content_type text not null,
  meta_json text,
  created_at text not null
);

create table if not exists links (
  id text primary key,
  observation_id text not null,
  url text not null,
  title text,
  created_at text not null
);

create index if not exists idx_observations_user_updated on observations (user_id, updated_at desc);
create index if not exists idx_observations_user_status_updated on observations (user_id, status, updated_at desc);
create index if not exists idx_observations_user_project_updated on observations (user_id, project_id, updated_at desc);
create index if not exists idx_observation_tags_observation on observation_tags (observation_id, tag_id);
