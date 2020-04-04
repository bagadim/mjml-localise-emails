
## info

Simple way to create emails with mjml template language that you can customize and predefined scripts for localizing those emails using lokalise.io service.

You need lokalise.io project to run it. If you do not use lokalise.io in your project, you will need to replace localization process.

## to start
Set LOKALISE_PROJECT_ID in gulpfile.js

```
$ gulp download-translations --key=<lokalise_token>
$ gulp
```


## prod build
```
$ gulp prod --key=<lokalise_token>
```

Output
<img width="499" alt="output_example" src="https://user-images.githubusercontent.com/10193153/61174605-44933700-a5ab-11e9-9d77-1f5e40cd0800.png">

## other
To start watcher only for mjml transpiling (not very effective as after transpiling templates contain only string keys, but could help to identify issues with mjml traspiling):

```
$ gulp --mjml
```

Localization:
```
$ gulp download-translations --key=<lokalise_token>
```
