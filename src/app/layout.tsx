import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeRegistry } from '@/components/ThemeRegistry';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SlamSlam - 파티룸 플레이리스트',
  description: '다같이 만드는 파티룸 플레이리스트',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: inter.style.fontFamily }}>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
