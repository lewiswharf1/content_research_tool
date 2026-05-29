import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { SearchPage } from '@/pages/SearchPage'
import { SavedPage } from '@/pages/SavedPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SearchPage />} />
          <Route path="saved" element={<SavedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
