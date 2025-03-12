import React, { useState, useEffect } from 'react';
import { 
  List, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  Snackbar 
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import PlaylistItem from './PlaylistItem';
import { PlaylistItem as PlaylistItemType } from '@/types';
import { supabase } from '@/lib/supabase';
import { initializePlaylistTable, validatePlaylistData } from '@/utils/db';

/**
 * PlaylistProps
 * @description 플레이리스트 컴포넌트 props
 */
interface PlaylistProps {
  currentPlayingIndex: number;
  onReorder: (items: PlaylistItemType[]) => void;
}

/**
 * Playlist
 * @description 전체 플레이리스트를 보여주고 관리하는 컴포넌트
 * @param currentPlayingIndex - 현재 재생 중인 항목의 인덱스
 * @param onReorder - 재정렬 후 호출될 함수
 */
const Playlist: React.FC<PlaylistProps> = ({ currentPlayingIndex, onReorder }) => {
  const [items, setItems] = useState<PlaylistItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  // 플레이리스트 로드
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        
        // 테이블 초기화 시도
        await initializePlaylistTable().catch(err => {
          console.log('테이블 초기화 건너뜀:', err);
        });
        
        const { data, error } = await supabase
          .from('playlist')
          .select('*')
          .order('addedAt', { ascending: true });

        if (error) {
          console.error('Supabase 에러 상세:', 
            JSON.stringify({
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            }, null, 2)
          );
          
          // "테이블이 존재하지 않음" 오류인 경우 빈 배열로 설정
          if (error.code === '42P01') {
            console.log('playlist 테이블이 없습니다. 빈 플레이리스트를 표시합니다.');
            setItems([]);
            return;
          }
          
          throw error;
        }
        
        // 데이터 유효성 검사
        if (validatePlaylistData(data)) {
          setItems(data || []);
        } else {
          console.warn('부적절한 데이터 형식:', data);
          setItems([]);
          setSnackbarMessage('플레이리스트 데이터 형식이 올바르지 않습니다.');
          setSnackbarOpen(true);
        }
      } catch (err) {
        // 에러 객체를 문자열로 변환하여 더 자세한 정보 출력
        const errorMessage = err instanceof Error 
          ? `${err.name}: ${err.message}` 
          : '알 수 없는 오류';
        
        console.error('플레이리스트 로드 오류:', errorMessage);
        console.error('에러 스택:', err instanceof Error ? err.stack : '스택 정보 없음');
        
        // 에러가 발생해도 빈 배열로 설정하여 UI가 크래시 나지 않도록 함
        setItems([]);
        setError(`플레이리스트를 불러오는데 실패했습니다. (${errorMessage})`);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();

    // 실시간 업데이트 구독
    const channel = supabase
      .channel('playlist-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'playlist' }, 
        () => fetchPlaylist()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * 항목 삭제 핸들러
   */
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('playlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // 로컬 상태 업데이트
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('항목 삭제 오류:', err);
      setError('항목을 삭제하는데 실패했습니다.');
    }
  };

  /**
   * 드래그 앤 드롭 완료 핸들러
   */
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // 로컬 상태 업데이트
    setItems(reorderedItems);
    
    // 부모 컴포넌트에 알림
    onReorder(reorderedItems);

    try {
      // 서버에 업데이트 요청
      const { error } = await fetch('/api/playlist', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: reorderedItems })
      }).then(res => res.json());

      if (error) throw error;
    } catch (err) {
      console.error('플레이리스트 순서 업데이트 오류:', err);
      setError('순서를 저장하는데 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        플레이리스트가 비어 있습니다. 노래를 추가해보세요!
      </Typography>
    );
  }

  return (
    <>
      <Paper 
        elevation={3} 
        sx={{ 
          maxHeight: 'calc(100vh - 300px)', 
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="playlist">
            {(provided) => (
              <List 
                {...provided.droppableProps}
                ref={provided.innerRef}
                sx={{ p: 2 }}
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <PlaylistItem
                          item={item}
                          isCurrentlyPlaying={index === currentPlayingIndex}
                          onDelete={handleDelete}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>
      
      {/* 에러 메시지 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Playlist; 