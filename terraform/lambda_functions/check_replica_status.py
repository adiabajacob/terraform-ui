import json
import boto3
import logging
import os


logger = logging.getLogger()
logger.setLevel(logging.INFO)


rds_client = boto3.client('rds')

def lambda_handler(event, context):
    """
    Check the current status of the read replica before promotion.
    This step ensures the replica is in a healthy state for promotion.
    """
    try:
        logger.info(f"Checking replica status: {json.dumps(event)}")
        
        # Get read replica ID from event (passed from previous step)
        read_replica_id = event.get('read_replica_id')
        
        if not read_replica_id:
            raise ValueError("read_replica_id is required in event")
        
        # Describe the read replica
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=read_replica_id
        )
        
        if not response['DBInstances']:
            raise ValueError(f"Read replica {read_replica_id} not found")
        
        db_instance = response['DBInstances'][0]
        
        # Check critical status fields
        status = db_instance['DBInstanceStatus']
        engine = db_instance['Engine']
        engine_version = db_instance['EngineVersion']
        
        logger.info(f"Replica Status: {status}")
        logger.info(f"Engine: {engine} {engine_version}")
        
        # Validate that it's actually a read replica
        if 'ReadReplicaSourceDBInstanceIdentifier' not in db_instance:
            raise ValueError(f"Instance {read_replica_id} is not a read replica")
        
        source_db = db_instance['ReadReplicaSourceDBInstanceIdentifier']
        logger.info(f"Source DB: {source_db}")
        
        # Check if replica is available for promotion
        if status != 'available':
            raise ValueError(f"Read replica is not available for promotion. Status: {status}")
        
        # Check replication lag (if available)
        replication_lag = db_instance.get('ReplicaLag', 'Unknown')
        logger.info(f"Replication Lag: {replication_lag}")
        
        # Additional health checks
        if 'DBInstanceStatus' in db_instance and db_instance['DBInstanceStatus'] != 'available':
            raise ValueError(f"DB instance status is not available: {db_instance['DBInstanceStatus']}")
        
        # Check if there are any pending modifications
        if db_instance.get('PendingModifiedValues'):
            logger.warning(f"Pending modifications detected: {db_instance['PendingModifiedValues']}")
        
        # Return status information for next steps
        return {
            'read_replica_id': read_replica_id,
            'source_db_id': source_db,
            'status': status,
            'engine': engine,
            'engine_version': engine_version,
            'replication_lag': replication_lag,
            'endpoint': db_instance['Endpoint']['Address'],
            'port': db_instance['Endpoint']['Port'],
            'availability_zone': db_instance['AvailabilityZone'],
            'ready_for_promotion': True,
            'check_timestamp': context.get_remaining_time_in_millis(),
            'execution_id': context.aws_request_id
        }
        
    except Exception as e:
        logger.error(f"Replica status check failed: {str(e)}")
        raise e 