import boto3
import os
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        event_detail = event['detail']
        event_id = event_detail.get('EventID')
        if event_id != 'RDS-EVENT-0042':
            logger.info(f"Ignoring event with ID: {event_id}")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': f'Skipped non-target event: {event_id}'})
            }
        
        required_env_vars = ['PRIMARY_REGION', 'DR_REGION']
        missing_vars = [
            var for var in required_env_vars if var not in os.environ]
        if missing_vars:
            raise ValueError(
                f"Missing environment variables: {', '.join(missing_vars)}")

        primary_region = os.environ['PRIMARY_REGION']
        dr_region = os.environ['DR_REGION']

        try:
            source_arn = event_detail['SourceArn']
            snapshot_id = event_detail['SourceIdentifier']
        except KeyError as e:
            raise ValueError(f"Missing required field in event: {str(e)}")

        logger.info(
            f"Processing manual snapshot {snapshot_id} from {source_arn}")
        copied_at = event.get('time', datetime.now(timezone.utc).isoformat())

        dr_rds = boto3.client('rds', region_name=dr_region)

        tags = [
            {'Key': 'Source', 'Value': 'DR-Replication'},
            {'Key': 'OriginalSnapshotId', 'Value': snapshot_id},
            {'Key': 'OriginalSnapshotARN', 'Value': source_arn},
            {'Key': 'CopiedAt', 'Value': copied_at},
            {'Key': 'SourceRegion', 'Value': primary_region},
            {'Key': 'TargetRegion', 'Value': dr_region},
            {'Key': 'Environment', 'Value': 'DR'},
            {'Key': 'SnapshotType', 'Value': 'replica'},
            {'Key': 'ManagedBy', 'Value': 'Terraform'},
            {'Key': 'ReplicationType', 'Value': 'cross-region'}
        ]

        response = dr_rds.copy_db_snapshot(
            SourceDBSnapshotIdentifier=source_arn,
            TargetDBSnapshotIdentifier=f"dr-{snapshot_id}",
            SourceRegion=primary_region,
            Tags=tags
        )
        logger.info(
            f"Successfully initiated DR copy of {snapshot_id}. New snapshot: dr-{snapshot_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Snapshot copy initiated',
                'source_snapshot': snapshot_id,
                'dr_snapshot': f"dr-{snapshot_id}",
                'copy_status': response['DBSnapshot']['Status'],
                'region': dr_region
            })
        }

    except Exception as e:
        logger.error(f"Error processing event: {str(e)}", exc_info=True)
        logger.error(f"Event content: {json.dumps(event)}")
        raise