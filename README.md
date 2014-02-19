bootstrap-ellipsis
==================

fast way to add ellipsis for overflowing text  
version 1.0.0

This plug-in is based on this project by [dobiatowski] (https://github.com/dobiatowski/jQuery.FastEllipsis).  
See the performance demonstration [here](https://drvic10k.github.com/bootstrap-ellipsis).

####Dependencies:
[jQuery] (http://jquery.com/)  
if you want to use the tooltip, then also [twitter-bootstrap] (http://getbootstrap.com/)

####Usage:

Extension method `ellipsis(options)` is provided for jQuery objects.

Argument passed is an object literal with following properties:  
`maxLine` - number of lines to trim  
`trigger` - event on the ellipsis anchor that should trigger `callback`, if omited, ellipsis is added as plain text  
`callback` - function to be called when `trigger` event is raised, if omited, the bootstrap popover with complete text is shown  
`cutWords` - if `true`, the last word will be trimmed for the ellipsis  
`withTags` - very special scenario, when you have only links in container and you want to trim them if they span more than one line  
`fixedWidth` - greatly improves performance, if you have fixed element width, otherwise the width has to be calculated

#####Examples:
```
$('.column1').ellipsis({maxLine: 3, fixedWidth: 320});
$('.column2').ellipsis({maxLine: 5, trigger: 'mouseenter'});
$('div').ellipsis({maxLine: 3});
```
