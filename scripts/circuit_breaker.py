#!/usr/bin/env python3
"""
Circuit Breaker Integration for Sleepless Agent

This module provides circuit breaker, heartbeat, and task coordination
functionality that integrates with the sleepless-agent daemon.

Usage:
    from circuit_breaker import CircuitBreaker, AgentHeartbeat, TaskCoordinator

    cb = CircuitBreaker()
    if cb.is_open():
        print("Circuit is open, blocking execution")
        sys.exit(1)

    hb = AgentHeartbeat()
    hb.register("my-agent-id")
    hb.update("running")

    tc = TaskCoordinator()
    if tc.claim_task("task-123", "Do something"):
        # execute task
        tc.release_task("task-123", "completed")
"""

from __future__ import annotations

import json
import os
import socket
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Callable
import hashlib


def get_project_dir() -> Path:
    """Get the yellowcircle project directory."""
    # Try environment variable first
    if env_path := os.environ.get("YELLOWCIRCLE_PROJECT_DIR"):
        return Path(env_path)

    # Try to find via Dropbox path
    dropbox_paths = [
        Path.home() / "Library" / "CloudStorage" / "Dropbox" / "CC Projects" / "yellowcircle" / "yellow-circle",
        Path.home() / "Dropbox" / "CC Projects" / "yellowcircle" / "yellow-circle",
    ]

    for path in dropbox_paths:
        if path.exists():
            return path

    # Fallback to current directory's parent if we're in scripts/
    current = Path(__file__).resolve().parent
    if current.name == "scripts":
        return current.parent

    raise RuntimeError("Could not determine project directory. Set YELLOWCIRCLE_PROJECT_DIR environment variable.")


def utc_now() -> str:
    """Get current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def safe_json_update(path: Path, updater: Callable[[Dict], Dict]) -> bool:
    """
    Safely update a JSON file with atomic write.

    Args:
        path: Path to the JSON file
        updater: Function that takes the current data and returns updated data

    Returns:
        True if successful, False otherwise
    """
    try:
        if not path.exists():
            return False

        data = json.loads(path.read_text())
        updated = updater(data)

        # Atomic write via temp file
        tmp_path = path.with_suffix(".tmp")
        tmp_path.write_text(json.dumps(updated, indent=2))
        tmp_path.rename(path)
        return True
    except Exception as e:
        print(f"[CircuitBreaker] Error updating {path}: {e}")
        return False


class CircuitBreaker:
    """
    Circuit breaker for preventing cascading failures.

    Tracks failure counts by type and trips the circuit when thresholds are exceeded.
    """

    def __init__(self, project_dir: Optional[Path] = None):
        self.project_dir = project_dir or get_project_dir()
        self.config_path = self.project_dir / ".claude" / "shared-context" / "circuit-breaker.json"

    def _read_config(self) -> Dict[str, Any]:
        """Read the circuit breaker configuration."""
        if not self.config_path.exists():
            return {}
        try:
            return json.loads(self.config_path.read_text())
        except Exception:
            return {}

    def is_open(self) -> bool:
        """Check if the circuit breaker is open (should block execution)."""
        config = self._read_config()
        return config.get("circuit_open", False)

    def get_status(self) -> Dict[str, Any]:
        """Get the current circuit breaker status."""
        return self._read_config()

    def record_failure(self, failure_type: str, details: str = "", agent_id: str = "") -> bool:
        """
        Record a failure and potentially trip the circuit breaker.

        Args:
            failure_type: Type of failure (commit_failed, build_failed, deployment_failed, auth_failed, task_failed)
            details: Additional details about the failure
            agent_id: ID of the agent that experienced the failure

        Returns:
            True if circuit was tripped, False otherwise
        """
        now = utc_now()
        tripped = False

        def updater(data: Dict) -> Dict:
            nonlocal tripped

            # Increment failure count
            counts = data.get("failure_counts", {})
            count = counts.get(failure_type, 0) + 1
            counts[failure_type] = count
            data["failure_counts"] = counts

            # Update metadata
            data["last_updated"] = now
            data["last_failure"] = {
                "type": failure_type,
                "time": now,
                "details": details,
                "agent": agent_id,
            }

            # Check threshold
            thresholds = data.get("thresholds", {})
            threshold = thresholds.get(failure_type, 999)

            if count >= threshold:
                data["circuit_open"] = True
                data["circuit_opened_at"] = now
                data["circuit_opened_reason"] = f"{failure_type} count ({count}) exceeded threshold ({threshold})"
                tripped = True

            return data

        safe_json_update(self.config_path, updater)
        return tripped

    def reset(self) -> bool:
        """Reset the circuit breaker."""
        now = utc_now()

        def updater(data: Dict) -> Dict:
            data["circuit_open"] = False
            data["circuit_opened_at"] = None
            data["circuit_opened_reason"] = None
            data["last_reset"] = now
            data["last_updated"] = now
            data["failure_counts"] = {
                "commit_failed": 0,
                "build_failed": 0,
                "deployment_failed": 0,
                "auth_failed": 0,
                "task_failed": 0,
            }
            return data

        return safe_json_update(self.config_path, updater)


class AgentHeartbeat:
    """
    Agent heartbeat tracker for health monitoring.

    Tracks which agents are alive and what they're working on.
    """

    def __init__(self, project_dir: Optional[Path] = None):
        self.project_dir = project_dir or get_project_dir()
        self.config_path = self.project_dir / ".claude" / "shared-context" / "agent-heartbeats.json"
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._agent_id: Optional[str] = None

    def _read_config(self) -> Dict[str, Any]:
        """Read the heartbeat configuration."""
        if not self.config_path.exists():
            return {"agents": {}}
        try:
            return json.loads(self.config_path.read_text())
        except Exception:
            return {"agents": {}}

    def register(self, agent_id: str, task: str = "") -> bool:
        """Register an agent with initial heartbeat."""
        self._agent_id = agent_id
        return self.update("starting", task)

    def update(self, status: str = "running", task: str = "") -> bool:
        """Update the agent's heartbeat."""
        if not self._agent_id:
            return False

        now = utc_now()
        agent_id = self._agent_id

        def updater(data: Dict) -> Dict:
            agents = data.get("agents", {})
            agents[agent_id] = {
                "last_seen": now,
                "status": status,
                "hostname": socket.gethostname(),
                "pid": os.getpid(),
                "task": task,
            }
            data["agents"] = agents
            return data

        return safe_json_update(self.config_path, updater)

    def remove(self) -> bool:
        """Remove the agent from heartbeats."""
        if not self._agent_id:
            return False

        agent_id = self._agent_id

        def updater(data: Dict) -> Dict:
            agents = data.get("agents", {})
            if agent_id in agents:
                del agents[agent_id]
            data["agents"] = agents
            return data

        result = safe_json_update(self.config_path, updater)
        self._agent_id = None
        return result

    def start_heartbeat_thread(self, interval_seconds: int = 60, task: str = "") -> None:
        """Start a background thread that updates the heartbeat periodically."""
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            return

        self._stop_event.clear()

        def heartbeat_loop():
            while not self._stop_event.is_set():
                self.update("running", task)
                self._stop_event.wait(interval_seconds)

        self._heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True, name="Heartbeat")
        self._heartbeat_thread.start()

    def stop_heartbeat_thread(self) -> None:
        """Stop the heartbeat background thread."""
        self._stop_event.set()
        if self._heartbeat_thread:
            self._heartbeat_thread.join(timeout=5)
            self._heartbeat_thread = None

    def get_all_agents(self) -> Dict[str, Any]:
        """Get all registered agents."""
        config = self._read_config()
        return config.get("agents", {})

    def get_stale_agents(self, threshold_seconds: int = 300) -> Dict[str, Any]:
        """Get agents that haven't updated their heartbeat recently."""
        agents = self.get_all_agents()
        now = datetime.now(timezone.utc)
        stale = {}

        for agent_id, info in agents.items():
            try:
                last_seen = datetime.fromisoformat(info["last_seen"].replace("Z", "+00:00"))
                if (now - last_seen).total_seconds() > threshold_seconds:
                    stale[agent_id] = info
            except Exception:
                stale[agent_id] = info

        return stale


class TaskCoordinator:
    """
    Task coordinator for preventing duplicate work.

    Tracks which tasks are being worked on and by whom.
    """

    def __init__(self, project_dir: Optional[Path] = None):
        self.project_dir = project_dir or get_project_dir()
        self.config_path = self.project_dir / ".claude" / "shared-context" / "active-tasks.json"

    def _read_config(self) -> Dict[str, Any]:
        """Read the task configuration."""
        if not self.config_path.exists():
            return {"tasks": {}, "completed_tasks": []}
        try:
            return json.loads(self.config_path.read_text())
        except Exception:
            return {"tasks": {}, "completed_tasks": []}

    @staticmethod
    def task_hash(description: str) -> str:
        """Generate a hash for task deduplication."""
        return hashlib.md5(description.encode()).hexdigest()

    def is_task_available(self, task_id: str) -> bool:
        """Check if a task is available (not being worked on)."""
        config = self._read_config()
        tasks = config.get("tasks", {})
        return task_id not in tasks

    def claim_task(self, task_id: str, description: str, agent_id: str) -> bool:
        """
        Claim a task for execution.

        Args:
            task_id: Unique task identifier
            description: Task description
            agent_id: ID of the agent claiming the task

        Returns:
            True if task was claimed, False if already taken
        """
        now = utc_now()
        claimed = False

        def updater(data: Dict) -> Dict:
            nonlocal claimed
            tasks = data.get("tasks", {})

            # Check if already claimed
            if task_id in tasks:
                return data

            # Claim the task
            tasks[task_id] = {
                "agent": agent_id,
                "started_at": now,
                "description": description,
            }
            data["tasks"] = tasks
            claimed = True
            return data

        safe_json_update(self.config_path, updater)
        return claimed

    def release_task(self, task_id: str, status: str = "completed") -> bool:
        """
        Release a task after completion or failure.

        Args:
            task_id: Task identifier
            status: Final status (completed, failed)

        Returns:
            True if successful
        """
        now = utc_now()

        def updater(data: Dict) -> Dict:
            tasks = data.get("tasks", {})
            completed = data.get("completed_tasks", [])
            max_history = data.get("max_completed_history", 50)

            # Remove from active tasks
            if task_id in tasks:
                del tasks[task_id]

            # Add to completed history
            completed.insert(0, {
                "task_id": task_id,
                "completed_at": now,
                "status": status,
            })

            # Trim history
            data["tasks"] = tasks
            data["completed_tasks"] = completed[:max_history]
            return data

        return safe_json_update(self.config_path, updater)

    def get_active_tasks(self) -> Dict[str, Any]:
        """Get all active tasks."""
        config = self._read_config()
        return config.get("tasks", {})

    def was_recently_completed(self, task_id: str, lookback: int = 50) -> bool:
        """Check if a task was recently completed (for deduplication)."""
        config = self._read_config()
        completed = config.get("completed_tasks", [])[:lookback]
        return any(t.get("task_id") == task_id for t in completed)


class SleeplessAgentIntegration:
    """
    High-level integration class for sleepless-agent daemon.

    Combines circuit breaker, heartbeat, and task coordination.
    """

    def __init__(self, agent_id: Optional[str] = None, project_dir: Optional[Path] = None):
        self.project_dir = project_dir or get_project_dir()
        self.agent_id = agent_id or f"{socket.gethostname()}-{os.getpid()}-{int(time.time())}"

        self.circuit_breaker = CircuitBreaker(self.project_dir)
        self.heartbeat = AgentHeartbeat(self.project_dir)
        self.task_coordinator = TaskCoordinator(self.project_dir)

    def pre_task_check(self, task_description: str) -> tuple[bool, str]:
        """
        Check if a task can be executed.

        Returns:
            Tuple of (can_execute, reason)
        """
        # Check circuit breaker
        if self.circuit_breaker.is_open():
            status = self.circuit_breaker.get_status()
            reason = status.get("circuit_opened_reason", "Circuit breaker is open")
            return False, f"CIRCUIT_BREAKER_OPEN: {reason}"

        # Check task availability
        task_id = TaskCoordinator.task_hash(task_description)
        if not self.task_coordinator.is_task_available(task_id):
            active = self.task_coordinator.get_active_tasks()
            task_info = active.get(task_id, {})
            agent = task_info.get("agent", "unknown")
            return False, f"TASK_IN_PROGRESS: Already being worked on by {agent}"

        # Check if recently completed (deduplication)
        if self.task_coordinator.was_recently_completed(task_id):
            return False, "TASK_RECENTLY_COMPLETED: Task was completed recently"

        return True, "OK"

    def start_task(self, task_description: str) -> Optional[str]:
        """
        Start a task: register heartbeat, claim task.

        Returns:
            Task ID if started, None if blocked
        """
        can_execute, reason = self.pre_task_check(task_description)
        if not can_execute:
            print(f"[SleeplessAgentIntegration] Task blocked: {reason}")
            return None

        task_id = TaskCoordinator.task_hash(task_description)

        # Register heartbeat
        self.heartbeat.register(self.agent_id, task_description)
        self.heartbeat.start_heartbeat_thread(interval_seconds=60, task=task_description)

        # Claim task
        if not self.task_coordinator.claim_task(task_id, task_description, self.agent_id):
            self.heartbeat.stop_heartbeat_thread()
            self.heartbeat.remove()
            return None

        return task_id

    def end_task(self, task_id: str, success: bool, failure_type: Optional[str] = None, failure_details: str = "") -> None:
        """
        End a task: release task, update heartbeat, record failure if needed.
        """
        status = "completed" if success else "failed"

        # Release task
        self.task_coordinator.release_task(task_id, status)

        # Stop heartbeat thread
        self.heartbeat.stop_heartbeat_thread()

        # Update final status
        self.heartbeat.update(status)

        # Record failure if applicable
        if not success and failure_type:
            self.circuit_breaker.record_failure(failure_type, failure_details, self.agent_id)

        # Remove heartbeat
        self.heartbeat.remove()

    def categorize_failure(self, error_message: str, exit_code: int = 1) -> Optional[str]:
        """
        Categorize a failure based on error message.

        Returns:
            Failure type or None if not categorizable
        """
        error_lower = error_message.lower()

        if any(kw in error_lower for kw in ["build failed", "npm err", "vite", "webpack", "compile"]):
            return "build_failed"
        elif any(kw in error_lower for kw in ["commit", "git commit", "pre-commit"]):
            return "commit_failed"
        elif any(kw in error_lower for kw in ["deploy", "firebase deploy", "hosting"]):
            return "deployment_failed"
        elif any(kw in error_lower for kw in ["auth", "credential", "permission", "token", "login"]):
            return "auth_failed"
        elif exit_code != 0:
            return "task_failed"

        return None


# CLI interface for testing
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python circuit_breaker.py <command> [args]")
        print("")
        print("Commands:")
        print("  status          - Show circuit breaker status")
        print("  reset           - Reset the circuit breaker")
        print("  fail <type>     - Record a failure")
        print("  agents          - List all agents")
        print("  tasks           - List active tasks")
        sys.exit(1)

    cmd = sys.argv[1]

    try:
        if cmd == "status":
            cb = CircuitBreaker()
            status = cb.get_status()
            print(json.dumps(status, indent=2))

        elif cmd == "reset":
            cb = CircuitBreaker()
            if cb.reset():
                print("Circuit breaker reset successfully")
            else:
                print("Failed to reset circuit breaker")

        elif cmd == "fail":
            if len(sys.argv) < 3:
                print("Usage: python circuit_breaker.py fail <type>")
                sys.exit(1)
            cb = CircuitBreaker()
            failure_type = sys.argv[2]
            tripped = cb.record_failure(failure_type, "Manual test failure", "cli-test")
            print(f"Recorded {failure_type} failure. Circuit tripped: {tripped}")

        elif cmd == "agents":
            hb = AgentHeartbeat()
            agents = hb.get_all_agents()
            print(json.dumps(agents, indent=2))

        elif cmd == "tasks":
            tc = TaskCoordinator()
            tasks = tc.get_active_tasks()
            print(json.dumps(tasks, indent=2))

        else:
            print(f"Unknown command: {cmd}")
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
