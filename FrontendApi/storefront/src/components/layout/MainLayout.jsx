import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '../ChatWidget';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
