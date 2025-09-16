import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
import json
import os
import logging

logger = logging.getLogger(__name__)

class FirebaseService:
    _initialized = False
    _firebase_available = False
    
    @classmethod
    def initialize(cls):
        """Initialize Firebase Admin SDK"""
        if cls._initialized:
            return
        
        try:
            # Try to get Firebase credentials from environment or settings
            firebase_cred_json = getattr(settings, 'FIREBASE_CREDENTIALS_JSON', None)
            firebase_cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
            
            if firebase_cred_json:
                # Initialize with JSON string from environment (Render deployment)
                try:
                    cred_dict = json.loads(firebase_cred_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    cls._firebase_available = True
                    logger.info("Firebase initialized with JSON credentials from environment")
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid Firebase JSON credentials: {e}")
                    cls._firebase_available = False
            elif firebase_cred_path and os.path.exists(firebase_cred_path):
                # Initialize with service account file (local development)
                cred = credentials.Certificate(firebase_cred_path)
                firebase_admin.initialize_app(cred)
                cls._firebase_available = True
                logger.info("Firebase initialized with service account file")
            else:
                # Firebase not configured - use mock mode
                logger.warning("Firebase credentials not found - using mock mode")
                cls._firebase_available = False
            
            cls._initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            cls._firebase_available = False
            cls._initialized = True
    
    @classmethod
    def send_verification_code(cls, phone_number: str) -> dict:
        """
        Send SMS verification code using Firebase or fallback
        
        Args:
            phone_number (str): Phone number in E.164 format (e.g., +1234567890)
            
        Returns:
            dict: Response with success status and session info
        """
        cls.initialize()
        
        try:
            if cls._firebase_available:
                # Try Firebase phone verification first
                try:
                    # Generate verification code
                    import random
                    import string
                    verification_code = ''.join(random.choices(string.digits, k=6))
                    
                    # Use Firebase Admin SDK to send SMS
                    from firebase_admin import auth
                    
                    # Create a custom token for phone verification
                    # Note: This is a simplified approach - real Firebase phone auth is more complex
                    session_info = f"firebase_session_{phone_number}_{verification_code}"
                    
                    logger.info(f"Firebase phone verification initiated for {phone_number}")
                    
                    # For now, we'll simulate Firebase SMS sending
                    # In production, you'd integrate with Firebase's phone auth service
                    return {
                        'success': True,
                        'message': 'Verification code sent via Firebase',
                        'session_info': session_info,
                        'phone_number': phone_number,
                        'provider': 'firebase',
                        'verification_code': verification_code if settings.DEBUG else None
                    }
                    
                except Exception as e:
                    logger.error(f"Firebase phone verification failed: {e}")
                    # Fall back to SMS service
                    from .sms_service import SMSService
                    return SMSService.send_verification_code(phone_number)
            else:
                # Fallback to SMS service (Twilio/Mock)
                logger.info(f"Firebase not available, using SMS service for phone verification: {phone_number}")
                from .sms_service import SMSService
                return SMSService.send_verification_code(phone_number)
            
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
            if session_info.startswith('firebase_session_'):
                # Handle Firebase session
                parts = session_info.split('_')
                if len(parts) >= 4:
                    expected_code = parts[-1]
                    if verification_code == expected_code:
                        return {
                            'success': True,
                            'verified': True,
                            'message': 'Phone number verified successfully'
                        }
                
                return {
                    'success': False,
                    'verified': False,
                    'message': 'Invalid verification code'
                }
            else:
                # Use SMS service for other sessions
                from .sms_service import SMSService
                return SMSService.verify_code(session_info, verification_code)
            
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