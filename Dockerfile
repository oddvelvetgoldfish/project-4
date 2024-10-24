# Base image for Python
FROM python:3.10

WORKDIR /backend

# Copy backend requirements and install dependencies
COPY ./backend/requirements.txt ./
RUN pip install -r requirements.txt

# Copy the rest of the backend files
COPY ./backend ./

# Expose ports for both the frontend (3000) and backend (8000)
EXPOSE 8000

# # Run the backend server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]