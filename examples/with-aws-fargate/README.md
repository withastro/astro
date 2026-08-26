---
name: AWS Fargate & Terraform
description: Deploy an Astro site to a highly available AWS ECS Fargate cluster using Terraform and GitHub Actions.
---

# Astro on AWS Fargate (via Terraform)

This example demonstrates how to containerize an Astro application and deploy it to a highly available AWS ECS Fargate cluster using Terraform and GitHub Actions. 

Writing raw Infrastructure-as-Code (IaC) for AWS load balancers, ECS tasks, and CDN distributions can be complex. To simplify this, the infrastructure and CI/CD pipelines in this example were generated using **[deploy-stack](https://github.com/anton-codes-iac/deploy-stack)**, an open-source CLI that builds zero-lock-in AWS architectures.

## Features

* **Zero-Config Nginx Container:** A multi-stage Docker build optimized to serve Astro's static `dist/` directory via an unprivileged Nginx container.
* **AWS Fargate ECS Cluster** running behind an Application Load Balancer.
* **AWS CloudFront CDN** for global edge caching.
* **Zero-Secret CI/CD:** GitHub Actions configured with AWS IAM OpenID Connect (OIDC).
* **Native S3 State Locking:** Terraform state is securely managed in AWS S3.

## How to Use

### 1. Bootstrap your own project

You can initialize a new Astro project with this exact AWS Fargate architecture using the Astro CLI:

```bash
npm create astro@latest -- --template with-aws-fargate
```

Alternatively, you can generate this infrastructure for any existing Astro app by running:

```bash
npx deploy-stack
```

### 2. Provision the Infrastructure

Ensure you have the [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) installed and your AWS credentials configured locally.

*Note: If you bootstrapped this template manually, you must replace `<YOUR_AWS_ACCOUNT_ID>` and `<YOUR_AWS_REGION>` in `.github/workflows/deploy.yml` and `<YOUR_S3_BUCKET_NAME>` and `<YOUR_AWS_REGION>` in `terraform/backend.tf` with your actual AWS details. (Running `npx deploy-stack` does this automatically).*

```bash
cd terraform
terraform init
terraform apply
```

### 3. Deploy via GitHub Actions

Push your repository to GitHub. The included `.github/workflows/deploy.yml` pipeline will automatically assume a secure OIDC role in your AWS account, build the Docker container, push it to Amazon ECR, and execute a zero-downtime deployment to your Fargate cluster.