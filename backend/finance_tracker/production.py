# Create a fixed production.py
@'
"""
Production settings for finance_tracker project.
"""
import os
from pathlib import Path
import dj_database_url

# Import from base settings
from .settings import *

# Override for production
DEBUG = False

ALLOWED_HOSTS = ['.herokuapp.com', 'your-finance-tracker-backend.herokuapp.com', '*']

# Database
# Parse database configuration from $DATABASE_URL
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Force DATABASE_URL parsing
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES['default'] = dj_database_url.parse(DATABASE_URL, conn_max_age=600)

# WhiteNoise for static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', SECRET_KEY)

# CORS
CORS_ALLOW_ALL_ORIGINS = True
'@ | Out-File -FilePath backend/finance_tracker/production.py -Encoding UTF8

Write-Host "Updated production.py with correct database parsing" -ForegroundColor Green