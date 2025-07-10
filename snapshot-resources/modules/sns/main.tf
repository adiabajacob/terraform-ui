resource "aws_sns_topic" "sns_dr_notification" {
  provider    = aws.useast1
  name     = "${var.project_name}-sns-dr-notification"
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-sns-dr-notification"
    }
  )
}

resource "aws_sns_topic_subscription" "lambda" {
  provider    = aws.useast1
  topic_arn = aws_sns_topic.sns_dr_notification.arn
  protocol  = "lambda"
  endpoint  = var.restore_rds_function_arn
  
}

resource "aws_sns_topic_subscription" "email_dr_notification" {
  provider  = aws.useast1
  topic_arn = aws_sns_topic.sns_dr_notification.arn
  protocol  = "email"
  endpoint  = var.notification_email_address
}

resource "aws_lambda_permission" "allow_sns_cross_region" {
  provider      = aws.dr
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = var.restore_rds_function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.sns_dr_notification.arn
}

resource "aws_sns_topic" "sns_rds_restore_notification" {
  provider  = aws.dr
  name     = "${var.project_name}-sns-rds-restore-notification"
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-sns-rds-restore-notification"
    }
  )
}

resource "aws_sns_topic_policy" "default" {
  provider  = aws.dr
  arn    = aws_sns_topic.sns_rds_restore_notification.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

resource "aws_sns_topic_subscription" "email_rds_restoration_notification" {
  provider  = aws.dr
  topic_arn = aws_sns_topic.sns_rds_restore_notification.arn
  protocol  = "email"
  endpoint  = var.notification_email_address
}