# Scalability Strategy

## Handling the Viral Spike

Trailer websites are highly susceptible to massive, unpredictable traffic spikes (e.g., immediately after a Super Bowl commercial). The infrastructure must absorb this without buckling.

### The "Scale to Zero, Scale to Infinity" Model
- **Compute:** By utilizing Serverless functions, the compute layer automatically scales horizontally. If 10,000 requests hit simultaneously, the provider spins up 10,000 micro-containers.
- **Bottleneck:** The bottleneck is *always* the database connection pool.

### Database Scaling Strategies
1. **Connection Pooling:** Use a serverless-aware connection pooler (e.g., PgBouncer, Prisma Accelerate) to multiplex thousands of incoming serverless connections into a manageable number of persistent database connections.
2. **Read-Heavy Optimization:** 99% of traffic to a movie site is reads. Offload reads from the database to the CDN edge cache. If the database is under load, the CDN should continue serving stale cache rather than failing (Stale-While-Revalidate).
3. **Read Replicas:** If database CPU maxes out on reads, spin up read-only replicas of the database and direct `GET` requests there, reserving the primary database purely for `POST/PUT/DELETE` admin operations.

### Static Asset Scaling
- Media files are inherently scalable because they are served by the global CDN, bypassing the application servers entirely. Ensure the CDN plan has sufficient bandwidth caps to handle sudden spikes in video traffic.

### Growth Bottleneck Detection
- Establish alerts for "Connection Pool Saturation." If the pool hits 80% capacity, the engineering team must be alerted to manually intervene or adjust caching strategies before it hits 100% and drops requests.
