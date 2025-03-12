import { NextRequest, NextResponse } from 'next/server';
import { formatDuration } from '@/utils/youtube';

/**
 * YouTube API 핸들러
 * @description YouTube 비디오 정보를 가져오는 API 라우트
 */
export async function GET(request: NextRequest) {
  // URL 쿼리에서 videoId 가져오기
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'videoId가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    // YouTube API 키는 환경 변수에서 가져옵니다
    const API_KEY = process.env.YOUTUBE_API_KEY || 'your-youtube-api-key';
    
    // YouTube Data API v3 호출
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('YouTube API 호출 실패');
    }

    const data = await response.json();
    
    // 비디오가 존재하지 않는 경우
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
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

    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error('YouTube API 오류:', error);
    return NextResponse.json(
      { error: 'YouTube 정보를 가져오는데 실패했습니다' },
      { status: 500 }
    );
  }
} 