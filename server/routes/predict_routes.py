from flask import Blueprint, request, jsonify
import os
import pymongo
from bson.objectid import ObjectId
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import io
import datetime
from dotenv import load_dotenv
from functools import wraps
from utils.jwt_handler import verify_token

load_dotenv()

# Initialize prediction blueprint
predict_bp = Blueprint('predict', __name__)

# MongoDB connection
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
mongo_client = pymongo.MongoClient(mongo_uri)
db = mongo_client['brain_tumor_detection']
predictions_collection = db['predictions']

# Global model variable
model = None

def load_prediction_model():
    global model
    if model is None:
        model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model', 'vgg19_ML_Model.h5')
        if os.path.exists(model_path):
            model = load_model(model_path)
        else:
            raise FileNotFoundError(f"Model file not found at {model_path}")
    return model

# Authentication middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in the request header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user_id to the request context
        request.user_id = user_id
        return f(*args, **kwargs)
    
    return decorated

# Helper functions
def preprocess_image(img_data, target_size=(240, 240)):
    """Preprocess the image for the model"""
    img = Image.open(io.BytesIO(img_data))
    img = img.convert('RGB')  # Convert to RGB
    img = img.resize(target_size)  # Resize to target size
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0  # Normalize
    return img_array

def predict_tumor(img_data):
    """Make prediction on the image"""
    try:
        # Load model if not loaded
        model = load_prediction_model()
        
        # Preprocess image
        processed_img = preprocess_image(img_data)
        
        # Print shape for debugging
        print(f"Input shape to model: {processed_img.shape}")
        
        # Make prediction
        prediction = model.predict(processed_img)
        
        # Get result (assuming binary classification)
        result = "Tumor" if prediction[0][0] < 0.5 else "No Tumor"
        
        # Store confidence for database but don't return it
        confidence = float(prediction[0][0]) if result == "Tumor" else float(1 - prediction[0][0])
        
        # Return only the result without confidence
        prediction_result = {
            "result": result
        }
        
        # Store the confidence internally for database records
        prediction_result['_confidence'] = confidence * 100
        
        return prediction_result
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        return None

def save_image(image_data, filename):
    """Save the image to uploads directory"""
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, 'wb') as f:
        f.write(image_data)
    
    return file_path

# Routes
@predict_bp.route('/', methods=['POST'])
def predict_without_auth():
    """Endpoint for prediction without authentication (result is saved anonymously)"""
    # Check if image is in the request
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    # Check if the file is allowed
    allowed_extensions = {'jpg', 'jpeg', 'png'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'error': 'Invalid file format. Please upload JPG or PNG image'}), 400
    
    # Read image data
    image_data = file.read()
    
    # Predict tumor
    prediction_result = predict_tumor(image_data)
    
    if prediction_result is None:
        return jsonify({'error': 'Error processing image'}), 500
    
    # Save image to uploads directory
    unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    save_image(image_data, unique_filename)
    
    # Save prediction to database with confidence, but without a user ID
    prediction_record = {
        "userId": None,  # Null userId indicates anonymous/unregistered user
        "imageName": unique_filename,
        "result": prediction_result["result"],
        "confidence": prediction_result.get("_confidence", 0),
        "timestamp": datetime.datetime.utcnow(),
        "isAnonymous": True  # Flag to identify predictions from unregistered users
    }
    
    predictions_collection.insert_one(prediction_record)
    
    # Remove internal confidence before sending response
    if '_confidence' in prediction_result:
        del prediction_result['_confidence']
    
    return jsonify(prediction_result), 200

@predict_bp.route('/authenticated', methods=['POST'])
@token_required
def predict_with_auth():
    """Endpoint for prediction with authentication (result saved to database)"""
    # Check if image is in the request
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    # Check if the file is allowed
    allowed_extensions = {'jpg', 'jpeg', 'png'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'error': 'Invalid file format. Please upload JPG or PNG image'}), 400
    
    # Read image data
    image_data = file.read()
    
    # Predict tumor
    prediction_result = predict_tumor(image_data)
    
    if prediction_result is None:
        return jsonify({'error': 'Error processing image'}), 500
    
    # Save image to uploads directory
    unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    save_image(image_data, unique_filename)
    
    # Save prediction to database with confidence
    prediction_record = {
        "userId": ObjectId(request.user_id),
        "imageName": unique_filename,
        "result": prediction_result["result"],
        "confidence": prediction_result.get("_confidence", 0),  # Use internal confidence for database
        "timestamp": datetime.datetime.utcnow()
    }
    
    predictions_collection.insert_one(prediction_record)
    
    # Remove internal confidence before sending response
    if '_confidence' in prediction_result:
        del prediction_result['_confidence']
    
    return jsonify(prediction_result), 200 