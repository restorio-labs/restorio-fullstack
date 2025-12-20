# Restorio API

FastAPI backend for the Restorio Platform.

## Requirements

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer

## Setup

### Install uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with pip
pip install uv
```

### Install Dependencies

```bash
# Install dependencies from pyproject.toml
uv pip install .

# Or for development (editable install)
uv pip install -e .

# Generate lock file (optional, for reproducible builds)
uv lock
```

### Run Locally

```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8000

# Or using uv
uv run uvicorn main:app --reload --port 8000
```

### Docker

```bash
# Build and run
docker compose up api

# Or build manually
docker build -t restorio-api .
docker run -p 8000:8000 restorio-api
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Add a Dependency

```bash
# Add a new package
uv pip install package-name

# Update pyproject.toml manually, then:
uv lock
```

### Lock Dependencies

```bash
# Generate/update lock file
uv lock
```

