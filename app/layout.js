import './globals.css';
import { ConfigProvider } from '@/context/ConfigContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata = {
  title: 'Ikko AI Chat',
  description: 'Ikko AI Chat Client',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ConfigProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
