resource "aws_sns_topic" "db_alerts" {
  name = "rds-dr-alerts"
}

resource "aws_sns_topic_subscription" "email_sub" {
  topic_arn = aws_sns_topic.db_alerts.arn
  protocol  = "email"
  endpoint  =  var.notification_email
}


resource "aws_sns_topic" "promotion_success" {
  name = "rds-promotion-success"
}

resource "aws_sns_topic_subscription" "promotion_success_email" {
  topic_arn = aws_sns_topic.promotion_success.arn
  protocol  = "email"
  endpoint  = var.notification_email
}


resource "aws_sns_topic" "route53_alarm" {
  provider = aws.useast1
  name     = "route53-healthcheck-alarm"
}
resource "aws_sns_topic_subscription" "route53_alarm_email" {
  provider = aws.useast1
  topic_arn = aws_sns_topic.route53_alarm.arn
  protocol  = "email"
  endpoint  = var.notification_email
}


resource "aws_sns_topic" "step_function_notifications" {
  provider = aws.secondary
  name     = "step-function-dr-notifications"
  
  tags = {
    Name        = "step-function-dr-notifications"
    Environment = var.environment
    TagName     = var.tag_name
  }
}


resource "aws_sns_topic_subscription" "step_function_email" {
  provider = aws.secondary
  topic_arn = aws_sns_topic.step_function_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
} 


# Cross-account SNS subscription for Route 53 health check alarms
resource "aws_sns_topic_subscription" "route3_to_dr_lambda" {
  provider  = aws.useast1
  topic_arn = aws_sns_topic.route53_alarm.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.dr_orchestrator.arn
  endpoint_auto_confirms = true
}

resource "aws_lambda_permission" "allow_us_east1_sns" {
  provider      = aws.secondary
  statement_id  = "AllowExecutionFromUSEast1SNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dr_orchestrator.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.route53_alarm.arn
}