data "aws_vpc" "primary" {
  provider = aws.primary

  filter {
    name   = "tag:Environment"
    values = ["DR"]
  }
}


resource "aws_route53_zone" "private" {
    provider = aws.primary
    name = "myapp.internal"
  

    vpc{
        vpc_id = data.aws_vpc.primary.id
    }
    tags = {
        Name = "myapp-internal-zone"
        Environment = var.environment
        TagName = var.tag_name
    }
}

data "aws_db_instance" "primary" {
  provider               = aws.primary
  db_instance_identifier = var.primary_db_identifier
}

resource "aws_route53_health_check" "primary_db_health_check" {
    provider = aws.primary
    fqdn = data.aws_db_instance.primary.address
    port=5432
    type = "TCP"
    request_interval = "30"
    failure_threshold = "3"
    tags = {
        Name = "primary-db-health-check"
        Environment = var.environment
        TagName = var.tag_name
    }
}

resource "aws_route53_health_check" "read_replica_health_check" {
    provider = aws.secondary
    fqdn = module.rds.read_replica_address
    port=5432
    type = "TCP"
    request_interval = "30"
    failure_threshold = "3"
    tags = {
        Name = "read-replica-health-check"
        Environment = var.environment
        TagName = var.tag_name
    }
}

resource "aws_route53_record" "database_primary" {
  provider = aws.primary
  zone_id = aws_route53_zone.private.zone_id
  name    = "database.myapp.internal"
  type    = "CNAME"
  ttl     = 60  
  
  set_identifier = "primary"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  health_check_id = aws_route53_health_check.primary_db_health_check.id
  records         = [data.aws_db_instance.primary.address]
}

resource "aws_route53_record" "database_secondary" {
  provider = aws.primary
  zone_id = aws_route53_zone.private.zone_id
  name    = "database.myapp.internal"
  type    = "CNAME"
  ttl     = 60
  
  set_identifier = "secondary"
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  health_check_id = aws_route53_health_check.read_replica_health_check.id
  records         = [module.rds.read_replica_address]
}


output "database_dns_endpoint" {
  value = "database.myapp.internal"
  description = "DNS endpoint for database connections - handles automatic failover"
}


