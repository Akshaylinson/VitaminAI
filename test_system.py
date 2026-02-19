import requests
import json
import time

# Configuration
BACKEND_URL = 'http://localhost:5000/api'
AI_SERVICE_URL = 'http://localhost:5001'

def test_health_checks():
    """Test if all services are running"""
    print("🔍 Testing service health...")
    
    try:
        # Test backend
        response = requests.get(f'{BACKEND_URL}/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend service is healthy")
        else:
            print("❌ Backend service is not responding correctly")
            
        # Test AI service
        response = requests.get(f'{AI_SERVICE_URL}/health', timeout=5)
        if response.status_code == 200:
            print("✅ AI service is healthy")
        else:
            print("❌ AI service is not responding correctly")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to services: {e}")
        return False
    
    return True

def test_patient_creation():
    """Test patient creation"""
    print("\n👤 Testing patient creation...")
    
    patient_data = {
        "patient_id": "TEST001",
        "name": "Test Patient",
        "address": "123 Test Street, Test City",
        "phone": "555-0123"
    }
    
    try:
        response = requests.post(f'{BACKEND_URL}/patients', 
                               json=patient_data, 
                               timeout=10)
        
        if response.status_code == 200:
            print("✅ Patient created successfully")
            return True
        else:
            print(f"❌ Failed to create patient: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error creating patient: {e}")
        return False

def test_image_validation():
    """Test image validation endpoint"""
    print("\n🖼️ Testing image validation...")
    
    # Create a simple test image (1x1 pixel)
    from PIL import Image
    import io
    
    # Create a small test image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    try:
        response = requests.post(f'{AI_SERVICE_URL}/validate',
                               files={'image': ('test.jpg', img_bytes, 'image/jpeg')},
                               timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Image validation successful: {result}")
            return True
        else:
            print(f"❌ Image validation failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error in image validation: {e}")
        return False

def test_disease_detection():
    """Test disease detection endpoint"""
    print("\n🔬 Testing disease detection...")
    
    # Create a simple test image
    from PIL import Image
    import io
    
    img = Image.new('RGB', (224, 224), color='blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    try:
        response = requests.post(f'{AI_SERVICE_URL}/detect',
                               files={'image': ('test.jpg', img_bytes, 'image/jpeg')},
                               timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Disease detection successful: {result}")
            return True
        else:
            print(f"❌ Disease detection failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error in disease detection: {e}")
        return False

def test_full_analysis():
    """Test the complete analysis pipeline"""
    print("\n🔄 Testing full analysis pipeline...")
    
    # Create a test image
    from PIL import Image
    import io
    
    img = Image.new('RGB', (300, 300), color='green')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    try:
        # Prepare form data
        files = {'image': ('test_analysis.jpg', img_bytes, 'image/jpeg')}
        data = {'patient_id': 'TEST001'}
        
        response = requests.post(f'{BACKEND_URL}/analyze',
                               files=files,
                               data=data,
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Full analysis successful: {result}")
            return True
        else:
            print(f"❌ Full analysis failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error in full analysis: {e}")
        return False

def test_patient_reports():
    """Test patient reports retrieval"""
    print("\n📊 Testing patient reports...")
    
    try:
        response = requests.get(f'{BACKEND_URL}/reports/TEST001', timeout=10)
        
        if response.status_code == 200:
            reports = response.json()
            print(f"✅ Retrieved {len(reports)} reports for patient TEST001")
            return True
        else:
            print(f"❌ Failed to retrieve reports: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error retrieving reports: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Vitamin Deficiency Detection System - Test Suite")
    print("=" * 60)
    
    # Wait for services to start
    print("⏳ Waiting for services to start...")
    time.sleep(5)
    
    tests = [
        test_health_checks,
        test_patient_creation,
        test_image_validation,
        test_disease_detection,
        test_full_analysis,
        test_patient_reports
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 60)
    print(f"📈 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the logs above for details.")
    
    return passed == total

if __name__ == "__main__":
    main()