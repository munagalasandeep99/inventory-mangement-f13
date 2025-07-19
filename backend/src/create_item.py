import json
import boto3
import os
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize services outside the handler for better performance
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Set your table and topic from environment variables
table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE'))
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')  # ✅ Correct use of environment variable key

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'), parse_float=Decimal)

        item_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        quantity = int(body.get('quantity', 0))

        item = {
            'itemId': item_id,
            'name': body.get('name'),
            'description': body.get('description'),
            'quantity': quantity,
            'price': Decimal(str(body.get('price', 0))),
            'category': body.get('category'),
            'imageUrl': body.get('imageUrl'),
            'createdAt': timestamp,
            'updatedAt': timestamp
        }

        # Save to DynamoDB
        table.put_item(Item=item)

        # 🚨 Trigger SNS if quantity is low
        if quantity < 10 and SNS_TOPIC_ARN:
            message = f'⚠️ LOW STOCK ALERT:\nItem: {item["name"]}\nQuantity: {quantity}'
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Low Stock Alert',
                Message=message
            )

        # Prepare response
        response_item = {
            **item,
            'price': float(item['price'])  # Convert Decimal for JSON
        }

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'message': 'Item created successfully',
                'item': response_item
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Failed to create item',
                'error': str(e)
            })
        }
