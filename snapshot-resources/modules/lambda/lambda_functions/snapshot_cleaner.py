import boto3
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        event_detail = event.get('detail', {})
        event_id = event_detail.get('EventID')
        if event_id != 'RDS-EVENT-0060':
            logger.info(f"Ignoring event with ID: {event_id}")
            return {
                'statusCode': 200,
                'body': f"Skipped non-matching event: {event_id}"
            }
        
        required_env_vars = ['PRIMARY_REGION', 'DR_REGION', 'RDS_INSTANCE_ID']
        missing_vars = [var for var in required_env_vars if var not in os.environ]
        if missing_vars:
            raise ValueError(f"Missing environment variables: {', '.join(missing_vars)}")

        primary_region = os.environ['PRIMARY_REGION']
        dr_region = os.environ['DR_REGION']
        instance_id = os.environ['RDS_INSTANCE_ID']

        clean_snapshots(region=primary_region, prefix=f"snapshot-{instance_id}", snapshot_type='base')

        clean_snapshots(region=dr_region, prefix=f"dr-snapshot-{instance_id}", snapshot_type='replica')

        return {
            'statusCode': 200,
            'body': f"Old snapshots cleaned in {primary_region} and {dr_region}"
        }

    except Exception as e:
        logger.error(f"Snapshot cleaner failed: {str(e)}", exc_info=True)
        raise


def clean_snapshots(region, prefix, snapshot_type):
    client = boto3.client('rds', region_name=region)

    snapshots = client.describe_db_snapshots(
        SnapshotType='manual'
    )['DBSnapshots']

    filtered = []
    for snap in snapshots:
        if snap['DBSnapshotIdentifier'].startswith(prefix):
            tags = client.list_tags_for_resource(ResourceName=snap['DBSnapshotArn'])['TagList']
            tag_map = {tag['Key']: tag['Value'] for tag in tags}
            if tag_map.get('SnapshotType') == snapshot_type:
                if 'SnapshotCreateTime' in snap:
                    filtered.append(snap)
                else:
                    logger.warning(f"Skipping snapshot {snap['DBSnapshotIdentifier']} as it has no SnapshotCreateTime")

    if not filtered:
        logger.info(f"No snapshots found in {region} with prefix {prefix}")
        return

    filtered.sort(key=lambda x: x['SnapshotCreateTime'], reverse=True)

    snapshots_to_delete = filtered[1:]
    for snap in snapshots_to_delete:
        snap_id = snap['DBSnapshotIdentifier']
        logger.info(f"Deleting snapshot {snap_id} in {region}")
        try:
            client.delete_db_snapshot(DBSnapshotIdentifier=snap_id)
        except Exception as e:
            logger.error(f"Failed to delete snapshot {snap_id} in {region}: {e}")