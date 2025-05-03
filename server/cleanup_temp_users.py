import pymongo
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

def cleanup_temp_users(hours=1):
    """
    Clean up temporary users that are older than specified hours
    
    Args:
        hours (int): Number of hours after which temporary users should be removed
    
    Returns:
        int: Number of temporary users removed
    """
    # MongoDB connection
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/brain_tumor_detection')
    client = pymongo.MongoClient(mongo_uri)
    db = client['brain_tumor_detection']
    
    # Check if temp_users collection exists
    collection_names = db.list_collection_names()
    if 'temp_users' in collection_names:
        # Get current count
        temp_users_count = db['temp_users'].count_documents({})
        print(f"Current temporary users count: {temp_users_count}")
        
        # Calculate expiry time
        expiry_time = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
        
        # Find and delete expired temp users
        result = db['temp_users'].delete_many({"created": {"$lt": expiry_time}})
        deleted_count = result.deleted_count
        
        # Get new count
        new_count = db['temp_users'].count_documents({})
        print(f"Deleted {deleted_count} expired temporary users")
        print(f"Remaining temporary users: {new_count}")
        
        return deleted_count
    else:
        print("Temporary users collection doesn't exist")
        return 0

if __name__ == "__main__":
    import sys
    
    # Get hours from command line argument if provided
    hours = 1
    if len(sys.argv) > 1:
        try:
            hours = int(sys.argv[1])
        except ValueError:
            print(f"Invalid hours value: {sys.argv[1]}. Using default (1 hour).")
    
    print(f"Cleaning up temporary users older than {hours} hour(s)...")
    cleanup_temp_users(hours)
    print("Cleanup complete") 