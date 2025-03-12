'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, Snackbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import YouTubePlayer from '@/components/YouTubePlayer';
import { PlaylistItem } from '@/types';
import { supabase } from '@/lib/supabase';
import { setupPlaylistRealtime } from '@/lib/supabase';

/**
 * DisplayPage
 * @description 파티룸에서 보여줄 디스플레이 모드 페이지
 */
export default function DisplayPage() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [nextItem, setNextItem] = useState<PlaylistItem | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  // 다음 항목 업데이트 함수
  const updateNextItem = (items: PlaylistItem[], index: number) => {
    if (items.length > 0 && index < items.length - 1) {
      setNextItem(items[index + 1]);
    } else if (items.length > 0) {
      setNextItem(items[0]); // 마지막 항목이면 처음으로 돌아감
    } else {
      setNextItem(null);
    }
  };

  // 플레이리스트 가져오기
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const { data, error } = await supabase
          .from('playlist')
          .select('*')
          .order('addedAt', { ascending: true });

        if (error) throw error;
        
        const items = data || [];
        setPlaylist(items);
        
        // 다음 항목 설정
        updateNextItem(items, currentIndex);
      } catch (err) {
        console.error('플레이리스트 로드 오류:', err);
      }
    };

    fetchPlaylist();

    // 실시간 업데이트 구독
    const channel = setupPlaylistRealtime({
      onInsert: (newItem) => {
        setPlaylist(prev => {
          const updatedItems = [...prev, newItem];
          updatedItems.sort((a, b) => a.addedAt - b.addedAt);
          
          // 새 항목 추가 알림
          setSnackbarMessage(`새 노래가 추가되었습니다: ${newItem.title}`);
          setSnackbarOpen(true);
          
          // 다음 항목 업데이트
          updateNextItem(updatedItems, currentIndex);
          
          return updatedItems;
        });
      },
      onUpdate: (updatedItem) => {
        setPlaylist(prev => {
          const updatedItems = prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          );
          
          // 다음 항목 업데이트
          updateNextItem(updatedItems, currentIndex);
          
          return updatedItems;
        });
      },
      onDelete: (deletedItem) => {
        setPlaylist(prev => {
          const updatedItems = prev.filter(item => item.id !== deletedItem.id);
          
          // 현재 재생 중인 항목이 삭제된 경우 인덱스 조정
          if (currentIndex >= updatedItems.length && updatedItems.length > 0) {
            setCurrentIndex(0);
          }
          
          // 다음 항목 업데이트
          updateNextItem(updatedItems, currentIndex);
          
          return updatedItems;
        });
      },
      onError: (error) => {
        console.error('실시간 업데이트 오류:', error);
        setRealtimeStatus('disconnected');
        setSnackbarMessage('실시간 업데이트 연결에 문제가 발생했습니다. 새로고침을 해보세요.');
        setSnackbarOpen(true);
      },
      onReconnect: () => {
        setRealtimeStatus('connected');
        // 재연결 시 전체 목록 다시 가져오기
        fetchPlaylist();
      }
    });

    setRealtimeStatus('connected');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentIndex]);

  /**
   * 비디오 종료 핸들러
   */
  const handleVideoEnd = () => {
    // 다음 비디오로 이동
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 플레이리스트 끝에 도달하면 처음으로 돌아감
      setCurrentIndex(0);
    }
  };

  const currentItem = playlist.length > 0 && currentIndex < playlist.length 
    ? playlist[currentIndex] 
    : null;

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Button 
          component={Link} 
          href="/" 
          startIcon={<ArrowBackIcon />}
          color="primary"
        >
          메인으로 돌아가기
        </Button>
        <Typography variant="h6" color="primary">
          디스플레이 모드
        </Typography>
      </Box>

      {realtimeStatus === 'disconnected' && (
        <Box 
          sx={{ 
            bgcolor: 'warning.light', 
            color: 'warning.contrastText',
            p: 1,
            textAlign: 'center',
            fontSize: '0.875rem'
          }}
        >
          실시간 업데이트 연결이 끊어졌습니다. 새로고침을 해보세요.
        </Box>
      )}

      <Box sx={{ flex: 1, p: 2 }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <YouTubePlayer
            currentItem={currentItem}
            onVideoEnd={handleVideoEnd}
            onTogglePlay={setIsPlaying}
            isPlaying={isPlaying}
            onNextVideo={handleVideoEnd}
          />
          
          {nextItem && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 2, 
                mt: 2, 
                display: 'flex', 
                alignItems: 'center',
                borderRadius: 2
              }}
            >
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                다음 곡:
              </Typography>
              <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {nextItem.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                추가: {nextItem.addedBy}
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="info"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 