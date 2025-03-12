import { supabase } from '@/lib/supabase';
import { PlaylistItem } from '@/types';

/**
 * initializePlaylistTable
 * @description Supabase에 playlist 테이블이 없으면 생성
 * @returns {Promise<boolean>} 성공 여부
 */
export const initializePlaylistTable = async (): Promise<boolean> => {
  try {
    // 테이블 존재 여부 확인
    const { data, error } = await supabase
      .rpc('check_table_exists', { tablename: 'playlist' });
    
    if (error) {
      // RPC 함수가 없는 경우, 직접 쿼리로 테이블 확인
      console.log('RPC 함수가 없습니다. 직접 쿼리로 테이블을 확인합니다.');
      return await createPlaylistTable();
    }
    
    // 테이블이 없으면 생성
    if (data === false) {
      return await createPlaylistTable();
    }
    
    console.log('playlist 테이블이 이미 존재합니다.');
    return true;
  } catch (err) {
    console.error('테이블 확인 오류:', err);
    return false;
  }
};

/**
 * createPlaylistTable
 * @description playlist 테이블 생성
 * @returns {Promise<boolean>} 성공 여부
 */
const createPlaylistTable = async (): Promise<boolean> => {
  try {
    console.log('playlist 테이블을 생성합니다...');
    
    // SQL 쿼리로 테이블 생성 요청
    // 실제로는 Supabase Studio나 마이그레이션으로 테이블을 관리하는 것이 좋음
    const { error } = await supabase.rpc('create_playlist_table');
    
    if (error) {
      console.error('테이블 생성 실패:', error);
      return false;
    }
    
    console.log('playlist 테이블이 성공적으로 생성되었습니다.');
    return true;
  } catch (err) {
    console.error('테이블 생성 오류:', err);
    return false;
  }
};

/**
 * validatePlaylistData
 * @description 플레이리스트 데이터의 유효성 검사
 * @param data 검사할 데이터
 * @returns {boolean} 유효한 데이터인지 여부
 */
export const validatePlaylistData = (data: unknown): boolean => {
  if (!data || !Array.isArray(data)) {
    return false;
  }
  
  // 타입 가드 함수로 PlaylistItem 배열 여부 확인
  const isPlaylistItemArray = (arr: unknown[]): arr is PlaylistItem[] => {
    return arr.every(item => 
      typeof item === 'object' && 
      item !== null && 
      'id' in item && 
      'title' in item && 
      'url' in item
    );
  };
  
  // 필수 필드 확인
  if (!isPlaylistItemArray(data)) {
    return false;
  }
  
  return true;
}; 