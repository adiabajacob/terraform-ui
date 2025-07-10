resource "aws_route53_zone" "private_zone" {
  name = "mydb.internal"

  vpc {
    vpc_id     = var.primary_vpc_id
    vpc_region = var.primary_region
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-private-zone"
    }
  )
}

resource "aws_route53_zone_association" "zone_association" {
  provider   = aws.dr
  zone_id    = aws_route53_zone.private_zone.zone_id
  vpc_id     = var.dr_vpc_id
  vpc_region = var.dr_region
}

resource "aws_route53_record" "database_record" {
  zone_id        = aws_route53_zone.private_zone.zone_id
  name           = "database.mydb.internal"
  type           = "CNAME"
  ttl            = 60
  records        = [var.rds_instance_address]
}

resource "aws_route53_health_check" "primary_db_health_check" {
    fqdn = var.rds_instance_address
    port=5432
    type = "TCP"
    request_interval = "30"
    failure_threshold = "3"

    tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-health-check"
    }
  )
}