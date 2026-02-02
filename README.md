# Glaser Serviceauftrag

# Build & run

1. Clone the repository & cd inside
`git clone https://github.com/fjzen/m295finalproject.git`

2. Install with npm & run
`npm install & npm run dev`

# Database
The database is hosted on supabase.com

# Setup

### Clone the repository

```bash
git clone https://github.com/fjzen/m295finalproject.git & cd m295finalproject/
```

### Backend

cd into `api`, fill in supabase credentials before running php

Bash/Powershell instructions
```bash
cd api
cp .env.example .env # fill in Supabase credentials
```

Windows terminal instructions
```bat
cd api
copy .env.example .env
```

run php in project root `m295finalproject`
```bash
# cd back to project root if you're still in api/ with cd ..
php -S localhost:8000
```

### Frontend

npm install & npm run dev inside `frontend/`
```bash
cd frontend 
npm install & npm run dev
```
