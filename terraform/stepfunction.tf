resource "aws_sfn_state_machine" "disaster_recovery" {
  provider = aws.secondary
  name     = "rds-disaster-recovery-workflow"
  role_arn = aws_iam_role.step_function_role.arn

  definition = jsonencode({
    Comment = "RDS Disaster Recovery Workflow - Promotes read replica and updates DNS"
    StartAt = "ValidateInput"
    
    States = {
      "ValidateInput" = {
        Type = "Task"
        Resource = aws_lambda_function.validate_input.arn
        Next = "CheckReplicaStatus"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next = "NotifyFailure"
          ResultPath = "$.error"
        }]
      }
      
      "CheckReplicaStatus" = {
        Type = "Task"
        Resource = aws_lambda_function.check_replica_status.arn
        Next = "PromoteReplica"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next = "NotifyFailure"
          ResultPath = "$.error"
        }]
      }
      
      "PromoteReplica" = {
        Type = "Task"
        Resource = aws_lambda_function.promote_replica.arn
        Next = "WaitForPromotion"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next = "NotifyFailure"
          ResultPath = "$.error"
        }]
      }
      
      "WaitForPromotion" = {
        Type = "Wait"
        Seconds = 60
        Next = "CheckPromotionStatus"
      }
      
      "CheckPromotionStatus" = {
        Type = "Task"
        Resource = aws_lambda_function.check_promotion_status.arn
        Next = "IsPromotionComplete"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next = "NotifyFailure"
          ResultPath = "$.error"
        }]
      }
      
      "IsPromotionComplete" = {
        Type = "Choice"
        Choices = [
          {
            Variable = "$.promotion_complete"
            BooleanEquals = true
            Next = "UpdateRoute53"
          }
        ]
        Default = "WaitForPromotion"
      }
      
      "UpdateRoute53" = {
        Type = "Task"
        Resource = aws_lambda_function.update_route53.arn
        Next = "WaitForDNSPropagation"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next = "NotifyFailure"
          ResultPath = "$.error"
        }]
      }
      
      "WaitForDNSPropagation" = {
        Type = "Wait"
        Seconds = 120
        Next = "VerifyDNSUpdate"
      }
      
      "VerifyDNSUpdate" = {
        Type = "Task"
        Resource = aws_lambda_function.verify_dns_update.arn
        Next = "NotifySuccess"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next = "NotifyFailure"
          ResultPath = "$.error"
        }]
      }
      
      "NotifySuccess" = {
        Type = "Task"
        Resource = aws_lambda_function.notify_success.arn
        End = true
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next = "NotifyFailure"
          ResultPath = "$.error"
        }]
      }
      
      "NotifyFailure" = {
        Type = "Task"
        Resource = aws_lambda_function.notify_failure.arn
        End = true
      }
    }
  })

  tags = {
    Name        = "rds-disaster-recovery-workflow"
    Environment = var.environment
    TagName     = var.tag_name
  }
}


resource "aws_iam_role" "step_function_role" {
  provider = aws.secondary
  name     = "step-function-disaster-recovery-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
}


resource "aws_iam_role_policy" "step_function_lambda_policy" {
  provider = aws.secondary
  name     = "step-function-lambda-policy"
  role     = aws_iam_role.step_function_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.validate_input.arn,
          aws_lambda_function.check_replica_status.arn,
          aws_lambda_function.promote_replica.arn,
          aws_lambda_function.check_promotion_status.arn,
          aws_lambda_function.update_route53.arn,
          aws_lambda_function.verify_dns_update.arn,
          aws_lambda_function.notify_success.arn,
          aws_lambda_function.notify_failure.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "step_function_logs_policy" {
  provider = aws.secondary
  name     = "step-function-logs-policy"
  role     = aws_iam_role.step_function_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutLogEvents",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}
