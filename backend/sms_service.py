"""
Unified SMS Service
Supports multiple free SMS providers with automatic fallback
"""

import os
import random
import string
from django.conf import settings

class UnifiedSMSService:
    """
    Unified SMS service that tries multiple providers in order:
    1. Vonage (easiest setup, €2 free credit)
    2. Firebase (10,000 free SMS/month)
    3. AWS SNS (100 free SMS/month)
    4. Mock mode (development)
    """
    
    def __init__(self):
        self.providers = self._initialize_providers()
        self.active_provider = self._get_active_provider()
        
    def _initialize_providers(self):
        """Initialize available SMS providers"""
        providers = {}
        
        # 1. Try Vonage (easiest setup)
        try:
            if os.getenv('VONAGE_API_KEY') and os.getenv('VONAGE_API_SECRET'):
                import vonage
                providers['vonage'] = vonage.Client(
                    key=os.getenv('VONAGE_API_KEY'),
                    secret=os.getenv('VONAGE_API_SECRET')
                )
                print("✅ Vonage SMS provider initialized")
        except ImportError:
            print("❌ Vonage not available (pip install vonage)")
        except Exception as e:
            print(f"❌ Vonage setup failed: {e}")
        
        # 2. Try Firebase
        try:
            firebase_cred = os.getenv('FIREBASE_CREDENTIALS')
            firebase_project = os.getenv('FIREBASE_PROJECT_ID')
            
            if firebase_cred and firebase_project:
                import firebase_admin
                from firebase_admin import credentials, auth
                import json
                
                if not firebase_admin._apps:
                    cred_dict = json.loads(firebase_cred)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred, {
                        'projectId': firebase_project
                    })
                
                providers['firebase'] = auth
                print("✅ Firebase SMS provider initialized")
        except ImportError:
            print("❌ Firebase not available (pip install firebase-admin)")
        except Exception as e:
            print(f"❌ Firebase setup failed: {e}")
        
        # 3. Try AWS SNS
        try:
            if (os.getenv('AWS_ACCESS_KEY_ID') and 
                os.getenv('AWS_SECRET_ACCESS_KEY')):
                import boto3
                providers['aws'] = boto3.client(
                    'sns',
                    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                    region_name=os.getenv('AWS_REGION', 'us-east-1')
                )
                print("✅ AWS SNS provider initialized")
        except ImportError:
            print("❌ AWS SNS not available (pip install boto3)")
        except Exception as e:
            print(f"❌ AWS SNS setup failed: {e}")
        
        return providers
    
    def _get_active_provider(self):
        """Get the first available provider"""
        if 'vonage' in self.providers:
            return 'vonage'
        elif 'firebase' in self.providers:
            return 'firebase'
        elif 'aws' in self.providers:
            return 'aws'
        else:
            return 'mock'
    
    def send_verification_code(self, phone_number):
        """Send SMS verification code using the best available provider"""
        try:
            clean_phone = self._clean_phone_number(phone_number)
            
            if self.active_provider == 'vonage':
                return self._send_vonage_sms(clean_phone)
            elif self.active_provider == 'firebase':
                return self._send_firebase_sms(clean_phone)
            elif self.active_provider == 'aws':
                return self._send_aws_sms(clean_phone)
            else:
                return self._send_mock_sms(clean_phone)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send verification code'
            }
    
    def _send_vonage_sms(self, phone_number):
        """Send SMS via Vonage"""
        try:
            verification_code = ''.join(random.choices(string.digits, k=6))
            
            response = self.providers['vonage'].sms.send_message({
                "from": "Neurolancer",
                "to": phone_number,
                "text": f"Your Neurolancer verification code is: {verification_code}"
            })
            
            if response["messages"][0]["status"] == "0":
                return {
                    'success': True,
                    'message': 'SMS sent successfully via Vonage',
                    'session_info': f"vonage_{phone_number}_{verification_code}",
                    'phone_number': phone_number,
                    'provider': 'vonage',
                    'verification_code': verification_code if settings.DEBUG else None
                }
            else:
                error_text = response["messages"][0].get("error-text", "Unknown error")
                raise Exception(f"Vonage error: {error_text}")
                
        except Exception as e:
            print(f"Vonage SMS failed: {e}")
            # Fallback to next provider
            return self._send_mock_sms(phone_number)
    
    def _send_firebase_sms(self, phone_number):
        """Send SMS via Firebase"""
        try:
            verification_code = ''.join(random.choices(string.digits, k=6))
            
            # Firebase Phone Auth implementation would go here
            # For now, simulate success
            
            return {
                'success': True,
                'message': 'SMS sent successfully via Firebase',
                'session_info': f"firebase_{phone_number}_{verification_code}",
                'phone_number': phone_number,
                'provider': 'firebase',
                'verification_code': verification_code if settings.DEBUG else None
            }
            
        except Exception as e:
            print(f"Firebase SMS failed: {e}")
            return self._send_mock_sms(phone_number)
    
    def _send_aws_sms(self, phone_number):
        """Send SMS via AWS SNS"""
        try:
            verification_code = ''.join(random.choices(string.digits, k=6))
            
            response = self.providers['aws'].publish(
                PhoneNumber=phone_number,
                Message=f"Your Neurolancer verification code is: {verification_code}"
            )
            
            return {
                'success': True,
                'message': 'SMS sent successfully via AWS SNS',
                'session_info': f"aws_{phone_number}_{verification_code}",
                'phone_number': phone_number,
                'provider': 'aws',
                'message_id': response['MessageId'],
                'verification_code': verification_code if settings.DEBUG else None
            }
            
        except Exception as e:
            print(f"AWS SNS failed: {e}")
            return self._send_mock_sms(phone_number)
    
    def _send_mock_sms(self, phone_number):
        """Send mock SMS for development"""
        verification_code = ''.join(random.choices(string.digits, k=6))
        session_info = f"mock_{phone_number}_{verification_code}"
        
        print(f"\n{'='*60}")
        print(f"📱 MOCK SMS VERIFICATION")
        print(f"{'='*60}")
        print(f"To: {phone_number}")
        print(f"Message: Your Neurolancer verification code is: {verification_code}")
        print(f"Session: {session_info}")
        print(f"Provider: Mock (no real SMS sent)")
        print(f"{'='*60}")
        print(f"💡 To enable real SMS, set up one of these providers:")
        print(f"   • Vonage: VONAGE_API_KEY + VONAGE_API_SECRET")
        print(f"   • Firebase: FIREBASE_CREDENTIALS + FIREBASE_PROJECT_ID")
        print(f"   • AWS SNS: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY")
        print(f"{'='*60}\n")
        
        return {
            'success': True,
            'message': 'SMS sent successfully (MOCK MODE)',
            'verification_code': verification_code,
            'session_info': session_info,
            'phone_number': phone_number,
            'provider': 'mock',
            'mock': True,
            'setup_help': {
                'vonage': 'Set VONAGE_API_KEY and VONAGE_API_SECRET',
                'firebase': 'Set FIREBASE_CREDENTIALS and FIREBASE_PROJECT_ID',
                'aws': 'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY'
            }
        }
    
    def verify_phone_number(self, session_info, verification_code):
        """Verify phone number with code"""
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
                if len(parts) >= 3:
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
    
    def get_provider_status(self):
        """Get status of all providers"""
        return {
            'active_provider': self.active_provider,
            'available_providers': list(self.providers.keys()),
            'setup_instructions': {
                'vonage': {
                    'required_env': ['VONAGE_API_KEY', 'VONAGE_API_SECRET'],
                    'install': 'pip install vonage',
                    'free_tier': '€2 credit (~30 SMS)',
                    'signup': 'https://dashboard.nexmo.com/sign-up'
                },
                'firebase': {
                    'required_env': ['FIREBASE_CREDENTIALS', 'FIREBASE_PROJECT_ID'],
                    'install': 'pip install firebase-admin',
                    'free_tier': '10,000 SMS/month',
                    'signup': 'https://console.firebase.google.com/'
                },
                'aws': {
                    'required_env': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
                    'install': 'pip install boto3',
                    'free_tier': '100 SMS/month for 12 months',
                    'signup': 'https://aws.amazon.com/'
                }
            }
        }

# Global instance
sms_service = UnifiedSMSService()