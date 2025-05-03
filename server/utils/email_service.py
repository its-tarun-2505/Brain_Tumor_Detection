import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

OTP_SERVICE_URL = os.getenv('OTP_SERVICE_URL', 'http://localhost:3001/api/send-otp')

def send_otp_email(email, otp, template_type='signup'):
    """
    Send OTP email via the Node.js microservice
    
    Args:
        email (str): The recipient's email address
        otp (str): The OTP code to send
        template_type (str): Type of email template - 'signup', 'reset', or 'verification'
    
    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    try:
        print(f"Sending OTP {otp} to {email} via OTP service at {OTP_SERVICE_URL}")
        
        payload = {
            'email': email,
            'otp': otp,
            'templateType': template_type
        }
        
        print(f"Request payload: {json.dumps(payload)}")
        
        response = requests.post(
            OTP_SERVICE_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10  # Add timeout to prevent hanging
        )
        
        print(f"OTP service response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"OTP sent successfully to {email}")
            
            # For testing purposes, log the OTP if provided by the test service
            try:
                response_data = response.json()
                if 'testOtp' in response_data:
                    print(f"======== TEST OTP for {email}: {response_data['testOtp']} ========")
                    print(f"Please use this OTP for testing as no real email will be sent in Ethereal mode")
            except:
                pass
                
            return True
        else:
            print(f"Failed to send OTP: {response.text}")
            return False
    except Exception as e:
        print(f"Error sending OTP: {str(e)}")
        return False 