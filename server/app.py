from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
import pymongo
from routes.auth_routes import auth_bp, cleanup_expired_otps, cleanup_expired_temp_users
from routes.predict_routes import predict_bp
from routes.dashboard_routes import dashboard_bp
import time
import datetime
import threading

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# MongoDB connection with retry
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
mongo_client = None
db = None

def connect_to_mongodb():
    global mongo_client, db
    retry_count = 0
    max_retries = 3
    
    while retry_count < max_retries:
        try:
            print(f"Attempting to connect to MongoDB at {mongo_uri}")
            mongo_client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            # Force a connection to verify it works
            mongo_client.server_info()
            db = mongo_client['brain_tumor_detection']
            print("Successfully connected to MongoDB")
            return True
        except pymongo.errors.ServerSelectionTimeoutError as e:
            retry_count += 1
            print(f"MongoDB connection attempt {retry_count} failed: {str(e)}")
            if retry_count < max_retries:
                print(f"Retrying in 2 seconds...")
                time.sleep(2)
            else:
                print("All MongoDB connection attempts failed. Starting without database.")
                return False
        except Exception as e:
            print(f"Unexpected error connecting to MongoDB: {str(e)}")
            return False

# Try to connect to MongoDB
connect_to_mongodb()

# Create the upload directory if it doesn't exist
upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(upload_dir, exist_ok=True)

# Set up background task for OTP cleanup
def start_otp_cleanup_scheduler():
    """Start a background thread to periodically clean up expired OTPs"""
    def cleanup_task():
        while True:
            try:
                # Run cleanup every minute
                cleanup_expired_otps()
                time.sleep(60)  # 60 seconds = 1 minute
            except Exception as e:
                print(f"Error in OTP cleanup task: {str(e)}")
                time.sleep(60)  # Continue despite errors
    
    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
    cleanup_thread.start()
    print("Started background OTP cleanup task")

# Set up background task for temporary users cleanup
def start_temp_users_cleanup_scheduler():
    """Start a background thread to periodically clean up expired temporary users"""
    def cleanup_task():
        while True:
            try:
                # Run cleanup every 15 minutes
                cleanup_expired_temp_users()
                time.sleep(15 * 60)  # 15 minutes
            except Exception as e:
                print(f"Error in temporary users cleanup task: {str(e)}")
                time.sleep(15 * 60)  # Continue despite errors
    
    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
    cleanup_thread.start()
    print("Started background temporary users cleanup task")

# Start the cleanup schedulers
start_otp_cleanup_scheduler()
start_temp_users_cleanup_scheduler()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(predict_bp, url_prefix='/api/predict')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

# Serve upload files
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(upload_dir, filename)

@app.route('/api/health', methods=['GET'])
def health_check():
    db_status = "connected" if mongo_client else "disconnected"
    return jsonify({
        "status": "healthy", 
        "database": db_status
    }), 200

# Record visitor
@app.route('/api/record-visitor', methods=['POST'])
def record_visitor():
    if not mongo_client:
        print("Failed to record visitor: Database connection not available")
        return jsonify({"error": "Database connection not available"}), 500
    
    try:
        print("Processing visitor request...")
        # Get or create visitors collection
        visitors_collection = db.get_collection('visitors')
        if visitors_collection is None:
            print("Creating visitors collection")
            db.create_collection('visitors')
            visitors_collection = db['visitors']
        
        # Get visitor information
        data = request.get_json() or {}
        user_agent = data.get("userAgent", request.headers.get("User-Agent", ""))
        ip_address = request.remote_addr
        session_id = data.get("sessionId")
        
        print(f"Visitor data: IP={ip_address}, SessionID={session_id}, UserAgent={user_agent[:50]}...")
        
        # Check if this session has already been recorded (to prevent duplicates)
        if session_id:
            existing_visit = visitors_collection.find_one({"sessionId": session_id})
            if existing_visit:
                print(f"Session {session_id} already recorded, skipping")
                total_visitors = visitors_collection.count_documents({})
                return jsonify({"success": True, "duplicate": True, "totalVisitors": total_visitors}), 200
        
        # Add the visitor to the database
        visitor_data = {
            "timestamp": datetime.datetime.utcnow(),
            "userAgent": user_agent,
            "ipAddress": ip_address,
            "sessionId": session_id
        }
        
        result = visitors_collection.insert_one(visitor_data)
        
        # Verify the visitor was recorded
        if result.inserted_id:
            print(f"Visitor recorded successfully. ID: {result.inserted_id}")
            # Count total visitors after adding this one
            total_visitors = visitors_collection.count_documents({})
            print(f"Total visitors count: {total_visitors}")
            return jsonify({"success": True, "totalVisitors": total_visitors}), 200
        else:
            print("Failed to insert visitor document")
            return jsonify({"error": "Failed to record visitor"}), 500
    except Exception as e:
        print(f"Error recording visitor: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0') 