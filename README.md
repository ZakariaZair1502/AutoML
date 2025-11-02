# AutoML

<!-- Flask -->
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)

<!-- MongoDB -->
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

<!-- React -->
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

<!-- TypeScript -->
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

<!-- Python -->
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

<!-- scikit-learn -->
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

<!-- AutoML (Custom logo via generic AI/ML icon) -->
![AutoML](https://img.shields.io/badge/AutoML-FF6F00?style=for-the-badge&logo=ai&logoColor=white)

<!-- License -->
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge&logo=gnu)


AutoML is an intuitive platform for machine learning workflows that simplifies data preprocessing, model training, and evaluation through a user-friendly interface.

## 🚀 Features

- **Data Preprocessing**: Clean and transform your data with built-in preprocessing tools
- **Feature Selection**: Identify the most important features for your models
- **Model Training**: Train both supervised and unsupervised machine learning models
- **Model Evaluation**: Evaluate model performance with comprehensive metrics
- **Interactive Visualizations**: Visualize results with interactive plots using Plotly
- **User Authentication**: Secure user authentication and project management

## 📋 Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- React Router
- Plotly.js for visualizations

### Backend
- Python
- Flask
- MongoDB
- Scikit-learn for ML models

## 🛠️ Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- npm or yarn

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/ZakariaZair1502/AutoML.git
cd AutoML

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv pfa_venv
source pfa_venv/bin/activate  # On Windows: pfa_venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python run.py
```

## 📊 Project Structure

```
AutoML/
├── backend/                # Python Flask backend
│   ├── routes.py           # API endpoints
│   ├── supervised_models.py # Supervised learning models
│   ├── unsupervised_models.py # Unsupervised learning models
│   └── run.py              # Flask application entry point
├── public/                 # Static assets
├── src/
│   ├── assets/             # Frontend assets
│   ├── components/         # React components
│   │   └── ui/             # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   └── styles/             # CSS styles
└── package.json            # Project dependencies
```

## 📱 Application Flow

1. **User Registration/Login**: Secure authentication system
2. **Project Creation**: Create a new ML project
3. **Data Upload**: Upload your dataset
4. **Preprocessing**: Clean and transform your data
5. **Feature Selection**: Select relevant features
6. **Model Selection**: Choose between supervised and unsupervised models
7. **Training**: Train your selected model
8. **Evaluation**: Evaluate model performance
9. **Results**: View and interpret results with interactive visualizations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the  GNU GPLv3 License - see the LICENSE file for details.

## 📞 Contact

For any questions or feedback, please reach out to [zakaria.zair.48@edu.uiz.ac.ma](mailto:zakaria.zair.48@edu.uiz.ac.ma).

---

Made with ❤️ by Zakaria ZAIR
