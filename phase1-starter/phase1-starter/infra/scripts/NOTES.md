# Phase 2 Issues 

### 1. Podman Aardvark-DNS & Network Namespace Deadlocks (WSL2 Environment)
* **The Problem:** Executing `run-all.sh` produced `[ERROR netavark::dns::aardvark] aardvark-dns runs in a different netns` and inter-container host resolution failed with `Name or service not known`. Subsequent cleanups threw `IO error: No such file or directory` on stale network directory locks.
* **Root Cause:** When running Podman in rootless WSL2, `aardvark-dns` processes from previous runs lingered in memory across separate network namespaces (`netns`), causing socket deadlocks and locking `/run/user/1000/containers/networks/aardvark-dns`.
* **The Solution:** Added automated pre-execution cleanup hooks at the start of `run-all.sh` to forcefully kill lingering DNS background processes (`killall -9 aardvark-dns netavark rootlessport`) and safely re-create the network state directory (`mkdir -p`) before initializing `eventhub-net`.

---

### 2. Ephemeral Job Network Isolation & Redis Endpoint Mismatches
* **The Problem:** The background `analytics-job` container failed on execution with `redis.exceptions.ConnectionError: Error 111 connecting to localhost:6379`.
* **Root Cause:** The analytics job code defaulted to connecting to `localhost:6379`. Since the job runs as an isolated container on `eventhub-net`, `localhost` pointed to its own container loopback interface rather than the `redis` database container.
* **The Solution:** Standardized container-to-container network targeting by explicitly passing container network endpoints via environment variables (`-e REDIS_HOST=redis` and `-e REDIS_URL=redis://redis:6379`) directly in the `podman run` execution block.

---

### 3. Database Connection Mismatches & Service Environment Configuration
* **The Problem:** `booking-service` returned `500 Internal Server Error` on API requests (`/api/bookings`), preventing downstream services from reading booking datasets.
* **Root Cause:** A configuration mismatch between the database initialized in PostgreSQL (`POSTGRES_DB=eventhub`) and the environment variable provided to `booking-service` (`PGDATABASE=booking_db`).
* **The Solution:** Standardized environment variables across the execution script by injecting `-e PGDATABASE=eventhub` across both long-running services and batch job runner flags.

---

### 4. Non-Blocking Health Polling vs. Static Sleep Delays
* **The Problem:** Initial execution used fixed `sleep` intervals, leading to race conditions where `booking-service` attempted to query PostgreSQL/MongoDB before their internal socket listeners were accepting connections.
* **Root Cause:** Fixed sleep durations do not account for variable container cold-start delays across different host environments.
* **The Solution:** Replaced static waits with explicit dependency health polling (`pg_isready -U postgres` and port checks via `nc -z`), and attached continuous container health checks (`--health-cmd`, `--health-interval=10s`) to all long-running service definitions.

---

### 5. Rootless Cgroup & Container Namespace Cleanup
* **The Problem:** Re-executing orchestration scripts caused container name collisions (`container name "X" is already in use`), accompanied by `cgroupv2` manager systemd warnings.
* **Root Cause:** Uncleaned container instances occupying host engine namespaces in WSL user sessions without full systemd session privileges.
* **The Solution:** Standardized runtime flags across all service commands: added `--replace` to all `podman run` commands for idempotent script executions, and passed `--cgroup-manager=cgroupfs` and `--isolation=chroot` for stable rootless resource isolation.