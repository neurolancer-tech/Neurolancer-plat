# Neurolancer Paystack Integration Guide

## Overview

Neurolancer uses Paystack as the primary payment processor for handling payments and withdrawals in the Kenyan market. The integration supports multiple payment methods including M-Pesa, bank transfers, and card payments, with automatic currency conversion between USD (internal) and KES (Paystack).

## Architecture

### Core Components

1. **PaystackAPI Class** (`api/payments.py`)
2. **PaystackWithdrawal Class** (`api/paystack_withdrawal.py`)
3. **PaystackAPI Utils** (`api/paystack_utils.py`)
4. **Views & Endpoints** (`api/views_payments.py`)

## Configuration

### Environment Variables
```python
PAYSTACK_SECRET_KEY = 'sk_test_fd47bd1c9a97e30551cc3bb2def6d664d1671246'  # Test Key
PAYSTACK_PUBLIC_KEY = 'pk_test_ce9730c10c85c796d2382e48d8635c0dcb59dd1a'  # Test Key
PAYSTACK_BASE_URL = 'https://api.paystack.co'
```

### Currency Configuration
```python
KES_TO_USD_RATE = Decimal('0.0077')  # 1 KES = 0.0077 USD
USD_TO_KES_RATE = Decimal('130.0')   # 1 USD = 130 KES
PLATFORM_FEE_PERCENTAGE = Decimal('0.05')  # 5% platform fee
PROCESSING_FEE_KES = Decimal('50.00')  # 50 KES processing fee
```

## Payment Flow

### 1. Payment Initialization

**Endpoint**: `POST /api/payments/initialize/`

**Supported Payment Types**:
- **Gig Orders**: Fixed-price service purchases
- **Job Payments**: Hourly or project-based work
- **Course Enrollments**: Learning platform purchases

**Process**:
1. Calculate fees (platform fee + processing fee)
2. Convert USD amounts to KES for Paystack
3. Initialize Paystack transaction with M-Pesa support
4. Return authorization URL for payment

**Example Request**:
```json
{
  "order_id": 123,
  "payment_type": "gig"
}
```

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "abc123",
    "reference": "neurolancer_order_123_20241201120000",
    "amount_breakdown": {
      "base_amount": 1000.0,
      "platform_fee": 100.0,
      "processing_fee": 50.0,
      "total_amount": 1150.0
    }
  }
}
```

### 2. Payment Verification

**Endpoint**: `POST /api/payments/verify/`

**Process**:
1. Verify transaction with Paystack API
2. Update order/job/course status
3. Place all funds in escrow
4. Create transaction records
5. Send notifications
6. Await completion for escrow release

**Escrow System**:
- **All Payment Types**: Funds held in escrow until completion/delivery
- **Gig Orders**: Released when client marks order as complete
- **Job Payments**: Released when client approves job completion
- **Course Payments**: Released when student confirms course access

### 3. Webhook Handling

**Endpoint**: `POST /api/payments/webhook/`

**Security**: HMAC signature verification using secret key

**Supported Events**:
- `charge.success`: Payment completed
- `transfer.success`: Withdrawal completed
- `transfer.failed`: Withdrawal failed

## Withdrawal System

### 1. Bank Account Setup

**Endpoint**: `POST /api/payments/create-recipient/`

**Process**:
1. Resolve account number with bank
2. Verify account details
3. Create Paystack transfer recipient
4. Store recipient code for future transfers

### 2. Withdrawal Processing

**Endpoint**: `POST /api/payments/withdraw-paystack/`

**Process**:
1. Validate user balance (USD to KES conversion)
2. Create transfer recipient if needed
3. Initiate Paystack transfer
4. Deduct from user balance
5. Create withdrawal record
6. Handle webhook updates

**Supported Methods**:
- **Bank Transfer**: Traditional bank accounts
- **M-Pesa**: Mobile money (Kenya)

## Subaccount System (Alternative Implementation)

### Purpose
Split payments automatically between platform and freelancers

### Implementation
```python
# Create subaccount for freelancer
paystack.create_subaccount(
    business_name="Freelancer Name",
    settlement_bank="bank_code",
    account_number="account_number",
    percentage_charge=5  # 5% platform fee
)

# Initialize split payment
paystack.initialize_split_payment(
    email="client@email.com",
    amount=amount_kes,
    subaccount_code="ACCT_xxx",
    reference="unique_reference"
)
```

## Fee Structure

### Platform Fees
- **Platform Fee**: 5% of base amount
- **Processing Fee**: 50 KES flat fee
- **Paystack Fee**: ~3.9% + 100 KES (handled by Paystack)

### Fee Distribution Example
```
Base Amount: 1000 KES
Platform Fee: 50 KES (5%)
Processing Fee: 50 KES
Total Client Pays: 1100 KES
Freelancer Receives: 1000 KES (after Paystack fees)
Platform Keeps: 100 KES
```

## Currency Handling

### Internal Storage (USD)
- All balances stored in USD in database
- Consistent across different markets
- Easy reporting and analytics

### Payment Processing (KES)
- Convert to KES for Paystack transactions
- Real-time conversion using fixed rates
- Display KES amounts to users in Kenya

### Conversion Functions
```python
def convert_usd_to_kes(usd_amount):
    return usd_amount * USD_TO_KES_RATE

def convert_kes_to_usd(kes_amount):
    return kes_amount * KES_TO_USD_RATE
```

## Database Models

### Key Fields in UserProfile
```python
# Financial balances (stored in USD)
total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
escrow_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
available_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

# Paystack integration
paystack_subaccount_code = models.CharField(max_length=100, blank=True, null=True)
bank_code = models.CharField(max_length=10, blank=True)
account_number = models.CharField(max_length=20, blank=True)
account_name = models.CharField(max_length=100, blank=True)
```

### Transaction Model
```python
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=15, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200)
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=15, choices=TRANSACTION_STATUS)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Withdrawal Model
```python
class Withdrawal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    paystack_recipient_code = models.CharField(max_length=100, blank=True)
    paystack_transfer_code = models.CharField(max_length=100, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=15, choices=WITHDRAWAL_STATUS)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
```

## API Endpoints

### Payment Endpoints
```
POST /api/payments/initialize/          # Initialize payment
POST /api/payments/verify/              # Verify payment
POST /api/payments/webhook/             # Paystack webhook
POST /api/payments/calculate-fees/      # Calculate payment fees
POST /api/payments/release-escrow/      # Release escrow funds
```

### Withdrawal Endpoints
```
POST /api/payments/withdraw-paystack/   # Paystack withdrawal
POST /api/payments/create-recipient/    # Create transfer recipient
POST /api/payments/process-withdrawal/  # Process withdrawal
GET  /api/payments/banks/               # Get supported banks
GET  /api/payments/mobile-money/        # Get mobile money providers
```

### Subaccount Endpoints
```
POST /api/payments/subaccount/create/   # Create subaccount
GET  /api/payments/banks/               # Get banks list
POST /api/payments/initialize/          # Split payment
POST /api/payments/verify/              # Verify split payment
```

## Error Handling

### Common Error Scenarios
1. **Insufficient Balance**: Check before withdrawal
2. **Invalid Bank Details**: Validate with Paystack
3. **Network Failures**: Retry mechanism
4. **Webhook Signature**: Verify authenticity
5. **Currency Conversion**: Handle rate changes

### Error Response Format
```json
{
  "status": "error",
  "message": "Insufficient balance",
  "error_code": "INSUFFICIENT_BALANCE",
  "details": {
    "available": 50.00,
    "required": 100.00
  }
}
```

## Security Features

### Webhook Security
- HMAC SHA512 signature verification
- IP whitelist (Paystack IPs)
- Idempotency handling

### Payment Security
- Reference uniqueness
- Amount validation
- User authorization checks
- Transaction logging

## Testing

### Test Credentials
```
Secret Key: sk_test_fd47bd1c9a97e30551cc3bb2def6d664d1671246
Public Key: pk_test_ce9730c10c85c796d2382e48d8635c0dcb59dd1a
```

### Test Cards
```
Successful: 4084084084084081
Declined: 4084084084084081 (with CVV 408)
```

### Test M-Pesa
```
Phone: 254708374149
PIN: 1234
```

## Monitoring & Analytics

### Key Metrics
- Payment success rate
- Average transaction value
- Withdrawal processing time
- Currency conversion accuracy
- Platform fee collection

### Logging
- All transactions logged
- Webhook events tracked
- Error rates monitored
- Performance metrics

## Future Enhancements

### Planned Features
1. **Multi-currency Support**: Support for other African currencies
2. **Automated Payouts**: Scheduled freelancer payments
3. **Advanced Analytics**: Revenue dashboards
4. **Fraud Detection**: AI-powered risk assessment
5. **Mobile App Integration**: Native payment flows

### Optimization Areas
1. **Exchange Rates**: Real-time rate updates
2. **Fee Structure**: Dynamic fee calculation
3. **Batch Processing**: Bulk withdrawal processing
4. **Caching**: Payment status caching
5. **Webhooks**: Improved reliability

## Troubleshooting

### Common Issues

1. **Payment Stuck in Pending**
   - Check webhook delivery
   - Verify transaction manually
   - Contact Paystack support

2. **Withdrawal Failures**
   - Verify bank account details
   - Check Paystack balance
   - Review transfer limits

3. **Currency Conversion Errors**
   - Update exchange rates
   - Validate amount calculations
   - Check decimal precision

4. **Webhook Failures**
   - Verify signature calculation
   - Check endpoint accessibility
   - Review error logs

### Debug Commands
```bash
# Check Paystack balance
curl -H "Authorization: Bearer sk_test_..." https://api.paystack.co/balance

# Verify transaction
curl -H "Authorization: Bearer sk_test_..." https://api.paystack.co/transaction/verify/reference

# List banks
curl -H "Authorization: Bearer sk_test_..." https://api.paystack.co/bank?country=kenya
```

## Support & Documentation

### Resources
- [Paystack Documentation](https://paystack.com/docs)
- [Paystack API Reference](https://paystack.com/docs/api)
- [M-Pesa Integration Guide](https://paystack.com/docs/payments/mobile-money)

### Contact
- **Paystack Support**: support@paystack.com
- **Developer Portal**: https://dashboard.paystack.com
- **Status Page**: https://status.paystack.com

---

This integration provides a robust, secure, and scalable payment system for the Neurolancer platform, supporting the unique needs of the Kenyan freelance marketplace while maintaining global compatibility.