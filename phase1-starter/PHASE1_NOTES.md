PHASE1_NOTES

Issue 1: Missing Environment Variable Support (dotenv)

Description: The auth-service-node failed to load configuration variables from the .env file because dotenv was neither declared in package.json nor required in src/index.js. This caused database connection failure with client password must be a string.

Fix:
Installed dotenv package via npm install dotenv.
Added require('dotenv').config(); at the top of src/index.js.
Ensured correct PostgreSQL credentials in .env (PGUSER=postgres and valid PGPASSWORD).
__________________________________________________________________________________________________________________________________

Issue 2: Python Version Compatibility Issue in booking-service-python

Description: The application failed to start on Python 3.8 due to using PEP 604 union type syntax (since: str | None = None) in app/main.py.

Fix: Replaced union type hint syntax str | None with Optional[str] using from typing import Optional.
__________________________________________________________________________________________________________________________________

Issue 3: Missing Go Module Entry & RabbitMQ Broker Dependency in notification-worker-go

Description: First, the service failed with 'missing go.sum entry for module github.com/rabbitmq/amqp091-go'. Second, after resolving dependencies, it failed to connect to RabbitMQ on port 5672.
Fix: 
- Executed 'go mod tidy' to download missing Go modules.
- For Phase 1, RabbitMQ dependency is documented to be fully resolved in Phase 2 via Docker Compose.__________________________________________________________________________________________________________________________________

Issue 4: Python 3.8 Compatibility Issue in ai-insight-service-python

Description: Service failed to start on Python 3.8 with TypeError: unsupported operand type(s) for |: 'type' and 'NoneType' in app/ollama_client.py line 6 due to using dict | None syntax.

Fix: Replaced return type annotation dict | None with Optional[dict] from typing.
__________________________________________________________________________________________________________________________________

Issue 5: Python 3.8 Compatibility & Missing Redis Dependency in analytics-service-python

Description: 
1. Service failed to start on Python 3.8 with TypeError in app/redis_client.py line 16 due to 'dict | None' syntax.
2. The service requires a running Redis instance on port 6379 to execute job snapshot creation.

Fix: 
- Replaced 'dict | None' with 'Optional[dict]' from typing.
- Redis dependency documented for resolution in Phase 2 containerized setup.
__________________________________________________________________________________________________________________________________

Issue 6: Login Crashes with Status 500 (Internal Server Error)

Description: Attempting to log in resulted in an Internal Server Error (500) instead of authenticating the user.

Cause: A typo existed in routes/auth.js, where the environment variable was written as JWT_SECERT instead of JWT_SECRET.

Fix: Corrected the variable name to JWT_SECRET so the server could properly read the secret key and generate the JWT token.
__________________________________________________________________________________________________________________________________

Issue 7:Failed to Fetch Profile After Login

Description: After a successful login, the application displayed a "Failed to fetch profile" error instead of showing the user profile.

Root Cause: Upon login, the frontend sends a request to the /api/auth/me route to fetch the user's profile using the JWT token, but this endpoint was missing in the backend.

Fix: Implemented the GET /api/auth/me endpoint in the backend to verify the token and return the user's profile data to the frontend.

