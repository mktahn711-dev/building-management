import { createClient } from '@/lib/supabase'

const BUCKET = 'maintenance-photos'

// 관리내역 사진 업로드. building_id/date 하위에 저장해 스토리지 RLS(건물주 열람 제한)와 경로를 맞춘다.
export async function uploadMaintenancePhotos(
  files: File[],
  buildingId: string,
  date: string
): Promise<string[]> {
  const supabase = createClient()
  const paths: string[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${buildingId}/${date}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw error
    paths.push(path)
  }

  return paths
}

export async function deleteMaintenancePhoto(path: string) {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}

// 저장된 경로들을 임시(1시간) 열람 링크로 변환. 비공개 버킷이라 매번 서명이 필요하다.
export async function getSignedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
  if (error || !data) return {}

  const map: Record<string, string> = {}
  data.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl
  })
  return map
}
