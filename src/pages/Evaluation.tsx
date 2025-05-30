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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filename = localStorage.getItem('filename');
  const algo = localStorage.getItem('algo');
  const projectName = localStorage.getItem('project_name');
  const modelType = localStorage.getItem('model_type');
  const learningType = localStorage.getItem('learning_type');
  useEffect(() => {
    
    fetchEvaluation();
  }, [filename, algo, projectName, modelType, learningType]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      console.log("before fetch")

      const response = await fetch(`http://localhost:5000/evaluate`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      console.log(response)
      if (!response.ok) throw new Error('Failed to evaluate model');
      if (response.ok){
        console.log("after fetch")
      }

      const data = await response.json();
      setMetrics(data.metrics);
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
    if (learningType === 'supervised' && modelType === 'regression') {
      return 'Plot Error Curve';
    } else if (learningType === 'supervised' && modelType === 'classification') {
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
              <p className="text-white text-lg">Évaluation du modèle en cours...</p>
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
      <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Évaluation du Modèle
            </h1>
          </div>

          {/* Model Information */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Informations du Modèle</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Fichier</p>
                  <p className="text-white font-medium">{filename}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Algorithme</p>
                  <p className="text-white font-medium">{algo}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Type de Modèle</p>
                  <p className="text-white font-medium">{modelType}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Type d'Apprentissage</p>
                  <p className="text-white font-medium">{learningType}</p>
                </div>
              </div>
            </CustomCardBody>
          </CustomCard>

          {/* Metrics */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Métriques</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningType === 'supervised' ? (
                  modelType === 'regression' ? (
                    <>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Score</p>
                        <p className="text-white font-medium text-xl">{metrics.score?.toFixed(4)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Mean Squared Error (MSE)</p>
                        <p className="text-white font-medium text-xl">{metrics.mse?.toFixed(4)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 md:col-span-2">
                        <p className="text-gray-400 text-sm">Mean Absolute Error (MAE)</p>
                        <p className="text-white font-medium text-xl">{metrics.mae?.toFixed(4)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Accuracy</p>
                        <p className="text-white font-medium text-xl">{metrics.accuracy?.toFixed(4)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Precision</p>
                        <p className="text-white font-medium text-xl">{metrics.precision?.toFixed(4)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">Recall</p>
                        <p className="text-white font-medium text-xl">{metrics.recall?.toFixed(4)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm">F1 Score</p>
                        <p className="text-white font-medium text-xl">{metrics.f1_score?.toFixed(4)}</p>
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm">Silhouette Score</p>
                      <p className="text-white font-medium text-xl">{metrics.silhouette?.toFixed(4)}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm">Calinski-Harabasz Index</p>
                      <p className="text-white font-medium text-xl">{metrics.calinski_harabasz?.toFixed(4)}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm">Davies-Bouldin Index</p>
                      <p className="text-white font-medium text-xl">{metrics.davies_bouldin?.toFixed(4)}</p>
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
                  <span>Retour à l'accueil</span>
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
