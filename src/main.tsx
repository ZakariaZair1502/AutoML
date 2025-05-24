import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import SupervisedLearning from '@/pages/supervised'
import UnsupervisedLearning from '@/pages/unsupervised'
import SelectType from '@/pages/SelectType'
import ModelEvaluation from '@/pages/ModelEvaluation'
import Preprocessing from '@/pages/preprocessing'
import Dashboard from '@/pages/dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/register'

import App from '@/pages/home'
import UploadPage from '@/pages/upload'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/supervised" element={<Navigate to="/upload" />} />
        <Route path="/unsupervised" element={<Navigate to="/upload" />} />
        <Route path="/preprocessing" element={<Navigate to="/upload" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/select_type" element={<SelectType />} />
        {/* <Route path="/evaluate" element={<ModelEvaluation filename='hello' algo='supervised' />} /> */}
        <Route path="/home" element={<App />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
