import React, { useRef, useState } from 'react';
import YouTube, { YouTubePlayer, YouTubeEvent, YouTubeProps } from 'react-youtube';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { extractYouTubeId } from '@/utils/youtube';
import { PlaylistItem } from '@/types';

/**
 * YouTubePlayerProps
 * @description YouTube 플레이어 컴포넌트 props
 */
interface YouTubePlayerProps {
  currentItem: PlaylistItem | null;
  onVideoEnd: () => void;
  onTogglePlay: (isPlaying: boolean) => void;
  isPlaying: boolean;
  onNextVideo: () => void;
}

/**
 * YouTubePlayer
 * @description YouTube 비디오를 재생하는 컴포넌트
 * @param currentItem - 현재 재생 중인 플레이리스트 항목
 * @param onVideoEnd - 비디오 종료 시 호출될 함수
 * @param onTogglePlay - 재생/일시정지 토글 시 호출될 함수
 * @param isPlaying - 현재 재생 중인지 여부
 * @param onNextVideo - 다음 비디오 버튼 클릭 시 호출될 함수
 */
const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  currentItem,
  onVideoEnd,
  onTogglePlay,
  isPlaying,
  onNextVideo
}) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // YouTube 옵션
  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      iv_load_policy: 3,
    },
  };

  /**
   * 준비 완료 핸들러
   */
  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    if (isMuted) {
      playerRef.current.mute();
    }
  };

  /**
   * 재생/일시정지 토글 핸들러
   */
  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    
    onTogglePlay(!isPlaying);
  };

  /**
   * 음소거 토글 핸들러
   */
  const handleToggleMute = () => {
    if (!playerRef.current) return;
    
    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    
    setIsMuted(!isMuted);
  };

  if (!currentItem) {
    return (
      <Paper
        sx={{
          height: '0',
          paddingBottom: '56.25%', // 16:9 종횡비
          position: 'relative',
          bgcolor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6">
            재생할 비디오가 없습니다
          </Typography>
          <Typography variant="body2">
            플레이리스트에 비디오를 추가해보세요
          </Typography>
        </Box>
      </Paper>
    );
  }

  const videoId = extractYouTubeId(currentItem.url);

  if (!videoId) {
    return (
      <Paper
        sx={{
          height: '0',
          paddingBottom: '56.25%',
          position: 'relative',
          bgcolor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'error.main',
          }}
        >
          <Typography>유효하지 않은 YouTube URL입니다</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      <Paper
        elevation={3}
        sx={{
          height: '0',
          paddingBottom: '56.25%', // 16:9 종횡비
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={handleReady}
            onEnd={onVideoEnd}
          />
        </Box>
        
        {/* 컨트롤 오버레이 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
          }}
        >
          <Box>
            <IconButton onClick={handleTogglePlay} color="primary">
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={onNextVideo} color="primary">
              <SkipNextIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="white" sx={{ mr: 2 }}>
              {currentItem.title}
            </Typography>
            <IconButton onClick={handleToggleMute} color="primary">
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default YouTubePlayer; 