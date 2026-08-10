# 건물 관리 시스템 - 설정 가이드

## 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 에 접속하여 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전(Northeast Asia - Seoul 권장) 설정
4. 프로젝트 생성 완료까지 약 1~2분 대기

---

## 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- Supabase 대시보드 → **Settings** → **API** 메뉴에서 값 확인
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3. DB 스키마 생성

Supabase 대시보드 → **SQL Editor** → **New Query** 에서 아래 SQL 실행:

```sql
-- buildings 테이블
create table buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz default now()
);

-- profiles 테이블 (auth.users와 연결)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'owner')),
  building_id uuid references buildings(id),
  name text,
  created_at timestamptz default now()
);

-- maintenance_logs 테이블
create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references buildings(id) not null,
  date date not null,
  계단청소 boolean default false,
  화장실청소 boolean default false,
  분리수거 boolean default false,
  방역 boolean default false,
  방향제 boolean default false,
  포충기 boolean default false,
  창틀청소 boolean default false,
  특이사항 text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(building_id, date)
);

-- memos 테이블
create table memos (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references buildings(id) not null,
  content text not null,
  created_by uuid references auth.users(id),
  is_read boolean default false,
  created_at timestamptz default now()
);
```

---

## 4. RLS (Row Level Security) 정책 설정

SQL Editor에서 아래 SQL 실행:

```sql
-- RLS 활성화
alter table buildings enable row level security;
alter table profiles enable row level security;
alter table maintenance_logs enable row level security;
alter table memos enable row level security;

-- profiles: 본인 프로필 읽기/쓰기
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- buildings: 관리자는 모두 조회, 건물주는 본인 건물만
create policy "buildings_admin_all" on buildings
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "buildings_owner_select" on buildings
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'owner'
        and profiles.building_id = buildings.id
    )
  );

-- maintenance_logs: 관리자는 모두 관리, 건물주는 본인 건물만 조회
create policy "logs_admin_all" on maintenance_logs
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "logs_owner_select" on maintenance_logs
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'owner'
        and profiles.building_id = maintenance_logs.building_id
    )
  );

-- memos: 관리자는 모두 관리, 건물주는 본인 건물만 읽기/쓰기
create policy "memos_admin_all" on memos
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "memos_owner_select" on memos
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'owner'
        and profiles.building_id = memos.building_id
    )
  );

create policy "memos_owner_insert" on memos
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'owner'
        and profiles.building_id = memos.building_id
    )
  );

create policy "memos_owner_delete_own" on memos
  for delete using (
    auth.uid() = created_by
  );
```

---

## 5. 초기 데이터 입력

### 건물 등록

```sql
insert into buildings (name, address) values
  ('강남빌딩', '서울시 강남구 테헤란로 123'),
  ('서초빌딩', '서울시 서초구 서초대로 456');
```

### 계정 생성 및 프로필 등록

1. Supabase 대시보드 → **Authentication** → **Users** → **Invite user** 또는 **Add user**
2. 관리자/건물주 이메일과 비밀번호 입력하여 계정 생성
3. 생성된 user의 UUID를 확인한 뒤 아래 SQL 실행:

```sql
-- 관리자 프로필 (building_id는 null)
insert into profiles (id, role, name) values
  ('관리자-UUID-여기에', 'admin', '홍길동');

-- 건물주 프로필 (해당 building의 id 입력)
insert into profiles (id, role, building_id, name) values
  ('건물주-UUID-여기에', 'owner', '건물-UUID-여기에', '김건물');
```

> UUID는 Supabase 대시보드 → **Authentication** → **Users** 에서 확인

---

## 6. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 7. Vercel 배포

1. [https://vercel.com](https://vercel.com) 에서 GitHub 리포지토리 연결
2. **Environment Variables** 에 아래 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy** 클릭

또는 Vercel CLI 사용:

```bash
npm i -g vercel
vercel --prod
```

---

## 주요 기능 요약

| 역할 | 기능 |
|------|------|
| 관리자 | 모든 건물 캘린더 조회, 관리내역 입력/수정, 건물주 메모 확인 및 읽음 처리 |
| 건물주 | 본인 건물 캘린더 조회, 관리자에게 메모 전송 |

## 파일 구조

```
building-management/
├── app/
│   ├── login/page.tsx          # 로그인 페이지
│   ├── dashboard/
│   │   ├── layout.tsx          # 네비게이션 포함 레이아웃
│   │   ├── page.tsx            # 캘린더 메인 (관리자/건물주 공용)
│   │   ├── admin/page.tsx      # 관리내역 입력 (관리자 전용)
│   │   └── memos/page.tsx      # 메모 페이지
│   ├── layout.tsx              # 루트 레이아웃
│   └── globals.css
├── components/
│   ├── Calendar.tsx            # 월별 캘린더 (직접 구현)
│   ├── MaintenanceForm.tsx     # 관리내역 입력 폼
│   ├── MaintenanceDetail.tsx   # 날짜 클릭 시 상세 모달
│   ├── MemoSection.tsx         # 메모 목록/작성
│   ├── AdminCalendarTabs.tsx   # 관리자용 건물 탭 캘린더
│   ├── AdminMemosView.tsx      # 관리자용 건물별 메모 뷰
│   └── NavBar.tsx              # 상단 네비게이션
├── lib/
│   ├── supabase.ts             # Supabase 클라이언트/서버 설정
│   └── types.ts                # TypeScript 타입 정의
├── middleware.ts               # 인증 보호 미들웨어
└── .env.local.example          # 환경변수 예시
```
