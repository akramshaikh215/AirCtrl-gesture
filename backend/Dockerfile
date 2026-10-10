FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sh","-c","flask --app app:create_app db upgrade && gunicorn --bind 0.0.0.0:5000 'app:create_app()'"]
