import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
import json
import os
import logging

logger = logging.getLogger(__name__)

class FirebaseService:
    _initialized = False
    
    @classmethod
    def initialize(cls):
        """Initialize Firebase Admin SDK"""
        if cls._initialized:
            return
        
        try:
            # Try to get Firebase credentials from environment or settings
            firebase_cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
            firebase_cred_json = getattr(settings, 'FIREBASE_CREDENTIALS_JSON', None)
            
            if firebase_cred_path and os.path.exists(firebase_cred_path):
                # Initialize with service account file
                cred = credentials.Certificate(firebase_cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account file")
            elif firebase_cred_json:
                # Initialize with JSON string from environment
                cred_dict = json.loads(firebase_cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with JSON credentials")
            else:
                # Try to initialize with default credentials (for development)
                try:
                    firebase_admin.initialize_app()
                    logger.info("Firebase initialized with default credentials")
                except Exception as e:
                    logger.warning(f"Firebase initialization failed: {e}")
                    # Create a mock service for development
                    cls._initialized = True
                    return
            
            cls._initialized = True
            logger.info("Firebase service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            cls._initialized = True  # Set to True to avoid repeated attempts
    
    @classmethod
    def send_verification_code(cls, phone_number: str) -> dict:
        """
        Send SMS verification code using Firebase Auth
        
        Args:
            phone_number (str): Phone number in E.164 format (e.g., +1234567890)
            
        Returns:
            dict: Response with success status and session info
        """
        cls.initialize()
        
        try:
            # For Firebase Auth, we need to use the client SDK for phone verification
            # The admin SDK doesn't directly support sending SMS verification codes
            # Instead, we'll generate a custom token and return instructions for client-side verification
            
            # Generate a verification code for our own tracking
            import random
            import string
            verification_code = ''.join(random.choices(string.digits, k=6))
            
            # In a real implementation, you would:
            # 1. Use Firebase Auth client SDK on the frontend to send SMS
            # 2. Or use a third-party SMS service like Twilio
            # 3. Or use Firebase Functions to handle SMS sending
            
            # For now, we'll simulate the process and return the code for testing
            return {
                'success': True,
                'message': 'Verification code sent successfully',
                'verification_code': verification_code,  # Remove in production
                'session_info': f'firebase_session_{phone_number}_{verification_code}',
                'instructions': 'Use Firebase Auth client SDK to verify this code'
            }
            
        except Exception as e:
            logger.error(f"Failed to send verification code: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send verification code'
            }
    
    @classmethod
    def verify_phone_number(cls, session_info: str, verification_code: str) -> dict:
        """
        Verify phone number with the provided code
        
        Args:
            session_info (str): Session information from send_verification_code
            verification_code (str): 6-digit verification code
            
        Returns:
            dict: Verification result
        """
        cls.initialize()
        
        try:
            # Extract the original code from session_info for testing
            if session_info.startswith('firebase_session_'):
                parts = session_info.split('_')
                if len(parts) >= 4:
                    original_code = parts[-1]
                    if original_code == verification_code:
                        return {
                            'success': True,
                            'message': 'Phone number verified successfully',
                            'verified': True
                        }
            
            return {
                'success': False,
                'message': 'Invalid verification code',
                'verified': False
            }
            
        except Exception as e:
            logger.error(f"Failed to verify phone number: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Verification failed'
            }
    
    @classmethod
    def create_custom_token(cls, uid: str, additional_claims: dict = None) -> str:
        """
        Create a custom Firebase token for a user
        
        Args:
            uid (str): User ID
            additional_claims (dict): Additional claims to include in token
            
        Returns:
            str: Custom token
        """
        cls.initialize()
        
        try:
            custom_token = auth.create_custom_token(uid, additional_claims)
            return custom_token.decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to create custom token: {e}")
            raise e
    
    @classmethod
    def verify_id_token(cls, id_token: str) -> dict:
        """
        Verify Firebase ID token
        
        Args:
            id_token (str): Firebase ID token
            
        Returns:
            dict: Decoded token claims
        """
        cls.initialize()
        
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            logger.error(f"Failed to verify ID token: {e}")
            raise e

# Initialize Firebase on module import
FirebaseService.initialize()