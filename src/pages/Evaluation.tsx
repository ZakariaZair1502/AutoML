import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { BarChart3, TrendingUp, ArrowLeft, Eye } from 'lucide-react';
import Layout from "@/components/Layout";

interface Metrics {
  // Supervised regression metrics
  score?: number;
  mse?: number;
  mae?: number;
  // Supervised classification metrics
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  // Unsupervised metrics
  silhouette?: number;
  calinski_harabasz?: number;
  davies_bouldin?: number;
  n_clusters?: number;
}

const Evaluation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [modelInfo, setModelInfo] = useState<{
    filename: string;
    algo: string;
    projectName: string;
    modelType: string;
    learningType: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    
    fetchEvaluation();
  },[]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/evaluate`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to evaluate model');
      if (response.ok){
        const data = await response.json();
        console.log("data ",data.metrics)
        setMetrics(data.metrics);
        setModelInfo({
          filename: data.model_info.filename,
          algo: data.model_info.algo,
          projectName: data.model_info.project_name,
          modelType: data.model_info.model_type,
          learningType: data.model_info.learning_type,
        });
      }

      
    } catch (err) {
      setError('Failed to evaluate model');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlotResults = async () => {
    try {
      const response = await fetch('http://localhost:5000/plot_results', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to generate plot');
      const data = await response.json();
      // Handle the plot response - this might redirect to a visualization page
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      console.error('Error generating plot:', err);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const getPlotButtonText = () => {
    if (modelInfo?.learningType === 'supervised' && modelInfo?.modelType === 'regression') {
      return 'Plot Error Curve';
    } else if (modelInfo?.learningType === 'supervised' && modelInfo?.modelType === 'classification') {
      return 'Show Classification Clusters';
    } else {
      return 'Show Unsupervised Clusters';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 ">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-white text-lg">Model Evaluation...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !metrics) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-red-400 text-lg">{error || 'Erreur lors de l\'évaluation'}</p>
              <CustomButton onClick={handleBackToHome} className="mt-4">
                Retour à l'accueil
              </CustomButton>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 ">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Model Evaluation 
            </h1>
          </div>

          {/* Model Information */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Model infos</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm">filename</p>
                  <p className="text-white font-medium">{modelInfo?.filename}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Algorithme</p>
                  <p className="text-white font-medium">{modelInfo?.algo}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Model type</p>
                  <p className="text-white font-medium">{modelInfo?.modelType}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Learning type</p>
                  <p className="text-white font-medium">{modelInfo?.learningType}</p>
                </div>
              </div>
            </CustomCardBody>
          </CustomCard>

          {/* Metrics */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Metrics</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modelInfo?.learningType === 'supervised' ? (
                  modelInfo?.modelType === 'regression' ? (
                    <>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Score</p>
                        <p className="text-white font-medium text-xl">{metrics.score?.toFixed(8)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Mean Squared Error (MSE)</p>
                        <p className="text-white font-medium text-xl">{metrics.mse?.toFixed(8)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 md:col-span-2">
                        <p className="text-gray-400 text-sm">Mean Absolute Error (MAE)</p>
                        <p className="text-white font-medium text-xl">{metrics.mae?.toFixed(8)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Accuracy</p>
                        <p className="text-white font-medium text-xl">{metrics.accuracy?.toFixed(8)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Precision</p>
                        <p className="text-white font-medium text-xl">{metrics.precision?.toFixed(8)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Recall</p>
                        <p className="text-white font-medium text-xl">{metrics.recall?.toFixed(8)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">F1 Score</p>
                        <p className="text-white font-medium text-xl">{metrics.f1_score?.toFixed(8)}</p>
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm">Silhouette Score</p>
                      <p className="text-white font-medium text-xl">{metrics.silhouette != null ? metrics.silhouette.toFixed(8) : "Non calculable"}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm">Calinski-Harabasz Index</p>
                      <p className="text-white font-medium text-xl">{metrics.calinski_harabasz != null ? metrics.calinski_harabasz.toFixed(8) : "Non calculable"}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm">Davies-Bouldin Index</p>
                      <p className="text-white font-medium text-xl">{metrics.davies_bouldin != null ? metrics.davies_bouldin.toFixed(8) : "Non calculable"}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm">Number of Clusters</p>
                      <p className="text-white font-medium text-xl">{metrics.n_clusters}</p>
                    </div>
                  </>
                )}
              </div>
            </CustomCardBody>
          </CustomCard>

          {/* Actions */}
          <CustomCard>
            <CustomCardHeader>
              <h2 className="text-2xl font-semibold text-white">Actions</h2>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CustomButton
                  onClick={handlePlotResults}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-5 h-5" />
                  <span>{getPlotButtonText()}</span>
                </CustomButton>
                <CustomButton
                  onClick={handleBackToHome}
                  variant="secondary"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Home page</span>
                </CustomButton>
              </div>
            </CustomCardBody>
          </CustomCard>
        </div>
      </div>
    </Layout>
  );
};

export default Evaluation;
