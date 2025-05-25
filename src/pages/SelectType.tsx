import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';
import { BookOpen, Settings, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

// Algorithm configs
const CLASSIFICATION_ALGORITHMS = {
  "Logistic Regression": "Logistic Regression",
  SVC: "SVC",
  "Decision Tree Classifier": "Decision Tree Classifier",
  "Random Forest Classifier": "Random Forest Classifier",
  "Gradient Boosting Classifier": "Gradient Boosting Classifier",
  "KNeighbors Classifier": "KNeighbors Classifier",
  "Quadratic Discriminant Analysis": "Quadratic Discriminant Analysis",
  "Linear Discriminant Analysis": "Linear Discriminant Analysis",
  "AdaBoost Classifier": "AdaBoost Classifier",
  "Bagging Classifier": "Bagging Classifier",
  "Gaussian NB": "Gaussian NB",
  "MLP Classifier": "MLP Classifier",
};

const REGRESSION_ALGORITHMS = {
  "Linear Regression": "Linear Regression",
  SVR: "SVR",
  "Decision Tree Regressor": "Decision Tree Regressor",
  Ridge: "Ridge",
  Lasso: "Lasso",
  "Elastic Net": "Elastic Net",
  "Random Forest Regressor": "Random Forest Regressor",
  "Gradient Boosting Regressor": "Gradient Boosting Regressor",
  "AdaBoost Regressor": "AdaBoost Regressor",
  "Bagging Regressor": "Bagging Regressor",
  "Random Trees Embedding": "Random Trees Embedding",
  "MLP Regressor": "MLP Regressor",
};

const CLUSTERING_ALGORITHMS: { [key: string]: { [key: string]: string } } = {
  partition: { "K-Means": "K-Means" },
  density: { DBSCAN: "DBSCAN", OPTICS: "OPTICS", HDBSCAN: "HDBSCAN" },
  hierarchical: { Agglomerative: "Agglomerative", BIRCH: "BIRCH" },
  model: { GMM: "GMM" },
  spectral: { "Spectral Clustering": "Spectral Clustering" },
};

interface ParameterConfig {
  type: 'boolean' | 'select' | 'number' | 'text';
  default?: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

interface AlgorithmDoc {
  short_description?: string;
  doc?: string;
  parameters?: { [key: string]: ParameterConfig };
}

function formatDocString(doc: string) {
  if (!doc) return "<p>No documentation available</p>";
  let formatted = doc
    .replace(/(\w+)\n-+\n/g, "<h5>$1</h5>")
    .replace(/(\w+)\n=+\n/g, "<h4>$1</h4>")
    .replace(/\n\s*\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/(\w+)\s*:\s*/g, "<strong>$1:</strong> ")
    .replace(/Attributes\n-+\n/g, "<h5>Attributes</h5>")
    .replace(/Notes\n-+\n/g, "<h5>Notes</h5>");
  return `<p>${formatted}</p>`;
}

const AlgorithmSelection: React.FC = () => {
  const [modelType, setModelType] = useState<string>("");
  const [algorithmOptions, setAlgorithmOptions] = useState<{ [key: string]: string }>({});
  const [algorithm, setAlgorithm] = useState<string>("");
  const [algorithmDoc, setAlgorithmDoc] = useState<AlgorithmDoc | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [error, setError] = useState<string>("");
  const [parameters, setParameters] = useState<{ [key: string]: ParameterConfig }>({});
  const [selectedParams, setSelectedParams] = useState<{ [key: string]: any }>({});
  const [showParams, setShowParams] = useState(false);

  const modelTypes = [
    { value: "classification", label: "Classification" },
    { value: "regression", label: "Regression" },
    { value: "partition", label: "Partition (K-Means)" },
    { value: "density", label: "Density (DBSCAN, OPTICS, HDBSCAN)" },
    { value: "hierarchical", label: "Hierarchical (Agglomerative, BIRCH)" },
    { value: "model", label: "Model (GMM)" },
    { value: "spectral", label: "Spectral (Spectral Clustering)" },
  ];

  useEffect(() => {
    if (modelType === "classification") {
      setAlgorithmOptions(CLASSIFICATION_ALGORITHMS);
    } else if (modelType === "regression") {
      setAlgorithmOptions(REGRESSION_ALGORITHMS);
    } else if (modelType in CLUSTERING_ALGORITHMS) {
      setAlgorithmOptions(CLUSTERING_ALGORITHMS[modelType]);
    } else {
      setAlgorithmOptions({});
    }
    setAlgorithm("");
    setAlgorithmDoc(null);
    setShowParams(false);
  }, [modelType]);

  useEffect(() => {
    if (algorithm) {
      setLoadingDoc(true);
      setError("");
      fetch(`/get_algorithm_doc?algorithm=${encodeURIComponent(algorithm)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setAlgorithmDoc(data);
          setParameters(data.parameters || {});
          setShowParams(!!data.parameters);
        })
        .catch((err) => {
          setError(err.message);
          setAlgorithmDoc(null);
          setShowParams(false);
        })
        .finally(() => setLoadingDoc(false));
    } else {
      setAlgorithmDoc(null);
      setShowParams(false);
    }
  }, [algorithm]);

  const handleParamCheckbox = (param: string, checked: boolean) => {
    setSelectedParams((prev) => {
      const updated = { ...prev };
      if (!checked) delete updated[param];
      else updated[param] = parameters[param]?.default || "";
      return updated;
    });
  };

  const handleParamChange = (param: string, value: any) => {
    setSelectedParams((prev) => ({ ...prev, [param]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!algorithm) {
      alert("Please choose an algorithm");
      return;
    }
    const payload = {
      algorithm,
      parameters: selectedParams,
    };
    console.log("Selected algorithm:", algorithm);
    console.log("Selected parameters:", selectedParams);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Algorithm Selection
          </h1>
          <p className="text-gray-300 text-lg">
            Choose your machine learning algorithm and configure parameters
          </p>
        </div>

        <Form onSubmit={handleNext}>
          {/* Model Type Selection */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <h2 className="text-2xl font-semibold text-white">Select Model Type</h2>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modelTypes.map((type) => (
                  <label key={type.value} className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="model_type"
                      value={type.value}
                      checked={modelType === type.value}
                      onChange={() => setModelType(type.value)}
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-white text-sm">{type.value}</span>
                  </label>
                ))}
              </div>
            </CustomCardBody>
          </CustomCard>

          {/* Algorithm Selection */}
          {modelType && (
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <h2 className="text-2xl font-semibold text-white">Choose Algorithm</h2>
              </CustomCardHeader>
              <CustomCardBody>
                <FormGroup>
                  <FormLabel htmlFor="algorithm">Algorithm</FormLabel>
                  <select
                    id="algorithm"
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="" disabled>
                      Choose an algorithm
                    </option>
                    {Object.entries(algorithmOptions).map(([value, label]) => (
                      <option key={value} value={value} className="bg-slate-800">
                        {label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Algorithm Documentation */}
          {algorithm && (
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">{algorithm}</h2>
                </div>
              </CustomCardHeader>
              <CustomCardBody>
                {loadingDoc && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mr-3" />
                    <span className="text-gray-300">Loading algorithm information...</span>
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                    <div>
                      <p className="text-red-400 font-medium">Failed to load algorithm details</p>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {algorithmDoc && !loadingDoc && !error && (
                  <div className="space-y-6">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-300">
                        {algorithmDoc.short_description || "No description available"}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Documentation
                      </h4>
                      <div
                        className="prose prose-invert max-w-none bg-white/5 p-4 rounded-lg border border-white/10"
                        dangerouslySetInnerHTML={{ __html: formatDocString(algorithmDoc.doc || "") }}
                      />
                    </div>
                  </div>
                )}
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Parameters Configuration */}
          {showParams && parameters && Object.keys(parameters).length > 0 && (
            <CustomCard className="mb-8">
              <CustomCardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">Configure Parameters</h2>
                </div>
                <p className="text-gray-300 mt-2">Select parameters to configure (optional)</p>
              </CustomCardHeader>
              <CustomCardBody>
                <div className="space-y-6">
                  {/* Parameter Selection */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Available Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(parameters).map(([paramName]) => (
                        <label key={paramName} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paramName in selectedParams}
                            onChange={(e) => handleParamCheckbox(paramName, e.target.checked)}
                            className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-white text-sm">{paramName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Parameter Inputs */}
                  {Object.keys(selectedParams).length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                        Parameter Values
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(parameters).map(([paramName, paramConfig]) => {
                          if (!(paramName in selectedParams)) return null;
                          
                          return (
                            <FormGroup key={paramName}>
                              <FormLabel htmlFor={paramName}>{paramName}</FormLabel>
                              {paramConfig.type === "boolean" ? (
                                <div className="flex space-x-4">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name={paramName}
                                      checked={selectedParams[paramName] === true}
                                      onChange={() => handleParamChange(paramName, true)}
                                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                                    />
                                    <span className="text-white">True</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name={paramName}
                                      checked={selectedParams[paramName] === false}
                                      onChange={() => handleParamChange(paramName, false)}
                                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                                    />
                                    <span className="text-white">False</span>
                                  </label>
                                </div>
                              ) : paramConfig.type === "select" ? (
                                <select
                                  id={paramName}
                                  value={selectedParams[paramName] || paramConfig.default || ""}
                                  onChange={(e) => handleParamChange(paramName, e.target.value)}
                                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                >
                                  {paramConfig.options?.map((option) => (
                                    <option key={option} value={option} className="bg-slate-800">
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : paramConfig.type === "number" ? (
                                <FormInput
                                  type="number"
                                  id={paramName}
                                  min={paramConfig.min}
                                  max={paramConfig.max}
                                  step={paramConfig.step}
                                  value={selectedParams[paramName] || paramConfig.default || ""}
                                  onChange={(e) => handleParamChange(paramName, parseFloat(e.target.value))}
                                />
                              ) : (
                                <FormInput
                                  type="text"
                                  id={paramName}
                                  value={selectedParams[paramName] || paramConfig.default || ""}
                                  onChange={(e) => handleParamChange(paramName, e.target.value)}
                                />
                              )}
                            </FormGroup>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CustomCardBody>
            </CustomCard>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <CustomButton
              type="submit"
              disabled={!algorithm || loadingDoc}
              className="px-8 py-3"
              size="lg"
            >
              {loadingDoc ? "Loading..." : "Next Step"}
            </CustomButton>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AlgorithmSelection;
