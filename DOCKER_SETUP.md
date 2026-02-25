# 🐳 VitaminAI - Docker Setup Guide

**Quick and Easy Setup with Docker**

This guide will help you set up and run VitaminAI using Docker in just a few minutes.

---

## 📋 What You Need

- **Windows 10/11**, **macOS 10.15+**, or **Linux (Ubuntu 20.04+)**
- **4GB RAM** minimum (8GB recommended)
- **5GB free disk space**
- **Internet connection** (for initial setup only)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Docker Desktop

#### For Windows:

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"

2. **Install Docker Desktop**
   - Run the downloaded `Docker Desktop Installer.exe`
   - Follow the installation wizard
   - Click "OK" when asked to use WSL 2
   - Click "Close and restart" when installation completes

3. **Start Docker Desktop**
   - Open Docker Desktop from Start Menu
   - Wait for Docker to start (green icon in system tray)
   - You may need to accept the service agreement

4. **Verify Installation**
   - Open Command Prompt (search "cmd" in Start Menu)
   - Type: `docker --version`
   - You should see: `Docker version 24.x.x` or similar



3. **Verify Installation**
```bash
docker --version
docker compose version
```

---

### Step 2: Get VitaminAI Project

1. **Download the Project**
   - Download the VitaminAI folder
   - Extract it to a location you can easily find

2. **Recommended Locations:**
   - **Windows**: `C:\VitaminAI`
---

### Step 3: Open Terminal/Command Prompt

#### Windows:
1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Navigate to project folder:
```cmd
cd C:\VitaminAI
```


### Step 4: Build and Start VitaminAI

**Run this single command:**

```bash
docker-compose up --build -d
```

**What happens:**
- Docker will download required images (first time only)
- Build three services: Frontend, Backend, AI Service
- Start all services in the background
- **This takes 5-10 minutes on first run**

**You'll see output like:**
```
[+] Building 45.2s (30/30) FINISHED
[+] Running 3/3
 ✔ Container vitaminai-ai_service-1  Started
 ✔ Container vitaminai-backend-1     Started
 ✔ Container vitaminai-frontend-1    Started
```

---

### Step 5: Verify Everything is Running

**Check service status:**

```bash
docker-compose ps
```

**You should see:**
```
NAME                     STATUS    PORTS
vitaminai-ai_service-1   Up        0.0.0.0:5001->5001/tcp
vitaminai-backend-1      Up        0.0.0.0:5000->5000/tcp
vitaminai-frontend-1     Up        0.0.0.0:3000->80/tcp
```

All three services should show **"Up"** status.

---

### Step 6: Access VitaminAI

**Open your web browser and go to:**

🌐 **Main Application**: http://localhost:3000

**Other Pages:**
- 👨‍⚕️ **Admin Dashboard**: http://localhost:3000/admin.html
- 👤 **Patient Portal**: http://localhost:3000/patient.html

---

## 🎯 Using VitaminAI

### Admin Dashboard (http://localhost:3000/admin.html)

1. **Add a Patient**
   - Click "Patient Management" tab
   - Click "Add New Patient"
   - Fill in patient details
   - Click "Save Patient"

2. **Analyze Medical Image**
   - Click "Diagnostic Center" tab
   - Select a patient from dropdown
   - Upload a medical image
   - Click "Validate Image (Stage 1)"
   - View results with vitamin recommendations

### Patient Portal (http://localhost:3000/patient.html)

1. **Login**
   - Enter your Patient ID
   - Click "Login"

2. **View Reports**
   - See your latest medical report
   - View health analytics graphs
   - Check diagnosis history

---

## 🛑 Stopping VitaminAI

**To stop all services:**

```bash
docker-compose down
```

**To stop and remove all data (reset):**

```bash
docker-compose down -v
```

---

## 🔄 Restarting VitaminAI

**If services are already built, just run:**

```bash
docker-compose up -d
```

**To restart a specific service:**

```bash
docker-compose restart backend
docker-compose restart ai_service
docker-compose restart frontend
```

---

## 📊 Useful Commands

### View Logs (Troubleshooting)

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
docker-compose logs backend
docker-compose logs ai_service
docker-compose logs frontend
```

Press `Ctrl+C` to stop viewing logs.

### Check Service Health

**Backend API:**
```bash
curl http://localhost:5000/api/health
```

**AI Service:**
```bash
curl http://localhost:5001/health
```

Or open these URLs in your browser.

### Rebuild After Code Changes

```bash
docker-compose up --build -d
```

---

## ❗ Troubleshooting

### Problem: "Port is already allocated"

**Solution:**
```bash
# Stop all services
docker-compose down

# Check what's using the port (Windows)
netstat -ano | findstr :3000

# Check what's using the port (macOS/Linux)
lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

### Problem: "Cannot connect to Docker daemon"

**Solution:**
1. Make sure Docker Desktop is running
2. Look for Docker icon in system tray (Windows) or menu bar (macOS)
3. If not running, start Docker Desktop
4. Wait 30 seconds and try again

### Problem: "docker-compose: command not found"

**Solution:**

**For Docker Desktop (Windows/macOS):**
- Use `docker compose` (with space) instead of `docker-compose`

**For Linux:**
```bash
# Install docker-compose
sudo apt-get install docker-compose-plugin
```

### Problem: Services won't start

**Solution:**
```bash
# Stop everything
docker-compose down

# Remove old containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up --build -d

# Check logs for errors
docker-compose logs -f
```

### Problem: "Out of disk space"

**Solution:**
```bash
# Clean up unused Docker resources
docker system prune -a

# This will free up space by removing:
# - Stopped containers
# - Unused networks
# - Dangling images
# - Build cache
```

### Problem: Slow performance

**Solution:**
1. **Increase Docker Resources:**
   - Open Docker Desktop
   - Go to Settings → Resources
   - Increase CPU and Memory allocation
   - Click "Apply & Restart"

2. **Close unnecessary applications**

3. **Use SSD instead of HDD if possible**

---

## 🔍 System Status Check

**Run this command to check everything:**

```bash
docker-compose ps && echo "---" && curl -s http://localhost:5000/api/health && echo "" && curl -s http://localhost:5001/health
```

**Expected output:**
```
NAME                     STATUS    PORTS
vitaminai-ai_service-1   Up        0.0.0.0:5001->5001/tcp
vitaminai-backend-1      Up        0.0.0.0:5000->5000/tcp
vitaminai-frontend-1     Up        0.0.0.0:3000->80/tcp
---
{"status":"healthy","service":"backend"}
{"status":"healthy","service":"ai_service","blip_loaded":true}
```

---

## 💾 Backup Your Data

**Patient data and images are stored in the `data` folder.**

**To backup:**

**Windows:**
```cmd
xcopy /E /I data data_backup
```

**macOS/Linux:**
```bash
cp -r data data_backup
```

**To restore:**
```bash
# Stop services first
docker-compose down

# Restore data
# Windows: xcopy /E /I data_backup data
# macOS/Linux: cp -r data_backup/* data/

# Start services
docker-compose up -d
```

---

## 🔒 Security Notes

- ✅ All processing is done locally
- ✅ No data sent to external servers
- ✅ Patient data stored in local database
- ✅ Images stored in local filesystem
- ⚠️ This is an educational system - not for clinical use

---

## 📱 Accessing from Other Devices

**To access VitaminAI from other devices on your network:**

1. **Find your computer's IP address:**

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```

2. **On other device, open browser and go to:**
```
http://YOUR_IP_ADDRESS:3000
```
Example: `http://192.168.1.100:3000`

---

## ✅ Quick Reference

### Start System
```bash
docker-compose up -d
```

### Stop System
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart System
```bash
docker-compose restart
```

### Rebuild System
```bash
docker-compose up --build -d
```

### Check Status
```bash
docker-compose ps
```

### Clean Everything
```bash
docker-compose down -v
docker system prune -a
```

---

## 📞 Need Help?

### Check These First:
1. ✅ Docker Desktop is running
2. ✅ All three services show "Up" status
3. ✅ No other applications using ports 3000, 5000, 5001
4. ✅ You're in the VitaminAI directory when running commands

### Common URLs:
- **Application**: http://localhost:3000
- **Admin**: http://localhost:3000/admin.html
- **Patient**: http://localhost:3000/patient.html
- **Backend Health**: http://localhost:5000/api/health
- **AI Health**: http://localhost:5001/health

---

## 🎉 Success Checklist

- [ ] Docker Desktop installed and running
- [ ] VitaminAI project downloaded and extracted
- [ ] Ran `docker-compose up --build -d` successfully
- [ ] All three services showing "Up" status
- [ ] Can access http://localhost:3000
- [ ] Landing page loads with animations
- [ ] Admin dashboard accessible
- [ ] Patient portal accessible
- [ ] System status shows "System Online"

**If all checked, you're ready to use VitaminAI! 🚀**

---

## 📖 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Desktop Manual**: https://docs.docker.com/desktop/
- **VitaminAI Full Guide**: See `SETUP_GUIDE.md` for detailed information

---

**⚠️ IMPORTANT DISCLAIMER**

This system is for **educational purposes only**. It is **NOT** a medical diagnostic tool. All outputs are educational and indicative only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment.

---

*VitaminAI v1.0.0 - AI-Powered Vitamin Deficiency Detection Platform*
*Powered by Docker 🐳*

