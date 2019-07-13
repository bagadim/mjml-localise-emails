const gulp          = require('gulp');
const mjml          = require('gulp-mjml');
const mjmlEngine    = require('mjml');
const browserSync   = require('browser-sync');
const i18n          = require('gulp-html-i18n');
const log           = require('fancy-log');
const rename        = require("gulp-rename");
const LokaliseAPI   = require('lokalise-api');
const reload        = browserSync.reload;
const fs            = require('fs');

const argv = require('minimist')(process.argv.slice(2));
const LOKALISE_API_KEY = argv['key'];
const lokalise = new LokaliseAPI.LokaliseAPI(LOKALISE_API_KEY);

const LOKALISE_PROJECT_ID = '<lokalise.io project id>';

/**
 * mjml -> html -> remove dev comments -> minify |
 * get translations from localise                | -> apply i18n -> emails -> folders grouping (optional)
 */

const basePaths = {
    src: './emails/',
    subjectsSrc: './emails/templates/',
    mjmlOutputDest: './output/1-mjml/',
    translatedStringsDest: './output/2-translations/',
    emailsOutputDest: './output/3-emails/',
    prodReadyEmailsDest: './output/prod/emails/',

};
const paths = {
    mjml: {
        src: basePaths.src + 'templates/*.mjml',
        dest: basePaths.mjmlOutputDest,
        includes: basePaths.src + 'includes/*.mjml'
    },
    i18n: {
        emailsSrc: basePaths.mjmlOutputDest + '*.html', // result of mjml
        emailSubjectsSrc: basePaths.subjectsSrc + '*.html', // email template subjects
        languagesSrc: basePaths.translatedStringsDest, // downloaded from localize
        dest: basePaths.emailsOutputDest // final emails
    },
    lokalise: {
        dest: basePaths.translatedStringsDest
    },
    prodDest: basePaths.prodReadyEmailsDest
};

/** Dev server */
function server(done) {
    let watchDir =  paths.i18n.dest;
    // $gulp --mjml
    // will start watch for lokalised emails
    if (argv.mjml) {
        watchDir = paths.mjml.dest;
    }
    const options = {
      server: {
        baseDir: watchDir,
        directory: true
      },
      port: '8000',
      notify: false
    };
    browserSync.init(options);
    done();
}

function buildMjmlToHtml() {
    return gulp.src(paths.mjml.src)
        .pipe(mjml())
        .pipe(gulp.dest(paths.mjml.dest))
}

// prod only task
function buildMjmlToHtmlAndMinify() {
    return gulp.src(paths.mjml.src)
        // keepComments config mentioned here https://github.com/mjmlio/mjml/issues/1364
        .pipe(mjml(mjmlEngine, {minify: true, keepComments: false}))
        .pipe(gulp.dest(paths.mjml.dest))
}

function generateLocalizedEmails() {
    return gulp.src([
            paths.i18n.emailsSrc,
            paths.i18n.emailSubjectsSrc
        ])
        .pipe(i18n({
            langDir: paths.i18n.languagesSrc
        }))
        .pipe(gulp.dest(paths.i18n.dest));
};

function watch() {
    gulp.watch([paths.mjml.src, paths.i18n.emailSubjectsSrc]).on('change', gulp.series(buildMjmlToHtml, generateLocalizedEmails, reload));
    gulp.watch(paths.mjml.includes).on('change', gulp.series(buildMjmlToHtml, generateLocalizedEmails, reload));
};

// Will be needed only for upload translation automation.
// function uploadTranslationsToLokalise() {
//     return lokalise.projects.import({
//         id: LOKALISE_PROJECT_ID,
//         file: 'translation-keys.json',
//         lang_iso: 'en_GB',
//         replace: 0,
//         convert_placeholders: 0,
//         fill_empty: 1
//         // remove keys from lokalise which has not been provided with list of keys
//         // USE only in release branch
//         // cleanup_mode: 1
//     })
// };

function downloadTranslationsFromLokalise() {
    return lokalise.projects.exportToPath(paths.lokalise.dest, {
        id: LOKALISE_PROJECT_ID,
        type: "json",
        langs: ['en_GB', 'de_CH'],
        placeholder_format: 'raw',
        export_all: 1,
        use_original: 0,
        export_empty: 'base',
        bundle_structure: '%LANG_ISO%/strings.%FORMAT%'
    });
}

/**
 * Task will group localized templates of content and subject in one folder per email type.
 */
function groupEmailTemplatesByFolders() {
    return gulp.src(paths.i18n.dest+'*.html')
        .pipe(rename(function(path) {
            let isContent = path.basename.indexOf('-content') > 0;
            // check that every email has a subject part.
            if (isContent) {
                let filePath = paths.i18n.dest + path.basename + path.extname;
                fs.readFile(filePath.replace('-content','-subject'), (err) => {
                    if (err) {
                        throw Error('There is not SUBJECT template for ' + filePath);
                    }
                })
            }
            let emailNameLastIndex = isContent ? path.basename.indexOf('-content') : path.basename.indexOf('-subject');
            path.dirname = path.basename.substring(0, emailNameLastIndex);
        }))
        .pipe(gulp.dest(paths.prodDest))
}

/**
 * Task will build mjml templates.
 * On mjml changes will rebuild mjml and apply translations if any.
 */
gulp.task('default', gulp.series(
    buildMjmlToHtml,
    generateLocalizedEmails,
    gulp.parallel(server, watch)
));

/**
 * Task will:
 * 1) build .mjml to .html (minify, remove comments)
 * 2) download translations from Lokalise
 * 3) lokalise all .html files
 * 4) group emails by folders (localized subject and content templates will be in one folder)
 */
gulp.task('prod', gulp.series(
    gulp.parallel(buildMjmlToHtmlAndMinify, downloadTranslationsFromLokalise),
    generateLocalizedEmails,
    groupEmailTemplatesByFolders
));

gulp.task('download-translations', downloadTranslationsFromLokalise);

// Will be needed only for upload translation automation.
// gulp.task('translate', uploadTranslationsToLokalise);

gulp.task('folders', groupEmailTemplatesByFolders);