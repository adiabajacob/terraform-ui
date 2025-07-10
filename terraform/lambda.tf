data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "lambda_functions/dr_orchestrator.py"
  output_path = "lambda_functions/dr_orchestrator.zip"
}

resource "aws_lambda_function" "dr_orchestrator" {
  provider = aws.secondary
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "dr-orchestrator"
  role             = aws_iam_role.lambda_rds_failover_role.arn
  handler          = "dr_orchestrator.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      READ_REPLICA_ID        = var.read_replica_identifier
      SNS_TOPIC_ARN          = aws_sns_topic.db_alerts.arn
      SUCCESS_SNS_TOPIC_ARN  = aws_sns_topic.promotion_success.arn
      ROUTE53_ZONE_ID        = aws_route53_zone.private.zone_id
      ROUTE53_RECORD_NAME    = "database.myapp.internal"
      STEP_FUNCTION_ARN      = aws_sfn_state_machine.disaster_recovery.arn
    }
  }

  memory_size = 256
  timeout     = 900  
}

data "archive_file" "validate_input_zip" {
  type        = "zip"
  source_file = "lambda_functions/validate_input.py"
  output_path = "lambda_functions/validate_input.zip"
}

resource "aws_lambda_function" "validate_input" {
  provider = aws.secondary
  filename         = data.archive_file.validate_input_zip.output_path
  function_name    = "dr-validate-input"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "validate_input.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.validate_input_zip.output_base64sha256
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      READ_REPLICA_ID = var.read_replica_identifier
    }
  }
}


data "archive_file" "check_replica_status_zip" {
  type        = "zip"
  source_file = "lambda_functions/check_replica_status.py"
  output_path = "lambda_functions/check_replica_status.zip"
}

resource "aws_lambda_function" "check_replica_status" {
  provider = aws.secondary
  filename         = data.archive_file.check_replica_status_zip.output_path
  function_name    = "dr-check-replica-status"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "check_replica_status.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.check_replica_status_zip.output_base64sha256
  timeout          = 60
  memory_size      = 128

  environment {
    variables = {
      READ_REPLICA_ID = var.read_replica_identifier
    }
  }
}



data "archive_file" "promote_replica_zip" {
  type        = "zip"
  source_file = "lambda_functions/promote_replica.py"
  output_path = "lambda_functions/promote_replica.zip"
}

resource "aws_lambda_function" "promote_replica" {
  provider = aws.secondary
  filename         = data.archive_file.promote_replica_zip.output_path
  function_name    = "dr-promote-replica"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "promote_replica.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.promote_replica_zip.output_base64sha256
  timeout          = 120
  memory_size      = 256

  environment {
    variables = {
      READ_REPLICA_ID = var.read_replica_identifier
    }
  }
}



data "archive_file" "check_promotion_status_zip" {
  type        = "zip"
  source_file = "lambda_functions/check_promotion_status.py"
  output_path = "lambda_functions/check_promotion_status.zip"
}

resource "aws_lambda_function" "check_promotion_status" {
  provider = aws.secondary
  filename         = data.archive_file.check_promotion_status_zip.output_path
  function_name    = "dr-check-promotion-status"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "check_promotion_status.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.check_promotion_status_zip.output_base64sha256
  timeout          = 60
  memory_size      = 128

  environment {
    variables = {
      READ_REPLICA_ID = var.read_replica_identifier
    }
  }
}


data "archive_file" "update_route53_zip" {
  type        = "zip"
  source_file = "lambda_functions/update_route53.py"
  output_path = "lambda_functions/update_route53.zip"
}

resource "aws_lambda_function" "update_route53" {
  provider = aws.secondary
  filename         = data.archive_file.update_route53_zip.output_path
  function_name    = "dr-update-route53"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "update_route53.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.update_route53_zip.output_base64sha256
  timeout          = 300
  memory_size      = 256

  environment {
    variables = {
      ROUTE53_ZONE_ID     = aws_route53_zone.private.zone_id
      ROUTE53_RECORD_NAME = "database.myapp.internal"
    }
  }
}


data "archive_file" "verify_dns_update_zip" {
  type        = "zip"
  source_file = "lambda_functions/verify_dns_update.py"
  output_path = "lambda_functions/verify_dns_update.zip"
}

resource "aws_lambda_function" "verify_dns_update" {
  provider = aws.secondary
  filename         = data.archive_file.verify_dns_update_zip.output_path
  function_name    = "dr-verify-dns-update"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "verify_dns_update.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.verify_dns_update_zip.output_base64sha256
  timeout          = 120
  memory_size      = 128

  environment {
    variables = {
      ROUTE53_ZONE_ID     = aws_route53_zone.private.zone_id
      ROUTE53_RECORD_NAME = "database.myapp.internal"
    }
  }
}


data "archive_file" "notify_success_zip" {
  type        = "zip"
  source_file = "lambda_functions/notify_success.py"
  output_path = "lambda_functions/notify_success.zip"
}

resource "aws_lambda_function" "notify_success" {
  provider = aws.secondary
  filename         = data.archive_file.notify_success_zip.output_path
  function_name    = "dr-notify-success"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "notify_success.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.notify_success_zip.output_base64sha256
  timeout          = 60
  memory_size      = 128

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.step_function_notifications.arn
    }
  }
}


data "archive_file" "notify_failure_zip" {
  type        = "zip"
  source_file = "lambda_functions/notify_failure.py"
  output_path = "lambda_functions/notify_failure.zip"
}

resource "aws_lambda_function" "notify_failure" {
  provider = aws.secondary
  filename         = data.archive_file.notify_failure_zip.output_path
  function_name    = "dr-notify-failure"
  role             = aws_iam_role.step_function_lambda_role.arn
  handler          = "notify_failure.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = data.archive_file.notify_failure_zip.output_base64sha256
  timeout          = 60
  memory_size      = 128

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.step_function_notifications.arn
    }
  }
}



resource "aws_iam_role" "step_function_lambda_role" {
  provider = aws.secondary
  name     = "step-function-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "step_function_lambda_basic" {
  provider   = aws.secondary
  role       = aws_iam_role.step_function_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


resource "aws_iam_role_policy" "step_function_lambda_rds_policy" {
  provider = aws.secondary
  name     = "step-function-lambda-rds-policy"
  role     = aws_iam_role.step_function_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:PromoteReadReplica",
          "rds:ModifyDBInstance"
        ]
        Resource = "*"
      }
    ]
  })
}


resource "aws_iam_role_policy" "step_function_lambda_route53_policy" {
  provider = aws.secondary
  name     = "step-function-lambda-route53-policy"
  role     = aws_iam_role.step_function_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:GetChange",
          "route53:ChangeResourceRecordSets",
          "route53:ListResourceRecordSets",
          "route53:GetHealthCheck",
          "route53:UpdateHealthCheck"
        ]
        Resource = "*"
      }
    ]
  })
}


resource "aws_iam_role_policy" "step_function_lambda_sns_policy" {
  provider = aws.secondary
  name     = "step-function-lambda-sns-policy"
  role     = aws_iam_role.step_function_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.step_function_notifications.arn
        ]
      }
    ]
  })
} 






resource "aws_iam_role" "lambda_rds_failover_role" {
  provider = aws.secondary
  name     = "lambda_rds_failover_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}





resource "aws_iam_role_policy_attachment" "lambda_basic" {
  provider   = aws.secondary
  role       = aws_iam_role.lambda_rds_failover_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
resource "aws_iam_role_policy_attachment" "lambda_rds" {
  provider   = aws.secondary
  role       = aws_iam_role.lambda_rds_failover_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSFullAccess"
}

resource "aws_iam_role_policy" "lambda_step_function_policy" {
  provider = aws.secondary
  name = "lambda_step_function_policy"
  role = aws_iam_role.lambda_rds_failover_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = [
          aws_sfn_state_machine.disaster_recovery.arn
        ]
      }
    ]
  })
}




