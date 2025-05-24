import React from 'react';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody, CustomCardTitle, CustomCardFooter } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';

const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const recentModels = [
    { id: 1, name: 'Customer Churn Predictor', type: 'Classification', algorithm: 'Random Forest', accuracy: 0.87, created: '2023-06-15' },
    { id: 2, name: 'Sales Forecasting', type: 'Regression', algorithm: 'XGBoost', accuracy: 0.92, created: '2023-06-10' },
    { id: 3, name: 'Customer Segmentation', type: 'Clustering', algorithm: 'K-Means', accuracy: 0.78, created: '2023-06-05' },
  ];

  const datasets = [
    { id: 1, name: 'customer_data.csv', rows: 5000, columns: 15, lastModified: '2023-06-14' },
    { id: 2, name: 'sales_2023.csv', rows: 12000, columns: 8, lastModified: '2023-06-08' },
    { id: 3, name: 'product_inventory.csv', rows: 3500, columns: 12, lastModified: '2023-06-01' },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <CustomButton variant="primary">
              <i className="ri-add-line mr-2"></i> New Model
            </CustomButton>
            <CustomButton variant="outline">
              <i className="ri-upload-2-line mr-2"></i> Upload Dataset
            </CustomButton>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <CustomCard className="bg-gradient-to-br from-primary/20 to-primary-dark/20 border-primary/30">
            <CustomCardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light/70 text-sm">Total Models</p>
                  <h3 className="text-3xl font-bold text-white mt-1">12</h3>
                </div>
                <div className="bg-primary/20 p-3 rounded-full">
                  <i className="ri-ai-generate text-2xl text-primary-light"></i>
                </div>
              </div>
              <p className="text-green-400 text-sm mt-4 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i> 24% increase
              </p>
            </CustomCardBody>
          </CustomCard>
          
          <CustomCard className="bg-gradient-to-br from-secondary/20 to-primary-light/20 border-secondary/30">
            <CustomCardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light/70 text-sm">Datasets</p>
                  <h3 className="text-3xl font-bold text-white mt-1">8</h3>
                </div>
                <div className="bg-secondary/20 p-3 rounded-full">
                  <i className="ri-database-2-line text-2xl text-secondary"></i>
                </div>
              </div>
              <p className="text-green-400 text-sm mt-4 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i> 12% increase
              </p>
            </CustomCardBody>
          </CustomCard>
          
          <CustomCard className="bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30">
            <CustomCardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light/70 text-sm">Predictions</p>
                  <h3 className="text-3xl font-bold text-white mt-1">1.4k</h3>
                </div>
                <div className="bg-accent/20 p-3 rounded-full">
                  <i className="ri-line-chart-line text-2xl text-accent"></i>
                </div>
              </div>
              <p className="text-green-400 text-sm mt-4 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i> 18% increase
              </p>
            </CustomCardBody>
          </CustomCard>
          
          <CustomCard className="bg-gradient-to-br from-success/20 to-success/10 border-success/30">
            <CustomCardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light/70 text-sm">Avg. Accuracy</p>
                  <h3 className="text-3xl font-bold text-white mt-1">86%</h3>
                </div>
                <div className="bg-success/20 p-3 rounded-full">
                  <i className="ri-check-double-line text-2xl text-success"></i>
                </div>
              </div>
              <p className="text-green-400 text-sm mt-4 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i> 5% increase
              </p>
            </CustomCardBody>
          </CustomCard>
        </div>
        
        {/* Recent Models */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Models</h2>
          
          <CustomCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.1)]">
                    <th className="text-left p-4 text-gray-light/70">Name</th>
                    <th className="text-left p-4 text-gray-light/70">Type</th>
                    <th className="text-left p-4 text-gray-light/70">Algorithm</th>
                    <th className="text-left p-4 text-gray-light/70">Accuracy</th>
                    <th className="text-left p-4 text-gray-light/70">Created</th>
                    <th className="text-left p-4 text-gray-light/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentModels.map((model) => (
                    <tr key={model.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)]">
                      <td className="p-4 text-white">{model.name}</td>
                      <td className="p-4 text-gray-light">{model.type}</td>
                      <td className="p-4 text-gray-light">{model.algorithm}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${model.accuracy >= 0.85 ? 'bg-success/20 text-success' : model.accuracy >= 0.75 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>
                          {(model.accuracy * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-gray-light">{model.created}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button className="p-1 text-gray-light hover:text-white" title="View Details">
                            <i className="ri-eye-line"></i>
                          </button>
                          <button className="p-1 text-gray-light hover:text-white" title="Download">
                            <i className="ri-download-line"></i>
                          </button>
                          <button className="p-1 text-gray-light hover:text-danger" title="Delete">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CustomCardFooter className="flex justify-center">
              <CustomButton variant="outline" size="sm">
                View All Models
              </CustomButton>
            </CustomCardFooter>
          </CustomCard>
        </div>
        
        {/* Datasets */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Datasets</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <CustomCard key={dataset.id}>
                <CustomCardHeader>
                  <div className="flex items-center space-x-3">
                    <i className="ri-file-excel-2-line text-2xl text-primary-light"></i>
                    <CustomCardTitle>{dataset.name}</CustomCardTitle>
                  </div>
                  <button className="text-gray-light hover:text-white">
                    <i className="ri-more-2-fill"></i>
                  </button>
                </CustomCardHeader>
                <CustomCardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-light/70 text-sm">Rows</p>
                      <p className="text-white font-medium">{dataset.rows.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-light/70 text-sm">Columns</p>
                      <p className="text-white font-medium">{dataset.columns}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-light/70 text-sm">Last Modified</p>
                      <p className="text-white font-medium">{dataset.lastModified}</p>
                    </div>
                  </div>
                </CustomCardBody>
                <CustomCardFooter>
                  <div className="flex justify-between">
                    <CustomButton variant="outline" size="sm">
                      <i className="ri-eye-line mr-1"></i> Preview
                    </CustomButton>
                    <CustomButton variant="primary" size="sm">
                      <i className="ri-play-line mr-1"></i> Use
                    </CustomButton>
                  </div>
                </CustomCardFooter>
              </CustomCard>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
