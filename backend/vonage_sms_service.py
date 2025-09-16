"""
Vonage (Nexmo) SMS Service
Free tier: €2 credit (about 30 SMS messages)
Easy setup, no complex configuration needed
"""

import os
import random
import string
from django.conf import settings

class VonageSMSService:
    """Vonage SMS Service for phone verification"""
    
    def __init__(self):
        self.vonage_available = self._check_vonage_setup()
        
    def _check_vonage_setup(self):
        """Check if Vonage is properly configured"""
        try:
            api_key = os.getenv('VONAGE_API_KEY')
            api_secret = os.getenv('VONAGE_API_SECRET')
            
            if api_key and api_secret:
                import vonage
                self.client = vonage.Client(key=api_key, secret=api_secret)
                return True
            else:
                print("Vonage credentials not found, using mock mode")
                return False
                
        except ImportError:
            print("Vonage library not installed. Install with: pip install vonage")
            return False
        except Exception as e:
            print(f"Vonage setup error: {e}")
            return False
    
    def send_verification_code(self, phone_number):
        """
        Send SMS verification code via Vonage
        """
        try:
            clean_phone = self._clean_phone_number(phone_number)
            
            if self.vonage_available:
                return self._send_vonage_sms(clean_phone)
            else:
                return self._send_mock_sms(clean_phone)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send verification code'
            }
    
    def _send_vonage_sms(self, phone_number):
        """Send real SMS using Vonage"""
        try:
            verification_code = ''.join(random.choices(string.digits, k=6))
            
            response = self.client.sms.send_message({
                "from": "Neurolancer",
                "to": phone_number,
                "text": f"Your Neurolancer verification code is: {verification_code}"
            })
            
            # Check if SMS was sent successfully
            if response["messages"][0]["status"] == "0":
                session_info = f"vonage_session_{phone_number}_{verification_code}"
                
                return {
                    'success': True,
                    'message': 'SMS sent successfully via Vonage',
                    'session_info': session_info,
                    'phone_number': phone_number,
                    'provider': 'vonage',
                    'message_id': response["messages"][0]["message-id"],
                    # Don't return code in production for security
                    'verification_code': verification_code if settings.DEBUG else None
                }
            else:
                error_text = response["messages"][0].get("error-text", "Unknown error")
                return {
                    'success': False,
                    'error': error_text,
                    'message': f'Vonage SMS failed: {error_text}'
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Vonage SMS sending failed'
            }
    
    def _send_mock_sms(self, phone_number):
        """Send mock SMS for development"""
        verification_code = ''.join(random.choices(string.digits, k=6))
        session_info = f"mock_session_{phone_number}_{verification_code}"
        
        print(f"\n{'='*50}")
        print(f"📱 MOCK SMS VERIFICATION (Vonage)")
        print(f"{'='*50}")
        print(f"To: {phone_number}")
        print(f"Message: Your Neurolancer verification code is: {verification_code}")
        print(f"Session: {session_info}")
        print(f"{'='*50}\n")
        
        return {
            'success': True,
            'message': 'SMS sent successfully (MOCK MODE - Vonage)',
            'verification_code': verification_code,
            'session_info': session_info,
            'phone_number': phone_number,
            'provider': 'vonage_mock',
            'mock': True
        }
    
    def verify_phone_number(self, session_info, verification_code):
        """
        Verify the phone number with the provided code
        """
        try:
            if not session_info or not verification_code:
                return {
                    'success': False,
                    'verified': False,
                    'message': 'Session info and verification code required'
                }
            
            # Extract expected code from session info
            if '_' in session_info:
                parts = session_info.split('_')
                if len(parts) >= 4:
                    expected_code = parts[-1]  # Last part is the code
                    
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
            
        except Exception as e:
            return {
                'success': False,
                'verified': False,
                'error': str(e),
                'message': 'Verification failed'
            }
    
    def _clean_phone_number(self, phone_number):
        """Clean and validate phone number"""
        import re
        
        # Remove all non-digit characters except +
        clean = re.sub(r'[^\d+]', '', phone_number)
        
        # Ensure it starts with +
        if not clean.startswith('+'):
            # Assume US number if no country code
            if len(clean) == 10:
                clean = '+1' + clean
            else:
                clean = '+' + clean
        
        # Basic validation
        if len(clean) < 10 or len(clean) > 16:
            raise ValueError("Invalid phone number format")
        
        return clean

# Global instance
vonage_sms_service = VonageSMSService()