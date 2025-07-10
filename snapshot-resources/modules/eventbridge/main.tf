resource "aws_cloudwatch_event_rule" "schedule_snapshot" {
  name                = "${var.project_name}-schedule-snapshot"
  description         = "Trigger RDS manual snapshot creation every 5 minutes"
  schedule_expression = "rate(5 minutes)"
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-schedule-snapshot"
    }
  )
}

resource "aws_cloudwatch_event_target" "snapshot_creator_target" {
  rule      = aws_cloudwatch_event_rule.schedule_snapshot.name
  target_id = "TriggerSnapshotCreator"
  arn       = var.snapshot_creator_function_arn
}

resource "aws_lambda_permission" "allow_eventbridge_manual_snapshot" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.snapshot_creator_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule_snapshot.arn
}

resource "aws_cloudwatch_event_rule" "manual_snapshot_created_event" {
  name        = "${var.project_name}-manual-snapshot-created-event"
  description = "Capture RDS manual snapshot creation events"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Snapshot Event"]
    detail = {
      EventCategories = ["creation"]
      SourceType      = ["SNAPSHOT"]
      Message         = [{ "prefix" : "Manual snapshot" }]
    }
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-manual-snapshot-created-event"
    }
  )
}

resource "aws_cloudwatch_event_target" "manual_snapshot_created_target" {
  rule      = aws_cloudwatch_event_rule.manual_snapshot_created_event.name
  target_id = "TriggerCrossRegionSnapshot"
  arn       = var.snapshot_cross_region_copy_function_arn
}

resource "aws_lambda_permission" "allow_eventbridge_cross_region_snapshot_copy" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.snapshot_cross_region_copy_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.manual_snapshot_created_event.arn
}


resource "aws_cloudwatch_event_rule" "cross_region_snapshot_finished_event" {
  provider    = aws.dr
  name        = "${var.project_name}-cross-region-snapshot-finished-event"
  description = "Capture cross region snapshot completion events"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Snapshot Event"]
    detail = {
      EventCategories = ["notification"]
      SourceType      = ["SNAPSHOT"]
      Message         = [{ "prefix" : "Finished copy of snapshot" }]
    }
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-cross-region-snapshot-finished-event"
    }
  )
}

resource "aws_cloudwatch_event_target" "cross_region_snapshot_finished_target" {
  provider  = aws.dr
  rule      = aws_cloudwatch_event_rule.cross_region_snapshot_finished_event.name
  target_id = "TriggerSnapshotCleaner"
  arn       = var.snapshot_cleaner_function_arn
}

resource "aws_lambda_permission" "allow_eventbridge_clean_snapshots" {
  provider      = aws.dr
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.snapshot_cleaner_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cross_region_snapshot_finished_event.arn
}

resource "aws_cloudwatch_event_rule" "rds_snapshot_restoration_completed" {
  provider    = aws.dr
  name        = "${var.project_name}-rds-snapshot-restoration-event"
  description = "Triggers when RDS restoration from snapshot is completes"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Instance Event"]
    detail = {
      EventCategories = ["restoration"]
      SourceType      = ["DB_INSTANCE"]
      Message         = [{ "prefix" : "Restored from snapshot" }]
    }
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-rds-restoration-event"
    }
  )
}

resource "aws_cloudwatch_event_target" "trigger_post_restoration_lambda" {
  provider  = aws.dr
  rule      = aws_cloudwatch_event_rule.rds_snapshot_restoration_completed.name
  target_id = "TriggerPostRestorationLambda"
  arn       = var.route53_update_record_function_arn
}

resource "aws_lambda_permission" "allow_restoration_event" {
  provider      = aws.dr
  statement_id  = "AllowExecutionFromRestorationEvent"
  action        = "lambda:InvokeFunction"
  function_name = var.route53_update_record_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.rds_snapshot_restoration_completed.arn
}

resource "aws_cloudwatch_event_target" "notify_sns_on_restoration" {
  provider  = aws.dr
  rule      = aws_cloudwatch_event_rule.rds_snapshot_restoration_completed.name
  target_id = "NotifySNSOnRestoration"
  arn       = var.sns_rds_restore_topic_arn  # Ensure this ARN matches the SNS topic's ARN

  input_transformer {
    input_paths = {
      dbInstance = "$.detail.SourceIdentifier"
      message    = "$.detail.Message"
    }

    input_template = <<TEMPLATE
"The RDS instance has been successfully restored from a snapshot. <message>. Database: <dbInstance>; Time: ${formatdate("YYYY-MM-DD hh:mm:ss", timestamp())}"
TEMPLATE
  }
}
