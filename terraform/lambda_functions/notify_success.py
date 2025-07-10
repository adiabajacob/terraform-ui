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
    Send a success notification when the disaster recovery process completes successfully.
    This is the final step in the successful execution path.
    """
    try:
        logger.info(f"Sending success notification: {json.dumps(event)}")
        
       
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        
        if not sns_topic_arn:
            raise ValueError("SNS_TOPIC_ARN environment variable is required")
        
        # Extract information from the event (accumulated from all previous steps)
        read_replica_id = event.get('read_replica_id', 'Unknown')
        new_endpoint = event.get('new_endpoint', 'Unknown')
        record_name = event.get('record_name', 'Unknown')
        change_id = event.get('change_id', 'Unknown')
        execution_id = event.get('execution_id', 'Unknown')
        
        # Get promotion details if available
        promotion_details = event.get('promotion_details', {})
        engine = promotion_details.get('engine', 'Unknown')
        engine_version = promotion_details.get('engine_version', 'Unknown')
        instance_class = promotion_details.get('instance_class', 'Unknown')
        
        # Get verification details if available
        connectivity_verified = event.get('connectivity_verified', False)
        dns_verified = event.get('dns_verified', False)
        
        # Create a comprehensive success message
        current_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        
        success_message = f"""
🚀 RDS DISASTER RECOVERY COMPLETED SUCCESSFULLY 🚀

Timestamp: {current_time}
Execution ID: {execution_id}

📊 PROMOTION DETAILS:
• Read Replica ID: {read_replica_id}
• New Primary Endpoint: {new_endpoint}
• Database Engine: {engine} {engine_version}
• Instance Class: {instance_class}

🌐 DNS UPDATES:
• DNS Record: {record_name}
• Route 53 Change ID: {change_id}
• DNS Verification: {'✅ SUCCESS' if dns_verified else '❌ FAILED'}
• Connectivity Test: {'✅ SUCCESS' if connectivity_verified else '❌ FAILED'}

✅ VERIFICATION STATUS:
• Database Promotion: ✅ COMPLETED
• DNS Update: ✅ COMPLETED
• DNS Propagation: ✅ COMPLETED
• Connectivity: {'✅ VERIFIED' if connectivity_verified else '⚠️ PENDING'}

🎯 RESULT:
The disaster recovery process has completed successfully. Your applications should now be connecting to the newly promoted primary database at {new_endpoint}.

📝 NEXT STEPS:
1. Monitor application connectivity to the new database
2. Verify application functionality
3. Consider creating a new read replica for future DR protection
4. Update any application configuration if needed

🔗 AWS CONSOLE LINKS:
• RDS Console: https://console.aws.amazon.com/rds/
• Route 53 Console: https://console.aws.amazon.com/route53/
• Step Functions Console: https://console.aws.amazon.com/states/

---
This notification was sent by the RDS Disaster Recovery Step Function.
        """
        
        # Send the success notification
        response = sns_client.publish(
            TopicArn=sns_topic_arn,
            Subject="✅ RDS Disaster Recovery: FAILOVER COMPLETED SUCCESSFULLY",
            Message=success_message
        )
        
        logger.info(f"Success notification sent: {response['MessageId']}")
        
        # Return success information
        return {
            'notification_sent': True,
            'message_id': response['MessageId'],
            'notification_type': 'success',
            'timestamp': current_time,
            'execution_id': execution_id,
            'read_replica_id': read_replica_id,
            'new_endpoint': new_endpoint,
            'final_status': 'COMPLETED_SUCCESSFULLY'
        }
        
    except Exception as e:
        logger.error(f"Success notification failed: {str(e)}")
        raise e 