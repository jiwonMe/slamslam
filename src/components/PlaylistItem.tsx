import React from 'react';
import { 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  IconButton, 
  Typography,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { PlaylistItem as PlaylistItemType } from '@/types';

/**
 * PlaylistItemProps
 * @description 플레이리스트 항목 컴포넌트 props
 */
interface PlaylistItemProps {
  item: PlaylistItemType;
  isCurrentlyPlaying?: boolean;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

/**
 * PlaylistItem
 * @description 플레이리스트의 단일 항목을 표시하는 컴포넌트
 * @param item - 표시할 플레이리스트 항목 데이터
 * @param isCurrentlyPlaying - 현재 재생 중인지 여부
 * @param onDelete - 삭제 버튼 클릭 시 호출될 함수
 * @param isDragging - 드래그 중인지 여부
 */
const PlaylistItem: React.FC<PlaylistItemProps> = ({ 
  item, 
  isCurrentlyPlaying = false, 
  onDelete,
  isDragging = false
}) => {
  return (
    <ListItem
      sx={{
        borderLeft: isCurrentlyPlaying ? '4px solid #90caf9' : 'none',
        bgcolor: isDragging ? 'rgba(144, 202, 249, 0.1)' : isCurrentlyPlaying ? 'rgba(144, 202, 249, 0.05)' : 'transparent',
        transition: 'background-color 0.3s ease',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.08)',
        },
        mb: 1,
        borderRadius: 1,
      }}
      secondaryAction={
        <IconButton edge="end" aria-label="delete" onClick={() => onDelete(item.id)}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mr: 2, 
          cursor: 'grab',
          color: 'text.secondary',
        }}
      >
        <DragHandleIcon />
      </Box>
      
      <ListItemAvatar>
        <Avatar 
          variant="rounded" 
          src={item.thumbnail} 
          alt={item.title}
          sx={{ width: 80, height: 45 }}
        />
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Typography
            variant="body1"
            sx={{
              fontWeight: isCurrentlyPlaying ? 'bold' : 'normal',
              color: isCurrentlyPlaying ? 'primary.main' : 'text.primary',
            }}
          >
            {item.title}
          </Typography>
        }
        secondary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {item.addedBy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.duration}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

export default PlaylistItem; 