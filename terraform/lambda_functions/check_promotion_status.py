import json
import boto3
import logging
import os


logger = logging.getLogger()
logger.setLevel(logging.INFO)


rds_client = boto3.client('rds')

def lambda_handler(event, context):
    """
    Check if the read replica promotion has completed successfully.
    This step is called repeatedly by the Step Function until promotion is complete.
    """
    try:
        logger.info(f"Checking promotion status: {json.dumps(event)}")
        
        # Get read replica ID from event (passed from previous steps)
        read_replica_id = event.get('read_replica_id')
        
        if not read_replica_id:
            raise ValueError("read_replica_id is required in event")
        
        # Describe the database instance to check its current status
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=read_replica_id
        )
        
        if not response['DBInstances']:
            raise ValueError(f"Database instance {read_replica_id} not found")
        
        db_instance = response['DBInstances'][0]
        current_status = db_instance['DBInstanceStatus']
        
        logger.info(f"Current status: {current_status}")
        
        # Check if promotion is complete
        # A promoted replica should:
        # 1. Have status 'available'
        # 2. No longer have ReadReplicaSourceDBInstanceIdentifier
        # 3. No longer be a read replica
        
        is_promotion_complete = False
        promotion_details = {}
        
        if current_status == 'available':
            # Check if it's still a read replica
            if 'ReadReplicaSourceDBInstanceIdentifier' not in db_instance:
                # Promotion is complete!
                is_promotion_complete = True
                promotion_details = {
                    'status': 'completed',
                    'endpoint': db_instance['Endpoint']['Address'],
                    'port': db_instance['Endpoint']['Port'],
                    'availability_zone': db_instance['AvailabilityZone'],
                    'engine': db_instance['Engine'],
                    'engine_version': db_instance['EngineVersion'],
                    'instance_class': db_instance['DBInstanceClass'],
                    'storage_type': db_instance['StorageType'],
                    'allocated_storage': db_instance.get('AllocatedStorage'),
                    'multi_az': db_instance.get('MultiAZ', False)
                }
                logger.info("Promotion completed successfully!")
            else:
                logger.info("Promotion still in progress - instance is still a read replica")
        else:
            logger.info(f"Promotion still in progress - status: {current_status}")
        
        # Check for any pending modifications
        pending_modifications = db_instance.get('PendingModifiedValues', {})
        if pending_modifications:
            logger.info(f"Pending modifications: {pending_modifications}")
        
        # Return status for Step Function decision
        return {
            'read_replica_id': read_replica_id,
            'current_status': current_status,
            'promotion_complete': is_promotion_complete,
            'promotion_details': promotion_details,
            'pending_modifications': pending_modifications,
            'check_timestamp': context.get_remaining_time_in_millis(),
            'execution_id': context.aws_request_id
        }
        
    except Exception as e:
        logger.error(f"Promotion status check failed: {str(e)}")
        raise e 