
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { FileText, Settings, BarChart3, ArrowLeft, Play } from 'lucide-react';
import Layout from "@/components/Layout";

interface ProjectParams {
  [key: string]: any;
}

interface Project {
  name: string;
  dataset: string;
  type: string;
  model?: string;
  params?: ProjectParams;
  error_curve?: string;
  clusters?: string;
  preprocessing_viz?: string;
}

const ProjectDetails = () => {
  const [searchParams] = useSearchParams();
  const { name } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const projectName = searchParams.get('name');

  

  if (loading) return <p className="text-white">Chargement...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!project) return <p className="text-white">Aucun projet trouvé.</p>;

  const fetchProjectDetails = async (name: string) => {
    try {
      console.log('name', name);
      setLoading(true);
      const response = await fetch(`http://localhost:5000/project/${encodeURIComponent(name)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch project details');

      const data = await response.json();

      if (data.success) {
        setProject(data.project_info);
        setError('error');
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError('Échec du chargement des détails du projet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log('name', name);
    if (name) {
      console.log('name', name);
      fetchProjectDetails(name);
    }
  }, [name]);

  const handlePredict = () => {
    if (!project) return;

    const params = new URLSearchParams({
      project_name: project.name,
      filename: project.dataset,
      algo: project.model || '',
      model_type: project.type,
      learning_type: ['regression', 'classification'].includes(project.type) ? 'supervised' : 'unsupervised'
    });

    navigate(`/prediction?${params.toString()}`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const filteredParams = project?.params ? 
    Object.entries(project.params).filter(([key]) => 
      !['X_scaled', 'X_train', 'X_test', 'X_test_columns', 'y_train', 'y_test'].includes(key)
    ) : [];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-white text-lg">Chargement des détails du projet...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-red-400 text-lg">{error || 'Projet non trouvé'}</p>
              <CustomButton onClick={handleBackToDashboard} className="mt-4">
                Retour au tableau de bord
              </CustomButton>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {project.name}
            </h1>
          </div>

          {/* Model Information */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Informations du Modèle</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Dataset</p>
                  <p className="text-white font-medium">{project.dataset}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm">Type de Modèle</p>
                  <p className="text-white font-medium">{project.type}</p>
                </div>
                {project.model && (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 md:col-span-2">
                    <p className="text-gray-400 text-sm">Algorithme</p>
                    <p className="text-white font-medium">{project.model}</p>
                  </div>
                )}
              </div>
            </CustomCardBody>
          </CustomCard>

          {/* Model Parameters */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Paramètres du Modèle</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              {filteredParams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredParams.map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-gray-300 font-medium">{key}:</span>
                      <span className="text-white">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Aucun paramètre disponible</p>
              )}
            </CustomCardBody>
          </CustomCard>

          {/* Visualization */}
          <CustomCard className="mb-8">
            <CustomCardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Visualisation</h2>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              {project.error_curve || project.clusters || project.preprocessing_viz ? (
                <div className="flex justify-center">
                  <img
                    src={project.error_curve || project.clusters || project.preprocessing_viz}
                    alt={project.error_curve ? "Courbe d'erreur" : project.clusters ? "Visualisation des clusters" : "Visualisation du prétraitement"}
                    className="max-w-full h-auto rounded-lg border border-white/10"
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-center">Aucune visualisation disponible</p>
              )}
            </CustomCardBody>
          </CustomCard>

          {/* Actions */}
          <CustomCard>
            <CustomCardHeader>
              <h2 className="text-2xl font-semibold text-white">Actions</h2>
            </CustomCardHeader>
            <CustomCardBody>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {['regression', 'classification'].includes(project.type) && (
                  <CustomButton
                    onClick={handlePredict}
                    size="lg"
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Charger les paramètres et prédire</span>
                  </CustomButton>
                )}
                <CustomButton
                  onClick={handleBackToDashboard}
                  variant="secondary"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Retour au tableau de bord</span>
                </CustomButton>
              </div>
            </CustomCardBody>
          </CustomCard>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetails;
