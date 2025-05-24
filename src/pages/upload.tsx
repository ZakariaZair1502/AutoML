import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody, CustomCardFooter } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput, FormSelect, FormHelperText, FormCheckbox } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';

interface DatasetPreview {
  columns: string[];
  data: string[][];
}

const UploadPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [learningType, setLearningType] = useState<string>('supervised');
  const [datasetType, setDatasetType] = useState<string>('custom');
  const [predefinedDataset, setPredefinedDataset] = useState<string>('');
  const [generationAlgorithm, setGenerationAlgorithm] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [enablePreprocessing, setEnablePreprocessing] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Preprocessing options
  const [preprocessingOptions, setPreprocessingOptions] = useState({
    normalize: false,
    standardize: false,
    missing_values: false,
    outliers: false,
    encode_categorical: false,
    feature_selection: false,
    dimensionality_reduction: false,
    data_transformation: false,
    feature_engineering: false,
    data_balancing: false
  });

  // Algorithm parameters
  const [algorithmParams, setAlgorithmParams] = useState<Record<string, number>>({});

  useEffect(() => {
    // Extract learning type from URL if coming from another page
    const path = location.pathname;
    if (path.includes('/supervised')) {
      setLearningType('supervised');
    } else if (path.includes('/unsupervised')) {
      setLearningType('unsupervised');
    } else if (path.includes('/preprocessing')) {
      setLearningType('preprocessing');
    }
  }, [location]);

  useEffect(() => {
    // Setup drag and drop events
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const highlight = () => dropZone.classList.add('border-primary', 'bg-primary-dark', 'bg-opacity-10');
    const unhighlight = () => dropZone.classList.remove('border-primary', 'bg-primary-dark', 'bg-opacity-10');
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      preventDefaults(e);
      unhighlight();
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop as EventListener, false);

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.removeEventListener(eventName, preventDefaults, false);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.removeEventListener(eventName, highlight, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.removeEventListener(eventName, unhighlight, false);
      });

      dropZone.removeEventListener('drop', handleDrop as EventListener, false);
    };
  }, []);

  const handleFiles = (files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      previewFile(file);
    }
  };

  const previewFile = (file: File) => {
    // For demo purposes, we'll simulate reading a CSV file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (content) {
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          const rows = lines.slice(1, 6).map(line => line.split(','));
          setPreviewData({ columns: headers, data: rows });
          simulateUploadProgress();
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDropZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDatasetTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatasetType(e.target.value);
    setSelectedFile(null);
    setPreviewData(null);
  };

  const handlePreprocessingToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnablePreprocessing(e.target.checked);
  };

  const handlePreprocessingOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreprocessingOptions(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handlePredefinedDatasetPreview = () => {
    if (!predefinedDataset) {
      alert('Please select a dataset');
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Mock data for preview
      const mockData = {
        columns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
        data: [
          ['5.1', '3.5', '1.4', '0.2', 'setosa'],
          ['4.9', '3.0', '1.4', '0.2', 'setosa'],
          ['4.7', '3.2', '1.3', '0.2', 'setosa'],
          ['4.6', '3.1', '1.5', '0.2', 'setosa'],
          ['5.0', '3.6', '1.4', '0.2', 'setosa']
        ]
      };
      setPreviewData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const handleGeneratedDatasetPreview = () => {
    if (!generationAlgorithm) {
      alert('Please select an algorithm');
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Mock data for preview based on algorithm
      const mockData = {
        columns: ['feature1', 'feature2', 'target'],
        data: [
          ['0.23', '0.56', '1'],
          ['0.45', '0.78', '0'],
          ['0.67', '0.12', '1'],
          ['0.89', '0.34', '0'],
          ['0.12', '0.90', '1']
        ]
      };
      setPreviewData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would submit the form data to your backend
    console.log({
      learningType,
      datasetType,
      predefinedDataset,
      generationAlgorithm,
      algorithmParams,
      projectName,
      enablePreprocessing,
      preprocessingOptions,
      selectedFile
    });

    // Redirect to the appropriate page based on learning type
    if (learningType === 'supervised') {
      navigate('/supervised');
    } else if (learningType === 'unsupervised') {
      navigate('/unsupervised');
    } else if (learningType === 'preprocessing') {
      navigate('/preprocessing');
    }
  };

  // Algorithm parameters configuration
  const algorithmParameters: Record<string, Array<{name: string, label: string, type: string, default: number, min?: number, max?: number, step?: number}>> = {
    make_blobs: [
      { name: 'n_samples', label: 'Number of samples', type: 'number', default: 100, min: 1 },
      { name: 'n_features', label: 'Number of features', type: 'number', default: 2, min: 1 },
      { name: 'centers', label: 'Number of centers/clusters', type: 'number', default: 3, min: 1 },
      { name: 'cluster_std', label: 'Cluster standard deviation', type: 'number', default: 1.0, min: 0.1, step: 0.1 }
    ],
    make_moons: [
      { name: 'n_samples', label: 'Number of samples', type: 'number', default: 100, min: 1 },
      { name: 'noise', label: 'Noise level', type: 'number', default: 0.1, min: 0.0, max: 1.0, step: 0.05 }
    ],
    make_circles: [
      { name: 'n_samples', label: 'Number of samples', type: 'number', default: 100, min: 1 },
      { name: 'noise', label: 'Noise level', type: 'number', default: 0.1, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'factor', label: 'Scale factor between inner and outer circle', type: 'number', default: 0.5, min: 0.1, max: 0.9, step: 0.05 }
    ],
    make_classification: [
      { name: 'n_samples', label: 'Number of samples', type: 'number', default: 100, min: 1 },
      { name: 'n_features', label: 'Number of features', type: 'number', default: 20, min: 1 },
      { name: 'n_informative', label: 'Number of informative features', type: 'number', default: 2, min: 1 },
      { name: 'n_redundant', label: 'Number of redundant features', type: 'number', default: 2, min: 0 },
      { name: 'n_classes', label: 'Number of classes', type: 'number', default: 2, min: 2 }
    ],
    make_regression: [
      { name: 'n_samples', label: 'Number of samples', type: 'number', default: 100, min: 1 },
      { name: 'n_features', label: 'Number of features', type: 'number', default: 100, min: 1 },
      { name: 'n_informative', label: 'Number of informative features', type: 'number', default: 10, min: 1 },
      { name: 'noise', label: 'Noise level', type: 'number', default: 0.1, min: 0.0, step: 0.05 }
    ]
  };

  const renderAlgorithmParameters = () => {
    if (!generationAlgorithm || !algorithmParameters[generationAlgorithm]) {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-[rgba(255,255,255,0.03)] rounded-md border border-[rgba(255,255,255,0.1)]">
        <h3 className="text-lg font-medium text-white mb-4">Algorithm Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {algorithmParameters[generationAlgorithm].map((param) => (
            <FormGroup key={param.name}>
              <FormLabel htmlFor={`param-${param.name}`}>{param.label}</FormLabel>
              <FormInput
                type="number"
                id={`param-${param.name}`}
                name={`param_${param.name}`}
                defaultValue={param.default.toString()}
                min={param.min}
                max={param.max}
                step={param.step}
                onChange={(e) => {
                  setAlgorithmParams(prev => ({
                    ...prev,
                    [param.name]: parseFloat(e.target.value)
                  }));
                }}
              />
            </FormGroup>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            {learningType === 'supervised' && 'Import Dataset - Supervised Learning'}
            {learningType === 'unsupervised' && 'Import Dataset - Unsupervised Learning'}
            {learningType === 'preprocessing' && 'Import Dataset - Preprocessing'}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Import Container */}
            <CustomCard className="p-0">
              <CustomCardHeader>
                <h2 className="text-xl font-semibold text-white">
                  {learningType === 'supervised' && 'Choose a dataset for Supervised Learning'}
                  {learningType === 'unsupervised' && 'Choose a dataset for Unsupervised Learning'}
                  {learningType === 'preprocessing' && 'Choose a dataset for Preprocessing'}
                </h2>
              </CustomCardHeader>
              <CustomCardBody>
                <Form onSubmit={handleSubmit}>
                  <input type="hidden" name="learning_type" value={learningType} />

                  <div className="mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="custom-dataset"
                          name="dataset_type"
                          value="custom"
                          checked={datasetType === 'custom'}
                          onChange={handleDatasetTypeChange}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                        />
                        <label htmlFor="custom-dataset" className="text-gray-light">
                          Custom dataset
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="predefined-dataset"
                          name="dataset_type"
                          value="predefined"
                          checked={datasetType === 'predefined'}
                          onChange={handleDatasetTypeChange}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                        />
                        <label htmlFor="predefined-dataset" className="text-gray-light">
                          Predefined dataset
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="create-dataset"
                          name="dataset_type"
                          value="create"
                          checked={datasetType === 'create'}
                          onChange={handleDatasetTypeChange}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                        />
                        <label htmlFor="create-dataset" className="text-gray-light">
                          Create dataset
                        </label>
                      </div>
                    </div>
                  </div>

                  {datasetType === 'predefined' && (
                    <div className="mb-6">
                      <FormGroup>
                        <FormLabel htmlFor="predefined-dataset-select">Select a dataset</FormLabel>
                        <FormSelect
                          id="predefined-dataset-select"
                          value={predefinedDataset}
                          onChange={(e) => setPredefinedDataset(e.target.value)}
                        >
                          <option value="">Select a dataset</option>
                          <option value="load_iris">Iris Dataset</option>
                          <option value="load_digits">Digits Dataset</option>
                          <option value="load_diabetes">Diabetes Dataset</option>
                          <option value="load_breast_cancer">Breast Cancer Dataset</option>
                        </FormSelect>
                      </FormGroup>
                      <div className="mt-4">
                        <CustomButton 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          onClick={handlePredefinedDatasetPreview}
                          leftIcon={<i className="ri-eye-line"></i>}
                        >
                          Preview
                        </CustomButton>
                      </div>
                    </div>
                  )}

                  {datasetType === 'create' && (
                    <div className="mb-6">
                      <FormGroup>
                        <FormLabel htmlFor="create-algorithm-select">Select a generation algorithm</FormLabel>
                        <FormSelect
                          id="create-algorithm-select"
                          value={generationAlgorithm}
                          onChange={(e) => setGenerationAlgorithm(e.target.value)}
                        >
                          <option value="">Select a generation algorithm</option>
                          <option value="make_blobs">Make Blobs (clusters)</option>
                          <option value="make_moons">Make Moons (half circles)</option>
                          <option value="make_circles">Make Circles (concentric)</option>
                          <option value="make_classification">Make Classification</option>
                          <option value="make_regression">Make Regression</option>
                        </FormSelect>
                      </FormGroup>

                      {renderAlgorithmParameters()}

                      <div className="mt-4">
                        <CustomButton 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          onClick={handleGeneratedDatasetPreview}
                          leftIcon={<i className="ri-eye-line"></i>}
                        >
                          Preview
                        </CustomButton>
                      </div>
                    </div>
                  )}

                  <FormGroup>
                    <FormLabel htmlFor="project-name">Project name</FormLabel>
                    <FormInput
                      type="text"
                      id="project-name"
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                  </FormGroup>

                  {datasetType === 'custom' && (
                    <div 
                      ref={dropZoneRef}
                      className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary-dark hover:bg-opacity-5"
                      onClick={handleDropZoneClick}
                    >
                      {!selectedFile ? (
                        <>
                          <i className="ri-upload-cloud-line text-5xl text-primary mb-4 block"></i>
                          <p className="text-lg font-medium text-gray-light mb-2">Drop your dataset here</p>
                          <p className="text-sm text-gray-400">or click to browse files</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            id="file-input"
                            name="dataset"
                            accept=".csv,.xlsx,.json"
                            className="hidden"
                            onChange={handleFileInputChange}
                            required={datasetType === 'custom'}
                          />
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <i className="ri-file-excel-2-line text-4xl text-primary mb-3"></i>
                          <p className="text-md font-medium text-gray-light mb-4 break-all">{selectedFile.name}</p>
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                                <div 
                                  className="h-full bg-primary rounded-full" 
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-400">{uploadProgress}%</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex items-center space-x-3">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input 
                        type="checkbox" 
                        id="preprocessing-toggle" 
                        name="preprocessing"
                        checked={enablePreprocessing}
                        onChange={handlePreprocessingToggle}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                      />
                      <label 
                        htmlFor="preprocessing-toggle" 
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                      ></label>
                    </div>
                    <span className="text-gray-light">Enable preprocessing</span>
                  </div>

                  {enablePreprocessing && (
                    <div className="mt-4 p-4 bg-[rgba(255,255,255,0.03)] rounded-md border border-[rgba(255,255,255,0.1)]">
                      <h3 className="text-lg font-medium text-white mb-4">Preprocessing options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { id: 'normalize', label: 'Normalization (Min-Max Scaling)' },
                          { id: 'standardize', label: 'Standardization (Z-score)' },
                          { id: 'missing_values', label: 'Missing values handling' },
                          { id: 'outliers', label: 'Outlier detection and treatment' },
                          { id: 'encode_categorical', label: 'Categorical variables encoding' },
                          { id: 'feature_selection', label: 'Feature selection' },
                          { id: 'dimensionality_reduction', label: 'Dimensionality reduction' },
                          { id: 'data_transformation', label: 'Data transformation' },
                          { id: 'feature_engineering', label: 'Feature engineering' },
                          { id: 'data_balancing', label: 'Data balancing' }
                        ].map(option => (
                          <div key={option.id} className="flex items-center space-x-3">
                            <FormCheckbox
                              id={option.id}
                              name={option.id}
                              checked={preprocessingOptions[option.id as keyof typeof preprocessingOptions]}
                              onChange={handlePreprocessingOptionChange}
                            />
                            <label htmlFor={option.id} className="text-gray-light text-sm">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <CustomButton 
                      type="submit" 
                      className="w-full"
                      leftIcon={<i className="ri-upload-cloud-line"></i>}
                    >
                      Import dataset
                    </CustomButton>
                  </div>
                </Form>
              </CustomCardBody>
            </CustomCard>

            {/* Dataset Preview Container */}
            <CustomCard className="p-0">
              <CustomCardHeader>
                <h2 className="text-xl font-semibold text-white">Dataset Preview</h2>
              </CustomCardHeader>
              <CustomCardBody>
                {isLoading ? (
                  <div className="py-12 text-center text-gray-400">
                    <i className="ri-loader-4-line animate-spin text-4xl mb-4 block"></i>
                    <p>Loading preview...</p>
                  </div>
                ) : previewData ? (
                  <div className="overflow-x-auto">
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
                          <tr key={rowIndex} className="hover:bg-[rgba(255,255,255,0.05)]">
                            {row.map((cell, cellIndex) => (
                              <td 
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                              >
                                {cell}
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
          </div>
        </div>
      </div>

      <style jsx>{`
        .toggle-checkbox:checked {
          transform: translateX(100%);
          border-color: var(--primary);
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: var(--primary);
        }
      `}</style>
    </Layout>
  );
};

export default UploadPage;
