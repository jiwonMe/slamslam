/**
 * PlaylistItem
 * @description 플레이리스트의 개별 항목을 나타내는 타입
 */
export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  addedAt: number;
  addedBy?: string;
}

/**
 * PlaylistState
 * @description 전체 플레이리스트 상태를 나타내는 타입
 */
export interface PlaylistState {
  items: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
}

/**
 * YouTubeVideoInfo
 * @description YouTube API에서 반환된 비디오 정보
 */
export interface YouTubeVideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
}

/**
 * DisplayMode
 * @description 앱의 표시 모드 (일반 또는 디스플레이)
 */
export type DisplayMode = 'normal' | 'display'; 