import { NextRequest, NextResponse } from 'next/server';
import { formatDuration } from '@/utils/youtube';

/**
 * YouTube API 핸들러
 * @description YouTube 비디오 정보를 가져오는 API 라우트
 */
export async function GET(request: NextRequest) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  // URL 쿼리에서 videoId 가져오기
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'videoId가 필요합니다' },
      { status: 400, headers }
    );
  }

  try {
    // YouTube API 키는 환경 변수에서 가져옵니다
    const API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!API_KEY) {
      console.error('YouTube API 키가 설정되지 않았습니다');
      throw new Error('YouTube API 키가 설정되지 않았습니다');
    }
    
    // API 키 로깅 (문제 해결용)
    console.log('YouTube API 키 확인:', API_KEY.substring(0, 5) + '...');
    
    // YouTube Data API v3 호출
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`;
    console.log('YouTube API 요청:', apiUrl.replace(API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      // API 응답 상태 로깅
      console.error('YouTube API 오류:', response.status, response.statusText);
      const responseText = await response.text();
      console.error('응답 내용:', responseText);
      
      return NextResponse.json(
        { error: `YouTube API 호출 실패: ${response.status} ${response.statusText}` },
        { status: response.status, headers }
      );
    }

    const data = await response.json();
    
    // 비디오가 존재하지 않는 경우
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404, headers }
      );
    }

    const videoData = data.items[0];
    const { snippet, contentDetails } = videoData;

    // 필요한 정보만 추출
    const videoInfo = {
      title: snippet.title,
      thumbnail: snippet.thumbnails.medium.url, // 중간 크기 썸네일 사용
      duration: formatDuration(contentDetails.duration)
    };

    return NextResponse.json(videoInfo, { headers });
  } catch (error) {
    console.error('YouTube API 오류:', error);
    
    // 에러 메시지 추출
    const errorMessage = error instanceof Error 
      ? error.message 
      : '알 수 없는 오류';
    
    return NextResponse.json(
      { error: `YouTube 정보를 가져오는데 실패했습니다: ${errorMessage}` },
      { status: 500, headers }
    );
  }
} 