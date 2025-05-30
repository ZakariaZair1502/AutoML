import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import SupervisedLearning from '@/pages/supervised'
import UnsupervisedLearning from '@/pages/unsupervised'
import SelectType from '@/pages/SelectType'
import Evaluation from '@/pages/Evaluation'
import Preprocessing from '@/pages/preprocessing'
import Dashboard from '@/pages/dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/register'
import Results from '@/pages/Results'
import App from '@/pages/home'
import UploadPage from '@/pages/upload'
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
        <Route path="/home" element={<App />} />
        <Route path="/register" element={<Register />} />
        <Route path="/predict" element={<Prediction />} />
        <Route path="/select_features" element={<FeatureSelection />} />
        <Route path="/project_details" element={<ProjectDetails />} />
        /* <Route path="/plot_results" element={<Plot_results />} /> */
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
