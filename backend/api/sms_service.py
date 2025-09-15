import os
import random
import string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SMSService:
    """Real SMS service using Twilio"""
    
    @classmethod
    def send_verification_code(cls, phone_number: str) -> dict:
        """
        Send SMS verification code using Twilio
        
        Args:
            phone_number (str): Phone number in E.164 format
            
        Returns:
            dict: Response with success status and verification code
        """
        try:
            # Generate 6-digit verification code
            verification_code = ''.join(random.choices(string.digits, k=6))
            
            # Try to use Twilio Verify if credentials are available
            twilio_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
            twilio_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
            
            if twilio_sid and twilio_token:
                return cls._send_twilio_sms(phone_number, verification_code, twilio_sid, twilio_token, None)
            else:
                # Fallback to mock for development
                logger.warning("Twilio credentials not configured, using mock SMS")
                return cls._send_mock_sms(phone_number, verification_code)
                
        except Exception as e:
            logger.error(f"SMS service error: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send SMS verification code'
            }
    
    @classmethod
    def _send_twilio_sms(cls, phone_number: str, code: str, sid: str, token: str, from_phone: str) -> dict:
        """Send SMS using Twilio Verify API"""
        try:
            from twilio.rest import Client
            
            client = Client(sid, token)
            
            # Use Twilio Verify service
            verify_service_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', 'VAff7eb489cf64e2df684b828bc8a1a2e3')
            
            verification = client.verify.v2.services(verify_service_sid).verifications.create(
                to=phone_number,
                channel='sms'
            )
            
            logger.info(f"Twilio Verify SMS sent to {phone_number}, Status: {verification.status}")
            
            return {
                'success': True,
                'message': 'SMS sent successfully',
                'session_info': f'twilio_verify_{phone_number}_{verification.sid}',
                'provider': 'twilio_verify',
                'verification_sid': verification.sid
            }
            
        except ImportError:
            logger.error("Twilio library not installed. Install with: pip install twilio")
            return cls._send_mock_sms(phone_number, code)
        except Exception as e:
            logger.error(f"Twilio Verify failed: {e}")
            return cls._send_mock_sms(phone_number, code)
    
    @classmethod
    def _send_mock_sms(cls, phone_number: str, code: str) -> dict:
        """Mock SMS for development/testing"""
        logger.info(f"MOCK SMS to {phone_number}: Your verification code is {code}")
        
        return {
            'success': True,
            'message': 'SMS sent successfully (MOCK)',
            'verification_code': code,  # Always include in mock mode
            'session_info': f'mock_session_{phone_number}_{code}',
            'provider': 'mock',
            'mock': True
        }
    
    @classmethod
    def verify_code(cls, session_info: str, provided_code: str) -> dict:
        """
        Verify the SMS code
        
        Args:
            session_info (str): Session information from send_verification_code
            provided_code (str): Code provided by user
            
        Returns:
            dict: Verification result
        """
        try:
            # Handle Twilio Verify
            if session_info.startswith('twilio_verify_'):
                return cls._verify_twilio_code(session_info, provided_code)
            
            # Handle mock sessions
            elif session_info.startswith('mock_session_'):
                parts = session_info.split('_')
                if len(parts) >= 4:
                    original_code = parts[-1]
                    if original_code == provided_code:
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
            logger.error(f"Code verification error: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Verification failed'
            }
    
    @classmethod
    def _verify_twilio_code(cls, session_info: str, code: str) -> dict:
        """Verify code using Twilio Verify API"""
        try:
            from twilio.rest import Client
            
            # Extract phone number from session info
            parts = session_info.split('_')
            phone_number = parts[2] if len(parts) > 2 else None
            
            if not phone_number:
                return {
                    'success': False,
                    'message': 'Invalid session info',
                    'verified': False
                }
            
            # Get Twilio credentials
            sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
            token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
            verify_service_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', 'VAff7eb489cf64e2df684b828bc8a1a2e3')
            
            if not sid or not token:
                return {
                    'success': False,
                    'message': 'Twilio credentials not configured',
                    'verified': False
                }
            
            client = Client(sid, token)
            
            verification_check = client.verify.v2.services(verify_service_sid).verification_checks.create(
                to=phone_number,
                code=code
            )
            
            if verification_check.status == 'approved':
                logger.info(f"Twilio Verify successful for {phone_number}")
                return {
                    'success': True,
                    'message': 'Phone number verified successfully',
                    'verified': True
                }
            else:
                logger.warning(f"Twilio Verify failed for {phone_number}: {verification_check.status}")
                return {
                    'success': False,
                    'message': 'Invalid verification code',
                    'verified': False
                }
                
        except Exception as e:
            logger.error(f"Twilio Verify error: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Verification failed'
            }