from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Order

class Command(BaseCommand):
    help = "Fix orders that were incorrectly marked completed without escrow release or payment confirmation."

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Apply fixes (otherwise dry-run)')

    def handle(self, *args, **options):
        dry_run = not options['apply']
        qs = Order.objects.filter(status='completed', escrow_released=False)
        fixed = 0
        total = qs.count()
        self.stdout.write(f"Found {total} orders marked completed without escrow release")
        for order in qs:
            original_status = order.status
            # Decide correct status
            if getattr(order, 'is_paid', False) or order.payment_status == 'paid':
                new_status = 'delivered' if order.delivered_at else 'in_progress'
            else:
                new_status = 'in_progress' if order.accepted_at else 'pending'

            self.stdout.write(f"Order #{order.id}: {original_status} -> {new_status} (paid={getattr(order,'is_paid',False) or order.payment_status=='paid'}, escrow_released={order.escrow_released})")
            if not dry_run:
                order.status = new_status
                order.completed_at = None
                order.save(update_fields=['status', 'completed_at'])
                fixed += 1
        self.stdout.write(self.style.SUCCESS(f"Dry-run: {dry_run}. Fixed {fixed}/{total} orders."))
