import boto3
import os
from datetime import datetime, timezone
import logging
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        required_env_vars = ['PRIMARY_REGION', 'RDS_INSTANCE_ID']
        missing_vars = [
            var for var in required_env_vars if var not in os.environ]
        if missing_vars:
            raise ValueError(
                f"Missing environment variables: {', '.join(missing_vars)}")

        instance_id = os.environ['RDS_INSTANCE_ID']
        primary_region = os.environ['PRIMARY_REGION']
        rds = boto3.client('rds', region_name=primary_region)

        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d-%H-%M-%S')
        snapshot_id = f"snapshot-{instance_id}-{timestamp}"

        tags = [
            {'Key': 'CreatedBy', 'Value': 'SnapshotCreatorLambda'},
            {'Key': 'CreationTime', 'Value': timestamp},
            {'Key': 'InstanceId', 'Value': instance_id},
            {'Key': 'Region', 'Value': primary_region},
            {'Key': 'Environment', 'Value': 'production'},
            {'Key': 'SnapshotType', 'Value': 'base'},
            {'Key': 'ManagedBy', 'Value': 'Terraform'},
            {'Key': 'CostCenter', 'Value': os.getenv(
                'COST_CENTER', '12345')}
        ]
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=instance_id,
            Tags=tags
        )
        logger.info(f"Snapshot initiated: {response}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Snapshot creation initiated',
                'snapshot_id': snapshot_id,
                'status': response['DBSnapshot']['Status'],
                'arn': response['DBSnapshot']['DBSnapshotArn']
            })
        }

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise
