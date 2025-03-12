import React, { useState, useEffect, useRef } from 'react';
import { 
  List, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  Snackbar,
  Button
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import PlaylistItem from './PlaylistItem';
import { PlaylistItem as PlaylistItemType } from '@/types';
import { supabase } from '@/lib/supabase';
import { initializePlaylistTable, validatePlaylistData } from '@/utils/db';
import { setupPlaylistRealtime, PlaylistChangeCallback } from '@/lib/supabase';

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
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('error');
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // 마지막으로 로드된 플레이리스트 항목 ID를 추적하기 위한 ref
  const lastItemsRef = useRef<PlaylistItemType[]>([]);
  const channelRef = useRef<any>(null);

  /**
   * 플레이리스트 데이터 가져오기
   * @description Supabase에서 플레이리스트 데이터를 가져오는 함수
   * @param showLoading - 로딩 상태를 표시할지 여부
   */
  const fetchPlaylist = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      console.log('플레이리스트 데이터 가져오기 시작...');
      
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
      
      console.log('플레이리스트 데이터 가져오기 성공:', data?.length || 0, '개 항목');
      
      // 데이터 유효성 검사
      if (validatePlaylistData(data)) {
        // 새로운 항목이 추가되었는지 확인
        const newItems = data || [];
        
        // 이전 항목과 비교하여 새로 추가된 항목 확인
        if (lastItemsRef.current.length > 0 && newItems.length > lastItemsRef.current.length) {
          const oldItemIds = new Set(lastItemsRef.current.map(item => item.id));
          
          // 새로 추가된 항목 찾기
          const addedItems = newItems.filter(item => !oldItemIds.has(item.id));
          
          if (addedItems.length > 0) {
            // 새 노래가 추가되었음을 알림
            setSnackbarSeverity('info');
            setSnackbarMessage(`새 노래가 추가되었습니다: ${addedItems.map(item => item.title).join(', ')}`);
            setSnackbarOpen(true);
            
            // 알림 보내기
            try {
              await fetch('https://ntfy.sh/miridih-jwpark02-cursor-250228', {
                method: 'POST',
                body: `새 노래가 추가됨: ${addedItems.map(item => item.title).join(', ')}`,
              });
            } catch (err) {
              console.error('알림 전송 실패:', err);
            }
          }
        }
        
        // 현재 항목 저장
        lastItemsRef.current = newItems;
        setItems(newItems);
      } else {
        console.warn('부적절한 데이터 형식:', data);
        setItems([]);
        setSnackbarSeverity('error');
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
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  /**
   * 실시간 업데이트 처리 함수
   * @description 개별 항목 변경 시 전체 목록을 다시 가져오지 않고 효율적으로 처리
   */
  const handleRealtimeChanges = () => {
    // 실시간 업데이트 콜백 정의
    const callbacks: PlaylistChangeCallback = {
      onInsert: (newItem) => {
        console.log('실시간 항목 추가 이벤트 수신:', newItem);
        
        // 중복 항목 방지
        if (!items.some(item => item.id === newItem.id)) {
          console.log('새 항목 추가 처리 중...');
          
          // 새 항목 추가
          const updatedItems = [...items, newItem];
          
          // 추가 시간 기준으로 정렬
          updatedItems.sort((a, b) => a.addedAt - b.addedAt);
          
          // 상태 업데이트
          setItems(updatedItems);
          console.log('항목 상태 업데이트 완료, 현재 항목 수:', updatedItems.length);
          
          // 알림 표시
          setSnackbarSeverity('info');
          setSnackbarMessage(`새 노래가 추가되었습니다: ${newItem.title}`);
          setSnackbarOpen(true);
          
          // 알림 보내기
          try {
            fetch('https://ntfy.sh/miridih-jwpark02-cursor-250228', {
              method: 'POST',
              body: `새 노래가 추가됨: ${newItem.title}`,
            });
          } catch (err) {
            console.error('알림 전송 실패:', err);
          }
        } else {
          console.log('중복 항목 무시:', newItem.id);
        }
      },
      
      onUpdate: (updatedItem) => {
        console.log('실시간 항목 업데이트 이벤트 수신:', updatedItem);
        
        // 해당 항목만 업데이트
        setItems(prev => {
          const updated = prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          );
          console.log('항목 업데이트 완료');
          return updated;
        });
      },
      
      onDelete: (deletedItem) => {
        console.log('실시간 항목 삭제 이벤트 수신:', deletedItem);
        
        // 해당 항목 제거
        setItems(prev => {
          const filtered = prev.filter(item => item.id !== deletedItem.id);
          console.log('항목 삭제 완료, 남은 항목 수:', filtered.length);
          return filtered;
        });
      },
      
      onError: (error) => {
        console.error('실시간 업데이트 오류:', error);
        setRealtimeStatus('disconnected');
        
        // 오류 알림
        setSnackbarSeverity('warning');
        setSnackbarMessage('실시간 업데이트 연결에 문제가 발생했습니다. 새로고침을 해보세요.');
        setSnackbarOpen(true);
      },
      
      onReconnect: () => {
        console.log('실시간 업데이트 재연결');
        setRealtimeStatus('connected');
        
        // 재연결 성공 알림
        setSnackbarSeverity('success');
        setSnackbarMessage('실시간 업데이트 연결이 복구되었습니다.');
        setSnackbarOpen(true);
        
        // 재연결 시 전체 목록 다시 가져오기
        fetchPlaylist(false);
      }
    };
    
    // 실시간 구독 설정
    console.log('실시간 구독 설정 시작...');
    const channel = setupPlaylistRealtime(callbacks);
    console.log('실시간 구독 채널 생성됨');
    
    // 초기 상태는 연결 중으로 설정
    setRealtimeStatus('connecting');
    
    // 채널 참조 저장
    channelRef.current = channel;
  };

  // 플레이리스트 로드 및 실시간 업데이트 구독
  useEffect(() => {
    fetchPlaylist();
    handleRealtimeChanges();

    // 연결 상태 주기적 확인
    const connectionCheckInterval = setInterval(() => {
      if (channelRef.current) {
        // 연결이 끊어진 상태에서 자동 재구독 시도
        if (realtimeStatus === 'disconnected') {
          console.log('연결 상태 확인: 재구독 시도');
          
          // 기존 채널 제거
          supabase.removeChannel(channelRef.current);
          
          // 새로운 채널 생성 및 구독
          handleRealtimeChanges();
          
          // 재연결 시도 알림
          setSnackbarSeverity('info');
          setSnackbarMessage('실시간 업데이트 재연결 시도 중...');
          setSnackbarOpen(true);
        }
      }
    }, 30000); // 30초마다 확인

    return () => {
      // 컴포넌트 언마운트 시 구독 해제 및 인터벌 정리
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      clearInterval(connectionCheckInterval);
    };
  }, [realtimeStatus]);

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
      
      // 로컬 상태 업데이트 (실시간 이벤트로도 처리되지만 즉각적인 UI 반응을 위해 추가)
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('항목 삭제 오류:', err);
      setSnackbarSeverity('error');
      setSnackbarMessage('항목을 삭제하는데 실패했습니다.');
      setSnackbarOpen(true);
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
      setSnackbarSeverity('error');
      setSnackbarMessage('순서를 저장하는데 실패했습니다.');
      setSnackbarOpen(true);
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
          borderRadius: 2,
          position: 'relative'
        }}
      >
        {realtimeStatus === 'disconnected' && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bgcolor: 'warning.light', 
              color: 'warning.contrastText',
              p: 1,
              textAlign: 'center',
              fontSize: '0.75rem',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1
            }}
          >
            <span>실시간 업데이트 연결이 끊어졌습니다.</span>
            <Button 
              variant="outlined" 
              size="small" 
              color="inherit" 
              sx={{ fontSize: '0.7rem', py: 0, minWidth: 'auto' }}
              onClick={() => {
                // 수동 재연결 시도
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                }
                handleRealtimeChanges();
                setSnackbarSeverity('info');
                setSnackbarMessage('실시간 업데이트 재연결 시도 중...');
                setSnackbarOpen(true);
              }}
            >
              재연결
            </Button>
          </Box>
        )}
        
        {realtimeStatus === 'connecting' && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bgcolor: 'info.light', 
              color: 'info.contrastText',
              p: 1,
              textAlign: 'center',
              fontSize: '0.75rem',
              zIndex: 10
            }}
          >
            실시간 업데이트 연결 중...
          </Box>
        )}
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="playlist" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
            {(provided) => (
              <List 
                {...provided.droppableProps}
                ref={provided.innerRef}
                sx={{ p: 2 }}
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={false}>
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
      
      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Playlist; 