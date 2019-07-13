
## info

lokalise.io is used for localization. You need localise.io project to work on emails or replace localization process.

## start
Set LOKALISE_PROJECT_ID in gulpfile.js

```
$ gulp download-translations --key=<lokalise_token>
$ gulp
```

## other
To start watcher for email templates builded from mjml (not very effective as they contain only string keys, but could help to identify issues with mjml building):

```
$ gulp --mjml
```


Localization:

```
$ gulp download-translations --key=<lokalise_token>
```


Prod build:
```
$ gulp prod --key=<lokalise_token>
```