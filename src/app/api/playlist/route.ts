import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PlaylistItem } from '@/types';
import { getYouTubeVideoInfo, extractYouTubeId } from '@/utils/youtube';

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

    // YouTube 정보 가져오기
    const videoInfo = await getYouTubeVideoInfo(videoId);

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