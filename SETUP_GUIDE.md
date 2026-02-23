# 🧬 VitaminAI - Complete Setup Guide

This guide will help you set up and run the VitaminAI system from scratch, even if you don't have Docker installed.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
   - [Method 1: Using Docker (Recommended)](#method-1-using-docker-recommended)
   - [Method 2: Manual Setup (Without Docker)](#method-2-manual-setup-without-docker)
3. [Running the Application](#running-the-application)
4. [Accessing the System](#accessing-the-system)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## 🖥️ System Requirements

### Minimum Requirements:
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 5GB free space
- **Internet**: Required for initial setup only

### Software Requirements:
- **For Docker Method**: Docker Desktop
- **For Manual Method**: Python 3.9+, Node.js (optional for frontend)

---

## 🚀 Installation Methods

## Method 1: Using Docker (Recommended)

Docker simplifies the setup by packaging everything into containers. This is the easiest and most reliable method.

### Step 1: Install Docker Desktop

#### For Windows:
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer (`Docker Desktop Installer.exe`)
3. Follow the installation wizard
4. Restart your computer when prompted
5. Launch Docker Desktop from Start Menu
6. Wait for Docker to start (you'll see a green icon in the system tray)

#### For macOS:
1. Download Docker Desktop for Mac from: https://www.docker.com/products/docker-desktop/
2. Open the `.dmg` file
3. Drag Docker to Applications folder
4. Launch Docker from Applications
5. Grant necessary permissions when prompted
6. Wait for Docker to start (whale icon in menu bar)

#### For Linux (Ubuntu/Debian):
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
sudo docker --version
```

### Step 2: Verify Docker Installation

Open Command Prompt (Windows) or Terminal (macOS/Linux) and run:

```bash
docker --version
docker-compose --version
```

You should see version numbers displayed. If not, restart your computer and try again.

### Step 3: Download VitaminAI Project

1. Download the VitaminAI project folder
2. Extract it to a location like `C:\VitaminAI` (Windows) or `~/VitaminAI` (macOS/Linux)
3. Open Command Prompt/Terminal
4. Navigate to the project folder:

**Windows:**
```cmd
cd C:\VitaminAI
```

**macOS/Linux:**
```bash
cd ~/VitaminAI
```

### Step 4: Build and Run with Docker

Run the following command in the VitaminAI directory:

```bash
docker-compose up --build -d
```

**What this does:**
- `docker-compose`: Uses Docker Compose to manage multiple containers
- `up`: Starts the services
- `--build`: Builds the Docker images
- `-d`: Runs in detached mode (background)

**First-time setup will take 5-10 minutes** as it downloads dependencies.

### Step 5: Verify Services are Running

Check if all services are running:

```bash
docker-compose ps
```

You should see three services running:
- `vitaminai-frontend-1` (Port 3000)
- `vitaminai-backend-1` (Port 5000)
- `vitaminai-ai_service-1` (Port 5001)

### Step 6: Access the Application

Open your web browser and go to:
- **Main Application**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin.html
- **Patient Portal**: http://localhost:3000/patient.html

### Stopping the Application

To stop all services:

```bash
docker-compose down
```

To restart services:

```bash
docker-compose restart
```

---

## Method 2: Manual Setup (Without Docker)

If you cannot use Docker, follow these steps to set up each component manually.

### Prerequisites Installation

#### Step 1: Install Python 3.9+

**Windows:**
1. Download Python from: https://www.python.org/downloads/
2. Run the installer
3. ✅ **IMPORTANT**: Check "Add Python to PATH" during installation
4. Click "Install Now"
5. Verify installation:
```cmd
python --version
pip --version
```

**macOS:**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python@3.9

# Verify
python3 --version
pip3 --version
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install python3.9 python3-pip python3-venv
python3 --version
pip3 --version
```

### Step 2: Set Up Backend Service

1. Open Command Prompt/Terminal
2. Navigate to backend directory:

**Windows:**
```cmd
cd C:\VitaminAI\backend
```

**macOS/Linux:**
```bash
cd ~/VitaminAI/backend
```

3. Create virtual environment:

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create necessary directories:

**Windows:**
```cmd
mkdir ..\data\uploads
mkdir ..\data\database
```

**macOS/Linux:**
```bash
mkdir -p ../data/uploads
mkdir -p ../data/database
```

6. Run the backend:
```bash
python app/main.py
```

**Keep this terminal window open.** Backend will run on http://localhost:5000

### Step 3: Set Up AI Service

1. Open a **NEW** Command Prompt/Terminal window
2. Navigate to ai_service directory:

**Windows:**
```cmd
cd C:\VitaminAI\ai_service
```

**macOS/Linux:**
```bash
cd ~/VitaminAI/ai_service
```

3. Create virtual environment:

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

**Note:** This will download AI models (BLIP) which may take 5-10 minutes and requires ~2GB of space.

5. Create models directory:

**Windows:**
```cmd
mkdir models
```

**macOS/Linux:**
```bash
mkdir -p models
```

6. Run the AI service:
```bash
python main.py
```

**Keep this terminal window open.** AI Service will run on http://localhost:5001

### Step 4: Set Up Frontend

#### Option A: Using Python HTTP Server (Simple)

1. Open a **NEW** Command Prompt/Terminal window
2. Navigate to frontend directory:

**Windows:**
```cmd
cd C:\VitaminAI\frontend\public
```

**macOS/Linux:**
```bash
cd ~/VitaminAI/frontend/public
```

3. Start HTTP server:

**Windows:**
```cmd
python -m http.server 3000
```

**macOS/Linux:**
```bash
python3 -m http.server 3000
```

**Keep this terminal window open.** Frontend will run on http://localhost:3000

#### Option B: Using Node.js (Advanced)

If you have Node.js installed:

1. Install http-server globally:
```bash
npm install -g http-server
```

2. Navigate to frontend directory and run:
```bash
cd frontend/public
http-server -p 3000
```

### Step 5: Verify All Services

You should now have **3 terminal windows open**:
1. Backend (Port 5000)
2. AI Service (Port 5001)
3. Frontend (Port 3000)

Test each service:
- Backend: http://localhost:5000/api/health
- AI Service: http://localhost:5001/health
- Frontend: http://localhost:3000

---

## 🌐 Accessing the System

Once all services are running, open your web browser:

### Main Pages:
- **Landing Page**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin.html
- **Patient Portal**: http://localhost:3000/patient.html

### Admin Dashboard Features:
1. **Patient Management**: Add and manage patient records
2. **Image Analysis**: Upload medical images for analysis
3. **Stage 1 Validation**: Verify if image is medical
4. **Stage 2 Detection**: Detect diseases from images
5. **Stage 3 Inference**: Get vitamin deficiency recommendations

### Patient Portal Features:
1. **Login**: Enter Patient ID to access reports
2. **View Reports**: See analysis results
3. **Health Analytics**: View charts and trends
4. **History**: Track diagnosis over time

---

## 🔧 Troubleshooting

### Issue 1: "Port already in use"

**Problem**: Another application is using ports 3000, 5000, or 5001

**Solution**:

**Windows:**
```cmd
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

Or change the port in the respective service file.

### Issue 2: "Module not found" errors

**Problem**: Python dependencies not installed correctly

**Solution**:
```bash
# Activate virtual environment first
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Issue 3: Docker not starting

**Problem**: Docker Desktop won't start

**Solution**:
1. Restart your computer
2. Check if virtualization is enabled in BIOS
3. On Windows, enable WSL 2:
```cmd
wsl --install
wsl --set-default-version 2
```

### Issue 4: "Cannot connect to backend"

**Problem**: Frontend can't reach backend API

**Solution**:
1. Verify backend is running: http://localhost:5000/api/health
2. Check firewall settings
3. Ensure all services are running on correct ports

### Issue 5: AI model download fails

**Problem**: BLIP model download interrupted

**Solution**:
```bash
# Manually download models
python -c "from transformers import BlipProcessor, BlipForConditionalGeneration; BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base'); BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base')"
```

### Issue 6: Database errors

**Problem**: SQLite database issues

**Solution**:
```bash
# Delete and recreate database
# Navigate to data/database folder
rm vitamin_system.db  # macOS/Linux
del vitamin_system.db  # Windows

# Restart backend - it will create a new database
```

---

## ❓ FAQ

### Q1: Do I need internet after initial setup?
**A:** No, the system runs completely offline after downloading dependencies.

### Q2: Can I use a different port?
**A:** Yes, modify the port numbers in:
- `docker-compose.yml` (Docker method)
- Service files (Manual method)

### Q3: How do I update the system?
**A:** 
- **Docker**: Run `docker-compose down` then `docker-compose up --build -d`
- **Manual**: Pull latest code and restart services

### Q4: Where is patient data stored?
**A:** In `data/database/vitamin_system.db` (SQLite database)

### Q5: Can I add custom diseases?
**A:** Yes, edit `data/disease_vitamin_mapping.csv`

### Q6: How do I backup data?
**A:** Copy the entire `data` folder to a safe location

### Q7: System is slow, what can I do?
**A:** 
- Close unnecessary applications
- Increase RAM allocation for Docker
- Use SSD instead of HDD

### Q8: Can multiple users access simultaneously?
**A:** Yes, the system supports multiple concurrent users

### Q9: How do I reset everything?
**A:**
- **Docker**: `docker-compose down -v` (removes volumes)
- **Manual**: Delete `data` folder and restart

### Q10: Is GPU required?
**A:** No, but GPU acceleration will improve AI inference speed

---

## 📞 Support

### Getting Help:
1. Check this guide first
2. Review error messages carefully
3. Check logs:
   - **Docker**: `docker-compose logs`
   - **Manual**: Check terminal output

### Common Commands Reference:

**Docker:**
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild after code changes
docker-compose up --build -d
```

**Manual Setup:**
```bash
# Activate virtual environment
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Run backend
cd backend && python app/main.py

# Run AI service
cd ai_service && python main.py

# Run frontend
cd frontend/public && python -m http.server 3000
```

---

## 🎯 Quick Start Checklist

- [ ] Docker Desktop installed and running (Method 1)
  OR
- [ ] Python 3.9+ installed (Method 2)
- [ ] Project files extracted to local folder
- [ ] All dependencies installed
- [ ] All three services running
- [ ] Can access http://localhost:3000
- [ ] Admin dashboard loads correctly
- [ ] Patient portal loads correctly

---

## 🔒 Security Notes

- System runs locally - no data sent to external servers
- Patient data stored in local SQLite database
- Images stored in local filesystem
- No authentication required (educational system)
- For production use, implement proper authentication

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Port 3000)           │
│              HTML/CSS/JavaScript                │
└────────────────┬────────────────────────────────┘
                 │
                 ├──────────────┬─────────────────┐
                 │              │                 │
        ┌────────▼──────┐  ┌───▼──────────┐  ┌──▼──────────┐
        │   Backend     │  │  AI Service  │  │  Database   │
        │  (Port 5000)  │  │ (Port 5001)  │  │   SQLite    │
        │     Flask     │  │  TensorFlow  │  │             │
        └───────────────┘  └──────────────┘  └─────────────┘
```

---

## 📝 Version Information

- **VitaminAI Version**: 1.0.0
- **Python**: 3.9+
- **Flask**: 2.3.3
- **TensorFlow**: 2.13.0
- **Docker**: 20.10+

---

## ✅ Success Indicators

Your system is working correctly if:
1. ✅ All three services show "healthy" status
2. ✅ Landing page loads with animations
3. ✅ Admin dashboard shows "System Online" indicator
4. ✅ Can create patient records
5. ✅ Can upload and analyze images
6. ✅ Patient portal shows login screen

---

**🎉 Congratulations! Your VitaminAI system is now ready to use.**

For educational purposes only. Not for clinical diagnosis.

---

*Last Updated: 2024*
*VitaminAI - AI-Powered Vitamin Deficiency Detection Platform*



