import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Onboarding',
  description: 'Plataforma de afiliación de comercios',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
