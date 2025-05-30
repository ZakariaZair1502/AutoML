import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { BarChart3, ArrowLeft, TrendingUp } from 'lucide-react';
import Layout from "@/components/Layout";

// Define the plot data interface
interface PlotData {
  type: 'regression' | 'classification' | 'clustering';
  title: string;
  xlabel: string;
  ylabel: string;
  y_test?: number[];
  predictions?: number[];
  x_pca_0?: number[];
  x_pca_1?: number[];
  labels?: number[];
}

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotData, setPlotData] = useState<PlotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plotInitialized, setPlotInitialized] = useState(false);

  const filename = searchParams.get('filename');
  const algo = searchParams.get('algo');
  const projectName = searchParams.get('project_name');
  const modelType = searchParams.get('model_type');
  const learningType = searchParams.get('learning_type');

  useEffect(() => {
    // Load Plotly.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (filename && algo && projectName && modelType && learningType) {
        fetchPlotData();
      }
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [filename, algo, projectName, modelType, learningType]);

  const fetchPlotData = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('filename', filename || '');
      formData.append('algo', algo || '');
      formData.append('project_name', projectName || '');
      formData.append('model_type', modelType || '');
      formData.append('learning_type', learningType || '');

      const response = await fetch('http://localhost:5000/plot_results', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to fetch plot data');

      const data = await response.json();
      setPlotData(data);
    } catch (err) {
      setError('Failed to load visualization data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createInteractivePlot = (data: PlotData) => {
    if (!plotRef.current || !window.Plotly) return;

    let traces: any[] = [];

    // For regression plots
    if (data.type === "regression") {
      traces = [
        {
          x: Array.from(Array(data.y_test?.length || 0).keys()),
          y: data.y_test,
          type: "scatter",
          mode: "markers",
          name: "y_test",
          marker: { color: "blue", size: 8 },
        },
        {
          x: Array.from(Array(data.predictions?.length || 0).keys()),
          y: data.predictions,
          type: "scatter",
          mode: "markers",
          name: "y_pred",
          marker: { color: "red", size: 8 },
        },
      ];
    }
    // For classification clusters
    else if (data.type === "classification") {
      traces = [
        {
          x: data.x_pca_0,
          y: data.x_pca_1,
          mode: "markers",
          type: "scatter",
          marker: {
            color: data.labels,
            colorscale: "Viridis",
            size: 10,
          },
        },
      ];
    }
    // For unsupervised clustering
    else if (data.type === "clustering") {
      traces = [
        {
          x: data.x_pca_0,
          y: data.x_pca_1,
          mode: "markers",
          type: "scatter",
          marker: {
            color: data.labels,
            colorscale: "Viridis",
            size: 10,
          },
        },
      ];
    }

    const layout = {
      title: {
        text: data.title,
        font: { color: 'white', size: 20 }
      },
      xaxis: { 
        title: data.xlabel,
        color: 'white',
        gridcolor: 'rgba(255,255,255,0.2)'
      },
      yaxis: { 
        title: data.ylabel,
        color: 'white',
        gridcolor: 'rgba(255,255,255,0.2)'
      },
      hovermode: "closest",
      margin: { t: 50, l: 50, r: 50, b: 50 },
      showlegend: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'white' },
      legend: { font: { color: 'white' } }
    };

    window.Plotly.newPlot(plotRef.current, traces, layout);
    setPlotInitialized(true);
  };

  const handleShowPlot = () => {
    if (plotData && !plotInitialized) {
      createInteractivePlot(plotData);
    }
  };

  const handleBackToEvaluation = () => {
    const params = new URLSearchParams({
      filename: filename || '',
      algo: algo || '',
      project_name: projectName || '',
      model_type: modelType || '',
      learning_type: learningType || ''
    });
    navigate(`/evaluation?${params.toString()}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-white text-lg">Chargement de la visualisation...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !plotData) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-red-400 text-lg">{error || 'Erreur lors du chargement'}</p>
              <CustomButton onClick={handleBackToEvaluation} className="mt-4">
                Retour à l'évaluation
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
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Visualisation des Résultats
            </h1>
          </div>

          {/* Plot Information */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Informations du Graphique</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Type de Visualisation</p>
                  <p className="text-white font-medium">{plotData.type}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Titre</p>
                  <p className="text-white font-medium">{plotData.title}</p>
                </div>
              </div>
            </CustomCardBody>
          </CustomCard>

          {/* Interactive Plot */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Graphique Interactif</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              {!plotInitialized && (
                <div className="text-center mb-4">
                  <CustomButton onClick={handleShowPlot} size="lg">
                    Afficher le Graphique
                  </CustomButton>
                </div>
              )}
              <div 
                ref={plotRef} 
                className="w-full h-96 bg-white/5 rounded-lg border border-white/10"
                style={{ minHeight: '500px' }}
              />
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
                  onClick={handleBackToEvaluation}
                  variant="secondary"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Retour à l'évaluation</span>
                </CustomButton>
                <CustomButton
                  onClick={handleBackToHome}
                  variant="outline"
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

export default Results;
