-- Production-oriented Postgres schema sketch. Not required by the zero-dependency prototype.
create extension if not exists pgcrypto;

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('owner','admin','agent','viewer')),
  primary key(workspace_id,user_id)
);
create table channel_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  encrypted_access_token text,
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  unique(workspace_id,provider,provider_account_id)
);
create table contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  provider_user_id text,
  name text,
  email text,
  phone text,
  status text not null default 'subscribed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,provider,provider_user_id)
);
create index contacts_workspace_idx on contacts(workspace_id,updated_at desc);
create table tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  unique(workspace_id,name)
);
create table contact_tags (
  contact_id uuid not null references contacts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key(contact_id,tag_id)
);
create table automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  status text not null check(status in ('draft','live','paused')) default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table flow_nodes (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  node_key text not null,
  kind text not null,
  position_x integer not null default 0,
  position_y integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  unique(automation_id,node_key)
);
create table flow_edges (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  source_key text not null,
  target_key text not null,
  label text,
  unique(automation_id,source_key,target_key,label)
);
create table conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  provider text not null,
  assigned_user_id uuid references users(id),
  automation_paused_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  provider_message_id text,
  direction text not null check(direction in ('inbound','outbound')),
  sender_type text not null check(sender_type in ('contact','automation','agent')),
  body jsonb not null,
  status text,
  created_at timestamptz not null default now(),
  unique(workspace_id,provider_message_id)
);
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider,provider_event_id)
);
create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  provider text not null,
  segment_query jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  scheduled_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
