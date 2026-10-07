-- Family Wizard Clone — database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Households: the shared "family" workspace that co-parents belong to.
-- ---------------------------------------------------------------------------
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Family',
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null default '#2563eb',
  role text not null default 'parent' check (role in ('parent', 'guardian', 'other')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Calendar & custody schedule
-- ---------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  description text,
  category text not null default 'general' check (category in ('custody', 'school', 'medical', 'activity', 'general')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  responsible_member_id uuid references household_members(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Messaging (kept-on-record parent-to-parent communication)
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Expense tracking & reimbursement
-- ---------------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  description text not null,
  category text not null default 'other' check (category in ('medical', 'school', 'activity', 'clothing', 'childcare', 'other')),
  amount_cents bigint not null check (amount_cents >= 0),
  paid_by_member_id uuid not null references household_members(id),
  incurred_on date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now()
);

create table if not exists expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  share_cents bigint not null check (share_cents >= 0),
  status text not null default 'owed' check (status in ('owed', 'paid')),
  paid_at timestamptz,
  unique (expense_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Info bank: contacts & documents
-- ---------------------------------------------------------------------------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  role text not null default 'other' check (role in ('doctor', 'school', 'emergency', 'caregiver', 'other')),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  title text not null,
  storage_path text not null,
  category text not null default 'other' check (category in ('legal', 'medical', 'school', 'other')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Planning: the parenting plan & longer-term notes/goals
-- ---------------------------------------------------------------------------
create table if not exists plan_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  body text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table households enable row level security;
alter table household_members enable row level security;
alter table children enable row level security;
alter table events enable row level security;
alter table messages enable row level security;
alter table expenses enable row level security;
alter table expense_shares enable row level security;
alter table contacts enable row level security;
alter table documents enable row level security;
alter table plan_notes enable row level security;

create or replace function is_household_member(h_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = h_id and user_id = auth.uid()
  );
$$;

create policy "members read own household" on households
  for select using (is_household_member(id));
create policy "creator inserts household" on households
  for insert with check (created_by = auth.uid());

create policy "members read household_members" on household_members
  for select using (is_household_member(household_id));
create policy "members manage own membership row" on household_members
  for insert with check (user_id = auth.uid());
create policy "members update own membership row" on household_members
  for update using (user_id = auth.uid());

create policy "members read children" on children
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "members read events" on events
  for select using (is_household_member(household_id));
create policy "members write events" on events
  for insert with check (is_household_member(household_id) and created_by = auth.uid());
create policy "members update events" on events
  for update using (is_household_member(household_id));
create policy "members delete events" on events
  for delete using (is_household_member(household_id));

create policy "members read messages" on messages
  for select using (is_household_member(household_id));
create policy "members send messages" on messages
  for insert with check (is_household_member(household_id) and sender_id = auth.uid());

create policy "members read expenses" on expenses
  for select using (is_household_member(household_id));
create policy "members write expenses" on expenses
  for insert with check (is_household_member(household_id) and created_by = auth.uid());
create policy "members update expenses" on expenses
  for update using (is_household_member(household_id));
create policy "members delete expenses" on expenses
  for delete using (is_household_member(household_id));

create policy "members read expense_shares" on expense_shares
  for select using (
    exists (select 1 from expenses e where e.id = expense_id and is_household_member(e.household_id))
  );
create policy "members write expense_shares" on expense_shares
  for insert with check (
    exists (select 1 from expenses e where e.id = expense_id and is_household_member(e.household_id))
  );
create policy "members update expense_shares" on expense_shares
  for update using (
    exists (select 1 from expenses e where e.id = expense_id and is_household_member(e.household_id))
  );

create policy "members read contacts" on contacts
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "members read documents" on documents
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "members read plan_notes" on plan_notes
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- Realtime for messages (enable in Supabase dashboard -> Database -> Replication,
-- or run the line below once).
-- alter publication supabase_realtime add table messages;
