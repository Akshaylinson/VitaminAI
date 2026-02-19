# 🧬 Vitamin Deficiency Detection System

An academic, image-based analysis platform designed to provide indicative insights into possible vitamin deficiencies based on visible medical conditions observed in patient images.

## ⚠️ Important Disclaimer

**This system is for educational purposes only and is NOT a medical diagnostic tool. All outputs are educational and indicative only. Please consult a healthcare professional for proper medical diagnosis and treatment.**

## 🏗️ System Architecture

The system follows a modular, three-stage pipeline architecture:

1. **Stage 1**: Medical Image Validation
2. **Stage 2**: Disease Detection Using AI Model
3. **Stage 3**: Rule-Based Vitamin Inference Engine

### Components

- **Frontend**: HTML/CSS/JavaScript interface
- **Backend**: Flask REST API service
- **AI Service**: TensorFlow-based image analysis
- **Database**: SQLite for report storage
- **Rule Engine**: CSV-based disease-vitamin mappings

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- At least 4GB RAM available
- Windows 10/11 (for the provided batch scripts)

### Installation & Startup

1. **Clone or download the project**
   ```
   cd VitaminAI
   ```

2. **Start the system**
   ```
   start.bat
   ```
   
   Or manually with Docker Compose:
   ```
   docker-compose up --build -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:5001

### Stopping the System

```
stop.bat
```

Or manually:
```
docker-compose down
```

## 📱 Usage Guide

### Admin Panel

1. **Patient Registration**
   - Enter patient ID, name, address, and phone number
   - Click "Save Patient Info"

2. **Image Analysis**
   - Enter the patient ID
   - Upload a medical image (JPG, PNG)
   - Click "Analyze Image"
   - View results including detected conditions and vitamin recommendations

### Patient Dashboard

1. **View Reports**
   - Enter your patient ID
   - Click "View My Reports"
   - Browse historical analysis results

## 🔬 Technical Details

### Three-Stage Pipeline

#### Stage 1: Medical Image Validation
- Validates if uploaded image is medically relevant
- Prevents non-medical images from entering the pipeline
- Uses lightweight CNN or rule-based feature analysis

#### Stage 2: Disease Detection
- Identifies visible medical conditions from validated images
- Uses pre-trained CNN model (or rule-based fallback)
- Outputs disease name and confidence score

#### Stage 3: Vitamin Inference
- Maps detected diseases to possible vitamin deficiencies
- Uses rule-based CSV lookup system
- Provides nutrition recommendations

### API Endpoints

#### Backend Service (Port 5000)
- `POST /api/patients` - Create/update patient information
- `POST /api/analyze` - Analyze medical image
- `GET /api/reports/{patient_id}` - Get patient reports
- `GET /api/health` - Health check

#### AI Service (Port 5001)
- `POST /validate` - Validate medical image
- `POST /detect` - Detect disease from image
- `GET /health` - Health check

## 📊 Data Files

### Disease-Vitamin Mapping
Location: `data/disease_vitamin_mapping.csv`

Contains mappings between medical conditions and vitamin deficiencies with association strengths.

### Nutrition Recommendations
Location: `data/nutrition_recommendations.json`

Contains detailed nutrition information for each vitamin including:
- Food sources
- Daily requirements
- Health notes
- Deficiency symptoms

## 🗄️ Database Schema

### Patients Table
- `id` (TEXT, PRIMARY KEY)
- `name` (TEXT)
- `address` (TEXT)
- `phone` (TEXT)
- `created_at` (TIMESTAMP)

### Reports Table
- `id` (INTEGER, PRIMARY KEY)
- `patient_id` (TEXT, FOREIGN KEY)
- `image_path` (TEXT)
- `detected_disease` (TEXT)
- `confidence_score` (REAL)
- `vitamin_deficiencies` (TEXT, JSON)
- `nutrition_recommendations` (TEXT, JSON)
- `created_at` (TIMESTAMP)

## 🔧 Development

### Project Structure
```
VitaminAI/
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── ai_service/
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── script.js
│   ├── Dockerfile
│   └── nginx.conf
├── data/
│   ├── disease_vitamin_mapping.csv
│   ├── nutrition_recommendations.json
│   ├── uploads/
│   └── database/
├── docker-compose.yml
├── start.bat
└── stop.bat
```

### Adding New Diseases

1. Update `data/disease_vitamin_mapping.csv`
2. Add nutrition information to `data/nutrition_recommendations.json`
3. Restart the system

### Customizing AI Models

Replace the simple models in `ai_service/main.py` with your trained models:
- Place model files in `ai_service/models/`
- Update model loading logic
- Ensure input preprocessing matches your model requirements

## 🧪 Testing

### Manual Testing

1. **Valid Medical Image**: Upload a skin condition image
2. **Invalid Image**: Upload a non-medical image (should be rejected)
3. **Patient Reports**: Create multiple reports and verify patient dashboard

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Create patient
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"P001","name":"Test Patient","address":"123 Main St","phone":"555-0123"}'
```

## 🔒 Security Considerations

- All processing is done locally (no external API calls)
- Patient data stored in local SQLite database
- Images stored in local filesystem
- No sensitive data transmitted over network

## 📈 Performance

### System Requirements
- **Minimum**: 4GB RAM, 2GB storage
- **Recommended**: 8GB RAM, 5GB storage
- **CPU**: Multi-core processor recommended for AI inference

### Optimization Tips
- Use GPU-enabled Docker images for faster AI inference
- Implement image compression for storage efficiency
- Add database indexing for large patient datasets

## 🐛 Troubleshooting

### Common Issues

1. **Docker not starting**
   - Ensure Docker Desktop is running
   - Check available system resources

2. **Port conflicts**
   - Modify ports in `docker-compose.yml`
   - Ensure ports 3000, 5000, 5001 are available

3. **AI service errors**
   - Check TensorFlow compatibility
   - Verify model files exist

4. **Database issues**
   - Check file permissions in `data/database/`
   - Verify SQLite installation

### Logs

View system logs:
```bash
docker-compose logs -f
```

View specific service logs:
```bash
docker-compose logs backend
docker-compose logs ai_service
docker-compose logs frontend
```

## 📚 Educational Value

This project demonstrates:
- **Modular Architecture**: Separation of concerns
- **AI Integration**: Practical machine learning application
- **Rule-Based Systems**: Medical knowledge representation
- **Full-Stack Development**: Frontend, backend, and AI services
- **Containerization**: Docker and microservices
- **Database Design**: Relational data modeling
- **API Design**: RESTful service architecture

## 🤝 Contributing

This is an academic project. For educational enhancements:
1. Fork the repository
2. Create feature branches
3. Add comprehensive tests
4. Update documentation
5. Submit pull requests

## 📄 License

This project is for educational purposes. Please ensure compliance with local regulations when using medical-related AI systems.

## 🙏 Acknowledgments

- TensorFlow team for the ML framework
- Flask community for the web framework
- Medical professionals who provided domain knowledge
- Open source community for various tools and libraries

---

**Remember**: This system is designed for educational purposes and should never be used as a substitute for professional medical advice, diagnosis, or treatment.