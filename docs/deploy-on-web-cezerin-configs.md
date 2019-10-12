## 8. Cezerin configs changes:

You must edit cezerin configs and setup new domain name at configs.

/cezerin2/config/server.js

Change:
```
http://localhost:3000 to https://your-domain-name.com
http://localhost:3001 to https://your-domain-name.com
http://localhost:3002 to https://admin.your-domain-name.com
```
/cezerin2-store/config/store.js

Change:
```
http://localhost:3001 to https://your-domain-name.com
```

/cezerin2-admin/config/admin.js

Change:
```
http://localhost:3001 to https://your-domain-name.com
```

Change:
```
ws://localhost:3001 to wss://your-domain-name.com
```

Rebuild & restart apps with new configs:

cezerin (backend app does not need to be build, just reload):
```
pm2 reload api
```
cezerin2-store:
```
npm run build
pm2 reload store
```
cezerin2-admin:
```
npm run build
pm2 reload admin
```

P.S. Example of configs for cezerin.org domain you download [cezerin2-config-sample.zip](https://github.com/Cezerin2/cezerin2/files/3710880/cezerin2-config-sample.zip) 