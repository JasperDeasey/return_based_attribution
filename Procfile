web: gunicorn backend.app:app --bind 0.0.0.0:5000
worker: celery -A backend.celery_app.celery worker --loglevel=info
