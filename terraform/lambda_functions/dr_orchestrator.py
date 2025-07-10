import boto3
import os
import json
import logging


logger = logging.getLogger()
logger.setLevel(logging.INFO)


stepfunctions_client = boto3.client('stepfunctions')
sns_client = boto3.client('sns')


STEP_FUNCTION_ARN = os.environ['STEP_FUNCTION_ARN']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
SUCCESS_SNS_TOPIC_ARN = os.environ['SUCCESS_SNS_TOPIC_ARN']

def lambda_handler(event, context):
    """
    Lambda function that triggers the Step Function for disaster recovery.
    This replaces the direct disaster recovery logic with Step Function orchestration.
    """
    try:
        logger.info(f"Received SNS event: {json.dumps(event)}")
        
        # Extract alarm information from SNS message
        alarm_info = extract_alarm_info(event)
        
        # Prepare input for Step Function
        step_function_input = {
            'alarm_name': alarm_info.get('alarm_name', 'Unknown'),
            'alarm_state': alarm_info.get('alarm_state', 'Unknown'),
            'alarm_description': alarm_info.get('alarm_description', 'No description'),
            'trigger_timestamp': context.get_remaining_time_in_millis(),
            'execution_id': context.aws_request_id,
            'source': 'cloudwatch_alarm'
        }
        
        logger.info(f"Starting Step Function execution with input: {json.dumps(step_function_input)}")
        
        # Start the Step Function execution
        response = stepfunctions_client.start_execution(
            stateMachineArn=STEP_FUNCTION_ARN,
            name=f"dr-execution-{context.aws_request_id}",
            input=json.dumps(step_function_input)
        )
        
        execution_arn = response['executionArn']
        logger.info(f"Step Function execution started: {execution_arn}")
        
        # Send initial notification
        notification_message = f"""
🚀 RDS DISASTER RECOVERY INITIATED 🚀

Alarm: {alarm_info.get('alarm_name', 'Unknown')}
State: {alarm_info.get('alarm_state', 'Unknown')}
Description: {alarm_info.get('alarm_description', 'No description')}

Step Function Execution: {execution_arn}
Execution ID: {context.aws_request_id}

The disaster recovery process has been initiated via Step Function.
You will receive notifications as the process progresses.

🔗 Step Function Console: https://console.aws.amazon.com/states/home?region=us-west-2#/executions/details/{execution_arn}
        """
        
        sns_client.publish(
            TopicArn=SUCCESS_SNS_TOPIC_ARN,
            Subject="🚀 RDS Disaster Recovery: PROCESS INITIATED",
            Message=notification_message
        )
        
        return {
            'statusCode': 200,
            'body': 'Disaster recovery Step Function execution started successfully',
            'execution_arn': execution_arn,
            'step_function_arn': STEP_FUNCTION_ARN,
            'execution_id': context.aws_request_id
        }

    except Exception as e:
        error_message = f"Failed to start disaster recovery Step Function: {str(e)}"
        logger.error(error_message)
        
        # Send error notification
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="❌ RDS Disaster Recovery: STEP FUNCTION START FAILED",
                Message=f"""
❌ RDS DISASTER RECOVERY FAILED TO START ❌

Error: {str(e)}
Execution ID: {context.aws_request_id}

The disaster recovery process failed to start. Manual intervention may be required.

🔗 Step Functions Console: https://console.aws.amazon.com/states/
                """
            )
        except Exception as notify_error:
            logger.error(f"Failed to send error notification: {notify_error}")
        
        raise e

def extract_alarm_info(event):
    """
    Extract alarm information from the SNS event.
    """
    try:
        # Parse SNS message
        if 'Records' in event:
            for record in event['Records']:
                if record.get('EventSource') == 'aws:sns':
                    sns_message = json.loads(record['Sns']['Message'])
                    
                    # Extract alarm information
                    alarm_info = {
                        'alarm_name': sns_message.get('AlarmName', 'Unknown'),
                        'alarm_state': sns_message.get('NewStateValue', 'Unknown'),
                        'alarm_description': sns_message.get('AlarmDescription', 'No description'),
                        'alarm_reason': sns_message.get('NewStateReason', 'No reason provided'),
                        'alarm_timestamp': sns_message.get('StateChangeTime', 'Unknown')
                    }
                    
                    logger.info(f"Extracted alarm info: {alarm_info}")
                    return alarm_info
        
        # Fallback for direct invocation or other event types
        return {
            'alarm_name': 'Manual_Trigger',
            'alarm_state': 'ALARM',
            'alarm_description': 'Manually triggered disaster recovery',
            'alarm_reason': 'Manual trigger',
            'alarm_timestamp': 'Manual'
        }
        
    except Exception as e:
        logger.warning(f"Failed to extract alarm info: {e}")
        return {
            'alarm_name': 'Unknown',
            'alarm_state': 'Unknown',
            'alarm_description': 'Failed to parse alarm information',
            'alarm_reason': str(e),
            'alarm_timestamp': 'Unknown'
        }