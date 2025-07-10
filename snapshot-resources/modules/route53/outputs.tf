output "route53_health_check_id" {
    value = aws_route53_health_check.primary_db_health_check.id
}
output "route53_database_record" {
  value       = aws_route53_record.database_record
  description = "Route 53 DNS record for the database"
}

output "route53_hosted_zone_id" {
  value       = aws_route53_zone.private_zone.zone_id
  description = "The hosted zone ID of the private Route 53 zone"
}
