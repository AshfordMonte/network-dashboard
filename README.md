# Customer Network Status Dashboard

This is a small internal web dashboard that displays equipment status
totals from Sonar using their GraphQL API.

The backend handles all API calls so browser clients never talk to Sonar
directly.

------------------------------------------------------------------------

## What this shows

Right now, the dashboard displays:

**Customer equipment** - Good - Warning - Down - Uninventoried
(customer-owned)

**Infrastructure equipment** - Placeholder (N/A for now)

It refreshes automatically and shows connection status and last update
time.

------------------------------------------------------------------------

## Tech stack

-   Node.js
-   Express
-   Vanilla HTML / CSS / JS
-   Sonar GraphQL API

------------------------------------------------------------------------

## Project layout

    network-dashboard/
    ├─ server.js
    ├─ sonarClient.js
    ├─ package.json
    ├─ .env
    ├─ public/
    │  ├─ index.html
    │  ├─ styles.css
    │  └─ app.js

------------------------------------------------------------------------

## Local setup

### 1. Install Node.js

Node 18+ is required.

Check your version:

    node -v

Download if needed:\
https://nodejs.org

------------------------------------------------------------------------

### 2. Install dependencies

From the project folder:

    npm install

------------------------------------------------------------------------

### 3. Create a `.env` file

Create a file named `.env` in the project root:

    PORT=XXXX

    SONAR_ENDPOINT=https://example.sonar.software/api/graphql
    SONAR_TOKEN=your_api_token_here

    SONAR_COMPANY_ID=XX
    SONAR_ACCOUNT_STATUS_ID=XX

Fill in the Port, Company ID, and Account Status (to see active customers only) 
based on data in your Sonar instance.

------------------------------------------------------------------------

### 4. Start the server

    npm start

You should see something like:

    Dashboard server started.
    Local: http://localhost:{PORT}
    LAN access:
      → http://XXX.XXX.X.XXX:{PORT}

------------------------------------------------------------------------

### 5. Open the dashboard

From the same machine:

    http://localhost:8{PORT}

From another device on the same network:

    http://<server-ip>:{PORT}

------------------------------------------------------------------------

## How API traffic works

Each browser loads the dashboard and requests:

    GET /api/status-summary

The server: - Calls Sonar - Caches the result - Returns the same data to
all clients

This means: - Multiple users do not spam Sonar and the API token is never
exposed

------------------------------------------------------------------------

## Running this on Proxmox (VM or container)

This works well on a small Linux VM. I'm using Proxmox as an example for
the hypervisor.

------------------------------------------------------------------------

### Basic Proxmox setup

1.  Create a VM
2.  Install Ubuntu Server
3.  SSH into the VM
4.  Install Node.js

```{=html}
<!-- -->
```
    sudo apt update
    sudo apt install -y curl
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs

5.  Clone the repo

```{=html}
<!-- -->
```
    git clone https://github.com/your-org/network-dashboard.git
    cd network-dashboard

6.  Install dependencies

```{=html}
<!-- -->
```
    npm install

7.  Create `.env` and edit the required values

```{=html}
<!-- -->
```
    nano .env

8.  Start the server

```{=html}
<!-- -->
```
    npm start

------------------------------------------------------------------------

## Making it persistent

For now this just runs in the shell session. Will need to make it a
service that auto starts.

------------------------------------------------------------------------

## Security notes

This is currently intended for INTERNAL USE ONLY.

There is: - No authentication - No HTTPS - No access control

------------------------------------------------------------------------