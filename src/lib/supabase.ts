import { createClient } from '@supabase/supabase-js';
import { PlaylistItem } from '@/types';

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
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Supabase 연결 테스트 - 브라우저 환경에서만 실행
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // 연결 테스트를 비동기적으로 수행하되, 오류가 발생해도 앱 실행에 영향을 주지 않도록 함
  setTimeout(async () => {
    try {
      // 테이블이 존재하는지 확인하는 대신 더 안전한 health 체크 수행
      const { data, error } = await supabase.rpc('version');
      
      if (error) {
        console.warn('Supabase 연결 테스트 실패:', error);
      } else {
        console.log('Supabase 연결 테스트 성공:', data);
      }
    } catch (err) {
      console.warn('Supabase 연결 테스트 실패:', err);
    }
  }, 2000); // 앱 초기화 후 테스트 수행
}

/**
 * PlaylistChangeCallback
 * @description 플레이리스트 변경 이벤트 콜백 타입
 */
export type PlaylistChangeCallback = {
  onInsert?: (newItem: PlaylistItem) => void;
  onUpdate?: (updatedItem: PlaylistItem) => void;
  onDelete?: (oldItem: PlaylistItem) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
};

/**
 * setupPlaylistRealtime
 * @description 실시간으로 플레이리스트 변경 사항을 구독하기 위한 채널 설정
 * @param callbacks 변경 이벤트에 대한 콜백 함수들
 * @returns Supabase 채널 객체 (구독 해제에 사용)
 */
export const setupPlaylistRealtime = (callbacks: PlaylistChangeCallback) => {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  console.log('Supabase 실시간 채널 설정 시작...');
  
  const channel = supabase
    .channel('playlist-changes', {
      config: {
        broadcast: { self: true },
        presence: { key: 'anonymous' }
      }
    })
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'playlist' }, 
      (payload) => {
        console.log('Supabase INSERT 이벤트 수신:', payload);
        if (callbacks.onInsert && payload.new) {
          callbacks.onInsert(payload.new as PlaylistItem);
        }
      }
    )
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'playlist' }, 
      (payload) => {
        console.log('Supabase UPDATE 이벤트 수신:', payload);
        if (callbacks.onUpdate && payload.new) {
          callbacks.onUpdate(payload.new as PlaylistItem);
        }
      }
    )
    .on('postgres_changes', 
      { event: 'DELETE', schema: 'public', table: 'playlist' }, 
      (payload) => {
        console.log('Supabase DELETE 이벤트 수신:', payload);
        if (callbacks.onDelete && payload.old) {
          callbacks.onDelete(payload.old as PlaylistItem);
        }
      }
    )
    .on('presence', { event: 'sync' }, () => {
      console.log('Presence 동기화됨');
    })
    .on('system', { event: 'disconnect' }, () => {
      console.warn('Supabase 연결 끊김, 재연결 시도 중...');
      
      reconnectAttempts++;
      
      if (reconnectAttempts <= maxReconnectAttempts) {
        const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000);
        
        console.log(`${backoffTime/1000}초 후 재연결 시도 (${reconnectAttempts}/${maxReconnectAttempts})...`);
        
        setTimeout(() => {
          channel.subscribe();
        }, backoffTime);
      } else {
        console.error('최대 재연결 시도 횟수 초과');
        if (callbacks.onError) {
          callbacks.onError(new Error('실시간 연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.'));
        }
      }
    })
    .on('system', { event: 'reconnected' }, () => {
      console.log('Supabase 재연결 성공');
      reconnectAttempts = 0;
      
      if (callbacks.onReconnect) {
        callbacks.onReconnect();
      }
    })
    .subscribe((status) => {
      console.log('Supabase 실시간 구독 상태:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('실시간 업데이트 구독 성공');
        reconnectAttempts = 0;
        
        // 구독 성공 시 테이블 변경 사항 확인
        console.log('테이블 변경 사항 구독 확인 중...');
        
        // 테스트 쿼리 실행
        supabase
          .from('playlist')
          .select('count(*)', { count: 'exact' })
          .then(({ count, error }) => {
            if (error) {
              console.error('테이블 확인 오류:', error);
            } else {
              console.log(`현재 playlist 테이블에 ${count || 0}개 항목이 있습니다.`);
            }
          });
      } else if (status === 'CHANNEL_ERROR') {
        console.error('실시간 업데이트 구독 실패');
        if (callbacks.onError) {
          callbacks.onError(new Error('실시간 업데이트 연결에 실패했습니다'));
        }
      } else if (status === 'TIMED_OUT') {
        console.warn('실시간 업데이트 연결 시간 초과');
        
        reconnectAttempts++;
        
        if (reconnectAttempts <= maxReconnectAttempts) {
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000);
          console.log(`${backoffTime/1000}초 후 재연결 시도 (${reconnectAttempts}/${maxReconnectAttempts})...`);
          
          setTimeout(() => {
            channel.subscribe();
          }, backoffTime);
        } else {
          console.error('최대 재연결 시도 횟수 초과');
          if (callbacks.onError) {
            callbacks.onError(new Error('실시간 연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.'));
          }
        }
      }
    });

  return channel;
}; 