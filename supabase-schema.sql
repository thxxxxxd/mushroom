-- 在 Supabase SQL Editor 執行這個檔案來建立資料表
-- 如果已有舊資料表，先執行：
-- drop table if exists registrations;
-- drop table if exists events;

create table events (
  id uuid default gen_random_uuid() primary key,
  mushroom_name text not null,
  spots_needed integer not null,
  element text,
  coordinates text,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  nickname text not null,
  battle_power integer not null,
  created_at timestamptz default now()
);

-- 開放公開讀寫（不需要登入）
alter table events enable row level security;
alter table registrations enable row level security;

create policy "anyone can read events" on events for select using (true);
create policy "anyone can insert events" on events for insert with check (true);
create policy "anyone can delete events" on events for delete using (true);

create policy "anyone can read registrations" on registrations for select using (true);
create policy "anyone can insert registrations" on registrations for insert with check (true);
create policy "anyone can delete registrations" on registrations for delete using (true);

-- =============================================
-- Migration（若已有舊資料表，執行以下語句）：
-- alter table events add column if not exists expires_at timestamptz;
-- alter table registrations drop column if exists expires_at;
-- create policy "anyone can delete registrations" on registrations for delete using (true);
-- create policy "anyone can delete events" on events for delete using (true);
-- =============================================
