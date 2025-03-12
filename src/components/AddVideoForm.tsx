import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Paper, 
  Box, 
  Typography, 
  Snackbar, 
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { extractYouTubeId } from '@/utils/youtube';

/**
 * AddVideoFormProps
 * @description 비디오 추가 폼 컴포넌트 props
 */
interface AddVideoFormProps {
  onAddVideo: (url: string, name: string) => Promise<void>;
}

/**
 * AddVideoForm
 * @description YouTube 비디오 링크를 추가하는 폼 컴포넌트
 * @param onAddVideo - 폼 제출 시 호출될 함수
 */
const AddVideoForm: React.FC<AddVideoFormProps> = ({ onAddVideo }) => {
  const [url, setUrl] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // URL 검증
    if (!url) {
      setError('YouTube URL을 입력해주세요');
      return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setError('유효한 YouTube URL이 아닙니다');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onAddVideo(url, name);
      
      // 성공 후 폼 초기화
      setUrl('');
      setName('');
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('비디오를 추가하는데 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 스낵바 닫기 핸들러
   */
  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        노래 추가하기
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="YouTube URL"
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
          sx={{ mb: 2 }}
          disabled={loading}
          error={!!error}
          helperText={error ? error : '유튜브 비디오 URL을 붙여넣으세요'}
        />
        
        <TextField
          fullWidth
          label="이름 (선택사항)"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="당신의 이름을 입력하세요"
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            disabled={loading}
          >
            {loading ? '추가 중...' : '노래 추가'}
          </Button>
        </Box>
      </form>
      
      <Snackbar 
        open={!!error || success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {error ? error : '노래가 성공적으로 추가되었습니다!'}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AddVideoForm;