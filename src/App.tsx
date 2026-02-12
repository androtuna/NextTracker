import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import SearchPage from '@/pages/SearchPage';
import SettingsPage from '@/pages/SettingsPage';
import BooksPage from '@/pages/BooksPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
