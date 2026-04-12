-- QuoteSnap Initial Schema

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users primary key,
  business_name text,
  contact_name text,
  email text,
  phone text,
  abn text,
  license_number text,
  address text,
  city text,
  state text,
  postcode text,
  logo_url text,
  brand_color text default '#C9982A',
  default_margin_percent numeric default 20,
  default_gst_included boolean default true,
  payment_terms text default 'Payment due within 14 days of acceptance',
  quote_validity_days integer default 30,
  bank_details text,
  stripe_customer_id text,
  subscription_status text default 'trial',
  subscription_tier text default 'starter',
  trial_ends_at timestamptz,
  quotes_this_month integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clients
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postcode text,
  notes text,
  created_at timestamptz default now()
);

-- Quotes
create table if not exists quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  quote_number text not null,
  status text default 'draft',
  job_type text,
  job_description text,
  site_notes text,
  line_items jsonb default '[]',
  subtotal numeric default 0,
  margin_percent numeric default 20,
  margin_amount numeric default 0,
  gst_amount numeric default 0,
  total numeric default 0,
  gst_included boolean default true,
  scope_of_work text,
  exclusions text,
  assumptions text,
  timeline text,
  payment_terms text,
  validity_days integer default 30,
  voice_note_url text,
  voice_transcript text,
  photo_urls jsonb default '[]',
  photo_analysis text,
  pdf_url text,
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Quote templates
create table if not exists quote_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  job_type text,
  default_line_items jsonb default '[]',
  default_scope text,
  default_exclusions text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table clients enable row level security;
alter table quotes enable row level security;
alter table quote_templates enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- RLS Policies for clients
create policy "Users can manage own clients"
  on clients for all
  using (auth.uid() = user_id);

-- RLS Policies for quotes
create policy "Users can manage own quotes"
  on quotes for all
  using (auth.uid() = user_id);

-- RLS Policies for quote templates
create policy "Users can manage own templates"
  on quote_templates for all
  using (auth.uid() = user_id);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, trial_ends_at)
  values (
    new.id,
    new.email,
    now() + interval '14 days'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Updated_at triggers
create trigger handle_quotes_updated_at
  before update on quotes
  for each row execute procedure public.handle_updated_at();

create trigger handle_profiles_updated_at
  before update on profiles
  for each row execute procedure public.handle_updated_at();

-- Indexes for performance
create index if not exists quotes_user_id_idx on quotes(user_id);
create index if not exists quotes_status_idx on quotes(status);
create index if not exists quotes_created_at_idx on quotes(created_at desc);
create index if not exists clients_user_id_idx on clients(user_id);
create index if not exists quote_templates_user_id_idx on quote_templates(user_id);

-- Storage buckets (run these in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('voice-notes', 'voice-notes', false);
-- insert into storage.buckets (id, name, public) values ('site-photos', 'site-photos', false);
-- insert into storage.buckets (id, name, public) values ('quote-pdfs', 'quote-pdfs', false);
-- insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
