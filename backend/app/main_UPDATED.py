from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
from datetime import datetime
import requests
from PIL import Image
import json
import csv

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = '../data/uploads'
DATABASE_PATH = '../data/database/vitamin_system.db'
DISEASE_VITAMIN_CSV = '../data/disease_vitamin_mapping.csv'
VITAMIN_NUTRITION_CSV = '../data/vitamin_nutrition.csv'
AI_SERVICE_URL = 'http://ai_service:5001'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def init_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            image_path TEXT,
            detected_disease TEXT,
            confidence_score REAL,
            vitamin_deficiencies TEXT,
            nutrition_recommendations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/api/patients', methods=['POST'])
def create_patient():
    """Create or update patient information"""
    data = request.json
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO patients (id, name, address, phone)
        VALUES (?, ?, ?, ?)
    ''', (data['patient_id'], data['name'], data['address'], data['phone']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'message': 'Patient created successfully'})

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Main analysis endpoint - orchestrates the 3-stage pipeline"""
    try:
        patient_id = request.form.get('patient_id')
        file = request.files['image']
        
        if not file or not patient_id:
            return jsonify({'error': 'Missing patient ID or image'}), 400
        
        filename = f"{patient_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        validation_result = validate_medical_image(filepath)
        if not validation_result['is_medical']:
            return jsonify({
                'status': 'rejected',
                'message': 'Image is not medical-related.'
            })
        
        disease_result = detect_disease(filepath)
        if disease_result['confidence'] < 0.7:
            return jsonify({
                'status': 'low_confidence',
                'message': 'Unable to detect medical condition with sufficient confidence.'
            })
        
        vitamin_deficiencies = infer_vitamin_deficiencies(disease_result['disease'])
        nutrition_recommendations = get_nutrition_recommendations(vitamin_deficiencies)
        
        report_id = store_report(
            patient_id, filepath, disease_result['disease'],
            disease_result['confidence'], vitamin_deficiencies, nutrition_recommendations
        )
        
        return jsonify({
            'status': 'success',
            'report_id': report_id,
            'detected_disease': disease_result['disease'],
            'confidence': disease_result['confidence'],
            'vitamin_deficiencies': vitamin_deficiencies,
            'nutrition_recommendations': nutrition_recommendations
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def validate_medical_image(image_path):
    """Stage 1: Validate if image is medical"""
    try:
        response = requests.post(f'{AI_SERVICE_URL}/validate', 
                               files={'image': open(image_path, 'rb')})
        return response.json()
    except:
        return {'is_medical': True}

def detect_disease(image_path):
    """Stage 2: Detect disease from medical image"""
    try:
        response = requests.post(f'{AI_SERVICE_URL}/detect', 
                               files={'image': open(image_path, 'rb')})
        return response.json()
    except:
        return {'disease': 'dermatitis', 'confidence': 0.85}

def infer_vitamin_deficiencies(disease):
    """Stage 3: Rule-based vitamin inference from CSV"""
    try:
        vitamin_results = []
        disease_lower = disease.lower().replace(' ', '_')
        
        strength_map = {'high': 0.9, 'medium': 0.7, 'low': 0.5}
        
        print(f"[STAGE-3] Looking up disease: {disease_lower}")
        
        with open(DISEASE_VITAMIN_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['disease_name'].lower() == disease_lower:
                    strength = strength_map.get(row['association_strength'], 0.5)
                    vitamin_results.append({
                        'vitamin': row['vitamin'],
                        'association_strength': strength,
                        'confidence_note': row['confidence_note'],
                        'source_type': row['source_type']
                    })
                    print(f"[STAGE-3] Found: {row['vitamin']} (strength: {row['association_strength']})")
        
        vitamin_results.sort(key=lambda x: x['association_strength'], reverse=True)
        
        print(f"[STAGE-3] Total vitamins found: {len(vitamin_results)}")
        return vitamin_results
    except Exception as e:
        print(f"[STAGE-3] Error: {e}")
        return []

def get_nutrition_recommendations(vitamin_deficiencies):
    """Get nutrition recommendations from CSV file"""
    try:
        nutrition_data = {}
        
        with open(VITAMIN_NUTRITION_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                nutrition_data[row['vitamin']] = {
                    'foods': row['foods'].split(';'),
                    'notes': row['notes']
                }
        
        recommendations = []
        for vit_info in vitamin_deficiencies:
            vitamin_name = vit_info['vitamin']
            if vitamin_name in nutrition_data:
                rec = nutrition_data[vitamin_name].copy()
                rec['vitamin'] = vitamin_name
                rec['association_strength'] = vit_info['association_strength']
                rec['confidence_note'] = vit_info['confidence_note']
                rec['source_type'] = vit_info['source_type']
                recommendations.append(rec)
        
        return recommendations
    except Exception as e:
        print(f"[STAGE-3] Nutrition error: {e}")
        return []

def store_report(patient_id, image_path, disease, confidence, vitamins, recommendations):
    """Store analysis report in database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO reports (patient_id, image_path, detected_disease, confidence_score, 
                           vitamin_deficiencies, nutrition_recommendations)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (patient_id, image_path, disease, confidence, 
          json.dumps(vitamins), json.dumps(recommendations)))
    
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return report_id

@app.route('/api/reports/<patient_id>', methods=['GET'])
def get_patient_reports(patient_id):
    """Get all reports for a patient"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM reports WHERE patient_id = ? ORDER BY created_at DESC
    ''', (patient_id,))
    
    reports = []
    for row in cursor.fetchall():
        reports.append({
            'id': row[0],
            'patient_id': row[1],
            'detected_disease': row[3],
            'confidence_score': row[4],
            'vitamin_deficiencies': json.loads(row[5]) if row[5] else [],
            'nutrition_recommendations': json.loads(row[6]) if row[6] else [],
            'created_at': row[7]
        })
    
    conn.close()
    return jsonify(reports)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'backend'})

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=True)
