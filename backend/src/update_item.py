import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Custom JSON Encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            # Convert Decimal to float for JSON serialization
            # Or convert to str if high precision is absolutely required
            return float(obj)
        return json.JSONEncoder.default(self, obj)

# Initialize services outside the handler
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE'))
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'), parse_float=Decimal)
        item_id = body.get('itemId')

        if not item_id:
            return response(400, {'message': 'itemId is required'})

        # Get existing item
        existing = table.get_item(Key={'itemId': item_id})
        if 'Item' not in existing:
            return response(404, {'message': 'Item not found'})

        update_expr = []
        expr_attrs = {}
        expr_values = {}

        updateable_fields = ['name', 'description', 'quantity', 'price', 'category', 'imageUrl']

        for field in updateable_fields:
            if field in body:
                update_expr.append(f"#{field} = :{field}")
                expr_attrs[f"#{field}"] = field
                expr_values[f":{field}"] = body[field]

        # Add updated timestamp
        update_expr.append("#updatedAt = :updatedAt")
        expr_attrs["#updatedAt"] = "updatedAt"
        expr_values[":updatedAt"] = datetime.utcnow().isoformat()

        # Perform update
        table.update_item(
            Key={'itemId': item_id},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeNames=expr_attrs,
            ExpressionAttributeValues=expr_values
        )

        # Re-fetch updated item
        updated_item = table.get_item(Key={'itemId': item_id})['Item']

        # 🚨 Low stock alert if quantity is low
        updated_quantity = updated_item.get('quantity')
        if updated_quantity is not None and int(updated_quantity) < 10 and SNS_TOPIC_ARN:
            message = f'⚠️ LOW STOCK ALERT (UPDATE):\nItem: {updated_item.get("name")}\nQuantity: {updated_quantity}'
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Low Stock Alert',
                Message=message
            )

        # Use the custom encoder when returning the response
        return response(200, {'message': 'Item updated successfully', 'item': updated_item})

    except Exception as e:
        print(f"Error: {str(e)}")
        return response(500, {'message': 'Failed to update item', 'error': str(e)})

def response(status, body):
    # Pass the custom encoder to json.dumps
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(body, cls=DecimalEncoder) 
    }
