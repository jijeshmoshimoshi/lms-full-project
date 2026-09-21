import './globals.css';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Navbar from '../components/Navbar';
import ChatbotWidget from '../components/ChatbotWidget';

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
  title: 'SkillPulse — Next-Gen Learning Platform',
  description: 'Master new skills with interactive courses, real-time analytics, and recognized certifications.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className="bg-mesh min-h-screen font-sans text-slate-800 antialiased flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 pb-16">{children}</main>
            <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-md py-8 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    S
                  </div>
                  <span className="font-heading font-bold text-slate-700 text-sm">SkillPulse LMS</span>
                </div>
                <p>© {new Date().getFullYear()} SkillPulse Learning Inc. All rights reserved.</p>
                <div className="flex gap-6 text-slate-600">
                  <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
                  <a href="#" className="hover:text-indigo-600 transition">Terms</a>
                  <a href="#" className="hover:text-indigo-600 transition">Support</a>
                </div>
              </div>
            </footer>
            <ChatbotWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
