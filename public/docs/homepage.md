# 🚀 Velicor Ingestion & Telemetry Guide

Velicor is a next-generation log ingestion proxy designed for cloud-native microservices. It aggregates stdout streams, standard error logs, and metadata parameters, delivering low-latency querying and proactive webhook alerting.

---

## ⚡ Core Features

- **High-Speed Ingestion**: Process tens of thousands of logs per second using non-blocking connection pools.
- **Dynamic Isolation**: Namespace isolation maps every service to its own logical partition for zero cross-talk.
- **Proactive Alerts**: Define filter metrics (e.g., `level == FATAL`) to ping Slack, Discord, or custom microservices.
- **Serverless Optimizations**: Ingestion endpoints detect serverless context to prevent background thread freezing.

---

## 🛠️ Step-by-Step Integration

Integrating your application with Velicor requires just three steps:

### 1. Create a Service Profile
Log into the **Velicor Dashboard** and create a new service registration. This allocates an isolated namespace partition in the telemetry engine and generates a cryptographically secure **API Key**.

### 2. Configure SDK or API Client
Add the Velicor endpoint and key to your application configuration. You can ingest logs directly via HTTP POST requests.

### 3. Stream Logs
Invoke the ingest API on every log event. Below are standard integrations for popular runtimes.

---

## 📡 SDK Integrations

### cURL (Direct API)
Use this snippet to quickly test ingestion from your shell or terminal:

```bash
curl -X POST https://velicor.yourdomain.com/api/v1/ingest \
  -H "x-api-key: YOUR_SERVICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "INFO",
    "message": "User login completed successfully",
    "metadata": {
      "user_id": "usr_99812",
      "ip_address": "192.168.1.50"
    }
  }'
```

### Node.js (Serverless Friendly)
On serverless runtimes like Vercel or AWS Lambda, you **must await** the ingestion response to ensure it executes before the environment freezes.

```javascript
const axios = require('axios');

const logToVelicor = async (level, message, metadata = {}) => {
  try {
    await axios.post('https://velicor.yourdomain.com/api/v1/ingest', {
      level,
      message,
      timestamp: new Date().toISOString(),
      service_name: 'payment-processor',
      metadata
    }, {
      headers: { 'x-api-key': 'YOUR_SERVICE_API_KEY' },
      timeout: 2000
    });
  } catch (err) {
    console.error('Velicor log ingestion failed:', err.message);
  }
};

// Example usage:
await logToVelicor('WARNING', 'Database connection retry attempt 2', {
  pool_size: 15,
  elapsed_ms: 450
});
```

### Python (High Performance)
A lightweight synchronous utility wrapper for Python web apps and scripts.

```python
import requests
import time

def log_to_velicor(level, message, metadata=None):
    payload = {
        "level": level,
        "message": message,
        "timestamp": time.time(),
        "service_name": "payment-processor",
        "metadata": metadata or {}
    }
    headers = {"x-api-key": "YOUR_SERVICE_API_KEY"}
    try:
        requests.post("https://velicor.yourdomain.com/api/v1/ingest", 
                      json=payload, 
                      headers=headers, 
                      timeout=2.0)
    except Exception as e:
        print(f"Failed to transmit log to Velicor: {e}")

# Example usage:
log_to_velicor("ERROR", "Token validation failed", {"user_id": "3192"})
```

---

## 🔒 Security & Data Compliance

Velicor enforces industry-standard transport security and strict tenant isolation:
* **Token Verification**: Ingestion API keys are salted and hashed, checked against a fast-lookup secure credentials cache.
* **Metadata Sanitization**: Velicor automatically strips ANSI escape sequences and colors to ensure clean indexing.
* **Row-Level Partitioning**: Queries to the analytics engine restrict bounds to your service schema.

---

## 🔄 Self-Monitoring & Telemetry Loops

For advanced microservice environments, you can configure Velicor to self-ingest its own system logs (often referred to as **dogfooding**). By creating a dedicated `velicor-backend` service, you can route internal system operations directly into the logging dashboard.

> [!WARNING]
> **The Telemetry Death Loop**
> Writing code that logs database updates inside the telemetry engine itself can trigger an infinite recursion loop:
> 1. A log is ingested.
> 2. The write operation logs a confirmation message.
> 3. The confirmation message is ingested as a new log.
> 4. The new write logs a confirmation message, repeating indefinitely.
> 
> To prevent this, always define **exclusion filters** in your backend logging handler. Ignore loggers originating from:
> * `app.services.worker` (async ingestion queue workers)
> * `app.db.database` & `app.db.cache` (internal database drivers & caches)

---

> [!TIP]
> **Developer Experience Tips**
> * Use the **Searchable Service Dropdown** in the log viewer page to jump directly between backend nodes without losing your filters.
> * For high-volume microservices, batch logs in-memory and perform periodic bulk flushes every 2 seconds to optimize DB throughput.
