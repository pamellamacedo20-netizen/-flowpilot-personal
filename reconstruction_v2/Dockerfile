FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-venv libgl1 libglib2.0-0 libgomp1 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python3 -m venv /venv && /venv/bin/pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
COPY start.sh ./start.sh
RUN chmod +x start.sh
ENV PATH="/venv/bin:$PATH" GRAFTMAP_DATA=/data
RUN mkdir -p /data && useradd -r -u 10001 worker && chown worker:worker /data
USER worker
EXPOSE 8000
CMD ["./start.sh"]
