'use strict';

module.exports = {
    client: {
        css: [
            'hydrafloodviewer/static/css/*.css',
        ],
        js: [
            'hydrafloodviewer/static/app/*.js',
            'hydrafloodviewer/static/app/**/*.js',
        ],
        geojson: [
            'hydrafloodviewer/static/app/**/*.geojson'
        ],
        views: [
            'hydrafloodviewer/templates/*.html',
            'hydrafloodviewer/templates/**/*.html',
        ],
        templates: ['static/templates.js']
    },
    server: {
        gulpConfig: ['gulpfile.js']
    }
};
