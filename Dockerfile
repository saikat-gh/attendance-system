# Use Node.js LTS version as base image
FROM node:18-slim

# Install system dependencies for image processing
RUN apt-get update && apt-get install -y \
    python3-full \
    python3-pip \
    python3-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Create and activate Python virtual environment
ENV VIRTUAL_ENV=/usr/src/app/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies in the virtual environment
RUN pip3 install opencv-python scikit-image

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]