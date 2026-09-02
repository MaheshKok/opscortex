---
title: CI/CD & GitOps with Argo CD
tagline: Ship forty times a day and roll back in one commit.
level: Intermediate
hours: 14
price: 199
order: 6
tags: [GitOps, Argo CD, GitHub Actions, Delivery]
outcomes:
  - Build pipelines that are fast, hermetic and boring
  - Run Argo CD for many teams with app-of-apps and ApplicationSets
  - Ship progressive delivery with canaries and automated rollback
  - Secure the supply chain from commit to cluster
curriculum:
  - title: Pipelines worth trusting
    lessons:
      - Hermetic builds and cache strategy
      - Test pyramids for infrastructure
      - Artifact promotion, not rebuilds
      - Pipeline as code that reviews well
  - title: GitOps done properly
    lessons:
      - Repo layout for environments and teams
      - Argo CD architecture and sync waves
      - ApplicationSets and app-of-apps
      - Secrets in GitOps without leaking
  - title: Progressive delivery
    lessons:
      - Argo Rollouts canaries and analysis
      - Feature flags vs deploys
      - Automated rollback on SLO burn
      - Database migrations in a rollout world
  - title: Supply chain security
    lessons:
      - Image signing with cosign
      - SBOMs and vulnerability gates
      - Admission policy that enforces it
      - Audit trail from commit to pod
---

## Who this is for

Engineers who own delivery and want to stop being the bottleneck for every release.

## What you will build

A GitHub Actions pipeline feeding an Argo CD instance managing three environments, with canary rollouts, automated rollback and image signing enforced at admission.
