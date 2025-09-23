from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from api.models import Message

class Command(BaseCommand):
    help = "Delete message attachments older than the configured retention period, keeping the message content."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            help="Override retention days (defaults to settings.MESSAGE_ATTACHMENT_RETENTION_DAYS)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do not delete, just report what would be deleted",
        )

    def handle(self, *args, **options):
        days = options.get("days") or getattr(settings, "MESSAGE_ATTACHMENT_RETENTION_DAYS", 2)
        dry_run = options.get("dry_run", False)

        cutoff = timezone.now() - timedelta(days=days)
        qs = Message.objects.filter(attachment__isnull=False, created_at__lt=cutoff).only(
            "id", "attachment", "attachment_url", "attachment_name", "attachment_type", "attachment_size", "created_at"
        )

        total = qs.count()
        deleted_files = 0
        cleared_rows = 0
        errors = 0

        self.stdout.write(
            self.style.NOTICE(
                f"Attachment cleanup: retention={days}d, cutoff={cutoff.isoformat()}, candidates={total}, dry_run={dry_run}"
            )
        )

        for msg in qs.iterator(chunk_size=200):
            try:
                file_name = getattr(msg.attachment, 'name', None)
                if not dry_run:
                    # Delete the underlying file from storage
                    try:
                        if msg.attachment:
                            msg.attachment.delete(save=False)
                            deleted_files += 1
                    except Exception:
                        # Continue even if storage deletion fails
                        errors += 1

                    # Clear DB fields
                    msg.attachment = None
                    msg.attachment_url = None
                    msg.attachment_name = None
                    msg.attachment_type = None
                    msg.attachment_size = None
                    msg.save(update_fields=[
                        "attachment", "attachment_url", "attachment_name", "attachment_type", "attachment_size"
                    ])
                    cleared_rows += 1

                else:
                    # Dry-run logging
                    self.stdout.write(f"Would delete: Message#{msg.id} file={file_name} created_at={msg.created_at}")
            except Exception as e:
                errors += 1
                self.stderr.write(f"Error cleaning Message#{getattr(msg,'id','?')}: {e}")

        summary = f"Cleanup complete: files_deleted={deleted_files}, rows_cleared={cleared_rows}, errors={errors}, candidates={total}"
        if errors == 0:
            self.stdout.write(self.style.SUCCESS(summary))
        else:
            self.stdout.write(self.style.WARNING(summary))
