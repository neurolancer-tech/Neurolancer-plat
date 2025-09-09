from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Newsletter
from api.newsletter_service import NewsletterService

class Command(BaseCommand):
    help = 'Send weekly newsletter to all active subscribers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force send even if newsletter was already sent this week',
        )

    def handle(self, *args, **options):
        self.stdout.write('Starting weekly newsletter generation...')
        
        # Check if newsletter was already sent this week
        from datetime import timedelta
        week_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=timezone.now().weekday())
        
        if not options['force']:
            existing_newsletter = Newsletter.objects.filter(
                newsletter_type='weekly_digest',
                status='sent',
                sent_at__gte=week_start
            ).first()
            
            if existing_newsletter:
                self.stdout.write(
                    self.style.WARNING(
                        f'Weekly newsletter already sent on {existing_newsletter.sent_at}. Use --force to send anyway.'
                    )
                )
                return
        
        # Generate newsletter content
        try:
            newsletter_data = NewsletterService.generate_weekly_digest()
            
            if options['dry_run']:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'DRY RUN: Would create newsletter "{newsletter_data["title"]}"'
                    )
                )
                self.stdout.write(f'Subject: {newsletter_data["subject"]}')
                self.stdout.write(f'Type: {newsletter_data["newsletter_type"]}')
                return
            
            # Create newsletter
            from django.contrib.auth.models import User
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                self.stdout.write(
                    self.style.ERROR('No admin user found to create newsletter')
                )
                return
            
            newsletter = Newsletter.objects.create(
                title=newsletter_data['title'],
                subject=newsletter_data['subject'],
                newsletter_type=newsletter_data['newsletter_type'],
                content=newsletter_data['content'],
                target_audience='all',
                created_by=admin_user
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created newsletter: {newsletter.title}'
                )
            )
            
            # Send newsletter
            result = NewsletterService.send_newsletter(newsletter)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Newsletter sent successfully!'
                )
            )
            self.stdout.write(f'Recipients: {result["total_recipients"]}')
            self.stdout.write(f'Sent: {result["sent_count"]}')
            self.stdout.write(f'Failed: {result["failed_count"]}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error generating/sending newsletter: {str(e)}')
            )
            raise