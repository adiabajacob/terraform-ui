data "archive_file" "snapshot_creator_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/snapshot_creator.py"
  output_path = "${path.module}/snapshot_creator.zip"
}

data "archive_file" "snapshot_cross_region_copy_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/snapshot_cross_region_copy.py"
  output_path = "${path.module}/snapshot_cross_region_copy.zip"
}

data "archive_file" "snapshot_cleaner_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/snapshot_cleaner.py"
  output_path = "${path.module}/snapshot_cleaner.zip"
}

data "archive_file" "restore_rds_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/restore_rds_from_snapshot.py"
  output_path = "${path.module}/restore_rds.zip"
}


data "archive_file" "route53_update_record_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/route53_update_record.py"
  output_path = "${path.module}/route53_update_record.zip"
}

resource "aws_lambda_function" "snapshot_creator" {
  filename         = data.archive_file.snapshot_creator_zip.output_path
  function_name    = "${var.project_name}-snapshot-creator"
  role             = var.creator_lambda_role_arn
  handler          = "snapshot_creator.lambda_handler"
  runtime          = "python3.9"
  timeout          = 60
  source_code_hash = data.archive_file.snapshot_creator_zip.output_base64sha256

  environment {
    variables = {
      RDS_INSTANCE_ID = var.rds_instance_id
      PRIMARY_REGION  = var.primary_region
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-snapshot-creator"
    }
  )
}

resource "aws_lambda_function" "snapshot_cross_region_copy" {
  filename         = data.archive_file.snapshot_cross_region_copy_zip.output_path
  function_name    = "${var.project_name}-snapshot-cross-region-copy"
  role             = var.copy_lambda_role_arn
  handler          = "snapshot_cross_region_copy.lambda_handler"
  runtime          = "python3.9"
  timeout          = 120
  source_code_hash = data.archive_file.snapshot_cross_region_copy_zip.output_base64sha256

  environment {
    variables = {
      PRIMARY_REGION  = var.primary_region
      DR_REGION       = var.dr_region
      RDS_INSTANCE_ID = var.rds_instance_id
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-snapshot-cross-region-copy"
    }
  )
}

resource "aws_lambda_function" "snapshot_cleaner" {
  provider         = aws.dr
  filename         = data.archive_file.snapshot_cleaner_zip.output_path
  function_name    = "${var.project_name}-snapshot-cleaner"
  role             = var.cleaner_lambda_role_arn
  handler          = "snapshot_cleaner.lambda_handler"
  runtime          = "python3.9"
  timeout          = 300
  source_code_hash = data.archive_file.snapshot_cleaner_zip.output_base64sha256

  environment {
    variables = {
      PRIMARY_REGION  = var.primary_region
      DR_REGION       = var.dr_region
      RDS_INSTANCE_ID = var.rds_instance_id
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-snapshot-cleaner"
    }
  )
}

resource "aws_lambda_function" "restore_rds" {
  provider         = aws.dr
  filename         = data.archive_file.restore_rds_zip.output_path
  function_name    = "${var.project_name}-restore-rds-from-snapshot"
  role             = var.restore_rds_lambda_role_arn
  handler          = "restore_rds_from_snapshot.lambda_handler"
  runtime          = "python3.9"
  timeout          = 300
  source_code_hash = data.archive_file.restore_rds_zip.output_base64sha256

  environment {
    variables = {
      DR_REGION            = var.dr_region
      SECURITY_GROUP_ID    = var.dr_security_group_id
      PARAMETER_GROUP_NAME = var.dr_parameter_group_name
      SUBNET_GROUP_NAME    = var.dr_subnet_group_name
      RDS_INSTANCE_ID      = var.rds_instance_id
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-restore-rds-from-snapshot"
    }
  )
}

resource "aws_lambda_function" "route53_update_record" {
  provider         = aws.dr
  filename         = data.archive_file.route53_update_record_zip.output_path
  function_name    = "${var.project_name}-route53-update-record"
  role             = var.route53_update_record_lambda_role_arn
  handler          = "route53_update_record.lambda_handler"
  runtime          = "python3.9"
  timeout          = 300
  source_code_hash = data.archive_file.route53_update_record_zip.output_base64sha256

  environment {
    variables = {
      DR_REGION      = var.dr_region
      HOSTED_ZONE_ID = var.route53_hosted_zone_id
      RECORD_NAME    = var.route53_database_record_name
      TTL            = var.route53_database_record_ttl
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-route53-update-record"
    }
  )
}


