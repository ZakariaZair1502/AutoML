import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import SelectType from '@/pages/SelectType'
import Evaluation from '@/pages/Evaluation'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Results from '@/pages/Results'
import Home from '@/pages/Home'
import UploadPage from '@/pages/Upload'
import Prediction from '@/pages/Prediction'
import FeatureSelection from '@/pages/FeatureSelection'
import ProjectDetails from '@/pages/ProjectDetails'
import Plot_results from '@/pages/Plot_results'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/supervised" element={<UploadPage />} />
        <Route path="/unsupervised" element={<UploadPage />} />
        <Route path="/preprocessing" element={<UploadPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/select_type" element={<SelectType/>} />
        <Route path="/evaluate" element={<Evaluation/>} />
        <Route path="/results" element={<Results />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/predict" element={<Prediction />} />
        <Route path="/select_features" element={<FeatureSelection />} />
        <Route path="/plot_results" element={<Plot_results />} />
        <Route path="/project/:name" element={<ProjectDetails />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
