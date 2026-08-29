FROM python:3.12-bookworm

WORKDIR /app

RUN pip install --no-cache-dir playwright \
    && playwright install --with-deps chromium \
    && apt-get update \
    && apt-get install -y xvfb xauth \
    && rm -rf /var/lib/apt/lists/*

COPY scripts/ ./scripts/
COPY server/ ./server/

CMD ["sh", "-c", "xvfb-run -a python scripts/login.py && xvfb-run -a python scripts/timetable.py"]

