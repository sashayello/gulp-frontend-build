const projectForlder = "dist"
const sourceFolder = "src"

const fs = require('fs')

const path = {
    build: {
        html: `${projectForlder}/`,
        css: `${projectForlder}/css/`,
        js: `${projectForlder}/js/`,
        img: `${projectForlder}/img/`,
        fonts: `${projectForlder}/fonts/`,
    },
    src: {
        html: [`${sourceFolder}/*.html`, `!${sourceFolder}/_*.html`],
        css: `${sourceFolder}/scss/main.scss`,
        js: `${sourceFolder}/js/main.js`,
        img: `${sourceFolder}/img/**/*.{png,jpg,svg,gif,ico,webp}`,
        fonts: `${sourceFolder}/fonts/**/*`,
    },
    watch: {
        html: `${sourceFolder}/**/*.html`,
        css: `${sourceFolder}/scss/**/*.scss`,
        js: `${sourceFolder}/js/**/*.js`,
        img: `${sourceFolder}/img/**/*.{png,jpg,svg,gif,ico,webp}`,
    },
    clean: `./${projectForlder}/`
}

const { src, dest } = require('gulp')
const gulp = require('gulp')
const BrowserSync = require('browser-sync').create()
const FileInclude = require('gulp-file-include')
const del = require('del')
const GulpSass = require('gulp-sass')
const GulpAutoprefixer = require('gulp-autoprefixer')
const GulpGroupCssMediaQueries = require('gulp-group-css-media-queries')
const GulpCleanCss = require('gulp-clean-css')
const GulpRename = require('gulp-rename')
const GulpUglifyEs = require('gulp-uglify-es').default
const GulpBabel = require('gulp-babel')
const GulpImageMin = require('gulp-imagemin')
const GulpWebp = require('gulp-webp')
const GulpWebpHtml = require('gulp-webp-html')
const GulpWebpCss = require('gulp-webp-css')
const GulpSvgSprite = require('gulp-svg-sprite')
const GulpTtf2Woff = require('gulp-ttf2woff')
const GulpTtf2Woff2 = require('gulp-ttf2woff2')
const GulpFonter = require('gulp-fonter')
const GulpBeautify = require('gulp-beautify');


function browserSync(params) {
    BrowserSync.init({
        server: {
            baseDir: `./${projectForlder}/`,
        },
        port: 4200,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(FileInclude())
        .pipe(
            GulpWebpHtml()
        )
        .pipe(
            GulpBeautify.html({ indent_size: 2 })
        )
        .pipe(dest(path.build.html))
        .pipe(BrowserSync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            GulpSass({
                outputStyle: "expanded"
            })
        )
        .pipe(
            GulpAutoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(GulpGroupCssMediaQueries())
        .pipe(
            GulpWebpCss({})
        )
        .pipe(dest(path.build.css))
        .pipe(GulpCleanCss())
        .pipe(
            GulpRename({
                extname: '.min.css'
            })
        )
        .pipe(dest(path.build.css))
        .pipe(BrowserSync.stream())
}


function js() {
    return src(path.src.js)
        .pipe(FileInclude())
        .pipe(GulpBabel({
            presets: ['@babel/env']
        }))
        .pipe(dest(path.build.js))
        .pipe(
            GulpUglifyEs()
        )
        .pipe(
            GulpRename({
                extname: '.min.js'
            })
        )
        .pipe(dest(path.build.js))
        .pipe(BrowserSync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(
            GulpWebp({
                quality: 70,

            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            GulpImageMin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3
            })
        )
        .pipe(dest(path.build.img))
        .pipe(BrowserSync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(GulpTtf2Woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(GulpTtf2Woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('GulpSvgSprite', function () {
    return gulp.src([`${sourceFolder}/iconsprite/*.svg`])
        .pipe(
            GulpSvgSprite({
                mode: {
                    stack: {
                        sprite: "../icons/icons.svg",
                        example: true

                    }
                }
            })
        )
        .pipe(dest(path.build.img))
})

gulp.task('otf2ttf', function () {
    return gulp.src([`${sourceFolder}/fonts/*.otf`])
        .pipe(
            GulpFonter({
                formats: ['ttf']
            })
        )
        .pipe(dest(`${sourceFolder}/fonts/`))
})

function fontsStyle(params) {
    let file_content = fs.readFileSync(sourceFolder + '/scss/settings/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(sourceFolder + '/scss/settings/_fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(sourceFolder + '/scss/settings/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() { }

function watchFiles(params) {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], images)
}

function clean(params) {
    return del(path.clean)
}

const build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle)
const watch = gulp.parallel(build, watchFiles, browserSync)

exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.images = images
exports.js = js
exports.css = css
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch