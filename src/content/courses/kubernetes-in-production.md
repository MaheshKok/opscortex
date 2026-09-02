---
title: Kubernetes in Production
tagline: Run clusters that survive Friday deploys, node failures and the CFO.
level: Advanced
hours: 24
price: 349
order: 1
featured: true
tags: [Kubernetes, Helm, Networking, Security]
outcomes:
  - Design multi-tenant clusters with hard resource, network and identity boundaries
  - Upgrade control planes and node pools with zero customer-visible downtime
  - Debug CrashLoopBackOff, OOMKilled and DNS failures from first principles
  - Cut cluster spend 30 to 50 percent with right-sizing, bin-packing and spot pools
curriculum:
  - title: Cluster architecture that scales
    lessons:
      - Control plane internals and what actually breaks
      - etcd sizing, defrag and backup you will restore from
      - Node pools, taints and autoscaling that does not thrash
      - Upgrade strategy without a maintenance window
  - title: Workloads that behave
    lessons:
      - Requests, limits and the QoS classes nobody reads about
      - Probes that tell the truth
      - PodDisruptionBudgets and graceful shutdown
      - StatefulSets, operators and when to avoid both
  - title: Networking from packet to Ingress
    lessons:
      - CNI choice and the trade-offs behind it
      - Services, kube-proxy and IPVS
      - NetworkPolicy as a security boundary
      - Gateway API and the end of Ingress
  - title: Security you can defend in an audit
    lessons:
      - RBAC least privilege in practice
      - Pod Security Standards and admission control
      - Secrets, external stores and rotation
      - "Supply chain: signing, SBOMs and policy"
  - title: Cost, capacity and the CFO conversation
    lessons:
      - Reading the bill by namespace
      - Bin-packing and vertical right-sizing
      - Spot pools without pager fatigue
      - Capacity planning as an SLO
---

## Who this is for

Engineers who already run Kubernetes and want to stop being surprised by it. You know `kubectl`. You have shipped a Helm chart. You have also been paged at 3 a.m. by a cluster you did not fully understand.

## What you will build

A production-grade multi-tenant cluster on a real cloud account, upgraded live under synthetic traffic, with network policy, admission control and cost reporting wired in. Every lab ends with something breaking. You fix it.
