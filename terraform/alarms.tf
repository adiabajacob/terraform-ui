resource "aws_cloudwatch_metric_alarm" "replica_lag" {
  alarm_name          = "primary-db-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  datapoints_to_alarm = 2
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 30 
  alarm_description   = "Triggered when replica lag exceeds 30 seconds"
  
  dimensions = {
    DBInstanceIdentifier = var.read_replica_identifier
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
  actions_enabled          = true
  alarm_actions           = [aws_sns_topic.db_alerts.arn]
  ok_actions              = [aws_sns_topic.db_alerts.arn]
}



resource "aws_cloudwatch_metric_alarm" "route53_primary_health_failed" {
  provider                = aws.useast1
  alarm_name              = "route53-primary-db-health-failed"
  comparison_operator     = "LessThanThreshold"
  evaluation_periods      = 1
  datapoints_to_alarm     = 1
  metric_name             = "HealthCheckStatus"
  namespace               = "AWS/Route53"
  period                  = 60
  statistic               = "Minimum"
  threshold               = 1
  alarm_description       = "Route 53 health check failed for primary database"
  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_db_health_check.id
  }
 treat_missing_data      = "notBreaching"
  insufficient_data_actions = []
  actions_enabled         = true
  alarm_actions          = [aws_sns_topic.route53_alarm.arn]
  # ok_actions             = [aws_sns_topic.route53_alarm.arn]
}

resource "aws_cloudwatch_metric_alarm" "route53_dr_health_failed" {
  provider = aws.secondary
  alarm_name          = "route53-dr-replica-health-failed"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  datapoints_to_alarm = "1"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Route 53 health check failed for DR replica"
  
  dimensions = {
    HealthCheckId = aws_route53_health_check.read_replica_health_check.id
  }
  
  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
  actions_enabled          = true
  
  alarm_actions = [aws_sns_topic.db_alerts.arn]  
 
}




