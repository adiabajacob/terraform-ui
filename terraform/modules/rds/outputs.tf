output "read_replica_endpoint" {
  description = "Read Replica endpoint"
  value       = aws_db_instance.read_replica.endpoint
  sensitive   = true
} 

output "read_replica_address" {
  description = "Read Replica address"
  value       = aws_db_instance.read_replica.address
  sensitive   = true
  
}