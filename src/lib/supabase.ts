import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 개발 모드에서 환경 변수 확인
if (process.env.NODE_ENV !== 'production') {
  if (!supabaseUrl) {
    console.error('경고: NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.');
  }
  if (!supabaseKey) {
    console.error('경고: NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.');
  }
}

/**
 * Supabase client
 * @description Supabase 서비스와 통신하기 위한 클라이언트
 */
export const supabase = createClient(
  supabaseUrl || 'https://jnapgnzsqklimxefbjfb.supabase.co',
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuYXBnbnpzcWtsaW14ZWZiamZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYxMjYsImV4cCI6MjA1NzM0MjEyNn0.8P35ZMuHVkJRsRqySCQ3QT0FVgkcBLw4VkPxv730PFE',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// Supabase 연결 테스트
(async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { error } = await supabase.from('playlist').select('count()', { count: 'exact', head: true });
      if (error) {
        console.error('Supabase 연결 테스트 실패:', error);
      } else {
        console.log('Supabase 연결 테스트 성공');
      }
    } catch (err) {
      console.error('Supabase 연결 테스트 예외 발생:', err);
    }
  }
})();

/**
 * Supabase Realtime Channel
 * @description 실시간으로 플레이리스트 변경 사항을 구독하기 위한 채널
 */
export const setupPlaylistChannel = () => {
  return supabase
    .channel('playlist-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'playlist' }, 
      (payload) => {
        console.log('변경 감지:', payload);
        // 여기서 이벤트를 처리
      }
    );
}; 