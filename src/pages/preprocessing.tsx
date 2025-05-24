import React from 'react';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody, CustomCardTitle, CustomCardDescription } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput, FormSelect, FormHelperText } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';

const Preprocessing: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted');
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Data Preprocessing</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CustomCard>
              <CustomCardHeader>
                <CustomCardTitle>Upload Dataset for Preprocessing</CustomCardTitle>
              </CustomCardHeader>
              <CustomCardBody>
                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <FormLabel htmlFor="dataset">Dataset File</FormLabel>
                    <FormInput 
                      type="file" 
                      id="dataset" 
                      accept=".csv, .xlsx, .json" 
                    />
                    <FormHelperText>
                      Supported formats: CSV, Excel, JSON (max 100MB)
                    </FormHelperText>
                  </FormGroup>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Missing Values</h3>
                      
                      <FormGroup>
                        <FormLabel htmlFor="missing_strategy">Handling Strategy</FormLabel>
                        <FormSelect id="missing_strategy">
                          <option value="none">No action</option>
                          <option value="drop_rows">Drop rows with missing values</option>
                          <option value="drop_columns">Drop columns with too many missing values</option>
                          <option value="mean">Replace with mean (numeric)</option>
                          <option value="median">Replace with median (numeric)</option>
                          <option value="mode">Replace with mode (categorical)</option>
                          <option value="constant">Replace with constant value</option>
                        </FormSelect>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormLabel htmlFor="missing_threshold">Missing Threshold (%)</FormLabel>
                        <FormInput 
                          type="number" 
                          id="missing_threshold" 
                          min="0" 
                          max="100" 
                          defaultValue="50"
                        />
                        <FormHelperText>
                          For dropping columns: percentage of missing values required
                        </FormHelperText>
                      </FormGroup>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Scaling/Normalization</h3>
                      
                      <FormGroup>
                        <FormLabel htmlFor="scaling_method">Scaling Method</FormLabel>
                        <FormSelect id="scaling_method">
                          <option value="none">No scaling</option>
                          <option value="standard">StandardScaler (z-score)</option>
                          <option value="minmax">MinMaxScaler (0-1 range)</option>
                          <option value="robust">RobustScaler (using quantiles)</option>
                          <option value="log">Log Transform</option>
                        </FormSelect>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormLabel htmlFor="columns_to_scale">Columns to Scale</FormLabel>
                        <FormInput 
                          type="text" 
                          id="columns_to_scale" 
                          placeholder="Enter column names or leave blank for all numeric"
                        />
                      </FormGroup>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Encoding</h3>
                      
                      <FormGroup>
                        <FormLabel htmlFor="encoding_method">Categorical Encoding</FormLabel>
                        <FormSelect id="encoding_method">
                          <option value="none">No encoding</option>
                          <option value="onehot">One-Hot Encoding</option>
                          <option value="label">Label Encoding</option>
                          <option value="ordinal">Ordinal Encoding</option>
                          <option value="target">Target Encoding</option>
                        </FormSelect>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormLabel htmlFor="categorical_columns">Categorical Columns</FormLabel>
                        <FormInput 
                          type="text" 
                          id="categorical_columns" 
                          placeholder="Enter column names or leave blank for auto-detect"
                        />
                      </FormGroup>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Feature Selection</h3>
                      
                      <FormGroup>
                        <FormLabel htmlFor="feature_selection">Feature Selection Method</FormLabel>
                        <FormSelect id="feature_selection">
                          <option value="none">No feature selection</option>
                          <option value="variance">Variance Threshold</option>
                          <option value="kbest">SelectKBest</option>
                          <option value="rfe">Recursive Feature Elimination</option>
                          <option value="pca">PCA</option>
                        </FormSelect>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormLabel htmlFor="n_features">Number of Features to Select</FormLabel>
                        <FormInput 
                          type="number" 
                          id="n_features" 
                          min="1" 
                          defaultValue="10"
                        />
                      </FormGroup>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 mt-6">
                    <CustomButton variant="outline" type="button">
                      Reset
                    </CustomButton>
                    <CustomButton type="submit">
                      Process Data
                    </CustomButton>
                  </div>
                </Form>
              </CustomCardBody>
            </CustomCard>
          </div>
          
          <div>
            <CustomCard>
              <CustomCardHeader>
                <CustomCardTitle>Preprocessing Information</CustomCardTitle>
              </CustomCardHeader>
              <CustomCardBody>
                <CustomCardDescription>
                  <p className="mb-4">
                    Data preprocessing is a crucial step in the machine learning pipeline that transforms raw data into a clean and usable format.
                  </p>
                  
                  <h4 className="text-white font-medium mb-2">Common Techniques:</h4>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Handling missing values</li>
                    <li>Scaling and normalization</li>
                    <li>Encoding categorical variables</li>
                    <li>Feature selection and extraction</li>
                    <li>Outlier detection and removal</li>
                    <li>Dimensionality reduction</li>
                  </ul>
                  
                  <h4 className="text-white font-medium mb-2">Benefits:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Improved model accuracy</li>
                    <li>Faster training times</li>
                    <li>Better generalization</li>
                    <li>Reduced overfitting</li>
                    <li>More interpretable results</li>
                  </ul>
                </CustomCardDescription>
              </CustomCardBody>
            </CustomCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Preprocessing;
