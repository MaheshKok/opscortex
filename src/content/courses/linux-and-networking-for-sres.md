---
title: Linux & Networking for SREs
tagline: The layer beneath everything. Learn it once, use it every incident.
level: Beginner
hours: 14
price: 149
order: 7
tags: [Linux, Networking, TCP/IP, Performance]
outcomes:
  - Read a loaded system with top, vmstat, iostat and perf in under two minutes
  - Trace a request from socket to syscall with tcpdump and strace
  - Understand cgroups and namespaces well enough to debug containers
  - Tune kernel parameters with evidence, not blog posts
curriculum:
  - title: The process and the kernel
    lessons:
      - Processes, threads and scheduling
      - "Memory: RSS, cache and the OOM killer"
      - Filesystems and I/O paths
      - cgroups and namespaces, the container primitives
  - title: Networking from the wire up
    lessons:
      - TCP handshakes, windows and retransmits
      - "DNS: the cause of everything"
      - iptables, nftables and conntrack
      - Load balancers and what they hide
  - title: Performance investigation
    lessons:
      - USE method in practice
      - perf, flame graphs and eBPF basics
      - Latency vs throughput
      - Writing up what you found
  - title: Hardening and hygiene
    lessons:
      - SSH, sudo and audit
      - Patching without downtime
      - Systemd units done right
      - Logs you can actually search
---

## Who this is for

Engineers newer to infrastructure, or developers moving toward SRE, who want the fundamentals that every other course assumes.

## What you will build

A hands-on lab VM you deliberately break in twelve different ways, and diagnose each with standard tools. You leave with a personal debugging runbook.
