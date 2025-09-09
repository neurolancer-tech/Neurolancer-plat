import requests
import json
from django.conf import settings
from decimal import Decimal

class PaystackAPI:
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }
    
    def create_subaccount(self, business_name, settlement_bank, account_number, percentage_charge=10):
        """Create a subaccount for freelancer/vendor"""
        url = f"{self.BASE_URL}/subaccount"
        data = {
            "business_name": business_name,
            "settlement_bank": settlement_bank,
            "account_number": account_number,
            "percentage_charge": percentage_charge,
            "description": f"Subaccount for {business_name}"
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def initialize_split_payment(self, email, amount, subaccount_code, reference, metadata=None):
        """Initialize payment with split to subaccount"""
        url = f"{self.BASE_URL}/transaction/initialize"
        
        # Convert USD to KES if needed
        if isinstance(amount, Decimal):
            amount = float(amount)
        
        # Amount should be in kobo (multiply by 100)
        amount_kobo = int(amount * 100)
        
        data = {
            "email": email,
            "amount": amount_kobo,
            "currency": "KES",
            "reference": reference,
            "subaccount": subaccount_code,
            "transaction_charge": int(amount * 0.1 * 100),  # 10% platform fee
            "bearer": "subaccount"
        }
        
        if metadata:
            data["metadata"] = metadata
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def verify_payment(self, reference):
        """Verify payment status"""
        url = f"{self.BASE_URL}/transaction/verify/{reference}"
        response = requests.get(url, headers=self.headers)
        return response.json()
    
    def list_banks(self):
        """Get list of supported banks"""
        url = f"{self.BASE_URL}/bank"
        response = requests.get(url, headers=self.headers)
        return response.json()
    
    def resolve_account(self, account_number, bank_code):
        """Resolve bank account details"""
        url = f"{self.BASE_URL}/bank/resolve"
        params = {
            "account_number": account_number,
            "bank_code": bank_code
        }
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()

paystack = PaystackAPI()