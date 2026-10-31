create table if not exists usage_counters (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  period text not null,
  metric text not null,
  value bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key(workspace_id,period,metric)
);
create index if not exists usage_workspace_period_idx on usage_counters(workspace_id,period);
