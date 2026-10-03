# AURA Hosting Migration Guide: Railway to Aiven & Render

This guide outlines the step-by-step procedure to migrate the AURA jewellery e-commerce application from Railway to **Aiven** (MySQL database) and **Render** (Node.js/Express backend).

---

## Part 1: Provision & Populate Database (Aiven MySQL)

1. Create a free MySQL service on **Aiven** (e.g. `mysql-aura`).
2. Once the service is running, find your connection details on the Aiven Overview dashboard:
   - **Service URI**: `mysql://avnadmin:YOUR_PASSWORD@mysql-xxxx.aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED`
   - Or separate fields: **Host**, **Port**, **User**, **Password**, and **Database Name** (typically `defaultdb`).

### Running `schema.sql` Against Aiven MySQL

Open a terminal and run the following command to import the single source of truth schema:

```bash
# Option A: Using individual connection parameters
mysql -h <AIVEN_HOST> -P <AIVEN_PORT> -u <AIVEN_USER> -p <AIVEN_DB_NAME> --ssl-mode=REQUIRED < backend/schema.sql

# Example with typical Aiven defaults:
# mysql -h mysql-xxxx.aivencloud.com -P 15432 -u avnadmin -p defaultdb --ssl-mode=REQUIRED < backend/schema.sql

# Option B: Using the full Aiven Service URI
mysql "<AIVEN_SERVICE_URI>" < backend/schema.sql
```

> **Note on Database Name:**
> Aiven automatically creates a database called `defaultdb`. `backend/schema.sql` includes `CREATE DATABASE IF NOT EXISTS jewellery_db; USE jewellery_db;` for local development. When running against Aiven, if you want your tables to live inside `defaultdb`, you can comment out those two lines at the top of `schema.sql` before running the command.

---

## Part 2: Deploy Backend Web Service (Render)

1. Log in to [Render](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository containing the AURA codebase.
3. Configure the service settings:
   - **Name**: `aura-backend` (or your preferred name)
   - **Root Directory**: `backend` (if repo root has `frontend` and `backend` folders)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`

### Environment Variables Checklist for Render Dashboard

Add the following environment variables under the **Environment** tab on Render:

| Variable Name | Required? | Example / Recommended Value | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** (Recommended) | `mysql://avnadmin:password@mysql-xxxx.aivencloud.com:15432/defaultdb?ssl-mode=REQUIRED` | Full Aiven connection string. Automatically handles host, port, user, password, and SSL. |
| `DB_HOST` | Only if not using `DATABASE_URL` | `mysql-xxxx.aivencloud.com` | Aiven host address |
| `DB_PORT` | Only if not using `DATABASE_URL` | `15432` | Aiven port |
| `DB_USER` | Only if not using `DATABASE_URL` | `avnadmin` | Aiven database username |
| `DB_PASSWORD` | Only if not using `DATABASE_URL` | `<your-aiven-password>` | Aiven database password |
| `DB_NAME` | Only if not using `DATABASE_URL` | `defaultdb` | Aiven database name |
| `NODE_ENV` | **Yes** | `production` | Enables secure session cookies (`secure: true`, `sameSite: 'none'`) |
| `PORT` | Auto-provided | `10000` | Render injects this automatically; default fallback is `5000` |
| `SESSION_SECRET` | **Yes** | `a-long-random-secret-string-here-32chars` | Secret key used to encrypt customer & admin session cookies |
| `FRONTEND_URL` | **Yes** | `https://anshita-18h.github.io` | Your live GitHub Pages storefront URL (whitelisted in CORS) |
| `ADMIN_INITIAL_EMAIL` | Optional | `admin@aura.com` | Master admin email (seeded automatically via `schema.sql`) |
| `ADMIN_INITIAL_PASSWORD` | Optional | `Admin@Aura2026!` | Initial master admin password (pre-seeded via `schema.sql`) |

---

## Part 3: Connect Frontend & Deploy (GitHub Pages)

Once your Render service is live (e.g. `https://aura-backend.onrender.com`):

1. Open `frontend/.env` in your project.
2. Update `VITE_API_URL` to point to the new Render backend endpoint:
   ```env
   VITE_API_URL=https://<YOUR_RENDER_SERVICE_NAME>.onrender.com/api
   ```
3. Rebuild and publish the updated frontend to GitHub Pages:
   ```bash
   cd frontend
   npm run deploy
   ```
   *(This runs `vite build` followed by `gh-pages -d dist` to push the fresh build to your `gh-pages` branch).*

---

## Part 4: Post-Migration Verification

1. **Verify Backend Health**:
   Visit `https://<YOUR_RENDER_SERVICE_NAME>.onrender.com/api/health` in your browser.
   It should return:
   ```json
   { "status": "ok", "message": "Jewellery e-commerce API is running" }
   ```
2. **Verify Database Connection**:
   Visit `https://<YOUR_RENDER_SERVICE_NAME>.onrender.com/api/products`.
   It should return the list of seeded products from your Aiven MySQL database.
3. **Verify Storefront**:
   Open `https://anshita-18h.github.io/jewellery-ecommerce/` and test browsing products, filtering by price/gender/occasion, and adding an item to the cart.
4. **Verify Admin Portal**:
   Log in at `#/admin/login` using:
   - **Email**: `admin@aura.com`
   - **Password**: `Admin@Aura2026!`

---

## Part 5: Promoting a User to Administrator

To grant administrator privileges and/or update the password for any existing or new user:

### Step 1: Generate a Bcrypt Password Hash
AURA uses `bcryptjs` with **10 salt rounds** (configured in `backend/routes/auth.js`). Run this one-liner in your terminal from the `backend/` directory:

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_NEW_PASSWORD', 10))"
```

*Example output:*
`$2b$10$z/gBje11PxAL10HIH3cisOyDQX2hFIhSxgQ3mHYACxTaRCU6zdPw.`

### Step 2: Execute the SQL Update
Connect to your database (locally or via Aiven MySQL console/CLI) and run:

```sql
UPDATE users 
SET role = 'admin', password_hash = '<GENERATED_BCRYPT_HASH>' 
WHERE email = 'user@example.com';
```

*(If you only need to change the role without altering their password, simply run: `UPDATE users SET role = 'admin' WHERE email = 'user@example.com';`)*

### Step 3: Verify the Update

```sql
SELECT id, name, email, role FROM users WHERE email = 'user@example.com';
```

The user will now be able to authenticate at the Admin Management portal (`#/admin/login`).
