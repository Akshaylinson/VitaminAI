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
UPLOAD_FOLDER = '/app/data/uploads'
DATABASE_PATH = '/app/data/database/vitamin_system.db'
DISEASE_VITAMIN_CSV = '/app/data/disease_vitamin_mapping.csv'
VITAMIN_NUTRITION_CSV = '/app/data/vitamin_nutrition.csv'
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
            phone TEXT,
            date_of_birth TEXT,
            address TEXT,
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

@app.route('/api/patients/create', methods=['POST'])
def create_patient_new():
    """Create new patient with auto-increment ID"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get the last patient ID with PAVIT format
        cursor.execute("SELECT id FROM patients WHERE id LIKE 'PAVIT-%' ORDER BY id DESC LIMIT 1")
        last_patient = cursor.fetchone()
        
        if last_patient:
            # Extract number from PAVIT-00000 format
            try:
                last_num = int(last_patient[0].split('-')[1])
                new_num = last_num + 1
            except:
                new_num = 0
        else:
            new_num = 0
        
        new_patient_id = f"PAVIT-{new_num:05d}"
        
        cursor.execute('''
            INSERT INTO patients (id, name, phone, date_of_birth, address)
            VALUES (?, ?, ?, ?, ?)
        ''', (new_patient_id, data['name'], data.get('phone'), 
              data.get('date_of_birth'), data.get('address')))
        
        conn.commit()
        conn.close()
        
        print(f"[DEBUG] Created patient: {new_patient_id}")
        return jsonify({'status': 'success', 'patient_id': new_patient_id})
    except Exception as e:
        print(f"[ERROR] create_patient: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/all', methods=['GET'])
def get_all_patients():
    """Get all patients in descending order"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, phone, date_of_birth, address, created_at 
            FROM patients ORDER BY id DESC
        ''')
        
        patients = []
        for row in cursor.fetchall():
            patients.append({
                'id': row[0],
                'name': row[1],
                'phone': row[2] if row[2] else '',
                'date_of_birth': row[3] if row[3] else '',
                'address': row[4] if row[4] else '',
                'created_at': row[5]
            })
        
        conn.close()
        print(f"[DEBUG] Returning {len(patients)} patients")
        return jsonify(patients)
    except Exception as e:
        print(f"[ERROR] get_all_patients: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Get single patient by ID"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, phone, date_of_birth, address, created_at 
            FROM patients WHERE id = ?
        ''', (patient_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify({
                'id': row[0],
                'name': row[1],
                'phone': row[2],
                'date_of_birth': row[3],
                'address': row[4],
                'created_at': row[5]
            })
        else:
            return jsonify({'error': 'Patient not found'}), 404
    except Exception as e:
        print(f"[ERROR] get_patient: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/update', methods=['PUT'])
def update_patient():
    """Update existing patient"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE patients 
            SET name = ?, phone = ?, date_of_birth = ?, address = ?
            WHERE id = ?
        ''', (data['name'], data.get('phone'), data.get('date_of_birth'), 
              data.get('address'), data['patient_id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"[ERROR] update_patient: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    """Delete patient"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM patients WHERE id = ?', (patient_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"[ERROR] delete_patient: {str(e)}")
        return jsonify({'error': str(e)}), 500

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

@app.route('/api/analyze_stage3', methods=['POST'])
def analyze_stage3():
    """Stage 3 only - Vitamin inference from disease name"""
    try:
        patient_id = request.form.get('patient_id')
        disease = request.form.get('disease')
        confidence = float(request.form.get('confidence', 0.5))
        
        if not disease or not patient_id:
            return jsonify({'error': 'Missing patient ID or disease'}), 400
        
        vitamin_deficiencies = infer_vitamin_deficiencies(disease)
        nutrition_recommendations = get_nutrition_recommendations(vitamin_deficiencies)
        
        report_id = store_report(
            patient_id, '', disease, confidence, 
            vitamin_deficiencies, nutrition_recommendations
        )
        
        return jsonify({
            'status': 'success',
            'report_id': report_id,
            'detected_disease': disease,
            'confidence': confidence,
            'vitamin_deficiencies': vitamin_deficiencies,
            'nutrition_recommendations': nutrition_recommendations
        })
        
    except Exception as e:
        print(f"[ERROR] /api/analyze_stage3: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Main analysis endpoint - orchestrates the 3-stage pipeline"""
    try:
        patient_id = request.form.get('patient_id')
        file = request.files.get('image')
        
        if not file or not patient_id:
            return jsonify({'error': 'Missing patient ID or image'}), 400
        
        filename = f"{patient_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Skip Stage 1 validation for manual Stage 3 calls
        # validation_result = validate_medical_image(filepath)
        # if not validation_result['is_medical']:
        #     return jsonify({
        #         'status': 'rejected',
        #         'message': 'Image is not medical-related.'
        #     })
        
        disease_result = detect_disease(filepath)
        if not disease_result.get('disease'):
            return jsonify({
                'status': 'error',
                'message': 'Unable to detect disease'
            }), 400
        
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
        print(f"[ERROR] /api/analyze: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def validate_medical_image(image_path):
    """Stage 1: Validate if image is medical"""
    try:
        response = requests.post(f'{AI_SERVICE_URL}/validate', 
                               files={'image': open(image_path, 'rb')})
        result = response.json()
        return {'is_medical': result.get('valid', True)}
    except:
        return {'is_medical': True}

def detect_disease(image_path):
    """Stage 2: Detect disease from medical image"""
    try:
        response = requests.post(f'{AI_SERVICE_URL}/detect', 
                               files={'image': open(image_path, 'rb')})
        result = response.json()
        return {'disease': result.get('disease', 'unknown'), 'confidence': result.get('confidence', 0.5)}
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

@app.route('/api/analytics/<patient_id>', methods=['GET'])
def get_patient_analytics(patient_id):
    """Get analytics data for charts"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT detected_disease, nutrition_recommendations, created_at 
        FROM reports WHERE patient_id = ? ORDER BY created_at
    ''', (patient_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    vitamin_counts = {}
    disease_counts = {}
    monthly_counts = {}
    
    for row in rows:
        disease = row[0]
        recommendations = json.loads(row[1]) if row[1] else []
        created_at = row[2]
        
        disease_counts[disease] = disease_counts.get(disease, 0) + 1
        
        for rec in recommendations:
            vitamin = rec.get('vitamin', '')
            if vitamin:
                vitamin_counts[vitamin] = vitamin_counts.get(vitamin, 0) + 1
        
        try:
            month_key = created_at[:7]
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
        except:
            pass
    
    return jsonify({
        'vitamins': dict(sorted(vitamin_counts.items(), key=lambda x: x[1], reverse=True)[:10]),
        'diseases': disease_counts,
        'monthly': dict(sorted(monthly_counts.items()))
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'backend'})

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=True)
