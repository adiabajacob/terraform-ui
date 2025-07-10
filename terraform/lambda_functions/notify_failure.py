import json
import boto3
import logging
import os
from datetime import datetime


logger = logging.getLogger()
logger.setLevel(logging.INFO)


sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    Send a failure notification when any step in the disaster recovery process fails.
    This is the error handling step that captures failures from any previous step.
    """
    try:
        logger.info(f"Sending failure notification: {json.dumps(event)}")
        
      
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        
        if not sns_topic_arn:
            raise ValueError("SNS_TOPIC_ARN environment variable is required")
        
        # Extract information from the event
        execution_id = event.get('execution_id', 'Unknown')
        read_replica_id = event.get('read_replica_id', 'Unknown')
        
        # Extract error information
        error_info = event.get('error', {})
        error_type = error_info.get('Error', 'Unknown Error')
        error_cause = error_info.get('Cause', 'No cause provided')
        
        # Try to parse the error cause if it's a JSON string
        try:
            if isinstance(error_cause, str):
                parsed_cause = json.loads(error_cause)
                error_message = parsed_cause.get('errorMessage', error_cause)
                error_type = parsed_cause.get('errorType', error_type)
            else:
                error_message = error_cause
        except:
            error_message = error_cause
        
        # Get step information if available
        step_name = event.get('step_name', 'Unknown Step')
        step_timestamp = event.get('step_timestamp', 'Unknown')
        
        # Create a comprehensive failure message
        current_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        
        failure_message = f"""
❌ RDS DISASTER RECOVERY FAILED ❌

Timestamp: {current_time}
Execution ID: {execution_id}

🚨 FAILURE DETAILS:
• Failed Step: {step_name}
• Read Replica ID: {read_replica_id}
• Error Type: {error_type}
• Error Message: {error_message}
• Step Timestamp: {step_timestamp}

🔍 TROUBLESHOOTING INFORMATION:
• Check CloudWatch Logs for detailed error information
• Verify the read replica is in a healthy state
• Ensure proper IAM permissions are configured
• Check Route 53 zone and record configurations

⚠️ IMMEDIATE ACTIONS REQUIRED:
1. Manually investigate the failure cause
2. Check the primary database status
3. Verify read replica health and connectivity
4. Review Step Function execution history
5. Consider manual failover if necessary

🔗 AWS CONSOLE LINKS:
• Step Functions Console: https://console.aws.amazon.com/states/
• CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/
• RDS Console: https://console.aws.amazon.com/rds/
• Route 53 Console: https://console.aws.amazon.com/route53/

📋 ERROR CONTEXT:
{json.dumps(error_info, indent=2, default=str)}

---
This notification was sent by the RDS Disaster Recovery Step Function.
        """
        
        # Send the failure notification
        response = sns_client.publish(
            TopicArn=sns_topic_arn,
            Subject="❌ RDS Disaster Recovery: FAILOVER FAILED - IMMEDIATE ATTENTION REQUIRED",
            Message=failure_message
        )
        
        logger.info(f"Failure notification sent: {response['MessageId']}")
        
        # Return failure information
        return {
            'notification_sent': True,
            'message_id': response['MessageId'],
            'notification_type': 'failure',
            'timestamp': current_time,
            'execution_id': execution_id,
            'read_replica_id': read_replica_id,
            'error_type': error_type,
            'error_message': error_message,
            'failed_step': step_name,
            'final_status': 'FAILED'
        }
        
    except Exception as e:
        logger.error(f"Failure notification failed: {str(e)}")
        # Don't raise the exception here as this is the error handler
        # Just log it and return a basic response
        return {
            'notification_sent': False,
            'notification_type': 'failure',
            'error': str(e),
            'final_status': 'FAILED_WITH_NOTIFICATION_ERROR'
        } 