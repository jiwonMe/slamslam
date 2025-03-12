'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  AppBar, 
  Toolbar, 
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SettingsIcon from '@mui/icons-material/Settings';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import AddVideoForm from '@/components/AddVideoForm';
import Playlist from '@/components/Playlist';
import YouTubePlayer from '@/components/YouTubePlayer';
import { PlaylistItem } from '@/types';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 플레이리스트 가져오기
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const { data, error } = await supabase
          .from('playlist')
          .select('*')
          .order('addedAt', { ascending: true });

        if (error) throw error;
        setPlaylist(data || []);
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
  }, []);

  /**
   * 비디오 추가 핸들러
   */
  const handleAddVideo = async (url: string, name: string) => {
    try {
      const { error } = await fetch('/api/playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url, 
          addedBy: name || '익명' 
        })
      }).then(res => {
        if (!res.ok) throw new Error('비디오 추가 실패');
        return res.json();
      });

      if (error) throw new Error(error);
    } catch (err) {
      console.error('비디오 추가 오류:', err);
      throw err;
    }
  };

  /**
   * 플레이리스트 재정렬 핸들러
   */
  const handleReorderPlaylist = (newItems: PlaylistItem[]) => {
    setPlaylist(newItems);
  };

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

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const currentItem = playlist.length > 0 && currentIndex < playlist.length 
    ? playlist[currentIndex] 
    : null;

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <QueueMusicIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SlamSlam 파티룸
          </Typography>
          
          {!isMobile && (
            <>
              <Button color="inherit" component={Link} href="/display">
                <DisplaySettingsIcon sx={{ mr: 1 }} />
                디스플레이 모드
              </Button>
              <Button color="inherit" component={Link} href="/help">
                <SettingsIcon sx={{ mr: 1 }} />
                도움말
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
        >
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/display">
                <ListItemIcon><DisplaySettingsIcon /></ListItemIcon>
                <ListItemText primary="디스플레이 모드" />
              </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/help">
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="도움말" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          파티룸 노래 플레이리스트
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <AddVideoForm onAddVideo={handleAddVideo} />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              <MusicNoteIcon /> 현재 재생
            </Typography>
            <YouTubePlayer
              currentItem={currentItem}
              onVideoEnd={handleVideoEnd}
              onTogglePlay={setIsPlaying}
              isPlaying={isPlaying}
              onNextVideo={() => handleVideoEnd()}
            />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              <QueueMusicIcon /> 플레이리스트
            </Typography>
            <Playlist
              currentPlayingIndex={currentIndex}
              onReorder={handleReorderPlaylist}
            />
          </Box>
        </Box>
      </Container>
    </>
  );
}
