import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody } from '../components/ui/custom-card';
import { CustomButton } from '../components/ui/custom-button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';


const Results: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch('http://localhost:5000/train_model', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch model info');
        const data = await response.json();
        if (data.success && data.model_info) {
          // À faire juste après le fetch
        const parsedPredictions = data.model_info.predictions_values.map((val: string) => {
          const cleaned = val.replace(/[()]/g, '');
          const [a, b] = cleaned.split(',').map(Number);
          return [a, b];
        });
        data.model_info.predictions_values = parsedPredictions;

          localStorage.setItem('modelInfo', JSON.stringify(data.model_info));
          console.log(data.model_info);
          setModelInfo(data.model_info);
        } else {
          setError('No model info returned');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching model info');
      }
    };
    fetchModelInfo();
  }, []);

  if (!modelInfo) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <CustomCard className="max-w-6xl mx-auto">
            <CustomCardHeader>
              <h1 className="text-3xl font-bold text-white">Results</h1>
            </CustomCardHeader>
            <CustomCardBody>
              <p className="text-gray-400 text-center py-8">{error || 'Loading model info...'}</p>
            </CustomCardBody>
          </CustomCard>
        </div>
      </Layout>
    );
  }

  const { filename, project_name, algo, model_type, learning_type, features, predictions_values, params_dict, preprocessing_options } = modelInfo;
  const pageTitle = learning_type === 'unsupervised' ? 'Unsupervised Results' : 'Results';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <CustomCard className="max-w-6xl mx-auto">
          <CustomCardHeader>
            <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
          </CustomCardHeader>
          <CustomCardBody className="space-y-6">
            {/* Model Information */}
            <div className="space-y-3 text-gray-200">
              <p>
                <strong className="text-white">File:</strong> {filename} {error && <span className="text-red-400">{error}</span>}
              </p>
              <p>
                <strong className="text-white">Algorithm:</strong> {algo}
              </p>
              <p>
                <strong className="text-white">Selected features:</strong> {Array.isArray(features) ? features.join(', ') : features}
              </p>
              <p>
                <strong className="text-white">Selected parameters:</strong> (
                {params_dict && typeof params_dict === 'object' ? Object.entries(params_dict).map(([key, value], index) => (
                  <span key={key}>
                    {key}={String(value)}{index < Object.entries(params_dict).length - 1 ? ', ' : ''}
                  </span>
                )) : ''}
                )
              </p>
              <p>
                <strong className="text-white">Selected preprocessing:</strong> ({Array.isArray(preprocessing_options) ? preprocessing_options.join(', ') : preprocessing_options})
              </p>
            </div>
            {/* Predictions Table */}
            {Array.isArray(predictions_values) && predictions_values.length > 0 ? (
  <div className="space-y-4">
    <h2 className="text-2xl font-semibold text-white">
      {learning_type === 'unsupervised'
        ? 'X vs Predicted Classes'
        : 'Predictions vs Actual Values'}
    </h2>
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead className="text-gray-200">
              {learning_type === 'unsupervised' ? 'X' : 'Prediction'}
            </TableHead>
            <TableHead className="text-gray-200">
              {learning_type === 'unsupervised' ? 'Class' : 'Actual Value'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {predictions_values.slice(0, 10).map((item: any, index: number) => (
            <TableRow key={index} className="border-white/10">
              <TableCell className="text-gray-300">{item[0]}</TableCell>
              <TableCell className="text-gray-300">{item[1]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No predictions available.</p>
            )}
            {/* Prediction Button for Supervised Learning */}
            {learning_type !== 'unsupervised' && (
              <div className="flex justify-center">
                <Link
                  to={`/predict`}
                >
                  <CustomButton variant="secondary">
                    Faire une prédiction
                  </CustomButton>
                </Link>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-6">
              <CustomButton 
                onClick={() => {navigate("/evaluate");}}
                variant="primary"
              >
                Evaluate Model
              </CustomButton>
            </div>
          </CustomCardBody>
        </CustomCard>
      </div>
    </Layout>
  );
};

export default Results;
