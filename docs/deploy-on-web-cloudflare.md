## 7. Setup domain with CloudFlare
[Cloudflare.](https://www.cloudflare.com)

 - Get droplet IP on DigitalOcean
![DigitalOcean IP Address](https://github.com/Cezerin2/cezerin2/raw/master/docs/images/do-ip.png)

 - Add `A` and `CNAME` to DNS on CloudFlare
![CloudFlare DNS](https://github.com/Cezerin2/cezerin2/raw/master/docs/images/cf-dns.png)
 - Set SSL to `Flexible` on CloudFlare
![CloudFlare SSL](https://github.com/Cezerin2/cezerin2/raw/master/docs/images/cf-ssl.png)

 - Turn on `Always use HTTPS` on CloudFlare
![CloudFlare Always HTTPS](https://github.com/Cezerin2/cezerin2/raw/master/docs/images/cf-alway-https.png)

 - Add `A` record for admin dashboard:
 
 Type: A
 
 Name: admin
 
 Content: your-droplet-ip-address
 
