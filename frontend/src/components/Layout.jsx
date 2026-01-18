import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="bg-white shadow-inner py-4 text-center text-gray-600">
        © 2025 LearnSphere AI. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;