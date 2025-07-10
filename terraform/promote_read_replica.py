import boto3
import os
import time

rds_client = boto3.client('rds')
route53_client = boto3.client('route53')
sns_client = boto3.client('sns')
sns_eu_central = boto3.client('sns', region_name='eu-central-1')

READ_REPLICA_ID = os.environ['READ_REPLICA_ID']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
SUCCESS_SNS_TOPIC_ARN = os.environ['SUCCESS_SNS_TOPIC_ARN']
ROUTE53_ZONE_ID = os.environ['ROUTE53_ZONE_ID']
ROUTE53_RECORD_NAME = os.environ['ROUTE53_RECORD_NAME']

def lambda_handler(event, context):
    try:
        # Step 1: Promote read replica
        print(f"Promoting read replica: {READ_REPLICA_ID}")
        rds_response = rds_client.promote_read_replica(
            DBInstanceIdentifier=READ_REPLICA_ID
        )
        
        # Step 2: Wait for promotion to complete and get new endpoint
        print("Waiting for promotion to complete...")
        promoted_endpoint = wait_for_promotion_complete(READ_REPLICA_ID)
        
        # Step 3: Update Route 53 - Make promoted instance the PRIMARY
        print(f"Updating Route 53 DNS to make promoted instance primary: {promoted_endpoint}")
        update_route53_for_failover(promoted_endpoint)
        
        success_message = f"""
RDS Disaster Recovery Completed Successfully:
- Read replica '{READ_REPLICA_ID}' promoted to primary
- New endpoint: {promoted_endpoint}
- Route 53 DNS updated - promoted instance is now PRIMARY
- Applications will resolve to new database immediately

Response: {rds_response}
"""
        
        print(success_message)
        
        # Send success notification
        sns_client.publish(
            TopicArn=SUCCESS_SNS_TOPIC_ARN,
            Subject="RDS DR: Failover Completed Successfully",
            Message=success_message
        )

        return {
            'statusCode': 200,
            'body': success_message,
            'promoted_endpoint': promoted_endpoint
        }

    except Exception as e:
        error_message = f"RDS Disaster Recovery Failed: {str(e)}"
        print(error_message)
        
        # Send error notification to original region
        sns_eu_central.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="RDS DR: Failover Failed",
            Message=error_message
        )
        
        raise e

def wait_for_promotion_complete(replica_id, max_wait_time=300):
    """Wait for replica promotion to complete and return new endpoint"""
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        try:
            response = rds_client.describe_db_instances(DBInstanceIdentifier=replica_id)
            db_instance = response['DBInstances'][0]
            
            # Check if promotion is complete
            if (db_instance['DBInstanceStatus'] == 'available' and 
                'ReadReplicaSourceDBInstanceIdentifier' not in db_instance):
                
                endpoint = db_instance['Endpoint']['Address']
                print(f"Promotion completed. New endpoint: {endpoint}")
                return endpoint
                
        except Exception as e:
            print(f"Error checking promotion status: {e}")
        
        print("Promotion still in progress, waiting 30 seconds...")
        time.sleep(30)
    
    raise Exception(f"Promotion did not complete within {max_wait_time} seconds")

def update_route53_for_failover(promoted_endpoint):
    """
    Update Route 53 records to handle failover properly.
    
    Strategy: Make the promoted instance the new PRIMARY and 
    disable/remove the old primary record.
    """
    try:
        # Get current record sets
        response = route53_client.list_resource_record_sets(
            HostedZoneId=ROUTE53_ZONE_ID
        )
        
        # Find both primary and secondary records
        primary_record = None
        secondary_record = None
        
        for record in response['ResourceRecordSets']:
            if (record['Name'].rstrip('.') == ROUTE53_RECORD_NAME and 
                record.get('Type') == 'CNAME'):
                if record.get('SetIdentifier') == 'primary':
                    primary_record = record
                elif record.get('SetIdentifier') == 'secondary':
                    secondary_record = record
        
        if not secondary_record:
            raise Exception("Could not find secondary Route 53 record")
        
        changes = []
        
        # Option 1: Delete the old primary record (failed database)
        if primary_record:
            changes.append({
                'Action': 'DELETE',
                'ResourceRecordSet': primary_record
            })
            print("Scheduled deletion of old primary record")
        
        # Option 2: Update secondary to become the new primary
        changes.append({
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': ROUTE53_RECORD_NAME,
                'Type': 'CNAME',
                'TTL': 60,
                'SetIdentifier': 'primary',  # Make it primary now
                'Failover': 'PRIMARY',
                'ResourceRecords': [{'Value': promoted_endpoint}],
                'HealthCheckId': secondary_record.get('HealthCheckId')  # Keep the health check
            }
        })
        print("Scheduled promotion of secondary to primary")
        
        # Apply all changes in one batch
        change_batch = {
            'Comment': 'DR Failover: Promote replica to primary, remove failed primary',
            'Changes': changes
        }
        
        change_response = route53_client.change_resource_record_sets(
            HostedZoneId=ROUTE53_ZONE_ID,
            ChangeBatch=change_batch
        )
        
        print(f"Route 53 update initiated: {change_response['ChangeInfo']['Id']}")
        
        # Wait for change to propagate
        route53_client.get_waiter('resource_record_sets_changed').wait(
            Id=change_response['ChangeInfo']['Id']
        )
        
        print(f"Route 53 DNS successfully updated. Promoted instance is now PRIMARY: {promoted_endpoint}")
        
        # Optional: Create a new secondary record pointing to a placeholder
        # This would be useful if you plan to create a new replica later
        create_placeholder_secondary()
        
    except Exception as e:
        print(f"Failed to update Route 53 record: {e}")
        # Don't fail the entire process if Route 53 update fails
        # The database promotion was successful
        raise e  # Actually, we should fail here since DNS is critical

def create_placeholder_secondary():
    """
    Create a placeholder secondary record that will fail health checks.
    This maintains the failover structure for future use.
    """
    try:
        change_batch = {
            'Comment': 'Create placeholder secondary for future DR setup',
            'Changes': [{
                'Action': 'CREATE',
                'ResourceRecordSet': {
                    'Name': ROUTE53_RECORD_NAME,
                    'Type': 'CNAME',
                    'TTL': 60,
                    'SetIdentifier': 'secondary-placeholder',
                    'Failover': 'SECONDARY',
                    'ResourceRecords': [{'Value': 'placeholder.invalid'}]  # Will fail health checks
                }
            }]
        }
        
        route53_client.change_resource_record_sets(
            HostedZoneId=ROUTE53_ZONE_ID,
            ChangeBatch=change_batch
        )
        print("Created placeholder secondary record")
        
    except Exception as e:
        print(f"Warning: Could not create placeholder secondary: {e}")
        # This is not critical, so don't fail