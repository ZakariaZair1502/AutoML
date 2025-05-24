import React, { useState, useEffect } from "react";
import "./styles/select_type.css";

// Algorithm configs (should be moved to a separate file/module for maintainability)
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
const CLUSTERING_ALGORITHMS = {
  partition: { "K-Means": "K-Means" },
  density: { DBSCAN: "DBSCAN", OPTICS: "OPTICS", HDBSCAN: "HDBSCAN" },
  hierarchical: { Agglomerative: "Agglomerative", BIRCH: "BIRCH" },
  model: { GMM: "GMM" },
  spectral: { "Spectral Clustering": "Spectral Clustering" },
};

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

const SelectType: React.FC = () => {
  const [modelType, setModelType] = useState<string>("");
  const [algorithmOptions, setAlgorithmOptions] = useState<{ [key: string]: string }>({});
  const [algorithm, setAlgorithm] = useState<string>("");
  const [algorithmDoc, setAlgorithmDoc] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [error, setError] = useState<string>("");
  const [parameters, setParameters] = useState<any>({});
  const [selectedParams, setSelectedParams] = useState<{ [key: string]: any }>({});
  const [showParams, setShowParams] = useState(false);

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
    // Submit selected algorithm and parameters
    const payload = {
      algorithm,
      parameters: selectedParams,
    };
    // TODO: send payload to backend or next step
    console.log("Selected algorithm:", algorithm);
    console.log("Selected parameters:", selectedParams);
  };

  return (
    <div className="algorithm-container">
      <form onSubmit={handleNext}>
        <div className="algorithm-type">
          <label>
            <input
              type="radio"
              name="model_type"
              value="classification"
              checked={modelType === "classification"}
              onChange={() => setModelType("classification")}
            />
            Classification
          </label>
          <label>
            <input
              type="radio"
              name="model_type"
              value="regression"
              checked={modelType === "regression"}
              onChange={() => setModelType("regression")}
            />
            Regression
          </label>
          <label>
            <input
              type="radio"
              name="model_type"
              value="partition"
              checked={modelType === "partition"}
              onChange={() => setModelType("partition")}
            />
            Partition (K-Means)
          </label>
          <label>
            <input
              type="radio"
              name="model_type"
              value="density"
              checked={modelType === "density"}
              onChange={() => setModelType("density")}
            />
            Density (DBSCAN, OPTICS, HDBSCAN)
          </label>
          <label>
            <input
              type="radio"
              name="model_type"
              value="hierarchical"
              checked={modelType === "hierarchical"}
              onChange={() => setModelType("hierarchical")}
            />
            Hierarchical (Agglomerative, BIRCH)
          </label>
          <label>
            <input
              type="radio"
              name="model_type"
              value="model"
              checked={modelType === "model"}
              onChange={() => setModelType("model")}
            />
            Model (GMM)
          </label>
          <label>
            <input
              type="radio"
              name="model_type"
              value="spectral"
              checked={modelType === "spectral"}
              onChange={() => setModelType("spectral")}
            />
            Spectral (Spectral Clustering)
          </label>
        </div>
        <div className="algorithm-select">
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={!modelType}
          >
            <option value="" disabled>
              Choose an algorithm
            </option>
            {Object.entries(algorithmOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className={`algorithm-description${algorithmDoc ? " active" : ""}`}>
          {loadingDoc && (
            <div className="loading-state">
              <h3>{algorithm}</h3>
              <div className="spinner"></div>
              <p>Loading algorithm information...</p>
            </div>
          )}
          {error && (
            <div className="error-state">
              <p>
                <i className="fas fa-exclamation-triangle"></i> Failed to load algorithm details
              </p>
              <p className="error-detail">{error}</p>
            </div>
          )}
          {algorithmDoc && !loadingDoc && !error && (
            <>
              <h3>{algorithm}</h3>
              <div className="algorithm-summary">
                <p>{algorithmDoc.short_description || "No description available"}</p>
              </div>
              <div className="documentation-section">
                <h4>
                  <i className="fas fa-book"></i> Documentation
                </h4>
                <div
                  className="doc-content"
                  dangerouslySetInnerHTML={{ __html: formatDocString(algorithmDoc.doc) }}
                ></div>
              </div>
            </>
          )}
        </div>
        {showParams && parameters && (
          <div id="algorithm-parameters-section" className="algorithm-parameters">
            <h3>
              <span id="algorithm-name">{algorithm}</span>
            </h3>
            <div className="parameter-instruction">
              Select parameters to configure (optional):
            </div>
            <div className="checkboxes-container">
              {Object.entries(parameters).map(([paramName, paramConfig]: any) => (
                <div className="parameter-checkbox" key={paramName}>
                  <input
                    type="checkbox"
                    id={`check_${paramName}`}
                    checked={paramName in selectedParams}
                    onChange={(e) => handleParamCheckbox(paramName, e.target.checked)}
                  />
                  <label htmlFor={`check_${paramName}`}>{paramName}</label>
                </div>
              ))}
            </div>
            <div className="inputs-container">
              {Object.entries(parameters).map(([paramName, paramConfig]: any) => (
                <div
                  className={`parameter-input${paramName in selectedParams ? " visible" : ""}`}
                  id={`input_div_${paramName}`}
                  key={paramName}
                  style={{ display: paramName in selectedParams ? "block" : "none" }}
                >
                  <label htmlFor={paramName}>{paramName}</label>
                  {paramConfig.type === "boolean" ? (
                    <div className="radio-group">
                      <input
                        type="radio"
                        name={paramName}
                        value="true"
                        checked={selectedParams[paramName] === true}
                        onChange={() => handleParamChange(paramName, true)}
                        id={`${paramName}_true`}
                      />
                      <label htmlFor={`${paramName}_true`}>True</label>
                      <input
                        type="radio"
                        name={paramName}
                        value="false"
                        checked={selectedParams[paramName] === false}
                        onChange={() => handleParamChange(paramName, false)}
                        id={`${paramName}_false`}
                      />
                      <label htmlFor={`${paramName}_false`}>False</label>
                    </div>
                  ) : paramConfig.type === "select" ? (
                    <select
                      name={paramName}
                      id={paramName}
                      className="parameter-value"
                      value={selectedParams[paramName] || paramConfig.default || ""}
                      onChange={(e) => handleParamChange(paramName, e.target.value)}
                    >
                      {paramConfig.options.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : paramConfig.type === "number" ? (
                    <input
                      type="number"
                      name={paramName}
                      id={paramName}
                      className="parameter-value"
                      min={paramConfig.min}
                      max={paramConfig.max}
                      step={paramConfig.step}
                      value={selectedParams[paramName] || paramConfig.default || ""}
                      onChange={(e) => handleParamChange(paramName, parseFloat(e.target.value))}
                    />
                  ) : (
                    <input
                      type="text"
                      name={paramName}
                      id={paramName}
                      className="parameter-value"
                      value={selectedParams[paramName] || paramConfig.default || ""}
                      onChange={(e) => handleParamChange(paramName, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="next-btn" type="submit" disabled={!algorithm || loadingDoc}>
          Next
        </button>
      </form>
    </div>
  );
};

export default SelectType;
