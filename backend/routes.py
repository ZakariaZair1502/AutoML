from flask import (
    Flask,
    redirect,
    render_template,
    request,
    url_for,
    current_app,
    flash,
    session,
    jsonify,
    send_file,
)
import pdfkit
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sklearn.datasets import (
    make_blobs,
    make_moons,
    make_circles,
    make_classification,
    make_regression,
)
import supervised_models, unsupervised_models
from sklearn.decomposition import PCA
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np
import joblib as jb
import matplotlib
from sklearn import datasets
from datetime import datetime
matplotlib.use("Agg")  # Utiliser le backend non interactif
import matplotlib.pyplot as plt
from werkzeug.utils import secure_filename
import os
import shutil
import json
import importlib
from sklearn.preprocessing import (
    MinMaxScaler,
    StandardScaler,
    RobustScaler,
    MaxAbsScaler,
)
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import VarianceThreshold, SelectKBest, f_classif
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder
from sklearn.decomposition import PCA
from sklearn.preprocessing import PowerTransformer
import seaborn as sns
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(
    app,
    resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Content-Type",
                "Authorization",
                "Access-Control-Allow-Credentials",
            ],
            "supports_credentials": True,
        },
        r"/project": {
            "origins": ["http://localhost:5173"],
            "methods": ["POST"],
            "allow_headers": ["Content-Type"],
            "supports_credentials": True,
        },
    },
    origins=["http://localhost:5173"],
)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "static", "projects")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max file size

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your_secret_key"
db = SQLAlchemy(app)


path_wkhtmltopdf = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(150), nullable=False)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

    def __repr__(self):
        return f"User('{self.username}')"


ALLOWED_EXTENSIONS = {"csv", "xlsx", "json"}
params_cache = {}
algorithm_parameters_cache = {}
with app.app_context():
    db.create_all()

@app.route("/admin/users", methods=["GET"])
def get_all_users():
    users = User.query.all()
    result = [
        {
            "id": user.id,
            "fullname": user.fullname,
            "username": user.username,
            "password" : user.password,
        }
        for user in users
    ]
    return jsonify({"users": result}), 200

@app.route("/admin/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found", "status": "error"}), 404
    print(data)
    user.fullname = data.get("fullname", user.fullname)
    user.username = data.get("username", user.username)

    if "password" in data and data["password"]:
        user.password = generate_password_hash(data["password"], method="pbkdf2:sha256")

    db.session.commit()

    return jsonify({"message": "User updated successfully", "status": "success"}), 200


# Route: Supprimer un utilisateur par ID
@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found", "status": "error"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted successfully", "status": "success"}), 200
    
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def preview(filename) :
    df = pd.read_csv(filename)
    preview = {
        "columns": df.columns.tolist(),
        "data": df.head(5).values.tolist(),
    }
    return preview

@app.route("/preview_custom", methods=["POST"])
def upload_dataset_preview():
    if "dataset" not in request.files:
        return jsonify({"error": "Fichier manquant"}), 400

    file = request.files["dataset"]

    if file.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400

    # Sauvegarder le fichier temporairement
    project_folder = os.path.join(UPLOAD_FOLDER, "temp")
    os.makedirs(project_folder, exist_ok=True)
    file_path = os.path.join(project_folder, file.filename)
    file.save(file_path)

    try:
        # Lire le CSV en DataFrame
        df = pd.read_csv(file_path)

        # Facultatif : supprimer le fichier après lecture (sécurité/disk space)
        os.remove(file_path)

        # Retourner l'aperçu
        preview = {
            "columns": df.columns.tolist(),
            "data": df.head(5).values.tolist(),
        }
        return jsonify({"preview": preview}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Routes API pour la prévisualisation des datasets
@app.route("/api/dataset_preview", methods=["GET"])
def dataset_preview():
    dataset_name = request.args.get("dataset")
    if not dataset_name:
        return jsonify({"error": "Nom du dataset manquant"}), 400

    try:
        # Charger le dataset prédéfini
        dataset_loaders = {
            "load_iris": datasets.load_iris,
            "load_digits": datasets.load_digits,
            "load_diabetes": datasets.load_diabetes,
            "load_breast_cancer": datasets.load_breast_cancer,
        }

        if dataset_name in dataset_loaders:
            data = dataset_loaders[dataset_name]()

            # Convertir en DataFrame pandas
            if hasattr(data, "feature_names"):
                df = pd.DataFrame(data.data, columns=data.feature_names)
            else:
                df = pd.DataFrame(data.data)
            df["target"] = data.target

            # Préparer les données pour l'aperçu (5 premières lignes)
            preview_data = {
                "columns": df.columns.tolist(),
                "data": df.head(5).values.tolist(),
            }

            return jsonify(preview_data)
        else:

            return jsonify({"error": "Dataset non reconnu"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate_preview", methods=["POST"])
def generate_preview():
    data = request.json
    if not data or "algorithm" not in data:
        return jsonify({"error": "Données manquantes"}), 400

    algorithm = data.get("algorithm")
    params = data.get("params", {})

    try:
        # Mapper les noms d'algorithmes aux fonctions correspondantes
        dataset_generators = {
            "make_blobs": make_blobs,
            "make_moons": make_moons,
            "make_circles": make_circles,
            "make_classification": make_classification,
            "make_regression": make_regression,
        }

        if algorithm in dataset_generators:
            # Générer les données avec les paramètres fournis
            X, y = dataset_generators[algorithm](**params)

            # Créer un DataFrame avec les données générées
            feature_names = [f"feature_{i}" for i in range(X.shape[1])]
            df = pd.DataFrame(X, columns=feature_names)
            df["target"] = y

            # Préparer les données pour l'aperçu (5 premières lignes)
            preview_data = {
                "columns": df.columns.tolist(),
                "data": df.head(5).values.tolist(),
            }

            return jsonify(preview_data)
        else:
            return jsonify({"error": "Algorithme non reconnu"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")


    # Check if user exists in the database
    if username == 'admin' and password == 'admin' :
            return (
            jsonify(
                {
                    "message": f"Hello {username}",
                    "status": "sucess",
                }
            ),
            200,
        ) 
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password): # Redirect to a protected route
        session["user_id"] = user.username
        flash("Login successful!", "success")
        return (
            jsonify(
                {
                    "message": f"User {user.username} logged in successfully",
                    "status": "sucess",
                }
            ),
            200,
        )  # Redirect to a protected route
    else:
        flash("Invalid username or password", "danger")
        return (
            jsonify({"message": "Invalid username or password", "status": "error"}),
            401,
        )

@app.route('/logout', methods=['POST'])
def logout():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401 
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route("/project/<string:name>", methods=["POST","GET"])
def project_details(name):
    # Vérifier si l'utilisateur est connecté
    project_name = name
    if "user_id" not in session:
        flash("Veuillez vous connecter pour accéder aux détails du projet.", "warning")
        return jsonify({"success": False,"error": "Veuillez vous connecter."}), 401

    user_id = session["user_id"]
    UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]

    # Chemin vers le dossier du projet
    user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")
    project_path = os.path.join(user_folder, project_name)

    if not os.path.exists(project_path):
        flash("Projet non trouvé.", "error")
        return jsonify({"success": False,"error": "Projet non trouvé."}), 404

    # Récupérer les informations du projet
    project_info = {"name": project_name}

    # Récupérer le dataset
    datasets_folder = os.path.join(project_path, "datasets")
    if os.path.exists(datasets_folder):
        dataset_files = [f for f in os.listdir(datasets_folder) if f.endswith(".csv")]
        if dataset_files:
            project_info["dataset"] = dataset_files[0]

    # Récupérer le modèle et ses paramètres
    if os.path.exists(os.path.join(project_path, "error_curve")):
        project_info["type"] = "regression"
    elif os.path.exists(os.path.join(project_path, "classification_clusters")):
        project_info["type"] = "classification"
    elif os.path.exists(os.path.join(project_path, "preprocessing_viz")):
        project_info["type"] = "preprocessing"
    else:
        project_info["type"] = "clustering"
    if project_info["type"] != 'preprocessing':
        models_folder = os.path.join(project_path, "models")
        if os.path.exists(models_folder):
            model_files = [f for f in os.listdir(models_folder) if f.endswith("_model.pkl")]
            if model_files:
                project_info["algo"] = model_files[0].replace("_model.pkl", "")
                params_folder = os.path.join(
                    UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
                )
                filename = project_info["dataset"]
                algo = project_info["algo"]
                params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
                params_path = os.path.join(params_folder, params_filename)
                params = jb.load(params_path)
                project_info["params"] = params

    # Récupérer les visualisations
    if os.path.exists(os.path.join(project_path, "classification_clusters")):
        clusters_folder = os.path.join(project_path, "classification_clusters")
        clusters = [
            f for f in os.listdir(clusters_folder) if f.endswith("_clusters.png")
        ]
        if clusters:
            project_info["clusters"] = f"/backend/static/projects/user_{user_id}/{project_name}/classification_clusters/{clusters[0]}"
    elif os.path.exists(os.path.join(project_path, "error_curve")):
        error_curve_folder = os.path.join(project_path, "error_curve")
        error_curves = [
            f for f in os.listdir(error_curve_folder) if f.endswith("_error_curve.png")
        ]
        if error_curves:
            project_info["error_curve"] = f"/backend/static/projects/user_{user_id}/{project_name}/error_curve/{error_curves[0]}"
    elif os.path.exists(os.path.join(project_path, "unsupervised_clusters")):
        clusters_folder = os.path.join(project_path, "unsupervised_clusters")
        clusters = [
            f
            for f in os.listdir(clusters_folder)
            if f.endswith("_unsupervised_clusters.png")
        ]
        if clusters:
            project_info["clusters"] = f"/backend/static/projects/user_{user_id}/{project_name}/unsupervised_clusters/{clusters[0]}"
    elif os.path.exists(os.path.join(project_path, "preprocessing_viz")):
        viz_folder = os.path.join(project_path, "preprocessing_viz")
        viz_files = [f for f in os.listdir(viz_folder) if f.endswith(".png")]
        if viz_files:
            project_info["preprocessing_viz"] = f"/backend/static/projects/user_{user_id}/{project_name}/preprocessing_viz/{viz_files[0]}"
    # Déterminer le type de projet
    
    serialized_project_info = convert_to_serializable(project_info)

    try:
        json.dumps(serialized_project_info)
    except TypeError as e:
        print(f"Error: {e}")
        print(f"Object: {serialized_project_info}")
        return jsonify({"success": False,"error": "Erreur de sérialisation."}), 500
    return jsonify(
        {
            "success": True,
            "project_info": serialized_project_info,
        }
    )


@app.route("/dashboard")
def dashboard():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour accéder au tableau de bord.", "warning")
        return jsonify({"success": False,"error": "Veuillez vous connecter."}), 401

    user_id = session["user_id"]
    projects = []
    UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]

    # Chemin vers le dossier de l'utilisateur
    user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")

    # Vérifier si le dossier de l'utilisateur existe
    if not os.path.exists(user_folder):
        return jsonify({"success": False,"error": "Aucun projet trouvé."}), 404

    # Parcourir tous les dossiers de projets de l'utilisateur
    count_projects = 0
    for project_name in os.listdir(user_folder):
        count_projects += 1
        project_path = os.path.join(user_folder, project_name)
        if os.path.isdir(project_path):
            creation_time = os.path.getctime(project_path)
            formatted_time = datetime.fromtimestamp(creation_time).strftime("%Y-%m-%d %H:%M")
            project_info = {"name": project_name}
            project_info["created"] = formatted_time
            project_info["id"] = count_projects
            # Récupérer le dataset
            datasets_folder = os.path.join(project_path, "datasets")
            if os.path.exists(datasets_folder):
                dataset_files = [
                    f for f in os.listdir(datasets_folder) if f.endswith(".csv")
                ]
                if dataset_files:
                    project_info["dataset"] = dataset_files[0]

            # Récupérer le modèle
            models_folder = os.path.join(project_path, "models")
            if os.path.exists(models_folder):
                model_files = [
                    f for f in os.listdir(models_folder) if f.endswith("_model.pkl")
                ]
                if model_files:
                    project_info["algo"] = model_files[0].replace("_model.pkl", "")

            # Récupérer la courbe d'erreur ou les clusters ou les visualisations de prétraitement
            if os.path.exists(os.path.join(project_path, "classification_clusters")):
                clusters_folder = os.path.join(project_path, "classification_clusters")
                clusters = [
                    f
                    for f in os.listdir(clusters_folder)
                    if f.endswith("_clusters.png")
                ]
                if clusters:
                    project_info["classification"] = url_for(
                        "static",
                        filename=f"projects/user_{user_id}/{project_name}/classification_clusters/{clusters[0]}",
                    )
            elif os.path.exists(os.path.join(project_path, "error_curve")):
                error_curve_folder = os.path.join(project_path, "error_curve")
                error_curves = [
                    f
                    for f in os.listdir(error_curve_folder)
                    if f.endswith("_error_curve.png")
                ]
                if error_curves:
                    project_info["error_curve"] = url_for(
                        "static",
                        filename=f"projects/user_{user_id}/{project_name}/error_curve/{error_curves[0]}",
                    )
            elif os.path.exists(os.path.join(project_path, "unsupervised_clusters")):
                clusters_folder = os.path.join(project_path, "unsupervised_clusters")
                clusters = [
                    f
                    for f in os.listdir(clusters_folder)
                    if f.endswith("_unsupervised_clusters.png")
                ]
                if clusters:
                    project_info["clusters"] = url_for(
                        "static",
                        filename=f"projects/user_{user_id}/{project_name}/unsupervised_clusters/{clusters[0]}",
                    )
            elif os.path.exists(os.path.join(project_path, "preprocessing_viz")):
                viz_folder = os.path.join(project_path, "preprocessing_viz")
                viz_files = [f for f in os.listdir(viz_folder) if f.endswith(".png")]
                if viz_files:
                    project_info["preprocessing_viz"] = url_for(
                        "static",
                        filename=f"projects/user_{user_id}/{project_name}/preprocessing_viz/{viz_files[0]}",
                    )

            # Récupérer les paramètres du modèle
            if project_info.get("error_curve"):
                project_info["type"] = "regression"
            elif project_info.get("classification"):
                project_info["type"] = "classification"
            elif project_info.get("preprocessing_viz"):
                project_info["type"] = "preprocessing"
            else:
                project_info["type"] = "clustering"
            if project_info.get("type") != "preprocessing":
                algo = project_info.get("algo","")
                model_type = project_info.get("type", "")
                print("---------------------------")
                print("type",model_type)
                filename = project_info["dataset"]
                if model_type != "preprocessing":
                    params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
                    params_file = os.path.join(project_path, "params", params_filename)
                    params = jb.load(params_file)
                    project_info["params"] = params
                    metrics = params.get("metrics", {})
                    if model_type == "regression":
                        project_info["mse"] = metrics.get("mse", 0)
                    elif model_type == "classification":
                        project_info["accuracy"] = metrics.get("accuracy", 0)
                    elif model_type == "clustering":
                        project_info["silhouette_score"] = metrics.get("silhouette_score", 0)
            projects.append(project_info)
    
    serialized_projects = convert_to_serializable(projects)
    try:
        json.dumps(serialized_projects)
    except TypeError as e:
        print("Élément non sérialisable :", e)
    return jsonify(
        {"success": True, "projects": serialized_projects, "user_id": user_id}
    )


@app.route("/register", methods=["GET", "POST"])
def register():
    data = request.get_json()
    fullname = data.get("fullname")
    username = data.get("username")
    password = data.get("password")

    # Check if username already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        flash("Username already taken. Choose another one.", "warning")
        return (
            jsonify(
                {
                    "message": "Username already taken. Choose another one.",
                    "status": "error",
                }
            ),
            400,
        )

    # Hash the password before storing it
    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")

    # Create a new user instance
    new_user = User(fullname=fullname, username=username, password=hashed_password)

    # Add and commit user to the database
    db.session.add(new_user)
    db.session.commit()

    flash("Registration successful! Please log in.", "success")
    return (
        jsonify(
            {"message": "Registration successful! Please log in.", "status": "success"}
        ),
        200,
    )


@app.route("/project", methods=["GET", "POST"])
def upload():
    try:
        # Authentication check
        if "user_id" not in session:
            return (
                jsonify(
                    {"status": "error", "message": "Please login to create a project."}
                ),
                401,
            )

        user_id = session["user_id"]

        # Get all form data from React template
        # Handle both FormData and JSON requests
        if request.content_type and "multipart/form-data" in request.content_type:
            # FormData submission
            learning_type = request.form.get("learning_type")
            project_name = request.form.get("project_name")
            dataset_type = request.form.get("dataset_type")
            predefined_dataset = request.form.get("predefined_dataset")
            generation_algorithm = request.form.get(
                "create_algorithm"
            )  # Frontend uses create_algorithm
            enable_preprocessing = request.form.get("preprocessing") == "true"

            # Get preprocessing options as list
            preprocessing_options = request.form.getlist("preprocessing_options[]")
        else:
            # JSON submission
            data = request.get_json()
            if data:
                learning_type = data.get("learning_type")
                project_name = data.get("project_name")
                dataset_type = data.get("dataset_type")
                predefined_dataset = data.get("predefined_dataset")
                generation_algorithm = data.get("generation_algorithm") or data.get(
                    "create_algorithm"
                )
                enable_preprocessing = data.get("preprocessing")
                preprocessing_options = data.get("preprocessing_options", [])
            else:
                return jsonify({"status": "error", "message": "No data received."}), 400

        # Validate required fields
        if not project_name:
            return (
                jsonify({"status": "error", "message": "Please enter a project name."}),
                400,
            )

        # Create project directory structure
        UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
        user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")
        project_folder = os.path.join(user_folder, project_name)

        os.makedirs(user_folder, exist_ok=True)

        if os.path.exists(project_folder):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "A project with this name already exists.",
                    }
                ),
                400,
            )

        os.makedirs(project_folder)
        os.makedirs(os.path.join(project_folder, "datasets"))

        # Handle different dataset types
        if dataset_type == "custom":
            if "dataset" not in request.files and "selectedFile" not in request.files:
                return jsonify({"status": "error", "message": "No file uploaded."}), 400

            # Check both possible field names from frontend
            file = request.files.get("dataset") or request.files.get("selectedFile")
            if not file or file.filename == "":
                return jsonify({"status": "error", "message": "No file selected."}), 400

            # Validate file extension
            if not allowed_file(file.filename):
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Only CSV, Excel, and JSON files are supported.",
                        }
                    ),
                    400,
                )

            # Save and process file
            filename = secure_filename(f"{file.filename}")
            file_path = os.path.join(project_folder, "datasets", filename)
            file.save(file_path)

            try:
                # Read file based on extension
                if file.filename.endswith(".csv"):
                    df = pd.read_csv(file_path)
                elif file.filename.endswith(".xlsx"):
                    df = pd.read_excel(file_path)
                elif file.filename.endswith(".json"):
                    df = pd.read_json(file_path)

                if df.empty:
                    os.remove(file_path)
                    return (
                        jsonify(
                            {
                                "status": "error",
                                "message": "The uploaded file is empty.",
                            }
                        ),
                        400,
                    )

                # Get preview data for response
                preview_data = {
                    "columns": df.columns.tolist(),
                    "data": df.head().values.tolist(),
                }

                # Store information in session for select_type route
                session["filename"] = filename
                session["project_name"] = project_name
                session["learning_type"] = learning_type
                session["user_id"] = user_id
                

            except Exception as e:
                if os.path.exists(file_path):
                    os.remove(file_path)
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Error processing file: {str(e)}",
                        }
                    ),
                    500,
                )

        elif dataset_type == "predefined":
            if not predefined_dataset:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Please select a predefined dataset.",
                        }
                    ),
                    400,
                )

            # Load predefined dataset from sklearn

            dataset_loader = {
                "load_iris": datasets.load_iris,
                "load_digits": datasets.load_digits,
                "load_diabetes": datasets.load_diabetes,
                "load_breast_cancer": datasets.load_breast_cancer,
            }.get(predefined_dataset)

            if not dataset_loader:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Invalid predefined dataset selected.",
                        }
                    ),
                    400,
                )

            try:
                data = dataset_loader()
                df = pd.DataFrame(data.data, columns=data.feature_names)
                df["target"] = data.target

                filename = f"{predefined_dataset}.csv"
                file_path = os.path.join(project_folder, "datasets", filename)
                df.to_csv(file_path, index=False)

                preview_data = {
                    "columns": df.columns.tolist(),
                    "data": df.head().values.tolist(),
                }

                # Store information in session for select_type route
                session["filename"] = filename
                session["project_name"] = project_name
                session["learning_type"] = learning_type

                

            except Exception as e:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Error loading dataset: {str(e)}",
                        }
                    ),
                    500,
                )

        elif dataset_type == "create":
            if not generation_algorithm:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Please select a generation algorithm.",
                        }
                    ),
                    400,
                )

            # Get algorithm parameters
            algorithm_params = {}
            for key in request.form:
                if key.startswith("param_"):
                    param_name = key[6:]
                    try:
                        algorithm_params[param_name] = float(request.form[key])
                    except ValueError:
                        return (
                            jsonify(
                                {
                                    "status": "error",
                                    "message": f"Invalid parameter value for {param_name}",
                                }
                            ),
                            400,
                        )

            # Generate synthetic dataset
            generators = {
                "make_blobs": make_blobs,
                "make_moons": make_moons,
                "make_circles": make_circles,
                "make_classification": make_classification,
                "make_regression": make_regression,
            }

            if not generators.get(generation_algorithm):
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Invalid generation algorithm selected.",
                        }
                    ),
                    400,
                )

            try:
                # Generate data
                if generation_algorithm in [
                    "make_blobs",
                    "make_moons",
                    "make_circles",
                    "make_classification",
                ]:
                    algorithm_params = {
                        k: int(v) if isinstance(v, float) and v.is_integer() else v
                        for k, v in algorithm_params.items()
                    }
                    X, y = generators[generation_algorithm](**algorithm_params)
                    df = pd.DataFrame(X)
                    df["target"] = y
                elif generation_algorithm == "make_regression":
                    X, y = generators[generation_algorithm](**algorithm_params)
                    df = pd.DataFrame(X)
                    df["target"] = y

                filename = f"{generation_algorithm}_generated.csv"
                file_path = os.path.join(project_folder, "datasets", filename)
                df.to_csv(file_path, index=False)

                preview_data = {
                    "columns": df.columns.tolist(),
                    "data": df.head().values.tolist(),
                }

                # Store information in session for select_type route
                session["filename"] = filename
                session["project_name"] = project_name
                session["learning_type"] = learning_type

            except Exception as e:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Error generating dataset: {str(e)}",
                        }
                    ),
                    500,
                )
        else:
            return (
                jsonify(
                    {"status": "error", "message": "Invalid dataset type selected."}
                ),
                400,
            )
        if learning_type == "preprocessing":
            redirect = "/preprocessing/methods"
        else :
            redirect = "/select_type"
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "File uploaded successfully!",
                    "preview": preview_data,
                    "filename": filename,
                    "redirect": redirect,
                }
            ),
            200,
        )
        

    except Exception as e:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"An unexpected error occurred: {str(e)}",
                }
            ),
            500,
        )


@app.route("/get_algorithm_doc", methods=["GET"])
def get_algorithm_doc():
    algorithm_name = request.args.get("algorithm")
    if not algorithm_name:
        return jsonify({"error": "Nom d'algorithme manquant"}), 400

    try:
        # Mapper les noms d'algorithmes aux modules et classes correspondants dans scikit-learn
        algorithm_mapping = {
            # Classification
            "Logistic Regression": ("sklearn.linear_model", "LogisticRegression"),
            "SVC": ("sklearn.svm", "SVC"),
            "Decision Tree Classifier": ("sklearn.tree", "DecisionTreeClassifier"),
            "Random Forest Classifier": ("sklearn.ensemble", "RandomForestClassifier"),
            "Gradient Boosting Classifier": (
                "sklearn.ensemble",
                "GradientBoostingClassifier",
            ),
            "KNeighbors Classifier": ("sklearn.neighbors", "KNeighborsClassifier"),
            "Quadratic Discriminant Analysis": (
                "sklearn.discriminant_analysis",
                "QuadraticDiscriminantAnalysis",
            ),
            "Linear Discriminant Analysis": (
                "sklearn.discriminant_analysis",
                "LinearDiscriminantAnalysis",
            ),
            "AdaBoost Classifier": ("sklearn.ensemble", "AdaBoostClassifier"),
            "Bagging Classifier": ("sklearn.ensemble", "BaggingClassifier"),
            "Gaussian NB": ("sklearn.naive_bayes", "GaussianNB"),
            "MLP Classifier": ("sklearn.neural_network", "MLPClassifier"),
            # Regression
            "Linear Regression": ("sklearn.linear_model", "LinearRegression"),
            "SVR": ("sklearn.svm", "SVR"),
            "Decision Tree Regressor": ("sklearn.tree", "DecisionTreeRegressor"),
            "Ridge": ("sklearn.linear_model", "Ridge"),
            "Lasso": ("sklearn.linear_model", "Lasso"),
            "Elastic Net": ("sklearn.linear_model", "ElasticNet"),
            "Random Forest Regressor": ("sklearn.ensemble", "RandomForestRegressor"),
            "Gradient Boosting Regressor": (
                "sklearn.ensemble",
                "GradientBoostingRegressor",
            ),
            "AdaBoost Regressor": ("sklearn.ensemble", "AdaBoostRegressor"),
            "Bagging Regressor": ("sklearn.ensemble", "BaggingRegressor"),
            "Random Trees Embedding": ("sklearn.ensemble", "RandomTreesEmbedding"),
            "MLP Regressor": ("sklearn.neural_network", "MLPRegressor"),
            # Clustering
            "KMeans": ("sklearn.cluster", "KMeans"),
            "DBSCAN": ("sklearn.cluster", "DBSCAN"),
            "OPTICS": ("sklearn.cluster", "OPTICS"),
            "Agglomerative": ("sklearn.cluster", "AgglomerativeClustering"),
            "BIRCH": ("sklearn.cluster", "Birch"),
            "GMM": ("sklearn.mixture", "GaussianMixture"),
            "Spectral Clustering": ("sklearn.cluster", "SpectralClustering"),
        }

        if algorithm_name not in algorithm_mapping:
            return jsonify({"error": "Algorithme non reconnu"}), 400

        module_name, class_name = algorithm_mapping[algorithm_name]
        module = importlib.import_module(module_name)
        algorithm_class = getattr(module, class_name)

        # Récupérer la documentation de l'algorithme
        doc = algorithm_class.__doc__

        # Créer une instance de l'algorithme pour obtenir les paramètres par défaut
        algorithm_instance = algorithm_class()

        # Extraire les paramètres à partir de __dict__
        params = []
        for key, value in algorithm_instance.__dict__.items():
            # Ignorer les attributs privés et les attributs spéciaux
            if not key.startswith("_"):
                param_desc = f"{key} (valeur par défaut: {value})"
                params.append(param_desc)

        # Obtenir les paramètres à partir de la signature de l'initialisation
        import inspect

        signature = inspect.signature(algorithm_class.__init__)
        for param_name, param in signature.parameters.items():
            # Ignorer self et les paramètres déjà trouvés dans __dict__
            if param_name != "self" and not any(param_name in p for p in params):
                default_value = (
                    param.default
                    if param.default is not inspect.Parameter.empty
                    else "None"
                )
                param_desc = f"{param_name} (valeur par défaut: {default_value})"
                params.append(param_desc)

        # Créer une description courte à partir de la documentation
        short_desc = ""
        if doc:
            # Extraire la première phrase ou le premier paragraphe
            lines = doc.strip().split("\n")
            short_desc = lines[0].strip()
            # Si la première ligne est trop courte, ajouter quelques lignes de plus
            if len(short_desc) < 50 and len(lines) > 1:
                for line in lines[1:5]:  # Prendre jusqu'à 4 lignes supplémentaires
                    if (
                        line.strip()
                        and not line.strip().startswith("Parameters")
                        and not line.strip().startswith("---")
                    ):
                        short_desc += " " + line.strip()
                    if len(short_desc) > 100:  # Limiter la longueur
                        break
        return jsonify(
            {"doc": doc, "parameters": params, "short_description": short_desc}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/select_type", methods=["GET", "POST"])
def select_type():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        if request.is_json:
            return jsonify({"error": "Unauthorized"}), 401
        flash("Veuillez vous connecter pour sélectionner un type de modèle.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]

    # Récupérer le type d'apprentissage depuis la session
    learning_type = session.get("learning_type", "supervised")
    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
            model_type = data.get("model_type")
            algo = data.get("algo")
            algorithm_parameters = data.get("algorithm_parameters", "{}")
        else:
            model_type = request.form.get("model_type")
            algo = request.form.get("algo")
            algorithm_parameters = request.form.get("algorithm_parameters", "{}")
        session["algo"] = algo
        session["model_type"] = model_type
        filename = session.get("filename")
        project_name = session.get("project_name")
        if not model_type:
            if request.is_json:
                return (
                    jsonify({"error": "Veuillez sélectionner un type de modèle."}),
                    400,
                )
            flash("Veuillez sélectionner un type de modèle.", "error")
            return redirect(request.url)

        try:
            algorithm_parameters_dict = json.loads(algorithm_parameters)
            algorithm_parameters_raw = algorithm_parameters_dict.get("parameters", {})
            params_filename = (
                f"{project_name}_{filename}_{algo}_algorithm_parameters.pkl"
            )
            params_folder = os.path.join(
                UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
            )
            os.makedirs(params_folder, exist_ok=True)
            params_path = os.path.join(params_folder, params_filename)
            jb.dump(algorithm_parameters_raw, params_path)
            session["algorithm_params_path"] = params_path
        except json.JSONDecodeError:
            session["algorithm_parameters"] = {}
            algorithm_parameters_cache[algo] = {}
        if request.is_json:
            return jsonify({"success": True, "redirect": url_for("select_features")})


@app.route("/select_features", methods=["GET", "POST"])
def select_features():
    # Authentication check
    if "user_id" not in session:
        if request.is_json or request.method == "POST":
            return jsonify({"error": "Unauthorized"}), 401
        flash(
            "Veuillez vous connecter pour sélectionner des caractéristiques.", "warning"
        )
        return redirect(url_for("login"))

    user_id = session["user_id"]
    learning_type = session.get("learning_type", "supervised")
    filename = session.get("filename")
    project_name = session.get("project_name")
    model_type = session.get("model_type")
    algo = session.get("algo")

    user_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], f"user_{user_id}")
    filepath = os.path.join(user_folder, project_name, "datasets", filename)
    data = pd.read_csv(filepath)
    numeric_data = data.select_dtypes(include=["number"])
    if learning_type == "supervised":
        algo_class = supervised_models.ALGORITHMS[algo]
    else:
        algo_class = unsupervised_models.ALGORITHMS[algo]
    algo_class = algo_class()
    algorithm_parameters = session.get("algorithm_parameters", {})
    params_dict = algo_class.get_params()
    session["params_dict"] = params_dict

    if request.method == "GET":
        # Support JSON GET for React frontend
        if request.is_json or request.headers.get("Content-Type") == "application/json":
            features = data.columns.tolist()
            stats = numeric_data.describe().transpose().to_dict(orient="index")
            return jsonify(
                {
                    "model_info": {
                        "filename": filename,
                        "project_name": project_name,
                        "model_type": model_type,
                        "algo": algo,
                        "learning_type": learning_type,
                    },
                    "features": features,
                    "stats": stats,
                    "model_type": model_type,
                    "algo": algo,
                    "learning_type": learning_type,
                }
            )
        # Fallback to template rendering for legacy
        features = data.columns.tolist()
        stats = numeric_data.describe().transpose()
        stats_dict = stats.to_dict(orient="index")
        return jsonify(
            {
                "features": features,
                "stats": stats,
                "model_type": model_type,
                "algo": algo,
                "learning_type": learning_type,
            }
        )

    if request.method == "POST":
        # Support JSON POST for React frontend
        if request.is_json or request.headers.get("Content-Type") == "application/json":
            data_json = request.get_json()
            selected_features = (
                data_json.get("selected_features", "").split(",")
                if isinstance(data_json.get("selected_features", ""), str)
                else data_json.get("selected_features", [])
            )
            session["selected_features"] = selected_features
            if learning_type == "supervised":
                target_feature = data_json.get("target_feature")
                if target_feature and target_feature in selected_features:
                    selected_features.remove(target_feature)
                session["target_feature"] = target_feature
                session["selected_features"] = selected_features
                if not target_feature:
                    return (
                        jsonify(
                            {"error": "Veuillez sélectionner une fonctionnalité cible."}
                        ),
                        400,
                    )
                return jsonify({"success": True, "redirect": "/train_model"})
            else:
                return jsonify({"success": True, "redirect": url_for("train_model")})
        # Fallback to form POST for legacy
        selected_features = request.form.get("selected_features", "").split(",")
        session["selected_features"] = selected_features
        if learning_type == "supervised":
            target_feature = request.form.get("target_feature")
            if target_feature and target_feature in selected_features:
                selected_features.remove(target_feature)
            session["target_feature"] = target_feature
            session["selected_features"] = selected_features
            if not target_feature:
                flash("Veuillez sélectionner une fonctionnalité cible.", "error")
                return redirect(request.url)
            return redirect(url_for("train_model"))
        else:
            return redirect(url_for("train_model"))


def convert_to_serializable(obj):
    if isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient="records")
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, list):
        return [convert_to_serializable(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    else:
        return str(obj)  # Dernier recours pour éviter les erreurs


def to_native(val):
    """Convertit les types NumPy vers des types natifs Python."""
    if isinstance(val, (np.integer, np.int64, np.int32)):
        return int(val)
    elif isinstance(val, (np.floating, np.float64, np.float32)):
        return float(val)
    elif isinstance(val, np.ndarray):
        return val.tolist()
    else:
        return val
@app.route("/train_model", methods=["GET"])
def train_model():
    # Authentication check
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Authentication required."}), 401

    user_id = session["user_id"]
    learning_type = session.get("learning_type", "supervised")
    algo = session.get("algo")
    model_type = session.get("model_type")
    project_name = session.get("project_name")
    filename = session.get("filename")
    user_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], f"user_{user_id}")
    project_folder = os.path.join(user_folder, project_name, "datasets")
    filepath = os.path.join(project_folder, filename)
    selected_features = session.get("selected_features")
    algorithm_params_path = session.get("algorithm_params_path")
    preprocessing_enabled = session.get("preprocessing_enabled", False)
    preprocessing_options = session.get("preprocessing_options", [])

    # Validate required session data
    missing = []
    for key in [
        "algo",
        "model_type",
        "project_name",
        "filename",
        "selected_features",
        "algorithm_params_path",
    ]:
        if not session.get(key):
            missing.append(key)
    if missing:
        return (
            jsonify(
                {
                    "success": False,
                    "error": f"Missing session data: {', '.join(missing)}",
                }
            ),
            400,
        )

    try:
        algorithm_parameters = jb.load(algorithm_params_path)
        if learning_type == "supervised":
            target_feature = session.get("target_feature")
            if not target_feature:
                return (
                    jsonify(
                        {"success": False, "error": "Target feature not selected."}
                    ),
                    400,
                )
            md, params = supervised_models.model_train(
                filepath,
                algo,
                selected_features,
                target_feature=target_feature,
                algorithm_parameters=algorithm_parameters,
                preprocessing_enabled=preprocessing_enabled,
                preprocessing_options=preprocessing_options,
            )
            model_folder = os.path.join(user_folder, project_name, "models")
            os.makedirs(model_folder, exist_ok=True)
            model_path = os.path.join(model_folder, f"{algo}_model.pkl")
            jb.dump(md, model_path)
            params["model_path"] = model_path
            model = jb.load(model_path)
            params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
            params_folder = os.path.join(
                current_app.config["UPLOAD_FOLDER"],
                f"user_{user_id}",
                project_name,
                "params",
            )
            os.makedirs(params_folder, exist_ok=True)
            params_path = os.path.join(params_folder, params_filename)
            jb.dump(params, params_path)
            session["params_path"] = params_path
            X_test = params.get("X_test")
            if "X_train_columns" in params and params["X_train_columns"] is not None:
                X_test = pd.DataFrame(X_test, columns=params["X_train_columns"])
            predictions_serialize = model.predict(X_test)
            predictions = convert_to_serializable(predictions_serialize)
            print(type(predictions[0]))
            values = params.get("y_test",[])
            values = values.tolist() if isinstance(values, np.ndarray) else values
            predictions_values = [(to_native(p), to_native(v)) for p, v in zip(predictions, values)]
        else:
            md, params = unsupervised_models.model_train(
                filepath,
                algo,
                selected_features,
                algorithm_parameters=algorithm_parameters,
                preprocessing_enabled=preprocessing_enabled,
                preprocessing_options=preprocessing_options,
            )
            model_folder = os.path.join(user_folder, project_name, "models")
            os.makedirs(model_folder, exist_ok=True)
            model_path = os.path.join(model_folder, f"{algo}_model.pkl")
            jb.dump(md, model_path)
            params["model_path"] = model_path
            model = jb.load(model_path)
            params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
            params_folder = os.path.join(
                current_app.config["UPLOAD_FOLDER"],
                f"user_{user_id}",
                project_name,
                "params",
            )
            os.makedirs(params_folder, exist_ok=True)
            params_path = os.path.join(params_folder, params_filename)
            jb.dump(params, params_path)
            session["params_path"] = params_path
            X_scaled = params.get("X_scaled")
            if "X_train_columns" in params and params["X_train_columns"]:
                X_scaled = pd.DataFrame(X_scaled, columns=params["X_train_columns"])
            labels = params.get("labels", [])
            predictions = unsupervised_models.predict_cluster(
                model, X_scaled, X_scaled, labels
            )[:20]
            predictions_serialize = (
                predictions.tolist()
                if isinstance(predictions, np.ndarray)
                else predictions
            )
            predictions = convert_to_serializable(predictions_serialize)
            print(type(predictions[0]))
            values = labels[:20]
            values = values.tolist() if isinstance(values, np.ndarray) else values
            predictions_values = [(to_native(p), to_native(v)) for p, v in zip(predictions, values)]
    except ValueError as e:
        return jsonify({"success": False, "error": f"Training error: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Unexpected error: {str(e)}"}), 500

    model_info_raw = {
        "filename": filename,
        "project_name": project_name,
        "model_type": model_type,
        "algo": algo,
        "learning_type": learning_type,
        "features": selected_features,
        "predictions_values": predictions_values,
        "params_dict": algorithm_parameters,
        "preprocessing_options": preprocessing_options,
        "params_path": params_path
    }
    print("before")
    model_info = convert_to_serializable(model_info_raw)
    print(model_info.get('predictions_values'))
    print("after")
    session['model_info'] = model_info
    return jsonify(
        {
            "success": True,
            "model_info": model_info,
            "redirect": url_for("select_features"),
        }
    )


@app.route("/evaluate", methods=["GET", "POST"])
def evaluate():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour évaluer un modèle.", "warning")
        return jsonify({"success" : False ,"error": "Unauthorized"}), 401
    model_info = session.get("model_info", {})
    user_id = session["user_id"]
    project_name = model_info.get("project_name")
    algo = model_info.get("algo")
    filename = model_info.get("filename")
    learning_type = model_info.get("learning_type", "supervised")
    if not project_name or not filename:
        error = "Veuillez sélectionner un projet et un fichier CSV."
    elif not algo:
        error = "Veuillez sélectionner un algorithme."
    elif filename and algo and project_name:
        try:
            UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
            user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")
            filepath = os.path.join(user_folder, project_name, "datasets", filename)
            params_path = session.get("params_path")
            params = jb.load(params_path)
            if not os.path.exists(filepath):
                error = (
                    f"Le fichier {filename} n'existe pas dans le projet {project_name}."
                )
                return render_template("error.html", error=error)
            if not params:
                return redirect(url_for("train_model"))
            if learning_type == "supervised":
                params = supervised_models.model_evaluate(params)
            else:  # unsupervised
                params = unsupervised_models.model_evaluate(params)
            params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
            params_folder = os.path.join(
                UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
            )
            os.makedirs(params_folder, exist_ok=True)
            params_path = os.path.join(params_folder, params_filename)
            jb.dump(params, params_path)
            session["params_path"] = params_path
            metrics = params["metrics"]
            

            return jsonify({"success" : True, "metrics" : metrics, "model_info" : model_info})

        except ValueError as e:
            error = str(e)
        except Exception as e:
            error = f"Une erreur s'est produite: {str(e)}"

    return jsonify({"success": True, "error": error})



@app.route("/plot_results", methods=["POST", "GET"])
def plot_results():
    model_info = session.get("model_info", {})
    project_name = model_info.get("project_name")
    filename = model_info.get("filename")
    algo = model_info.get("algo")
    model_type = model_info.get("model_type")
    learning_type = model_info.get("learning_type", "supervised")
    predictions_values = model_info.get("predictions_values")
    params_dict = model_info.get("params_dict")
    preprocessing_options = model_info.get("preprocessing_options")
    params_path = model_info.get("params_path")
    params = jb.load(params_path)
    
    if not params:
        return jsonify({"success": False, "error": "No parameters found."}), 400
    if not project_name or not filename or not algo:
        return jsonify(
            {
                "success": False,
                "error": "Project name, filename, and algorithm are required.",
            }
        )

    # Initialize variables for interactive plot data
    plot_data = {}
    plot_title = ""

    if learning_type == "supervised":
        if model_type == "regression":
            # Load the model from disk if available
            model = None
            if "model_path" in params and os.path.exists(params["model_path"]):
                try:
                    model = jb.load(params["model_path"])
                except Exception as e:
                    return jsonify(
                        {
                            "success": False,
                            "error": f"Failed to load the model: {str(e)}",
                        }
                    )
            else:
                return jsonify(
                    {
                        "success": False,
                        "error": "Model not found. Please train the model first.",
                    }
                )

            # Prepare X_test for prediction

            X_test = params["X_test"]
            y_test = params["y_test"]
            # Save static image
            plt.figure(figsize=(4, 3))
            plt.plot(X_test,y_test, label="y_test", color="blue", marker="o")
            plt.plot(X_test,predictions_values, label="y_pred", color="red", marker="x")
            plt.title("Courbe de différence Y_TEST vs Y_PRED")
            plt.xlabel("X_test")
            plt.ylabel("y")
            plt.legend()
            plt.grid(True)

            # Enregistrer l'image dans le dossier du projet de l'utilisateur
            UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
            user_id = session["user_id"]
            image_filename = f"{filename}_{algo}_error_curve.png"
            project_folder = os.path.join(
                UPLOAD_FOLDER, f"user_{user_id}", project_name, "error_curve"
            )
            os.makedirs(project_folder, exist_ok=True)
            img_path = os.path.join(project_folder, image_filename)
            plt.savefig(img_path)
            plt.close()

            # URL for the static image
            img_path = url_for(
                "static",
                filename=f"projects/user_{user_id}/{project_name}/error_curve/{image_filename}",
            )

            # Prepare data for interactive plot
            plot_data = {
                "type": "regression",
                "y_test": (
                    params["y_test"]
                    if isinstance(params["y_test"], list)
                    else params["y_test"].tolist()
                ),
                "predictions": predictions_values,
                "title": "Courbe de différence Y_TEST vs Y_PRED",
                "xlabel": "x_test",
                "ylabel": "y_test vs predictions"
                
            }
            plot_title = "Regression Error Curve"

        else:  # Classification
            # Load the model from disk if available
            model = None

            # Prepare X_test for prediction
            X_test = params["X_test"]
            if "X_train_columns" in params and params["X_train_columns"] is not None:
                X_test = pd.DataFrame(X_test, columns=params["X_train_columns"])
            else:
                X_test = np.array(X_test) if isinstance(X_test, list) else X_test

            # Réduire la dimensionnalité à 2 dimensions pour une meilleure visualisation
            pca = PCA(n_components=2)
            print(X_test.shape)
            X_pca = pca.fit_transform(X_test)
            print(X_test.shape)
            # Prédictions des classes

            y_pred = [pred[0] for pred in predictions_values]

            print(y_pred)
            le = LabelEncoder()
            y_encoded = le.fit_transform(y_pred)

            # Create static image
            plt.figure(figsize=(4, 3))
            scatter = plt.scatter(
                X_pca[:, 0], X_pca[:, 1], c=y_encoded, cmap="viridis", marker="o"
            )
            plt.title("Clusters de Classification")
            plt.xlabel("PC1")
            plt.ylabel("PC2")

            # Ajouter une légende
            legend1 = plt.legend(*scatter.legend_elements(), title="Classes")
            plt.gca().add_artist(legend1)

            # Sauvegarde de l'image dans le dossier du projet de l'utilisateur
            UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
            user_id = session["user_id"]
            image_filename = f"{filename}_{algo}_clusters.png"
            project_folder = os.path.join(
                UPLOAD_FOLDER,
                f"user_{user_id}",
                project_name,
                "classification_clusters",
            )
            os.makedirs(project_folder, exist_ok=True)
            file_path = os.path.join(project_folder, image_filename)
            plt.savefig(file_path)  # Sauvegarde du graphique
            plt.close()

            # Lien relatif pour affichage
            img_path = url_for(
                "static",
                filename=f"projects/user_{user_id}/{project_name}/classification_clusters/{image_filename}",
            )

            # Prepare data for interactive plot
            plot_data = {
                "type": "classification",
                "x_pca_0": X_pca[:, 0].tolist(),
                "x_pca_1": X_pca[:, 1].tolist(),
                "labels": y_encoded.tolist(),
                "title": "Clusters de Classification",
                "xlabel": "PC1",
                "ylabel": "PC2",
            }
            plot_title = "Classification Clusters"

    else:  # Unsupervised learning
        # Load the model from disk if available
        model = None
        if "model_path" in params and os.path.exists(params["model_path"]):
            try:
                model = jb.load(params["model_path"])
            except Exception as e:
                return render_template(
                    "error.html", error=f"Error loading model: {str(e)}"
                )
        else:
            return jsonify(
                {
                    "success": False,
                    "error": "Model not found. Please train the model first.",
                }
            )

        X = params["X"]
        labels = params["labels"]

        # Réduire la dimensionnalité à 2 dimensions pour une meilleure visualisation
        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(X)

        # Create static image
        plt.figure(figsize=(4, 3))
        scatter = plt.scatter(
            X_pca[:, 0], X_pca[:, 1], c=labels, cmap="viridis", marker="o"
        )
        plt.title("Clusters Non Supervisés")
        plt.xlabel("PC1")
        plt.ylabel("PC2")

        # Ajouter une légende
        legend1 = plt.legend(*scatter.legend_elements(), title="Clusters")
        plt.gca().add_artist(legend1)

        # Sauvegarde de l'image dans le dossier du projet de l'utilisateur
        UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
        user_id = session["user_id"]
        image_filename = f"{filename}_{algo}_unsupervised_clusters.png"
        project_folder = os.path.join(
            UPLOAD_FOLDER, f"user_{user_id}", project_name, "unsupervised_clusters"
        )
        os.makedirs(project_folder, exist_ok=True)
        file_path = os.path.join(project_folder, image_filename)
        plt.savefig(file_path)
        plt.close()

        # Lien relatif pour affichage
        img_path = url_for(
            "static",
            filename=f"projects/user_{user_id}/{project_name}/unsupervised_clusters/{image_filename}",
        )

        # Prepare data for interactive plot
        plot_data = {
            "type": "clustering",
            "x_pca_0": X_pca[:, 0].tolist(),
            "x_pca_1": X_pca[:, 1].tolist(),
            "labels": labels.tolist() if hasattr(labels, "tolist") else labels,
            "title": "Clusters Non Supervisés",
            "xlabel": "PC1",
            "ylabel": "PC2",
        }
        plot_title = "Unsupervised Clusters"

    # Convert plot data to JSON for the template
    import json
    plot_data_json = json.dumps(plot_data)
    


    return jsonify(
        {
            "success": True,
            "plot_data": plot_data_json,
            "plot_title": plot_title,
            "img_path": img_path,
            "redirect_url" : "/plot_results"
        }
    )


@app.route("/delete/<string:name>", methods=["POST"])
def delete(name):
    project_name = name
    user_id = session["user_id"]
    if not project_name:
        flash("Nom du projet invalide.", "error")
        return jsonify({"success": False, "error": "Project name is required."}), 400

    UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
    project_folder = os.path.join(
        UPLOAD_FOLDER, f"user_{user_id}", secure_filename(project_name)
    )
    print(project_folder)
    print(f"user_{user_id}")
    if not project_folder.startswith(os.path.abspath(UPLOAD_FOLDER)):
        flash("Tentative de suppression non autorisée.", "error")
        return jsonify({"success": False, "error": "Unauthorized deletion attempt."}), 401
    if os.path.exists(project_folder):
        try:
            print(project_folder)
            shutil.rmtree(project_folder)
            flash(f"Projet '{project_name}' supprimé avec succès.", "success")
        except Exception as e:
            flash(f"Erreur lors de la suppression du projet : {str(e)}", "error")
    else:
        flash("Le projet n'existe pas.", "warning")

    return jsonify({"success": True, "redirect_url": "/dashboard"})


@app.route("/preprocessing/methods", methods=["GET", "POST"])
def preprocessing_methods():
    # Vérifier si l'utilisateur est connecté
    print("starting")
    print("user",session.get("user_id"))
    if "user_id" not in session:
        print("user not in session")
        flash("Veuillez vous connecter pour accéder au prétraitement.", "warning")
        return jsonify(
            {
                "success": False,
                "error": "Unauthorized",
                "redirect": "/",
            }
        )

    # Récupération des infos session
    print("hello")

    user_id = session.get("user_id")
    project_name = session.get("project_name")
    filename = session.get("filename")

    if not project_name or not filename:
        flash("Informations de projet manquantes. Veuillez recommencer.")
        return jsonify(
            {
                "success": False,
                "error": "Missing project information. Please start over.",
                "redirect": "/preprocessing",
            }
        )

    file_path = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        f"user_{user_id}",
        project_name,
        "datasets",
        filename,
    )
    print("hello")
    try:
        df = pd.read_csv(file_path)

        # Déterminer les types de colonnes
        column_types = [
            {
                "name": column,
                "type": "numeric" if pd.api.types.is_numeric_dtype(df[column]) else "categorical"
            }
            for column in df.columns
        ]
        print(column_types)
        return jsonify(
            {
                "success": True,
                "column_types": column_types,
                "redirect_url": "/preprocessing/methods",
            }
        )
    except Exception as e:
        flash(f"Erreur lors du chargement du dataset : {str(e)}")
        return jsonify(
            {
                "success": False,
                "error": f"Error loading dataset: {str(e)}",
                "redirect_url": "/preprocessing",
            }
        )


@app.route("/preprocessing/apply", methods=["POST","GET"])
def preprocessing_apply():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour accéder au prétraitement.", "warning")
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    # Récupérer les informations de la session et du formulaire
    user_id = session["user_id"]
    project_name = session.get("project_name")
    filename = session.get("filename")
    project_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], f"user_{user_id}", project_name)
    
    if not project_name or not filename:
        flash("Informations de projet manquantes. Veuillez recommencer.")
        return jsonify({"success": False, "error": "Project name or filename missing."}), 400
    if request.method == "POST": 
        data = request.get_json()
        print("data : ",data)
        preprocessing_methods = data.get("preprocessing_methods")
        print("prepros methods : ",preprocessing_methods)
    
        if not preprocessing_methods:
            flash("Veuillez sélectionner au moins une méthode de prétraitement.")
            return jsonify({"success": False, "error": "No preprocessing methods selected."}), 400
        user_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], f"user_{user_id}")
        file_path = os.path.join(user_folder, project_name, "datasets", filename)
        preprocessing_viz_folder = os.path.join(
            user_folder, project_name, "preprocessing_viz"
        )
        # Supprimer le dossier de visualisation si existant
        if os.path.exists(preprocessing_viz_folder):
            shutil.rmtree(preprocessing_viz_folder)
        os.makedirs(preprocessing_viz_folder, exist_ok=True)
        datasets_folder = os.path.join(user_folder, project_name, "datasets")

        try:
            df = pd.read_csv(file_path)
            print(df.shape)
            original_df = df.copy()
            applied_methods = []

            # 1. Normalisation
            if "normalization" in preprocessing_methods:
                norm_method = data.get("normalization_method")
                norm_columns = data.get("normalization_columns")
                if norm_columns:
                    if norm_method == "minmax":
                        scaler = MinMaxScaler()
                        df[norm_columns] = scaler.fit_transform(df[norm_columns])
                    elif norm_method == "robust":
                        scaler = RobustScaler()
                        df[norm_columns] = scaler.fit_transform(df[norm_columns])
                    elif norm_method == "maxabs":
                        scaler = MaxAbsScaler()
                        df[norm_columns] = scaler.fit_transform(df[norm_columns])

                    # Créer une visualisation avant/après
                    plt.figure(figsize=(14, 6))
                    plt.subplot(1, 2, 1)
                    plt.title("Before Normalization")
                    for col in norm_columns[:2]:
                        sns.kdeplot(original_df[col], label=col)
                    plt.legend()

                    # Après normalisation
                    plt.subplot(1, 2, 2)
                    plt.title("After Normalization")
                    for col in norm_columns[:2]:
                        sns.kdeplot(df[col], label=f"{col} normalisé")
                    plt.legend()

                    
                    viz_path = os.path.join(preprocessing_viz_folder, "normalization.png")
                    plt.tight_layout(pad=2.0)  # Augmenter l'espace entre les subplots
                    plt.savefig(
                        viz_path, bbox_inches="tight"
                    )  # Assurer que tout est visible
                    plt.close()
                    applied_methods.append(
                        {
                            "name": "Normalisation",
                            "params": {
                                "Method": norm_method,
                                "Columns": ", ".join(norm_columns),
                            },
                        }
                    )

            # 2. Standardisation
            if "standardization" in preprocessing_methods:
                std_columns = data.get("standardization_columns")

                if std_columns:
                    scaler = StandardScaler()
                    df[std_columns] = scaler.fit_transform(df[std_columns])

                    # Créer une visualisation avant/après
                    plt.figure(figsize=(14, 6))
                    plt.subplot(1, 2,1)
                    plt.title("Before standardization")
                    for col in std_columns[:2]:
                        sns.kdeplot(original_df[col], label=f"{col}")
                    plt.legend()
                    plt.subplot(1, 2,2)
                    plt.title("After standardization")
                    for col in std_columns[:2]:
                        sns.kdeplot(df[col], label=f"{col} standarized")
                    plt.legend()

                    viz_path = os.path.join(preprocessing_viz_folder, "standardization.png")
                    plt.tight_layout(pad=2.0)  # Augmenter l'espace entre les subplots
                    plt.savefig(
                        viz_path, bbox_inches="tight"
                    )  # Assurer que tout est visible
                    plt.close()

                    applied_methods.append(
                        {
                            "name": "Standardisation",
                            "params": {"Columns": ", ".join(std_columns)},
                        }
                    )

            # 3. Gestion des valeurs manquantes
            if "missing_values" in preprocessing_methods:
                missing_strategy = data.get("missing_values_strategy", "mean")
                missing_columns = data.get("missing_values_columns")
                constant_value = data.get("missing_values_constant_value", "0")

                if missing_columns:
                    if missing_strategy == "drop":
                        # Compter les lignes avant la suppression
                        rows_before = len(df)
                        df = df.dropna(subset=missing_columns)
                        rows_after = len(df)
                        rows_dropped = rows_before - rows_after

                        applied_methods.append(
                            {
                                "name": "Gestion des valeurs manquantes",
                                "params": {
                                    "Stratégie": "Suppression des lignes",
                                    "columns": ", ".join(missing_columns),
                                    "Lignes supprimées": str(rows_dropped),
                                },
                            }
                        )
                    else:
                        # Utiliser SimpleImputer pour les autres stratégies
                        if missing_strategy == "constant":
                            imputer = SimpleImputer(
                                strategy="constant", fill_value=constant_value
                            )
                            strategy_name = f"Valeur constante ({constant_value})"
                        else:
                            imputer = SimpleImputer(strategy=missing_strategy)
                            strategy_name = {
                                "mean": "Moyenne",
                                "median": "Médiane",
                                "most_frequent": "Valeur la plus fréquente",
                            }[missing_strategy]

                        df[missing_columns] = imputer.fit_transform(df[missing_columns])

                        applied_methods.append(
                            {
                                "name": "Gestion des valeurs manquantes",
                                "params": {
                                    "Stratégie": strategy_name,
                                    "columns": ", ".join(missing_columns),
                                },
                            }
                        )

            # 4. Détection et traitement des outliers
            if "outliers" in preprocessing_methods:
                outlier_method = data.get("outliers_method", "zscore")
                outlier_treatment = data.get("outliers_treatment", "remove")
                outlier_columns = data.get("outliers_columns")

                if outlier_columns:
                    outliers_detected = 0

                    for col in outlier_columns:
                        if outlier_method == "zscore":
                            # Z-score method
                            z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                            outliers_mask = z_scores > 3
                            outliers_detected += outliers_mask.sum()

                            if outlier_treatment == "remove":
                                df = df[~outliers_mask]
                            elif outlier_treatment == "cap":
                                # Capping
                                upper_limit = df[col].mean() + 3 * df[col].std()
                                lower_limit = df[col].mean() - 3 * df[col].std()
                                df[col] = df[col].clip(lower=lower_limit, upper=upper_limit)
                            elif outlier_treatment == "replace_mean":
                                df.loc[outliers_mask, col] = df[col].mean()
                            elif outlier_treatment == "replace_median":
                                df.loc[outliers_mask, col] = df[col].median()

                        elif outlier_method == "iqr":
                            # IQR method
                            Q1 = df[col].quantile(0.25)
                            Q3 = df[col].quantile(0.75)
                            IQR = Q3 - Q1
                            lower_bound = Q1 - 1.5 * IQR
                            upper_bound = Q3 + 1.5 * IQR
                            outliers_mask = (df[col] < lower_bound) | (
                                df[col] > upper_bound
                            )
                            outliers_detected += outliers_mask.sum()

                            if outlier_treatment == "remove":
                                df = df[~outliers_mask]
                            elif outlier_treatment == "cap":
                                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                            elif outlier_treatment == "replace_mean":
                                df.loc[outliers_mask, col] = df[col].mean()
                            elif outlier_treatment == "replace_median":
                                df.loc[outliers_mask, col] = df[col].median()

                        elif outlier_method == "isolation_forest":
                            # Isolation Forest
                            iso_forest = IsolationForest(
                                contamination=0.05, random_state=42
                            )
                            outliers_mask = iso_forest.fit_predict(df[[col]]) == -1
                            outliers_detected += outliers_mask.sum()

                            if outlier_treatment == "remove":
                                df = df[~outliers_mask]
                            elif outlier_treatment == "replace_mean":
                                df.loc[outliers_mask, col] = df[col].mean()
                            elif outlier_treatment == "replace_median":
                                df.loc[outliers_mask, col] = df[col].median()

                    # Créer une visualisation pour les outliers (boxplot avant/après)
                    if outlier_columns:
                        plt.figure(figsize=(14, 6))
                        plt.subplot(1, 2, 1)
                        plt.title("Before outliers treatement")
                        sns.boxplot(data=original_df[outlier_columns[:3]])

                        plt.subplot(1, 2, 2)
                        plt.title("After outliers treatement")
                        sns.boxplot(data=df[outlier_columns[:3]])

                        viz_path = os.path.join(preprocessing_viz_folder, "outliers.png")
                        plt.tight_layout()
                        plt.savefig(viz_path)
                        plt.close()

                    treatment_names = {
                        "remove": "Suppression",
                        "cap": "Plafonnement",
                        "replace_mean": "Remplacement par la moyenne",
                        "replace_median": "Remplacement par la médiane",
                    }

                    method_names = {
                        "zscore": "Z-Score",
                        "iqr": "IQR (Écart interquartile)",
                        "isolation_forest": "Isolation Forest",
                    }

                    applied_methods.append(
                        {
                            "name": "Détection et traitement des outliers",
                            "params": {
                                "Méthode": method_names.get(outlier_method, outlier_method),
                                "Traitement": treatment_names.get(
                                    outlier_treatment, outlier_treatment
                                ),
                                "columns": ", ".join(outlier_columns),
                                "Outliers détectés": str(outliers_detected),
                            },
                        }
                    )

            # 5. Encodage des variables catégorielles
            if "encoding" in preprocessing_methods:
                encoding_method = data.get("encoding_method", "onehot")
                encoding_columns = data.get("encoding_columns")

                if encoding_columns:
                    if encoding_method == "onehot":
                        # One-hot encoding
                        df = pd.get_dummies(df, columns=encoding_columns, drop_first=False)
                    elif encoding_method == "label":
                        # Label encoding
                        for col in encoding_columns:
                            le = LabelEncoder()
                            df[col] = le.fit_transform(df[col].astype(str))
                    elif encoding_method == "ordinal":
                        # Ordinal encoding
                        oe = OrdinalEncoder()
                        df[encoding_columns] = oe.fit_transform(
                            df[encoding_columns].astype(str)
                        )
                    elif encoding_method == "binary":
                        # Binary encoding (utilisant get_dummies puis conversion en binaire)
                        for col in encoding_columns:
                            dummies = pd.get_dummies(df[col], prefix=col)
                            df = pd.concat([df.drop(col, axis=1), dummies], axis=1)

                    method_names = {
                        "onehot": "One-Hot Encoding",
                        "label": "Label Encoding",
                        "ordinal": "Ordinal Encoding",
                        "binary": "Binary Encoding",
                    }

                    applied_methods.append(
                        {
                            "name": "Encodage des variables catégorielles",
                            "params": {
                                "Méthode": method_names.get(
                                    encoding_method, encoding_method
                                ),
                                "columns": ", ".join(encoding_columns),
                            },
                        }
                    )

            # 6. Sélection de caractéristiques
            if "feature_selection" in preprocessing_methods:
                feature_method = data.get("feature_selection_method", "variance")
                n_components = int(data.get("feature_selection_n_components", 5))

                # Sauvegarder les columns originales pour la visualisation
                original_columns = df.columns.tolist()

                if feature_method == "variance":
                    # Variance threshold
                    selector = VarianceThreshold(threshold=0.1)
                    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
                    if numeric_cols:
                        df_numeric = df[numeric_cols]
                        selected_data = selector.fit_transform(df_numeric)
                        selected_features = [
                            numeric_cols[i]
                            for i in range(len(numeric_cols))
                            if i in selector.get_support(indices=True)
                        ]

                        # Reconstruire le dataframe avec les caractéristiques sélectionnées
                        df = pd.DataFrame(selected_data, columns=selected_features)

                        # Ajouter les columns non numériques si elles existent
                        non_numeric_cols = [
                            col for col in original_columns if col not in numeric_cols
                        ]
                        if non_numeric_cols:
                            df = pd.concat([df, original_df[non_numeric_cols]], axis=1)

                elif feature_method == "kbest":
                    # SelectKBest
                    if "target" in df.columns:
                        X = df.drop("target", axis=1).select_dtypes(include=["number"])
                        y = df["target"]

                        if not X.empty:
                            selector = SelectKBest(
                                f_classif, k=min(n_components, X.shape[1])
                            )
                            selected_data = selector.fit_transform(X, y)
                            selected_features = X.columns[selector.get_support()].tolist()

                            # Reconstruire le dataframe
                            new_df = pd.DataFrame(selected_data, columns=selected_features)
                            new_df["target"] = y.values

                            # Ajouter les columns non numériques si elles existent
                            non_numeric_cols = [
                                col
                                for col in original_columns
                                if col not in X.columns and col != "target"
                            ]
                            if non_numeric_cols:
                                new_df = pd.concat(
                                    [new_df, original_df[non_numeric_cols]], axis=1
                                )

                            df = new_df

                elif feature_method == "pca":
                    # PCA
                    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
                    if numeric_cols:
                        pca = PCA(n_components=min(n_components, len(numeric_cols)))
                        pca_result = pca.fit_transform(df[numeric_cols])

                        # Créer un nouveau dataframe avec les composantes principales
                        pca_df = pd.DataFrame(
                            pca_result,
                            columns=[f"PC{i+1}" for i in range(pca_result.shape[1])],
                        )

                        # Ajouter les columns non numériques si elles existent
                        non_numeric_cols = [
                            col for col in df.columns if col not in numeric_cols
                        ]
                        if non_numeric_cols:
                            pca_df = pd.concat([pca_df, df[non_numeric_cols]], axis=1)

                        # Créer une visualisation de la variance expliquée
                        plt.figure(figsize=(12, 6))
                        plt.bar(
                            range(1, len(pca.explained_variance_ratio_) + 1),
                            pca.explained_variance_ratio_,
                            alpha=0.8,
                        )
                        plt.step(
                            range(1, len(pca.explained_variance_ratio_) + 1),
                            np.cumsum(pca.explained_variance_ratio_),
                            where="mid",
                            label="Variance expliquée cumulée",
                        )
                        plt.xlabel("Composantes principales")
                        plt.ylabel("Ratio de variance expliquée")
                        plt.title("Variance expliquée par composante principale")
                        plt.legend()

                        viz_path = os.path.join(
                            preprocessing_viz_folder, "pca_variance.png"
                        )
                        plt.tight_layout()
                        plt.savefig(viz_path)
                        plt.close()

                        df = pca_df

                method_names = {
                    "variance": "Seuil de variance",
                    "kbest": "SelectKBest",
                    "rfe": "Élimination récursive",
                    "pca": "Analyse en composantes principales (PCA)",
                }

                applied_methods.append(
                    {
                        "name": "Sélection de caractéristiques",
                        "params": {
                            "Méthode": method_names.get(feature_method, feature_method),
                            "Nombre de caractéristiques": str(n_components),
                            "Caractéristiques sélectionnées": str(len(df.columns)),
                        },
                    }
                )

            # 7. Transformation des données
            if "transformation" in preprocessing_methods:
                transform_method = data.get("transformation_method", "log")
                transform_columns = data.get("transformation_columns")

                if transform_columns:
                    # Vérifier que les columns existent dans le dataframe
                    transform_columns = [
                        col for col in transform_columns if col in df.columns
                    ]

                    if transform_method == "log":
                        # Log transformation (ajouter 1 pour éviter log(0))
                        for col in transform_columns:
                            # S'assurer que toutes les valeurs sont positives
                            min_val = df[col].min()
                            if min_val <= 0:
                                df[col] = df[col] - min_val + 1
                            df[col] = np.log(df[col])

                    elif transform_method == "sqrt":
                        # Square root transformation
                        for col in transform_columns:
                            # S'assurer que toutes les valeurs sont positives
                            min_val = df[col].min()
                            if min_val < 0:
                                df[col] = df[col] - min_val
                            df[col] = np.sqrt(df[col])

                    elif transform_method == "boxcox":
                        # Box-Cox transformation
                        for col in transform_columns:
                            # Box-Cox nécessite des valeurs strictement positives
                            min_val = df[col].min()
                            if min_val <= 0:
                                df[col] = df[col] - min_val + 1

                            # Appliquer Box-Cox
                            try:
                                transformer = PowerTransformer(method="box-cox")
                                df[col] = transformer.fit_transform(df[[col]]).flatten()
                            except Exception as e:
                                # En cas d'erreur, utiliser Yeo-Johnson qui est plus flexible
                                transformer = PowerTransformer(method="yeo-johnson")
                                df[col] = transformer.fit_transform(df[[col]]).flatten()

                    elif transform_method == "yeo-johnson":
                        # Yeo-Johnson transformation
                        transformer = PowerTransformer(method="yeo-johnson")
                        df[transform_columns] = transformer.fit_transform(
                            df[transform_columns]
                        )

                    # Créer une visualisation avant/après
                    plt.figure(figsize=(16, 6))
                    cols_to_plot = transform_columns[:2]  # max 2 columns

                    for i, col in enumerate(cols_to_plot):
                        plt.subplot(1, 2 * len(cols_to_plot), 2 * i + 1)
                        plt.title(f"Before transformation - {col}")
                        sns.histplot(original_df[col], kde=True)

                        plt.subplot(1, 2 * len(cols_to_plot), 2 * i + 2)
                        plt.title(f"After transformation - {col}")
                        sns.histplot(df[col], kde=True)

                    viz_path = os.path.join(preprocessing_viz_folder, "transformation.png")
                    plt.tight_layout()
                    plt.savefig(viz_path)
                    plt.close()

                    method_names = {
                        "log": "Logarithmique",
                        "sqrt": "Racine carrée",
                        "boxcox": "Box-Cox",
                        "yeo-johnson": "Yeo-Johnson",
                    }

                    applied_methods.append(
                        {
                            "name": "Transformation des données",
                            "params": {
                                "Méthode": method_names.get(
                                    transform_method, transform_method
                                ),
                                "columns": ", ".join(transform_columns),
                            },
                        }
                    )

            # Sauvegarder le dataframe prétraité
            preprocessed_file_path = os.path.join(
                datasets_folder, f"preprocessed_{filename}"
            )
            df.to_csv(preprocessed_file_path, index=False)
            preview_dataset = preview(preprocessed_file_path)
            session["preprocessed_filename"] = f"preprocessed_{filename}"

            # Calculer les statistiques pour le tableau de bord
            stats = {
                "rows": len(df),
                "columns": len(df.columns),
                "missing_values": df.isna().sum().sum(),
                "memory_usage": f"{df.memory_usage(deep=True).sum() / (1024 * 1024):.2f} MB",
            }

            # Préparer les données pour l'aperçu
            # Préparer les visualisations pour le tableau de bord
            data_visualizations = []
            for viz_file in os.listdir(preprocessing_viz_folder):
                if viz_file.endswith(".png"):
                    viz_title = viz_file.replace(".png", "").replace("_", " ").title()
                    data_visualizations.append(
                        {
                            "title": viz_title,
                            "image_path":
                                f"/backend/static/projects/user_{user_id}/{project_name}/preprocessing_viz/{viz_file}",
                        }
                    )
            result_path = os.path.join(project_dir, "preprocessing_results.json")
            with open(result_path, "w") as f:
                json.dump({
                    "applied_methods": convert_to_serializable(applied_methods),
                    "stats": convert_to_serializable(stats),
                    "visualizations": data_visualizations,
                    "preview_data": preview_dataset,
                }, f, indent=2)
            report_file_path = os.path.join(project_dir, "report.html")
            report_file_path = create_report(project_name, report_file_path,preprocessed_file_path)
            print("Report file path:", report_file_path)
            session["report_file_path"] = report_file_path
            return jsonify({
                "success": True
            })
        except Exception as e:
            flash(f"Erreur lors du prétraitement: {str(e)}", "danger")
            # Rediriger vers la page des méthodes de prétraitement au lieu d'afficher une page d'erreur
            return jsonify({"success": False, "error": str(e)})
    elif request.method == 'GET' : 
        result_path = os.path.join(project_dir, "preprocessing_results.json")
        if not os.path.exists(result_path):
            return jsonify({"success": False, "error": "No preprocessing results found"}), 404

        with open(result_path, "r") as f:
            data = json.load(f)

        return jsonify({
            "success": True,
            **data
        })



def create_report(project_name, report_file_path,preprocessed_file_path):
    try:
        # Charger le dataset prétraité
        df = pd.read_csv(preprocessed_file_path)
        filename = os.path.basename(preprocessed_file_path)
        final_filename = filename.replace("preprocessed_", "")
        # Créer un rapport HTML simple
        with open(report_file_path, "w") as f:
            f.write("<html><head><title>Preprocessing Report</title>")
            f.write(
                "<style>body{font-family:Arial;margin:20px;} h1{color:#4a6fa5;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;} th{background-color:#f2f2f2;}</style>"
            )
            f.write("</head><body>")
            f.write(f"<h1>Preprocessing Report - {project_name}</h1>")
            f.write(
                f'<p><strong>Original Dataset:</strong> {filename.replace("preprocessed_", "")}</p>'
            )
            f.write(f"<p><strong>Preprocessed Dataset:</strong> {final_filename}</p>")

            # Dataset Statistics
            f.write("<h2>Dataset Statistics</h2>")
            f.write(f"<p>Number of Rows: {len(df)}</p>")
            f.write(f"<p>Number of Columns: {len(df.columns)}</p>")
            f.write(f"<p>Missing Values: {df.isna().sum().sum()}</p>")
            f.write(
                f"<p>Memory Size: {df.memory_usage(deep=True).sum() / (1024 * 1024):.2f} MB</p>"
            )

            # Data Preview
            f.write("<h2>Data Preview</h2>")
            f.write('<div style="overflow-x:auto;">')
            f.write(df.head(10).to_html(index=False))
            f.write("</div>")

            # Statistical Description
            f.write("<h2>Statistical Description</h2>")
            f.write('<div style="overflow-x:auto;">')
            f.write(df.describe().to_html())
            f.write("</div>")

            f.write("</body></html>")

        return report_file_path
    except Exception as e:
        flash(f"Erreur lors de la création du rapport: {str(e)}", "danger")
        return None


@app.route("/preprocessing/report",methods=['GET'])
def preprocessing_report():
    user_id = session.get("user_id")
    project_name = session.get("project_name")

    if not user_id or not project_name:
        return jsonify({"success": False, "error": "Veuillez vous connecter."}), 401

    html_path = session.get("report_file_path")
    if not html_path or not os.path.exists(html_path):
        return jsonify({"success": False, "error": "Rapport introuvable."}), 404

    pdf_path = html_path.replace(".html", ".pdf")
    pdfkit.from_file(html_path, pdf_path, configuration=config)

    print("Report file path:", pdf_path)
    return send_file(html_path, as_attachment = True, download_name="preprocessing_report.html", mimetype="text/html")


@app.route("/predict_page", methods=["POST", "GET"])
def predict_page():
    if "user_id" not in session:
        flash("Veuillez vous connecter pour faire une prédiction.", "warning")
        return jsonify({"success": False, "error": "Veuillez vous connecter."}), 401

    data = request.get_json()
    filename = data.get("filename")
    algo = data.get("algo")
    project_name = data.get("project_name")
    model_type = data.get("model_type")
    learning_type = data.get("learning_type")

    if not all([filename, algo, project_name, model_type, learning_type]):
        return (
            jsonify({
                "success": False,
                "error": "Informations manquantes pour la prédiction.",
            }),
            400,
        )

    user_id = session["user_id"]
    params_folder = os.path.join(
        UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
    )
    params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
    params_path = os.path.join(params_folder, params_filename)

    if not os.path.exists(params_path):
        return jsonify({
            "success": False,
            "error": "Fichier de paramètres non trouvé."
        }), 404

    try:
        params = jb.load(params_path)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erreur lors du chargement des paramètres : {str(e)}"
        }), 500

    if learning_type == "supervised":
        features = params.get("X_train_columns", [])
    else:
        features = params.get("X_columns", [])

    model_info = {
        "project_name": project_name,
        "filename": filename,
        "algo": algo,
        "model_type": model_type,
        "learning_type": learning_type,
        "features": features,
    }

    return jsonify({"success": True, "model_info": model_info})



@app.route("/predict", methods=["POST"])
def predict():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour faire une prédiction.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]

    # Récupérer les informations du formulaire
    data = request.get_json()
    project_name = data.get("project_name")
    filename = data.get("filename")
    algo = data.get("algo")
    model_type = data.get("model_type")
    learning_type = data.get("learning_type")
    dataset_type = session.get("dataset_type")
    features = data.get("features")
    input_values = data.get("input_values")
    print("input_values : ", input_values)

    if not project_name or not filename or not algo or not model_type:
        return render_template(
            "error.html", error="Informations manquantes pour la prédiction."
        )

    # Récupérer les valeurs des caractéristiques depuis le formulaire
    processed_inputs = {}
    for feature in features:
        val = input_values.get(feature)
        try:
            processed_inputs[feature] = float(val)
        except (ValueError, TypeError):
            processed_inputs[feature] = val 
    print(processed_inputs)
    try:
        # Charger le modèle
        model_folder = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            f"user_{user_id}",
            project_name,
            "models",
        )
        model_path = os.path.join(model_folder, f"{algo}_model.pkl")

        if not os.path.exists(model_path):
            return jsonify(
                {
                    "success": False,
                    "error": "Le modèle n'a pas été trouvé. Veuillez réessayer.",
                }
            )

        model = jb.load(model_path)

        # Récupérer les paramètres du modèle depuis le fichier JSON
        params_folder = os.path.join(
            UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
        )
        params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
        params_path = os.path.join(params_folder, params_filename)
        params = jb.load(params_path)

        # Préparer les données d'entrée pour la prédiction
        if learning_type == "supervised":
            expected_columns = params.get("X_train_columns", list(processed_inputs.keys()))
        else:
            expected_columns = params.get("X_columns", list(processed_inputs.keys()))
        print(expected_columns)
        input_data = [processed_inputs[feature] for feature in expected_columns]

        # Créer un DataFrame avec les données d'entrée
        input_df = pd.DataFrame([input_data], columns=expected_columns)

        # Appliquer les mêmes prétraitements que lors de l'entraînement si nécessaire
        if "preprocessor" in params and params["preprocessor"] is not None:
            input_df = params["preprocessor"].transform(input_df)

        # Faire la prédiction
        # Pour les modèles non supervisés, utiliser notre fonction predict_cluster
        if learning_type == "unsupervised":
            # Importer la fonction predict_cluster depuis unsupervised_models

            # Récupérer les données d'entraînement et les labels si disponibles
            X_scaled = params.get("X_scaled", None)
            labels = params.get("labels", None)

            # Utiliser notre fonction personnalisée pour prédire le cluster
            prediction = unsupervised_models.predict_cluster(
                model, input_df.values, X_scaled, labels
            )
            prediction_result = prediction[0]

            # Si la prédiction est -1 (bruit), afficher un message plus clair
            if prediction_result == -1:
                prediction_result = "Point de bruit (outlier)"
        else:
            # Pour les modèles supervisés, utiliser la méthode predict standard
            if hasattr(model, "predict"):
                prediction = model.predict(input_df)
                print(prediction)
                prediction_result = prediction[0]

                # Convertir le résultat en format lisible si nécessaire
                if isinstance(prediction_result, (np.generic, np.ndarray)):
                    prediction_result = prediction_result.item()
            else:
                # Cas par défaut si aucune méthode de prédiction n'est disponible
                prediction_result = "Méthode de prédiction non disponible"

        # Stocker les valeurs d'entrée et le résultat dans la session pour l'affichage
        print(prediction_result)
        print(processed_inputs)
        session["input_values"] = processed_inputs
        session["prediction_result"] = prediction_result
        session["features"] = expected_columns
        model_info = {
            "project_name": project_name,
            "filename": filename,
            "algo": algo,
            "model_type": model_type,
            "learning_type": learning_type,
            "features": expected_columns,  
            "input_values":processed_inputs,
            "prediction_result":prediction_result,
            "params_dict": params.get("algorithm_parameters", {})
        }
        # Rediriger vers la page des résultats avec les informations de prédiction
        return jsonify(
            {
                "success": True,
                "prediction": prediction_result,
                "model_info": model_info,
            }
        )

    except Exception as e:
        jsonify({"success": False, "error": str(e)})


@app.route("/error", methods=["POST", "GET"])
def error():
    return render_template("error.html")
