# 🧠 Brain Tumor Detection Web Application

A full-stack web application for detecting brain tumors from MRI scans using deep learning technology.

---

## 🚀 Features

- **Brain Tumor Detection**: Upload MRI scans and get instant predictions using the VGG19 model  
- **User Authentication**: Secure signup and login with OTP-based email verification  
- **Dashboard**: View prediction history and statistics  
- **Responsive Design**: Modern UI that works on desktop and mobile devices  

---

## 🛠 Tech Stack

### 🖥 Frontend

- React.js with Material UI  
- React Router for navigation  
- Context API for state management  
- Framer Motion for animations  
- Axios for API requests  
- React Toastify for notifications  

### ⚙️ Backend

- Flask for the main API  
- Node.js microservice for sending OTP emails  
- JWT for authentication  
- TensorFlow/Keras for the prediction model  
- MongoDB for data storage  

---

## 📁 Project Structure

project/
├── client/ # React frontend
├── server/ # Flask backend
│ ├── app.py # Main Flask application
│ ├── routes/ # API routes
│ ├── model/ # ML model
│ ├── utils/ # Utilities
│ └── uploads/ # Uploaded images
└── otp-service/ # Node.js OTP service
---

## ✅ Prerequisites

- Python 3.8+  
- Node.js 14+  
- MongoDB  
- TensorFlow 2.x  

---

## 🔧 Backend Setup

1. Create and activate a virtual environment:

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2. Install Python dependencies:

    ```bash
    cd server
    pip install -r requirements.txt
    ```

3. Set environment variables in a `.env` file:

    ```
    MONGO_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    OTP_SERVICE_URL=http://localhost:3001/api/send-otp
    ```

4. Add the pre-trained model file to:  
   `server/model/vgg19_mlModel.h5`

5. Run the Flask server:

    ```bash
    python app.py
    ```

---

### ✉️ OTP Service Setup

1. Install Node.js dependencies:

    ```bash
    cd otp-service
    npm install
    ```

2. Create a `.env` file with the following:

    ```
    EMAIL_SERVICE=gmail  # or another email provider
    EMAIL_USER=your_email@example.com
    EMAIL_PASSWORD=your_email_password
    EMAIL_FROM=Brain Tumor Detection <no-reply@braintumordetection.com>
    PORT=3001
    ```

3. Start the OTP microservice:

    ```bash
    npm start
    ```

---

### 🌐 Frontend Setup

1. Install frontend dependencies:

    ```bash
    cd client
    npm install
    ```

2. Run the React development server:

    ```bash
    npm start
    ```

---

## 📋 Usage

1. Register a new user account  
2. Verify your email via OTP  
3. Upload an MRI image on the **Predict** page  
4. View the tumor prediction result  
5. Access prediction history in the **Dashboard**  

---

## 🙏 Acknowledgements

- VGG19 CNN architecture  
- Open-source medical image datasets  
- Open-source tools and libraries that power this project  
