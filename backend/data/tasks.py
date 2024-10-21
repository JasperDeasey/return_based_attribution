# backend/data/tasks.py

from celery import shared_task
import asyncio
from .benchmark_returns_collector import main as benchmark_main

@shared_task
def run_benchmark_return_upload():
    """
    Celery task to run the benchmark return upload script.
    Since `benchmark_main` is async, we run it using `asyncio.run()`.
    """
    asyncio.run(benchmark_main())
