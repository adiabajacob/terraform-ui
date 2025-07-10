import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Validate input parameters for the disaster recovery workflow.
    This is the first step in the Step Function.
    """
    try:
        logger.info(f"Validating input: {json.dumps(event)}")
        
       
        read_replica_id = os.environ.get('READ_REPLICA_ID')
        
        if not read_replica_id:
            raise ValueError("READ_REPLICA_ID environment variable is required")
        
      
        if not event:
            raise ValueError("Event input is required")
        
        # Add validation for any additional parameters that might be passed
        # For example, if you want to pass specific alarm information
        alarm_name = event.get('alarm_name', 'Unknown')
        alarm_state = event.get('alarm_state', 'Unknown')
        
        logger.info(f"Validation successful - Read Replica ID: {read_replica_id}")
        logger.info(f"Alarm Name: {alarm_name}, Alarm State: {alarm_state}")
        
        # Return validated data for next steps
        return {
            'read_replica_id': read_replica_id,
            'alarm_name': alarm_name,
            'alarm_state': alarm_state,
            'validation_timestamp': context.get_remaining_time_in_millis(),
            'execution_id': context.aws_request_id
        }
        
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        raise e 