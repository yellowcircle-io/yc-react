#!/usr/bin/env python3
"""
Sleepless Agent Wrapper with Circuit Breaker Integration

This script wraps the sleepless-agent daemon to add:
1. Circuit breaker check before starting
2. Heartbeat registration for the daemon process
3. Failure tracking for task failures

Usage:
    python scripts/sleepless-agent-wrapper.py daemon
    python scripts/sleepless-agent-wrapper.py status
    python scripts/sleepless-agent-wrapper.py reset
"""

from __future__ import annotations

import asyncio
import os
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Add scripts directory to path for circuit_breaker import
scripts_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(scripts_dir))

from circuit_breaker import (
    CircuitBreaker,
    AgentHeartbeat,
    TaskCoordinator,
    SleeplessAgentIntegration,
    get_project_dir,
)


def check_can_start() -> tuple[bool, str]:
    """Check if the daemon can start."""
    cb = CircuitBreaker()

    if cb.is_open():
        status = cb.get_status()
        reason = status.get("circuit_opened_reason", "Unknown")
        opened_at = status.get("circuit_opened_at", "Unknown")
        return False, f"Circuit breaker is OPEN since {opened_at}: {reason}"

    return True, "OK"


def show_status():
    """Show current status of circuit breaker, agents, and tasks."""
    import json

    print("=" * 60)
    print("SLEEPLESS AGENT STATUS")
    print("=" * 60)

    # Circuit breaker
    cb = CircuitBreaker()
    status = cb.get_status()
    print("\n[Circuit Breaker]")
    print(f"  Open: {status.get('circuit_open', False)}")
    if status.get("circuit_open"):
        print(f"  Opened At: {status.get('circuit_opened_at')}")
        print(f"  Reason: {status.get('circuit_opened_reason')}")
    print(f"  Failure Counts:")
    for k, v in status.get("failure_counts", {}).items():
        threshold = status.get("thresholds", {}).get(k, "?")
        print(f"    {k}: {v}/{threshold}")

    # Agents
    hb = AgentHeartbeat()
    agents = hb.get_all_agents()
    print(f"\n[Active Agents] ({len(agents)})")
    if agents:
        for agent_id, info in agents.items():
            print(f"  {agent_id}:")
            print(f"    Status: {info.get('status')}")
            print(f"    Last Seen: {info.get('last_seen')}")
            print(f"    Task: {info.get('task', 'N/A')[:50]}...")
    else:
        print("  No active agents")

    # Stale agents
    stale = hb.get_stale_agents(threshold_seconds=300)
    if stale:
        print(f"\n[Stale Agents] ({len(stale)}) - No heartbeat for 5+ minutes")
        for agent_id in stale:
            print(f"  - {agent_id}")

    # Tasks
    tc = TaskCoordinator()
    tasks = tc.get_active_tasks()
    print(f"\n[Active Tasks] ({len(tasks)})")
    if tasks:
        for task_id, info in tasks.items():
            print(f"  {task_id[:16]}...:")
            print(f"    Agent: {info.get('agent')}")
            print(f"    Started: {info.get('started_at')}")
            print(f"    Description: {info.get('description', 'N/A')[:50]}...")
    else:
        print("  No active tasks")

    print("\n" + "=" * 60)


def reset_circuit_breaker():
    """Reset the circuit breaker."""
    cb = CircuitBreaker()
    if cb.reset():
        print("Circuit breaker reset successfully")
        print("Agents can now resume work")
    else:
        print("Failed to reset circuit breaker")
        sys.exit(1)


def run_daemon_with_integration():
    """Run the sleepless-agent daemon with circuit breaker integration."""
    # Check if we can start
    can_start, reason = check_can_start()
    if not can_start:
        print(f"\n{'=' * 60}")
        print("DAEMON BLOCKED")
        print("=" * 60)
        print(f"\n{reason}")
        print("\nTo reset the circuit breaker, run:")
        print("  python scripts/sleepless-agent-wrapper.py reset")
        print("  # or")
        print("  ./scripts/reset-circuit-breaker.sh")
        sys.exit(1)

    # Register daemon heartbeat
    hb = AgentHeartbeat()
    daemon_id = f"sleepless-daemon-{os.getpid()}-{int(time.time())}"
    hb.register(daemon_id, "sleepless-agent daemon")
    hb.start_heartbeat_thread(interval_seconds=60, task="daemon running")

    print(f"\n{'=' * 60}")
    print("STARTING SLEEPLESS AGENT WITH CIRCUIT BREAKER")
    print("=" * 60)
    print(f"\nDaemon ID: {daemon_id}")
    print(f"Project Dir: {get_project_dir()}")
    print("Circuit Breaker: ACTIVE")
    print("Heartbeat: ACTIVE (60s interval)")
    print("\n" + "=" * 60 + "\n")

    # Signal handler to clean up
    def cleanup_handler(sig, frame):
        print(f"\nReceived signal {sig}, cleaning up...")
        hb.stop_heartbeat_thread()
        hb.update("stopped")
        hb.remove()
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup_handler)
    signal.signal(signal.SIGTERM, cleanup_handler)

    try:
        # Import and run the actual daemon
        from sleepless_agent.core.daemon import SleeplessAgent

        agent = SleeplessAgent()

        # Monkey-patch the task runtime to add circuit breaker integration
        original_process_tasks = agent._process_tasks

        async def patched_process_tasks():
            # Check circuit breaker before processing
            cb = CircuitBreaker()
            if cb.is_open():
                status = cb.get_status()
                reason = status.get("circuit_opened_reason", "Unknown")
                print(f"\n[CircuitBreaker] Blocking task processing - circuit is OPEN: {reason}")
                return

            # Update heartbeat
            hb.update("processing_tasks")

            # Call original
            await original_process_tasks()

            # Update heartbeat after processing
            hb.update("idle")

        agent._process_tasks = patched_process_tasks

        # Run the agent
        asyncio.run(agent.run())

    except ImportError as e:
        print(f"Error: Could not import sleepless_agent: {e}")
        print("Make sure sleepless-agent is installed: pipx install sleepless-agent")
        sys.exit(1)
    except Exception as e:
        print(f"Error running daemon: {e}")
        # Record the failure
        cb = CircuitBreaker()
        cb.record_failure("task_failed", str(e), daemon_id)
        sys.exit(1)
    finally:
        hb.stop_heartbeat_thread()
        hb.remove()


def main():
    if len(sys.argv) < 2:
        print("Usage: python sleepless-agent-wrapper.py <command>")
        print("")
        print("Commands:")
        print("  daemon    - Start the sleepless-agent daemon with circuit breaker")
        print("  status    - Show current status (circuit breaker, agents, tasks)")
        print("  reset     - Reset the circuit breaker")
        print("")
        print("Examples:")
        print("  python scripts/sleepless-agent-wrapper.py daemon")
        print("  python scripts/sleepless-agent-wrapper.py status")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "daemon":
        run_daemon_with_integration()
    elif cmd == "status":
        show_status()
    elif cmd == "reset":
        reset_circuit_breaker()
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
