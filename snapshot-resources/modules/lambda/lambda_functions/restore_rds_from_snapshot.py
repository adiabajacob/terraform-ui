import os
import boto3
from datetime import datetime


def lambda_handler(event, context):
    required_env_vars = ['DR_REGION', 'RDS_INSTANCE_ID',
                         'SUBNET_GROUP_NAME', 'PARAMETER_GROUP_NAME', 'SECURITY_GROUP_ID']
    missing_vars = [var for var in required_env_vars if var not in os.environ]
    if missing_vars:
        raise ValueError(
            f"Missing environment variables: {', '.join(missing_vars)}")

    target_instance_id = 'restored-instance'
    dr_region = os.environ['DR_REGION']
    instance_id = os.environ['RDS_INSTANCE_ID']
    security_group_id = os.environ['SECURITY_GROUP_ID']
    parameter_group_name = os.environ['PARAMETER_GROUP_NAME']
    subnet_group_name = os.environ['SUBNET_GROUP_NAME']
    source_snapshot_prefix = f"dr-snapshot-{instance_id}"

    rds = boto3.client('rds', region_name=dr_region)

    try:
        all_snapshots = rds.describe_db_snapshots(
            SnapshotType='manual')['DBSnapshots']
    except Exception as e:
        raise RuntimeError(f"Failed to fetch snapshots: {str(e)}")

    available_snapshots = [
        s for s in all_snapshots
        if s.get('DBSnapshotIdentifier', '').startswith(source_snapshot_prefix)
        and s.get('Status') == 'available'
        and s.get('SnapshotCreateTime') is not None
    ]

    if not available_snapshots:
        raise Exception("No available manual snapshots found in DR region")

    latest_snapshot = max(available_snapshots,
                          key=lambda x: x['SnapshotCreateTime'])
    snapshot_id = latest_snapshot['DBSnapshotIdentifier']

    print(
        f"Using snapshot: {snapshot_id} (Created at {latest_snapshot['SnapshotCreateTime']}) from {dr_region}")

    try:
        rds.restore_db_instance_from_db_snapshot(
            DBInstanceIdentifier=target_instance_id,
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceClass='db.t3.micro',
            MultiAZ=False,
            PubliclyAccessible=True,
            VpcSecurityGroupIds=[security_group_id],
            DBParameterGroupName=parameter_group_name,
            DBSubnetGroupName=subnet_group_name,
            Tags=[
                {'Key': 'Name', 'Value': target_instance_id},
                {'Key': 'ManagedBy', 'Value': 'Terraform'},
                {'Key': 'Environment', 'Value': 'DR'},
            ],
            CopyTagsToSnapshot=True
        )
        print(
            f"Started restoration of '{target_instance_id}' from snapshot '{snapshot_id}'")

        return {
            'statusCode': 200,
            'body': f"Restoring RDS instance '{target_instance_id}' from snapshot '{snapshot_id}'"
        }

    except Exception as e:
        print(f"Error restoring DB instance: {str(e)}")
        return {
            'statusCode': 500,
            'body': f"Error restoring DB instance: {str(e)}"
        }
