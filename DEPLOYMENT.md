# KAVACH-AI: Production Deployment Guide

## 1. Environment Requirements

* **Node.js**: 20.x or higher
* **Python**: 3.10 or higher
* **GPU (Recommended for Server Inference)**: NVIDIA T4 / L4 / RTX 4090 with CUDA 12.x
* **Memory**: Minimum 8GB RAM (16GB recommended for video streaming)

---

## 2. Monorepo Directory Structure

```
/
├── server.ts                 # Full-stack Express REST API backend
├── src/                      # React SPA with TypeScript & Tailwind CSS v4
│   ├── components/           # Modular UI & Enterprise White Layouts
│   ├── services/             # Storage, Computer Vision, and Mock data engines
│   └── types/                # Strict TypeScript schemas
├── ml/                       # Machine Learning Directory
│   ├── dataset/              # YOLO dataset images & labels
│   │   ├── train/
│   │   ├── val/
│   │   ├── test/
│   │   └── dataset.yaml      # Ultralytics YAML specification
│   ├── models/               # Model registry & weights
│   └── scripts/              # Inspection, training & evaluation scripts
├── docs/                     # Statutory documentation & guides
└── package.json
```

---

## 3. Local & Server Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build frontend production assets
npm run build

# 3. Start production server
npm start
```

---

## 4. Docker Deployment

```dockerfile
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.10-slim
WORKDIR /app
RUN pip install torch ultralytics opencv-python-headless
COPY --from=frontend /app /app
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 5. Connecting CCTV RTSP Cameras in Production

In production environments, configure on-premises IP cameras to stream RTSP over TCP:
`rtsp://<user>:<pass>@<camera_ip>:554/h264/ch1/main`

Credentials are encrypted in the backend database and never sent to browser clients.
