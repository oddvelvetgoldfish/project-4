#!/bin/bash

# Start the Django backend server in the background
cd /backend
python manage.py runserver 0.0.0.0:8000 &

# Start the Vite frontend dev server (this will be the exposed service)
cd /frontend
npm run dev -- --host 0.0.0.0
