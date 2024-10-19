# backend/celery_app.py

import os
import sys
import multiprocessing
from celery import Celery
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set environment variable for macOS fork safety
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

# Set multiprocessing start method to 'spawn'
multiprocessing.set_start_method('spawn', force=True)

# Append the backend directory to sys.path to ensure modules are discoverable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Get Redis URL from environment variables
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Initialize Celery
celery = Celery('tasks', broker=redis_url, backend=redis_url)

# Celery configuration
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_use_ssl={
        'ssl_cert_reqs': 'CERT_NONE'  # Use 'CERT_REQUIRED' for more secure configurations
    },
    redis_backend_use_ssl={
        'ssl_cert_reqs': 'CERT_NONE'
    }
)

# Autodiscover tasks from the 'analysis' module
celery.autodiscover_tasks(['analysis'])
