locals {
  cloudwatch_logs_policy = {
    Effect = "Allow"
    Action = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    Resource = "arn:aws:logs:*:*:*"
  }
}

resource "aws_iam_role" "creator_lambda_role" {
  name = "${var.project_name}-creator-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-creator-lambda-role"
    }
  )
}

resource "aws_iam_role_policy" "creator_lambda_policy" {
  name = "${var.project_name}-creator-lambda-policy"
  role = aws_iam_role.creator_lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:AddTagsToResource"
        ],
        Resource = "*"
      },
      local.cloudwatch_logs_policy
    ]
  })
}

resource "aws_iam_role" "copy_lambda_role" {
  name = "${var.project_name}-copy-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-copy-lambda-role"
    }
  )
}

resource "aws_iam_role_policy" "copy_lambda_policy" {
  name = "${var.project_name}-copy-lambda-policy"
  role = aws_iam_role.copy_lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "rds:CopyDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:AddTagsToResource",
          "rds:ListTagsForResource"
        ],
        Resource = "*"
      },
      local.cloudwatch_logs_policy
    ]
  })
}

resource "aws_iam_role" "cleaner_lambda_role" {
  name = "${var.project_name}-cleaner-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-cleaner-lambda-role"
    }
  )
}

resource "aws_iam_role_policy" "cleaner_lambda_policy" {
  name = "${var.project_name}-cleaner-lambda-policy"
  role = aws_iam_role.cleaner_lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "rds:DeleteDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:ListTagsForResource"
        ],
        Resource = "*"
      },
      local.cloudwatch_logs_policy
    ]
  })
}

resource "aws_iam_role" "restore_rds_lambda_role" {
  name = "${var.project_name}-restore-rds-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-restore-rds-role"
    }
  )
}

resource "aws_iam_role_policy" "restore_rds_lambda_policy" {
  name = "${var.project_name}-restore-rds-lambda-policy"
  role = aws_iam_role.restore_rds_lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:AddTagsToResource"
        ],
        Resource = "*"
      },
      local.cloudwatch_logs_policy
    ]
  })
}

resource "aws_iam_role" "route53_update_record_lambda_role" {
  name = "${var.project_name}-route53-update-record-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}route53-update-record-role"
    }
  )
}

resource "aws_iam_role_policy" "route53_update_record_lambda_policy" {
  name = "${var.project_name}-route53-update-record-lambda-policy"
  role = aws_iam_role.route53_update_record_lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "rds:DescribeDBInstances",
          "route53:ChangeResourceRecordSets"
        ],
        Resource = "*"
      },
      local.cloudwatch_logs_policy
    ]
  })
}
