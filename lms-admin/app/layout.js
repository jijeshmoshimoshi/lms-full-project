import './globals.css';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata = {
  title: 'SkillPulse Admin — Control Center',
  description: 'Manage courses, learners, instructors, and platform settings.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className="bg-slate-900 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 bg-slate-50 min-h-screen p-6 md:p-10 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
