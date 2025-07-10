import json
import boto3
import logging
import os


logger = logging.getLogger()
logger.setLevel(logging.INFO)

rds_client = boto3.client('rds')

def lambda_handler(event, context):
    """
    Promote the read replica to a standalone primary database.
    This is the critical step that initiates the failover process.
    """
    try:
        logger.info(f"Promoting replica: {json.dumps(event)}")
        
        # Get read replica ID from event (passed from previous steps)
        read_replica_id = event.get('read_replica_id')
        
        if not read_replica_id:
            raise ValueError("read_replica_id is required in event")
        
      
        logger.info(f"Initiating promotion of read replica: {read_replica_id}")
        
        # Promote the read replica
        response = rds_client.promote_read_replica(
            DBInstanceIdentifier=read_replica_id
        )
        
        logger.info(f"Promotion initiated successfully: {json.dumps(response, default=str)}")
        
        # Extract important information from the response
        db_instance = response['DBInstance']
        promotion_status = db_instance['DBInstanceStatus']
        
        logger.info(f"Promotion status: {promotion_status}")
        logger.info(f"New endpoint: {db_instance['Endpoint']['Address']}")
        
        # Return promotion information for next steps
        return {
            'read_replica_id': read_replica_id,
            'promotion_initiated': True,
            'promotion_status': promotion_status,
            'new_endpoint': db_instance['Endpoint']['Address'],
            'new_port': db_instance['Endpoint']['Port'],
            'availability_zone': db_instance['AvailabilityZone'],
            'engine': db_instance['Engine'],
            'engine_version': db_instance['EngineVersion'],
            'promotion_timestamp': context.get_remaining_time_in_millis(),
            'execution_id': context.aws_request_id,
            'response_metadata': {
                'request_id': response['ResponseMetadata']['RequestId']
            }
        }
        
    except Exception as e:
        logger.error(f"Replica promotion failed: {str(e)}")
        raise e 