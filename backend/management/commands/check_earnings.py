from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, Order, Transaction

class Command(BaseCommand):
    help = 'Check earnings for a specific user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to check earnings for')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            profile = UserProfile.objects.get(user=user)
            
            completed_orders = Order.objects.filter(freelancer=user, status='completed')
            total_earnings = sum(order.price for order in completed_orders if order.price)
            transactions = Transaction.objects.filter(user=user, transaction_type='payment')
            
            self.stdout.write(f"\n=== EARNINGS REPORT FOR {username.upper()} ===")
            self.stdout.write(f"Total Earnings: ${profile.total_earnings}")
            self.stdout.write(f"Available Balance: ${profile.available_balance}")
            self.stdout.write(f"Escrow Balance: ${profile.escrow_balance}")
            self.stdout.write(f"Completed Orders: {completed_orders.count()}")
            self.stdout.write(f"Calculated Earnings: ${total_earnings}")
            self.stdout.write(f"Payment Transactions: {transactions.count()}")
            
            if completed_orders.exists():
                self.stdout.write(f"\nRecent Orders:")
                for order in completed_orders[:5]:
                    self.stdout.write(f"  - Order #{order.id}: ${order.price} ({order.gig.title})")
                    
        except User.DoesNotExist:
            self.stdout.write(f"User '{username}' not found")
        except UserProfile.DoesNotExist:
            self.stdout.write(f"Profile for user '{username}' not found")