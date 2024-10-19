import os
import sys
import multiprocessing
from celery import Celery
from dotenv import load_dotenv
import ssl  # Import the ssl module

# Load environment variables
load_dotenv()

# Set environment variable for macOS fork safety
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

# Set multiprocessing start method to 'spawn'
multiprocessing.set_start_method('spawn', force=True)

# Append the backend directory to sys.path to ensure modules are discoverable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Get Redis TLS URL from environment variables
redis_tls_url = os.getenv('REDIS_TLS_URL')

if not redis_tls_url:
    raise ValueError("REDIS_TLS_URL is not set in the environment variables.")

# Initialize Celery with Redis URL for both broker and backend
celery = Celery('tasks', broker=redis_tls_url, backend=redis_tls_url)

# Celery configuration with SSL options for Redis
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_use_ssl={
        'ssl_cert_reqs': ssl.CERT_REQUIRED  # Use CERT_REQUIRED for secure SSL
    },
    redis_backend_use_ssl={
        'ssl_cert_reqs': ssl.CERT_REQUIRED  # Ensure backend SSL is also secure
    }
)

# Autodiscover tasks from the 'analysis' module
celery.autodiscover_tasks(['analysis'])
