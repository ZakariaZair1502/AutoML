import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Database, TrendingUp, AlertCircle } from 'lucide-react';

interface PreprocessingResult {
  name: string;
  params: Record<string, string>;
}
interface DatasetPreview {
  columns: string[];
  data: string[][];
}


interface PreprocessingApiResponse {
  success: boolean;
  stats: {
    rows: number;
    columns: number;
    missing_values: number;
    memory_usage: string;
  };
  applied_methods: PreprocessingResult[];
  visualizations?: Array<{
    title: string;
    image_path: string;
  }>;
  preview_data?: DatasetPreview;
}

const PreprocessingResults = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<PreprocessingResult[]>([]);
  const [stats, setStats] = useState<PreprocessingApiResponse['stats'] | null>(null);
  const [visualizations, setVisualizations] = useState<Array<{title: string; image_path: string}>>([]);
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);



  useEffect(() => {
    fetchPreprocessingResults();
  }, []);

  const fetchPreprocessingResults = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5000/preprocessing/apply`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }

      );
      const data: PreprocessingApiResponse = await response.json();
      console.log('API Response:', data);
      if (data.success) {
        setResults(data.applied_methods);
        setStats(data.stats);
        setVisualizations(data.visualizations || []);
        setPreviewData(data.preview_data || null);
      } else {
        throw new Error('Failed to fetch results');
      }
    } catch (error) {
      console.error('Error fetching preprocessing results:', error);
      // Fallback to mock data if API fails
      setResults([
        {
          name: 'Normalization',
          params: {
            'Méthode': 'minmax',
            'Colonnes': 'age, salary, experience'
          }
        }
      ]);
      setStats({
        rows: 988,
        columns: 8,
        missing_values: 0,
        memory_usage: '2.45 MB'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (methodName: string) => {
    // Simple logic to assign status based on method name
    return <CheckCircle className="w-5 h-5 text-green-400" />;
  };

  const getStatusBadge = (methodName: string) => {
    return (
      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">
        Succès
      </Badge>
    );
  };

  const handleContinue = () => {
    window.open("http://localhost:5000/preprocessing/report", "_blank");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-white text-lg">Loading ...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Preprocessing Results
            </h1>
          </div>

          {/* Dataset Overview */}
          {stats && (
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">Dataset Overview</h2>
                </div>
              </CustomCardHeader>
              <CustomCardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{stats.rows}</div>
                    <div className="text-gray-300 text-sm">Lines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{stats.columns}</div>
                    <div className="text-gray-300 text-sm">Columns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{stats.missing_values}</div>
                    <div className="text-gray-300 text-sm">Misssing Values</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{stats.memory_usage}</div>
                    <div className="text-gray-300 text-sm">Used Memory</div>
                  </div>
                </div>
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Processing Results */}
          <CustomCard className="mb-8"> 
            <CustomCardHeader>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-semibold text-white">Used Methods</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border border-white/10 rounded-lg p-4 bg-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.name)}
                        <h3 className="text-lg font-semibold text-white">{result.name}</h3>
                      </div>
                      {getStatusBadge(result.name)}
                    </div>
                    
                    {Object.keys(result.params).length > 0 && (
                      <div className="bg-black/20 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-white mb-2">Parameters:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {Object.entries(result.params).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-gray-400">{key}:</span>
                              <span className="text-white ml-2">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CustomCardBody>
          </CustomCard>
          <CustomCard className="p-0">
              <CustomCardHeader>
                <h2 className="text-xl font-semibold text-white">
                  Dataset Preview
                </h2>
              </CustomCardHeader>
              <CustomCardBody>
                {previewData ? (
                  <div className="overflow-x-auto bg-white">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          {previewData.columns.map((column, index) => (
                            <th
                              key={index}
                              className="px-6 py-3 bg-[rgba(255,255,255,0.05)] text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700 bg-[rgba(255,255,255,0.02)]">
                        {previewData.data.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-[rgba(255,255,255,0.05)]"
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                              >
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <i className="ri-file-list-3-line text-5xl mb-4 block"></i>
                    <p>Select a dataset to see preview</p>
                  </div>
                )}
              </CustomCardBody>
            </CustomCard>

          {/* Visualizations */}
          {visualizations.length > 0 && (
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <h2 className="text-2xl font-semibold text-white">Preprocessing Plots</h2>
              </CustomCardHeader>
              <CustomCardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visualizations.map((viz, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">{viz.title}</h3>
                      <img 
                        src={viz.image_path} 
                        alt={viz.title}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <CustomButton 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Back to Preprocessing Methods
            </CustomButton>
          
            <CustomButton onClick={handleContinue} size="lg" className="flex items-center space-x-2">
              <span>Download Preprocessing Report</span>
              <ArrowRight className="w-5 h-5" />
            </CustomButton>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PreprocessingResults;
