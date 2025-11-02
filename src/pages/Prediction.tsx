import React, { useState, useEffect } from 'react';
import { useLocation} from 'react-router-dom';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';
import { CheckCircle, FileText, Settings, Play } from 'lucide-react';
import Layout from "@/components/Layout";

interface PredictionResult {
  input_values: { [key: string]: any };
  prediction_result: string | number;
}
interface ModelInfo {
  filename: string;
  algo: string;
  model_type: string;
  project_name: string;
  learning_type: string;
}

const Prediction = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo>({
    filename: '',
    algo: '',
    model_type: '',
    project_name: '',
    learning_type: ''
  });
  const [features, setFeatures] = useState<string[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const model_info = location.state?.modelInfo;
    if (model_info) {
      try {
        const parsedInfo = model_info;
        setModelInfo(parsedInfo);
        fetchFeatures(parsedInfo);
      } catch (err) {
        console.error("Erreur parsing", err);
      }
    }else{
      console.error("modelInfo not sent from previous page");
    }
  }, []);

  const fetchFeatures = async (info: ModelInfo) => {
    try {
      console.log('Fetching Features for:', info);
      const response = await fetch(`http://localhost:5000/predict_page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(info)
      });
      const data = await response.json();
      console.log('Fetched Features:', data); // Add this line for debugging
      if (data.success && data.model_info?.features) {
        const featuresArray = data.model_info.features as string[];
        setFeatures(featuresArray);

        const initialValues: { [key: string]: string } = {};
        featuresArray.forEach((feature) => {
          initialValues[feature] = '';
        });
        setInputValues(initialValues);
      } else {
        throw new Error(data.error || 'Invalid response structure');
      } 
    }catch (err) {
      setError('Failed to load features');
      console.error(err);
    }
  };

  const handleInputChange = (feature: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Sending prediction request with:', {
        ...modelInfo,
        features: features,
        input_values: inputValues
      });
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...modelInfo,
          features: features,
          input_values : inputValues
        })
      });

      if (!response.ok) throw new Error('Prediction failed');

      const data = await response.json();
      if (data.success && 'prediction' in data) {
        setPredictionResult({
          input_values: inputValues,
          prediction_result: data.prediction
        });
      } else {
        throw new Error(data.error || 'Unexpected server response');
      }
    } catch (err) {
      setError('Prediction failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    window.location.href = '/evaluate';
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Faire une prédiction
            </h1>
            <p className="text-gray-300 text-lg">
              Utilisez votre modèle entraîné pour faire des prédictions
            </p>
          </div>

          {/* Model Info */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Informations du modèle</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Fichier</p>
                  <p className="text-white font-medium">{modelInfo.filename}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Algorithme</p>
                  <p className="text-white font-medium">{modelInfo.algo}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Type de modèle</p>
                  <p className="text-white font-medium">{modelInfo.model_type}</p>
                </div>
              </div>
            </CustomCardBody>
          </CustomCard>

          {/* Prediction Result */}
          {predictionResult && (
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h2 className="text-2xl font-semibold text-white">Résultat de la prédiction</h2>
                </div>
              </CustomCardHeader>
              <CustomCardBody>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-white font-medium">Feature</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Valeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(predictionResult.input_values).map(([feature, value]) => (
                        <tr key={feature} className="border-b border-white/10">
                          <td className="py-3 px-4 text-gray-300">{feature}</td>
                          <td className="py-3 px-4 text-white">{value}</td>
                        </tr>
                      ))}
                      <tr className="border-b border-white/10 bg-purple-500/10">
                        <td className="py-3 px-4 text-white font-bold">Prédiction</td>
                        <td className="py-3 px-4 text-white font-bold">{predictionResult.prediction_result}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Prediction Form */}
          {!predictionResult && features.length > 0 && (
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">Entrer les valeurs des features</h2>
                </div>
              </CustomCardHeader>
              <CustomCardBody>
                <Form onSubmit={handlePredict}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature) => (
                      <FormGroup key={feature}>
                        <FormLabel htmlFor={`feature_${feature}`}>{feature}</FormLabel>
                        <FormInput
                          type="text"
                          id={`feature_${feature}`}
                          value={inputValues[feature] || ''}
                          onChange={(e) => handleInputChange(feature, e.target.value)}
                          required
                        />
                      </FormGroup>
                    ))}
                  </div>
                  
                  <div className="flex justify-center mt-8">
                    <CustomButton
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {loading ? "Prédiction en cours..." : "Prédire"}
                    </CustomButton>
                  </div>
                </Form>
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Error Display */}
          {error && (
            <CustomCard className="mb-8">
              <CustomCardBody>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Action Buttons */}
          <CustomCard>
            <CustomCardHeader>
              <h2 className="text-2xl font-semibold text-white">Actions</h2>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CustomButton
                  onClick={handleEvaluate}
                  disabled={loading}
                  variant="secondary"
                  size="lg"
                >
                  Evaluate Model
                </CustomButton>
              </div>
            </CustomCardBody>
          </CustomCard>
        </div>
      </div>
    </Layout>
  );
};

export default Prediction;
