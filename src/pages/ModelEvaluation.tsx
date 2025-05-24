import React, { useEffect, useState } from 'react';

type ModelEvaluationProps = {
  filename: string;
  algo: string;
  project_name: string;
  model_type: 'regression' | 'classification';
  learning_type: 'supervised' | 'unsupervised';
};

type Metrics = {
  score?: number;
  mse?: number;
  mae?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  silhouette?: number;
  calinski_harabasz?: number;
  davies_bouldin?: number;
  n_clusters?: number;
};

const ModelEvaluation: React.FC<ModelEvaluationProps> = ({
  filename,
  algo,
  project_name,
  model_type,
  learning_type,
}) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch(
      `http://localhost:5000/api/evaluate?filename=${filename}&algo=${algo}&project_name=${project_name}&model_type=${model_type}&learning_type=${learning_type}`
    )
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error('Error fetching metrics:', err));
  }, [filename, algo, project_name, model_type, learning_type]);

  if (!metrics) return <p>Loading metrics...</p>;

  return (
    <div className="evaluate-container">
      <h1>Model Evaluation</h1>
      <h2>Metrics:</h2>
      <div className="metrics">
        {learning_type === 'supervised' ? (
          <>
            <p><strong>Supervised</strong></p>
            {model_type === 'regression' ? (
              <>
                <p><strong>Score:</strong> {metrics.score}</p>
                <p><strong>MSE:</strong> {metrics.mse}</p>
                <p><strong>MAE:</strong> {metrics.mae}</p>
              </>
            ) : (
              <>
                <p><strong>Accuracy:</strong> {metrics.accuracy}</p>
                <p><strong>Precision:</strong> {metrics.precision}</p>
                <p><strong>Recall:</strong> {metrics.recall}</p>
                <p><strong>F1 Score:</strong> {metrics.f1_score}</p>
              </>
            )}
          </>
        ) : (
          <>
            <p><strong>Unsupervised</strong></p>
            <p><strong>Silhouette Score:</strong> {metrics.silhouette}</p>
            <p><strong>Calinski-Harabasz Index:</strong> {metrics.calinski_harabasz}</p>
            <p><strong>Davies-Bouldin Index:</strong> {metrics.davies_bouldin}</p>
            <p><strong>Number of Clusters:</strong> {metrics.n_clusters}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ModelEvaluation;
