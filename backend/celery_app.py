import os
import sys
import multiprocessing
from celery import Celery
from dotenv import load_dotenv
import ssl  # Import the ssl module

# Load environment variables
load_dotenv()

# Set environment variable for macOS fork safety (if applicable)
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

# Set multiprocessing start method to 'spawn' to avoid issues with concurrency
multiprocessing.set_start_method('spawn', force=True)

# Append the backend directory to sys.path to ensure modules are discoverable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Get Redis TLS URL from environment variables
redis_tls_url = os.getenv('REDIS_TLS_URL')

# Raise an error if the Redis TLS URL is not set in the environment variables
if not redis_tls_url:
    raise ValueError("REDIS_TLS_URL is not set in the environment variables.")

# Initialize Celery with Redis TLS URL for both broker and result backend
celery = Celery('tasks', broker=redis_tls_url, backend=redis_tls_url)

# Celery configuration with SSL options for Redis
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE  # Use CERT_NONE temporarily, update to CERT_REQUIRED in production with valid SSL
    },
    redis_backend_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE  # Same as above
    },
    broker_connection_retry_on_startup=True  # Ensure retries during startup in case of connection issues
)

# Autodiscover tasks from the 'analysis' module
celery.autodiscover_tasks(['analysis'])
