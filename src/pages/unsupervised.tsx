import React from 'react';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody, CustomCardTitle, CustomCardDescription } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput, FormSelect, FormHelperText } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';

const UnsupervisedLearning: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted');
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Unsupervised Learning</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CustomCard>
              <CustomCardHeader>
                <CustomCardTitle>Upload Dataset</CustomCardTitle>
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
                  
                  <FormGroup>
                    <FormLabel htmlFor="algorithm">Algorithm</FormLabel>
                    <FormSelect id="algorithm">
                      <option value="">Select an algorithm</option>
                      <option value="kmeans">K-Means Clustering</option>
                      <option value="hierarchical">Hierarchical Clustering</option>
                      <option value="dbscan">DBSCAN</option>
                      <option value="pca">Principal Component Analysis</option>
                      <option value="tsne">t-SNE</option>
                    </FormSelect>
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel htmlFor="n_clusters">Number of Clusters (for K-Means)</FormLabel>
                    <FormInput 
                      type="number" 
                      id="n_clusters" 
                      min="2" 
                      max="20" 
                      defaultValue="3"
                    />
                    <FormHelperText>
                      Only applicable for K-Means and Hierarchical Clustering
                    </FormHelperText>
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel htmlFor="features">Features to Include</FormLabel>
                    <FormInput 
                      type="text" 
                      id="features" 
                      placeholder="Enter column names separated by commas or leave blank for all"
                    />
                    <FormHelperText>
                      Leave blank to use all numeric columns
                    </FormHelperText>
                  </FormGroup>
                  
                  <div className="flex justify-end space-x-4">
                    <CustomButton variant="outline" type="button">
                      Cancel
                    </CustomButton>
                    <CustomButton type="submit">
                      Run Analysis
                    </CustomButton>
                  </div>
                </Form>
              </CustomCardBody>
            </CustomCard>
          </div>
          
          <div>
            <CustomCard>
              <CustomCardHeader>
                <CustomCardTitle>Information</CustomCardTitle>
              </CustomCardHeader>
              <CustomCardBody>
                <CustomCardDescription>
                  <p className="mb-4">
                    Unsupervised learning is a type of machine learning where the algorithm learns patterns from unlabeled data without explicit guidance.
                  </p>
                  
                  <h4 className="text-white font-medium mb-2">Common Algorithms:</h4>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>K-Means Clustering</li>
                    <li>Hierarchical Clustering</li>
                    <li>DBSCAN</li>
                    <li>Principal Component Analysis (PCA)</li>
                    <li>t-SNE</li>
                    <li>Autoencoders</li>
                  </ul>
                  
                  <h4 className="text-white font-medium mb-2">Use Cases:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Customer segmentation</li>
                    <li>Anomaly detection</li>
                    <li>Feature extraction</li>
                    <li>Dimensionality reduction</li>
                    <li>Pattern discovery</li>
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

export default UnsupervisedLearning;
