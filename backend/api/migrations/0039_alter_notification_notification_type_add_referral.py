# Generated manually to include 'referral' notification type
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0038_alter_notification_notification_type_referralcode_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('order', 'Order Update'),
                    ('message', 'New Message'),
                    ('job', 'Job Alert'),
                    ('proposal', 'Proposal Update'),
                    ('payment', 'Payment Update'),
                    ('system', 'System Notification'),
                    ('review', 'Review Notification'),
                    ('help', 'Help Request'),
                    ('group_invite', 'Group Invitation'),
                    ('verification', 'Verification Update'),
                    ('referral', 'Referral'),
                    ('support', 'Support Ticket'),
                ],
                max_length=15,
            ),
        ),
    ]

