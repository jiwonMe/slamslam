import React, { useRef, useState, useEffect } from 'react';
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
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;

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
      host: 'https://www.youtube-nocookie.com', // Privacy-enhanced mode
      enablejsapi: 1,
      disablekb: 1,
      hl: 'ko',
      cc_load_policy: 0,
      playsinline: 1
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
    // 이전 오류 초기화
    setPlayerError(null);
    // 재시도 카운트 초기화
    setRetryCount(0);
    
    console.log('YouTube 플레이어 준비 완료');
  };

  /**
   * 오류 핸들러
   */
  const handleError = (event: YouTubeEvent) => {
    const errorCode = event.data;
    console.error('YouTube 플레이어 오류 코드:', errorCode);
    
    // 오류 코드에 따른 메시지 설정
    let errorMessage = '비디오를 로드하는 중 오류가 발생했습니다';
    
    switch(errorCode) {
      case 2:
        errorMessage = '잘못된 매개변수 값입니다 (오류 코드: 2)';
        break;
      case 5:
        errorMessage = 'HTML5 플레이어 관련 오류가 발생했습니다 (오류 코드: 5)';
        break;
      case 100:
        errorMessage = '요청한 비디오를 찾을 수 없습니다 (오류 코드: 100)';
        break;
      case 101:
      case 150:
        errorMessage = '소유자가 다른 웹사이트에서의 재생을 허용하지 않습니다 (오류 코드: ' + errorCode + ')';
        break;
    }
    
    setPlayerError(errorMessage);
    
    // 일부 오류는 재시도
    if (retryCount < maxRetries && [5, 100].includes(errorCode)) {
      setRetryCount(prev => prev + 1);
    }
  };

  /**
   * 오류 발생 시 재시도
   */
  useEffect(() => {
    if (playerError && retryCount > 0 && retryCount <= maxRetries) {
      const timer = setTimeout(() => {
        console.log(`YouTube 플레이어 재시도 (${retryCount}/${maxRetries})...`);
        // 컴포넌트 강제 리렌더링을 위한 상태 업데이트
        setPlayerError(prev => `${prev} (재시도 중...)`);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [retryCount, playerError]);

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
          {playerError ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'background.paper',
                color: 'error.main',
                p: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" gutterBottom>
                {playerError}
              </Typography>
              {retryCount <= maxRetries && (
                <Typography variant="body2">
                  {retryCount > 0 ? `재시도 중... (${retryCount}/${maxRetries})` : ''}
                </Typography>
              )}
            </Box>
          ) : (
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={handleReady}
              onEnd={onVideoEnd}
              onError={handleError}
              onStateChange={(e) => {
                // 상태 변경 로깅 (디버깅용)
                console.log('YouTube 플레이어 상태 변경:', e.data);
              }}
            />
          )}
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