import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { BarChart3, ArrowLeft, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import type { Layout as PlotlyLayout } from 'plotly.js';


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
  const navigate = useNavigate();
  const [plotData, setPlotData] = useState<PlotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
      fetchPlotData();
   
  }, []);

  const fetchPlotData = async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/plot_results', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch plot data');

      const data = await response.json();
      console.log(data); // Ajouté pour déboguer les données reçues
      const parsedPlotData = typeof data.plot_data === "string"
      ? JSON.parse(data.plot_data)
      : data.plot_data;

    setPlotData(parsedPlotData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch plot data');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEvaluation = () => {
    navigate(`/evaluate`);
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const renderPlot = () => {
    if (!plotData) return null;

    let traces: any[] = [];

    if (plotData.type === 'regression') {
      traces = [
        {
          x: Array.from({ length: plotData.y_test?.length || 0 }, (_, i) => i),
          y: plotData.y_test,
          type: 'scatter',
          mode: 'markers',
          name: 'y_test',
          marker: { color: 'blue', size: 8 },
        },
        {
          x: Array.from({ length: plotData.predictions?.length || 0 }, (_, i) => i),
          y: plotData.predictions,
          type: 'scatter',
          mode: 'markers',
          name: 'y_pred',
          marker: { color: 'red', size: 8 },
        },
      ];
    } else {
      traces = [
        {
          x: plotData.x_pca_0,
          y: plotData.x_pca_1,
          type: 'scatter',
          mode: 'markers',
          marker: {
            color: plotData.labels,
            colorscale: 'Viridis',
            size: 10,
          },
        },
      ];
    }

    const layouts: Partial<PlotlyLayout> = {
      title: {
        text: plotData.title,
        font: { color: 'white', size: 20 },
      },
      xaxis: {
        title: { text: plotData.xlabel },
        color: 'white',
        gridcolor: 'rgba(255,255,255,0.2)',
      },
      yaxis: {
        title: { text: plotData.ylabel },
        color: 'white',
        gridcolor: 'rgba(255,255,255,0.2)',
      },
      hovermode: 'closest' as const, // ✅ "as const" pour typer correctement
      margin: { t: 50, l: 50, r: 50, b: 50 },
      showlegend: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'white' },
      legend: {
        font: { color: 'white' },
      },
    };
    

    return <Plot data={traces} layout={layouts} style={{ width: '100%', height: '500px' }} />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-white">
          Visualization loading...
        </div>
      </Layout>
    );
  }

  if (error || !plotData) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center text-white text-center">
          <p className="text-red-400">{error || 'error'}</p>
          <CustomButton onClick={handleBackToEvaluation} className="mt-4">
            Retour à l'évaluation
          </CustomButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 ">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Plot Visualization</h1>
          </div>

          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Graph infos</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Visualization type</p>
                  <p className="text-white font-medium">{plotData.type}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Titre</p>
                  <p className="text-white font-medium">{plotData.title}</p>
                </div>
              </div>
            </CustomCardBody>
          </CustomCard>

          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Graph</h2>
              </div>
            </CustomCardHeader>
            <div>
              {renderPlot()}
            </div>
              
            
          </CustomCard>

          <CustomCard>
            <CustomCardHeader>
              <h2 className="text-2xl font-semibold text-white">Actions</h2>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CustomButton onClick={handleBackToEvaluation} variant="secondary" size="lg">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to evaluation</span>
                </CustomButton>
                <CustomButton onClick={handleBackToHome} variant="outline" size="lg">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to homepage</span>
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
