
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Trash2, Settings, BarChart3 } from 'lucide-react';
import Layout from "@/components/Layout";

interface FeatureStats {
  mean: number;
  std: number;
  min: number;
  max: number;
}

const FeatureSelection: React.FC = () => {
  const [modelInfo, setModelInfo] = useState({
    filename: '',
    project_name: '',
    algo: '',
    model_type: '',
    learning_type: ''
  });
  const navigate = useNavigate();
  const [features, setFeatures] = useState<string[]>([]);
  const [stats, setStats] = useState<{ [key: string]: FeatureStats }>({});
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetFeature, setTargetFeature] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const fetchFeaturesAndStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/select_features', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Failed to fetch features');
        
        const data = await response.json();
        setFeatures(data.features || []);
        setModelInfo(data.model_info || {});
        console.log(data.features);
        setStats(data.stats || {});
        setSelectedFeatures(data.features || []);
        localStorage.setItem('modelInfo', JSON.stringify(data.model_info));
      } catch (err) {
        console.error('Failed to load features:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturesAndStats();
    // Fetch features and stats
  }, []);

  

  const deleteFeature = (featureToDelete: string) => {
    setSelectedFeatures(prev => prev.filter(feature => feature !== featureToDelete));
    if (targetFeature === featureToDelete) {
      setTargetFeature('');
    }
  };

  const handleTargetSelection = (feature: string) => {
    setTargetFeature(feature);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      selected_features: selectedFeatures.join(','),
      target_feature: targetFeature,
      };

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/select_features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {throw new Error('Failed to submit features');}
      else{
        navigate("/results");
      }
      
      // Navigate to next step (prediction page)
    } catch (err) {
      console.error('Failed to submit features:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 ">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose features and algorithm
            </h1>
            <p className="text-gray-300 text-lg">
              <strong>File:</strong> {modelInfo.filename}
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            {/* Features Table */}
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">Choose features and view statistics</h2>
                </div>
              </CustomCardHeader>
              <CustomCardBody>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-white/20">
                        <TableHead className="text-white font-medium">Feature</TableHead>
                        <TableHead className="text-white font-medium">Mean</TableHead>
                        <TableHead className="text-white font-medium">Standard Deviation</TableHead>
                        <TableHead className="text-white font-medium">Min</TableHead>
                        <TableHead className="text-white font-medium">Max</TableHead>
                        <TableHead className="text-white font-medium">Action</TableHead>
                        {modelInfo.learning_type === 'supervised' && (
                          <TableHead className="text-white font-medium">Target</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFeatures.map((feature, index) => (
                        <TableRow key={feature} className="border-b border-white/10">
                          <TableCell className="text-gray-300">{feature}</TableCell>
                          {stats[feature] ? (
                            <>
                              <TableCell className="text-gray-300">{stats[feature].mean.toFixed(4)}</TableCell>
                              <TableCell className="text-gray-300">{stats[feature].std.toFixed(4)}</TableCell>
                              <TableCell className="text-gray-300">{stats[feature].min.toFixed(4)}</TableCell>
                              <TableCell className="text-gray-300">{stats[feature].max.toFixed(4)}</TableCell>
                            </>
                          ) : (
                            <TableCell colSpan={4} className="text-gray-400">No statistics available</TableCell>
                          )}
                          <TableCell>
                            <CustomButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => deleteFeature(feature)}
                              className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </CustomButton>
                          </TableCell>
                          {modelInfo.learning_type === 'supervised' && (
                            <TableCell>
                              <input
                                type="radio"
                                name="target_feature"
                                value={feature}
                                checked={targetFeature === feature}
                                onChange={() => handleTargetSelection(feature)}
                                className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CustomCardBody>
            </CustomCard>

            {/* Submit Button */}
            <div className="flex justify-center">
              <CustomButton
                type="submit"
                disabled={loading || selectedFeatures.length === 0}
                className="px-8 py-3"
                size="lg"
              >
                {loading ? "Processing..." : "Valider"}
              </CustomButton>
            </div>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default FeatureSelection;
