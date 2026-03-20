## Part 4: Local Development Setup

### Overview

All infrastructure runs locally via Docker Compose, mirroring the production AWS architecture as closely as possible. This lets you iterate fast without incurring cloud costs during development.

---

### Notes

- Project name: **digital-closet**
- Mac type: **Intel Mac**
- Python: **3.12**
- PyTorch is installed via pip directly due to a known Poetry + PyTorch incompatibility on Intel Macs
- Mobile: **Expo (SDK 50+)**

---

### Prerequisites

#### System Dependencies

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install core dependencies
brew install node watchman python@3.12 poetry
```

#### Xcode (for iOS Development)

1. Download Xcode from the Mac App Store.
2. Open Xcode once to accept the license agreement.
3. Install command line tools:

```bash
xcode-select --install
```

---

### Project Bootstrap

```bash
# Create project root
mkdir ~/digital-closet && cd ~/digital-closet

# Create directory structure
mkdir api worker migrations mobile

# Initialize git
git init
touch .gitignore
```

Add the following to `.gitignore`:

```
.env
__pycache__/
*.pyc
.venv/
node_modules/
.expo/
dist/
ios/
android/
*.egg-info/
.DS_Store
poetry.lock
```

---

### Expo App (Mobile Client)

We use Expo for the mobile client to leverage fast refresh, easy hardware access, and the Clerk Expo SDK.

```bash
cd ~/digital-closet/mobile
npx create-expo-app@latest DigitalCloset --yes
```

Verify the setup:

```bash
cd DigitalCloset
npx expo start
```

Press `i` to open the iOS simulator. If the "Welcome to Expo" screen appears, your mobile toolchain is ready.

---

### API Service (FastAPI)

```bash
cd ~/digital-closet/api
poetry init \
  --name digital-closet-api \
  --python ">=3.12,<3.15" \
  --no-interaction

poetry add fastapi uvicorn sqlalchemy psycopg2-binary alembic python-dotenv boto3
```

Create entry point:

```bash
touch main.py
```

Paste in a minimal FastAPI app to verify it runs:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
```

Run it:

```bash
poetry run uvicorn main:app --reload --port 8000
```

Hit `http://localhost:8000/health` in your browser — you should get `{"status": "ok"}`.

---

### Worker Service

#### Step 1 — Initialize Poetry

```bash
cd ~/digital-closet/worker
poetry init \
  --name digital-closet-worker \
  --python ">=3.12,<3.15" \
  --no-interaction

poetry add pillow numpy psycopg2-binary pgvector boto3 python-dotenv ultralytics
```

#### Step 2 — Install PyTorch via pip

Due to a known incompatibility between Poetry and PyTorch on Intel Macs, torch and torchvision are installed directly via pip into the Poetry virtual environment:

```bash
poetry shell
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
exit
```

#### Step 3 — Install CLIP

```bash
poetry shell
pip install git+https://github.com/openai/CLIP.git
exit
```

---

### Docker Compose (Local Infrastructure)

Create `~/digital-closet/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector
    container_name: digital_closet_postgres
    environment:
      POSTGRES_USER: digital_closet
      POSTGRES_PASSWORD: digital_closet
      POSTGRES_DB: digital_closet_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  elasticmq:
    image: softwaremill/elasticmq-native
    container_name: digital_closet_sqs
    ports:
      - '9324:9324'
      - '9325:9325'
    volumes:
      - ./elasticmq.conf:/opt/elasticmq.conf

volumes:
  postgres_data:
```

Spin up:

```bash
cd ~/digital-closet
docker-compose up -d
```

---

### Environment Variables

Create `~/digital-closet/.env`:

```
DATABASE_URL=postgresql://digital_closet:digital_closet@localhost:5432/digital_closet_dev
SQS_ENDPOINT=http://localhost:9324
SQS_QUEUE_URL=http://localhost:9324/000000000000/photo-uploads
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
AWS_DEFAULT_REGION=us-east-1
```

---

### Final Project Structure

```
digital-closet/
├── mobile/
│   └── DigitalCloset/         # Expo React Native app
├── api/
│   ├── main.py
│   └── pyproject.toml
├── worker/
│   ├── main.py
│   └── pyproject.toml
├── migrations/                # SQL schema files
├── docker-compose.yml
├── elasticmq.conf
├── .env
└── .gitignore
```

---

### Verify Everything Works

- [ ] `npx expo start` boots the app in simulator
- [ ] `docker-compose ps` shows Postgres and ElasticMQ running
- [ ] `poetry run uvicorn main:app --reload` serves health check at `localhost:8000/health`
- [ ] `poetry run python main.py` in worker prints torch version
