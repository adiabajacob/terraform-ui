<!-- BEGIN_TF_DOCS -->
# Terraform DOCSumentation
## Root Configuration
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 5.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 5.99.1 |
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | 5.99.1 |
| <a name="provider_aws.primary"></a> [aws.primary](#provider\_aws.primary) | 5.99.1 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_cloudwatch"></a> [cloudwatch](#module\_cloudwatch) | ./modules/cloudwatch | n/a |
| <a name="module_eventbridge"></a> [eventbridge](#module\_eventbridge) | ./modules/eventbridge | n/a |
| <a name="module_iam"></a> [iam](#module\_iam) | ./modules/iam | n/a |
| <a name="module_lambda"></a> [lambda](#module\_lambda) | ./modules/lambda | n/a |
| <a name="module_route53"></a> [route53](#module\_route53) | ./modules/route53 | n/a |
| <a name="module_sns"></a> [sns](#module\_sns) | ./modules/sns | n/a |
| <a name="module_vpc"></a> [vpc](#module\_vpc) | ./modules/vpc | n/a |

## Resources

| Name | Type |
|------|------|
| [aws_availability_zones.dr_availability_zones](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/availability_zones) | data source |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_db_instance.primary_db](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/db_instance) | data source |
| [aws_db_subnet_group.primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/db_subnet_group) | data source |
| [aws_subnet.db_subnet](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/subnet) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_dr_region"></a> [dr\_region](#input\_dr\_region) | Disaster recovery AWS region | `string` | `"eu-west-1"` | no |
| <a name="input_primary_db_identifier"></a> [primary\_db\_identifier](#input\_primary\_db\_identifier) | Identifier of the primary RDS instance | `string` | `"primary-db"` | no |
| <a name="input_primary_region"></a> [primary\_region](#input\_primary\_region) | Primary AWS region where your RDS instance is located | `string` | `"eu-central-1"` | no |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Project name for resource naming | `string` | `"rds-dr"` | no |
| <a name="input_sns_email"></a> [sns\_email](#input\_sns\_email) | SNS topic email for notifications | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Tags to apply to resources | `map(string)` | <pre>{<br/>  "Environment": "DR",<br/>  "ManagedBy": "Terraform"<br/>}</pre> | no |

## Outputs

No outputs.

## Module: cloudwatch

## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws.useast1"></a> [aws.useast1](#provider\_aws.useast1) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_cloudwatch_metric_alarm.rds_failure](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_metric_alarm) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Name of the project (used for resource naming and tagging). | `string` | n/a | yes |
| <a name="input_rds_instance_id"></a> [rds\_instance\_id](#input\_rds\_instance\_id) | The identifier of the primary RDS instance | `string` | n/a | yes |
| <a name="input_route53_health_check_id"></a> [route53\_health\_check\_id](#input\_route53\_health\_check\_id) | ID of the Route53 health check to associate with DNS records. | `string` | n/a | yes |
| <a name="input_sns_dr_topic_arn"></a> [sns\_dr\_topic\_arn](#input\_sns\_dr\_topic\_arn) | ARN of the SNS topic for disaster recovery notifications. | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags to assign to resources. | `map(string)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_rds_failure_alarm_name"></a> [rds\_failure\_alarm\_name](#output\_rds\_failure\_alarm\_name) | Alarm name for RDS failure |

## Module: eventbridge

## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | n/a |
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_cloudwatch_event_rule.cross_region_snapshot_finished_event](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_rule) | resource |
| [aws_cloudwatch_event_rule.manual_snapshot_created_event](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_rule) | resource |
| [aws_cloudwatch_event_rule.rds_snapshot_restoration_completed](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_rule) | resource |
| [aws_cloudwatch_event_rule.schedule_snapshot](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_rule) | resource |
| [aws_cloudwatch_event_target.cross_region_snapshot_finished_target](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_target) | resource |
| [aws_cloudwatch_event_target.manual_snapshot_created_target](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_target) | resource |
| [aws_cloudwatch_event_target.snapshot_creator_target](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_target) | resource |
| [aws_cloudwatch_event_target.trigger_post_restoration_lambda](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_target) | resource |
| [aws_lambda_permission.allow_eventbridge_clean_snapshots](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_permission) | resource |
| [aws_lambda_permission.allow_eventbridge_cross_region_snapshot_copy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_permission) | resource |
| [aws_lambda_permission.allow_eventbridge_manual_snapshot](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_permission) | resource |
| [aws_lambda_permission.allow_restoration_event](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_permission) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Name of the project (used for resource naming and tagging). | `string` | n/a | yes |
| <a name="input_rds_failure_alarm_name"></a> [rds\_failure\_alarm\_name](#input\_rds\_failure\_alarm\_name) | The name of the CloudWatch alarm that triggers on RDS instance failures. | `string` | n/a | yes |
| <a name="input_rds_instance_id"></a> [rds\_instance\_id](#input\_rds\_instance\_id) | The identifier of the primary RDS instance | `string` | n/a | yes |
| <a name="input_route53_update_record_function_arn"></a> [route53\_update\_record\_function\_arn](#input\_route53\_update\_record\_function\_arn) | The ARN of the Lambda function that updates Route53 records during RDS failover events. | `string` | n/a | yes |
| <a name="input_route53_update_record_function_name"></a> [route53\_update\_record\_function\_name](#input\_route53\_update\_record\_function\_name) | The name of the Lambda function that modifies Route53 DNS entries for DR failover. | `string` | n/a | yes |
| <a name="input_snapshot_cleaner_function_arn"></a> [snapshot\_cleaner\_function\_arn](#input\_snapshot\_cleaner\_function\_arn) | The ARN of the Lambda function that manages snapshot retention by cleaning up old snapshots. | `string` | n/a | yes |
| <a name="input_snapshot_cleaner_function_name"></a> [snapshot\_cleaner\_function\_name](#input\_snapshot\_cleaner\_function\_name) | The name of the Lambda function responsible for deleting outdated RDS snapshots. | `string` | n/a | yes |
| <a name="input_snapshot_creator_function_arn"></a> [snapshot\_creator\_function\_arn](#input\_snapshot\_creator\_function\_arn) | The ARN of the Lambda function responsible for creating RDS snapshots. | `string` | n/a | yes |
| <a name="input_snapshot_creator_function_name"></a> [snapshot\_creator\_function\_name](#input\_snapshot\_creator\_function\_name) | The name of the Lambda function that creates RDS snapshots. | `string` | n/a | yes |
| <a name="input_snapshot_cross_region_copy_function_arn"></a> [snapshot\_cross\_region\_copy\_function\_arn](#input\_snapshot\_cross\_region\_copy\_function\_arn) | The ARN of the Lambda function that copies RDS snapshots to another AWS region for disaster recovery. | `string` | n/a | yes |
| <a name="input_snapshot_cross_region_copy_function_name"></a> [snapshot\_cross\_region\_copy\_function\_name](#input\_snapshot\_cross\_region\_copy\_function\_name) | The name of the Lambda function handling cross-region RDS snapshot copies. | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags to assign to resources. | `map(string)` | n/a | yes |

## Outputs

No outputs.

## Module: iam

## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_iam_role.cleaner_lambda_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role.copy_lambda_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role.creator_lambda_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role.restore_rds_lambda_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role.route53_update_record_lambda_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role_policy.cleaner_lambda_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy) | resource |
| [aws_iam_role_policy.copy_lambda_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy) | resource |
| [aws_iam_role_policy.creator_lambda_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy) | resource |
| [aws_iam_role_policy.restore_rds_lambda_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy) | resource |
| [aws_iam_role_policy.route53_update_record_lambda_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Name of the project (used for resource naming and tagging). | `string` | n/a | yes |
| <a name="input_snapshot_cleaner_function_arn"></a> [snapshot\_cleaner\_function\_arn](#input\_snapshot\_cleaner\_function\_arn) | The ARN of the Lambda function that manages snapshot retention by cleaning up old snapshots. | `string` | n/a | yes |
| <a name="input_snapshot_cross_region_copy_function_arn"></a> [snapshot\_cross\_region\_copy\_function\_arn](#input\_snapshot\_cross\_region\_copy\_function\_arn) | The ARN of the Lambda function that copies RDS snapshots to another AWS region for disaster recovery. | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags to assign to resources. | `map(string)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cleaner_lambda_role_arn"></a> [cleaner\_lambda\_role\_arn](#output\_cleaner\_lambda\_role\_arn) | IAM Role ARN for the Lambda function that deletes old RDS snapshots in the DR region based on retention policy. |
| <a name="output_copy_lambda_role_arn"></a> [copy\_lambda\_role\_arn](#output\_copy\_lambda\_role\_arn) | IAM Role ARN for the Lambda function that copies RDS snapshots to the disaster recovery (DR) region. |
| <a name="output_creator_lambda_role_arn"></a> [creator\_lambda\_role\_arn](#output\_creator\_lambda\_role\_arn) | IAM Role ARN for the Lambda function that creates RDS snapshots in the primary region. |
| <a name="output_restore_rds_lambda_role_arn"></a> [restore\_rds\_lambda\_role\_arn](#output\_restore\_rds\_lambda\_role\_arn) | IAM Role ARN for the Lambda function that restores RDS in the DR region from the latest snapshot in the dr region. |
| <a name="output_route53_update_record_lambda_role_arn"></a> [route53\_update\_record\_lambda\_role\_arn](#output\_route53\_update\_record\_lambda\_role\_arn) | IAM Role ARN for the Lambda function that updates route53 DNS records |

## Module: lambda

## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_archive"></a> [archive](#provider\_archive) | n/a |
| <a name="provider_aws"></a> [aws](#provider\_aws) | n/a |
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_lambda_function.restore_rds](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function) | resource |
| [aws_lambda_function.route53_update_record](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function) | resource |
| [aws_lambda_function.snapshot_cleaner](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function) | resource |
| [aws_lambda_function.snapshot_creator](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function) | resource |
| [aws_lambda_function.snapshot_cross_region_copy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function) | resource |
| [archive_file.restore_rds_zip](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [archive_file.route53_update_record_zip](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [archive_file.snapshot_cleaner_zip](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [archive_file.snapshot_creator_zip](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [archive_file.snapshot_cross_region_copy_zip](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_cleaner_lambda_role_arn"></a> [cleaner\_lambda\_role\_arn](#input\_cleaner\_lambda\_role\_arn) | ARN of the IAM role used by the snapshot cleaner Lambda function | `string` | n/a | yes |
| <a name="input_copy_lambda_role_arn"></a> [copy\_lambda\_role\_arn](#input\_copy\_lambda\_role\_arn) | ARN of the IAM role used by the cross-region snapshot copy Lambda function | `string` | n/a | yes |
| <a name="input_creator_lambda_role_arn"></a> [creator\_lambda\_role\_arn](#input\_creator\_lambda\_role\_arn) | ARN of the IAM role used by the snapshot creator Lambda function | `string` | n/a | yes |
| <a name="input_dr_parameter_group_name"></a> [dr\_parameter\_group\_name](#input\_dr\_parameter\_group\_name) | The name of the DB parameter group to use for the DR RDS instance, containing database configuration settings | `string` | n/a | yes |
| <a name="input_dr_region"></a> [dr\_region](#input\_dr\_region) | The AWS region designated for disaster recovery, where backups and failover resources are maintained | `string` | n/a | yes |
| <a name="input_dr_security_group_id"></a> [dr\_security\_group\_id](#input\_dr\_security\_group\_id) | The ID of the security group to associate with the DR RDS instance, controlling network access | `any` | n/a | yes |
| <a name="input_dr_subnet_group_name"></a> [dr\_subnet\_group\_name](#input\_dr\_subnet\_group\_name) | The name of the DB subnet group for the DR RDS instance, defining which subnets it can be deployed in | `string` | n/a | yes |
| <a name="input_primary_region"></a> [primary\_region](#input\_primary\_region) | The AWS region where the primary/production RDS instance and resources are located | `string` | n/a | yes |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Name of the project (used for resource naming and tagging). | `string` | n/a | yes |
| <a name="input_rds_instance_id"></a> [rds\_instance\_id](#input\_rds\_instance\_id) | The identifier of the primary RDS instance | `string` | n/a | yes |
| <a name="input_restore_rds_lambda_role_arn"></a> [restore\_rds\_lambda\_role\_arn](#input\_restore\_rds\_lambda\_role\_arn) | ARN of the IAM role used by the RDS restore Lambda function | `string` | n/a | yes |
| <a name="input_route53_database_record_name"></a> [route53\_database\_record\_name](#input\_route53\_database\_record\_name) | The DNS record name (e.g., 'db.example.com') that will point to the RDS instance | `string` | n/a | yes |
| <a name="input_route53_database_record_ttl"></a> [route53\_database\_record\_ttl](#input\_route53\_database\_record\_ttl) | The TTL (Time To Live) in seconds for the Route53 database record | `any` | n/a | yes |
| <a name="input_route53_hosted_zone_id"></a> [route53\_hosted\_zone\_id](#input\_route53\_hosted\_zone\_id) | The ID of the Route53 hosted zone where the database DNS record will be created/updated | `string` | n/a | yes |
| <a name="input_route53_update_record_lambda_role_arn"></a> [route53\_update\_record\_lambda\_role\_arn](#input\_route53\_update\_record\_lambda\_role\_arn) | ARN of the IAM role used by the Route53 record updater Lambda function | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags to assign to resources. | `map(string)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_restore_rds_function"></a> [restore\_rds\_function](#output\_restore\_rds\_function) | The Lambda function that automates the restoration process of RDS instances from available snapshots. |
| <a name="output_route53_update_record_function"></a> [route53\_update\_record\_function](#output\_route53\_update\_record\_function) | The Lambda function that updates Route53 DNS records, typically used during restoration to point to the newly restored database instance. |
| <a name="output_snapshot_cleaner_function"></a> [snapshot\_cleaner\_function](#output\_snapshot\_cleaner\_function) | The Lambda function that manages snapshot lifecycle by removing outdated snapshots based on retention policies. |
| <a name="output_snapshot_creator_function"></a> [snapshot\_creator\_function](#output\_snapshot\_creator\_function) | The Lambda function responsible for creating RDS snapshots according to the defined backup schedule. |
| <a name="output_snapshot_cross_region_copy_function"></a> [snapshot\_cross\_region\_copy\_function](#output\_snapshot\_cross\_region\_copy\_function) | The Lambda function that handles copying RDS snapshots to a secondary AWS region for disaster recovery purposes. |

## Module: route53

## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | n/a |
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_route53_health_check.primary_db_health_check](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_health_check) | resource |
| [aws_route53_record.database_record](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |
| [aws_route53_vpc_association_authorization.association_authorization](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_vpc_association_authorization) | resource |
| [aws_route53_zone.private_zone](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_zone) | resource |
| [aws_route53_zone_association.zone_association](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_zone_association) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_dr_region"></a> [dr\_region](#input\_dr\_region) | The AWS region designated for disaster recovery, where backups and failover resources are maintained | `string` | n/a | yes |
| <a name="input_dr_vpc_id"></a> [dr\_vpc\_id](#input\_dr\_vpc\_id) | The VPC ID in the DR region where standby/recovery resources are provisioned. | `string` | n/a | yes |
| <a name="input_primary_region"></a> [primary\_region](#input\_primary\_region) | The AWS region where the primary/production RDS instance and resources are located | `string` | n/a | yes |
| <a name="input_primary_vpc_id"></a> [primary\_vpc\_id](#input\_primary\_vpc\_id) | The VPC ID in the primary region where the production RDS instance is deployed. | `string` | n/a | yes |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Name of the project (used for resource naming and tagging). | `string` | n/a | yes |
| <a name="input_rds_instance_address"></a> [rds\_instance\_address](#input\_rds\_instance\_address) | The DNS endpoint or connection address of the primary RDS instance | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags to assign to resources. | `map(string)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_route53_database_record"></a> [route53\_database\_record](#output\_route53\_database\_record) | Route 53 DNS record for the database |
| <a name="output_route53_health_check_id"></a> [route53\_health\_check\_id](#output\_route53\_health\_check\_id) | n/a |
| <a name="output_route53_hosted_zone_id"></a> [route53\_hosted\_zone\_id](#output\_route53\_hosted\_zone\_id) | The hosted zone ID of the private Route 53 zone |

## Module: sns

## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | n/a |
| <a name="provider_aws.useast1"></a> [aws.useast1](#provider\_aws.useast1) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_lambda_permission.allow_sns_cross_region](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_permission) | resource |
| [aws_sns_topic.sns_dr_notification](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic) | resource |
| [aws_sns_topic_subscription.email](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription) | resource |
| [aws_sns_topic_subscription.lambda](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_notification_email_address"></a> [notification\_email\_address](#input\_notification\_email\_address) | The email address to receive notifications for backup, restore, and disaster recovery operations. | `any` | n/a | yes |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Name of the project (used for resource naming and tagging). | `string` | n/a | yes |
| <a name="input_restore_rds_function_arn"></a> [restore\_rds\_function\_arn](#input\_restore\_rds\_function\_arn) | The ARN of the Lambda function responsible for restoring RDS instances from snapshots during disaster recovery scenarios. | `any` | n/a | yes |
| <a name="input_restore_rds_function_name"></a> [restore\_rds\_function\_name](#input\_restore\_rds\_function\_name) | The name of the Lambda function that handles RDS instance restoration from backups/snapshots. | `any` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags to assign to resources. | `map(string)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_sns_dr_topic_arn"></a> [sns\_dr\_topic\_arn](#output\_sns\_dr\_topic\_arn) | Arn of the disaster recovery SNS topic |

## Module: vpc

## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_vpc"></a> [vpc](#module\_vpc) | terraform-aws-modules/vpc/aws | 5.21.0 |

## Resources

| Name | Type |
|------|------|
| [aws_db_parameter_group.secondary_db_parameter_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_parameter_group) | resource |
| [aws_db_subnet_group.secondary_subnet_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_subnet_group) | resource |
| [aws_security_group.secondary_db_sg](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_dr_availability_zones"></a> [dr\_availability\_zones](#input\_dr\_availability\_zones) | List of Availability Zones (AZs) to use for disaster recovery (DR) resources, ensuring high availability across isolated locations. | `any` | n/a | yes |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Name of the project (used for resource naming and tagging). | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags to assign to resources. | `map(string)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_dr_parameter_group_name"></a> [dr\_parameter\_group\_name](#output\_dr\_parameter\_group\_name) | n/a |
| <a name="output_dr_security_group_id"></a> [dr\_security\_group\_id](#output\_dr\_security\_group\_id) | n/a |
| <a name="output_dr_subnet_group_name"></a> [dr\_subnet\_group\_name](#output\_dr\_subnet\_group\_name) | n/a |
| <a name="output_dr_vpc_id"></a> [dr\_vpc\_id](#output\_dr\_vpc\_id) | VPC ID of the DR region |
<!-- END_TF_DOCS -->
