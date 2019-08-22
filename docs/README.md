# Documentation

### General
* Getting Started
  - [with GitHub](./using-source-code.md)
  - [with Docker](./using-docker.md)
* Deploy on Web
  - [Hosting](deploy-on-web-hosting.md)
  - [Create droplet](deploy-on-web-droplet.md)
  - [Install NGinx Web Server + MERN Stack](deploy-on-web-mern.md)
  - [Run MongoDB](deploy-on-web-mongodb.md)
  - [Run Cezerin](deploy-on-web-cezerin.md)
  - [Run NGinx](deploy-on-web-nginx.md)
  - [Setup domain with Cloudflare](deploy-on-web-cloudflare.md)
  - [Cezerin configs changes](deploy-on-web-cezerin-configs.md)
  - [Final checks](deploy-on-web-final-checks.md)
  - [Turn off Developer Mode](deploy-on-web-production-mode.md)
* [How to deploy a Cezerin2 on Ubuntu 16.04 (from Docker)](./how-to-deploy-a-cezerin2-on-ubuntu-16-04.md)
* [How to deploy a Cezerin2 on Ubuntu 18.04.1 (from GitHub)](./how-to-deploy-a-cezerin2-on-ubuntu-18-04-1-github.md)
* [Application Structure](./structure.md)
* [Initialize MongoDB](./initialize-mongodb.md)
* [API Reference](./api)
* [API Client](https://github.com/cezerin/client)
* Theme customization
* Localization
* Payment Gateway
* Web Service

### Questions

* How to change language

### Recipes

* How to Integrate Disqus
<!-- * [How to Integrate Disqus](./recipes/how-to-integrate-disqus.md) -->

### NPM Scripts

|`npm run <script>`|Description|
|------------------|-----------|
|`clean:admin`|Delete admin asset bundles.|
|`clean:store`|Delete store asset bundles.|
|`compile:dev`|Compiles the application to disk **and watch** (`~/dist` by default).|
|`compile`|Compiles the application to disk (`~/dist` by default).|
|`webpack:admin:dev`|Assemble admin bundles **and watch**.|
|`webpack:store:dev`|Assemble store bundles **and watch**.|
|`webpack:admin:prod`|Assemble admin bundles.|
|`webpack:store:prod`|Assemble store bundles.|
|`theme:install`|Install theme from /public/<file>.zip|
|`theme:export`|Zip current theme to /public/<file>.zip|
|`theme:copy`|Compile theme and copy assets to /public/|
|`theme:build:dev`|Refresh theme after modification **and watch**.|
|`theme:build:prod`|Refresh theme after modification.|
|`build:dev`|Compile and assemble bundles **and watch**.|
|`build`|Compile and assemble bundles.|
|`start`|Start node server.|
