import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키를 가져옵니다.
// 프로덕션에서는 실제 값으로 대체해야 합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

/**
 * Supabase client
 * @description Supabase 서비스와 통신하기 위한 클라이언트
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

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