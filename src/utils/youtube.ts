import { YouTubeVideoInfo } from '@/types';

/**
 * extractYouTubeId
 * @description YouTube URL에서 비디오 ID를 추출
 * @param url YouTube 비디오 URL
 * @returns YouTube 비디오 ID 또는 null
 */
export const extractYouTubeId = (url: string): string | null => {
  // 일반 YouTube 링크 형식
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * getYouTubeVideoInfo
 * @description YouTube 비디오 ID로 비디오 정보 가져오기
 * @param videoId YouTube 비디오 ID
 * @returns 비디오 정보(제목, 썸네일, 길이) 또는 에러
 */
export const getYouTubeVideoInfo = async (videoId: string): Promise<YouTubeVideoInfo> => {
  try {
    // YouTube Data API v3를 사용하거나 서버에서 proxy 요청을 보냅니다.
    // API 키가 필요하므로 실제 구현에서는 서버 측 API 사용을 권장합니다.
    const response = await fetch(`/api/youtube?videoId=${videoId}`);
    
    if (!response.ok) {
      throw new Error('비디오 정보를 가져오는데 실패했습니다');
    }
    
    return await response.json();
  } catch (error) {
    console.error('YouTube 정보 가져오기 오류:', error);
    // 임시 정보 반환 (실제 구현에서는 적절한 에러 처리 필요)
    return {
      title: '비디오 정보를 가져올 수 없습니다',
      thumbnail: '/placeholder-thumbnail.jpg',
      duration: '0:00'
    };
  }
};

/**
 * formatDuration
 * @description ISO 8601 시간 형식을 보기 쉬운 형식으로 변환 (PT1H30M15S -> 1:30:15)
 * @param isoDuration ISO 8601 형식의 시간 문자열
 * @returns 사용자 친화적인 시간 형식
 */
export const formatDuration = (isoDuration: string): string => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}; 