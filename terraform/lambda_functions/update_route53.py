import json
import boto3
import logging
import os
import time

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
route53_client = boto3.client('route53')

def lambda_handler(event, context):
    """
    Update Route 53 DNS records to point to the newly promoted database.
    This step ensures applications can connect to the new primary database.
    """
    try:
        logger.info(f"Updating Route 53: {json.dumps(event)}")
      
        zone_id = os.environ.get('ROUTE53_ZONE_ID')
        record_name = os.environ.get('ROUTE53_RECORD_NAME')
        
        # Get promotion details from previous steps
        promotion_details = event.get('promotion_details', {})
        new_endpoint = promotion_details.get('endpoint')
        
        if not zone_id or not record_name:
            raise ValueError("ROUTE53_ZONE_ID and ROUTE53_RECORD_NAME environment variables are required")
        
        if not new_endpoint:
            raise ValueError("New endpoint is required from promotion details")
        
        logger.info(f"Updating Route 53 zone {zone_id} for record {record_name} to point to {new_endpoint}")
        
        # Get current record sets to understand the current configuration
        response = route53_client.list_resource_record_sets(
            HostedZoneId=zone_id
        )
        
        # Find the current primary and secondary records
        primary_record = None
        secondary_record = None
        
        for record in response['ResourceRecordSets']:
            if (record['Name'].rstrip('.') == record_name and 
                record.get('Type') == 'CNAME'):
                if record.get('SetIdentifier') == 'primary':
                    primary_record = record
                elif record.get('SetIdentifier') == 'secondary':
                    secondary_record = record
        
        logger.info(f"Found primary record: {primary_record is not None}")
        logger.info(f"Found secondary record: {secondary_record is not None}")
        
        # Validate that we have the necessary records
        if not primary_record:
            logger.warning("No primary record found - this might be expected if already failed over")
        if not secondary_record:
            logger.warning("No secondary record found - this might be expected if this is the first failover")
        
        # Prepare changes
        changes = []
        
        # Step 1: Delete the old primary record (failed database)
        if primary_record:
            changes.append({
                'Action': 'DELETE',
                'ResourceRecordSet': primary_record
            })
            logger.info("Scheduled deletion of old primary record")
        
        # Step 2: Update the secondary record to become the new primary
        if secondary_record:
            # Create new primary record with the promoted endpoint
            changes.append({
                'Action': 'UPSERT',
                'ResourceRecordSet': {
                    'Name': record_name,
                    'Type': 'CNAME',
                    'TTL': 60,
                    'SetIdentifier': 'primary',
                    'Failover': 'PRIMARY',
                    'ResourceRecords': [{'Value': new_endpoint}],
                    'HealthCheckId': secondary_record.get('HealthCheckId')
                }
            })
            logger.info("Scheduled promotion of secondary to primary")
            
            # Step 3: Delete the old secondary record since it's now the primary
            changes.append({
                'Action': 'DELETE',
                'ResourceRecordSet': secondary_record
            })
            logger.info("Scheduled deletion of old secondary record")
        
        # Step 4: Create a new secondary record with a placeholder
        # This maintains the failover structure for future use
        changes.append({
            'Action': 'CREATE',
            'ResourceRecordSet': {
                'Name': record_name,
                'Type': 'CNAME',
                'TTL': 60,
                'SetIdentifier': 'secondary',
                'Failover': 'SECONDARY',
                'ResourceRecords': [{'Value': 'placeholder.invalid'}]
            }
        })
        logger.info("Scheduled creation of new secondary record")
        
        # Apply all changes in one batch
        change_batch = {
            'Comment': f'DR Failover: Promote replica to primary, remove failed primary. New endpoint: {new_endpoint}',
            'Changes': changes
        }
        
        logger.info(f"Applying Route 53 changes: {json.dumps(change_batch, default=str)}")
        
        # Validate that we have changes to apply
        if not changes:
            logger.warning("No Route 53 changes to apply")
            return {
                'route53_zone_id': zone_id,
                'record_name': record_name,
                'new_endpoint': new_endpoint,
                'changes_applied': 0,
                'dns_updated': False,
                'message': 'No changes required'
            }
        
        change_response = route53_client.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch=change_batch
        )
        
        change_id = change_response['ChangeInfo']['Id']
        logger.info(f"Route 53 update initiated: {change_id}")
        
        # Wait for the change to be propagated
        logger.info("Waiting for Route 53 change to propagate...")
        try:
            waiter = route53_client.get_waiter('resource_record_sets_changed')
            waiter.wait(
                Id=change_id,
                WaiterConfig={
                    'Delay': 30,
                    'MaxAttempts': 20
                }
            )
            logger.info("Route 53 DNS successfully updated and propagated")
        except Exception as wait_error:
            logger.warning(f"Route 53 change initiated but propagation wait failed: {str(wait_error)}")
            # Continue anyway as the change might still be processing
        
        # Return update information for next steps
        return {
            'route53_zone_id': zone_id,
            'record_name': record_name,
            'new_endpoint': new_endpoint,
            'change_id': change_id,
            'changes_applied': len(changes),
            'dns_updated': True,
            'update_timestamp': context.get_remaining_time_in_millis(),
            'execution_id': context.aws_request_id
        }
        
    except Exception as e:
        logger.error(f"Route 53 update failed: {str(e)}")
        raise e 