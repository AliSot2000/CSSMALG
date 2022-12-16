# Setup Mongo DB on Ubuntu 20.04

Import the public key used by the package management system.

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
```

The operation should respond with an `OK`.

```bash
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
```

Reload local package database.

```bash
sudo apt-get update
```

Install the MongoDB packages.

```bash
sudo apt-get install -y mongodb-org
```

Change the storage directory of the database. Line: `dbPath: /var/lib/mongodb`

```bash
sudo nano /etc/mongod.conf
```

Start the MongoDB service.

```bash
sudo systemctl start mongod
```

Verify that MongoDB has started successfully.

```bash
sudo systemctl status mongod
```

Run the MongoDB shell.

```bash
mongosh
```

Create an admin user and python user.

```bash
use admin

db.createUser(
  {
    user: "Admin",
    pwd: "MyFavoritePassword",
    roles: [
       { role: "clusterAdmin", db: "admin" },
       { role: "readWriteAnyDatabase", db: "admin" },
       { role: "userAdminAnyDatabase", db: "admin" }
    ]
  }
)
  
db.createUser(
  {
    user: "py",
    pwd: "12345678",
    roles: [
       { role: "readWriteAnyDatabase", db: "admin" }
    ]
  }
)
```

Exit the MongoDB shell.

```bash
exit
```

Force Authorization. Add following lines to `/etc/mongod.conf`

```bash
security: 
  authorization: enabled
```

Restart the MongoDB service.

```bash
sudo systemctl restart mongod
```

Note that you now need to authenticate to access the database.

```bash
mongosh -u Admin
```

![Congratulations](../../other/congratulations.jpeg)
