from django.urls import path
from . import payments, transaction_views, views_payments

urlpatterns = [
    path('initialize/', payments.initialize_payment, name='initialize_payment'),
    path('verify/', payments.verify_payment, name='verify_payment'),
    path('webhook/', payments.paystack_webhook, name='paystack_webhook'),
    path('withdraw/', payments.initiate_withdrawal, name='initiate_withdrawal'),
    path('banks/', payments.get_banks, name='get_banks'),
    path('mobile-money/', payments.get_mobile_money_providers, name='get_mobile_money_providers'),
    path('calculate-fees/', payments.calculate_payment_fees, name='calculate_payment_fees'),
    path('release-escrow/', payments.release_escrow, name='release_escrow'),
    path('wallet-payment/', views_payments.wallet_payment, name='wallet_payment'),
    path('record-transaction/', transaction_views.record_transaction, name='record_transaction'),
    path('transactions/', transaction_views.get_transactions, name='get_transactions'),
]