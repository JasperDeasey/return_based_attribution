web: gunicorn backend.app:app --bind 0.0.0.0:$PORT
worker: celery -A backend.celery_app.celery worker --loglevel=info --concurrency=2
beat: celery -A backend.celery_app.celery beat --loglevel=info