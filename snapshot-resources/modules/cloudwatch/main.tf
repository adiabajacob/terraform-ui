resource "aws_cloudwatch_metric_alarm" "rds_failure" {
  provider            = aws.useast1
  alarm_name          = "${var.project_name}-primary-db-failure"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  datapoints_to_alarm = "1"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Triggers DR when primary RDS fails"
  alarm_actions       = [var.sns_dr_topic_arn]
  actions_enabled     = true
  treat_missing_data        = "notBreaching"
  dimensions = {
    HealthCheckId = var.route53_health_check_id
  }


  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-primary-db-failure"
    }
  )
}
