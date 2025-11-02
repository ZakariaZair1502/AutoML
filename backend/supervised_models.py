import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier, AdaBoostRegressor, BaggingClassifier, BaggingRegressor, RandomTreesEmbedding
from sklearn.neighbors import KNeighborsClassifier
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis, LinearDiscriminantAnalysis
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier,MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_absolute_error, mean_squared_error
import os
import json
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
from imblearn.over_sampling import SMOTE
ALGORITHMS = {
    'Logistic Regression': LogisticRegression,
    'SVC': SVC,
    'Decision Tree Classifier': DecisionTreeClassifier,
    'Random Forest Classifier': RandomForestClassifier,
    'Gradient Boosting Classifier': GradientBoostingClassifier,
    'KNeighbors Classifier': KNeighborsClassifier,
    'Quadratic Discriminant Analysis': QuadraticDiscriminantAnalysis,
    'Linear Discriminant Analysis': LinearDiscriminantAnalysis,
    'AdaBoost Classifier': AdaBoostClassifier,
    'Bagging Classifier': BaggingClassifier,
    'Gaussian NB': GaussianNB,
    'Linear Regression': LinearRegression,
    'SVR': SVR,
    'Decision Tree Regressor': DecisionTreeRegressor,
    'Ridge': Ridge,
    'Lasso': Lasso,
    'Elastic Net': ElasticNet,
    'Random Forest Regressor': RandomForestRegressor,
    'Gradient Boosting Regressor': GradientBoostingRegressor,
    'AdaBoost Regressor': AdaBoostRegressor,
    'Bagging Regressor': BaggingRegressor,
    'Random Trees Embedding': RandomTreesEmbedding,
    'MLP Classifier': MLPClassifier,
    'MLP Regressor': MLPRegressor
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

def preprocess_data(X, y=None, enable_preprocessing=False, preprocessing_options=None):
    """Prétraite les données selon les options sélectionnées.
    
    Args:
        X: Les features à prétraiter
        y: La variable cible (optionnelle)
        enable_preprocessing: Booléen indiquant si le prétraitement est activé
        preprocessing_options: Liste des options de prétraitement sélectionnées
        
    Returns:
        X_processed: Les features prétraitées
        y_processed: La variable cible prétraitée (si fournie)
    """
    if not enable_preprocessing or not preprocessing_options:
        return X, y
    
    X_processed = X.copy()
    y_processed = y.copy() if y is not None else None
    
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
    
    # Sélection de caractéristiques
    if 'feature_selection' in preprocessing_options and y is not None and len(X_processed.columns) > 5:
        # Utiliser SelectKBest pour sélectionner les meilleures caractéristiques
        k = min(10, len(X_processed.columns))  # Sélectionner au maximum 10 caractéristiques
        
        # Choisir la fonction de score appropriée selon le type de y
        if np.issubdtype(y.dtype, np.number):
            selector = SelectKBest(f_regression, k=k)
        else:
            selector = SelectKBest(f_classif, k=k)
        
        # Appliquer la sélection
        X_selected = selector.fit_transform(X_processed, y)
        
        # Récupérer les noms des colonnes sélectionnées
        selected_cols = X_processed.columns[selector.get_support()]
        X_processed = pd.DataFrame(X_selected, columns=selected_cols, index=X_processed.index)
    
    # Équilibrage des données (uniquement pour les problèmes de classification)
    if 'data_balancing' in preprocessing_options and y is not None:
        # Vérifier si c'est un problème de classification
        if not np.issubdtype(y.dtype, np.number) or len(np.unique(y)) < 10:
            try:
                # Appliquer SMOTE pour équilibrer les classes
                smote = SMOTE(random_state=42)
                X_resampled, y_resampled = smote.fit_resample(X_processed, y)
                X_processed = pd.DataFrame(X_resampled, columns=X_processed.columns)
                y_processed = pd.Series(y_resampled, name=y.name)
            except Exception as e:
                # Si SMOTE échoue (par exemple, si une classe a trop peu d'échantillons)
                print(f"Erreur lors de l'application de SMOTE: {str(e)}")
    
    return X_processed, y_processed

def model_train(file, model_name, selected_features=None, target_feature=None, algorithm_parameters=None, enable_preprocessing=False, preprocessing_options=None):
    if model_name not in ALGORITHMS:
        raise ValueError(f"Modèle {model_name} non valide")
    if not target_feature:
        raise ValueError("La colonne cible (target_feature) doit être spécifiée")

    try:
        data = pd.read_csv(file)
    except Exception as e:
        raise ValueError(f"Erreur lors de la lecture du fichier CSV : {str(e)}")

    if target_feature not in data.columns:
        raise ValueError(f"La colonne cible {target_feature} n'existe pas dans le dataset")

    # Initialisation des paramètres par défaut
    if algorithm_parameters is None:
        algorithm_parameters = {}

    # Préparation des paramètres pour le modèle
    
    # Configuration des paramètres selon le type d'algorithme
    
    # Initialisation du modèle avec les paramètres
    model_class = ALGORITHMS[model_name]
    # Convertir les paramètres booléens de chaînes en valeurs booléennes Python
    # et les paramètres numériques de chaînes en entiers ou flottants
    if algorithm_parameters:
        processed_parameters = convert_algorithm_parameters(algorithm_parameters)
        md = model_class(**processed_parameters)
    else:
        md = model_class()
    
    # Préparation des données
    if selected_features:
        if not all(feature in data.columns for feature in selected_features):
            raise ValueError("Certaines features sélectionnées n'existent pas dans le dataset")
        X = data[selected_features]
    else:
        # Utiliser toutes les colonnes sauf la colonne cible
        X = data.drop(columns=[target_feature])
    y = data[target_feature]
    
    # Appliquer le prétraitement des données si activé
    X_processed, y_processed = preprocess_data(X, y, enable_preprocessing, preprocessing_options)
    
    # Division des données en ensembles d'entraînement et de test
    X_train, X_test, y_train, y_test = train_test_split(X_processed, y_processed if y_processed is not None else y, test_size=0.2, random_state=42)
    md.fit(X_train, y_train)
    
    # Convertir les DataFrames en listes pour la sérialisation JSON
    # Retourne l'objet tel quel si ce n'est ni DataFrame, Series, list ou array

    # Stocker les colonnes pour référence future
    X_train_columns = X_train.columns.tolist() if isinstance(X_train, pd.DataFrame) else None
    X_test_columns = X_test.columns.tolist() if isinstance(X_test, pd.DataFrame) else None
    
    # Store model parameters instead of the model object itself for JSON serialization
    model_params = {}
    try:
        model_params = md.get_params()
        # Save model parameters to JSON file
    except:
        model_params = processed_parameters
    params = {
        'X_train': X_train,
        'y_train': y_train,
        'X_test': X_test,
        'y_test': y_test,
        'X_train_columns': X_train_columns,
        'X_test_columns': X_test_columns,
         # Don't store the model object in the params dictionary
        'model_params': model_params,  # Store model parameters instead
        'algo': model_name
    }

    return md,params

def model_evaluate(params, model):
    # Liste des algorithmes de régression
    regression_algorithms = ['Linear Regression', 'SVR', 'Decision Tree Regressor', 'Ridge', 'Lasso', 'Elastic Net', 'Random Forest Regressor', 'Gradient Boosting Regressor', 'AdaBoost Regressor', 'Bagging Regressor']
    
    # Reconvertir les données sérialisées en format approprié pour l'évaluation
    X_test = params['X_test']
    y_test = params['y_test']
    X_train = params['X_train']
    y_train = params['y_train']
    
    # Si les colonnes ont été sauvegardées, reconstruire les DataFrames
    if 'X_test_columns' in params and params['X_test_columns'] is not None:
        X_test = pd.DataFrame(X_test, columns=params['X_test_columns'])
    else:
        X_test = np.array(X_test) if isinstance(X_test, list) else X_test
        
    if 'X_train_columns' in params and params['X_train_columns'] is not None:
        X_train = pd.DataFrame(X_train, columns=params['X_train_columns'])
    else:
        X_train = np.array(X_train) if isinstance(X_train, list) else X_train
    
    # Convertir y_test et y_train en arrays numpy si ce sont des listes
    y_test = np.array(y_test) if isinstance(y_test, list) else y_test
    y_train = np.array(y_train) if isinstance(y_train, list) else y_train
    
    # Load the model from disk if available, otherwise use the model in params
    
    if params['algo'] in regression_algorithms:
        # Regression metrics
        y_pred = model.predict(X_test)
        metrics = {
            'mae': float(mean_absolute_error(y_test, y_pred)),  # Convertir en float pour JSON
            'mse': float(mean_squared_error(y_test, y_pred)),   # Convertir en float pour JSON
            'score': float(model.score(X_train, y_train)),  # Convertir en float pour JSON
        }
    else:
        # Classification metrics
        y_pred = model.predict(X_test)
        metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),  # Convertir en float pour JSON
            'precision': float(precision_score(y_test, y_pred, average='weighted')),  # Convertir en float pour JSON
            'recall': float(recall_score(y_test, y_pred, average='weighted')),  # Convertir en float pour JSON
            'f1_score': float(f1_score(y_test, y_pred, average='weighted'))  # Convertir en float pour JSON
        }
    return metrics
