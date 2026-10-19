FROM python:3.12.15-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN useradd --create-home api
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY --chown=api:api . .
USER api

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM runtime AS test

USER root
RUN pip install -r requirements-dev.txt
USER api

CMD ["pytest"]
