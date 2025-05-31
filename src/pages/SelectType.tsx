import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';
import { BookOpen, Settings, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Layout from "@/components/Layout";
import { useNavigate } from 'react-router-dom';

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
  partition: { "KMeans": "K-Means" },
  density: { DBSCAN: "DBSCAN", OPTICS: "OPTICS", HDBSCAN: "HDBSCAN" },
  hierarchical: { Agglomerative: "Agglomerative", BIRCH: "BIRCH" },
  model: { GMM: "GMM" },
  spectral: { "Spectral Clustering": "Spectral Clustering" },
};

interface ParameterConfig {
  type: 'boolean' | 'select' | 'number' | 'text' | 'float' | 'int' | 'bool' | 'str';
  default?: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
}
const CLASSIFICATION_MODEL_CONFIGS:any = {
  "Logistic Regression": {
    module: "sklearn.linear_model",
    class: "LogisticRegression",
    parameters: {
      penalty: { type: "select", options: ["l2", "none", "l1", "elasticnet"], default: "l2" },
      C: { type: "float", default: 1.0 },
      solver: {
        type: "select",
        options: ["lbfgs", "liblinear", "sag", "saga", "newton-cg"],
        default: "lbfgs"
      },
      max_iter: { type: "int", default: 100 },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "SVC": {
    module: "sklearn.svm",
    class: "SVC",
    parameters: {
      kernel: { type: "select", options: ["linear", "poly", "rbf", "sigmoid"], default: "rbf" },
      C: { type: "float", default: 1.0 },
      gamma: { type: "str", default: "scale" },
      probability: { type: "bool", default: false },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Decision Tree Classifier": {
    module: "sklearn.tree",
    class: "DecisionTreeClassifier",
    parameters: {
      criterion: { type: "select", options: ["gini", "entropy", "log_loss"], default: "gini" },
      splitter: { type: "select", options: ["best", "random"], default: "best" },
      max_depth: { type: "int", default: null, optional: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Random Forest Classifier": {
    module: "sklearn.ensemble",
    class: "RandomForestClassifier",
    parameters: {
      n_estimators: { type: "int", default: 100 },
      criterion: { type: "select", options: ["gini", "entropy", "log_loss"], default: "gini" },
      max_depth: { type: "int", default: null, optional: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Gradient Boosting Classifier": {
    module: "sklearn.ensemble",
    class: "GradientBoostingClassifier",
    parameters: {
      n_estimators: { type: "int", default: 100 },
      learning_rate: { type: "float", default: 0.1 },
      loss: { type: "select", options: ["log_loss", "exponential"], default: "log_loss" },
      max_depth: { type: "int", default: 3 },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "KNeighbors Classifier": {
    module: "sklearn.neighbors",
    class: "KNeighborsClassifier",
    parameters: {
      n_neighbors: { type: "int", default: 5 },
      weights: { type: "select", options: ["uniform", "distance"], default: "uniform" },
      algorithm: { type: "select", options: ["auto", "ball_tree", "kd_tree", "brute"], default: "auto" }
    }
  },

  "Quadratic Discriminant Analysis": {
    module: "sklearn.discriminant_analysis",
    class: "QuadraticDiscriminantAnalysis",
    parameters: {
      reg_param: { type: "float", default: 0.0 }
    }
  },

  "Linear Discriminant Analysis": {
    module: "sklearn.discriminant_analysis",
    class: "LinearDiscriminantAnalysis",
    parameters: {
      solver: { type: "select", options: ["svd", "lsqr", "eigen"], default: "svd" },
      shrinkage: { type: "select", options: ["auto", "none", "manual"], default: "none", optional: true }
    }
  },

  "AdaBoost Classifier": {
    module: "sklearn.ensemble",
    class: "AdaBoostClassifier",
    parameters: {
      n_estimators: { type: "int", default: 50 },
      learning_rate: { type: "float", default: 1.0 },
      algorithm: { type: "select", options: ["SAMME", "SAMME.R"], default: "SAMME.R" },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Bagging Classifier": {
    module: "sklearn.ensemble",
    class: "BaggingClassifier",
    parameters: {
      n_estimators: { type: "int", default: 10 },
      max_samples: { type: "float", default: 1.0 },
      max_features: { type: "float", default: 1.0 },
      bootstrap: { type: "bool", default: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Gaussian NB": {
    module: "sklearn.naive_bayes",
    class: "GaussianNB",
    parameters: {
      var_smoothing: { type: "float", default: 1e-9 }
    }
  },

  "MLP Classifier": {
    module: "sklearn.neural_network",
    class: "MLPClassifier",
    parameters: {
      hidden_layer_sizes: { type: "str", default: "(100,)" },
      activation: { type: "select", options: ["identity", "logistic", "tanh", "relu"], default: "relu" },
      solver: { type: "select", options: ["lbfgs", "sgd", "adam"], default: "adam" },
      alpha: { type: "float", default: 0.0001 },
      learning_rate: { type: "select", options: ["constant", "invscaling", "adaptive"], default: "constant" },
      max_iter: { type: "int", default: 200 },
      random_state: { type: "int", default: null, optional: true }
    }
  }
};

const CLUSTERING_MODEL_CONFIGS:any = {
  "KMeans": {
    module: "sklearn.cluster",
    class: "KMeans",
    parameters: {
      n_clusters: { type: "int", default: 8, min: 1 },
      init: { type: "select", options: ["k-means++", "random"], default: "k-means++" },
      n_init: { type: "int", default: "auto", optional: true },
      max_iter: { type: "int", default: 300, min: 1 },
      tol: { type: "float", default: 1e-4, step: 1e-4 },
      random_state: { type: "int", default: null, optional: true },
    }
  },

  "DBSCAN": {
    module: "sklearn.cluster",
    class: "DBSCAN",
    parameters: {
      eps: { type: "float", default: 0.5, min: 0 },
      min_samples: { type: "int", default: 5, min: 1 },
      metric: { type: "str", default: "euclidean" },
    }
  },

  "OPTICS": {
    module: "sklearn.cluster",
    class: "OPTICS",
    parameters: {
      min_samples: { type: "int", default: 5 },
      xi: { type: "float", default: 0.05, min: 0 },
      min_cluster_size: { type: "int", default: 2 },
      metric: { type: "str", default: "minkowski" }
    }
  },

  "HDBSCAN": {
    module: "sklearn.cluster",
    class: "HDBSCAN",
    parameters: {
      min_cluster_size: { type: "int", default: 5 },
      min_samples: { type: "int", default: null, optional: true },
      metric: { type: "str", default: "euclidean" },
      cluster_selection_method: { type: "select", options: ["eom", "leaf"], default: "eom" }
    }
  },

  "AgglomerativeClustering": {
    module: "sklearn.cluster",
    class: "AgglomerativeClustering",
    parameters: {
      n_clusters: { type: "int", default: 2 },
      affinity: { type: "select", options: ["euclidean", "l1", "l2", "manhattan", "cosine"], default: "euclidean" },
      linkage: { type: "select", options: ["ward", "complete", "average", "single"], default: "ward" }
    }
  },

  "Birch": {
    module: "sklearn.cluster",
    class: "Birch",
    parameters: {
      threshold: { type: "float", default: 0.5 },
      n_clusters: { type: "int", default: 3 }
    }
  },

  "GaussianMixture": {
    module: "sklearn.mixture",
    class: "GaussianMixture",
    parameters: {
      n_components: { type: "int", default: 1 },
      covariance_type: { type: "select", options: ["full", "tied", "diag", "spherical"], default: "full" },
      tol: { type: "float", default: 1e-3 },
      max_iter: { type: "int", default: 100 },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "SpectralClustering": {
    module: "sklearn.cluster",
    class: "SpectralClustering",
    parameters: {
      n_clusters: { type: "int", default: 8 },
      affinity: { type: "select", options: ["rbf", "nearest_neighbors", "precomputed", "precomputed_nearest_neighbors"], default: "rbf" },
      assign_labels: { type: "select", options: ["kmeans", "discretize", "cluster_qr"], default: "kmeans" },
      random_state: { type: "int", default: null, optional: true }
    }
  }
};
const REGRESSION_MODEL_CONFIGS:any = {
  "Linear Regression": {
    module: "sklearn.linear_model",
    class: "LinearRegression",
    parameters: {
      fit_intercept: { type: "bool", default: true },
      positive: { type: "bool", default: false }
    }
  },

  "SVR": {
    module: "sklearn.svm",
    class: "SVR",
    parameters: {
      kernel: { type: "select", options: ["linear", "poly", "rbf", "sigmoid", "precomputed"], default: "rbf" },
      C: { type: "float", default: 1.0, min: 0 },
      epsilon: { type: "float", default: 0.1 }
    }
  },

  "Decision Tree Regressor": {
    module: "sklearn.tree",
    class: "DecisionTreeRegressor",
    parameters: {
      criterion: { type: "select", options: ["squared_error", "friedman_mse", "absolute_error", "poisson"], default: "squared_error" },
      splitter: { type: "select", options: ["best", "random"], default: "best" },
      max_depth: { type: "int", default: null, optional: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Ridge": {
    module: "sklearn.linear_model",
    class: "Ridge",
    parameters: {
      alpha: { type: "float", default: 1.0 },
      solver: {
        type: "select",
        options: ["auto", "svd", "cholesky", "lsqr", "sparse_cg", "sag", "saga", "lbfgs"],
        default: "auto"
      },
      fit_intercept: { type: "bool", default: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Lasso": {
    module: "sklearn.linear_model",
    class: "Lasso",
    parameters: {
      alpha: { type: "float", default: 1.0 },
      fit_intercept: { type: "bool", default: true },
      max_iter: { type: "int", default: 1000 },
      tol: { type: "float", default: 1e-4 },
      selection: { type: "select", options: ["cyclic", "random"], default: "cyclic" },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Elastic Net": {
    module: "sklearn.linear_model",
    class: "ElasticNet",
    parameters: {
      alpha: { type: "float", default: 1.0 },
      l1_ratio: { type: "float", default: 0.5 },
      fit_intercept: { type: "bool", default: true },
      max_iter: { type: "int", default: 1000 },
      tol: { type: "float", default: 1e-4 },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Random Forest Regressor": {
    module: "sklearn.ensemble",
    class: "RandomForestRegressor",
    parameters: {
      n_estimators: { type: "int", default: 100 },
      criterion: { type: "select", options: ["squared_error", "absolute_error", "friedman_mse", "poisson"], default: "squared_error" },
      max_depth: { type: "int", default: null, optional: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Gradient Boosting Regressor": {
    module: "sklearn.ensemble",
    class: "GradientBoostingRegressor",
    parameters: {
      n_estimators: { type: "int", default: 100 },
      learning_rate: { type: "float", default: 0.1 },
      loss: { type: "select", options: ["squared_error", "absolute_error", "huber", "quantile"], default: "squared_error" },
      max_depth: { type: "int", default: 3 },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "AdaBoost Regressor": {
    module: "sklearn.ensemble",
    class: "AdaBoostRegressor",
    parameters: {
      n_estimators: { type: "int", default: 50 },
      learning_rate: { type: "float", default: 1.0 },
      loss: { type: "select", options: ["linear", "square", "exponential"], default: "linear" },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Bagging Regressor": {
    module: "sklearn.ensemble",
    class: "BaggingRegressor",
    parameters: {
      n_estimators: { type: "int", default: 10 },
      max_samples: { type: "float", default: 1.0 },
      max_features: { type: "float", default: 1.0 },
      bootstrap: { type: "bool", default: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "Random Trees Embedding": {
    module: "sklearn.ensemble",
    class: "RandomTreesEmbedding",
    parameters: {
      n_estimators: { type: "int", default: 100 },
      max_depth: { type: "int", default: 5 },
      sparse_output: { type: "bool", default: true },
      random_state: { type: "int", default: null, optional: true }
    }
  },

  "MLP Regressor": {
    module: "sklearn.neural_network",
    class: "MLPRegressor",
    parameters: {
      hidden_layer_sizes: { type: "str", default: "(100,)" },
      activation: { type: "select", options: ["identity", "logistic", "tanh", "relu"], default: "relu" },
      solver: { type: "select", options: ["lbfgs", "sgd", "adam"], default: "adam" },
      alpha: { type: "float", default: 0.0001 },
      learning_rate: { type: "select", options: ["constant", "invscaling", "adaptive"], default: "constant" },
      max_iter: { type: "int", default: 200 },
      random_state: { type: "int", default: null, optional: true }
    }
  }
};


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
  const learningType = localStorage.getItem("learning_type") as 'supervised' | 'unsupervised';
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

  // Filter modelTypes based on learning_type
  const filteredModelTypes = learningType === 'supervised'
    ? modelTypes.filter(type => type.value === 'classification' || type.value === 'regression')
    : modelTypes.filter(type => ['partition','density','hierarchical','model','spectral'].includes(type.value));

  useEffect(() => {
    if (modelType === "classification") {
      setAlgorithmOptions(CLASSIFICATION_ALGORITHMS);
    } else if (modelType === "regression") {
      setAlgorithmOptions(REGRESSION_ALGORITHMS);
    } else if (modelType in CLUSTERING_ALGORITHMS) {
      setAlgorithmOptions(CLUSTERING_ALGORITHMS[modelType]);
    } else {
      console.warn("Modèle inconnu :", modelType);
      setAlgorithmOptions({});  // Valeur de repli sûre
    }
    setAlgorithm("");
    setParameters({});
    setShowParams(false);
  }, [modelType]);

  useEffect(() => {
    if (algorithm) {
      setLoadingDoc(true);
      setError("");
      fetch(`http://localhost:5000/get_algorithm_doc?algorithm=${encodeURIComponent(algorithm)}`, {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setAlgorithmDoc(data);
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

  useEffect(() => {
    if (algorithm) {
      setParams();
    } else {
      setParameters({});
      setShowParams(false);
    }
  }, [algorithm, modelType]);
  const setParams = () => {
    console.log(modelType)
    if (modelType === 'classification') {
      console.log(modelType)
      setParameters(CLASSIFICATION_MODEL_CONFIGS[algorithm]?.parameters || {});
    } else if (modelType === 'regression') {
      setParameters(REGRESSION_MODEL_CONFIGS[algorithm]?.parameters || {});
    } else {
      console.log(algorithm)
      setParameters(CLUSTERING_MODEL_CONFIGS[algorithm]?.parameters || {});
      console.log(parameters)
    } 
    setShowParams(!!algorithm);
  }
  const handleParamCheckbox = (paramName: string, isChecked: boolean) => {
    setSelectedParams(prev => {
      const newParams = { ...prev };
      if (isChecked) {
        newParams[paramName] = parameters[paramName].default ?? "";
      } else {
        delete newParams[paramName];
      }
      return newParams;
    });
  };

  const handleParamChange = (param: string, value: any) => {
    setSelectedParams((prev) => ({ ...prev, [param]: value }));
  };
  const navigate = useNavigate();

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!algorithm) {
      alert("Please choose an algorithm");
      return;
    }
    const payload = {
      model_type: modelType,
      algo: algorithm,
      algorithm_parameters: JSON.stringify({ parameters: selectedParams })
    };
    try {
      const response = await fetch("http://localhost:5000/select_type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Failed to submit algorithm selection");
      }else{
        navigate("/select_features");
      }
      
    } catch (error) {
      alert("Error: " + error);
    }
  };
  

  return (
    <Layout>
    <div className="min-h-screen py-12 px-4 ">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Algorithm Selection
          </h1>
          <p className="text-gray-300 text-lg">
            Choose your machine learning algorithm and configure parameters {learningType} tt
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
                {filteredModelTypes.map((type) => (
                  <label key={type.value} className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="model_type"
                      value={type.value}
                      checked={modelType === type.value}
                      onChange={() => setModelType(type.value)}
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-white text-sm">{type.label}</span>
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
                    {algorithmOptions && Object.entries(algorithmOptions).map(([value, label]) => (
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
  className="prose prose-invert max-w-none bg-white/5 p-4 rounded-lg border border-white/10 overflow-y-auto"
  style={{ maxHeight: "300px" }}
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
                      {Object.entries(parameters).map(([paramName, paramConfig]) => (
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
                          let inputType = paramConfig.type;
                          // Normalize types for rendering
                          if (inputType === "float" || inputType === "int" || inputType === "number") inputType = "number";
                          if (inputType === "bool" || inputType === "boolean") inputType = "boolean";
                          if (inputType === "str" || inputType === "text") inputType = "text";
                          return (
                            <FormGroup key={paramName}>
                              <FormLabel htmlFor={paramName}>{paramName}</FormLabel>
                              {inputType === "boolean" ? (
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
                              ) : inputType === "select" ? (
                                <select
                                  id={paramName}
                                  value={selectedParams[paramName] !== undefined ? selectedParams[paramName] : paramConfig.default ?? ""}
                                  onChange={(e) => handleParamChange(paramName, e.target.value)}
                                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                >
                                  {paramConfig.options?.map((option) => (
                                    <option key={option} value={option} className="bg-slate-800">
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : inputType === "number" ? (
                                <FormInput
                                  type="number"
                                  id={paramName}
                                  min={paramConfig.min}
                                  max={paramConfig.max}
                                  step={paramConfig.step}
                                  value={selectedParams[paramName] !== undefined ? selectedParams[paramName] : paramConfig.default ?? ""}
                                  onChange={(e) => handleParamChange(paramName, parseFloat(e.target.value))}
                                />
                              ) : (
                                <FormInput
                                  type="text"
                                  id={paramName}
                                  value={selectedParams[paramName] !== undefined ? selectedParams[paramName] : paramConfig.default ?? ""}
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
    </Layout>
  );
};

export default AlgorithmSelection;
