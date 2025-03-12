import { YouTubeVideoInfo } from '@/types';

/**
 * extractYouTubeId
 * @description YouTube URL에서 비디오 ID를 추출
 * @param url YouTube 비디오 URL
 * @returns YouTube 비디오 ID 또는 null
 */
export const extractYouTubeId = (url: string): string | null => {
  try {
    // URL이 없거나 문자열이 아닌 경우
    if (!url || typeof url !== 'string') {
      return null;
    }

    // URL 정규화
    const normalizedUrl = url.trim();
    
    // 다양한 YouTube URL 형식 처리
    // 1. youtu.be/ID (단축 URL)
    // 2. youtube.com/v/ID
    // 3. youtube.com/embed/ID
    // 4. youtube.com/watch?v=ID (표준 URL)
    // 5. youtube.com/shorts/ID (쇼츠 URL)
    // ?si=xxxx와 같은 추가 매개변수가 있는 경우도 처리
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = normalizedUrl.match(regExp);

    // ID 길이 검증 (YouTube ID는 11자)
    return (match && match[2] && match[2].length === 11) ? match[2] : null;
  } catch (error) {
    console.error('YouTube ID 추출 오류:', error);
    return null;
  }
};

/**
 * getYouTubeVideoInfo
 * @description YouTube 비디오 ID로 비디오 정보 가져오기
 * @param videoId YouTube 비디오 ID
 * @returns 비디오 정보(제목, 썸네일, 길이) 또는 에러
 */
export const getYouTubeVideoInfo = async (videoId: string): Promise<YouTubeVideoInfo> => {
  try {
    // 서버 측과 클라이언트 측 모두에서 작동하도록 절대 URL 사용
    // 환경에 따라 적절한 기본 URL 결정
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin  // 클라이언트 측
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // 서버 측
    
    const apiUrl = `${baseUrl}/api/youtube?videoId=${videoId}`;
    console.log('YouTube API 요청 URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // CORS 이슈 방지를 위한 설정
      credentials: 'same-origin',
      cache: 'no-cache',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API 응답 오류:', response.status, errorText);
      throw new Error(`비디오 정보를 가져오는데 실패했습니다 (${response.status})`);
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
 * @description ISO 8601 기간 형식을 사람이 읽을 수 있는 형식으로 변환
 * @param isoDuration ISO 8601 기간 문자열 (예: PT1H2M3S)
 * @returns 형식화된 기간 문자열 (예: 1:02:03)
 */
export const formatDuration = (isoDuration: string): string => {
  try {
    // ISO 8601 기간 형식 파싱
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    if (!match) {
      return '0:00';
    }
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    // 시간이 있는 경우: H:MM:SS 형식
    // 시간이 없는 경우: M:SS 형식
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('기간 형식 변환 오류:', error);
    return '0:00';
  }
}; 