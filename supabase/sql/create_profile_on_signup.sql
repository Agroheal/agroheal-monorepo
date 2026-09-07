-- Creates a profiles row (with a referral code and, if the signup came
-- through a ?ref= link, referred_by already resolved) the instant a new
-- auth user is created — not lazily at first Green Card payment.
--
-- Why: pages like Dashboard.tsx assume a profiles row already exists and
-- error out otherwise ("Failed to load your profile"). Since new users now
-- land on /dashboard immediately after signup (before ever paying for a
-- Green Card), that assumption broke — and it also meant a referred
-- signup's referred_by link depended on them reaching /dashboard or paying
-- first, instead of being recorded the moment they signed up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  referrer_id uuid;
  incoming_ref text;
begin
  select string_agg(
    substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (random() * 36)::int + 1, 1),
    ''
  )
  into new_code
  from generate_series(1, 6);

  incoming_ref := trim(coalesce(new.raw_user_meta_data->>'referral_code', new.raw_user_meta_data->>'sponsor_code', ''));

  if incoming_ref != '' then
    select id into referrer_id
    from public.profiles
    where referral_code = upper(incoming_ref)
       or member_id = incoming_ref
       or id::text = incoming_ref
    limit 1;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    referral_code,
    referred_by,
    sponsor_id,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    new_code,
    referrer_id,
    referrer_id,
    'member',
    now(),
    now()
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = case when public.profiles.full_name is null or public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    sponsor_id = coalesce(public.profiles.sponsor_id, excluded.sponsor_id),
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
