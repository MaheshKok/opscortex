---
title: Terraform at Scale
tagline: Infrastructure as code that fifty engineers can change without fear.
level: Intermediate
hours: 16
price: 279
order: 3
featured: true
tags: [Terraform, IaC, AWS, GCP]
outcomes:
  - Structure state, modules and environments for a multi-account organisation
  - Ship infra changes through CI with plan review, policy and drift detection
  - Refactor live infrastructure without destroying it
  - Write modules other teams adopt without asking you questions
curriculum:
  - title: State is the product
    lessons:
      - Remote state, locking and blast radius
      - Splitting state by lifecycle
      - Import, moved and removed blocks
      - Recovering from a corrupted state file
  - title: Modules people actually reuse
    lessons:
      - Interface design for modules
      - Versioning and a private registry
      - Testing modules with real applies
      - Deprecation without breaking consumers
  - title: Pipelines and policy
    lessons:
      - Plan in CI, apply on merge
      - OPA and Sentinel guardrails
      - Drift detection that alerts, not spams
      - Secrets and credentials in pipelines
  - title: Multi-account, multi-region, multi-cloud
    lessons:
      - Account vending and landing zones
      - Provider aliasing and regions
      - Cross-cloud without abstraction hell
      - Cost tagging enforced at plan time
---

## Who this is for

Engineers who have written Terraform and felt the fear of `terraform apply` on a shared state. Cloud provider agnostic; labs run on AWS and GCP.

## What you will build

A multi-account landing zone with module registry, CI pipeline, policy checks and drift alerts. Then you refactor it live while a synthetic workload keeps running.
