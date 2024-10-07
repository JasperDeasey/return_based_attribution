# backend/worker.py

import os
import sys
from dotenv import load_dotenv
import redis
from rq import Worker, Queue, Connection

# Load environment variables
load_dotenv()

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Redis connection URL (set by Heroku or default to localhost)
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')

# Connect to Redis
conn = redis.from_url(redis_url)

if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(Queue())
        worker.work()
