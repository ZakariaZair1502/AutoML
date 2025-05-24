import React from 'react';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody, CustomCardTitle, CustomCardDescription } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput, FormSelect, FormHelperText } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';

const SupervisedLearning: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted');
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Supervised Learning</h1>
        
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
                      <option value="linear_regression">Linear Regression</option>
                      <option value="logistic_regression">Logistic Regression</option>
                      <option value="decision_tree">Decision Tree</option>
                      <option value="random_forest">Random Forest</option>
                      <option value="svm">Support Vector Machine</option>
                      <option value="knn">K-Nearest Neighbors</option>
                    </FormSelect>
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel htmlFor="target">Target Variable</FormLabel>
                    <FormInput 
                      type="text" 
                      id="target" 
                      placeholder="Enter column name for target variable"
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel htmlFor="test_size">Test Size</FormLabel>
                    <FormInput 
                      type="range" 
                      id="test_size" 
                      min="10" 
                      max="50" 
                      defaultValue="20"
                    />
                    <FormHelperText>
                      Percentage of data to use for testing: 20%
                    </FormHelperText>
                  </FormGroup>
                  
                  <div className="flex justify-end space-x-4">
                    <CustomButton variant="outline" type="button">
                      Cancel
                    </CustomButton>
                    <CustomButton type="submit">
                      Train Model
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
                    Supervised learning is a type of machine learning where the algorithm learns from labeled training data to make predictions or decisions.
                  </p>
                  
                  <h4 className="text-white font-medium mb-2">Common Algorithms:</h4>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Linear Regression</li>
                    <li>Logistic Regression</li>
                    <li>Decision Trees</li>
                    <li>Random Forests</li>
                    <li>Support Vector Machines</li>
                    <li>Neural Networks</li>
                  </ul>
                  
                  <h4 className="text-white font-medium mb-2">Use Cases:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Prediction of continuous values</li>
                    <li>Classification into categories</li>
                    <li>Image and speech recognition</li>
                    <li>Sentiment analysis</li>
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

export default SupervisedLearning;
