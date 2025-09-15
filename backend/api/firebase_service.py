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
        Send SMS verification code using real SMS service
        
        Args:
            phone_number (str): Phone number in E.164 format (e.g., +1234567890)
            
        Returns:
            dict: Response with success status and session info
        """
        cls.initialize()
        
        try:
            # Use the real SMS service
            from .sms_service import SMSService
            
            result = SMSService.send_verification_code(phone_number)
            
            if result['success']:
                logger.info(f"SMS verification code sent to {phone_number} via {result.get('provider', 'unknown')}")
                return result
            else:
                logger.error(f"SMS sending failed: {result.get('error', 'Unknown error')}")
                return result
            
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
            # Use the SMS service for verification
            from .sms_service import SMSService
            
            result = SMSService.verify_code(session_info, verification_code)
            
            if result['success'] and result['verified']:
                logger.info(f"Phone verification successful for session: {session_info[:20]}...")
            else:
                logger.warning(f"Phone verification failed for session: {session_info[:20]}...")
            
            return result
            
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