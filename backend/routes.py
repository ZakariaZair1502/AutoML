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


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/preview_custom", methods=["POST"])
def upload_dataset_preview():
    if "dataset" not in request.files:
        return jsonify({"error": "Fichier manquant"}), 400

    file = request.files["dataset"]

    if file.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400

    # Sauvegarder le fichier temporairement
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
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
    print("user entred : ", username)
    print("pass entred : ", password)

    # Check if user exists in the database
    user = User.query.filter_by(username=username).first()
    print("user : ", user.username)
    print("passs : ", user.password)
    if user and check_password_hash(user.password, password):
        print("user : ", user.username)
        print("passs : ", user.password)
        session["user_id"] = user.username
        print(session["user_id"])
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


@app.route("/project/<project_name>")
def project_details(project_name):
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour accéder aux détails du projet.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]
    UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]

    # Chemin vers le dossier du projet
    user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")
    project_path = os.path.join(user_folder, project_name)

    if not os.path.exists(project_path):
        flash("Projet non trouvé.", "error")
        return redirect(url_for("dashboard"))

    # Récupérer les informations du projet
    project_info = {"name": project_name}

    # Récupérer le dataset
    datasets_folder = os.path.join(project_path, "datasets")
    if os.path.exists(datasets_folder):
        dataset_files = [f for f in os.listdir(datasets_folder) if f.endswith(".csv")]
        if dataset_files:
            project_info["dataset"] = dataset_files[0]

    # Récupérer le modèle et ses paramètres
    models_folder = os.path.join(project_path, "models")
    if os.path.exists(models_folder):
        model_files = [f for f in os.listdir(models_folder) if f.endswith("_model.pkl")]
        if model_files:
            project_info["model"] = model_files[0].replace("_model.pkl", "")
            params_folder = os.path.join(
                UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
            )
            filename = project_info["dataset"]
            algo = project_info["model"]
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
            project_info["clusters"] = url_for(
                "static",
                filename=f"projects/user_{user_id}/{project_name}/classification_clusters/{clusters[0]}",
            )
    elif os.path.exists(os.path.join(project_path, "error_curve")):
        error_curve_folder = os.path.join(project_path, "error_curve")
        error_curves = [
            f for f in os.listdir(error_curve_folder) if f.endswith("_error_curve.png")
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

    # Déterminer le type de projet
    if os.path.exists(os.path.join(project_path, "error_curve")):
        project_info["type"] = "regression"
    elif os.path.exists(os.path.join(project_path, "classification_clusters")):
        project_info["type"] = "classification"
    elif os.path.exists(os.path.join(project_path, "preprocessing_viz")):
        project_info["type"] = "preprocessing"
    else:
        project_info["type"] = "clustering"

    return render_template("project_details.html", project=project_info)


@app.route("/dashboard")
def dashboard():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour accéder au tableau de bord.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]
    projects = []
    UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]

    # Chemin vers le dossier de l'utilisateur
    user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")

    # Vérifier si le dossier de l'utilisateur existe
    if not os.path.exists(user_folder):
        return render_template("dashboard.html", projects=[])

    # Parcourir tous les dossiers de projets de l'utilisateur
    for project_name in os.listdir(user_folder):
        project_path = os.path.join(user_folder, project_name)
        if os.path.isdir(project_path):
            project_info = {"name": project_name}

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
                    project_info["model"] = model_files[0].replace("_model.pkl", "")

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
            if project_info.get("model"):
                algo = project_info["model"]
                model_type = project_info["type"]
                filename = project_info["dataset"]
                params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
                params_file = os.path.join(project_path, "params", params_filename)
                params = jb.load(params_file)
                project_info["params"] = params

            projects.append(project_info)

    return render_template("dashboard.html", projects=projects)


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


@   app.route("/project", methods=["GET", "POST"])
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
            print(project_name)
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
                print(data)
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

                return (
                    jsonify(
                        {
                            "status": "success",
                            "message": "File uploaded successfully!",
                            "preview": preview_data,
                            "filename": filename,
                            "redirect": "/select_type",
                        }
                    ),
                    200,
                )

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
            print(dataset_loader)

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
                print(filename)
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

                return (
                    jsonify(
                        {
                            "status": "success",
                            "message": "Predefined dataset loaded successfully!",
                            "preview": preview_data,
                            "filename": filename,
                            "redirect": "/select_type",
                        }
                    ),
                    200,
                )

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
            print("generation algorithm : ", generation_algorithm)

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
                    print(algorithm_params)
                    algorithm_params = {
                        k: int(v) if isinstance(v, float) and v.is_integer() else v
                        for k, v in algorithm_params.items()
                    }
                    print(algorithm_params)
                    print("before")
                    X, y = generators[generation_algorithm](**algorithm_params)
                    print("after")
                    df = pd.DataFrame(X)
                    df["target"] = y
                elif generation_algorithm == "make_regression":
                    X, y = generators[generation_algorithm](**algorithm_params)
                    df = pd.DataFrame(X)
                    df["target"] = y

                filename = f"{generation_algorithm}_generated.csv"
                print(filename)
                file_path = os.path.join(project_folder, "datasets", filename)
                df.to_csv(file_path, index=False)

                print(file_path)
                preview_data = {
                    "columns": df.columns.tolist(),
                    "data": df.head().values.tolist(),
                }

                # Store information in session for select_type route
                session["filename"] = filename
                session["project_name"] = project_name
                session["learning_type"] = learning_type

                return (
                    jsonify(
                        {
                            "status": "success",
                            "message": "Dataset generated successfully!",
                            "preview": preview_data,
                            "filename": filename,
                            "redirect": "/select_type",
                        }
                    ),
                    200,
                )

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
            "K-Means": ("sklearn.cluster", "KMeans"),
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
        flash("Veuillez vous connecter pour sélectionner un type de modèle.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]

    # Récupérer le type d'apprentissage depuis la session
    learning_type = session.get("learning_type", "supervised")
    if request.method == "POST":
        model_type = request.form.get("model_type")
        algo = request.form.get("algo")
        session["algo"] = algo
        session["model_type"] = model_type
        filename = session.get("filename")
        project_name = session.get("project_name")
        if not model_type:
            flash("Veuillez sélectionner un type de modèle.", "error")
            return redirect(request.url)  # Recharge la page avec le message d'erreur

        # Récupérer les paramètres d'algorithme sélectionnés
        algorithm_parameters = request.form.get("algorithm_parameters", "{}")

        try:
            # Convertir la chaîne JSON en dictionnaire Python
            algorithm_parameters_dict = json.loads(algorithm_parameters)
            algorithm_parameters_raw = algorithm_parameters_dict.get("parameters", {})
            print(algorithm_parameters_raw)
            # Stocker les paramètres dans la session et le cache global
            ################################
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

            #################################
        except json.JSONDecodeError:
            session["algorithm_parameters"] = {}
            algorithm_parameters_cache[algo] = {}

        # Rediriger vers la page de sélection des caractéristiques appropriée
        return redirect(url_for("select_features"))

    # Choisir le template en fonction du type d'apprentissage
    template = "select_type.html"
    project_name = session.get("project_name")
    filename = session.get("filename")
    return render_template(
        template,
        project_name=project_name,
        filename=filename,
        learning_type=learning_type,
    )


@app.route("/select_features", methods=["GET", "POST"])
def select_features():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash(
            "Veuillez vous connecter pour sélectionner des caractéristiques.", "warning"
        )
        return redirect(url_for("login"))

    user_id = session["user_id"]

    # Récupérer le type d'apprentissage depuis la session
    learning_type = session.get("learning_type", "supervised")
    filename = session.get("filename")
    project_name = session.get("project_name")
    model_type = session.get("model_type")
    algo = session.get("algo")

    # Utiliser le dossier spécifique à l'utilisateur
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
    print(algorithm_parameters)
    params_dict = algo_class.get_params()
    session["params_dict"] = params_dict
    if request.method == "POST":
        # Get the updated features list and target feature from the form
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
        else:  # unsupervised
            return redirect(url_for("train_model"))

    # For GET requests, show all features
    features = data.columns.tolist()
    stats = numeric_data.describe().transpose()
    stats_dict = stats.to_dict(orient="index")

    # Choisir le template en fonction du type d'apprentissage
    template = "select_features.html"

    return render_template(
        template,
        project_name=project_name,
        filename=filename,
        model_type=model_type,
        features=features,
        stats=stats_dict,
        algo=algo,
        learning_type=learning_type,
        params_dict=params_dict,
    )


@app.route("/train_model", methods=["GET"])
def train_model():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour entraîner un modèle.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]

    # Récupérer le type d'apprentissage depuis la session
    learning_type = session.get("learning_type", "supervised")
    algo = session.get("algo")
    model_type = session.get("model_type")
    project_name = session.get("project_name")
    filename = session.get("filename")

    # Utiliser le dossier spécifique à l'utilisateur
    user_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], f"user_{user_id}")
    project_folder = os.path.join(user_folder, project_name, "datasets")
    filepath = os.path.join(project_folder, filename)
    if learning_type == "supervised":
        target_feature = session.get("target_feature")
    selected_features = session.get("selected_features")
    algorithm_params_path = session.get("algorithm_params_path")
    algorithm_parameters = jb.load(algorithm_params_path)
    preprocessing_enabled = session.get("preprocessing_enabled", False)
    preprocessing_options = session.get("preprocessing_options", [])

    try:
        if learning_type == "supervised":
            print("not trained")
            # Entraînement du modèle avec la fonctionnalité cible, les paramètres personnalisés et les options de prétraitement
            md, params = supervised_models.model_train(
                filepath,
                algo,
                selected_features,
                target_feature=target_feature,
                algorithm_parameters=algorithm_parameters,
                preprocessing_enabled=preprocessing_enabled,
                preprocessing_options=preprocessing_options,
            )
            # Sauvegarde du modèle
            print("trained")
            model_folder = os.path.join(user_folder, project_name, "models")
            os.makedirs(model_folder, exist_ok=True)
            model_path = os.path.join(model_folder, f"{algo}_model.pkl")
            jb.dump(md, model_path)

            # Store the path to the saved model in the params dictionary
            params["model_path"] = model_path
            # Load the model from disk for predictions
            model = jb.load(model_path)
            params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
            params_folder = os.path.join(
                UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
            )
            os.makedirs(params_folder, exist_ok=True)
            params_path = os.path.join(params_folder, params_filename)
            jb.dump(params, params_path)
            session["params_path"] = params_path
            X_test = params["X_test"]
            if "X_train_columns" in params and params["X_train_columns"] is not None:
                X_test = pd.DataFrame(X_test, columns=params["X_train_columns"])
            else:
                X_test = np.array(X_test) if isinstance(X_test, list) else X_test

            predictions = model.predict(X_test)[:20]
            if isinstance(predictions, pd.DataFrame):
                predictions = predictions.values.tolist()
            session["X_train_columns"] = params["X_train_columns"]
            values = params["y_test"][:20]
            if isinstance(values, pd.DataFrame):
                values = values.values.tolist()
            predictions_values = list(zip(predictions, values))
        else:
            md, params = unsupervised_models.model_train(
                filepath,
                algo,
                selected_features,
                algorithm_parameters=algorithm_parameters,
                preprocessing_enabled=preprocessing_enabled,
                preprocessing_options=preprocessing_options,
            )

            # Sauvegarde du modèle
            model_folder = os.path.join(user_folder, project_name, "models")
            os.makedirs(model_folder, exist_ok=True)
            model_path = os.path.join(model_folder, f"{algo}_model.pkl")
            jb.dump(md, model_path)

            # Store the path to the saved model in the params dictionary
            params["model_path"] = model_path

            # Load the model from disk for predictions
            model = jb.load(model_path)

            # Store the model back in params for use in the template
            params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
            params_folder = os.path.join(
                UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
            )
            os.makedirs(params_folder, exist_ok=True)
            params_path = os.path.join(params_folder, params_filename)
            jb.dump(params, params_path)
            session["params_path"] = params_path

            # Extraction des prédictions et des valeurs réelles
            X_scaled = params["X_scaled"]
            if "X_train_columns" in params and params["X_train_columns"]:
                X_scaled = pd.DataFrame(X_scaled, columns=params["X_train_columns"])
            else:
                X_scaled = (
                    np.array(X_scaled) if isinstance(X_scaled, list) else X_scaled
                )

            # Utiliser les labels stockés dans params plutôt que d'accéder directement à model.labels_
            # car certains modèles n'ont pas cet attribut
            labels = params["labels"]
            predictions = unsupervised_models.predict_cluster(
                model, X_scaled, X_scaled, labels
            )[:20]
            predictions = (
                predictions.tolist()
                if isinstance(predictions, np.ndarray)
                else predictions
            )
            values = params["labels"][:20]
            values = values.tolist() if isinstance(values, np.ndarray) else values
            predictions_values = list(zip(predictions, values))
            # Utilisation de list() pour éviter des erreurs d'affichage

    except ValueError as e:
        return render_template("error.html", error=f"Erreur d'entraînement : {str(e)}")
    except Exception as e:
        return render_template(
            "error.html", error=f"Une erreur inattendue s'est produite : {str(e)}"
        )

    return render_template(
        "results.html",
        project_name=project_name,
        filename=filename,
        model_type=model_type,
        algo=algo,
        features=selected_features,
        predictions_values=predictions_values,
        params_dict=algorithm_parameters,
        preprocessing_options=preprocessing_options,
        learning_type=learning_type,
    )


@app.route("/api/evaluate", methods=["GET", "POST"])
def evaluate():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour évaluer un modèle.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]
    project_name = session.get("project_name")
    algo = session.get("algo")
    model_type = session.get("model_type")
    filename = session.get("filename")
    learning_type = session.get("learning_type", "supervised")
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
                print("before")
                params = unsupervised_models.model_evaluate(params)
                print("after")
            params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
            params_folder = os.path.join(
                UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
            )
            os.makedirs(params_folder, exist_ok=True)
            params_path = os.path.join(params_folder, params_filename)
            jb.dump(params, params_path)
            session["params_path"] = params_path
            metrics = params["metrics"]
            return render_template(
                "evaluate.html",
                project_name=project_name,
                algo=algo,
                filename=filename,
                model_type=model_type,
                metrics=metrics,
                learning_type=learning_type,
            )

        except ValueError as e:
            error = str(e)
        except Exception as e:
            error = f"Une erreur s'est produite: {str(e)}"

    return render_template("error.html", error=error)


@app.route("/save", methods=["POST"])
def save():
    project_name = session.get("project_name")
    user_id = session["user_id"]
    filename = session.get("filename")
    algo = session.get("algo")
    model_type = session.get("model_type")
    params_path = session.get("params_path")
    params = jb.load(params_path)
    algorithm_params_path = session.get("algorithm_params_path")
    algorithm_params = jb.load(algorithm_params_path)
    params["algorithm_params"] = algorithm_params
    params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
    params_folder = os.path.join(
        current_app.config["UPLOAD_FOLDER"], f"user_{user_id}", project_name, "params"
    )
    os.makedirs(params_folder, exist_ok=True)
    params_path = os.path.join(params_folder, params_filename)
    jb.dump(params, params_path)
    if not project_name or not filename or not algo or not model_type:
        return render_template(
            "error.html",
            error="Erreur : projet, fichier, algorithme ou type de modèle non spécifié.",
        )
    project_folder = os.path.join(
        current_app.config["UPLOAD_FOLDER"], f"user_{user_id}", project_name, "datasets"
    )
    filepath = os.path.join(project_folder, filename)
    print(filepath)
    if not os.path.exists(filepath):
        return render_template(
            "error.html",
            error=f"error : fichier {filename} introuvable dans le projet {project_name}.",
        )
    # Création du dossier de sauvegarde spécifique au projet
    model_folder = os.path.join(
        current_app.config["UPLOAD_FOLDER"], f"user_{user_id}", project_name, "models"
    )
    os.makedirs(model_folder, exist_ok=True)
    model_file = os.path.join(model_folder, f"{algo}_model.pkl")
    model_path = params["model_path"]
    print("model path :   ", model_path)
    model = jb.load(model_path)
    jb.dump(model, model_file)

    # Extraire les paramètres du modèle pour les afficher

    return render_template(
        "save.html",
        save="Modèle sauvegardé avec succès!",
        project_name=project_name,
        filename=filename,
        algo=algo,
        model_type=model_type,
        model_path=model_file,
        model_params=algorithm_params,
    )


@app.route("/plot_results", methods=["POST", "GET"])
def plot_results():
    project_name = session.get("project_name")
    filename = session.get("filename")
    algo = session.get("algo")
    model_type = session.get("model_type")
    learning_type = session.get("learning_type", "supervised")
    params_path = session.get("params_path")
    params = jb.load(params_path)
    if not params:
        return render_template("error.html", error="Modèle non entraîné.")
    if not project_name or not filename or not algo:
        return render_template("error.html", error="Informations manquantes.")

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
                    return render_template(
                        "error.html", error=f"Error loading model: {str(e)}"
                    )
            else:
                return render_template(
                    "error.html", error="Model not available for prediction"
                )

            # Prepare X_test for prediction
            X_test = params["X_test"]
            if "X_train_columns" in params and params["X_train_columns"] is not None:
                X_test = pd.DataFrame(X_test, columns=params["X_train_columns"])
            else:
                X_test = np.array(X_test) if isinstance(X_test, list) else X_test

            predictions = model.predict(X_test)
            if isinstance(predictions, pd.DataFrame):
                predictions = predictions.values.tolist()
            else:
                predictions = predictions.tolist()

            # Save static image
            plt.figure(figsize=(4, 3))
            plt.plot(params["y_test"], label="y_test", color="blue", marker="o")
            plt.plot(predictions, label="y_pred", color="red", marker="x")
            plt.title("Courbe de différence Y_TEST vs Y_PRED")
            plt.xlabel("Itération")
            plt.ylabel("Erreur MSE")
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
                "predictions": predictions,
                "title": "Courbe de différence Y_TEST vs Y_PRED",
                "xlabel": "Itération",
                "ylabel": "Erreur MSE",
            }
            plot_title = "Regression Error Curve"

        else:  # Classification
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
                return render_template(
                    "error.html", error="Model not available for prediction"
                )

            # Prepare X_test for prediction
            X_test = params["X_test"]
            if "X_train_columns" in params and params["X_train_columns"] is not None:
                X_test = pd.DataFrame(X_test, columns=params["X_train_columns"])
            else:
                X_test = np.array(X_test) if isinstance(X_test, list) else X_test

            # Réduire la dimensionnalité à 2 dimensions pour une meilleure visualisation
            pca = PCA(n_components=2)
            X_pca = pca.fit_transform(X_test)

            # Prédictions des classes
            y_pred = model.predict(X_test)
            le = LabelEncoder()
            y_encoded = le.fit_transform(y_pred)

            # Create static image
            plt.figure(figsize=(4, 3))
            scatter = plt.scatter(
                X_pca[:, 0], X_pca[:, 1], c=y_encoded, cmap="viridis", marker="o"
            )
            plt.title("Clusters de Classification")
            plt.xlabel("Composante Principale 1")
            plt.ylabel("Composante Principale 2")

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
                "xlabel": "Composante Principale 1",
                "ylabel": "Composante Principale 2",
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
            return render_template(
                "error.html", error="Model not available for prediction"
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
        plt.xlabel("Composante Principale 1")
        plt.ylabel("Composante Principale 2")

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
            "xlabel": "Composante Principale 1",
            "ylabel": "Composante Principale 2",
        }
        plot_title = "Unsupervised Clusters"

    # Convert plot data to JSON for the template
    import json

    plot_data_json = json.dumps(plot_data)

    return render_template(
        "plot_results.html",
        img_path=img_path,
        plot_data=plot_data_json,
        plot_title=plot_title,
    )


@app.route("/delete", methods=["POST"])
def delete():
    project_name = request.form.get("project_name")
    user_id = session["user_id"]
    if not project_name:
        flash("Nom du projet invalide.", "error")
        return redirect(url_for("error"))

    UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
    project_folder = os.path.join(
        UPLOAD_FOLDER, f"user_{user_id}", secure_filename(project_name)
    )
    print(project_folder)
    print(f"user_{user_id}")
    if not project_folder.startswith(os.path.abspath(UPLOAD_FOLDER)):
        flash("Tentative de suppression non autorisée.", "error")
        return redirect(url_for("error"))
    if os.path.exists(project_folder):
        try:
            print(project_folder)
            shutil.rmtree(project_folder)
            flash(f"Projet '{project_name}' supprimé avec succès.", "success")
        except Exception as e:
            flash(f"Erreur lors de la suppression du projet : {str(e)}", "error")
    else:
        flash("Le projet n'existe pas.", "warning")

    return redirect(url_for("dashboard"))


@app.route("/preprocessing/methods", methods=["GET", "POST"])
def preprocessing_methods():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour accéder au prétraitement.", "warning")
        return redirect(url_for("login"))

    # Récupération des infos session
    user_id = session.get("user_id")
    project_name = session.get("project_name")
    filename = session.get("filename")

    if not project_name or not filename:
        flash("Informations de projet manquantes. Veuillez recommencer.")
        return redirect(url_for("preprocessing_upload"))

    file_path = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        f"user_{user_id}",
        project_name,
        "datasets",
        filename,
    )

    try:
        df = pd.read_csv(file_path)

        # Déterminer les types de colonnes
        column_types = {
            column: (
                "numeric"
                if pd.api.types.is_numeric_dtype(df[column])
                else "categorical"
            )
            for column in df.columns
        }

        return render_template(
            "preprocessing_methods.html",
            project_name=project_name,
            filename=filename,
            columns=df.columns.tolist(),
            column_types=column_types,
        )
    except Exception as e:
        flash(f"Erreur lors du chargement du dataset : {str(e)}")
        return render_template("error.html", error="Erreur de lecture du dataset.")


@app.route("/preprocessing/apply", methods=["POST"])
def preprocessing_apply():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour accéder au prétraitement.", "warning")
        return redirect(url_for("login"))

    # Récupérer les informations de la session et du formulaire
    user_id = session["user_id"]
    project_name = session.get("project_name")
    filename = session.get("filename")
    preprocessing_methods = request.form.getlist("preprocessing_methods")
    print(preprocessing_methods)
    if not project_name or not filename:
        flash("Informations de projet manquantes. Veuillez recommencer.")
        return redirect(url_for("preprocessing_upload"))

    if not preprocessing_methods:
        flash("Veuillez sélectionner au moins une méthode de prétraitement.")
        return redirect(url_for("preprocessing_methods"))

    # Charger le dataset
    user_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], f"user_{user_id}")
    file_path = os.path.join(user_folder, project_name, "datasets", filename)
    preprocessing_viz_folder = os.path.join(
        user_folder, project_name, "preprocessing_viz"
    )
    datasets_folder = os.path.join(user_folder, project_name, "datasets")

    try:
        df = pd.read_csv(file_path)
        print(df.shape)
        original_df = df.copy()
        applied_methods = []

        # 1. Normalisation
        if "normalization" in preprocessing_methods:
            norm_method = request.form.get("norm_method", "minmax")
            norm_columns = request.form.getlist("norm_columns")
            print("aaaa")
            print(norm_columns)
            if norm_columns:
                if norm_method == "minmax":
                    print(norm_columns)
                    scaler = MinMaxScaler()
                    df[norm_columns] = scaler.fit_transform(df[norm_columns])
                    print(df[norm_columns])
                elif norm_method == "robust":
                    scaler = RobustScaler()
                    df[norm_columns] = scaler.fit_transform(df[norm_columns])
                elif norm_method == "maxabs":
                    scaler = MaxAbsScaler()
                    df[norm_columns] = scaler.fit_transform(df[norm_columns])

                # Créer une visualisation avant/après
                print("before plot")
                plt.figure(figsize=(14, 6))
                plt.subplot(1, 2, 1)
                plt.title("Avant normalisation")
                for col in norm_columns[:3]:  # Limiter à 3 colonnes pour la lisibilité
                    sns.kdeplot(original_df[col], label=col)
                plt.legend()

                plt.subplot(1, 2, 2)
                plt.title("Après normalisation")
                for col in norm_columns[:3]:
                    sns.kdeplot(df[col], label=col)
                plt.legend()
                print("before save plot")
                viz_path = os.path.join(preprocessing_viz_folder, "normalization.png")
                plt.tight_layout(pad=2.0)  # Augmenter l'espace entre les subplots
                plt.savefig(
                    viz_path, bbox_inches="tight"
                )  # Assurer que tout est visible
                plt.close()
                print("after save plot")
                applied_methods.append(
                    {
                        "name": "Normalisation",
                        "params": {
                            "Méthode": norm_method,
                            "Colonnes": ", ".join(norm_columns),
                        },
                    }
                )

        # 2. Standardisation
        if "standardization" in preprocessing_methods:
            std_columns = request.form.getlist("std_columns")

            if std_columns:
                scaler = StandardScaler()
                df[std_columns] = scaler.fit_transform(df[std_columns])

                # Créer une visualisation avant/après
                plt.figure(figsize=(14, 6))
                plt.subplot(1, 2, 1)
                plt.title("Avant standardisation")
                for col in std_columns[:3]:
                    sns.kdeplot(original_df[col], label=col)
                plt.legend()

                plt.subplot(1, 2, 2)
                plt.title("Après standardisation")
                for col in std_columns[:3]:
                    sns.kdeplot(df[col], label=col)
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
                        "params": {"Colonnes": ", ".join(std_columns)},
                    }
                )

        # 3. Gestion des valeurs manquantes
        if "missing_values" in preprocessing_methods:
            missing_strategy = request.form.get("missing_strategy", "mean")
            missing_columns = request.form.getlist("missing_columns")
            constant_value = request.form.get("constant_value", "0")

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
                                "Colonnes": ", ".join(missing_columns),
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
                                "Colonnes": ", ".join(missing_columns),
                            },
                        }
                    )

        # 4. Détection et traitement des outliers
        if "outliers" in preprocessing_methods:
            outlier_method = request.form.get("outlier_method", "zscore")
            outlier_treatment = request.form.get("outlier_treatment", "remove")
            outlier_columns = request.form.getlist("outlier_columns")

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
                    plt.figure(figsize=(12, 6))
                    plt.subplot(4, 3, 1)
                    plt.title("Avant traitement des outliers")
                    sns.boxplot(data=original_df[outlier_columns[:3]])

                    plt.subplot(4, 3, 2)
                    plt.title("Après traitement des outliers")
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
                            "Colonnes": ", ".join(outlier_columns),
                            "Outliers détectés": str(outliers_detected),
                        },
                    }
                )

        # 5. Encodage des variables catégorielles
        if "encoding" in preprocessing_methods:
            encoding_method = request.form.get("encoding_method", "onehot")
            encoding_columns = request.form.getlist("encoding_columns")

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
                            "Colonnes": ", ".join(encoding_columns),
                        },
                    }
                )

        # 6. Sélection de caractéristiques
        if "feature_selection" in preprocessing_methods:
            feature_method = request.form.get("feature_method", "variance")
            n_components = int(request.form.get("feature_n_components", 5))

            # Sauvegarder les colonnes originales pour la visualisation
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

                    # Ajouter les colonnes non numériques si elles existent
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

                        # Ajouter les colonnes non numériques si elles existent
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

                    # Ajouter les colonnes non numériques si elles existent
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
            transform_method = request.form.get("transform_method", "log")
            transform_columns = request.form.getlist("transform_columns")

            if transform_columns:
                # Vérifier que les colonnes existent dans le dataframe
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
                plt.figure(figsize=(12, 6))
                for i, col in enumerate(
                    transform_columns[:2]
                ):  # Limiter à 2 colonnes pour la lisibilité
                    plt.subplot(4, 3, i * 2 + 1)
                    plt.title(f"Avant transformation - {col}")
                    sns.histplot(original_df[col], kde=True)

                    plt.subplot(4, 3, i * 2 + 2)
                    plt.title(f"Après transformation - {col}")
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
                            "Colonnes": ", ".join(transform_columns),
                        },
                    }
                )

        # Sauvegarder le dataframe prétraité
        print(applied_methods)
        preprocessed_file_path = os.path.join(
            datasets_folder, f"preprocessed_{filename}"
        )
        df.to_csv(preprocessed_file_path, index=False)
        session["preprocessed_filename"] = f"preprocessed_{filename}"

        # Calculer les statistiques pour le tableau de bord
        stats = {
            "rows": len(df),
            "columns": len(df.columns),
            "missing_values": df.isna().sum().sum(),
            "memory_usage": f"{df.memory_usage(deep=True).sum() / (1024 * 1024):.2f} MB",
        }

        # Préparer les données pour l'aperçu
        preview_data = df.head(10).values.tolist()

        # Préparer les visualisations pour le tableau de bord
        data_visualizations = []
        for viz_file in os.listdir(preprocessing_viz_folder):
            if viz_file.endswith(".png"):
                viz_title = viz_file.replace(".png", "").replace("_", " ").title()
                data_visualizations.append(
                    {
                        "title": viz_title,
                        "image_path": url_for(
                            "static",
                            filename=f"projects/user_{user_id}/{project_name}/preprocessing_viz/{viz_file}",
                        ),
                    }
                )

        return render_template(
            "preprocessing_result.html",
            project_name=project_name,
            filename=f"preprocessed_{filename}",
            columns=df.columns.tolist(),
            preview_data=preview_data,
            applied_methods=applied_methods,
            stats=stats,
            data_visualizations=data_visualizations,
        )

    except Exception as e:
        flash(f"Erreur lors du prétraitement: {str(e)}", "danger")
        # Rediriger vers la page des méthodes de prétraitement au lieu d'afficher une page d'erreur
        return redirect(url_for("preprocessing_methods"))


@app.route("/preprocessing/save", methods=["POST"])
def save_preprocessed_data():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour sauvegarder les données.", "warning")
        return redirect(url_for("login"))

    # Récupérer les informations de la session et du formulaire
    user_id = session["user_id"]
    project_name = request.form.get("project_name")
    filename = request.form.get("filename")

    if not project_name or not filename:
        flash("Informations de projet manquantes. Veuillez recommencer.")
        return redirect(url_for("dashboard"))

    try:
        # Chemins des dossiers
        UPLOAD_FOLDER = current_app.config["UPLOAD_FOLDER"]
        user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")
        project_folder = os.path.join(user_folder, project_name)
        datasets_folder = os.path.join(project_folder, "datasets")

        # Vérifier si le fichier prétraité existe
        preprocessed_file_path = os.path.join(datasets_folder, filename)
        if not os.path.exists(preprocessed_file_path):
            flash("Le fichier prétraité est introuvable.")
            return redirect(url_for("dashboard"))

        # Charger le dataset prétraité
        df = pd.read_csv(preprocessed_file_path)

        # Créer un dossier pour les datasets finaux s'il n'existe pas
        final_datasets_folder = os.path.join(project_folder, "final_datasets")
        os.makedirs(final_datasets_folder, exist_ok=True)

        # Sauvegarder le dataset prétraité dans le dossier final
        final_filename = f"final_{filename}"
        final_file_path = os.path.join(final_datasets_folder, final_filename)
        df.to_csv(final_file_path, index=False)

        # Mettre à jour la session avec le nom du fichier final
        session["final_filename"] = final_filename

        # Générer un rapport de prétraitement
        report_folder = os.path.join(project_folder, "reports")
        os.makedirs(report_folder, exist_ok=True)

        report_file_path = os.path.join(
            report_folder, f"preprocessing_report_{project_name}.html"
        )

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

        flash("Dataset prétraité sauvegardé avec succès! Un rapport a été généré.")
        return send_file(report_file_path)

    except Exception as e:
        flash(f"Erreur lors de la sauvegarde du dataset: {str(e)}")
        return redirect(url_for("dashboard"))


@app.route("/preprocessing/report")
def preprocessing_report():
    # Récupérer les informations de la session
    user_id = session.get("user_id")
    project_name = session.get("project_name")

    if not user_id or not project_name:
        flash(
            "Veuillez vous connecter pour accéder au rapport de prétraitement.",
            "warning",
        )
        return redirect(url_for("login"))

    # Chemin vers le rapport de prétraitement
    report_folder = os.path.join(
        current_app.config["UPLOAD_FOLDER"], f"user_{user_id}", project_name, "reports"
    )
    os.makedirs(report_folder, exist_ok=True)
    report_file_path = os.path.join(
        report_folder, f"preprocessing_report_{project_name}.html"
    )

    if not os.path.exists(report_file_path):
        flash("Le rapport de prétraitement n'a pas été généré.", "warning")
        return render_template("error.html")

    return send_file(report_file_path)


@app.route("/predict_page")
def predict_page():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour faire une prédiction.", "warning")
        return redirect(url_for("login"))

    filename = request.args.get("filename")
    algo = request.args.get("algo")
    project_name = request.args.get("project_name")
    model_type = request.args.get("model_type")
    learning_type = request.args.get("learning_type")
    user_id = session.get("user_id", "")
    params_folder = os.path.join(
        UPLOAD_FOLDER, f"user_{user_id}", project_name, "params"
    )
    params_filename = f"{project_name}_{filename}_{algo}_params.pkl"
    params_path = os.path.join(params_folder, params_filename)
    params = jb.load(params_path)
    if learning_type == "supervised":
        features = params.get("X_train_columns", [])
    else:
        features = params.get("X_columns", [])

    if not all([filename, algo, project_name, model_type, learning_type]):
        return render_template(
            "error.html", error="Informations manquantes pour la prédiction."
        )

    return render_template(
        "predict.html",
        filename=filename,
        algo=algo,
        project_name=project_name,
        model_type=model_type,
        learning_type=learning_type,
        features=features,
    )


@app.route("/predict", methods=["POST"])
def predict():
    # Vérifier si l'utilisateur est connecté
    if "user_id" not in session:
        flash("Veuillez vous connecter pour faire une prédiction.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]

    # Récupérer les informations du formulaire
    project_name = request.form.get("project_name")
    filename = request.form.get("filename")
    algo = request.form.get("algo")
    model_type = request.form.get("model_type")
    learning_type = request.form.get("learning_type")
    dataset_type = session.get("dataset_type")

    if not project_name or not filename or not algo or not model_type:
        return render_template(
            "error.html", error="Informations manquantes pour la prédiction."
        )

    # Récupérer les valeurs des caractéristiques depuis le formulaire
    input_values = {}
    for key, value in request.form.items():
        print(key, value)
        if key.startswith("feature_"):
            feature_name = key.replace("feature_", "", 1)
            print("feature_name : ", feature_name)  # Enlève le préfixe
            try:
                input_values[feature_name] = float(value)
            except ValueError:
                input_values[feature_name] = value
        print(input_values)
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
            return render_template("error.html", error="Le modèle n'a pas été trouvé.")

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
            expected_columns = params.get("X_train_columns", list(input_values.keys()))
        else:
            expected_columns = params.get("X_columns", list(input_values.keys()))
        print(expected_columns)
        input_data = [input_values[feature] for feature in expected_columns]

        # Créer un DataFrame avec les données d'entrée
        input_df = pd.DataFrame([input_data], columns=expected_columns)

        # Appliquer les mêmes prétraitements que lors de l'entraînement si nécessaire
        if "preprocessor" in params and params["preprocessor"] is not None:
            input_df = params["preprocessor"].transform(input_df)

        # Faire la prédiction
        # Pour les modèles non supervisés, utiliser notre fonction predict_cluster
        if learning_type == "unsupervised":
            # Importer la fonction predict_cluster depuis unsupervised_models
            from app.unsupervised_models import predict_cluster

            # Récupérer les données d'entraînement et les labels si disponibles
            X_scaled = params.get("X_scaled", None)
            labels = params.get("labels", None)

            # Utiliser notre fonction personnalisée pour prédire le cluster
            prediction = predict_cluster(model, input_df.values, X_scaled, labels)
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
        print(input_values)
        session["input_values"] = input_values
        session["prediction_result"] = prediction_result
        session["features"] = expected_columns

        # Rediriger vers la page des résultats avec les informations de prédiction
        return render_template(
            "predict.html",
            project_name=project_name,
            filename=filename,
            algo=algo,
            model_type=model_type,
            features=expected_columns,
            input_values=input_values,
            prediction_result=prediction_result,
            learning_type=learning_type,
            params_dict=params.get("algorithm_parameters", {}),
        )

    except Exception as e:
        return render_template(
            "error.html", error=f"Erreur lors de la prédiction: {str(e)}"
        )


@app.route("/error", methods=["POST", "GET"])
def error():
    return render_template("error.html")
