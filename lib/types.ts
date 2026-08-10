export type Role = 'admin' | 'owner'

export interface Building {
  id: string
  name: string
  address: string | null
  created_at: string
}

export interface Profile {
  id: string
  role: Role
  building_id: string | null
  name: string | null
  created_at: string
}

export interface MaintenanceLog {
  id: string
  building_id: string
  date: string
  계단청소: boolean
  화장실청소: boolean
  분리수거: boolean
  방역: boolean
  방향제: boolean
  포충기: boolean
  창틀청소: boolean
  입주청소: boolean
  도배: boolean
  입실: boolean
  퇴실: boolean
  철거: boolean
  시설관리: boolean
  특이사항: string | null
  created_by: string | null
  created_at: string
}

export interface Memo {
  id: string
  building_id: string
  content: string
  created_by: string | null
  is_read: boolean
  created_at: string
}

export type MaintenanceItem = '계단청소' | '화장실청소' | '분리수거' | '방역' | '방향제' | '포충기' | '창틀청소' | '입주청소' | '도배' | '입실' | '퇴실' | '철거' | '시설관리'

export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  '계단청소',
  '화장실청소',
  '분리수거',
  '방역',
  '방향제',
  '포충기',
  '창틀청소',
  '입주청소',
  '도배',
  '입실',
  '퇴실',
  '철거',
  '시설관리',
]
