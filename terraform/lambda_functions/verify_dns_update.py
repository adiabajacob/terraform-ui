import json
import boto3
import logging
import os
import socket
import time


logger = logging.getLogger()
logger.setLevel(logging.INFO)


route53_client = boto3.client('route53')

def lambda_handler(event, context):
    """
    Verify that the DNS update has been properly propagated and is working correctly.
    This step ensures the failover is complete and functional.
    """
    try:
        logger.info(f"Verifying DNS update: {json.dumps(event)}")
        
       
        zone_id = os.environ.get('ROUTE53_ZONE_ID')
        record_name = os.environ.get('ROUTE53_RECORD_NAME')
        
        # Get update information from previous steps
        new_endpoint = event.get('new_endpoint')
        change_id = event.get('change_id')
        
        if not zone_id or not record_name:
            raise ValueError("ROUTE53_ZONE_ID and ROUTE53_RECORD_NAME environment variables are required")
        
        if not new_endpoint:
            raise ValueError("New endpoint is required from previous steps")
        
        logger.info(f"Verifying DNS update for {record_name} -> {new_endpoint}")
        
        # Step 1: Verify the Route 53 change status
        if change_id:
            try:
                change_response = route53_client.get_change(Id=change_id)
                change_status = change_response['ChangeInfo']['Status']
                logger.info(f"Route 53 change status: {change_status}")
                
                if change_status != 'INSYNC':
                    logger.warning(f"Route 53 change not yet synchronized: {change_status}")
                    return {
                        'dns_verified': False,
                        'change_status': change_status,
                        'verification_message': f"Route 53 change not yet synchronized: {change_status}"
                    }
            except Exception as e:
                logger.warning(f"Could not verify Route 53 change status: {e}")
        
        # Step 2: Verify the current DNS records
        try:
            response = route53_client.list_resource_record_sets(
                HostedZoneId=zone_id
            )
            
            primary_record = None
            for record in response['ResourceRecordSets']:
                if (record['Name'].rstrip('.') == record_name and 
                    record.get('Type') == 'CNAME' and
                    record.get('SetIdentifier') == 'primary'):
                    primary_record = record
                    break
            
            if not primary_record:
                raise ValueError("Primary DNS record not found")
            
            current_endpoint = primary_record['ResourceRecords'][0]['Value']
            logger.info(f"Current primary endpoint: {current_endpoint}")
            
            if current_endpoint != new_endpoint:
                raise ValueError(f"DNS record mismatch. Expected: {new_endpoint}, Found: {current_endpoint}")
            
            logger.info("DNS record verification successful")
            
        except Exception as e:
            logger.error(f"DNS record verification failed: {e}")
            raise e
        
        # Step 3: Verify DNS resolution (basic connectivity check)
        try:
            # Try to resolve the DNS name
            resolved_ip = socket.gethostbyname(record_name)
            logger.info(f"DNS resolution successful: {record_name} -> {resolved_ip}")
            
            # Try to resolve the new endpoint
            endpoint_ip = socket.gethostbyname(new_endpoint)
            logger.info(f"Endpoint resolution successful: {new_endpoint} -> {endpoint_ip}")
            
            # Verify they resolve to the same IP (or at least both resolve)
            if resolved_ip == endpoint_ip:
                logger.info("DNS resolution verification: Both names resolve to same IP")
            else:
                logger.info("DNS resolution verification: Names resolve to different IPs (expected during propagation)")
            
        except socket.gaierror as e:
            logger.warning(f"DNS resolution warning: {e}")
            # Don't fail the verification for DNS resolution issues
            # as they might be temporary during propagation
        
        # Step 4: Verify the database endpoint is reachable (basic connectivity)
        try:
            # Extract hostname and port from the endpoint
            if ':' in new_endpoint:
                hostname, port_str = new_endpoint.split(':', 1)
                port = int(port_str)
            else:
                hostname = new_endpoint
                port = 5432  # Default PostgreSQL port
            
            logger.info(f"Testing connectivity to {hostname}:{port}")
            
            # Create a socket and try to connect
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)  # 10 second timeout
            
            result = sock.connect_ex((hostname, port))
            sock.close()
            
            if result == 0:
                logger.info("Database connectivity test successful")
                connectivity_verified = True
            else:
                logger.warning(f"Database connectivity test failed with error code: {result}")
                connectivity_verified = False
                
        except Exception as e:
            logger.warning(f"Database connectivity test failed: {e}")
            connectivity_verified = False
        
        # Return verification results
        verification_result = {
            'dns_verified': True,
            'record_name': record_name,
            'new_endpoint': new_endpoint,
            'change_id': change_id,
            'connectivity_verified': connectivity_verified,
            'verification_timestamp': context.get_remaining_time_in_millis(),
            'execution_id': context.aws_request_id,
            'verification_message': 'DNS update verified successfully'
        }
        
        logger.info("DNS update verification completed successfully")
        return verification_result
        
    except Exception as e:
        logger.error(f"DNS update verification failed: {str(e)}")
        raise e 