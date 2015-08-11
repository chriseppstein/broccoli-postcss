var Filter = require('broccoli-filter');
var assign = require('object-assign');
var postcss = require('postcss');
var CssSyntaxError = require('postcss/lib/css-syntax-error');

function PostcssFilter(inputNode, options) {
    if ( !(this instanceof PostcssFilter) ) {
        return new PostcssFilter(inputNode, options);
    }

    this.warningStream = process.stderr;
    this.options = options || {};
    Filter.call(this, inputNode);
}

PostcssFilter.prototype = Object.create(Filter.prototype);
PostcssFilter.prototype.constructor = PostcssFilter;
PostcssFilter.prototype.extensions = ['css'];
PostcssFilter.prototype.targetExtension = 'css';

PostcssFilter.prototype.processString = function (str, relativePath) {
    var opts = this.options;

    if ( !opts.plugins || opts.plugins.length < 1 ) {
        throw new Error('You must provide at least 1 plugin in the plugin array');
    }

    var processor = postcss();
    var warningStream = this.warningStream;

    assign(opts, {
        from: relativePath,
        to: relativePath
    });

    opts.plugins.forEach(function (plugin) {
        processor.use(plugin.module(assign(opts, plugin.options)));
    });

    return processor.process(str, opts)
        .then(function (result) {
            result.warnings().forEach(function (warn) {
                warningStream.write(warn.toString());
            });
            return result.css;
        })
        .catch(function (error) {
            if ( 'CssSyntaxError' === error.name ) {
                error.message += "\n" + error.showSourceCode();
            }

            throw error;
        });
};

module.exports = PostcssFilter;
