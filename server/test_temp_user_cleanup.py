import pymongo
import os
import datetime
from dotenv import load_dotenv
from bson.objectid import ObjectId
import time

load_dotenv()

def test_temp_user_cleanup():
    # MongoDB connection
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/brain_tumor_detection')
    client = pymongo.MongoClient(mongo_uri)
    db = client['brain_tumor_detection']
    temp_users_collection = db['temp_users']
    
    # Count existing temporary users
    existing_count = temp_users_collection.count_documents({})
    print(f"Current temporary users count: {existing_count}")
    
    # Create a new temporary user with current timestamp
    current_user = {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "hashedpassword",
        "created": datetime.datetime.utcnow()
    }
    
    current_result = temp_users_collection.insert_one(current_user)
    current_id = current_result.inserted_id
    print(f"Created new temporary user with ID: {current_id}")
    
    # Create an expired temporary user (created 16 minutes ago)
    expired_time = datetime.datetime.utcnow() - datetime.timedelta(minutes=16)
    expired_user = {
        "firstName": "Expired",
        "lastName": "User",
        "email": "expired@example.com",
        "password": "hashedpassword",
        "created": expired_time
    }
    
    expired_result = temp_users_collection.insert_one(expired_user)
    expired_id = expired_result.inserted_id
    print(f"Created expired temporary user with ID: {expired_id}")
    
    # Verify both users were added
    new_count = temp_users_collection.count_documents({})
    print(f"New temporary users count: {new_count} (added {new_count - existing_count})")
    
    # Import the cleanup function
    print("\nImporting cleanup function from auth_routes.py...")
    from routes.auth_routes import cleanup_expired_temp_users
    
    # Run the cleanup
    print("\nRunning cleanup_expired_temp_users...")
    deleted_count = cleanup_expired_temp_users()
    print(f"Cleanup deleted {deleted_count} temporary users")
    
    # Verify results
    final_count = temp_users_collection.count_documents({})
    print(f"Final temporary users count: {final_count}")
    
    # Check if current user still exists
    current_exists = temp_users_collection.find_one({"_id": current_id}) is not None
    print(f"Current user still exists: {current_exists}")
    
    # Check if expired user was deleted
    expired_exists = temp_users_collection.find_one({"_id": expired_id}) is not None
    print(f"Expired user still exists: {expired_exists}")
    
    # Clean up the test data
    temp_users_collection.delete_one({"_id": current_id})
    if expired_exists:
        temp_users_collection.delete_one({"_id": expired_id})
    
    print("\nTest completed.")

if __name__ == "__main__":
    test_temp_user_cleanup() 