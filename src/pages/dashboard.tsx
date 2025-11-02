
import React, { useEffect, useState } from "react";

import { CustomCard, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { useNavigate } from "react-router-dom";
import Layout from '../components/Layout';

interface Project {
  id: number;
  name: string;
  type: string;
  dataset: string;
  algo: string;
  accuracy?: number;
  mse?: number;
  silhouette?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string>('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        if (data.success && data.projects && data.user_id) {
          setProjects(data.projects);
          console.log(data.projects);
          console.log(data.user_id);
          setUserId(data.user_id);
        } else {
          setError('No model info returned');
        }
      }catch (err: any) {
        setError(err.message || 'Error fetching model info');
      }
    };
    fetchData();
    
    
  }, []);
  const handleDelete = async (projectName: string) => {
    if (!window.confirm(`Supprimer le projet "${projectName}" ?`)) return;
  
    try {
      const response = await fetch(`http://localhost:5000/delete/${encodeURIComponent(projectName)}`, {
        method: "POST",
        credentials: "include", // Important pour envoyer le cookie de session
        headers: {
          "Content-Type": "application/json"
        },
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert("Projet supprimé avec succès.");
        // Option 1 : rafraîchir la liste des projets
        window.location.reload();
        // Option 2 : ou reload (window.location.reload();)
      } else {
        alert(`Erreur : ${data.error || "suppression échouée."}`);
      }
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur serveur lors de la suppression.");
    }
  };
  const handleDetails = async (projectName: string) => {  
    try {
      const response = await fetch(`http://localhost:5000/project/${encodeURIComponent(projectName)}`, {
        method: "POST",
        credentials: "include",
        // à adapter si nécessaire
      });
  
      const data = await response.json();
      console.log("data", data);
  
      if (data.success) {
        navigate(`/project/${encodeURIComponent(projectName)}`);
      } else {
        alert("Impossible d'accéder au projet.");
        console.error("Erreur backend :", data.message || data);
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      alert("Erreur de connexion au serveur.");
    }
  };
  

  return (
    <Layout><div>
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-white">Dashboard of {userId}</h1>
        <div className="flex space-x-4 mt-4 md:mt-0">
        <CustomButton variant="outline">
              <i className="ri-upload-2-line mr-2"></i> New Project
            </CustomButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <CustomCard className="bg-gradient-to-br from-primary/20 to-primary-dark/20 border-primary/30">
            <CustomCardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light/70 text-sm">Total Projects</p>
                  <h3 className="text-3xl font-bold text-white mt-1">{projects.length}</h3>
                </div>
                <div className="bg-primary/20 p-3 rounded-full">
                  <i className="ri-ai-generate text-2xl text-primary-light"></i>
                </div>
              </div>
              
            </CustomCardBody>
          </CustomCard>

        <div className="p-6 rounded bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30">
          <p className="text-gray-300 text-sm">Predictions</p>
          <h3 className="text-3xl font-bold text-white mt-1">
            {
              projects.filter(
                (p) =>
                  typeof p.accuracy === "number" ||
                  typeof p.mse === "number" ||
                  typeof p.silhouette === "number"
              ).length
            }
          </h3>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Projects</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <th className="text-left p-4 text-gray-400">Name</th>
                <th className="text-left p-4 text-gray-400">Type</th>
                <th className="text-left p-4 text-gray-400">Algorithm</th>
                <th className="text-left p-4 text-gray-400">Score</th>
                <th className="text-left p-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(243,197,197,0.02)]"
                >
                  <td className="p-4 text-white">{project.name}</td>
                  <td className="p-4 text-gray-300">{project.type}</td>
                  <td className="p-4 text-gray-300">{project.algo}</td>
                  <td className="p-4">
                    {project.accuracy !== undefined ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          project.accuracy >= 0.85
                            ? "bg-green-500/20 text-green-400"
                            : project.accuracy >= 0.75
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {(project.accuracy * 100).toFixed(1)}% Accuracy
                      </span>
                    ) : project.mse !== undefined ? (
                      <span className="text-blue-400">{typeof project.mse === "number" ? project.mse.toFixed(2) : "N/A"}MSE</span>
                    ) : project.silhouette !== undefined ? (
                      <span className="text-blue-600">
                        {(project.silhouette * 100).toFixed(1)}% silhouette
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      {
                        project.type !== "preprocessing" ? (
                          <><button onClick={() => handleDetails(project.name)} title="View" className="text-gray-400 hover:text-white">
                            <i className="ri-eye-line"></i>
                          </button><button className="text-gray-400 hover:text-white" title="Download">
                              <i className="ri-download-line"></i>
                            </button><button onClick={() => handleDelete(project.name)} className="text-red-400 hover:text-red-600" title="Delete">
                              <i className="ri-delete-bin-line"></i>
                            </button></>
                        ) : (
                          <button onClick={() => handleDelete(project.name)} className="text-red-400 hover:text-red-600" title="Delete">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 p-6">
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
    </Layout>
  );
};


export default Dashboard;
