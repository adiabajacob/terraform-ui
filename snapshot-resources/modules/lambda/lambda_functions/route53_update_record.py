import boto3
import os
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")

    event_detail = event.get('detail', {})
    event_id = event_detail.get('EventID')

    if event_id != 'RDS-EVENT-0043':
        logger.info(f"Ignoring event with ID: {event_id}")
        return {
            'statusCode': 200,
            'body': json.dumps({'message': f'Skipped non-target event: {event_id}'})
        }
        
        
    tags = event_detail.get('Tags', {})
    instance_name = tags.get('Name', '')
        
    if instance_name != 'restored-instance':
        print(f"Skipping Route 53 update: instance tag Name = {instance_name}")
        return

    required_env_vars = ['HOSTED_ZONE_ID', 'RECORD_NAME', 'TTL', 'DR_REGION']
    missing_vars = [var for var in required_env_vars if var not in os.environ]
    if missing_vars:
        error_msg = f"Missing environment variables: {', '.join(missing_vars)}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    hosted_zone_id = os.environ['HOSTED_ZONE_ID']
    record_name = os.environ['RECORD_NAME']
    ttl = int(os.environ['TTL'])
    dr_region = os.environ['DR_REGION']

    logger.info(
        f"Using Hosted Zone ID: {hosted_zone_id}, Record Name: {record_name}, TTL: {ttl}")

    source_identifier = event_detail.get("SourceIdentifier")
    rds = boto3.client('rds', region_name=dr_region)
    db_instance_info = rds.describe_db_instances(
        DBInstanceIdentifier=source_identifier)
    endpoint_address = db_instance_info['DBInstances'][0]['Endpoint']['Address']

    if not endpoint_address:
        logger.error(
            "No RDS endpoint (SourceIdentifier) found in event detail")
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Could not find RDS endpoint in the event"})
        }

    route53 = boto3.client('route53')

    try:
        response = route53.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch={
                "Comment": "Updated after RDS snapshot restore",
                "Changes": [
                    {
                        "Action": "UPSERT",
                        "ResourceRecordSet": {
                            "Name": record_name,
                            "Type": "CNAME",
                            "TTL": ttl,
                            "ResourceRecords": [{"Value": endpoint_address}]
                        }
                    }
                ]
            }
        )

        logger.info(
            f"Successfully updated Route 53 record to: {endpoint_address}")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": f"Updated DNS to {endpoint_address}",
                "changeInfo": {
                    "Id": response["ChangeInfo"]["Id"],
                    "Status": response["ChangeInfo"]["Status"],
                    "SubmittedAt": response["ChangeInfo"]["SubmittedAt"].isoformat()
                }
            })
        }

    except Exception as e:
        logger.exception("Failed to update Route 53 record")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to update DNS record"
            })
        }
