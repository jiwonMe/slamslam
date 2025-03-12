import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PlaylistItem } from '@/types';
import { getYouTubeVideoInfo, extractYouTubeId, formatDuration } from '@/utils/youtube';

/**
 * 플레이리스트 가져오기
 * @description 전체 플레이리스트를 가져오는 GET 요청 처리
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('playlist')
      .select('*')
      .order('addedAt', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('플레이리스트 가져오기 오류:', error);
    return NextResponse.json(
      { error: '플레이리스트를 가져오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 플레이리스트에 항목 추가
 * @description 새로운 비디오를 플레이리스트에 추가하는 POST 요청 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, addedBy } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다' },
        { status: 400 }
      );
    }

    // YouTube ID 추출
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: '유효한 YouTube URL이 아닙니다' },
        { status: 400 }
      );
    }

    // 서버 컨텍스트에서는 직접 YouTube API 호출
    let videoInfo;
    try {
      // YouTube API 키는 환경 변수에서 가져옵니다
      const API_KEY = process.env.YOUTUBE_API_KEY;
      
      if (!API_KEY) {
        throw new Error('YouTube API 키가 설정되지 않았습니다');
      }
      
      // YouTube Data API v3 직접 호출
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      
      // 비디오가 존재하지 않는 경우
      if (!data.items || data.items.length === 0) {
        throw new Error('비디오를 찾을 수 없습니다');
      }

      const videoData = data.items[0];
      const { snippet, contentDetails } = videoData;

      // 필요한 정보만 추출
      videoInfo = {
        title: snippet.title,
        thumbnail: snippet.thumbnails.medium.url, // 중간 크기 썸네일 사용
        duration: formatDuration(contentDetails.duration)
      };
    } catch (error) {
      console.error('YouTube API 직접 호출 오류:', error);
      // 오류 발생 시 기본 정보 사용
      videoInfo = {
        title: '비디오 정보를 가져올 수 없습니다',
        thumbnail: '/placeholder-thumbnail.jpg',
        duration: '0:00'
      };
    }

    // 새 플레이리스트 항목 생성
    const newItem: Omit<PlaylistItem, 'id'> = {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration,
      addedAt: Date.now(),
      addedBy: addedBy || '익명'
    };

    // Supabase에 항목 추가
    const { data, error } = await supabase
      .from('playlist')
      .insert([newItem])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('플레이리스트 항목 추가 오류:', error);
    return NextResponse.json(
      { error: '플레이리스트에 항목을 추가하는데 실패했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 플레이리스트 항목 삭제
 * @description ID로 플레이리스트 항목을 삭제하는 DELETE 요청 처리
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '항목 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('playlist')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('플레이리스트 항목 삭제 오류:', error);
    return NextResponse.json(
      { error: '플레이리스트 항목을 삭제하는데 실패했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 플레이리스트 순서 업데이트
 * @description 플레이리스트 항목의 순서를 업데이트하는 PATCH 요청 처리
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: '유효한 항목 배열이 필요합니다' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 모든 항목 업데이트
    // 실제 구현에서는 더 효율적인 방법으로 처리 필요
    for (const [index, item] of items.entries()) {
      const { error } = await supabase
        .from('playlist')
        .update({ order: index })
        .eq('id', item.id);
      
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('플레이리스트 순서 업데이트 오류:', error);
    return NextResponse.json(
      { error: '플레이리스트 순서를 업데이트하는데 실패했습니다' },
      { status: 500 }
    );
  }
} 