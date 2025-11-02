
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, ArrowRight } from 'lucide-react';

interface Column {
  name: string;
  type: 'numeric' | 'categorical' | 'other';
}

interface PreprocessingMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

const Preprocessing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>([]);
  const [methods, setMethods] = useState<PreprocessingMethod[]>([
    {
      id: 'normalization',
      name: 'Normalization',
      description: 'Scales data to fit within a specific range, typically [0,1] or [-1,1].',
      enabled: false,
      parameters: {
        method: 'minmax',
        columns: []
      }
    },
    {
      id: 'standardization',
      name: 'Standardization',
      description: 'Transforms data to have a mean of 0 and standard deviation of 1 (Z-score).',
      enabled: false,
      parameters: {
        columns: []
      }
    },
    {
      id: 'missing_values',
      name: 'Missing Value Handling',
      description: 'Handles missing values in the dataset through imputation or removal.',
      enabled: false,
      parameters: {
        strategy: 'mean',
        constant_value: '',
        columns: []
      }
    },
    {
      id: 'outliers',
      name: 'Outlier Detection and Handling',
      description: 'Identifies and handles outliers that can affect model performance.',
      enabled: false,
      parameters: {
        method: 'zscore',
        treatment: 'remove',
        columns: []
      }
    },
    {
      id: 'encoding',
      name: 'Encoding Categorical Variables',
      description: 'Converts categorical variables into numeric format for analysis.',
      enabled: false,
      parameters: {
        method: 'onehot',
        columns: []
      }
    },
    {
      id: 'feature_selection',
      name: 'Feature Selection',
      description: 'Identifies and selects the most relevant features to improve model performance.',
      enabled: false,
      parameters: {
        method: 'variance',
        n_components: 5
      }
    },
    {
      id: 'transformation',
      name: 'Data Transformation',
      description: 'Applies mathematical transformations to improve data distribution.',
      enabled: false,
      parameters: {
        method: 'log',
        columns: []
      }
    }
  ]);

  useEffect(() => {
    console.log('Starting preprocessing setup');
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/preprocessing/methods', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch columns');
      }
      
      const responseData = await response.json();
      const columns_types = responseData.column_types;
      setColumns(columns_types);
    } catch (error) {
      console.error('Error fetching columns:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = (methodId: string) => {
    setMethods(prev => prev.map(method => 
      method.id === methodId 
        ? { ...method, enabled: !method.enabled }
        : method
    ));
  };

  const updateMethodParameter = (methodId: string, parameter: string, value: any) => {
    setMethods(prev => prev.map(method => 
      method.id === methodId 
        ? { 
            ...method, 
            parameters: { 
              ...method.parameters, 
              [parameter]: value 
            }
          }
        : method
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enabledMethods = methods.filter(method => method.enabled);
    
    if (enabledMethods.length === 0) {
      alert('Please select at least one preprocessing method.');
      return;
    }

    try {
      const formData = {
        preprocessing_methods: enabledMethods.map(method => method.id),
        ...enabledMethods.reduce((acc, method) => {
          Object.keys(method.parameters).forEach(key => {
            acc[`${method.id}_${key}`] = method.parameters[key];
          });
          return acc;
        }, {} as Record<string, any>)
      };

      console.log('Submitting preprocessing data:', formData);
      
      const response = await fetch('http://localhost:5000/preprocessing/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply preprocessing');
      }
      
      const data = await response.json();
      console.log('Preprocessing apply post response:', data);

      // Navigate to next step
      navigate('/preprocessing/apply');
      
    } catch (error) {
      console.error('Error applying preprocessing:', error);
    }
  };

  const numericColumns = columns.filter(col => col.type === 'numeric');
  const categoricalColumns = columns.filter(col => col.type === 'categorical');

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-white text-lg">Loading columns...</p>
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
              Select Preprocessing Methods
            </h1>
            <p className="text-gray-300">
              Choose preprocessing techniques to optimize your data
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {methods.map((method) => (
                <CustomCard key={method.id} className={`transition-all duration-200 ${method.enabled ? 'ring-2 ring-purple-500' : ''}`}>
                  <CustomCardHeader>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={method.id}
                        checked={method.enabled}
                        onCheckedChange={() => toggleMethod(method.id)}
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-white">{method.name}</h3>
                        <p className="text-gray-300 text-sm mt-1">{method.description}</p>
                      </div>
                    </div>
                  </CustomCardHeader>

                  {method.enabled && (
                    <CustomCardBody>
                      <div className="space-y-4">
                        {/* Normalization Parameters */}
                        {method.id === 'normalization' && (
                          <>
                            <div>
                              <Label htmlFor={`${method.id}-method`} className="text-white">Method:</Label>
                              <Select 
                                value={method.parameters.method} 
                                onValueChange={(value) => updateMethodParameter(method.id, 'method', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                                  <SelectItem value="robust">Robust Scaling</SelectItem>
                                  <SelectItem value="maxabs">Max Abs Scaling</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Columns to normalize:</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {numericColumns.map(col => (
                                  <div key={col.name} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${method.id}-${col.name}`}
                                      checked={method.parameters.columns.includes(col.name)}
                                      onCheckedChange={(checked) => {
                                        const newColumns = checked 
                                          ? [...method.parameters.columns, col.name]
                                          : method.parameters.columns.filter((c: string) => c !== col.name);
                                        updateMethodParameter(method.id, 'columns', newColumns);
                                      }}
                                    />
                                    <Label htmlFor={`${method.id}-${col.name}`} className="text-gray-300 text-sm">{col.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Standardization Parameters */}
                        {method.id === 'standardization' && (
                          <div>
                            <Label className="text-white">Columns to standardize:</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {numericColumns.map(col => (
                                <div key={col.name} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${method.id}-${col.name}`}
                                    checked={method.parameters.columns.includes(col.name)}
                                    onCheckedChange={(checked) => {
                                      const newColumns = checked 
                                        ? [...method.parameters.columns, col.name]
                                        : method.parameters.columns.filter((c: string) => c !== col.name);
                                      updateMethodParameter(method.id, 'columns', newColumns);
                                    }}
                                  />
                                  <Label htmlFor={`${method.id}-${col.name}`} className="text-gray-300 text-sm">{col.name}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Values Parameters */}
                        {method.id === 'missing_values' && (
                          <>
                            <div>
                              <Label className="text-white">Strategy:</Label>
                              <Select 
                                value={method.parameters.strategy} 
                                onValueChange={(value) => updateMethodParameter(method.id, 'strategy', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mean">Mean (numeric columns)</SelectItem>
                                  <SelectItem value="median">Median (numeric columns)</SelectItem>
                                  <SelectItem value="most_frequent">Most frequent value</SelectItem>
                                  <SelectItem value="constant">Constant value</SelectItem>
                                  <SelectItem value="drop">Drop rows</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {method.parameters.strategy === 'constant' && (
                              <div>
                                <Label className="text-white">Constant value:</Label>
                                <Input
                                  value={method.parameters.constant_value}
                                  onChange={(e) => updateMethodParameter(method.id, 'constant_value', e.target.value)}
                                  placeholder="Value to use"
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </div>
                            )}
                            <div>
                              <Label className="text-white">Columns to process:</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {columns.map(col => (
                                  <div key={col.name} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${method.id}-${col.name}`}
                                      checked={method.parameters.columns.includes(col.name)}
                                      onCheckedChange={(checked) => {
                                        const newColumns = checked 
                                          ? [...method.parameters.columns, col.name]
                                          : method.parameters.columns.filter((c: string) => c !== col.name);
                                        updateMethodParameter(method.id, 'columns', newColumns);
                                      }}
                                    />
                                    <Label htmlFor={`${method.id}-${col.name}`} className="text-gray-300 text-sm">{col.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Outliers Parameters */}
                        {method.id === 'outliers' && (
                          <>
                            <div>
                              <Label className="text-white">Detection method:</Label>
                              <Select 
                                value={method.parameters.method} 
                                onValueChange={(value) => updateMethodParameter(method.id, 'method', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="zscore">Z-Score</SelectItem>
                                  <SelectItem value="iqr">IQR (Interquartile Range)</SelectItem>
                                  <SelectItem value="isolation_forest">Isolation Forest</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Treatment:</Label>
                              <Select 
                                value={method.parameters.treatment} 
                                onValueChange={(value) => updateMethodParameter(method.id, 'treatment', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="remove">Remove</SelectItem>
                                  <SelectItem value="cap">Cap (capping)</SelectItem>
                                  <SelectItem value="replace_mean">Replace with mean</SelectItem>
                                  <SelectItem value="replace_median">Replace with median</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Columns to process:</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {numericColumns.map(col => (
                                  <div key={col.name} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${method.id}-${col.name}`}
                                      checked={method.parameters.columns.includes(col.name)}
                                      onCheckedChange={(checked) => {
                                        const newColumns = checked 
                                          ? [...method.parameters.columns, col.name]
                                          : method.parameters.columns.filter((c: string) => c !== col.name);
                                        updateMethodParameter(method.id, 'columns', newColumns);
                                      }}
                                    />
                                    <Label htmlFor={`${method.id}-${col.name}`} className="text-gray-300 text-sm">{col.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Encoding Parameters */}
                        {method.id === 'encoding' && (
                          <>
                            <div>
                              <Label className="text-white">Encoding method:</Label>
                              <Select 
                                value={method.parameters.method} 
                                onValueChange={(value) => updateMethodParameter(method.id, 'method', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="onehot">One-Hot Encoding</SelectItem>
                                  <SelectItem value="label">Label Encoding</SelectItem>
                                  <SelectItem value="ordinal">Ordinal Encoding</SelectItem>
                                  <SelectItem value="binary">Binary Encoding</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Columns to encode:</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {categoricalColumns.map(col => (
                                  <div key={col.name} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${method.id}-${col.name}`}
                                      checked={method.parameters.columns.includes(col.name)}
                                      onCheckedChange={(checked) => {
                                        const newColumns = checked 
                                          ? [...method.parameters.columns, col.name]
                                          : method.parameters.columns.filter((c: string) => c !== col.name);
                                        updateMethodParameter(method.id, 'columns', newColumns);
                                      }}
                                    />
                                    <Label htmlFor={`${method.id}-${col.name}`} className="text-gray-300 text-sm">{col.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Feature Selection Parameters */}
                        {method.id === 'feature_selection' && (
                          <>
                            <div>
                              <Label className="text-white">Method:</Label>
                              <Select 
                                value={method.parameters.method} 
                                onValueChange={(value) => updateMethodParameter(method.id, 'method', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="variance">Variance Threshold</SelectItem>
                                  <SelectItem value="kbest">SelectKBest</SelectItem>
                                  <SelectItem value="rfe">Recursive Feature Elimination (RFE)</SelectItem>
                                  <SelectItem value="pca">Principal Component Analysis (PCA)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Number of features to keep:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={method.parameters.n_components}
                                onChange={(e) => updateMethodParameter(method.id, 'n_components', parseInt(e.target.value))}
                                className="bg-white/10 border-white/20 text-white"
                              />
                            </div>
                          </>
                        )}

                        {/* Transformation Parameters */}
                        {method.id === 'transformation' && (
                          <>
                            <div>
                              <Label className="text-white">Method:</Label>
                              <Select 
                                value={method.parameters.method} 
                                onValueChange={(value) => updateMethodParameter(method.id, 'method', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="log">Logarithmic</SelectItem>
                                  <SelectItem value="sqrt">Square root</SelectItem>
                                  <SelectItem value="boxcox">Box-Cox</SelectItem>
                                  <SelectItem value="yeo-johnson">Yeo-Johnson</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Columns to transform:</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {numericColumns.map(col => (
                                  <div key={col.name} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${method.id}-${col.name}`}
                                      checked={method.parameters.columns.includes(col.name)}
                                      onCheckedChange={(checked) => {
                                        const newColumns = checked 
                                          ? [...method.parameters.columns, col.name]
                                          : method.parameters.columns.filter((c: string) => c !== col.name);
                                        updateMethodParameter(method.id, 'columns', newColumns);
                                      }}
                                    />
                                    <Label htmlFor={`${method.id}-${col.name}`} className="text-gray-300 text-sm">{col.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CustomCardBody>
                  )}
                </CustomCard>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <CustomButton type="submit" size="lg" className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Apply Methods</span>
                <ArrowRight className="w-5 h-5" />
              </CustomButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Preprocessing;
