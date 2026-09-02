---
title: Cloud Architecture Patterns
tagline: Design for failure, cost and the migration you will eventually do.
level: Advanced
hours: 20
price: 329
order: 4
tags: [AWS, GCP, Architecture, Resilience]
outcomes:
  - Choose between regions, zones and cells with real availability math
  - Design data layers that survive a regional outage
  - Model cost before you build, not after the first invoice
  - Present architecture decisions with ADRs that survive review
curriculum:
  - title: Availability math and the truth about nines
    lessons:
      - Dependencies multiply, not add
      - Zones, regions and cells
      - Static stability and the retry storm
      - Chaos experiments that prove the design
  - title: Data at the edge of failure
    lessons:
      - Replication modes and what you lose
      - Queues, idempotency and exactly-once lies
      - Multi-region writes without a PhD
      - Backups you have actually restored
  - title: Networking and identity as the perimeter
    lessons:
      - VPC design for growth
      - Private connectivity and egress control
      - Workload identity everywhere
      - Zero trust without buying a product
  - title: Cost as an architectural constraint
    lessons:
      - Unit economics per request
      - Serverless vs containers vs VMs by workload
      - Reserved, savings plans and spot
      - Cost reviews that engineers respect
---

## Who this is for

Senior engineers, tech leads and architects who own systems on AWS or GCP and are asked to make decisions that cost real money.

## What you will build

A reference architecture for a payments-style workload with a written ADR set, cost model, failure-mode analysis and a chaos test plan you run against it.
