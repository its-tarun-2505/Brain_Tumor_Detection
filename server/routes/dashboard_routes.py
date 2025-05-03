from flask import Blueprint, request, jsonify
import pymongo
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
from functools import wraps
from utils.jwt_handler import verify_token

load_dotenv()

# Initialize dashboard blueprint
dashboard_bp = Blueprint('dashboard', __name__)

# MongoDB connection
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
mongo_client = pymongo.MongoClient(mongo_uri)
db = mongo_client['brain_tumor_detection']
predictions_collection = db['predictions']
users_collection = db['users']

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

# Routes
@dashboard_bp.route('/predictions', methods=['GET'])
@token_required
def get_predictions():
    """Get all predictions for the authenticated user"""
    # Get pagination parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    skip = (page - 1) * limit
    
    # Get user's predictions from database
    predictions = list(predictions_collection.find(
        {"userId": ObjectId(request.user_id)}
    ).sort("timestamp", pymongo.DESCENDING).skip(skip).limit(limit))
    
    # Count total predictions
    total_predictions = predictions_collection.count_documents({"userId": ObjectId(request.user_id)})
    
    # Format predictions for response
    formatted_predictions = []
    for prediction in predictions:
        formatted_predictions.append({
            "id": str(prediction["_id"]),
            "imageName": prediction["imageName"],
            "result": prediction["result"],
            "timestamp": prediction["timestamp"].isoformat()
        })
    
    return jsonify({
        "predictions": formatted_predictions,
        "total": total_predictions,
        "page": page,
        "limit": limit,
        "totalPages": (total_predictions + limit - 1) // limit
    }), 200

@dashboard_bp.route('/predictions/<prediction_id>', methods=['GET'])
@token_required
def get_prediction_by_id(prediction_id):
    """Get a specific prediction by ID"""
    try:
        # Find prediction in database
        prediction = predictions_collection.find_one({
            "_id": ObjectId(prediction_id),
            "userId": ObjectId(request.user_id)
        })
        
        if not prediction:
            return jsonify({"error": "Prediction not found"}), 404
        
        # Format prediction for response
        formatted_prediction = {
            "id": str(prediction["_id"]),
            "imageName": prediction["imageName"],
            "result": prediction["result"],
            "timestamp": prediction["timestamp"].isoformat()
        }
        
        return jsonify(formatted_prediction), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/user-profile', methods=['GET'])
@token_required
def get_user_profile():
    """Get the authenticated user's profile"""
    # Find user in database
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Format user for response
    formatted_user = {
        "id": str(user["_id"]),
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "email": user["email"]
    }
    
    return jsonify(formatted_user), 200

@dashboard_bp.route('/statistics', methods=['GET'])
@token_required
def get_statistics():
    """Get statistics about the user's predictions"""
    # Count predictions by result
    total_predictions = predictions_collection.count_documents({"userId": ObjectId(request.user_id)})
    tumor_predictions = predictions_collection.count_documents({
        "userId": ObjectId(request.user_id),
        "result": "Tumor"
    })
    no_tumor_predictions = predictions_collection.count_documents({
        "userId": ObjectId(request.user_id),
        "result": "No Tumor"
    })
    
    # Calculate percentages
    tumor_percentage = (tumor_predictions / total_predictions * 100) if total_predictions > 0 else 0
    no_tumor_percentage = (no_tumor_predictions / total_predictions * 100) if total_predictions > 0 else 0
    
    # Get the most recent prediction
    most_recent = None
    recent_prediction = list(predictions_collection.find(
        {"userId": ObjectId(request.user_id)}
    ).sort("timestamp", pymongo.DESCENDING).limit(1))
    
    if recent_prediction:
        most_recent = {
            "id": str(recent_prediction[0]["_id"]),
            "imageName": recent_prediction[0]["imageName"],
            "result": recent_prediction[0]["result"],
            "timestamp": recent_prediction[0]["timestamp"].isoformat()
        }
    
    return jsonify({
        "totalPredictions": total_predictions,
        "tumorPredictions": tumor_predictions,
        "noTumorPredictions": no_tumor_predictions,
        "tumorPercentage": tumor_percentage,
        "noTumorPercentage": no_tumor_percentage,
        "mostRecent": most_recent
    }), 200

@dashboard_bp.route('/public-statistics', methods=['GET'])
def get_public_statistics():
    """Get public statistics about the application usage - no authentication required"""
    try:
        # Count total registered users
        total_users = users_collection.count_documents({})
        print(f"Total registered users: {total_users}")
        
        # Count total predictions
        total_predictions = predictions_collection.count_documents({})
        print(f"Total predictions: {total_predictions}")
        
        # Get visitor count from the visitors collection
        visitors_collection = db.get_collection('visitors')
        if visitors_collection is None:
            print("Visitors collection doesn't exist, creating it now")
            db.create_collection('visitors')
            visitors_collection = db['visitors']
            total_visitors = 0
        else:
            total_visitors = visitors_collection.count_documents({})
        
        print(f"Total visitors: {total_visitors}")
        
        # Count predictions by result
        tumor_predictions = predictions_collection.count_documents({"result": "Tumor"})
        no_tumor_predictions = predictions_collection.count_documents({"result": "No Tumor"})
        
        print(f"Statistics summary: {total_users} users, {total_visitors} visitors, {total_predictions} predictions")
        
        return jsonify({
            "totalUsers": total_users,
            "totalVisitors": total_visitors,
            "totalPredictions": total_predictions,
            "tumorPredictions": tumor_predictions,
            "noTumorPredictions": no_tumor_predictions
        }), 200
    except Exception as e:
        print(f"Error getting public statistics: {str(e)}")
        return jsonify({"error": str(e)}), 500 