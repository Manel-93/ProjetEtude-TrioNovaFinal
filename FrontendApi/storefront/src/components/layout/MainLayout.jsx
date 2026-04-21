import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Aurora from '../effects/Aurora';

export default function MainLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <Aurora
          colorStops={['#ffffff', '#06d2d4', '#ffffff']}
          blend={0.5}
          amplitude={1.0}
          speed={1}
        />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
