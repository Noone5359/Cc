# Firebase Blaze Plan Cost Estimation
## College Central - 5,000 Students

### Assumptions
- **Daily Active Users (DAU)**: ~2,000 students/day (40%)
- **Monthly Active Users (MAU)**: ~4,000 students/month (80%)
- **Sessions**: 40 sessions/user/month
- **Page Views**: ~960,000 views/month (assuming efficient caching)

---

## 1. Firebase Authentication
| Metric | Estimate | Free Tier (Blaze) | Billable | Cost |
|--------|----------|-------------------|----------|------|
| **MAU** | 4,000 | 50,000 MAU | 0 | **$0.00** |
| **Total** | | | | **$0.00** |

*Note: Email/Password and Google Sign-in are free up to 50k MAU.*

---

## 2. Cloud Firestore (Database)
*Location: Multi-region (higher availability) or Regional (lower cost).*
*Below uses standard rates ($0.18/GB storage, $0.06/100k reads).*

| Metric | Estimate | Free Tier (Blaze) | Billable | Monthly Cost |
|--------|----------|-------------------|----------|--------------|
| **Storage** | 5 GB | 1 GB | 4 GB | 4 × $0.18 = **$0.72** |
| **Reads** | 2M / month | 50k/day (~1.5M/mo) | 500,000 | 5 × $0.06 = **$0.30** |
| **Writes** | 300k / month | 20k/day (~600k/mo) | 0 | **$0.00** |
| **Deletes** | 50k / month | 20k/day | 0 | **$0.00** |
| **Total** | | | | **~$1.02/month** |

---

## 3. Cloud Storage (Files)
*Profile pictures, assignment uploads, resources.*

| Metric | Estimate | Free Tier (Blaze) | Billable | Monthly Cost |
|--------|----------|-------------------|----------|--------------|
| **Storage** | 10 GB | 5 GB | 5 GB | 5 × $0.026 = **$0.13** |
| **Downloads** | 50 GB (Bandwidth) | 1 GB/day (~30 GB/mo) | 20 GB | 20 × $0.12 = **$2.40** |
| **Uploads** | 5 GB (Ingress) | Free | 0 | **$0.00** |
| **Operations** | 100k ops | 20k up / 50k down | ~30k | < **$0.01** |
| **Total** | | | | **~$2.54/month** |

---

## 4. Firebase Hosting
*Static asset delivery (JS, CSS, Images).*

| Metric | Estimate | Free Tier (Blaze) | Billable | Monthly Cost |
|--------|----------|-------------------|----------|--------------|
| **Storage** | 1 GB | 10 GB | 0 | **$0.00** |
| **Data Transfer**| 50 GB | 360 MB/day (~10.8 GB/mo)| 39.2 GB | 39.2 × $0.15 = **$5.88** |
| **Total** | | | | **~$5.88/month** |

---

---

## 5. Other Operational Costs
| Service | Purpose | Monthly Cost |
|---------|---------|--------------|
| **SSL Certificate** | Security | **Free** (Included) |
| **Weather API** | Open-Meteo | **Free** (Non-commercial) |
| **Email Service** | SendGrid/Mailgun | **$0 - $15.00** |
| **Monitoring** | Sentry/LogRocket | **$0 - $29.00** |

*Note: Domain name cost removed as requested.*

---

## Monthly Cost Summary

| Category | Typical Monthly Cost |
|----------|----------------------|
| **Firebase Services** | **~$9.44** |
| Auth (Google Sign-in) | **$0.00** |
| Email/Monitoring | + $0 - $30.00 |
| **Grand Total** | **₹800 - ₹3,300 ($10 - $40)** |

---

## Conclusion
For a college of 5,000 students, the **Firebase infrastructure cost alone is extremely low (around $10/month)**. The primary potential cost is **Data Transfer (Bandwidth)** from hosting/downloads.

**Recommendation:**
- Aggressively cache static assets to keep Hosting transfer low.
