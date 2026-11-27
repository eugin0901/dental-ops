-- =========================================================
-- 치과 운영 관리 (여러 치과용) : Supabase 데이터베이스 설정
-- 새 Supabase 프로젝트의 SQL Editor 에 전체를 붙여넣고 [Run] 한 번만 실행하세요.
-- 치과마다 데이터가 완전히 분리되고, 각 치과는 사이트에서 직접 가입해요.
-- =========================================================

-- 1) 치과
create table if not exists public.clinics (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text not null unique,
  settings     jsonb not null default '{}'::jsonb,   -- {"menus_off": ["mkt", ...]}
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- 2) 사용자 프로필 (카카오로 처음 로그인하면 자동 생성, 치과는 가입·합류 때 정해져요)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  clinic_id   uuid references public.clinics(id) on delete set null,
  role        text not null default 'staff' check (role in ('admin','staff')),
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 3) 업무 데이터 (모든 메뉴의 기록). 치과별로 분리돼요.
create table if not exists public.records (
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  module      text not null,
  id          text not null,
  data        jsonb not null default '{}'::jsonb,
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (clinic_id, module, id)
);

-- 4) 서비스 운영자 (파일럿을 운영하는 사람. 모든 치과의 사용 통계와 의견을 봐요)
create table if not exists public.operators (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 5) 메뉴 사용 통계 (어떤 메뉴를 얼마나 쓰는지 숫자만. 기록 내용은 저장하지 않아요)
create table if not exists public.usage_daily (
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  module     text not null,
  kind       text not null check (kind in ('view','edit')),
  day        date not null default current_date,
  count      int  not null default 1,
  primary key (clinic_id, user_id, module, kind, day)
);

-- 6) 의견 보내기
create table if not exists public.feedback (
  id          bigserial primary key,
  clinic_id   uuid references public.clinics(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  module      text,
  kind        text not null default '요청',
  message     text not null check (char_length(message) between 1 and 2000),
  status      text not null default '새 의견',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 권한 확인 함수
-- ---------------------------------------------------------
create or replace function public.my_clinic() returns uuid
language sql stable security definer set search_path = public as $$
  select clinic_id from public.profiles where id = auth.uid() and approved;
$$;
create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and approved and clinic_id is not null);
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and approved and clinic_id is not null and role = 'admin');
$$;
create or replace function public.is_operator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.operators where user_id = auth.uid());
$$;

-- ---------------------------------------------------------
-- 첫 로그인 시 프로필 자동 생성
-- ---------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name',
                           new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'user_name', '이름 없음'))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 프로필이 없을 때(예: 예전에 지워진 경우) 다시 만들기
create or replace function public.ensure_profile() returns void
language plpgsql security definer set search_path = public as $$
declare u record;
begin
  select * into u from auth.users where id = auth.uid();
  if u.id is null then return; end if;
  insert into public.profiles (id, name)
  values (u.id, coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'nickname', '이름 없음'))
  on conflict (id) do nothing;
end; $$;

-- ---------------------------------------------------------
-- 치과 가입·합류 (화면의 버튼이 이 함수를 불러요)
-- ---------------------------------------------------------
create or replace function public.new_invite_code() returns text
language plpgsql set search_path = public as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(a, 1 + floor(random()*32)::int, 1); end loop;
    exit when not exists(select 1 from public.clinics where invite_code = c);
  end loop;
  return c;
end; $$;

-- 새 치과 등록: 만든 사람이 그 치과의 관리자가 돼요
create or replace function public.create_clinic(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; cur uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception '치과 이름을 입력하세요'; end if;
  select clinic_id into cur from public.profiles where id = auth.uid();
  if cur is not null then raise exception '이미 다른 치과에 소속돼 있어요'; end if;
  -- 새 치과는 '1단계 · 소통부터'(공지, 업무 전달, 근무표)로 시작해요. 관리자 설정에서 단계를 올릴 수 있어요.
  insert into public.clinics (name, invite_code, created_by, settings)
  values (left(trim(p_name),60), public.new_invite_code(), auth.uid(),
          jsonb_build_object('stage', 1, 'menus_off', jsonb_build_array('inv','order','lab','ster','equip','repair','vendor','attend','manual','kpi','mkt')))
  returning id into cid;
  update public.profiles set clinic_id = cid, role = 'admin', approved = true where id = auth.uid();
  return cid;
end; $$;

-- 초대코드로 합류: 관리자가 승인해야 사용할 수 있어요
create or replace function public.join_clinic(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare c record; cur uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  select clinic_id into cur from public.profiles where id = auth.uid();
  if cur is not null then raise exception '이미 다른 치과에 소속돼 있어요'; end if;
  select * into c from public.clinics where invite_code = upper(trim(p_code));
  if c.id is null then raise exception '초대코드가 맞지 않아요'; end if;
  update public.profiles set clinic_id = c.id, role = 'staff', approved = false where id = auth.uid();
  return c.name;
end; $$;

-- 합류 신청 취소·치과 나가기 (본인)
create or replace function public.leave_clinic() returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() and (select count(*) from public.profiles where clinic_id = public.my_clinic() and role='admin' and approved) <= 1
     and (select count(*) from public.profiles where clinic_id = public.my_clinic()) > 1 then
    raise exception '마지막 관리자는 나갈 수 없어요. 다른 사람을 관리자로 지정한 뒤 나가세요';
  end if;
  update public.profiles set clinic_id = null, role = 'staff', approved = false where id = auth.uid();
end; $$;

-- 관리자: 합류 신청 거절 / 직원 내보내기
create or replace function public.remove_member(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 할 수 있어요'; end if;
  if p_user = auth.uid() then raise exception '자기 자신은 내보낼 수 없어요'; end if;
  update public.profiles set clinic_id = null, role = 'staff', approved = false
  where id = p_user and clinic_id = public.my_clinic();
end; $$;

-- 관리자: 초대코드 새로 만들기 (예전 코드는 더 이상 안 돼요)
create or replace function public.reset_invite_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.is_admin() then raise exception '관리자만 할 수 있어요'; end if;
  c := public.new_invite_code();
  update public.clinics set invite_code = c where id = public.my_clinic();
  return c;
end; $$;

-- 관리자: 치과 이름·메뉴 설정 저장
create or replace function public.update_clinic(p_name text, p_settings jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 할 수 있어요'; end if;
  update public.clinics set name = coalesce(nullif(left(trim(p_name),60),''), name),
                            -- 와이파이 주소(wifi_ips)는 출퇴근 서버 함수로만 바뀌어요
                            settings = case when p_settings is null then settings
                              else (p_settings - 'wifi_ips') || jsonb_build_object('wifi_ips', coalesce(settings->'wifi_ips','[]'::jsonb)) end
  where id = public.my_clinic();
end; $$;

-- 메뉴 사용 기록 (숫자만 +1)
create or replace function public.log_usage(p_module text, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
declare cid uuid := public.my_clinic();
begin
  if cid is null or p_kind not in ('view','edit') then return; end if;
  insert into public.usage_daily (clinic_id, user_id, module, kind)
  values (cid, auth.uid(), left(p_module,30), p_kind)
  on conflict (clinic_id, user_id, module, kind, day) do update set count = public.usage_daily.count + 1;
end; $$;

-- 운영자: 치과 목록과 요약
create or replace function public.op_clinics() returns table(id uuid, name text, created_at timestamptz, members bigint, pending bigint, records bigint, last_active date, active_users_7d bigint, menus_off jsonb)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.created_at,
    (select count(*) from profiles p where p.clinic_id=c.id and p.approved),
    (select count(*) from profiles p where p.clinic_id=c.id and not p.approved),
    (select count(*) from records r where r.clinic_id=c.id),
    (select max(day) from usage_daily u where u.clinic_id=c.id),
    (select count(distinct user_id) from usage_daily u where u.clinic_id=c.id and u.day > current_date - 7),
    coalesce(c.settings->'menus_off','[]'::jsonb)
  from clinics c where public.is_operator() order by c.created_at;
$$;

-- 운영자: 기간별 메뉴 사용량
create or replace function public.op_usage(p_days int) returns table(clinic_id uuid, module text, kind text, total bigint, users bigint, days bigint)
language sql stable security definer set search_path = public as $$
  select clinic_id, module, kind, sum(count), count(distinct user_id), count(distinct day)
  from usage_daily where public.is_operator() and day > current_date - greatest(p_days,1)
  group by clinic_id, module, kind;
$$;

-- ---------------------------------------------------------
-- 작성자·수정자 자동 기록
-- ---------------------------------------------------------
create or replace function public.touch_record() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then new.created_by := auth.uid(); else new.created_by := old.created_by; new.clinic_id := old.clinic_id; end if;
  return new;
end; $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.touch_record();

-- ---------------------------------------------------------
-- 보안 규칙 (Row Level Security)
-- ---------------------------------------------------------
alter table public.clinics     enable row level security;
alter table public.profiles    enable row level security;
alter table public.records     enable row level security;
alter table public.operators   enable row level security;
alter table public.usage_daily enable row level security;
alter table public.feedback    enable row level security;

-- 치과: 소속 직원은 자기 치과만 봐요. 초대코드는 관리자만 화면에 보여 줘요.
drop policy if exists "자기 치과 보기" on public.clinics;
create policy "자기 치과 보기" on public.clinics for select
  using (id = (select clinic_id from public.profiles where id = auth.uid()) or public.is_operator());

-- 프로필: 본인 또는 같은 치과의 승인된 직원. 수정은 같은 치과 관리자만 (권한·승인 칸만).
drop policy if exists "프로필 보기" on public.profiles;
create policy "프로필 보기" on public.profiles for select
  using (id = auth.uid() or (clinic_id is not null and clinic_id = public.my_clinic()) or public.is_operator());
drop policy if exists "프로필 수정" on public.profiles;
create policy "프로필 수정" on public.profiles for update
  using (public.is_admin() and clinic_id = public.my_clinic())
  with check (public.is_admin() and clinic_id = public.my_clinic());
revoke update on public.profiles from authenticated, anon;
alter table public.profiles add column if not exists rank text;
grant update (role, approved, rank) on public.profiles to authenticated;
-- 원장님 전용 정보(직원 계약·급여·계좌·주소·비상연락처·서류)는 직급이 '원장'인 관리자만
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and approved and clinic_id is not null and role = 'admin' and rank = '원장');
$$;

-- 직급: 원장·총괄실장·실장 = 관리자(인원 제한 없음), 팀장·사원 = 직원
do $$ begin
  alter table public.profiles add constraint profiles_rank_chk check (rank is null or rank in ('원장','총괄실장','실장','팀장','사원'));
exception when duplicate_object then null; end $$;
create or replace function public.rank_to_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.rank is not null and (tg_op = 'INSERT' or new.rank is distinct from old.rank) then
    new.role := case when new.rank in ('원장','총괄실장','실장') then 'admin' else 'staff' end;
  elsif tg_op = 'UPDATE' and new.role is distinct from old.role and new.rank is not null then
    -- 권한만 바꾸면 직급도 맞춰요
    new.rank := case when new.role = 'admin' then case when new.rank in ('원장','총괄실장','실장') then new.rank else '실장' end
                     else case when new.rank in ('팀장','사원') then new.rank else '사원' end end;
  end if;
  -- '원장' 직급은 원장님만 주고 뺄 수 있어요 (치과에 원장이 아직 없을 때만 다른 관리자가 처음 지정할 수 있어요)
  if tg_op = 'UPDATE' and new.clinic_id is not null and auth.uid() is not null
     and ((new.rank = '원장') is distinct from (old.rank = '원장'))
     and not public.is_owner()
     and exists (select 1 from public.profiles p where p.clinic_id = new.clinic_id and p.rank = '원장' and p.approved) then
    raise exception '원장 직급은 원장님만 바꿀 수 있어요';
  end if;
  -- 마지막 원장님은 내려갈 수 없어요 (원장님 전용 정보를 볼 사람이 없어지니까요)
  if tg_op = 'UPDATE' and old.rank = '원장' and new.rank is distinct from '원장' and old.clinic_id is not null
     and not exists (select 1 from public.profiles p where p.clinic_id = old.clinic_id and p.rank = '원장' and p.approved and p.id <> old.id) then
    raise exception '원장님이 한 명은 있어야 해요';
  end if;
  -- 치과에 관리자가 한 명도 없게 되는 변경은 막아요
  if tg_op = 'UPDATE' and old.role = 'admin' and new.role <> 'admin' and old.clinic_id is not null
     and not exists (select 1 from public.profiles p where p.clinic_id = old.clinic_id and p.role = 'admin' and p.approved and p.id <> old.id) then
    raise exception '관리자가 한 명은 있어야 해요';
  end if;
  return new;
end $$;
drop trigger if exists profiles_rank on public.profiles;
create trigger profiles_rank before insert or update on public.profiles for each row execute function public.rank_to_role();

-- 업무 데이터: 같은 치과의 승인된 직원만. 원장님 전용 정보(staffpriv)는 원장님만, 출퇴근 위치(attlog)는 관리자만.
drop policy if exists "기록 보기" on public.records;
create policy "기록 보기" on public.records for select
  using (clinic_id = public.my_clinic() and (module <> 'attlog' or public.is_admin()) and (module <> 'staffpriv' or public.is_owner()));
drop policy if exists "기록 추가" on public.records;
create policy "기록 추가" on public.records for insert
  with check (clinic_id = public.my_clinic() and (module not in ('role','attlog','closed') or public.is_admin()) and (module <> 'staffpriv' or public.is_owner())
              and (module <> 'att' or public.is_admin() or not coalesce((select (c.settings->>'wifi_lock')::boolean from public.clinics c where c.id = public.my_clinic()), false)));
drop policy if exists "기록 수정" on public.records;
create policy "기록 수정" on public.records for update
  using (clinic_id = public.my_clinic() and (module not in ('role','attlog','closed') or public.is_admin()) and (module <> 'staffpriv' or public.is_owner()))
  with check (clinic_id = public.my_clinic() and (module not in ('role','attlog','closed') or public.is_admin()) and (module <> 'staffpriv' or public.is_owner())
              and (module <> 'att' or public.is_admin() or not coalesce((select (c.settings->>'wifi_lock')::boolean from public.clinics c where c.id = public.my_clinic()), false)));
drop policy if exists "기록 삭제" on public.records;
create policy "기록 삭제" on public.records for delete
  using (clinic_id = public.my_clinic()
         and (module not in ('notice','task','alert') or created_by = auth.uid())
         and (module not in ('role','attlog','closed') or public.is_admin()) and (module <> 'staffpriv' or public.is_owner()));

-- 운영자 목록: 운영자 본인 확인용
drop policy if exists "운영자 확인" on public.operators;
create policy "운영자 확인" on public.operators for select using (user_id = auth.uid());

-- 사용 통계: 직접 읽기·쓰기 금지 (log_usage, op_usage 함수로만)
-- 의견: 승인된 직원은 자기 치과로 보내고, 자기 치과 관리자와 운영자가 봐요
drop policy if exists "의견 보내기" on public.feedback;
create policy "의견 보내기" on public.feedback for insert
  with check (clinic_id = public.my_clinic() and user_id = auth.uid());
drop policy if exists "의견 보기" on public.feedback;
create policy "의견 보기" on public.feedback for select
  using (public.is_operator() or (public.is_admin() and clinic_id = public.my_clinic()) or user_id = auth.uid());
drop policy if exists "의견 상태 변경" on public.feedback;
create policy "의견 상태 변경" on public.feedback for update
  using (public.is_operator()) with check (public.is_operator());

-- ---------------------------------------------------------
-- 휴대폰 알림 (웹 푸시)
--   push_subs   : 기기별 알림 구독 (본인 것만, 함수로만 다뤄요)
--   push_prefs  : 사람별 알림 종류 켜고 끄기
--   notify_log  : 같은 알림이 반복해서 나가지 않게 막는 기록
--   notify_targets / daily_targets : 알림 발송 서버 함수(service_role)만 실행할 수 있어요
-- ---------------------------------------------------------
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user on public.push_subs(user_id);
create table if not exists public.push_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prefs   jsonb not null default '{}'::jsonb
);
create table if not exists public.notify_log (
  key text primary key,
  at  timestamptz not null default now()
);
alter table public.push_subs  enable row level security;
alter table public.push_prefs enable row level security;
alter table public.notify_log enable row level security;
-- 정책을 만들지 않아서 앱에서 직접 읽고 쓸 수 없어요. 아래 함수로만 다뤄요.

create or replace function public.save_push_sub(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_approved() then raise exception '승인된 직원만 알림을 켤 수 있어요'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then raise exception '알림 주소가 올바르지 않아요'; end if;
  insert into public.push_subs(endpoint, user_id, clinic_id, p256dh, auth)
  values (p_endpoint, auth.uid(), public.my_clinic(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, clinic_id = excluded.clinic_id,
    p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
end $$;

create or replace function public.delete_push_sub(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subs where endpoint = p_endpoint and user_id = auth.uid();
$$;

create or replace function public.get_push_prefs()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select prefs from public.push_prefs where user_id = auth.uid()), '{}'::jsonb)
    || jsonb_build_object('devices', (select count(*) from public.push_subs where user_id = auth.uid()));
$$;

create or replace function public.set_push_prefs(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  insert into public.push_prefs(user_id, prefs) values (auth.uid(), p - 'devices')
  on conflict (user_id) do update set prefs = excluded.prefs;
end $$;

-- 중복 방지: 처음이면 true, 이미 보낸 알림이면 false
create or replace function public.notify_once(p_key text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.notify_log where at < now() - interval '3 days';
  insert into public.notify_log(key) values (p_key);
  return true;
exception when unique_violation then
  return false;
end $$;

-- 같은 치과 직원 이름 → 로그인 계정
create or replace function public.staff_uids(p_clinic uuid, p_names text[])
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct (r.data->>'uid')::uuid from public.records r
  where r.clinic_id = p_clinic and r.module = 'staff' and r.data->>'name' = any(p_names)
    and coalesce(r.data->>'uid','') ~ '^[0-9a-f-]{36}$';
$$;

-- 알림 받을 기기 목록과 문구
--   p_caller : 저장한 사람 (서버 함수가 로그인 토큰으로 확인한 값)
--   p_event  : notice_new, alert_new, task_new, task_done, repair_new, repair_done, inv_low, shift_change, test
create or replace function public.notify_targets(p_caller uuid, p_module text, p_id text, p_event text, p_extra jsonb default '{}'::jsonb)
returns table(endpoint text, p256dh text, auth text, title text, body text, url text, tag text)
language plpgsql security definer set search_path = public as $$
declare
  v_clinic uuid; d jsonb; v_cat text; v_title text; v_body text; v_url text := '#my'; v_key text;
  v_users uuid[]; v_pref text; v_mgr text; c jsonb; v_cname text;
begin
  select p.clinic_id into v_clinic from public.profiles p where p.id = p_caller and p.approved and p.clinic_id is not null;
  if v_clinic is null then return; end if;            -- 승인되지 않은 사람은 알림을 보낼 수 없어요
  select name into v_cname from public.clinics where id = v_clinic;

  if p_event = 'test' then
    if not public.notify_once('test:'||p_caller||':'||to_char(now(),'YYYYMMDDHH24MI')) then return; end if;
    v_users := array[p_caller]; v_pref := 'test';
    v_title := '알림이 잘 와요'; v_body := '이 기기에서 치과 알림을 받을 수 있어요.'; v_url := '#my';
  else
    select r.data into d from public.records r where r.clinic_id = v_clinic and r.module = p_module and r.id = p_id;
    if d is null then return; end if;                 -- 다른 치과 기록이거나 없는 기록

    if p_event = 'notice_new' and p_module = 'notice' then
      v_key := 'notice:'||p_id; v_pref := 'notice'; v_url := '#notice';
      v_title := '새 공지 · '||coalesce(nullif(d->>'title',''),'공지'); v_body := left(coalesce(d->>'body',''),120);
      select array_agg(id) into v_users from public.profiles where clinic_id = v_clinic and approved;
    elsif p_event = 'alert_new' and p_module = 'alert' then
      v_key := 'alert:'||p_id; v_pref := 'notice'; v_url := '#my';
      v_title := coalesce(nullif(d->>'by',''),'관리자')||'님의 알림'; v_body := left(coalesce(d->>'msg',''),120);
      select array_agg(id) into v_users from public.profiles where clinic_id = v_clinic and approved;
    elsif p_event = 'task_new' and p_module = 'task' then
      v_key := 'task:'||p_id||':'||coalesce(d->>'to',''); v_pref := 'task'; v_url := '#my';
      v_title := case when d->>'pri' = '급함' then '급한 업무 · ' else '업무 · ' end||coalesce(d->>'from','')||' → 나';
      v_body := left(coalesce(d->>'title',''),120)||case when coalesce(d->>'due','')<>'' then ' (기한 '||(d->>'due')||')' else '' end;
      select array_agg(u) into v_users from public.staff_uids(v_clinic, array[d->>'to']) u;
    elsif p_event = 'task_done' and p_module = 'task' and d->>'status' = '완료' then
      v_key := 'taskdone:'||p_id; v_pref := 'task'; v_url := '#notice';
      v_title := '업무 완료 · '||coalesce(d->>'to',''); v_body := left(coalesce(d->>'title',''),100)||case when coalesce(d->>'reply','')<>'' then ' — '||left(d->>'reply',60) else '' end;
      select array_agg(u) into v_users from public.staff_uids(v_clinic, array[d->>'from']) u;
    elsif p_event = 'repair_new' and p_module = 'repair' then
      v_key := 'repair:'||p_id; v_pref := 'repair'; v_url := '#repair';
      v_title := '장비 고장 · '||coalesce(d->>'equip',''); v_body := left(coalesce(d->>'symptom',''),120);
      select array_agg(id) into v_users from public.profiles where clinic_id = v_clinic and approved;
    elsif p_event = 'repair_done' and p_module = 'repair' and d->>'status' = '완료' then
      v_key := 'repairdone:'||p_id; v_pref := 'repair'; v_url := '#repair';
      v_title := '수리 완료 · '||coalesce(d->>'equip',''); v_body := '다시 사용할 수 있어요.'||case when coalesce(d->>'note','')<>'' then ' '||left(d->>'note',80) else '' end;
      select array_agg(id) into v_users from public.profiles where clinic_id = v_clinic and approved;
    elsif p_event = 'inv_low' and p_module = 'inv'
          and coalesce(nullif(d->>'qty','')::numeric,0) < coalesce(nullif(d->>'min','')::numeric,0) then
      v_key := 'inv:'||p_id||':'||to_char(now() at time zone 'Asia/Seoul','YYYYMMDD'); v_pref := 'inv'; v_url := '#order';
      v_cat := case when d->>'cat' = '소모품' then '치과재료 외 소모품' else d->>'cat' end;
      select r.data into c from public.records r where r.clinic_id = v_clinic and r.module = 'invcfg' and r.id = 'main';
      v_mgr := c->>(case when v_cat in ('원무','사무용품') then 'mgr_office' when v_cat = '임플란트' then 'mgr_implant' else 'mgr_clinic' end);
      v_title := '재고 부족 · '||coalesce(d->>'name','');
      v_body := '남은 수량 '||coalesce(d->>'qty','0')||coalesce(d->>'unit','')||' (최소 '||coalesce(d->>'min','')||'). 주문 견적서에 넣어 주세요.';
      if coalesce(v_mgr,'') <> '' then select array_agg(u) into v_users from public.staff_uids(v_clinic, array[v_mgr]) u; end if;
      if v_users is null then select array_agg(id) into v_users from public.profiles where clinic_id = v_clinic and approved and role = 'admin'; end if;
    elsif p_event = 'shift_change' and p_module = 'shift' then
      v_key := 'shift:'||p_id||':'||md5(coalesce(p_extra->>'staff','')||coalesce(d->>'updatedAt',''))||':'||floor(extract(epoch from now())/120);
      v_pref := 'shift'; v_url := '#shift';
      v_title := '근무표 변경'; v_body := p_id||' 주 근무표에서 내 근무가 바뀌었어요. 눌러서 확인해 주세요.';
      select array_agg(distinct (r.data->>'uid')::uuid) into v_users from public.records r
        where r.clinic_id = v_clinic and r.module = 'staff'
          and r.id in (select jsonb_array_elements_text(coalesce(p_extra->'staff','[]'::jsonb)) limit 50)
          and coalesce(r.data->>'uid','') ~ '^[0-9a-f-]{36}$';
    else
      return;
    end if;
    if v_users is null then return; end if;
    if not public.notify_once(v_key) then return; end if;   -- 이미 보낸 알림
  end if;

  return query
    select s.endpoint, s.p256dh, s.auth, v_title, coalesce(nullif(v_body,''),' '), v_url, p_event||':'||coalesce(p_id,'')
    from public.push_subs s left join public.push_prefs f on f.user_id = s.user_id
    where s.clinic_id = v_clinic and s.user_id = any(v_users)
      and (p_event = 'test' or s.user_id <> p_caller)                       -- 내가 한 일은 나에게 알리지 않아요
      and coalesce((f.prefs->>v_pref)::boolean, true);
end $$;

-- 매일 아침 알림 (내일 기한인 업무, 오늘 재료 주문일)
create or replace function public.daily_targets()
returns table(endpoint text, p256dh text, auth text, title text, body text, url text, tag text)
language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_tom   text := to_char((now() at time zone 'Asia/Seoul')::date + 1, 'YYYY-MM-DD');
begin
  if not public.notify_once('daily:'||v_today) then return; end if;
  return query
  with due as (                               -- 내일 기한인 업무 → 받는 사람
    select r.clinic_id, r.data->>'to' as who, count(*) as n, min(r.data->>'title') as t
    from public.records r
    where r.module = 'task' and r.data->>'due' = v_tom and coalesce(r.data->>'status','') <> '완료'
    group by r.clinic_id, r.data->>'to'
  ), due_u as (
    select d.clinic_id, (s.data->>'uid')::uuid as uid,
      '내일까지 할 업무'::text as title,
      case when d.n > 1 then d.t||' 외 '||(d.n-1)||'건' else d.t end as body, '#my'::text as url, 'daily_task'::text as tag, 'task'::text as pref
    from due d join public.records s on s.clinic_id = d.clinic_id and s.module = 'staff' and s.data->>'name' = d.who
    where coalesce(s.data->>'uid','') ~ '^[0-9a-f-]{36}$'
  ), cfgs as (                                -- 오늘이 주문일인 치과 (말일 보정)
    select r.clinic_id, r.data as c from public.records r
    where r.module = 'invcfg' and r.id = 'main' and coalesce(r.data->>'orderDay','') ~ '^[0-9]+$'
      and least((r.data->>'orderDay')::int, extract(day from (date_trunc('month', v_today) + interval '1 month - 1 day'))::int) = extract(day from v_today)::int
  ), ord_u as (
    select c.clinic_id, (s.data->>'uid')::uuid as uid, '오늘은 재료 주문일이에요'::text as title,
      '부족한 품목 '||(select count(*) from public.records i where i.clinic_id = c.clinic_id and i.module = 'inv'
        and coalesce(nullif(i.data->>'qty','')::numeric,0) < coalesce(nullif(i.data->>'min','')::numeric,0))||'개가 주문 견적서에 들어가 있어요.' as body,
      '#order'::text as url, 'daily_order'::text as tag, 'inv'::text as pref
    from cfgs c join public.records s on s.clinic_id = c.clinic_id and s.module = 'staff'
      and s.data->>'name' in (c.c->>'mgr_clinic', c.c->>'mgr_office', c.c->>'mgr_implant')
    where coalesce(s.data->>'uid','') ~ '^[0-9a-f-]{36}$'
  ), allu as (select * from due_u union all select * from ord_u)
  select s.endpoint, s.p256dh, s.auth, a.title, a.body, a.url, a.tag
  from allu a
  join public.profiles p on p.id = a.uid and p.approved and p.clinic_id = a.clinic_id
  join public.push_subs s on s.user_id = a.uid and s.clinic_id = a.clinic_id
  left join public.push_prefs f on f.user_id = a.uid
  where coalesce((f.prefs->>a.pref)::boolean, true) and coalesce((f.prefs->>'daily')::boolean, true);
end $$;

-- 만료된 구독 정리 (발송 서버 함수가 호출)
create or replace function public.drop_push_sub(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subs where endpoint = p_endpoint;
$$;

revoke execute on function public.notify_targets(uuid,text,text,text,jsonb) from public, anon, authenticated;
revoke execute on function public.daily_targets() from public, anon, authenticated;
revoke execute on function public.drop_push_sub(text) from public, anon, authenticated;
revoke execute on function public.notify_once(text) from public, anon, authenticated;
revoke execute on function public.staff_uids(uuid,text[]) from public, anon, authenticated;
grant execute on function public.notify_targets(uuid,text,text,text,jsonb) to service_role;
grant execute on function public.daily_targets() to service_role;
grant execute on function public.drop_push_sub(text) to service_role;


-- ---------------------------------------------------------
-- 출퇴근: 출근은 치과 와이파이(공인 IP)에서만, 퇴근은 어디서나 + 앱 열면 자동 출근
--   punch 서버 함수(service_role)만 실행해요. 앱이 IP를 속일 수 없어요.
--   settings.wifi_lock = true 이면 직원은 출퇴근 기록을 직접 쓸 수 없고 이 함수로만 남아요. (관리자는 고칠 수 있어요)
-- ---------------------------------------------------------
create or replace function public.punch_record(p_caller uuid, p_ip text, p_kind text, p_auto boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_clinic uuid; v_set jsonb; s record; v_date text; v_now text; v_id text; d jsonb; v_wifi boolean;
begin
  select p.clinic_id into v_clinic from public.profiles p where p.id = p_caller and p.approved and p.clinic_id is not null;
  if v_clinic is null then return jsonb_build_object('status','denied'); end if;
  select settings into v_set from public.clinics where id = v_clinic;
  v_wifi := coalesce(v_set->'wifi_ips','[]'::jsonb) ? coalesce(p_ip,'');
  -- 퇴근은 치과 밖에서도 찍을 수 있어요 (어디서 찍었는지 기록만 남겨요)
  if not v_wifi and p_kind <> 'out' then
    return jsonb_build_object('status','not_wifi','registered', jsonb_array_length(coalesce(v_set->'wifi_ips','[]'::jsonb)) > 0);
  end if;
  if p_auto and not coalesce((v_set->>'auto_in')::boolean, false) then return jsonb_build_object('status','off'); end if;
  select r.id, r.data into s from public.records r
    where r.clinic_id = v_clinic and r.module = 'staff' and r.data->>'uid' = p_caller::text limit 1;
  if s.id is null then return jsonb_build_object('status','nolink'); end if;
  v_date := to_char(now() at time zone 'Asia/Seoul','YYYY-MM-DD');
  v_now  := to_char(now() at time zone 'Asia/Seoul','HH24:MI');
  v_id   := v_date||'_'||s.id;
  select data into d from public.records where clinic_id = v_clinic and module = 'att' and id = v_id;
  if p_kind = 'in' and coalesce(d->>'in','') <> '' then
    return jsonb_build_object('status','already','time',d->>'in','kind','in');
  end if;
  if p_kind not in ('in','out') then return jsonb_build_object('status','bad'); end if;
  d := coalesce(d, jsonb_build_object('staff', s.data->>'name', 'sid', s.id, 'date', v_date, 'in','', 'out','', 'note',''))
       || jsonb_build_object(p_kind, v_now, 'updatedAt', (extract(epoch from now())*1000)::bigint);
  insert into public.records(clinic_id, module, id, data, created_by, updated_by)
  values (v_clinic, 'att', v_id, d, p_caller, p_caller)
  on conflict (clinic_id, module, id) do update set data = excluded.data, updated_by = p_caller, updated_at = now();
  -- 어디서 찍었는지는 관리자만 볼 수 있는 기록(attlog)에 따로 남겨요
  insert into public.records(clinic_id, module, id, data, created_by, updated_by)
  values (v_clinic, 'attlog', v_id, jsonb_build_object('sid', s.id, 'date', v_date, p_kind||'_via', case when not v_wifi then 'outside' when p_auto then 'wifi-auto' else 'wifi' end), p_caller, p_caller)
  on conflict (clinic_id, module, id) do update set data = public.records.data || excluded.data, updated_at = now();
  return jsonb_build_object('status','ok','time',v_now,'kind',p_kind,'auto',p_auto,'outside',not v_wifi);
end $$;

-- 관리자: 지금 연결된 와이파이를 치과로 등록 / 모두 지우기
create or replace function public.wifi_register(p_caller uuid, p_ip text, p_clear boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_clinic uuid; v_ips jsonb;
begin
  select p.clinic_id into v_clinic from public.profiles p where p.id = p_caller and p.approved and p.role = 'admin';
  if v_clinic is null then return jsonb_build_object('status','denied'); end if;
  if p_clear then v_ips := '[]'::jsonb;
  else
    select coalesce(settings->'wifi_ips','[]'::jsonb) into v_ips from public.clinics where id = v_clinic;
    if not v_ips ? p_ip then v_ips := (v_ips || to_jsonb(p_ip)); end if;
    if jsonb_array_length(v_ips) > 5 then v_ips := v_ips - 0; end if;   -- 최근 5개까지
  end if;
  update public.clinics set settings = coalesce(settings,'{}'::jsonb) || jsonb_build_object('wifi_ips', v_ips) where id = v_clinic;
  return jsonb_build_object('status','ok','count', jsonb_array_length(v_ips));
end $$;

-- 퇴근 알림: 치과마다 정한 시각(settings.leave_remind, 예 '18:40')부터 15분 안에 한 번,
--            오늘 출근했는데 퇴근을 안 찍은 직원에게
create or replace function public.leave_targets()
returns table(endpoint text, p256dh text, auth text, title text, body text, url text, tag text)
language plpgsql security definer set search_path = public as $$
declare v_today text := to_char(now() at time zone 'Asia/Seoul','YYYY-MM-DD');
        v_now time := (now() at time zone 'Asia/Seoul')::time;
begin
  return query
  with cl as (
    select c.id from public.clinics c
    where coalesce(c.settings->>'leave_remind','') ~ '^[0-2][0-9]:[0-5][0-9]$'
      and v_now >= (c.settings->>'leave_remind')::time and v_now < (c.settings->>'leave_remind')::time + interval '15 minutes'
      and public.notify_once('leave:'||c.id||':'||v_today)
  ), who as (
    select a.clinic_id, (s.data->>'uid')::uuid as uid
    from public.records a join cl on cl.id = a.clinic_id
    join public.records s on s.clinic_id = a.clinic_id and s.module = 'staff' and s.id = a.data->>'sid'
    where a.module = 'att' and a.id like v_today||'_%' and coalesce(a.data->>'in','') <> '' and coalesce(a.data->>'out','') = ''
      and coalesce(s.data->>'uid','') ~ '^[0-9a-f-]{36}$'
  )
  select p.endpoint, p.p256dh, p.auth, '퇴근 찍으셨나요?'::text, '앱을 열고 퇴근 버튼을 눌러 주세요.'::text, '#my'::text, 'leave'::text
  from who join public.push_subs p on p.user_id = who.uid and p.clinic_id = who.clinic_id
  left join public.push_prefs f on f.user_id = who.uid
  where coalesce((f.prefs->>'daily')::boolean, true);
end $$;

revoke execute on function public.punch_record(uuid,text,text,boolean) from public, anon, authenticated;
revoke execute on function public.wifi_register(uuid,text,boolean) from public, anon, authenticated;
revoke execute on function public.leave_targets() from public, anon, authenticated;
grant execute on function public.punch_record(uuid,text,text,boolean) to service_role;
grant execute on function public.wifi_register(uuid,text,boolean) to service_role;
grant execute on function public.leave_targets() to service_role;

-- ---------------------------------------------------------
-- 실시간 동기화
-- ---------------------------------------------------------
do $$ begin alter publication supabase_realtime add table public.records;  exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.clinics;  exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------
-- 파일 저장소 (치과별 폴더로 분리)
--   lab-photos : 기공 의뢰서 사진 (같은 치과 승인 직원)
--   staff-docs : 직원 서류 (같은 치과 원장님만)
--   manual-files : 매뉴얼 PDF·이미지 (같은 치과 승인 직원)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public) values ('lab-photos','lab-photos', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit) values ('staff-docs','staff-docs', false, 20971520) on conflict (id) do nothing;

drop policy if exists "의뢰서 사진 보기" on storage.objects;
create policy "의뢰서 사진 보기" on storage.objects for select
  using (bucket_id = 'lab-photos' and (storage.foldername(name))[1] = public.my_clinic()::text);
drop policy if exists "의뢰서 사진 올리기" on storage.objects;
create policy "의뢰서 사진 올리기" on storage.objects for insert
  with check (bucket_id = 'lab-photos' and (storage.foldername(name))[1] = public.my_clinic()::text);
drop policy if exists "의뢰서 사진 지우기" on storage.objects;
create policy "의뢰서 사진 지우기" on storage.objects for delete
  using (bucket_id = 'lab-photos' and (storage.foldername(name))[1] = public.my_clinic()::text);

-- manual-files : 매뉴얼 PDF·이미지 (같은 치과 승인 직원, 파일당 20MB)
insert into storage.buckets (id, name, public, file_size_limit) values ('manual-files','manual-files', false, 20971520) on conflict (id) do nothing;
drop policy if exists "매뉴얼 자료 보기" on storage.objects;
create policy "매뉴얼 자료 보기" on storage.objects for select
  using (bucket_id = 'manual-files' and (storage.foldername(name))[1] = public.my_clinic()::text);
drop policy if exists "매뉴얼 자료 올리기" on storage.objects;
create policy "매뉴얼 자료 올리기" on storage.objects for insert
  with check (bucket_id = 'manual-files' and (storage.foldername(name))[1] = public.my_clinic()::text);
drop policy if exists "매뉴얼 자료 지우기" on storage.objects;
create policy "매뉴얼 자료 지우기" on storage.objects for delete
  using (bucket_id = 'manual-files' and (storage.foldername(name))[1] = public.my_clinic()::text);

drop policy if exists "직원 서류 보기" on storage.objects;
create policy "직원 서류 보기" on storage.objects for select
  using (bucket_id = 'staff-docs' and public.is_owner() and (storage.foldername(name))[1] = public.my_clinic()::text);
drop policy if exists "직원 서류 올리기" on storage.objects;
create policy "직원 서류 올리기" on storage.objects for insert
  with check (bucket_id = 'staff-docs' and public.is_owner() and (storage.foldername(name))[1] = public.my_clinic()::text);
drop policy if exists "직원 서류 지우기" on storage.objects;
create policy "직원 서류 지우기" on storage.objects for delete
  using (bucket_id = 'staff-docs' and public.is_owner() and (storage.foldername(name))[1] = public.my_clinic()::text);
