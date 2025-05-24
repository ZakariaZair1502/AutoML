import pandas as pd
import numpy as np
import os
import json
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder, LabelEncoder
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering, Birch, SpectralClustering, OPTICS, HDBSCAN
from sklearn.mixture import GaussianMixture
from sklearn.decomposition import PCA
from sklearn import metrics
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
ALGORITHMS = {
    'K-Means': KMeans,
    'DBSCAN': DBSCAN,
    'HDBSCAN': HDBSCAN,  # Ajout de 'HDBSCAN'
    'OPTICS': OPTICS,
    'Agglomerative': AgglomerativeClustering,
    'BIRCH': Birch,
    'GMM': GaussianMixture,
    'Spectral Clustering': SpectralClustering,
}
def convert_algorithm_parameters(algorithm_parameters):
    processed_parameters = {}

    if algorithm_parameters:
        for key, value in algorithm_parameters.items():
            if isinstance(value, str) and value.lower() == 'none':
                processed_parameters[key] = None
            elif isinstance(value, str) and value.lower() in ['true', 'false']:
                processed_parameters[key] = value.lower() == 'true'
            elif isinstance(value, str) and value.strip().lstrip('-').isdigit():
                # Modification ici pour gérer les nombres négatifs
                processed_parameters[key] = int(value)
            elif isinstance(value, str) and value.lower().replace('.', '', 1).replace('-', '', 1).isdigit():
                # Modification ici pour gérer les nombres décimaux négatifs
                processed_parameters[key] = float(value)
            elif isinstance(value, str) and 'e' in value.lower():
                try:
                    processed_parameters[key] = float(value)
                except ValueError:
                    processed_parameters[key] = value
            elif isinstance(value, str) and value.startswith('(') and value.endswith(')'):
                try:
                    tuple_content = value[1:-1].split(',')
                    processed_parameters[key] = tuple(map(int, tuple_content))
                except ValueError:
                    processed_parameters[key] = value
            elif isinstance(value, str) and value.startswith('[') and value.endswith(']'):
                try:
                    processed_parameters[key] = [float(v) for v in value[1:-1].split(',')]
                except ValueError:
                    processed_parameters[key] = value
            else:
                processed_parameters[key] = value

    return processed_parameters
def get_features(file):
    """
    Extrait les colonnes d'un fichier CSV.
    
    Args:
        file: Le fichier CSV à analyser
        
    Returns:
        list: Liste des noms de colonnes
    """
    try:
        data = pd.read_csv(file)
        return list(data.columns)
    except pd.errors.EmptyDataError:
        raise ValueError("Le fichier CSV est vide.")
    except pd.errors.ParserError:
        raise ValueError("Le fichier CSV est mal formaté.")
    except Exception as e:
        raise ValueError(f"Erreur lors de la lecture du fichier CSV : {str(e)}")

def preprocess_data(X, preprocessing_enabled=False, preprocessing_options=None):
    """Prétraite les données selon les options sélectionnées.
    
    Args:
        X: Les features à prétraiter
        preprocessing_enabled: Booléen indiquant si le prétraitement est activé
        preprocessing_options: Liste des options de prétraitement sélectionnées
        
    Returns:
        X_processed: Les features prétraitées
    """
    if not preprocessing_enabled or not preprocessing_options:
        return X
    
    X_processed = X.copy()
    
    # Récupérer les colonnes numériques et catégorielles
    numeric_cols = X_processed.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = X_processed.select_dtypes(exclude=['number']).columns.tolist()
    
    # Gestion des valeurs manquantes
    if 'missing_values' in preprocessing_options:
        # Imputation des valeurs numériques manquantes par la médiane
        if numeric_cols:
            num_imputer = SimpleImputer(strategy='median')
            X_processed[numeric_cols] = num_imputer.fit_transform(X_processed[numeric_cols])
        
        # Imputation des valeurs catégorielles manquantes par le mode
        if categorical_cols:
            cat_imputer = SimpleImputer(strategy='most_frequent')
            X_processed[categorical_cols] = cat_imputer.fit_transform(X_processed[categorical_cols])
    
    # Encodage des variables catégorielles
    if 'encode_categorical' in preprocessing_options and categorical_cols:
        # Utiliser OneHotEncoder pour les variables catégorielles
        for col in categorical_cols:
            # Créer des variables dummy et les ajouter au DataFrame
            dummies = pd.get_dummies(X_processed[col], prefix=col, drop_first=True)
            X_processed = pd.concat([X_processed, dummies], axis=1)
        
        # Supprimer les colonnes catégorielles originales
        X_processed = X_processed.drop(categorical_cols, axis=1)
    
    # Normalisation (Min-Max Scaling)
    if 'normalize' in preprocessing_options:
        scaler = MinMaxScaler()
        X_processed = pd.DataFrame(scaler.fit_transform(X_processed), 
                                 columns=X_processed.columns, 
                                 index=X_processed.index)
    
    # Standardisation (Z-score)
    if 'standardize' in preprocessing_options:
        scaler = StandardScaler()
        X_processed = pd.DataFrame(scaler.fit_transform(X_processed), 
                                 columns=X_processed.columns, 
                                 index=X_processed.index)
    
    # Détection et traitement des outliers
    if 'outliers' in preprocessing_options:
        # Utiliser la méthode IQR pour détecter et remplacer les outliers
        for col in X_processed.select_dtypes(include=['number']).columns:
            Q1 = X_processed[col].quantile(0.25)
            Q3 = X_processed[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Remplacer les outliers par les bornes
            X_processed[col] = np.where(X_processed[col] < lower_bound, lower_bound, X_processed[col])
            X_processed[col] = np.where(X_processed[col] > upper_bound, upper_bound, X_processed[col])
    
    return X_processed

def model_train(file, model_name, selected_features=None, algorithm_parameters=None, preprocessing_enabled=False, preprocessing_options=None):
    """
    Entraîne un modèle de clustering sur les données.
    
    Args:
        file: Le fichier CSV contenant les données
        model_name: Le nom de l'algorithme à utiliser
        selected_features: Les colonnes à utiliser pour le clustering
        n_clusters: Le nombre de clusters (pour les algorithmes basés sur la partition)
        algorithm_parameters: Dictionnaire contenant les paramètres spécifiques à l'algorithme
        preprocessing_enabled: Booléen indiquant si le prétraitement est activé
        preprocessing_options: Liste des options de prétraitement sélectionnées
        
    Returns:
        dict: Paramètres du modèle et résultats
    """
    if model_name not in ALGORITHMS:
        raise ValueError(f"Modèle {model_name} non valide")

    try:
        data = pd.read_csv(file)
    except Exception as e:
        raise ValueError(f"Erreur lors de la lecture du fichier CSV : {str(e)}")

    # Sélection des features
    if selected_features:
        if not all(feature in data.columns for feature in selected_features):
            raise ValueError("Certaines features sélectionnées n'existent pas dans le dataset")
        X = data[selected_features]
    else:
        # Utiliser toutes les colonnes
        X = data
    
    # Prétraitement des données selon les options sélectionnées
    X_processed = preprocess_data(X, preprocessing_enabled, preprocessing_options)
    
    # Conversion en numpy array pour les algorithmes
    X_scaled = X_processed.values
    
    # Initialisation des paramètres par défaut
    if algorithm_parameters is None:
        algorithm_parameters = {}
    
    # Initialisation du modèle avec les paramètres appropriés
    if algorithm_parameters:
        processed_parameters = convert_algorithm_parameters(algorithm_parameters)
        # Save model parameters to JSON file
        model_params_path = os.path.join(os.path.dirname(file), 'models', 'model_params.json')
        os.makedirs(os.path.dirname(model_params_path), exist_ok=True)
        with open(model_params_path, 'w') as f:
            json.dump(processed_parameters, f, indent=4)
        model = ALGORITHMS[model_name](**processed_parameters)
    else:
        model = ALGORITHMS[model_name]()
    
    # Entraînement du modèle
    model.fit(X_scaled)

    # Attribution des labels
    # Certains algorithmes comme DBSCAN n'ont pas d'attribut predict()
    # On utilise directement les labels générés par fit()
    if hasattr(model, 'labels_'):
        labels = model.labels_
    else:
        # Pour les algorithmes qui n'ont pas d'attribut labels_ (comme GMM)
        # mais qui ont une méthode predict()
        if hasattr(model, 'predict'):
            labels = model.predict(X_scaled)
        else:
            # Cas de secours - ne devrait pas arriver avec les algorithmes actuels
            raise ValueError(f"L'algorithme {model_name} n'a ni attribut labels_ ni méthode predict().")
    
    
    # Convertir les DataFrames en listes pour la sérialisation JSON
    # Stocker les colonnes pour référence future
    X_columns = X.columns.tolist() if hasattr(X, 'columns') else None
    
    # Store model parameters instead of the model object itself for JSON serialization
    model_params = {}
    try:
        model_params = model.get_params()
    except:
        model_params = processed_parameters
        
    params = {
        'X': X,
        'X_columns': X_columns,
        'X_scaled': X_scaled,
        'model_params': model_params,  # Also store model parameters
        'labels': labels,
        'algo': model_name,
        'n_clusters': len(set(labels)) - (1 if -1 in labels else 0)  # Ajouter les paramètres d'algorithme au dictionnaire
    }
    return model,params

def predict_cluster(model, X_new, X_scaled=None, labels=None):
    """
    Prédit le cluster pour de nouvelles données, même pour les algorithmes qui n'ont pas de méthode predict().
    
    Args:
        model: Le modèle de clustering entraîné
        X_new: Les nouvelles données à prédire
        X_scaled: Les données d'entraînement (nécessaires pour certains algorithmes)
        labels: Les labels des données d'entraînement (nécessaires pour certains algorithmes)
        
    Returns:
        array: Les labels prédits pour les nouvelles données
    """
    # Vérifier que X_new est bien formaté
    if isinstance(X_new, pd.DataFrame):
        X_new = X_new.values
    X_new = np.array(X_new) if not isinstance(X_new, np.ndarray) else X_new
    
    # Si le modèle a une méthode predict, l'utiliser directement
    if hasattr(model, 'predict'):
        try:
            return model.predict(X_new)
        except Exception as e:
            print(f"Erreur lors de l'utilisation de model.predict(): {str(e)}")
    
    # Si le modèle a des labels_ (attribut), les utiliser pour la prédiction
    if hasattr(model, 'labels_') and labels is None:
        labels = model.labels_
    
    # Si le modèle a une méthode fit_predict, l'utiliser
    if hasattr(model, 'fit_predict'):
        try:
            return model.fit_predict(X_new)
        except Exception as e:
            print(f"Erreur lors de l'utilisation de model.fit_predict(): {str(e)}")
    
    # Pour DBSCAN, OPTICS, HDBSCAN qui n'ont pas de méthode predict
    # On peut assigner les points aux clusters existants en fonction de la distance
    from sklearn.cluster import HDBSCAN as SklearnHDBSCAN
    if isinstance(model, SklearnHDBSCAN) and hasattr(model, 'medoids_'):
        try:
            centers = model.medoids_ if model.medoids_ is not None else model.centroids_
            from sklearn.metrics import pairwise_distances
            distances = pairwise_distances(X_new, centers, metric=model.metric)
            return np.argmin(distances, axis=1)
        except Exception as e:
            print(f"Erreur lors de la prédiction pour HDBSCAN: {str(e)}")

    # Fallback pour DBSCAN, OPTICS (sans méthode predict)
    if isinstance(model, (DBSCAN, OPTICS)) and X_scaled is not None and labels is not None:
        try:
            eps = getattr(model, 'eps', 0.5)  # Valeur par défaut
            metric = getattr(model, 'metric', 'euclidean')
            from sklearn.metrics import pairwise_distances

            unique_labels = np.unique(labels)
            cluster_centers = {
                label: np.mean(X_scaled[labels == label], axis=0)
                for label in unique_labels if label != -1
            }

            predictions = np.full(X_new.shape[0], -1)
            for i, point in enumerate(X_new):
                min_dist = float('inf')
                closest_label = -1
                for label, center in cluster_centers.items():
                    dist = pairwise_distances([point], [center], metric=metric)[0][0]
                    if dist < min_dist:
                        min_dist = dist
                        closest_label = label
                if min_dist <= eps:
                    predictions[i] = closest_label
            return predictions
        except Exception as e:
            print(f"Erreur lors de la prédiction pour DBSCAN/OPTICS: {str(e)}")

    # Méthode générique pour tous les autres algorithmes si X_scaled et labels sont disponibles
    if X_scaled is not None and labels is not None:
        try:
            from sklearn.metrics import pairwise_distances
            unique_labels = np.unique(labels)
            cluster_centers = {
                label: np.mean(X_scaled[labels == label], axis=0)
                for label in unique_labels if label != -1
            }
            
            predictions = np.full(X_new.shape[0], -1)
            for i, point in enumerate(X_new):
                min_dist = float('inf')
                closest_label = -1
                for label, center in cluster_centers.items():
                    dist = pairwise_distances([point], [center], metric='euclidean')[0][0]
                    if dist < min_dist:
                        min_dist = dist
                        closest_label = label
                predictions[i] = closest_label
            return predictions
        except Exception as e:
            print(f"Erreur lors de la prédiction générique: {str(e)}")

    # Si aucune méthode n'a fonctionné, retourner -1 pour tous les points
    print("Aucune méthode de prédiction n'a fonctionné, retour de -1 pour tous les points")
    return np.full(X_new.shape[0], -1)

def model_evaluate(params):
    """
    Évalue la qualité du clustering.

    Args:
        params: Paramètres et résultats du modèle

    Returns:
        dict: Paramètres avec métriques d'évaluation ajoutées
    """
    metrics_dict = {}
    
    # Vérifier si les clés nécessaires sont présentes
    if 'X_scaled' not in params or 'labels' not in params:
        raise KeyError("Les clés 'X_scaled' ou 'labels' sont manquantes dans params.")

    X_scaled = params['X_scaled']
    labels = params['labels']
    
    # S'assurer que les données sont bien des tableaux numpy
    X_scaled = np.array(X_scaled) if not isinstance(X_scaled, np.ndarray) else X_scaled
    labels = np.array(labels) if not isinstance(labels, np.ndarray) else labels

    print("X_scaled shape:", X_scaled.shape)

    # Silhouette Score
    if len(set(labels)) > 1 and len(set(labels)) < len(X_scaled) and not all(l == -1 for l in labels):
        try:
            metrics_dict['silhouette'] = float(metrics.silhouette_score(X_scaled, labels))
        except Exception as e:
            print(f"Erreur silhouette_score: {str(e)}")
            metrics_dict['silhouette'] = "Non calculable"
    else:
        metrics_dict['silhouette'] = "Non calculable"

    # Calinski-Harabasz Index
    if len(set(labels)) > 1 and not all(l == -1 for l in labels):
        try:
            metrics_dict['calinski_harabasz'] = float(metrics.calinski_harabasz_score(X_scaled, labels))
        except Exception as e:
            print(f"Erreur calinski_harabasz_score: {str(e)}")
            metrics_dict['calinski_harabasz'] = "Non calculable"
    else:
        metrics_dict['calinski_harabasz'] = "Non calculable"

    # Davies-Bouldin Index
    if len(set(labels)) > 1 and not all(l == -1 for l in labels):
        try:
            metrics_dict['davies_bouldin'] = float(metrics.davies_bouldin_score(X_scaled, labels))
        except Exception as e:
            print(f"Erreur davies_bouldin_score: {str(e)}")
            metrics_dict['davies_bouldin'] = "Non calculable"
    else:
        metrics_dict['davies_bouldin'] = "Non calculable"

    # Nombre de clusters
    metrics_dict['n_clusters'] = params.get('n_clusters', len(set(labels)) - (1 if -1 in labels else 0))

    # Nombre de points par cluster
    cluster_counts = {}
    unique_labels = set(labels)
    for label in unique_labels:
        count = np.sum(labels == label)
        if label == -1:
            cluster_counts['noise'] = int(count)
        else:
            cluster_counts[f'cluster_{label}'] = int(count)
    metrics_dict['cluster_counts'] = cluster_counts

    # Ajout au dictionnaire params
    params['metrics'] = metrics_dict

    return params
