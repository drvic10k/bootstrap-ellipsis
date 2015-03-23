//Extend storage
Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

//Extend jQuery for easier usage
//maxLine, callback, trigger, cutWords, withTags, fixedWidth
//when callback is provided, ellipsis is an anchor and triggers the callback on 'trigger'
//'withTags' is a special scenario when you have long links and you want to trim them to fit the container
$.fn.extend({
    ellipsis: function (options) {

        var defaults = {
            maxLine: 1,
            callback: tooltip,
            trigger: '',
            cutWords: false,
            withTags: false,
            fixedWidth: 0
        };

        options = $.extend({}, defaults, options);

        this.each(function (index, el) {
            var oldString = el.innerHTML;
            var lineWidth = options.fixedWidth || parseFloat(el.style.width) || $(el).width();
            var newString = new FastEllipsis(el).ellipseIt(el, options.maxLine, lineWidth, options.cutWords, options.withTags)[0];
            if (!options.withTags && options.trigger && oldString != newString) {
                newString = newString.replace(/\.{3}$/, "");
                $(el).html(newString).append($("<a class='ellipsis'>...</a>").attr("data-ellipsis", oldString).on(options.trigger, options.callback));
            }
            else if (!options.withTags) {
                el.innerHTML = newString;
            }
        });
    }
});

//Default callback for the ellipsis event
function tooltip(e) {
    $(e.target).popover({
        content: $(e.target).attr('data-ellipsis'),
        placement: function (context, source) {
            var position = $(source).position();
            if (position.left > 515) {
                return "left";
            }
            if (position.left < 515) {
                return "right";
            }
            if (position.top < 110) {
                return "bottom";
            }
            return "top";
        }
        trigger: 'hover'
    }).popover('show');
}

//Checks if parameter is DOM element
function isElement(obj) {
    return (typeof obj == "object" && !($(obj).html() == undefined))
}

//Faster function to get element width
$.fn.extend({
    FastWidth: function () {
        return parseFloat(window.getComputedStyle(this.get(0), null).getPropertyValue('width'));
    }
});

function FastEllipsis(cssStyle) {
    //can provide DOM element as parameter and take the style from that
    if (isElement(cssStyle)) {
        var element = (cssStyle.get) ? cssStyle.get(0) : cssStyle;
        var $element = (cssStyle.get) ? cssStyle : $(cssStyle);
        cssStyle = ["font-family: " + (element.style.fontFamily || $element.css('font-family')).replace(/'/g, ""),
            "font-size: " + (element.style.fontSize || $element.css('font-size')),
            "font-weight: " + (element.style.fontWeight || $element.css('font-weight'))].join('; ');
    }

    var _cssStyle = (!!cssStyle) ? cssStyle : "font-family: arial; font-size: 12pt";
    //try to take the cached widths from localStorage
    var _charWidthArray = localStorage.getObject(_cssStyle) || {};

    // Generate cache for width of all ASCII chars
    var generateASCIIwidth = (function () {
        //check if the object was taken from localStorage
        if (_charWidthArray.hasOwnProperty('_ ')) {
            return;
        }
        var container, charWrapper, character,
            totalWidth = 0, oldTotalWidth = 0, charWidth = 0;

        // Temporary container for generated ASCII chars
        container = $("<div style='width:6000px; visibility:hidden;'></div>").appendTo("body");
        charWrapper = $("<span style='" + _cssStyle + "'></span>").appendTo(container);

        // Space char
        charWrapper.append("&nbsp;");
        charWidth = charWrapper.width(); // hack: add 0.4px to every space removed (not needed?)
        _charWidthArray["_ "] = charWidth;

        // Other ASCII chars
        for (var i = 33; i <= 126; i++) {
            character = String.fromCharCode(i);
            charWrapper.append("" + character + character);

            oldTotalWidth = totalWidth;
            totalWidth = charWrapper.width();
            charWidth = (totalWidth - oldTotalWidth) / 2; // While cache is generating add two the same chars at once, and then divide per 2 to get better kerning accuracy.
            _charWidthArray["_" + character] = charWidth;
        }
        //save in localStorage
        localStorage.setObject(_cssStyle, _charWidthArray);
        // Remove temporary container
        container.remove();
    })();

    // Get the width of specified char
    var getCharWidth = function (myChar) {

        // If there is a char in cache
        if (!!_charWidthArray["_" + myChar]) {
            return _charWidthArray["_" + myChar];
        }

        // If there is no char in cache count width for that char and save the cache
        else {
            var container, charWrapper,
                totalWidth = 0, oldTotalWidth = 0, charWidth = 0;

            // Temporary container for generated ASCII chars
            container = $("<div style='width:6000px; visibility:hidden;'></div>").appendTo("body");
            charWrapper = $("<span style='" + _cssStyle + "'></span>").appendTo(container);
            charWrapper.append(myChar);
            charWidth = charWrapper.width();
            _charWidthArray["_" + myChar] = charWidth;
            container.remove();

            localStorage.setObject(_cssStyle, _charWidthArray);
            return charWidth;
        }

    };

    // Get the width of the word
    var getWordWidth = function (myWord) {

        myWord = myWord.trim();

        // Check if this word is already cached
        if (!!_charWidthArray["_" + myWord]) {
            return _charWidthArray["_" + myWord];
        }

        // If no, calculate it
        else {
            var sum = 0;
            for (var i = 0, len = myWord.length; i < len; i++) {
                sum = sum + getCharWidth(myWord[i]);
            }
            sum = Math.floor(sum);
            _charWidthArray["_" + myWord] = sum;
            return sum;
        }

    };

    // Ellipse text based on CSS styling set in constructor.
    var ellipseIt = function (myString, maxLine, lineWidth, cutWords, withTags) {

        if (withTags) {

            var a = $(myString).find('a');
            var lines = maxLine,
                aLeft = a.length;

            a.each(function (index, el) {
                var curLines = maxLine / a.length;
                if (lines / aLeft > 1) {
                    curLines = Math.ceil(curLines);
                } else {
                    curLines = Math.floor(curLines);
                }

                var e = ellipseIt(el.innerHTML, curLines, lineWidth, true);
                $(el).html(e[0]);
                lines -= e[1];
                aLeft -= 1;
            });
            return [myString];

        }
        if (isElement(myString)) {
            myString = $(myString).text();
        }
        var lineNo = 1,
            wordsInLineWidth = 0,
            wordArr = myString.trim().strip_tags().split(/\s+/g), // trim string, remove HTML tags, remove space duplicates (detect dash word breaking removed, because
        // it was causing an issue, where space after dash was removed
            spaceWidth = getCharWidth(" ");

        for (var i = 0, len = wordArr.length; i < len; i++) {

            // Adding widths of words in the loop
            wordsInLineWidth += getWordWidth(wordArr[i]);

            // Check if the total width of words calculated so far is larger than width of container passed in the parameter
            if (wordsInLineWidth > lineWidth) {

                // If yes, go to next line and reset the words width
                lineNo++;
                wordsInLineWidth = 0;

                // If accessing to the last line subtract width of ellipsis (...) from line width to reserve place for ellipsis
                // or if cutting words, get the last line string
                if (lineNo == maxLine) {
                    if (cutWords) {
                        var rest = ellipseWord(wordArr.slice(i, wordArr.length).join(" ").replace(/-\s/g, "-"), lineWidth);
                        return [wordArr.slice(0, i).join(" ") + " " + rest, Math.min(lineNo, maxLine)];
                    }
                    lineWidth -= threeDotsWidth;
                }

                // When you reached the end of maxLine parameter break the loop and return the result
                else if (lineNo > maxLine) {
                    if (i == 0) {
                        return [ellipseWord(wordArr[i], lineWidth), Math.min(lineNo, maxLine)];
                    }
                    return [wordArr.slice(0, i).join(" ") + "...", Math.min(lineNo, maxLine)];
                }

                // If the words width was bigger than line width go back in the loop to take last word for use in the beggining of next line
                i--;
            }
            else {
                // Adding width of space between words
                wordsInLineWidth += spaceWidth;
            }
        }

        // If there was no need to ellipsis
        return [myString, Math.min(lineNo, maxLine)];

    };

    //solution for single word per line
    var ellipseWord = function (myString, lineWidth) {
        if (getWordWidth(myString) < lineWidth) {
            return myString;
        }
        var width = 0;
        lineWidth -= threeDotsWidth;
        for (var i = 0, len = myString.length; i < len; i++) {
            width += getCharWidth(myString[i]);
            if (width > lineWidth) {
                return myString.substring(0, i) + "...";
            }
        }
        return myString;
    };
    var threeDotsWidth = getWordWidth("...");

    // Public interface
    return {
        getCharWidth: getCharWidth,
        getWordWidth: getWordWidth,
        ellipseIt: ellipseIt
    }
}

// Add string functions to String prototype

if (typeof String.prototype.trim !== "function") {
    String.prototype.trim = function () {
        return this.replace(/^\s*/, "").replace(/\s*$/, "");
    };
}

if (typeof String.prototype.strip_tags !== "function") {
    String.prototype.strip_tags = function () {
        return this.replace(/<\/?[^>]+(>|$)/g, "");
    };
}
