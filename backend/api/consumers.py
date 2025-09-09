import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Conversation, Message

logger = logging.getLogger(__name__)

class MessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get token from query string
            query_string = self.scope['query_string'].decode()
            if 'token=' not in query_string:
                logger.error("No token provided in WebSocket connection")
                await self.close(code=4001)
                return
            
            token_key = query_string.split('token=')[-1].split('&')[0]
            if not token_key:
                logger.error("Empty token provided in WebSocket connection")
                await self.close(code=4001)
                return
            
            # Authenticate user
            self.user = await self.get_user_from_token(token_key)
            if not self.user:
                logger.error(f"Invalid token provided: {token_key[:10]}...")
                await self.close(code=4001)
                return
        except Exception as e:
            logger.error(f"Error during WebSocket authentication: {e}")
            await self.close(code=4001)
            return
        
        # Accept connection
        await self.accept()

        # Initialize paused conversations set per-connection
        self.paused_conversations = set()
        
        # Add user to their personal group
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        logger.info(f"WebSocket connected for user {self.user.username}")
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to real-time messaging'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user:
            # Remove from user group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            
            # Remove from any conversation groups
            if hasattr(self, 'conversation_groups'):
                for group_name in self.conversation_groups:
                    await self.channel_layer.group_discard(
                        group_name,
                        self.channel_name
                    )
            
            logger.info(f"WebSocket disconnected for user {self.user.username}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'join_conversation':
                await self.join_conversation(data.get('conversation_id'))
            elif message_type == 'leave_conversation':
                await self.leave_conversation(data.get('conversation_id'))
            elif message_type == 'pause_updates':
                await self.pause_updates(data.get('conversation_id'))
            elif message_type == 'resume_updates':
                await self.resume_updates(data.get('conversation_id'))
            elif message_type == 'send_message':
                await self.handle_message(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")

    async def join_conversation(self, conversation_id):
        if not conversation_id:
            return
            
        # Verify user has access to conversation
        has_access = await self.check_conversation_access(conversation_id)
        if not has_access:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Access denied to conversation'
            }))
            return
        
        # Join conversation group
        conversation_group_name = f"conversation_{conversation_id}"
        await self.channel_layer.group_add(
            conversation_group_name,
            self.channel_name
        )
        
        # Track joined conversations
        if not hasattr(self, 'conversation_groups'):
            self.conversation_groups = set()
        self.conversation_groups.add(conversation_group_name)
        
        logger.info(f"User {self.user.username} joined conversation {conversation_id}")

    async def leave_conversation(self, conversation_id):
        if not conversation_id:
            return
            
        conversation_group_name = f"conversation_{conversation_id}"
        await self.channel_layer.group_discard(
            conversation_group_name,
            self.channel_name
        )
        
        if hasattr(self, 'conversation_groups'):
            self.conversation_groups.discard(conversation_group_name)
        
        logger.info(f"User {self.user.username} left conversation {conversation_id}")

    async def handle_message(self, data):
        # This is handled by the REST API, WebSocket just receives broadcasts
        pass

    async def pause_updates(self, conversation_id):
        if not conversation_id:
            return
        try:
            has_access = await self.check_conversation_access(conversation_id)
            if not has_access:
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Access denied to conversation'}))
                return
            self.paused_conversations.add(int(conversation_id))
            logger.info(f"User {self.user.username} paused updates for conversation {conversation_id}")
            await self.send(text_data=json.dumps({'type': 'paused', 'conversation_id': int(conversation_id)}))
        except Exception as e:
            logger.error(f"Failed to pause updates: {e}")

    async def resume_updates(self, conversation_id):
        if not conversation_id:
            return
        try:
            if int(conversation_id) in self.paused_conversations:
                self.paused_conversations.discard(int(conversation_id))
            logger.info(f"User {self.user.username} resumed updates for conversation {conversation_id}")
            await self.send(text_data=json.dumps({'type': 'resumed', 'conversation_id': int(conversation_id)}))
        except Exception as e:
            logger.error(f"Failed to resume updates: {e}")

    # Receive message from room group
    async def new_message(self, event):
        message = event.get('message')
        conversation_id = event.get('conversation_id')
        try:
            if conversation_id is None and isinstance(message, dict):
                # Try to infer conversation_id from message payload
                conv = message.get('conversation')
                if isinstance(conv, dict) and 'id' in conv:
                    conversation_id = conv.get('id')
                elif isinstance(conv, int):
                    conversation_id = conv
        except Exception:
            conversation_id = None

        # If paused for this conversation, send minimal event instead
        if conversation_id is not None and hasattr(self, 'paused_conversations') and int(conversation_id) in self.paused_conversations:
            await self.send(text_data=json.dumps({
                'type': 'new_message_meta',
                'conversation_id': int(conversation_id)
            }))
            return

        # Default: send full message
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': message,
            'conversation_id': conversation_id
        }))

    # Receive conversation update from room group
    async def conversation_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'conversation_update',
            'conversation': event['conversation']
        }))

    # Receive user status update
    async def user_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'status': event['status']
        }))

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def check_conversation_access(self, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False