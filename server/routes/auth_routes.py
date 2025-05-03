from flask import Blueprint, request, jsonify
import pymongo
import bcrypt
import random
import string
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
from utils.jwt_handler import generate_token, verify_token
from utils.email_service import send_otp_email
import datetime
import json

load_dotenv()

# Initialize auth blueprint
auth_bp = Blueprint('auth', __name__)

# MongoDB connection
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
mongo_client = pymongo.MongoClient(mongo_uri)
db = mongo_client['brain_tumor_detection']
users_collection = db['users']
otps_collection = db['otps']
temp_users_collection = db['temp_users']  # New collection for temporary users

# Constants
OTP_EXPIRY_SECONDS = 300  # 5 minutes
TEMP_USER_EXPIRY_SECONDS = 900  # 15 minutes

# Helper functions
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

# Function to clean up expired OTPs
def cleanup_expired_otps():
    expiry_time = datetime.datetime.utcnow() - datetime.timedelta(seconds=OTP_EXPIRY_SECONDS)
    result = otps_collection.delete_many({"created": {"$lt": expiry_time}})
    if result.deleted_count > 0:
        print(f"Cleaned up {result.deleted_count} expired OTPs")
    return result.deleted_count

# Function to clean up temporary users
def cleanup_expired_temp_users():
    expiry_time = datetime.datetime.utcnow() - datetime.timedelta(seconds=TEMP_USER_EXPIRY_SECONDS)
    result = temp_users_collection.delete_many({"created": {"$lt": expiry_time}})
    if result.deleted_count > 0:
        print(f"Cleaned up {result.deleted_count} expired temporary users")
    return result.deleted_count

# Routes
@auth_bp.route('/register', methods=['POST'])
def register():
    # First, clean up expired temporary users
    cleanup_expired_temp_users()
    
    # Check content type and handle accordingly
    if request.content_type and 'application/json' in request.content_type:
        data = request.get_json()
    elif request.content_type and 'application/x-www-form-urlencoded' in request.content_type:
        data = request.form.to_dict()
    else:
        # Handle raw form data
        try:
            # Try to parse as JSON first
            data = request.get_json()
        except:
            # If that fails, try form data
            data = request.form.to_dict()
            if not data:
                # If still no data, try to parse the raw body
                try:
                    data = json.loads(request.data.decode('utf-8'))
                except:
                    return jsonify({"error": "Unsupported content type. Please use application/json or application/x-www-form-urlencoded"}), 415
    
    # Log the incoming data format for debugging
    print(f"Register attempt: Content-Type={request.content_type}, Data format: {type(data)}")
    
    # Validate request data
    required_fields = ['firstName', 'lastName', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Check if user already exists
    if users_collection.find_one({"email": data['email']}):
        return jsonify({"error": "User already exists"}), 409
    
    # Store user data temporarily
    user_data = {
        "firstName": data['firstName'],
        "lastName": data['lastName'],
        "email": data['email'],
        "password": hash_password(data['password']).decode('utf-8'),  # Convert binary to string for storage
        "created": datetime.datetime.utcnow()
    }
    
    # Remove any previous temp registration for this email
    temp_users_collection.delete_many({"email": data['email']})
    
    # Save temporary user data
    result = temp_users_collection.insert_one(user_data)
    temp_user_id = str(result.inserted_id)
    
    # Generate and save OTP
    otp = generate_otp()
    otps_collection.insert_one({
        "userId": ObjectId(temp_user_id),
        "otp": otp,
        "created": datetime.datetime.utcnow(),
        "type": "signup"
    })
    
    # Send OTP via email
    send_result = send_otp_email(data['email'], otp, 'signup')
    
    if not send_result:
        return jsonify({"error": "Failed to send verification email. Please try again."}), 500
    
    # Print OTP to console for development/testing
    print(f"OTP for {data['email']}: {otp}")
    
    return jsonify({
        "message": "Please check your email for OTP to verify your account.", 
        "userId": temp_user_id
    }), 201

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    # First, clean up expired OTPs and temporary users
    cleanup_expired_otps()
    cleanup_expired_temp_users()
    
    data = request.get_json()
    
    # Validate request data
    if 'userId' not in data or 'otp' not in data:
        return jsonify({"error": "Missing required fields: userId and otp"}), 400
    
    # Find OTP in database
    otp_record = otps_collection.find_one({
        "userId": ObjectId(data['userId']),
        "otp": data['otp'],
        "type": "signup"
    })
    
    if not otp_record:
        return jsonify({"error": "Invalid OTP"}), 400
    
    # Check if OTP is expired (5 minutes validity)
    current_time = datetime.datetime.utcnow()
    otp_time = otp_record['created']
    time_diff = (current_time - otp_time).total_seconds()
    
    if time_diff > OTP_EXPIRY_SECONDS:
        return jsonify({"error": "OTP expired"}), 400
    
    # Get temporary user data
    temp_user = temp_users_collection.find_one({"_id": ObjectId(data['userId'])})
    
    if not temp_user:
        return jsonify({"error": "Registration data expired or not found"}), 400
    
    # Create verified user from temporary data
    new_user = {
        "firstName": temp_user['firstName'],
        "lastName": temp_user['lastName'],
        "email": temp_user['email'],
        "password": temp_user['password'].encode('utf-8'),  # Convert back to binary for storage
        "isVerified": True,
        "created": datetime.datetime.utcnow()
    }
    
    # Save user to database
    user_result = users_collection.insert_one(new_user)
    user_id = str(user_result.inserted_id)
    
    # Delete OTP and temporary user
    otps_collection.delete_one({"_id": otp_record['_id']})
    temp_users_collection.delete_one({"_id": ObjectId(data['userId'])})
    
    # Generate JWT token
    token = generate_token(user_id)
    
    return jsonify({
        "message": "Account verified successfully", 
        "token": token,
        "user": {
            "id": user_id,
            "firstName": new_user['firstName'],
            "lastName": new_user['lastName'],
            "email": new_user['email']
        }
    }), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    # Check content type and handle accordingly
    if request.content_type and 'application/json' in request.content_type:
        data = request.get_json()
    elif request.content_type and 'application/x-www-form-urlencoded' in request.content_type:
        data = request.form.to_dict()
    else:
        # Handle raw form data
        try:
            # Try to parse as JSON first
            data = request.get_json()
        except:
            # If that fails, try form data
            data = request.form.to_dict()
            if not data:
                # If still no data, try to parse the raw body
                try:
                    data = json.loads(request.data.decode('utf-8'))
                except:
                    return jsonify({"error": "Unsupported content type. Please use application/json or application/x-www-form-urlencoded"}), 415
    
    # Log the incoming data format for debugging
    print(f"Login attempt: Content-Type={request.content_type}, Data format: {type(data)}")
    
    # Validate request data
    if 'email' not in data or 'password' not in data:
        return jsonify({"error": "Missing required fields: email and password"}), 400
    
    # Find user in database
    user = users_collection.find_one({"email": data['email']})
    
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check password
    if not check_password(data['password'], user['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check if user is verified
    if not user.get('isVerified', False):
        return jsonify({"error": "Account not verified", "userId": str(user['_id'])}), 403
    
    # Generate JWT token
    token = generate_token(str(user['_id']))
    
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user['_id']),
            "firstName": user['firstName'],
            "lastName": user['lastName'],
            "email": user['email']
        }
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    # First, clean up expired temporary users
    cleanup_expired_temp_users()
    
    data = request.get_json()
    
    # Validate request data
    if 'email' not in data:
        return jsonify({"error": "Missing required field: email"}), 400
    
    # Find user in database
    user = users_collection.find_one({"email": data['email']})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Generate and save OTP
    otp = generate_otp()
    otps_collection.insert_one({
        "userId": user['_id'],
        "otp": otp,
        "created": datetime.datetime.utcnow(),
        "type": "reset"
    })
    
    # Send OTP via email
    send_otp_email(data['email'], otp, 'reset')
    
    return jsonify({"message": "Password reset OTP sent", "userId": str(user['_id'])}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    # First, clean up expired OTPs and temporary users
    cleanup_expired_otps()
    cleanup_expired_temp_users()
    
    data = request.get_json()
    
    # Validate request data
    if 'userId' not in data or 'otp' not in data or 'newPassword' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Find OTP in database
    otp_record = otps_collection.find_one({
        "userId": ObjectId(data['userId']),
        "otp": data['otp'],
        "type": "reset"
    })
    
    if not otp_record:
        return jsonify({"error": "Invalid OTP"}), 400
    
    # Check if OTP is expired (5 minutes validity)
    current_time = datetime.datetime.utcnow()
    otp_time = otp_record['created']
    time_diff = (current_time - otp_time).total_seconds()
    
    if time_diff > OTP_EXPIRY_SECONDS:
        return jsonify({"error": "OTP expired"}), 400
    
    # Update password
    hashed_password = hash_password(data['newPassword'])
    users_collection.update_one(
        {"_id": ObjectId(data['userId'])},
        {"$set": {"password": hashed_password}}
    )
    
    # Delete OTP
    otps_collection.delete_one({"_id": otp_record['_id']})
    
    return jsonify({"message": "Password reset successful"}), 200

# Add new route for resending OTP
@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    # First, clean up expired OTPs and temporary users
    cleanup_expired_otps()
    cleanup_expired_temp_users()
    
    data = request.get_json()
    
    # Validate request data
    if 'userId' not in data:
        return jsonify({"error": "Missing required field: userId"}), 400
    
    # Check if this is for signup or password reset
    otp_type = data.get('type', 'signup')
    
    # Find user in temporary or users collection based on OTP type
    user = None
    if otp_type == 'signup':
        user = temp_users_collection.find_one({"_id": ObjectId(data['userId'])})
    else:
        user = users_collection.find_one({"_id": ObjectId(data['userId'])})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Generate and save new OTP
    otp = generate_otp()
    
    # Delete any existing OTP for this user
    otps_collection.delete_many({
        "userId": ObjectId(data['userId']),
        "type": otp_type
    })
    
    # Save new OTP
    otps_collection.insert_one({
        "userId": ObjectId(data['userId']),
        "otp": otp,
        "created": datetime.datetime.utcnow(),
        "type": otp_type
    })
    
    # Send OTP via email
    email = user['email']
    send_result = send_otp_email(email, otp, otp_type)
    
    if not send_result:
        return jsonify({"error": "Failed to send verification email. Please try again."}), 500
    
    # Print OTP to console for development/testing
    print(f"New OTP for {email}: {otp}")
    
    return jsonify({
        "message": "OTP sent successfully", 
        "email": email
    }), 200 