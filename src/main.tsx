import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from '@/pages/home'
import SupervisedLearning from '@/pages/supervised'
import UnsupervisedLearning from '@/pages/unsupervised'
import Preprocessing from '@/pages/preprocessing'
import Dashboard from '@/pages/dashboard'
import UploadPage from '@/pages/upload'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/supervised" element={<Navigate to="/upload" />} />
        <Route path="/unsupervised" element={<Navigate to="/upload" />} />
        <Route path="/preprocessing" element={<Navigate to="/upload" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
