terraform {
   backend "s3" {
   bucket = "rds-dr-24"
    key    = "read-replica/terraform.tfstate"
    region = "eu-central-1"
    use_lockfile   = true
  }
}