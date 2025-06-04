import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from "@/components/ProtectedRoute";
import Admin from '@/pages/Admin'
import SelectType from '@/pages/SelectType'
import Evaluation from '@/pages/Evaluation'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Results from '@/pages/Results'
import Home from '@/pages/Home'
import UploadPage from '@/pages/Upload'
import Preprocessing from '@/pages/Preprocessing'
import PreprocessingResults from '@/pages/PreprocessingResults'
import Prediction from '@/pages/Prediction'
import FeatureSelection from '@/pages/FeatureSelection'
import ProjectDetails from '@/pages/ProjectDetails'
import Plot_results from '@/pages/Plot_results'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
  future={{
    v7_startTransition: true,v7_relativeSplatPath: true,
  }}
>

<Routes>
  <Route path="/" element={<Login />} />
  <Route path="/register" element={<Register />} />

  {/* Routes protégées */}
  <Route
    path="/admin"
    element={
      <ProtectedRoute>
        <Admin />
      </ProtectedRoute>
    }
  />
  <Route
    path="/upload"
    element={
      <ProtectedRoute>
        <UploadPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/supervised"
    element={
      <ProtectedRoute>
        <UploadPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/unsupervised"
    element={
      <ProtectedRoute>
        <UploadPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/preprocessing"
    element={
      <ProtectedRoute>
        <UploadPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/select_type"
    element={
      <ProtectedRoute>
        <SelectType />
      </ProtectedRoute>
    }
  />
  <Route
    path="/evaluate"
    element={
      <ProtectedRoute>
        <Evaluation />
      </ProtectedRoute>
    }
  />
  <Route
    path="/results"
    element={
      <ProtectedRoute>
        <Results />
      </ProtectedRoute>
    }
  />
  <Route
    path="/home"
    element={
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    }
  />
  <Route
    path="/predict"
    element={
      <ProtectedRoute>
        <Prediction />
      </ProtectedRoute>
    }
  />
  <Route
    path="/select_features"
    element={
      <ProtectedRoute>
        <FeatureSelection />
      </ProtectedRoute>
    }
  />
  <Route
    path="/plot_results"
    element={
      <ProtectedRoute>
        <Plot_results />
      </ProtectedRoute>
    }
  />
  <Route
    path="/project/:name"
    element={
      <ProtectedRoute>
        <ProjectDetails />
      </ProtectedRoute>
    }
  />
  <Route
    path="/preprocessing/methods"
    element={
      <ProtectedRoute>
        <Preprocessing />
      </ProtectedRoute>
    }
  />
  <Route
    path="/preprocessing/apply"
    element={
      <ProtectedRoute>
        <PreprocessingResults />
      </ProtectedRoute>
    }
  />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>

    </BrowserRouter>
  </React.StrictMode>,
)
