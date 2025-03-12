'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import YouTubePlayer from '@/components/YouTubePlayer';
import { PlaylistItem } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * DisplayPage
 * @description 파티룸에서 보여줄 디스플레이 모드 페이지
 */
export default function DisplayPage() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [nextItem, setNextItem] = useState<PlaylistItem | null>(null);

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
        if (items.length > 0 && currentIndex < items.length - 1) {
          setNextItem(items[currentIndex + 1]);
        } else if (items.length > 0) {
          setNextItem(items[0]); // 마지막 항목이면 처음으로 돌아감
        }
      } catch (err) {
        console.error('플레이리스트 로드 오류:', err);
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
    </Box>
  );
} 