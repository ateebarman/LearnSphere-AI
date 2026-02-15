import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mesh-bg opacity-[0.4] dark:opacity-[0.2]" />
      <Navbar />
      <main className="relative flex-grow container mx-auto px-6 py-12 z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
