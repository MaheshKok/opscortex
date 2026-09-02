---
title: Observability Engineering
tagline: Prometheus, Grafana and OpenTelemetry without the dashboard graveyard.
level: Intermediate
hours: 16
price: 229
order: 5
tags: [Prometheus, Grafana, OpenTelemetry, Tracing]
outcomes:
  - Instrument services with OpenTelemetry the way the SDK authors intended
  - Run Prometheus at scale with recording rules, federation and long-term storage
  - Build dashboards that answer a question and then get deleted
  - Debug a real incident with traces, logs and metrics together
curriculum:
  - title: The three pillars are a lie
    lessons:
      - Events, cardinality and cost
      - What to measure and what to drop
      - Sampling without losing the incident
      - Observability as a budget
  - title: Metrics that scale
    lessons:
      - Prometheus internals and TSDB
      - Recording rules and cardinality control
      - Federation, Thanos and Mimir
      - PromQL for humans
  - title: Traces and logs that connect
    lessons:
      - OpenTelemetry SDK and Collector
      - Context propagation across queues
      - Structured logging with trace IDs
      - "Exemplars: metrics to traces in one click"
  - title: Dashboards and debugging
    lessons:
      - The one-screen service dashboard
      - Debugging a latency spike live
      - Alert to root cause in five minutes
      - Retiring dashboards nobody opens
---

## Who this is for

Engineers who have Grafana open all day and still cannot answer "why is it slow" fast enough.

## What you will build

A full telemetry pipeline for a microservice demo: OTel instrumentation, Collector, Prometheus with long-term storage, Tempo, Loki and a single service dashboard. Then a staged incident you debug with it.
