'use client';

import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DevicesIcon from '@mui/icons-material/Devices';
import Link from 'next/link';

/**
 * HelpPage
 * @description 앱 사용 방법을 설명하는 도움말 페이지
 */
export default function HelpPage() {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Button 
            component={Link} 
            href="/" 
            startIcon={<ArrowBackIcon />}
            color="primary"
            sx={{ mr: 2 }}
          >
            메인으로 돌아가기
          </Button>
          <Typography variant="h4" component="h1">
            SlamSlam 사용 방법
          </Typography>
        </Box>
        
        <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            파티룸 플레이리스트 사용 가이드
          </Typography>
          
          <Typography variant="body1" paragraph>
            SlamSlam은 파티룸에서 여러 사람이 함께 플레이리스트를 만들고 관리할 수 있는 서비스입니다.
            유튜브 링크를 추가하고, 순서를 변경하고, 재생할 수 있습니다.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            주요 기능
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <AddIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="노래 추가하기" 
                secondary="YouTube URL을 입력하고 이름(선택사항)을 입력한 후 '노래 추가' 버튼을 클릭하세요."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <DragIndicatorIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="플레이리스트 순서 변경" 
                secondary="항목을 드래그하여 원하는 위치로 이동할 수 있습니다."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="노래 삭제" 
                secondary="각 항목 오른쪽의 삭제 버튼을 클릭하여 플레이리스트에서 제거할 수 있습니다."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <PlayArrowIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="재생 제어" 
                secondary="재생/일시정지, 다음 곡 버튼을 사용하여 재생을 제어할 수 있습니다."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <DevicesIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="디스플레이 모드" 
                secondary="파티룸의 대형 화면에 표시하기 위한 전용 모드입니다. 상단 메뉴에서 '디스플레이 모드'를 클릭하세요."
              />
            </ListItem>
          </List>
        </Paper>
        
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            설정 방법
          </Typography>
          
          <Typography variant="body1" paragraph>
            1. 파티룸의 메인 디스플레이 장치(노트북, PC 등)에서 브라우저를 열고 이 웹사이트에 접속합니다.
          </Typography>
          
          <Typography variant="body1" paragraph>
            2. 디스플레이 모드로 전환하여 전체 화면으로 표시합니다.
          </Typography>
          
          <Typography variant="body1" paragraph>
            3. 참가자들은 각자의 모바일 기기나 노트북에서 같은 웹사이트에 접속하여 플레이리스트에 노래를 추가할 수 있습니다.
          </Typography>
          
          <Typography variant="body1" paragraph>
            4. 모든 변경사항은 실시간으로 동기화됩니다.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
} 