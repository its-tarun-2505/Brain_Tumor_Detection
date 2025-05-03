import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

def reset_visitors():
    # MongoDB connection
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/brain_tumor_detection')
    client = pymongo.MongoClient(mongo_uri)
    db = client['brain_tumor_detection']
    
    # Check if visitors collection exists
    collection_names = db.list_collection_names()
    if 'visitors' in collection_names:
        # Get current count
        visitors_count = db['visitors'].count_documents({})
        print(f"Current visitor count: {visitors_count}")
        
        # Drop the collection
        db['visitors'].drop()
        print("Visitors collection dropped")
        
        # Create a new empty collection
        db.create_collection('visitors')
        print("New empty visitors collection created")
    else:
        print("Visitors collection doesn't exist")
        # Create a new collection
        db.create_collection('visitors')
        print("New visitors collection created")
    
    # Verify the count is now 0
    new_count = db['visitors'].count_documents({})
    print(f"New visitor count: {new_count}")
    
    return new_count

if __name__ == "__main__":
    reset_visitors()
    print("Visitor count has been reset to 0") 