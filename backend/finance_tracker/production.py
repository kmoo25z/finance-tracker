# Create the correct production.py content
$productionContent = @"
import os
from pathlib import Path
import dj_database_url
from .settings import *

# Override for production
DEBUG = False
ALLOWED_HOSTS = ['.herokuapp.com', 'your-finance-tracker-backend.herokuapp.com', '*']

# Database configuration
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# WhiteNoise for static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', SECRET_KEY)

# CORS
CORS_ALLOW_ALL_ORIGINS = True
"@

# Write to file properly
[System.IO.File]::WriteAllText("$PWD\backend\finance_tracker\production.py", $productionContent)

Write-Host "Created production.py correctly" -ForegroundColor Green

# Verify the content
Get-Content backend/finance_tracker/production.py