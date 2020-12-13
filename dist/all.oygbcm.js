/**
 * ColorPicker - pure JavaScript color picker without using images, external CSS or 1px divs.
 * Copyright © 2011 David Durman, All rights reserved.
 */
(function(window, document, undefined) {

    var type = (window.SVGAngle || document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML"),
        picker, slide, hueOffset = 15, svgNS = 'http://www.w3.org/2000/svg';

    // This HTML snippet is inserted into the innerHTML property of the passed color picker element
    // when the no-hassle call to ColorPicker() is used, i.e. ColorPicker(function(hex, hsv, rgb) { ... });

    var colorpickerHTMLSnippet = [

        '<div class="picker-wrapper">',
                '<div class="picker"></div>',
                '<div class="picker-indicator"></div>',
        '</div>',
        '<div class="slide-wrapper">',
                '<div class="slide"></div>',
                '<div class="slide-indicator"></div>',
        '</div>'

    ].join('');

    /**
     * Return mouse position relative to the element el.
     */
    function mousePosition(evt) {
        // IE:
        if (window.event && window.event.contentOverflow !== undefined) {
            return { x: window.event.offsetX, y: window.event.offsetY };
        }
        // Webkit:
        if (evt.offsetX !== undefined && evt.offsetY !== undefined) {
            return { x: evt.offsetX, y: evt.offsetY };
        }
        // Firefox:
        var wrapper = evt.target.parentNode.parentNode;
        return { x: evt.layerX - wrapper.offsetLeft, y: evt.layerY - wrapper.offsetTop };
    }

    /**
     * Create SVG element.
     */
    function $(el, attrs, children) {
        el = document.createElementNS(svgNS, el);
        for (var key in attrs)
            el.setAttribute(key, attrs[key]);
        if (Object.prototype.toString.call(children) != '[object Array]') children = [children];
        var i = 0, len = (children[0] && children.length) || 0;
        for (; i < len; i++)
            el.appendChild(children[i]);
        return el;
    }

    /**
     * Create slide and picker markup depending on the supported technology.
     */
    if (type == 'SVG') {

        slide = $('svg', { xmlns: 'http://www.w3.org/2000/svg', version: '1.1', width: '100%', height: '100%' },
                  [
                      $('defs', {},
                        $('linearGradient', { id: 'gradient-hsv', x1: '0%', y1: '100%', x2: '0%', y2: '0%'},
                          [
                              $('stop', { offset: '0%', 'stop-color': '#FF0000', 'stop-opacity': '1' }),
                              $('stop', { offset: '13%', 'stop-color': '#FF00FF', 'stop-opacity': '1' }),
                              $('stop', { offset: '25%', 'stop-color': '#8000FF', 'stop-opacity': '1' }),
                              $('stop', { offset: '38%', 'stop-color': '#0040FF', 'stop-opacity': '1' }),
                              $('stop', { offset: '50%', 'stop-color': '#00FFFF', 'stop-opacity': '1' }),
                              $('stop', { offset: '63%', 'stop-color': '#00FF40', 'stop-opacity': '1' }),
                              $('stop', { offset: '75%', 'stop-color': '#0BED00', 'stop-opacity': '1' }),
                              $('stop', { offset: '88%', 'stop-color': '#FFFF00', 'stop-opacity': '1' }),
                              $('stop', { offset: '100%', 'stop-color': '#FF0000', 'stop-opacity': '1' })
                          ]
                         )
                       ),
                      $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-hsv)'})
                  ]
                 );

        picker = $('svg', { xmlns: 'http://www.w3.org/2000/svg', version: '1.1', width: '100%', height: '100%' },
                   [
                       $('defs', {},
                         [
                             $('linearGradient', { id: 'gradient-black', x1: '0%', y1: '100%', x2: '0%', y2: '0%'},
                               [
                                   $('stop', { offset: '0%', 'stop-color': '#000000', 'stop-opacity': '1' }),
                                   $('stop', { offset: '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0' })
                               ]
                              ),
                             $('linearGradient', { id: 'gradient-white', x1: '0%', y1: '100%', x2: '100%', y2: '100%'},
                               [
                                   $('stop', { offset: '0%', 'stop-color': '#FFFFFF', 'stop-opacity': '1' }),
                                   $('stop', { offset: '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0' })
                               ]
                              )
                         ]
                        ),
                       $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-white)'}),
                       $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-black)'})
                   ]
                  );

    } else if (type == 'VML') {
        slide = [
            '<DIV style="position: relative; width: 100%; height: 100%">',
            '<v:rect style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" stroked="f" filled="t">',
            '<v:fill type="gradient" method="none" angle="0" color="red" color2="red" colors="8519f fuchsia;.25 #8000ff;24903f #0040ff;.5 aqua;41287f #00ff40;.75 #0bed00;57671f yellow"></v:fill>',
            '</v:rect>',
            '</DIV>'
        ].join('');

        picker = [
            '<DIV style="position: relative; width: 100%; height: 100%">',
            '<v:rect style="position: absolute; left: -1px; top: -1px; width: 101%; height: 101%" stroked="f" filled="t">',
            '<v:fill type="gradient" method="none" angle="270" color="#FFFFFF" opacity="100%" color2="#CC9A81" o:opacity2="0%"></v:fill>',
            '</v:rect>',
            '<v:rect style="position: absolute; left: 0px; top: 0px; width: 100%; height: 101%" stroked="f" filled="t">',
            '<v:fill type="gradient" method="none" angle="0" color="#000000" opacity="100%" color2="#CC9A81" o:opacity2="0%"></v:fill>',
            '</v:rect>',
            '</DIV>'
        ].join('');

        if (!document.namespaces['v'])
            document.namespaces.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');
    }

    /**
     * Convert HSV representation to RGB HEX string.
     * Credits to http://www.raphaeljs.com
     */
    function hsv2rgb(hsv) {
        var R, G, B, X, C;
        var h = (hsv.h % 360) / 60;

        C = hsv.v * hsv.s;
        X = C * (1 - Math.abs(h % 2 - 1));
        R = G = B = hsv.v - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];

        var r = Math.floor(R * 255);
        var g = Math.floor(G * 255);
        var b = Math.floor(B * 255);
        return { r: r, g: g, b: b, hex: "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1) };
    }

    /**
     * Convert RGB representation to HSV.
     * r, g, b can be either in <0,1> range or <0,255> range.
     * Credits to http://www.raphaeljs.com
     */
    function rgb2hsv(rgb) {

        var r = rgb.r;
        var g = rgb.g;
        var b = rgb.b;

        if (rgb.r > 1 || rgb.g > 1 || rgb.b > 1) {
            r /= 255;
            g /= 255;
            b /= 255;
        }

        var H, S, V, C;
        V = Math.max(r, g, b);
        C = V - Math.min(r, g, b);
        H = (C == 0 ? null :
             V == r ? (g - b) / C + (g < b ? 6 : 0) :
             V == g ? (b - r) / C + 2 :
                      (r - g) / C + 4);
        H = (H % 6) * 60;
        S = C == 0 ? 0 : C / V;
        return { h: H, s: S, v: V };
    }

    /**
     * Return click event handler for the slider.
     * Sets picker background color and calls ctx.callback if provided.
     */
    function slideListener(ctx, slideElement, pickerElement) {
        return function(evt) {
            evt = evt || window.event;
            var mouse = mousePosition(evt);
            ctx.h = mouse.y / slideElement.offsetHeight * 360 + hueOffset;
            var pickerColor = hsv2rgb({ h: ctx.h, s: 1, v: 1 });
            var c = hsv2rgb({ h: ctx.h, s: ctx.s, v: ctx.v });
            pickerElement.style.backgroundColor = pickerColor.hex;
            ctx.callback && ctx.callback(c.hex, { h: ctx.h - hueOffset, s: ctx.s, v: ctx.v }, { r: c.r, g: c.g, b: c.b }, undefined, mouse);
        }
    };

    /**
     * Return click event handler for the picker.
     * Calls ctx.callback if provided.
     */
    function pickerListener(ctx, pickerElement) {
        return function(evt) {
            evt = evt || window.event;
            var mouse = mousePosition(evt),
                width = pickerElement.offsetWidth,
                height = pickerElement.offsetHeight;

            ctx.s = mouse.x / width;
            ctx.v = (height - mouse.y) / height;
            var c = hsv2rgb(ctx);
            ctx.callback && ctx.callback(c.hex, { h: ctx.h - hueOffset, s: ctx.s, v: ctx.v }, { r: c.r, g: c.g, b: c.b }, mouse);
        }
    };

    var uniqID = 0;

    /**
     * ColorPicker.
     * @param {DOMElement} slideElement HSV slide element.
     * @param {DOMElement} pickerElement HSV picker element.
     * @param {Function} callback Called whenever the color is changed provided chosen color in RGB HEX format as the only argument.
     */
    function ColorPicker(slideElement, pickerElement, callback) {

        if (!(this instanceof ColorPicker)) return new ColorPicker(slideElement, pickerElement, callback);

        this.h = 0;
        this.s = 1;
        this.v = 1;

        if (!callback) {
            // call of the form ColorPicker(element, funtion(hex, hsv, rgb) { ... }), i.e. the no-hassle call.

            var element = slideElement;
            element.innerHTML = colorpickerHTMLSnippet;

            this.slideElement = element.getElementsByClassName('slide')[0];
            this.pickerElement = element.getElementsByClassName('picker')[0];
            var slideIndicator = element.getElementsByClassName('slide-indicator')[0];
            var pickerIndicator = element.getElementsByClassName('picker-indicator')[0];

            ColorPicker.fixIndicators(slideIndicator, pickerIndicator);

            this.callback = function(hex, hsv, rgb, pickerCoordinate, slideCoordinate) {

                ColorPicker.positionIndicators(slideIndicator, pickerIndicator, slideCoordinate, pickerCoordinate);

                pickerElement(hex, hsv, rgb);
            };

        } else {

            this.callback = callback;
            this.pickerElement = pickerElement;
            this.slideElement = slideElement;
        }

        if (type == 'SVG') {

            // Generate uniq IDs for linearGradients so that we don't have the same IDs within one document.
            // Then reference those gradients in the associated rectangles.

            var slideClone = slide.cloneNode(true);
            var pickerClone = picker.cloneNode(true);

            //Fix for Safari:
            //https://github.com/deini/FlexiColorPicker/tree/safari
            //var hsvGradient = slideClone.getElementById('gradient-hsv');
            var hsvGradient = slideClone.getElementsByTagName('defs')[0].firstChild;

            var hsvRect = slideClone.getElementsByTagName('rect')[0];

            hsvGradient.id = 'gradient-hsv-' + uniqID;
            hsvRect.setAttribute('fill', 'url(#' + hsvGradient.id + ')');

            //var blackAndWhiteGradients = [pickerClone.getElementById('gradient-black'), pickerClone.getElementById('gradient-white')];
            var gradientDefs = pickerClone.getElementsByTagName('defs')[0];
            var blackAndWhiteGradients = [gradientDefs.firstChild, gradientDefs.lastChild];
            var whiteAndBlackRects = pickerClone.getElementsByTagName('rect');

            blackAndWhiteGradients[0].id = 'gradient-black-' + uniqID;
            blackAndWhiteGradients[1].id = 'gradient-white-' + uniqID;

            whiteAndBlackRects[0].setAttribute('fill', 'url(#' + blackAndWhiteGradients[1].id + ')');
            whiteAndBlackRects[1].setAttribute('fill', 'url(#' + blackAndWhiteGradients[0].id + ')');

            this.slideElement.appendChild(slideClone);
            this.pickerElement.appendChild(pickerClone);

            uniqID++;

        } else {

            this.slideElement.innerHTML = slide;
            this.pickerElement.innerHTML = picker;
        }

        addEventListener(this.slideElement, 'click', slideListener(this, this.slideElement, this.pickerElement));
        addEventListener(this.pickerElement, 'click', pickerListener(this, this.pickerElement));

        enableDragging(this, this.slideElement, slideListener(this, this.slideElement, this.pickerElement));
        enableDragging(this, this.pickerElement, pickerListener(this, this.pickerElement));
    };

    function addEventListener(element, event, listener) {

        if (element.attachEvent) {

            element.attachEvent('on' + event, listener);

        } else if (element.addEventListener) {

            element.addEventListener(event, listener, false);
        }
    }

   /**
    * Enable drag&drop color selection.
    * @param {object} ctx ColorPicker instance.
    * @param {DOMElement} element HSV slide element or HSV picker element.
    * @param {Function} listener Function that will be called whenever mouse is dragged over the element with event object as argument.
    */
    function enableDragging(ctx, element, listener) {

        var mousedown = false;

        addEventListener(element, 'mousedown', function(evt) { mousedown = true;  });
        addEventListener(element, 'mouseup',   function(evt) { mousedown = false;  });
        addEventListener(element, 'mouseout',  function(evt) { mousedown = false;  });
        addEventListener(element, 'mousemove', function(evt) {

            if (mousedown) {

                listener(evt);
            }
        });
    }


    ColorPicker.hsv2rgb = function(hsv) {
        var rgbHex = hsv2rgb(hsv);
        delete rgbHex.hex;
        return rgbHex;
    };

    ColorPicker.hsv2hex = function(hsv) {
        return hsv2rgb(hsv).hex;
    };

    ColorPicker.rgb2hsv = rgb2hsv;

    ColorPicker.rgb2hex = function(rgb) {
        return hsv2rgb(rgb2hsv(rgb)).hex;
    };

    ColorPicker.hex2hsv = function(hex) {
        return rgb2hsv(ColorPicker.hex2rgb(hex));
    };

    ColorPicker.hex2rgb = function(hex) {
        return { r: parseInt(hex.substr(1, 2), 16), g: parseInt(hex.substr(3, 2), 16), b: parseInt(hex.substr(5, 2), 16) };
    };

    /**
     * Sets color of the picker in hsv/rgb/hex format.
     * @param {object} ctx ColorPicker instance.
     * @param {object} hsv Object of the form: { h: <hue>, s: <saturation>, v: <value> }.
     * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
     * @param {string} hex String of the form: #RRGGBB.
     */
     function setColor(ctx, hsv, rgb, hex) {
         ctx.h = hsv.h % 360;
         ctx.s = hsv.s;
         ctx.v = hsv.v;

         var c = hsv2rgb(ctx);

         var mouseSlide = {
             y: (ctx.h * ctx.slideElement.offsetHeight) / 360,
             x: 0    // not important
         };

         var pickerHeight = ctx.pickerElement.offsetHeight;

         var mousePicker = {
             x: ctx.s * ctx.pickerElement.offsetWidth,
             y: pickerHeight - ctx.v * pickerHeight
         };

         ctx.pickerElement.style.backgroundColor = hsv2rgb({ h: ctx.h, s: 1, v: 1 }).hex;
         ctx.callback && ctx.callback(hex || c.hex, { h: ctx.h, s: ctx.s, v: ctx.v }, rgb || { r: c.r, g: c.g, b: c.b }, mousePicker, mouseSlide);

         return ctx;
    };

    /**
     * Sets color of the picker in hsv format.
     * @param {object} hsv Object of the form: { h: <hue>, s: <saturation>, v: <value> }.
     */
    ColorPicker.prototype.setHsv = function(hsv) {
        return setColor(this, hsv);
    };

    /**
     * Sets color of the picker in rgb format.
     * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
     */
    ColorPicker.prototype.setRgb = function(rgb) {
        return setColor(this, rgb2hsv(rgb), rgb);
    };

    /**
     * Sets color of the picker in hex format.
     * @param {string} hex Hex color format #RRGGBB.
     */
    ColorPicker.prototype.setHex = function(hex) {
        return setColor(this, ColorPicker.hex2hsv(hex), undefined, hex);
    };

    /**
     * Helper to position indicators.
     * @param {HTMLElement} slideIndicator DOM element representing the indicator of the slide area.
     * @param {HTMLElement} pickerIndicator DOM element representing the indicator of the picker area.
     * @param {object} mouseSlide Coordinates of the mouse cursor in the slide area.
     * @param {object} mousePicker Coordinates of the mouse cursor in the picker area.
     */
    ColorPicker.positionIndicators = function(slideIndicator, pickerIndicator, mouseSlide, mousePicker) {

        if (mouseSlide) {
            slideIndicator.style.top = (mouseSlide.y - slideIndicator.offsetHeight/2) + 'px';
        }
        if (mousePicker) {
            pickerIndicator.style.top = (mousePicker.y - pickerIndicator.offsetHeight/2) + 'px';
            pickerIndicator.style.left = (mousePicker.x - pickerIndicator.offsetWidth/2) + 'px';
        }
    };

    /**
     * Helper to fix indicators - this is recommended (and needed) for dragable color selection (see enabledDragging()).
     */
    ColorPicker.fixIndicators = function(slideIndicator, pickerIndicator) {

        pickerIndicator.style.pointerEvents = 'none';
        slideIndicator.style.pointerEvents = 'none';
    };

    window.ColorPicker = ColorPicker;

})(window, window.document);
;function consolelog() {
  if (window.location.protocol === "http:") console.log(arguments)
};

(function(a,b){"use strict";var c=function(){var b=function(){var b=a.location.hash?a.location.hash.substr(1).split("&"):[],c={};for(var d=0;d<b.length;d++){var e=b[d].split("=");c[e[0]]=decodeURIComponent(e[1])}return c};var c=function(b){var c=[];for(var d in b){c.push(d+"="+encodeURIComponent(b[d]))}a.location.hash=c.join("&")};return{get:function(a){var c=b();if(a){return c[a]}else{return c}},add:function(a){var d=b();for(var e in a){d[e]=a[e]}c(d)},remove:function(a){a=typeof a=="string"?[a]:a;var d=b();for(var e=0;e<a.length;e++){delete d[a[e]]}c(d)},clear:function(){c({})}}}();a.hash=c})(window);!function(a){var b,c,d="0.4.2",e="hasOwnProperty",f=/[\.\/]/,g="*",h=function(){},i=function(a,b){return a-b},j={n:{}},k=function(a,d){a=String(a);var e,f=c,g=Array.prototype.slice.call(arguments,2),h=k.listeners(a),j=0,l=[],m={},n=[],o=b;b=a,c=0;for(var p=0,q=h.length;q>p;p++)"zIndex"in h[p]&&(l.push(h[p].zIndex),h[p].zIndex<0&&(m[h[p].zIndex]=h[p]));for(l.sort(i);l[j]<0;)if(e=m[l[j++]],n.push(e.apply(d,g)),c)return c=f,n;for(p=0;q>p;p++)if(e=h[p],"zIndex"in e)if(e.zIndex==l[j]){if(n.push(e.apply(d,g)),c)break;do if(j++,e=m[l[j]],e&&n.push(e.apply(d,g)),c)break;while(e)}else m[e.zIndex]=e;else if(n.push(e.apply(d,g)),c)break;return c=f,b=o,n.length?n:null};k._events=j,k.listeners=function(a){var b,c,d,e,h,i,k,l,m=a.split(f),n=j,o=[n],p=[];for(e=0,h=m.length;h>e;e++){for(l=[],i=0,k=o.length;k>i;i++)for(n=o[i].n,c=[n[m[e]],n[g]],d=2;d--;)b=c[d],b&&(l.push(b),p=p.concat(b.f||[]));o=l}return p},k.on=function(a,b){if(a=String(a),"function"!=typeof b)return function(){};for(var c=a.split(f),d=j,e=0,g=c.length;g>e;e++)d=d.n,d=d.hasOwnProperty(c[e])&&d[c[e]]||(d[c[e]]={n:{}});for(d.f=d.f||[],e=0,g=d.f.length;g>e;e++)if(d.f[e]==b)return h;return d.f.push(b),function(a){+a==+a&&(b.zIndex=+a)}},k.f=function(a){var b=[].slice.call(arguments,1);return function(){k.apply(null,[a,null].concat(b).concat([].slice.call(arguments,0)))}},k.stop=function(){c=1},k.nt=function(a){return a?new RegExp("(?:\\.|\\/|^)"+a+"(?:\\.|\\/|$)").test(b):b},k.nts=function(){return b.split(f)},k.off=k.unbind=function(a,b){if(!a)return k._events=j={n:{}},void 0;var c,d,h,i,l,m,n,o=a.split(f),p=[j];for(i=0,l=o.length;l>i;i++)for(m=0;m<p.length;m+=h.length-2){if(h=[m,1],c=p[m].n,o[i]!=g)c[o[i]]&&h.push(c[o[i]]);else for(d in c)c[e](d)&&h.push(c[d]);p.splice.apply(p,h)}for(i=0,l=p.length;l>i;i++)for(c=p[i];c.n;){if(b){if(c.f){for(m=0,n=c.f.length;n>m;m++)if(c.f[m]==b){c.f.splice(m,1);break}!c.f.length&&delete c.f}for(d in c.n)if(c.n[e](d)&&c.n[d].f){var q=c.n[d].f;for(m=0,n=q.length;n>m;m++)if(q[m]==b){q.splice(m,1);break}!q.length&&delete c.n[d].f}}else{delete c.f;for(d in c.n)c.n[e](d)&&c.n[d].f&&delete c.n[d].f}c=c.n}},k.once=function(a,b){var c=function(){return k.unbind(a,c),b.apply(this,arguments)};return k.on(a,c)},k.version=d,k.toString=function(){return"You are running Eve "+d},"undefined"!=typeof module&&module.exports?module.exports=k:"undefined"!=typeof define?define("eve",[],function(){return k}):a.eve=k}(this),function(a,b){"function"==typeof define&&define.amd?define(["eve"],function(c){return b(a,c)}):b(a,a.eve)}(this,function(a,b){var c=function(b){var c={},d=a.requestAnimationFrame||a.webkitRequestAnimationFrame||a.mozRequestAnimationFrame||a.oRequestAnimationFrame||a.msRequestAnimationFrame||function(a){setTimeout(a,16)},e=Array.isArray||function(a){return a instanceof Array||"[object Array]"==Object.prototype.toString.call(a)},f=0,g="M"+(+new Date).toString(36),h=function(){return g+(f++).toString(36)},i=Date.now||function(){return+new Date},j=function(a){var b=this;if(null==a)return b.s;var c=b.s-a;b.b+=b.dur*c,b.B+=b.dur*c,b.s=a},k=function(a){var b=this;return null==a?b.spd:(b.spd=a,void 0)},l=function(a){var b=this;return null==a?b.dur:(b.s=b.s*a/b.dur,b.dur=a,void 0)},m=function(){var a=this;delete c[a.id],b("mina.stop."+a.id,a)},n=function(){var a=this;a.pdif||(delete c[a.id],a.pdif=a.get()-a.b)},o=function(){var a=this;a.pdif&&(a.b=a.get()-a.pdif,delete a.pdif,c[a.id]=a)},p=function(){var a=0;for(var f in c)if(c.hasOwnProperty(f)){var g,h=c[f],i=h.get();if(a++,h.s=(i-h.b)/(h.dur/h.spd),h.s>=1&&(delete c[f],h.s=1,a--,function(a){setTimeout(function(){b("mina.finish."+a.id,a)})}(h)),e(h.start)){g=[];for(var j=0,k=h.start.length;k>j;j++)g[j]=+h.start[j]+(h.end[j]-h.start[j])*h.easing(h.s)}else g=+h.start+(h.end-h.start)*h.easing(h.s);h.set(g)}a&&d(p)},q=function(a,b,e,f,g,i,r){var s={id:h(),start:a,end:b,b:e,s:0,dur:f-e,spd:1,get:g,set:i,easing:r||q.linear,status:j,speed:k,duration:l,stop:m,pause:n,resume:o};c[s.id]=s;var t,u=0;for(t in c)if(c.hasOwnProperty(t)&&(u++,2==u))break;return 1==u&&d(p),s};return q.time=i,q.getById=function(a){return c[a]||null},q.linear=function(a){return a},q.easeout=function(a){return Math.pow(a,1.7)},q.easein=function(a){return Math.pow(a,.48)},q.easeinout=function(a){if(1==a)return 1;if(0==a)return 0;var b=.48-a/1.04,c=Math.sqrt(.1734+b*b),d=c-b,e=Math.pow(Math.abs(d),1/3)*(0>d?-1:1),f=-c-b,g=Math.pow(Math.abs(f),1/3)*(0>f?-1:1),h=e+g+.5;return 3*(1-h)*h*h+h*h*h},q.backin=function(a){if(1==a)return 1;var b=1.70158;return a*a*((b+1)*a-b)},q.backout=function(a){if(0==a)return 0;a-=1;var b=1.70158;return a*a*((b+1)*a+b)+1},q.elastic=function(a){return a==!!a?a:Math.pow(2,-10*a)*Math.sin((a-.075)*2*Math.PI/.3)+1},q.bounce=function(a){var b,c=7.5625,d=2.75;return 1/d>a?b=c*a*a:2/d>a?(a-=1.5/d,b=c*a*a+.75):2.5/d>a?(a-=2.25/d,b=c*a*a+.9375):(a-=2.625/d,b=c*a*a+.984375),b},a.mina=q,q}("undefined"==typeof b?function(){}:b),d=function(){function d(a,b){if(a){if(a.tagName)return z(a);if(a instanceof u)return a;if(null==b)return a=I.doc.querySelector(a),z(a)}return a=null==a?"100%":a,b=null==b?"100%":b,new y(a,b)}function e(a,b){if(b){if("string"==typeof a&&(a=e(a)),"string"==typeof b)return"xlink:"==b.substring(0,6)?a.getAttributeNS(fb,b.substring(6)):"xml:"==b.substring(0,4)?a.getAttributeNS(gb,b.substring(4)):a.getAttribute(b);for(var c in b)if(b[J](c)){var d=K(b[c]);d?"xlink:"==c.substring(0,6)?a.setAttributeNS(fb,c.substring(6),d):"xml:"==c.substring(0,4)?a.setAttributeNS(gb,c.substring(4),d):a.setAttribute(c,d):a.removeAttribute(c)}}else a=I.doc.createElementNS(gb,a);return a}function f(a,b){return b=K.prototype.toLowerCase.call(b),"finite"==b?isFinite(a):"array"==b&&(a instanceof Array||Array.isArray&&Array.isArray(a))?!0:"null"==b&&null===a||b==typeof a&&null!==a||"object"==b&&a===Object(a)||U.call(a).slice(8,-1).toLowerCase()==b}function h(a){if("function"==typeof a||Object(a)!==a)return a;var b=new a.constructor;for(var c in a)a[J](c)&&(b[c]=h(a[c]));return b}function i(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return a.push(a.splice(c,1)[0])}function j(a,b,c){function d(){var e=Array.prototype.slice.call(arguments,0),f=e.join("␀"),g=d.cache=d.cache||{},h=d.count=d.count||[];return g[J](f)?(i(h,f),c?c(g[f]):g[f]):(h.length>=1e3&&delete g[h.shift()],h.push(f),g[f]=a.apply(b,e),c?c(g[f]):g[f])}return d}function k(a,b,c,d,e,f){if(null==e){var g=a-c,h=b-d;return g||h?(180+180*N.atan2(-h,-g)/R+360)%360:0}return k(a,b,e,f)-k(c,d,e,f)}function l(a){return a%360*R/180}function m(a){return 180*a/R%360}function n(a,b,c,d,e,f){return null==b&&"[object SVGMatrix]"==U.call(a)?(this.a=a.a,this.b=a.b,this.c=a.c,this.d=a.d,this.e=a.e,this.f=a.f,void 0):(null!=a?(this.a=+a,this.b=+b,this.c=+c,this.d=+d,this.e=+e,this.f=+f):(this.a=1,this.b=0,this.c=0,this.d=1,this.e=0,this.f=0),void 0)}function o(a){var b=[];return a=a.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g,function(a,c,d){return d=d.split(/\s*,\s*|\s+/),"rotate"==c&&1==d.length&&d.push(0,0),"scale"==c&&(2==d.length&&d.push(0,0),1==d.length&&d.push(d[0],0,0)),"skewX"==c?b.push(["m",1,0,N.tan(l(d[0])),1,0,0]):"skewY"==c?b.push(["m",1,N.tan(l(d[0])),0,1,0,0]):b.push([c.charAt(0)].concat(d)),a}),b}function p(a,b){var c=qb(a),d=new n;if(c)for(var e=0,f=c.length;f>e;e++){var g,h,i,j,k,l=c[e],m=l.length,o=K(l[0]).toLowerCase(),p=l[0]!=o,q=p?d.invert():0;"t"==o&&2==m?d.translate(l[1],0):"t"==o&&3==m?p?(g=q.x(0,0),h=q.y(0,0),i=q.x(l[1],l[2]),j=q.y(l[1],l[2]),d.translate(i-g,j-h)):d.translate(l[1],l[2]):"r"==o?2==m?(k=k||b,d.rotate(l[1],k.x+k.width/2,k.y+k.height/2)):4==m&&(p?(i=q.x(l[2],l[3]),j=q.y(l[2],l[3]),d.rotate(l[1],i,j)):d.rotate(l[1],l[2],l[3])):"s"==o?2==m||3==m?(k=k||b,d.scale(l[1],l[m-1],k.x+k.width/2,k.y+k.height/2)):4==m?p?(i=q.x(l[2],l[3]),j=q.y(l[2],l[3]),d.scale(l[1],l[1],i,j)):d.scale(l[1],l[1],l[2],l[3]):5==m&&(p?(i=q.x(l[3],l[4]),j=q.y(l[3],l[4]),d.scale(l[1],l[2],i,j)):d.scale(l[1],l[2],l[3],l[4])):"m"==o&&7==m&&d.add(l[1],l[2],l[3],l[4],l[5],l[6])}return d}function q(a,b){if(null==b){var c=!0;if(b="linearGradient"==a.type||"radialGradient"==a.type?a.node.getAttribute("gradientTransform"):"pattern"==a.type?a.node.getAttribute("patternTransform"):a.node.getAttribute("transform"),!b)return new n;b=o(b)}else b=d._.rgTransform.test(b)?K(b).replace(/\.{3}|\u2026/g,a._.transform||S):o(b),f(b,"array")&&(b=d.path?d.path.toString.call(b):K(b)),a._.transform=b;var e=p(b,a.getBBox(1));return c?e:(a.matrix=e,void 0)}function r(a){var b=d._.someDefs;if(b&&rb(b.ownerDocument.documentElement,b))return b;var c=a.node.ownerSVGElement&&z(a.node.ownerSVGElement)||a.node.parentNode&&z(a.node.parentNode)||d.select("svg")||d(0,0),e=c.select("defs"),f=null==e?!1:e.node;return f||(f=x("defs",c.node).node),d._.someDefs=f,f}function s(a,b,c){function d(a){return null==a?S:a==+a?a:(e(j,{width:a}),j.getBBox().width)}function f(a){return null==a?S:a==+a?a:(e(j,{height:a}),j.getBBox().height)}function g(d,e){null==b?i[d]=e(a.attr(d)):d==b&&(i=e(null==c?a.attr(d):c))}var h=r(a),i={},j=h.querySelector(".svg---mgr");switch(j||(j=e("rect"),e(j,{width:10,height:10,"class":"svg---mgr"}),h.appendChild(j)),a.type){case"rect":g("rx",d),g("ry",f);case"image":g("width",d),g("height",f);case"text":g("x",d),g("y",f);break;case"circle":g("cx",d),g("cy",f),g("r",d);break;case"ellipse":g("cx",d),g("cy",f),g("rx",d),g("ry",f);break;case"line":g("x1",d),g("x2",d),g("y1",f),g("y2",f);break;case"marker":g("refX",d),g("markerWidth",d),g("refY",f),g("markerHeight",f);break;case"radialGradient":g("fx",d),g("fy",f);break;case"tspan":g("dx",d),g("dy",f);break;default:g(b,d)}return i}function t(a){f(a,"array")||(a=Array.prototype.slice.call(arguments,0));for(var b=0,c=0,d=this.node;this[b];)delete this[b++];for(b=0;b<a.length;b++)"set"==a[b].type?a[b].forEach(function(a){d.appendChild(a.node)}):d.appendChild(a[b].node);var e=d.childNodes;for(b=0;b<e.length;b++)this[c++]=z(e[b]);return this}function u(a){if(a.snap in hb)return hb[a.snap];var b,c=this.id=eb();try{b=a.ownerSVGElement}catch(d){}if(this.node=a,b&&(this.paper=new y(b)),this.type=a.tagName,this.anims={},this._={transform:[]},a.snap=c,hb[c]=this,"g"==this.type){this.add=t;for(var e in y.prototype)y.prototype[J](e)&&(this[e]=y.prototype[e])}}function v(a){for(var b,c=0,d=a.length;d>c;c++)if(b=b||a[c])return b}function w(a){this.node=a}function x(a,b){var c=e(a);b.appendChild(c);var d=z(c);return d.type=a,d}function y(a,b){var c,d,f,g=y.prototype;if(a&&"svg"==a.tagName){if(a.snap in hb)return hb[a.snap];c=new u(a),d=a.getElementsByTagName("desc")[0],f=a.getElementsByTagName("defs")[0],d||(d=e("desc"),d.appendChild(I.doc.createTextNode("Created with Snap")),c.node.appendChild(d)),f||(f=e("defs"),c.node.appendChild(f)),c.defs=f;for(var h in g)g[J](h)&&(c[h]=g[h]);c.paper=c.root=c}else c=x("svg",I.doc.body),e(c.node,{height:b,version:1.1,width:a,xmlns:gb});return c}function z(a){return a?a instanceof u||a instanceof w?a:"svg"==a.tagName?new y(a):new u(a):a}function A(){return this.selectAll("stop")}function B(a,b){var c=e("stop"),f={offset:+b+"%"};return a=d.color(a),f["stop-color"]=a.hex,a.opacity<1&&(f["stop-opacity"]=a.opacity),e(c,f),this.node.appendChild(c),this}function C(){if("linearGradient"==this.type){var a=e(this.node,"x1")||0,b=e(this.node,"x2")||1,c=e(this.node,"y1")||0,f=e(this.node,"y2")||0;return d._.box(a,c,N.abs(b-a),N.abs(f-c))}var g=this.node.cx||.5,h=this.node.cy||.5,i=this.node.r||0;return d._.box(g-i,h-i,2*i,2*i)}function D(a,c){function d(a,b){for(var c=(b-j)/(a-k),d=k;a>d;d++)h[d].offset=+(+j+c*(d-k)).toFixed(2);k=a,j=b}var f,g=v(b("snap.util.grad.parse",null,c));if(!g)return null;g.params.unshift(a),f="l"==g.type.toLowerCase()?E.apply(0,g.params):F.apply(0,g.params),g.type!=g.type.toLowerCase()&&e(f.node,{gradientUnits:"userSpaceOnUse"});var h=g.stops,i=h.length,j=0,k=0;i--;for(var l=0;i>l;l++)"offset"in h[l]&&d(l,h[l].offset);for(h[i].offset=h[i].offset||100,d(i,h[i].offset),l=0;i>=l;l++){var m=h[l];f.addStop(m.color,m.offset)}return f}function E(a,b,c,d,f){var g=x("linearGradient",a);return g.stops=A,g.addStop=B,g.getBBox=C,null!=b&&e(g.node,{x1:b,y1:c,x2:d,y2:f}),g}function F(a,b,c,d,f,g){var h=x("radialGradient",a);return h.stops=A,h.addStop=B,h.getBBox=C,null!=b&&e(h.node,{cx:b,cy:c,r:d}),null!=f&&null!=g&&e(h.node,{fx:f,fy:g}),h}function G(a){return function(c){if(b.stop(),c instanceof w&&1==c.node.childNodes.length&&("radialGradient"==c.node.firstChild.tagName||"linearGradient"==c.node.firstChild.tagName||"pattern"==c.node.firstChild.tagName)&&(c=c.node.firstChild,r(this).appendChild(c),c=z(c)),c instanceof u)if("radialGradient"==c.type||"linearGradient"==c.type||"pattern"==c.type){c.node.id||e(c.node,{id:c.id});var f=ib(c.node.id)}else f=c.attr(a);else if(f=d.color(c),f.error){var g=D(r(this),c);g?(g.node.id||e(g.node,{id:g.id}),f=ib(g.node.id)):f=c}else f=K(f);var h={};h[a]=f,e(this.node,h),this.node.style[a]=S}}function H(a){for(var b=[],c=a.childNodes,d=0,e=c.length;e>d;d++){var f=c[d];3==f.nodeType&&b.push(f.nodeValue),"tspan"==f.tagName&&(1==f.childNodes.length&&3==f.firstChild.nodeType?b.push(f.firstChild.nodeValue):b.push(H(f)))}return b}d.version="0.2.0",d.toString=function(){return"Snap v"+this.version},d._={};var I={win:a,doc:a.document};d._.glob=I;var J="hasOwnProperty",K=String,L=parseFloat,M=parseInt,N=Math,O=N.max,P=N.min,Q=N.abs,R=(N.pow,N.PI),S=(N.round,""),T=" ",U=Object.prototype.toString,V=/^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i,W=/^url\(#?([^)]+)\)$/,X="	\n\f\r   ᠎             　\u2028\u2029",Y=new RegExp("[,"+X+"]+"),Z=(new RegExp("["+X+"]","g"),new RegExp("["+X+"]*,["+X+"]*")),$={hs:1,rg:1},_=new RegExp("([a-z])["+X+",]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?["+X+"]*,?["+X+"]*)+)","ig"),ab=new RegExp("([rstm])["+X+",]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?["+X+"]*,?["+X+"]*)+)","ig"),bb=new RegExp("(-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?)["+X+"]*,?["+X+"]*","ig"),cb=0,db="S"+(+new Date).toString(36),eb=function(){return db+(cb++).toString(36)},fb="http://www.w3.org/1999/xlink",gb="http://www.w3.org/2000/svg",hb={},ib=d.url=function(a){return"url('#"+a+"')"};d._.$=e,d._.id=eb,d.format=function(){var a=/\{([^\}]+)\}/g,b=/(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,c=function(a,c,d){var e=d;return c.replace(b,function(a,b,c,d,f){b=b||d,e&&(b in e&&(e=e[b]),"function"==typeof e&&f&&(e=e()))}),e=(null==e||e==d?a:e)+""};return function(b,d){return K(b).replace(a,function(a,b){return c(a,b,d)})}}();var jb=function(){function a(){this.parentNode.removeChild(this)}return function(b,c){var d=I.doc.createElement("img"),e=I.doc.body;d.style.cssText="position:absolute;left:-9999em;top:-9999em",d.onload=function(){c.call(d),d.onload=d.onerror=null,e.removeChild(d)},d.onerror=a,e.appendChild(d),d.src=b}}();d._.clone=h,d._.cacher=j,d.rad=l,d.deg=m,d.angle=k,d.is=f,d.snapTo=function(a,b,c){if(c=f(c,"finite")?c:10,f(a,"array")){for(var d=a.length;d--;)if(Q(a[d]-b)<=c)return a[d]}else{a=+a;var e=b%a;if(c>e)return b-e;if(e>a-c)return b-e+a}return b},function(a){function b(a){return a[0]*a[0]+a[1]*a[1]}function c(a){var c=N.sqrt(b(a));a[0]&&(a[0]/=c),a[1]&&(a[1]/=c)}a.add=function(a,b,c,d,e,f){var g,h,i,j,k=[[],[],[]],l=[[this.a,this.c,this.e],[this.b,this.d,this.f],[0,0,1]],m=[[a,c,e],[b,d,f],[0,0,1]];for(a&&a instanceof n&&(m=[[a.a,a.c,a.e],[a.b,a.d,a.f],[0,0,1]]),g=0;3>g;g++)for(h=0;3>h;h++){for(j=0,i=0;3>i;i++)j+=l[g][i]*m[i][h];k[g][h]=j}return this.a=k[0][0],this.b=k[1][0],this.c=k[0][1],this.d=k[1][1],this.e=k[0][2],this.f=k[1][2],this},a.invert=function(){var a=this,b=a.a*a.d-a.b*a.c;return new n(a.d/b,-a.b/b,-a.c/b,a.a/b,(a.c*a.f-a.d*a.e)/b,(a.b*a.e-a.a*a.f)/b)},a.clone=function(){return new n(this.a,this.b,this.c,this.d,this.e,this.f)},a.translate=function(a,b){return this.add(1,0,0,1,a,b)},a.scale=function(a,b,c,d){return null==b&&(b=a),(c||d)&&this.add(1,0,0,1,c,d),this.add(a,0,0,b,0,0),(c||d)&&this.add(1,0,0,1,-c,-d),this},a.rotate=function(a,b,c){a=l(a),b=b||0,c=c||0;var d=+N.cos(a).toFixed(9),e=+N.sin(a).toFixed(9);return this.add(d,e,-e,d,b,c),this.add(1,0,0,1,-b,-c)},a.x=function(a,b){return a*this.a+b*this.c+this.e},a.y=function(a,b){return a*this.b+b*this.d+this.f},a.get=function(a){return+this[K.fromCharCode(97+a)].toFixed(4)},a.toString=function(){return"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")"},a.offset=function(){return[this.e.toFixed(4),this.f.toFixed(4)]},a.split=function(){var a={};a.dx=this.e,a.dy=this.f;var d=[[this.a,this.c],[this.b,this.d]];a.scalex=N.sqrt(b(d[0])),c(d[0]),a.shear=d[0][0]*d[1][0]+d[0][1]*d[1][1],d[1]=[d[1][0]-d[0][0]*a.shear,d[1][1]-d[0][1]*a.shear],a.scaley=N.sqrt(b(d[1])),c(d[1]),a.shear/=a.scaley;var e=-d[0][1],f=d[1][1];return 0>f?(a.rotate=m(N.acos(f)),0>e&&(a.rotate=360-a.rotate)):a.rotate=m(N.asin(e)),a.isSimple=!(+a.shear.toFixed(9)||a.scalex.toFixed(9)!=a.scaley.toFixed(9)&&a.rotate),a.isSuperSimple=!+a.shear.toFixed(9)&&a.scalex.toFixed(9)==a.scaley.toFixed(9)&&!a.rotate,a.noRotation=!+a.shear.toFixed(9)&&!a.rotate,a},a.toTransformString=function(a){var b=a||this.split();return b.isSimple?(b.scalex=+b.scalex.toFixed(4),b.scaley=+b.scaley.toFixed(4),b.rotate=+b.rotate.toFixed(4),(b.dx||b.dy?"t"+[+b.dx.toFixed(4),+b.dy.toFixed(4)]:S)+(1!=b.scalex||1!=b.scaley?"s"+[b.scalex,b.scaley,0,0]:S)+(b.rotate?"r"+[+b.rotate.toFixed(4),0,0]:S)):"m"+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)]}}(n.prototype),d.Matrix=n,d.getRGB=j(function(a){if(!a||(a=K(a)).indexOf("-")+1)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:nb};if("none"==a)return{r:-1,g:-1,b:-1,hex:"none",toString:nb};if(!($[J](a.toLowerCase().substring(0,2))||"#"==a.charAt())&&(a=kb(a)),!a)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:nb};var b,c,e,g,h,i,j=a.match(V);return j?(j[2]&&(e=M(j[2].substring(5),16),c=M(j[2].substring(3,5),16),b=M(j[2].substring(1,3),16)),j[3]&&(e=M((h=j[3].charAt(3))+h,16),c=M((h=j[3].charAt(2))+h,16),b=M((h=j[3].charAt(1))+h,16)),j[4]&&(i=j[4].split(Z),b=L(i[0]),"%"==i[0].slice(-1)&&(b*=2.55),c=L(i[1]),"%"==i[1].slice(-1)&&(c*=2.55),e=L(i[2]),"%"==i[2].slice(-1)&&(e*=2.55),"rgba"==j[1].toLowerCase().slice(0,4)&&(g=L(i[3])),i[3]&&"%"==i[3].slice(-1)&&(g/=100)),j[5]?(i=j[5].split(Z),b=L(i[0]),"%"==i[0].slice(-1)&&(b/=100),c=L(i[1]),"%"==i[1].slice(-1)&&(c/=100),e=L(i[2]),"%"==i[2].slice(-1)&&(e/=100),("deg"==i[0].slice(-3)||"°"==i[0].slice(-1))&&(b/=360),"hsba"==j[1].toLowerCase().slice(0,4)&&(g=L(i[3])),i[3]&&"%"==i[3].slice(-1)&&(g/=100),d.hsb2rgb(b,c,e,g)):j[6]?(i=j[6].split(Z),b=L(i[0]),"%"==i[0].slice(-1)&&(b/=100),c=L(i[1]),"%"==i[1].slice(-1)&&(c/=100),e=L(i[2]),"%"==i[2].slice(-1)&&(e/=100),("deg"==i[0].slice(-3)||"°"==i[0].slice(-1))&&(b/=360),"hsla"==j[1].toLowerCase().slice(0,4)&&(g=L(i[3])),i[3]&&"%"==i[3].slice(-1)&&(g/=100),d.hsl2rgb(b,c,e,g)):(b=P(N.round(b),255),c=P(N.round(c),255),e=P(N.round(e),255),g=P(O(g,0),1),j={r:b,g:c,b:e,toString:nb},j.hex="#"+(16777216|e|c<<8|b<<16).toString(16).slice(1),j.opacity=f(g,"finite")?g:1,j)):{r:-1,g:-1,b:-1,hex:"none",error:1,toString:nb}},d),d.hsb=j(function(a,b,c){return d.hsb2rgb(a,b,c).hex}),d.hsl=j(function(a,b,c){return d.hsl2rgb(a,b,c).hex}),d.rgb=j(function(a,b,c,d){if(f(d,"finite")){var e=N.round;return"rgba("+[e(a),e(b),e(c),+d.toFixed(2)]+")"}return"#"+(16777216|c|b<<8|a<<16).toString(16).slice(1)});var kb=function(a){var b=I.doc.getElementsByTagName("head")[0],c="rgb(255, 0, 0)";return kb=j(function(a){if("red"==a.toLowerCase())return c;b.style.color=c,b.style.color=a;var d=I.doc.defaultView.getComputedStyle(b,S).getPropertyValue("color");return d==c?null:d}),kb(a)},lb=function(){return"hsb("+[this.h,this.s,this.b]+")"},mb=function(){return"hsl("+[this.h,this.s,this.l]+")"},nb=function(){return 1==this.opacity||null==this.opacity?this.hex:"rgba("+[this.r,this.g,this.b,this.opacity]+")"},ob=function(a,b,c){if(null==b&&f(a,"object")&&"r"in a&&"g"in a&&"b"in a&&(c=a.b,b=a.g,a=a.r),null==b&&f(a,string)){var e=d.getRGB(a);a=e.r,b=e.g,c=e.b}return(a>1||b>1||c>1)&&(a/=255,b/=255,c/=255),[a,b,c]},pb=function(a,b,c,e){a=N.round(255*a),b=N.round(255*b),c=N.round(255*c);var g={r:a,g:b,b:c,opacity:f(e,"finite")?e:1,hex:d.rgb(a,b,c),toString:nb};return f(e,"finite")&&(g.opacity=e),g};d.color=function(a){var b;return f(a,"object")&&"h"in a&&"s"in a&&"b"in a?(b=d.hsb2rgb(a),a.r=b.r,a.g=b.g,a.b=b.b,a.opacity=1,a.hex=b.hex):f(a,"object")&&"h"in a&&"s"in a&&"l"in a?(b=d.hsl2rgb(a),a.r=b.r,a.g=b.g,a.b=b.b,a.opacity=1,a.hex=b.hex):(f(a,"string")&&(a=d.getRGB(a)),f(a,"object")&&"r"in a&&"g"in a&&"b"in a&&!("error"in a)?(b=d.rgb2hsl(a),a.h=b.h,a.s=b.s,a.l=b.l,b=d.rgb2hsb(a),a.v=b.b):(a={hex:"none"},a.r=a.g=a.b=a.h=a.s=a.v=a.l=-1,a.error=1)),a.toString=nb,a},d.hsb2rgb=function(a,b,c,d){f(a,"object")&&"h"in a&&"s"in a&&"b"in a&&(c=a.b,b=a.s,a=a.h,d=a.o),a*=360;var e,g,h,i,j;return a=a%360/60,j=c*b,i=j*(1-Q(a%2-1)),e=g=h=c-j,a=~~a,e+=[j,i,0,0,i,j][a],g+=[i,j,j,i,0,0][a],h+=[0,0,i,j,j,i][a],pb(e,g,h,d)},d.hsl2rgb=function(a,b,c,d){f(a,"object")&&"h"in a&&"s"in a&&"l"in a&&(c=a.l,b=a.s,a=a.h),(a>1||b>1||c>1)&&(a/=360,b/=100,c/=100),a*=360;var e,g,h,i,j;return a=a%360/60,j=2*b*(.5>c?c:1-c),i=j*(1-Q(a%2-1)),e=g=h=c-j/2,a=~~a,e+=[j,i,0,0,i,j][a],g+=[i,j,j,i,0,0][a],h+=[0,0,i,j,j,i][a],pb(e,g,h,d)},d.rgb2hsb=function(a,b,c){c=ob(a,b,c),a=c[0],b=c[1],c=c[2];var d,e,f,g;return f=O(a,b,c),g=f-P(a,b,c),d=0==g?null:f==a?(b-c)/g:f==b?(c-a)/g+2:(a-b)/g+4,d=60*((d+360)%6)/360,e=0==g?0:g/f,{h:d,s:e,b:f,toString:lb}},d.rgb2hsl=function(a,b,c){c=ob(a,b,c),a=c[0],b=c[1],c=c[2];var d,e,f,g,h,i;return g=O(a,b,c),h=P(a,b,c),i=g-h,d=0==i?null:g==a?(b-c)/i:g==b?(c-a)/i+2:(a-b)/i+4,d=60*((d+360)%6)/360,f=(g+h)/2,e=0==i?0:.5>f?i/(2*f):i/(2-2*f),{h:d,s:e,l:f,toString:mb}},d.parsePathString=function(a){if(!a)return null;var b=d.path(a);if(b.arr)return d.path.clone(b.arr);var c={a:7,c:6,o:2,h:1,l:2,m:2,r:4,q:4,s:4,t:2,v:1,u:3,z:0},e=[];return f(a,"array")&&f(a[0],"array")&&(e=d.path.clone(a)),e.length||K(a).replace(_,function(a,b,d){var f=[],g=b.toLowerCase();if(d.replace(bb,function(a,b){b&&f.push(+b)}),"m"==g&&f.length>2&&(e.push([b].concat(f.splice(0,2))),g="l",b="m"==b?"l":"L"),"o"==g&&1==f.length&&e.push([b,f[0]]),"r"==g)e.push([b].concat(f));else for(;f.length>=c[g]&&(e.push([b].concat(f.splice(0,c[g]))),c[g]););}),e.toString=d.path.toString,b.arr=d.path.clone(e),e};var qb=d.parseTransformString=function(a){if(!a)return null;var b=[];return f(a,"array")&&f(a[0],"array")&&(b=d.path.clone(a)),b.length||K(a).replace(ab,function(a,c,d){var e=[];c.toLowerCase(),d.replace(bb,function(a,b){b&&e.push(+b)}),b.push([c].concat(e))}),b.toString=d.path.toString,b};d._.svgTransform2string=o,d._.rgTransform=new RegExp("^[a-z]["+X+"]*-?\\.?\\d","i"),d._.transform2matrix=p,d._unit2px=s;var rb=I.doc.contains||I.doc.compareDocumentPosition?function(a,b){var c=9==a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a==d||!(!d||1!=d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)for(;b;)if(b=b.parentNode,b==a)return!0;return!1};d._.getSomeDefs=r,d.select=function(a){return z(I.doc.querySelector(a))},d.selectAll=function(a){for(var b=I.doc.querySelectorAll(a),c=(d.set||Array)(),e=0;e<b.length;e++)c.push(z(b[e]));return c},function(a){function g(a){function b(a,b){var c=e(a.node,b);c=c&&c.match(g),c=c&&c[2],c&&"#"==c.charAt()&&(c=c.substring(1),c&&(i[c]=(i[c]||[]).concat(function(c){var d={};d[b]=ib(c),e(a.node,d)})))}function c(a){var b=e(a.node,"xlink:href");b&&"#"==b.charAt()&&(b=b.substring(1),b&&(i[b]=(i[b]||[]).concat(function(b){a.attr("xlink:href","#"+b)})))}for(var d,f=a.selectAll("*"),g=/^\s*url\(("|'|)(.*)\1\)\s*$/,h=[],i={},j=0,k=f.length;k>j;j++){d=f[j],b(d,"fill"),b(d,"stroke"),b(d,"filter"),b(d,"mask"),b(d,"clip-path"),c(d);var l=e(d.node,"id");l&&(e(d.node,{id:d.id}),h.push({old:l,id:d.id}))}for(j=0,k=h.length;k>j;j++){var m=i[h[j].old];if(m)for(var n=0,o=m.length;o>n;n++)m[n](h[j].id)}}function h(a,b,c){return function(d){var e=d.slice(a,b);return 1==e.length&&(e=e[0]),c?c(e):e}}function i(a){return function(){var b=a?"<"+this.type:"",c=this.node.attributes,d=this.node.childNodes;if(a)for(var e=0,f=c.length;f>e;e++)b+=" "+c[e].name+'="'+c[e].value.replace(/"/g,'\\"')+'"';if(d.length){for(a&&(b+=">"),e=0,f=d.length;f>e;e++)3==d[e].nodeType?b+=d[e].nodeValue:1==d[e].nodeType&&(b+=z(d[e]).toString());a&&(b+="</"+this.type+">")}else a&&(b+="/>");return b}}a.attr=function(a,c){var d=this;if(d.node,!a)return d;if(f(a,"string")){if(!(arguments.length>1))return v(b("snap.util.getattr."+a,d));var e={};e[a]=c,a=e}for(var g in a)a[J](g)&&b("snap.util.attr."+g,d,a[g]);return d},a.getBBox=function(a){var b=this;if("use"==b.type&&(b=b.original),b.removed)return{};var c=b._;return a?(c.bboxwt=d.path.get[b.type]?d.path.getBBox(b.realPath=d.path.get[b.type](b)):d._.box(b.node.getBBox()),d._.box(c.bboxwt)):(b.realPath=(d.path.get[b.type]||d.path.get.deflt)(b),c.bbox=d.path.getBBox(d.path.map(b.realPath,b.matrix)),d._.box(c.bbox))};var j=function(){return this.string};a.transform=function(a){var b=this._;if(null==a){var c=new n(this.node.getCTM()),d=q(this),f=d.toTransformString(),g=K(d)==K(this.matrix)?b.transform:f;return{string:g,globalMatrix:c,localMatrix:d,diffMatrix:c.clone().add(d.invert()),global:c.toTransformString(),local:f,toString:j}}return a instanceof n&&(a=a.toTransformString()),q(this,a),this.node&&("linearGradient"==this.type||"radialGradient"==this.type?e(this.node,{gradientTransform:this.matrix}):"pattern"==this.type?e(this.node,{patternTransform:this.matrix}):e(this.node,{transform:this.matrix})),this},a.parent=function(){return z(this.node.parentNode)},a.append=a.add=function(a){if(a){if("set"==a.type){var b=this;return a.forEach(function(a){b.add(a)}),this}a=z(a),this.node.appendChild(a.node),a.paper=this.paper}return this},a.appendTo=function(a){return a&&(a=z(a),a.append(this)),this},a.prepend=function(a){if(a){a=z(a);var b=a.parent();this.node.insertBefore(a.node,this.node.firstChild),this.add&&this.add(),a.paper=this.paper,this.parent()&&this.parent().add(),b&&b.add()}return this},a.prependTo=function(a){return a=z(a),a.prepend(this),this},a.before=function(a){if("set"==a.type){var b=this;return a.forEach(function(a){var c=a.parent();b.node.parentNode.insertBefore(a.node,b.node),c&&c.add()}),this.parent().add(),this}a=z(a);var c=a.parent();return this.node.parentNode.insertBefore(a.node,this.node),this.parent()&&this.parent().add(),c&&c.add(),a.paper=this.paper,this},a.after=function(a){a=z(a);var b=a.parent();return this.node.nextSibling?this.node.parentNode.insertBefore(a.node,this.node.nextSibling):this.node.parentNode.appendChild(a.node),this.parent()&&this.parent().add(),b&&b.add(),a.paper=this.paper,this},a.insertBefore=function(a){a=z(a);var b=this.parent();return a.node.parentNode.insertBefore(this.node,a.node),this.paper=a.paper,b&&b.add(),a.parent()&&a.parent().add(),this},a.insertAfter=function(a){a=z(a);var b=this.parent();return a.node.parentNode.insertBefore(this.node,a.node.nextSibling),this.paper=a.paper,b&&b.add(),a.parent()&&a.parent().add(),this},a.remove=function(){var a=this.parent();return this.node.parentNode&&this.node.parentNode.removeChild(this.node),delete this.paper,this.removed=!0,a&&a.add(),this},a.select=function(a){return z(this.node.querySelector(a))},a.selectAll=function(a){for(var b=this.node.querySelectorAll(a),c=(d.set||Array)(),e=0;e<b.length;e++)c.push(z(b[e]));return c},a.asPX=function(a,b){return null==b&&(b=this.attr(a)),+s(this,a,b)},a.use=function(){var a,b=this.node.id;return b||(b=this.id,e(this.node,{id:b})),a="linearGradient"==this.type||"radialGradient"==this.type||"pattern"==this.type?x(this.type,this.node.parentNode):x("use",this.node.parentNode),e(a.node,{"xlink:href":"#"+b}),a.original=this,a},a.clone=function(){var a=z(this.node.cloneNode(!0));return e(a.node,"id")&&e(a.node,{id:a.id}),g(a),a.insertAfter(this),a},a.toDefs=function(){var a=r(this);return a.appendChild(this.node),this},a.pattern=function(a,b,c,d){var g=x("pattern",r(this));return null==a&&(a=this.getBBox()),f(a,"object")&&"x"in a&&(b=a.y,c=a.width,d=a.height,a=a.x),e(g.node,{x:a,y:b,width:c,height:d,patternUnits:"userSpaceOnUse",id:g.id,viewBox:[a,b,c,d].join(" ")}),g.node.appendChild(this.node),g},a.marker=function(a,b,c,d,g,h){var i=x("marker",r(this));return null==a&&(a=this.getBBox()),f(a,"object")&&"x"in a&&(b=a.y,c=a.width,d=a.height,g=a.refX||a.cx,h=a.refY||a.cy,a=a.x),e(i.node,{viewBox:[a,b,c,d].join(T),markerWidth:c,markerHeight:d,orient:"auto",refX:g||0,refY:h||0,id:i.id}),i.node.appendChild(this.node),i};var k=function(a,b,d,e){"function"!=typeof d||d.length||(e=d,d=c.linear),this.attr=a,this.dur=b,d&&(this.easing=d),e&&(this.callback=e)};d.animation=function(a,b,c,d){return new k(a,b,c,d)},a.inAnim=function(){var a=this,b=[];for(var c in a.anims)a.anims[J](c)&&!function(a){b.push({anim:new k(a._attrs,a.dur,a.easing,a._callback),curStatus:a.status(),status:function(b){return a.status(b)},stop:function(){a.stop()}})}(a.anims[c]);return b},d.animate=function(a,d,e,f,g,h){"function"!=typeof g||g.length||(h=g,g=c.linear);var i=c.time(),j=c(a,d,i,i+f,c.time,e,g);return h&&b.once("mina.finish."+j.id,h),j},a.stop=function(){for(var a=this.inAnim(),b=0,c=a.length;c>b;b++)a[b].stop();return this},a.animate=function(a,d,e,g){"function"!=typeof e||e.length||(g=e,e=c.linear),a instanceof k&&(g=a.callback,e=a.easing,d=e.dur,a=a.attr);var i,j,l,m,n=[],o=[],p={},q=this;for(var r in a)if(a[J](r)){q.equal?(m=q.equal(r,K(a[r])),i=m.from,j=m.to,l=m.f):(i=+q.attr(r),j=+a[r]);var s=f(i,"array")?i.length:1;p[r]=h(n.length,n.length+s,l),n=n.concat(i),o=o.concat(j)}var t=c.time(),u=c(n,o,t,t+d,c.time,function(a){var b={};for(var c in p)p[J](c)&&(b[c]=p[c](a));q.attr(b)},e);return q.anims[u.id]=u,u._attrs=a,u._callback=g,b.once("mina.finish."+u.id,function(){delete q.anims[u.id],g&&g.call(q)}),b.once("mina.stop."+u.id,function(){delete q.anims[u.id]}),q};var l={};a.data=function(a,c){var e=l[this.id]=l[this.id]||{};if(0==arguments.length)return b("snap.data.get."+this.id,this,e,null),e;if(1==arguments.length){if(d.is(a,"object")){for(var f in a)a[J](f)&&this.data(f,a[f]);return this}return b("snap.data.get."+this.id,this,e[a],a),e[a]}return e[a]=c,b("snap.data.set."+this.id,this,c,a),this},a.removeData=function(a){return null==a?l[this.id]={}:l[this.id]&&delete l[this.id][a],this},a.outerSVG=a.toString=i(1),a.innerSVG=i()}(u.prototype),d.parse=function(a){var b=I.doc.createDocumentFragment(),c=!0,d=I.doc.createElement("div");if(a=K(a),a.match(/^\s*<\s*svg(?:\s|>)/)||(a="<svg>"+a+"</svg>",c=!1),d.innerHTML=a,a=d.getElementsByTagName("svg")[0])if(c)b=a;else for(;a.firstChild;)b.appendChild(a.firstChild);return d.innerHTML=S,new w(b)},w.prototype.select=u.prototype.select,w.prototype.selectAll=u.prototype.selectAll,d.fragment=function(){for(var a=Array.prototype.slice.call(arguments,0),b=I.doc.createDocumentFragment(),c=0,e=a.length;e>c;c++){var f=a[c];f.node&&f.node.nodeType&&b.appendChild(f.node),f.nodeType&&b.appendChild(f),"string"==typeof f&&b.appendChild(d.parse(f).node)}return new w(b)},function(a){a.el=function(a,b){return x(a,this.node).attr(b)},a.rect=function(a,b,c,d,e,g){var h;return null==g&&(g=e),f(a,"object")&&"x"in a?h=a:null!=a&&(h={x:a,y:b,width:c,height:d},null!=e&&(h.rx=e,h.ry=g)),this.el("rect",h)},a.circle=function(a,b,c){var d;return f(a,"object")&&"cx"in a?d=a:null!=a&&(d={cx:a,cy:b,r:c}),this.el("circle",d)},a.image=function(a,b,c,d,g){var h=x("image",this.node);if(f(a,"object")&&"src"in a)h.attr(a);else if(null!=a){var i={"xlink:href":a,preserveAspectRatio:"none"};null!=b&&null!=c&&(i.x=b,i.y=c),null!=d&&null!=g?(i.width=d,i.height=g):jb(a,function(){e(h.node,{width:this.offsetWidth,height:this.offsetHeight})}),e(h.node,i)}return h},a.ellipse=function(a,b,c,d){var e=x("ellipse",this.node);
return f(a,"object")&&"cx"in a?e.attr(a):null!=a&&e.attr({cx:a,cy:b,rx:c,ry:d}),e},a.path=function(a){var b=x("path",this.node);return f(a,"object")&&!f(a,"array")?b.attr(a):a&&b.attr({d:a}),b},a.group=a.g=function(b){var c=x("g",this.node);c.add=t;for(var d in a)a[J](d)&&(c[d]=a[d]);return 1==arguments.length&&b&&!b.type?c.attr(b):arguments.length&&c.add(Array.prototype.slice.call(arguments,0)),c},a.text=function(a,b,c){var d=x("text",this.node);return f(a,"object")?d.attr(a):null!=a&&d.attr({x:a,y:b,text:c||""}),d},a.line=function(a,b,c,d){var e=x("line",this.node);return f(a,"object")?e.attr(a):null!=a&&e.attr({x1:a,x2:c,y1:b,y2:d}),e},a.polyline=function(a){arguments.length>1&&(a=Array.prototype.slice.call(arguments,0));var b=x("polyline",this.node);return f(a,"object")&&!f(a,"array")?b.attr(a):null!=a&&b.attr({points:a}),b},a.polygon=function(a){arguments.length>1&&(a=Array.prototype.slice.call(arguments,0));var b=x("polygon",this.node);return f(a,"object")&&!f(a,"array")?b.attr(a):null!=a&&b.attr({points:a}),b},function(){a.gradient=function(a){return D(this.defs,a)},a.gradientLinear=function(a,b,c,d){return E(this.defs,a,b,c,d)},a.gradientRadial=function(a,b,c,d,e){return F(this.defs,a,b,c,d,e)},a.toString=function(){var a,b=I.doc.createDocumentFragment(),c=I.doc.createElement("div"),d=this.node.cloneNode(!0);return b.appendChild(c),c.appendChild(d),e(d,{xmlns:gb}),a=c.innerHTML,b.removeChild(b.firstChild),a},a.clear=function(){for(var a,b=this.node.firstChild;b;)a=b.nextSibling,"defs"!=b.tagName&&b.parentNode.removeChild(b),b=a}}()}(y.prototype),d.ajax=function(a,c,d,e){var g=new XMLHttpRequest,h=eb();if(g){if(f(c,"function"))e=d,d=c,c=null;else if(f(c,"object")){var i=[];for(var j in c)c.hasOwnProperty(j)&&i.push(encodeURIComponent(j)+"="+encodeURIComponent(c[j]));c=i.join("&")}return g.open(c?"POST":"GET",a,!0),g.setRequestHeader("X-Requested-With","XMLHttpRequest"),c&&g.setRequestHeader("Content-type","application/x-www-form-urlencoded"),d&&(b.once("snap.ajax."+h+".0",d),b.once("snap.ajax."+h+".200",d),b.once("snap.ajax."+h+".304",d)),g.onreadystatechange=function(){4==g.readyState&&b("snap.ajax."+h+"."+g.status,e,g)},4==g.readyState?g:(g.send(c),g)}},d.load=function(a,b,c){d.ajax(a,function(a){var e=d.parse(a.responseText);c?b.call(c,e):b(e)})},b.on("snap.util.attr.mask",function(a){if(a instanceof u||a instanceof w){if(b.stop(),a instanceof w&&1==a.node.childNodes.length&&(a=a.node.firstChild,r(this).appendChild(a),a=z(a)),"mask"==a.type)var c=a;else c=x("mask",r(this)),c.node.appendChild(a.node),!c.node.id&&e(c.node,{id:c.id});e(this.node,{mask:ib(c.id)})}}),function(a){b.on("snap.util.attr.clip",a),b.on("snap.util.attr.clip-path",a),b.on("snap.util.attr.clipPath",a)}(function(a){if(a instanceof u||a instanceof w){if(b.stop(),"clipPath"==a.type)var c=a;else c=x("clipPath",r(this)),c.node.appendChild(a.node),!c.node.id&&e(c.node,{id:c.id});e(this.node,{"clip-path":ib(c.id)})}}),b.on("snap.util.attr.fill",G("fill")),b.on("snap.util.attr.stroke",G("stroke"));var sb=/^([lr])(?:\(([^)]*)\))?(.*)$/i;b.on("snap.util.grad.parse",function(a){a=K(a);var b=a.match(sb);if(!b)return null;var c=b[1],d=b[2],e=b[3];return d=d.split(/\s*,\s*/).map(function(a){return+a==a?+a:a}),1==d.length&&0==d[0]&&(d=[]),e=e.split("-"),e=e.map(function(a){a=a.split(":");var b={color:a[0]};return a[1]&&(b.offset=a[1]),b}),{type:c,params:d,stops:e}}),b.on("snap.util.attr.d",function(a){b.stop(),f(a,"array")&&f(a[0],"array")&&(a=d.path.toString.call(a)),a=K(a),a.match(/[ruo]/i)&&(a=d.path.toAbsolute(a)),e(this.node,{d:a})})(-1),b.on("snap.util.attr.#text",function(a){b.stop(),a=K(a);for(var c=I.doc.createTextNode(a);this.node.firstChild;)this.node.removeChild(this.node.firstChild);this.node.appendChild(c)})(-1),b.on("snap.util.attr.path",function(a){b.stop(),this.attr({d:a})})(-1),b.on("snap.util.attr.viewBox",function(a){var c;c=f(a,"object")&&"x"in a?[a.x,a.y,a.width,a.height].join(" "):f(a,"array")?a.join(" "):a,e(this.node,{viewBox:c}),b.stop()})(-1),b.on("snap.util.attr.transform",function(a){this.transform(a),b.stop()})(-1),b.on("snap.util.attr.r",function(a){"rect"==this.type&&(b.stop(),e(this.node,{rx:a,ry:a}))})(-1),b.on("snap.util.attr.textpath",function(a){if(b.stop(),"text"==this.type){var c,d,g;if(!a&&this.textPath){for(d=this.textPath;d.node.firstChild;)this.node.appendChild(d.node.firstChild);return d.remove(),delete this.textPath,void 0}if(f(a,"string")){var h=r(this),i=z(h.parentNode).path(a);h.appendChild(i.node),c=i.id,i.attr({id:c})}else a=z(a),a instanceof u&&(c=a.attr("id"),c||(c=a.id,a.attr({id:c})));if(c)if(d=this.textPath,g=this.node,d)d.attr({"xlink:href":"#"+c});else{for(d=e("textPath",{"xlink:href":"#"+c});g.firstChild;)d.appendChild(g.firstChild);g.appendChild(d),this.textPath=z(d)}}})(-1),b.on("snap.util.attr.text",function(a){if("text"==this.type){for(var c=this.node,d=function(a){var b=e("tspan");if(f(a,"array"))for(var c=0;c<a.length;c++)b.appendChild(d(a[c]));else b.appendChild(I.doc.createTextNode(a));return b.normalize&&b.normalize(),b};c.firstChild;)c.removeChild(c.firstChild);for(var g=d(a);g.firstChild;)c.appendChild(g.firstChild)}b.stop()})(-1);var tb={"alignment-baseline":0,"baseline-shift":0,clip:0,"clip-path":0,"clip-rule":0,color:0,"color-interpolation":0,"color-interpolation-filters":0,"color-profile":0,"color-rendering":0,cursor:0,direction:0,display:0,"dominant-baseline":0,"enable-background":0,fill:0,"fill-opacity":0,"fill-rule":0,filter:0,"flood-color":0,"flood-opacity":0,font:0,"font-family":0,"font-size":0,"font-size-adjust":0,"font-stretch":0,"font-style":0,"font-variant":0,"font-weight":0,"glyph-orientation-horizontal":0,"glyph-orientation-vertical":0,"image-rendering":0,kerning:0,"letter-spacing":0,"lighting-color":0,marker:0,"marker-end":0,"marker-mid":0,"marker-start":0,mask:0,opacity:0,overflow:0,"pointer-events":0,"shape-rendering":0,"stop-color":0,"stop-opacity":0,stroke:0,"stroke-dasharray":0,"stroke-dashoffset":0,"stroke-linecap":0,"stroke-linejoin":0,"stroke-miterlimit":0,"stroke-opacity":0,"stroke-width":0,"text-anchor":0,"text-decoration":0,"text-rendering":0,"unicode-bidi":0,visibility:0,"word-spacing":0,"writing-mode":0};b.on("snap.util.attr",function(a){var c=b.nt(),d={};c=c.substring(c.lastIndexOf(".")+1),d[c]=a;var f=c.replace(/-(\w)/gi,function(a,b){return b.toUpperCase()}),g=c.replace(/[A-Z]/g,function(a){return"-"+a.toLowerCase()});tb[J](g)?this.node.style[f]=null==a?S:a:e(this.node,d)}),b.on("snap.util.getattr.transform",function(){return b.stop(),this.transform()})(-1),b.on("snap.util.getattr.textpath",function(){return b.stop(),this.textPath})(-1),function(){function a(a){return function(){b.stop();var c=I.doc.defaultView.getComputedStyle(this.node,null).getPropertyValue("marker-"+a);return"none"==c?c:d(I.doc.getElementById(c.match(W)[1]))}}function c(a){return function(c){b.stop();var d="marker"+a.charAt(0).toUpperCase()+a.substring(1);if(""==c||!c)return this.node.style[d]="none",void 0;if("marker"==c.type){var f=c.node.id;return f||e(c.node,{id:c.id}),this.node.style[d]=ib(f),void 0}}}b.on("snap.util.getattr.marker-end",a("end"))(-1),b.on("snap.util.getattr.markerEnd",a("end"))(-1),b.on("snap.util.getattr.marker-start",a("start"))(-1),b.on("snap.util.getattr.markerStart",a("start"))(-1),b.on("snap.util.getattr.marker-mid",a("mid"))(-1),b.on("snap.util.getattr.markerMid",a("mid"))(-1),b.on("snap.util.attr.marker-end",c("end"))(-1),b.on("snap.util.attr.markerEnd",c("end"))(-1),b.on("snap.util.attr.marker-start",c("start"))(-1),b.on("snap.util.attr.markerStart",c("start"))(-1),b.on("snap.util.attr.marker-mid",c("mid"))(-1),b.on("snap.util.attr.markerMid",c("mid"))(-1)}(),b.on("snap.util.getattr.r",function(){return"rect"==this.type&&e(this.node,"rx")==e(this.node,"ry")?(b.stop(),e(this.node,"rx")):void 0})(-1),b.on("snap.util.getattr.text",function(){if("text"==this.type||"tspan"==this.type){b.stop();var a=H(this.node);return 1==a.length?a[0]:a}})(-1),b.on("snap.util.getattr.#text",function(){return this.node.textContent})(-1),b.on("snap.util.getattr.viewBox",function(){b.stop();var a=e(this.node,"viewBox").split(Y);return d._.box(+a[0],+a[1],+a[2],+a[3])})(-1),b.on("snap.util.getattr.points",function(){var a=e(this.node,"points");return b.stop(),a.split(Y)}),b.on("snap.util.getattr.path",function(){var a=e(this.node,"d");return b.stop(),a}),b.on("snap.util.getattr",function(){var a=b.nt();a=a.substring(a.lastIndexOf(".")+1);var c=a.replace(/[A-Z]/g,function(a){return"-"+a.toLowerCase()});return tb[J](c)?I.doc.defaultView.getComputedStyle(this.node,null).getPropertyValue(c):e(this.node,a)});var ub=function(a){var b=a.getBoundingClientRect(),c=a.ownerDocument,d=c.body,e=c.documentElement,f=e.clientTop||d.clientTop||0,h=e.clientLeft||d.clientLeft||0,i=b.top+(g.win.pageYOffset||e.scrollTop||d.scrollTop)-f,j=b.left+(g.win.pageXOffset||e.scrollLeft||d.scrollLeft)-h;return{y:i,x:j}};return d.getElementByPoint=function(a,b){var c=this,d=(c.canvas,I.doc.elementFromPoint(a,b));if(I.win.opera&&"svg"==d.tagName){var e=ub(d),f=d.createSVGRect();f.x=a-e.x,f.y=b-e.y,f.width=f.height=1;var g=d.getIntersectionList(f,null);g.length&&(d=g[g.length-1])}return d?z(d):null},d.plugin=function(a){a(d,u,y,I)},I.win.Snap=d,d}();return d.plugin(function(a,b){function c(a){var b=c.ps=c.ps||{};return b[a]?b[a].sleep=100:b[a]={sleep:100},setTimeout(function(){for(var c in b)b[L](c)&&c!=a&&(b[c].sleep--,!b[c].sleep&&delete b[c])}),b[a]}function d(a,b,c,d){return null==a&&(a=b=c=d=0),null==b&&(b=a.y,c=a.width,d=a.height,a=a.x),{x:a,y:b,width:c,w:c,height:d,h:d,x2:a+c,y2:b+d,cx:a+c/2,cy:b+d/2,r1:O.min(c,d)/2,r2:O.max(c,d)/2,r0:O.sqrt(c*c+d*d)/2,path:w(a,b,c,d),vb:[a,b,c,d].join(" ")}}function e(){return this.join(",").replace(M,"$1")}function f(a){var b=K(a);return b.toString=e,b}function g(a,b,c,d,e,f,g,h,j){return null==j?n(a,b,c,d,e,f,g,h):i(a,b,c,d,e,f,g,h,o(a,b,c,d,e,f,g,h,j))}function h(c,d){function e(a){return+(+a).toFixed(3)}return a._.cacher(function(a,f,h){a instanceof b&&(a=a.attr("d")),a=F(a);for(var j,k,l,m,n,o="",p={},q=0,r=0,s=a.length;s>r;r++){if(l=a[r],"M"==l[0])j=+l[1],k=+l[2];else{if(m=g(j,k,l[1],l[2],l[3],l[4],l[5],l[6]),q+m>f){if(d&&!p.start){if(n=g(j,k,l[1],l[2],l[3],l[4],l[5],l[6],f-q),o+=["C"+e(n.start.x),e(n.start.y),e(n.m.x),e(n.m.y),e(n.x),e(n.y)],h)return o;p.start=o,o=["M"+e(n.x),e(n.y)+"C"+e(n.n.x),e(n.n.y),e(n.end.x),e(n.end.y),e(l[5]),e(l[6])].join(),q+=m,j=+l[5],k=+l[6];continue}if(!c&&!d)return n=g(j,k,l[1],l[2],l[3],l[4],l[5],l[6],f-q)}q+=m,j=+l[5],k=+l[6]}o+=l.shift()+l}return p.end=o,n=c?q:d?p:i(j,k,l[0],l[1],l[2],l[3],l[4],l[5],1)},null,a._.clone)}function i(a,b,c,d,e,f,g,h,i){var j=1-i,k=S(j,3),l=S(j,2),m=i*i,n=m*i,o=k*a+3*l*i*c+3*j*i*i*e+n*g,p=k*b+3*l*i*d+3*j*i*i*f+n*h,q=a+2*i*(c-a)+m*(e-2*c+a),r=b+2*i*(d-b)+m*(f-2*d+b),s=c+2*i*(e-c)+m*(g-2*e+c),t=d+2*i*(f-d)+m*(h-2*f+d),u=j*a+i*c,v=j*b+i*d,w=j*e+i*g,x=j*f+i*h,y=90-180*O.atan2(q-s,r-t)/P;return{x:o,y:p,m:{x:q,y:r},n:{x:s,y:t},start:{x:u,y:v},end:{x:w,y:x},alpha:y}}function j(b,c,e,f,g,h,i,j){a.is(b,"array")||(b=[b,c,e,f,g,h,i,j]);var k=E.apply(null,b);return d(k.min.x,k.min.y,k.max.x-k.min.x,k.max.y-k.min.y)}function k(a,b,c){return b>=a.x&&b<=a.x+a.width&&c>=a.y&&c<=a.y+a.height}function l(a,b){return a=d(a),b=d(b),k(b,a.x,a.y)||k(b,a.x2,a.y)||k(b,a.x,a.y2)||k(b,a.x2,a.y2)||k(a,b.x,b.y)||k(a,b.x2,b.y)||k(a,b.x,b.y2)||k(a,b.x2,b.y2)||(a.x<b.x2&&a.x>b.x||b.x<a.x2&&b.x>a.x)&&(a.y<b.y2&&a.y>b.y||b.y<a.y2&&b.y>a.y)}function m(a,b,c,d,e){var f=-3*b+9*c-9*d+3*e,g=a*f+6*b-12*c+6*d;return a*g-3*b+3*c}function n(a,b,c,d,e,f,g,h,i){null==i&&(i=1),i=i>1?1:0>i?0:i;for(var j=i/2,k=12,l=[-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816],n=[.2491,.2491,.2335,.2335,.2032,.2032,.1601,.1601,.1069,.1069,.0472,.0472],o=0,p=0;k>p;p++){var q=j*l[p]+j,r=m(q,a,c,e,g),s=m(q,b,d,f,h),t=r*r+s*s;o+=n[p]*O.sqrt(t)}return j*o}function o(a,b,c,d,e,f,g,h,i){if(!(0>i||n(a,b,c,d,e,f,g,h)<i)){var j,k=1,l=k/2,m=k-l,o=.01;for(j=n(a,b,c,d,e,f,g,h,m);T(j-i)>o;)l/=2,m+=(i>j?1:-1)*l,j=n(a,b,c,d,e,f,g,h,m);return m}}function p(a,b,c,d,e,f,g,h){if(!(R(a,c)<Q(e,g)||Q(a,c)>R(e,g)||R(b,d)<Q(f,h)||Q(b,d)>R(f,h))){var i=(a*d-b*c)*(e-g)-(a-c)*(e*h-f*g),j=(a*d-b*c)*(f-h)-(b-d)*(e*h-f*g),k=(a-c)*(f-h)-(b-d)*(e-g);if(k){var l=i/k,m=j/k,n=+l.toFixed(2),o=+m.toFixed(2);if(!(n<+Q(a,c).toFixed(2)||n>+R(a,c).toFixed(2)||n<+Q(e,g).toFixed(2)||n>+R(e,g).toFixed(2)||o<+Q(b,d).toFixed(2)||o>+R(b,d).toFixed(2)||o<+Q(f,h).toFixed(2)||o>+R(f,h).toFixed(2)))return{x:l,y:m}}}}function q(a,b,c){var d=j(a),e=j(b);if(!l(d,e))return c?0:[];for(var f=n.apply(0,a),g=n.apply(0,b),h=~~(f/5),k=~~(g/5),m=[],o=[],q={},r=c?0:[],s=0;h+1>s;s++){var t=i.apply(0,a.concat(s/h));m.push({x:t.x,y:t.y,t:s/h})}for(s=0;k+1>s;s++)t=i.apply(0,b.concat(s/k)),o.push({x:t.x,y:t.y,t:s/k});for(s=0;h>s;s++)for(var u=0;k>u;u++){var v=m[s],w=m[s+1],x=o[u],y=o[u+1],z=T(w.x-v.x)<.001?"y":"x",A=T(y.x-x.x)<.001?"y":"x",B=p(v.x,v.y,w.x,w.y,x.x,x.y,y.x,y.y);if(B){if(q[B.x.toFixed(4)]==B.y.toFixed(4))continue;q[B.x.toFixed(4)]=B.y.toFixed(4);var C=v.t+T((B[z]-v[z])/(w[z]-v[z]))*(w.t-v.t),D=x.t+T((B[A]-x[A])/(y[A]-x[A]))*(y.t-x.t);C>=0&&1>=C&&D>=0&&1>=D&&(c?r++:r.push({x:B.x,y:B.y,t1:C,t2:D}))}}return r}function r(a,b){return t(a,b)}function s(a,b){return t(a,b,1)}function t(a,b,c){a=F(a),b=F(b);for(var d,e,f,g,h,i,j,k,l,m,n=c?0:[],o=0,p=a.length;p>o;o++){var r=a[o];if("M"==r[0])d=h=r[1],e=i=r[2];else{"C"==r[0]?(l=[d,e].concat(r.slice(1)),d=l[6],e=l[7]):(l=[d,e,d,e,h,i,h,i],d=h,e=i);for(var s=0,t=b.length;t>s;s++){var u=b[s];if("M"==u[0])f=j=u[1],g=k=u[2];else{"C"==u[0]?(m=[f,g].concat(u.slice(1)),f=m[6],g=m[7]):(m=[f,g,f,g,j,k,j,k],f=j,g=k);var v=q(l,m,c);if(c)n+=v;else{for(var w=0,x=v.length;x>w;w++)v[w].segment1=o,v[w].segment2=s,v[w].bez1=l,v[w].bez2=m;n=n.concat(v)}}}}}return n}function u(a,b,c){var d=v(a);return k(d,b,c)&&1==t(a,[["M",b,c],["H",d.x2+10]],1)%2}function v(a){var b=c(a);if(b.bbox)return K(b.bbox);if(!a)return d();a=F(a);for(var e,f=0,g=0,h=[],i=[],j=0,k=a.length;k>j;j++)if(e=a[j],"M"==e[0])f=e[1],g=e[2],h.push(f),i.push(g);else{var l=E(f,g,e[1],e[2],e[3],e[4],e[5],e[6]);h=h.concat(l.min.x,l.max.x),i=i.concat(l.min.y,l.max.y),f=e[5],g=e[6]}var m=Q.apply(0,h),n=Q.apply(0,i),o=R.apply(0,h),p=R.apply(0,i),q=d(m,n,o-m,p-n);return b.bbox=K(q),q}function w(a,b,c,d,f){if(f)return[["M",a+f,b],["l",c-2*f,0],["a",f,f,0,0,1,f,f],["l",0,d-2*f],["a",f,f,0,0,1,-f,f],["l",2*f-c,0],["a",f,f,0,0,1,-f,-f],["l",0,2*f-d],["a",f,f,0,0,1,f,-f],["z"]];var g=[["M",a,b],["l",c,0],["l",0,d],["l",-c,0],["z"]];return g.toString=e,g}function x(a,b,c,d,f){if(null==f&&null==d&&(d=c),null!=f)var g=Math.PI/180,h=a+c*Math.cos(-d*g),i=a+c*Math.cos(-f*g),j=b+c*Math.sin(-d*g),k=b+c*Math.sin(-f*g),l=[["M",h,j],["A",c,c,0,+(f-d>180),0,i,k]];else l=[["M",a,b],["m",0,-d],["a",c,d,0,1,1,0,2*d],["a",c,d,0,1,1,0,-2*d],["z"]];return l.toString=e,l}function y(b){var d=c(b),g=String.prototype.toLowerCase;if(d.rel)return f(d.rel);a.is(b,"array")&&a.is(b&&b[0],"array")||(b=a.parsePathString(b));var h=[],i=0,j=0,k=0,l=0,m=0;"M"==b[0][0]&&(i=b[0][1],j=b[0][2],k=i,l=j,m++,h.push(["M",i,j]));for(var n=m,o=b.length;o>n;n++){var p=h[n]=[],q=b[n];if(q[0]!=g.call(q[0]))switch(p[0]=g.call(q[0]),p[0]){case"a":p[1]=q[1],p[2]=q[2],p[3]=q[3],p[4]=q[4],p[5]=q[5],p[6]=+(q[6]-i).toFixed(3),p[7]=+(q[7]-j).toFixed(3);break;case"v":p[1]=+(q[1]-j).toFixed(3);break;case"m":k=q[1],l=q[2];default:for(var r=1,s=q.length;s>r;r++)p[r]=+(q[r]-(r%2?i:j)).toFixed(3)}else{p=h[n]=[],"m"==q[0]&&(k=q[1]+i,l=q[2]+j);for(var t=0,u=q.length;u>t;t++)h[n][t]=q[t]}var v=h[n].length;switch(h[n][0]){case"z":i=k,j=l;break;case"h":i+=+h[n][v-1];break;case"v":j+=+h[n][v-1];break;default:i+=+h[n][v-2],j+=+h[n][v-1]}}return h.toString=e,d.rel=f(h),h}function z(b){var d=c(b);if(d.abs)return f(d.abs);if(J(b,"array")&&J(b&&b[0],"array")||(b=a.parsePathString(b)),!b||!b.length)return[["M",0,0]];var g,h=[],i=0,j=0,k=0,l=0,m=0;"M"==b[0][0]&&(i=+b[0][1],j=+b[0][2],k=i,l=j,m++,h[0]=["M",i,j]);for(var n,o,p=3==b.length&&"M"==b[0][0]&&"R"==b[1][0].toUpperCase()&&"Z"==b[2][0].toUpperCase(),q=m,r=b.length;r>q;q++){if(h.push(n=[]),o=b[q],g=o[0],g!=g.toUpperCase())switch(n[0]=g.toUpperCase(),n[0]){case"A":n[1]=o[1],n[2]=o[2],n[3]=o[3],n[4]=o[4],n[5]=o[5],n[6]=+(o[6]+i),n[7]=+(o[7]+j);break;case"V":n[1]=+o[1]+j;break;case"H":n[1]=+o[1]+i;break;case"R":for(var s=[i,j].concat(o.slice(1)),t=2,u=s.length;u>t;t++)s[t]=+s[t]+i,s[++t]=+s[t]+j;h.pop(),h=h.concat(H(s,p));break;case"O":h.pop(),s=x(i,j,o[1],o[2]),s.push(s[0]),h=h.concat(s);break;case"U":h.pop(),h=h.concat(x(i,j,o[1],o[2],o[3])),n=["U"].concat(h[h.length-1].slice(-2));break;case"M":k=+o[1]+i,l=+o[2]+j;default:for(t=1,u=o.length;u>t;t++)n[t]=+o[t]+(t%2?i:j)}else if("R"==g)s=[i,j].concat(o.slice(1)),h.pop(),h=h.concat(H(s,p)),n=["R"].concat(o.slice(-2));else if("O"==g)h.pop(),s=x(i,j,o[1],o[2]),s.push(s[0]),h=h.concat(s);else if("U"==g)h.pop(),h=h.concat(x(i,j,o[1],o[2],o[3])),n=["U"].concat(h[h.length-1].slice(-2));else for(var v=0,w=o.length;w>v;v++)n[v]=o[v];if(g=g.toUpperCase(),"O"!=g)switch(n[0]){case"Z":i=k,j=l;break;case"H":i=n[1];break;case"V":j=n[1];break;case"M":k=n[n.length-2],l=n[n.length-1];default:i=n[n.length-2],j=n[n.length-1]}}return h.toString=e,d.abs=f(h),h}function A(a,b,c,d){return[a,b,c,d,c,d]}function B(a,b,c,d,e,f){var g=1/3,h=2/3;return[g*a+h*c,g*b+h*d,g*e+h*c,g*f+h*d,e,f]}function C(b,c,d,e,f,g,h,i,j,k){var l,m=120*P/180,n=P/180*(+f||0),o=[],p=a._.cacher(function(a,b,c){var d=a*O.cos(c)-b*O.sin(c),e=a*O.sin(c)+b*O.cos(c);return{x:d,y:e}});if(k)y=k[0],z=k[1],w=k[2],x=k[3];else{l=p(b,c,-n),b=l.x,c=l.y,l=p(i,j,-n),i=l.x,j=l.y;var q=(O.cos(P/180*f),O.sin(P/180*f),(b-i)/2),r=(c-j)/2,s=q*q/(d*d)+r*r/(e*e);s>1&&(s=O.sqrt(s),d=s*d,e=s*e);var t=d*d,u=e*e,v=(g==h?-1:1)*O.sqrt(T((t*u-t*r*r-u*q*q)/(t*r*r+u*q*q))),w=v*d*r/e+(b+i)/2,x=v*-e*q/d+(c+j)/2,y=O.asin(((c-x)/e).toFixed(9)),z=O.asin(((j-x)/e).toFixed(9));y=w>b?P-y:y,z=w>i?P-z:z,0>y&&(y=2*P+y),0>z&&(z=2*P+z),h&&y>z&&(y-=2*P),!h&&z>y&&(z-=2*P)}var A=z-y;if(T(A)>m){var B=z,D=i,E=j;z=y+m*(h&&z>y?1:-1),i=w+d*O.cos(z),j=x+e*O.sin(z),o=C(i,j,d,e,f,0,h,D,E,[z,B,w,x])}A=z-y;var F=O.cos(y),G=O.sin(y),H=O.cos(z),I=O.sin(z),J=O.tan(A/4),K=4/3*d*J,L=4/3*e*J,M=[b,c],N=[b+K*G,c-L*F],Q=[i+K*I,j-L*H],R=[i,j];if(N[0]=2*M[0]-N[0],N[1]=2*M[1]-N[1],k)return[N,Q,R].concat(o);o=[N,Q,R].concat(o).join().split(",");for(var S=[],U=0,V=o.length;V>U;U++)S[U]=U%2?p(o[U-1],o[U],n).y:p(o[U],o[U+1],n).x;return S}function D(a,b,c,d,e,f,g,h,i){var j=1-i;return{x:S(j,3)*a+3*S(j,2)*i*c+3*j*i*i*e+S(i,3)*g,y:S(j,3)*b+3*S(j,2)*i*d+3*j*i*i*f+S(i,3)*h}}function E(a,b,c,d,e,f,g,h){var i,j=e-2*c+a-(g-2*e+c),k=2*(c-a)-2*(e-c),l=a-c,m=(-k+O.sqrt(k*k-4*j*l))/2/j,n=(-k-O.sqrt(k*k-4*j*l))/2/j,o=[b,h],p=[a,g];return T(m)>"1e12"&&(m=.5),T(n)>"1e12"&&(n=.5),m>0&&1>m&&(i=D(a,b,c,d,e,f,g,h,m),p.push(i.x),o.push(i.y)),n>0&&1>n&&(i=D(a,b,c,d,e,f,g,h,n),p.push(i.x),o.push(i.y)),j=f-2*d+b-(h-2*f+d),k=2*(d-b)-2*(f-d),l=b-d,m=(-k+O.sqrt(k*k-4*j*l))/2/j,n=(-k-O.sqrt(k*k-4*j*l))/2/j,T(m)>"1e12"&&(m=.5),T(n)>"1e12"&&(n=.5),m>0&&1>m&&(i=D(a,b,c,d,e,f,g,h,m),p.push(i.x),o.push(i.y)),n>0&&1>n&&(i=D(a,b,c,d,e,f,g,h,n),p.push(i.x),o.push(i.y)),{min:{x:Q.apply(0,p),y:Q.apply(0,o)},max:{x:R.apply(0,p),y:R.apply(0,o)}}}function F(a,b){var d=!b&&c(a);if(!b&&d.curve)return f(d.curve);for(var e=z(a),g=b&&z(b),h={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},i={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},j=(function(a,b){var c,d;if(!a)return["C",b.x,b.y,b.x,b.y,b.x,b.y];switch(!(a[0]in{T:1,Q:1})&&(b.qx=b.qy=null),a[0]){case"M":b.X=a[1],b.Y=a[2];break;case"A":a=["C"].concat(C.apply(0,[b.x,b.y].concat(a.slice(1))));break;case"S":c=b.x+(b.x-(b.bx||b.x)),d=b.y+(b.y-(b.by||b.y)),a=["C",c,d].concat(a.slice(1));break;case"T":b.qx=b.x+(b.x-(b.qx||b.x)),b.qy=b.y+(b.y-(b.qy||b.y)),a=["C"].concat(B(b.x,b.y,b.qx,b.qy,a[1],a[2]));break;case"Q":b.qx=a[1],b.qy=a[2],a=["C"].concat(B(b.x,b.y,a[1],a[2],a[3],a[4]));break;case"L":a=["C"].concat(A(b.x,b.y,a[1],a[2]));break;case"H":a=["C"].concat(A(b.x,b.y,a[1],b.y));break;case"V":a=["C"].concat(A(b.x,b.y,b.x,a[1]));break;case"Z":a=["C"].concat(A(b.x,b.y,b.X,b.Y))}return a}),k=function(a,b){if(a[b].length>7){a[b].shift();for(var c=a[b];c.length;)a.splice(b++,0,["C"].concat(c.splice(0,6)));a.splice(b,1),n=R(e.length,g&&g.length||0)}},l=function(a,b,c,d,f){a&&b&&"M"==a[f][0]&&"M"!=b[f][0]&&(b.splice(f,0,["M",d.x,d.y]),c.bx=0,c.by=0,c.x=a[f][1],c.y=a[f][2],n=R(e.length,g&&g.length||0))},m=0,n=R(e.length,g&&g.length||0);n>m;m++){e[m]=j(e[m],h),k(e,m),g&&(g[m]=j(g[m],i)),g&&k(g,m),l(e,g,h,i,m),l(g,e,i,h,m);var o=e[m],p=g&&g[m],q=o.length,r=g&&p.length;h.x=o[q-2],h.y=o[q-1],h.bx=N(o[q-4])||h.x,h.by=N(o[q-3])||h.y,i.bx=g&&(N(p[r-4])||i.x),i.by=g&&(N(p[r-3])||i.y),i.x=g&&p[r-2],i.y=g&&p[r-1]}return g||(d.curve=f(e)),g?[e,g]:e}function G(a,b){if(!b)return a;var c,d,e,f,g,h,i;for(a=F(a),e=0,g=a.length;g>e;e++)for(i=a[e],f=1,h=i.length;h>f;f+=2)c=b.x(i[f],i[f+1]),d=b.y(i[f],i[f+1]),i[f]=c,i[f+1]=d;return a}function H(a,b){for(var c=[],d=0,e=a.length;e-2*!b>d;d+=2){var f=[{x:+a[d-2],y:+a[d-1]},{x:+a[d],y:+a[d+1]},{x:+a[d+2],y:+a[d+3]},{x:+a[d+4],y:+a[d+5]}];b?d?e-4==d?f[3]={x:+a[0],y:+a[1]}:e-2==d&&(f[2]={x:+a[0],y:+a[1]},f[3]={x:+a[2],y:+a[3]}):f[0]={x:+a[e-2],y:+a[e-1]}:e-4==d?f[3]=f[2]:d||(f[0]={x:+a[d],y:+a[d+1]}),c.push(["C",(-f[0].x+6*f[1].x+f[2].x)/6,(-f[0].y+6*f[1].y+f[2].y)/6,(f[1].x+6*f[2].x-f[3].x)/6,(f[1].y+6*f[2].y-f[3].y)/6,f[2].x,f[2].y])}return c}var I=b.prototype,J=a.is,K=a._.clone,L="hasOwnProperty",M=/,?([a-z]),?/gi,N=parseFloat,O=Math,P=O.PI,Q=O.min,R=O.max,S=O.pow,T=O.abs,U=h(1),V=h(),W=h(0,1),X=a._unit2px,Y={path:function(a){return a.attr("path")},circle:function(a){var b=X(a);return x(b.cx,b.cy,b.r)},ellipse:function(a){var b=X(a);return x(b.cx,b.cy,b.rx,b.ry)},rect:function(a){var b=X(a);return w(b.x,b.y,b.width,b.height,b.rx,b.ry)},image:function(a){var b=X(a);return w(b.x,b.y,b.width,b.height)},text:function(a){var b=a.node.getBBox();return w(b.x,b.y,b.width,b.height)},g:function(a){var b=a.node.getBBox();return w(b.x,b.y,b.width,b.height)},symbol:function(a){var b=a.getBBox();return w(b.x,b.y,b.width,b.height)},line:function(a){return"M"+[a.attr("x1"),a.attr("y1"),a.attr("x2"),a.attr("y2")]},polyline:function(a){return"M"+a.attr("points")},polygon:function(a){return"M"+a.attr("points")+"z"},svg:function(a){var b=a.node.getBBox();return w(b.x,b.y,b.width,b.height)},deflt:function(a){var b=a.node.getBBox();return w(b.x,b.y,b.width,b.height)}};a.path=c,a.path.getTotalLength=U,a.path.getPointAtLength=V,a.path.getSubpath=function(a,b,c){if(this.getTotalLength(a)-c<1e-6)return W(a,b).end;var d=W(a,c,1);return b?W(d,b).end:d},I.getTotalLength=function(){return this.node.getTotalLength?this.node.getTotalLength():void 0},I.getPointAtLength=function(a){return V(this.attr("d"),a)},I.getSubpath=function(b,c){return a.path.getSubpath(this.attr("d"),b,c)},a._.box=d,a.path.findDotsAtSegment=i,a.path.bezierBBox=j,a.path.isPointInsideBBox=k,a.path.isBBoxIntersect=l,a.path.intersection=r,a.path.intersectionNumber=s,a.path.isPointInside=u,a.path.getBBox=v,a.path.get=Y,a.path.toRelative=y,a.path.toAbsolute=z,a.path.toCubic=F,a.path.map=G,a.path.toString=e,a.path.clone=f}),d.plugin(function(a){var b=Math.max,c=Math.min,d=function(a){if(this.items=[],this.length=0,this.type="set",a)for(var b=0,c=a.length;c>b;b++)a[b]&&(this[this.items.length]=this.items[this.items.length]=a[b],this.length++)},e=d.prototype;e.push=function(){for(var a,b,c=0,d=arguments.length;d>c;c++)a=arguments[c],a&&(b=this.items.length,this[b]=this.items[b]=a,this.length++);return this},e.pop=function(){return this.length&&delete this[this.length--],this.items.pop()},e.forEach=function(a,b){for(var c=0,d=this.items.length;d>c;c++)if(a.call(b,this.items[c],c)===!1)return this;return this},e.remove=function(){for(;this.length;)this.pop().remove();return this},e.attr=function(a){for(var b=0,c=this.items.length;c>b;b++)this.items[b].attr(a);return this},e.clear=function(){for(;this.length;)this.pop()},e.splice=function(a,e){a=0>a?b(this.length+a,0):a,e=b(0,c(this.length-a,e));var f,g=[],h=[],i=[];for(f=2;f<arguments.length;f++)i.push(arguments[f]);for(f=0;e>f;f++)h.push(this[a+f]);for(;f<this.length-a;f++)g.push(this[a+f]);var j=i.length;for(f=0;f<j+g.length;f++)this.items[a+f]=this[a+f]=j>f?i[f]:g[f-j];for(f=this.items.length=this.length-=e-j;this[f];)delete this[f++];return new d(h)},e.exclude=function(a){for(var b=0,c=this.length;c>b;b++)if(this[b]==a)return this.splice(b,1),!0;return!1},e.insertAfter=function(a){for(var b=this.items.length;b--;)this.items[b].insertAfter(a);return this},e.getBBox=function(){for(var a=[],d=[],e=[],f=[],g=this.items.length;g--;)if(!this.items[g].removed){var h=this.items[g].getBBox();a.push(h.x),d.push(h.y),e.push(h.x+h.width),f.push(h.y+h.height)}return a=c.apply(0,a),d=c.apply(0,d),e=b.apply(0,e),f=b.apply(0,f),{x:a,y:d,x2:e,y2:f,width:e-a,height:f-d,cx:a+(e-a)/2,cy:d+(f-d)/2}},e.clone=function(a){a=new d;for(var b=0,c=this.items.length;c>b;b++)a.push(this.items[b].clone());return a},e.toString=function(){return"Snap‘s set"},e.type="set",a.set=function(){var a=new d;return arguments.length&&a.push.apply(a,Array.prototype.slice.call(arguments,0)),a}}),d.plugin(function(a,b){function c(a){var b=a[0];switch(b.toLowerCase()){case"t":return[b,0,0];case"m":return[b,1,0,0,1,0,0];case"r":return 4==a.length?[b,0,a[2],a[3]]:[b,0];case"s":return 5==a.length?[b,1,1,a[3],a[4]]:3==a.length?[b,1,1]:[b,1]}}function d(b,d,e){d=l(d).replace(/\.{3}|\u2026/g,b),b=a.parseTransformString(b)||[],d=a.parseTransformString(d)||[];for(var f,g,j,k,m=Math.max(b.length,d.length),n=[],o=[],p=0;m>p;p++){if(j=b[p]||c(d[p]),k=d[p]||c(j),j[0]!=k[0]||"r"==j[0].toLowerCase()&&(j[2]!=k[2]||j[3]!=k[3])||"s"==j[0].toLowerCase()&&(j[3]!=k[3]||j[4]!=k[4])){b=a._.transform2matrix(b,e()),d=a._.transform2matrix(d,e()),n=[["m",b.a,b.b,b.c,b.d,b.e,b.f]],o=[["m",d.a,d.b,d.c,d.d,d.e,d.f]];break}for(n[p]=[],o[p]=[],f=0,g=Math.max(j.length,k.length);g>f;f++)f in j&&(n[p][f]=j[f]),f in k&&(o[p][f]=k[f])}return{from:i(n),to:i(o),f:h(n)}}function e(a){return a}function f(a){return function(b){return+b.toFixed(3)+a}}function g(b){return a.rgb(b[0],b[1],b[2])}function h(a){var b,c,d,e,f,g,h=0,i=[];for(b=0,c=a.length;c>b;b++){for(f="[",g=['"'+a[b][0]+'"'],d=1,e=a[b].length;e>d;d++)g[d]="val["+h++ +"]";f+=g+"]",i[b]=f}return Function("val","return Snap.path.toString.call(["+i+"])")}function i(a){for(var b=[],c=0,d=a.length;d>c;c++)for(var e=1,f=a[c].length;f>e;e++)b.push(a[c][e]);return b}var j={},k=/[a-z]+$/i,l=String;j.stroke=j.fill="colour",b.prototype.equal=function(b,c){var m,n,o=l(this.attr(b)||""),p=this;if(o==+o&&c==+c)return{from:+o,to:+c,f:e};if("colour"==j[b])return m=a.color(o),n=a.color(c),{from:[m.r,m.g,m.b,m.opacity],to:[n.r,n.g,n.b,n.opacity],f:g};if("transform"==b||"gradientTransform"==b||"patternTransform"==b)return c instanceof a.Matrix&&(c=c.toTransformString()),a._.rgTransform.test(c)||(c=a._.svgTransform2string(c)),d(o,c,function(){return p.getBBox(1)});if("d"==b||"path"==b)return m=a.path.toCubic(o,c),{from:i(m[0]),to:i(m[1]),f:h(m[0])};if("points"==b)return m=l(o).split(","),n=l(c).split(","),{from:m,to:n,f:function(a){return a}};var q=o.match(k),r=l(c).match(k);return q&&q==r?{from:parseFloat(o),to:parseFloat(c),f:f(q)}:{from:this.asPX(b),to:this.asPX(b,c),f:e}}}),d.plugin(function(a,c,d,e){for(var f=c.prototype,g="hasOwnProperty",h=("createTouch"in e.doc),i=["click","dblclick","mousedown","mousemove","mouseout","mouseover","mouseup","touchstart","touchmove","touchend","touchcancel"],j={mousedown:"touchstart",mousemove:"touchmove",mouseup:"touchend"},k=function(a){var b="y"==a?"scrollTop":"scrollLeft";return e.doc.documentElement[b]||e.doc.body[b]},l=function(){this.returnValue=!1},m=function(){return this.originalEvent.preventDefault()},n=function(){this.cancelBubble=!0},o=function(){return this.originalEvent.stopPropagation()},p=function(){return e.doc.addEventListener?function(a,b,c,d){var e=h&&j[b]?j[b]:b,f=function(e){var f=k("y"),i=k("x");if(h&&j[g](b))for(var l=0,n=e.targetTouches&&e.targetTouches.length;n>l;l++)if(e.targetTouches[l].target==a||a.contains(e.targetTouches[l].target)){var p=e;e=e.targetTouches[l],e.originalEvent=p,e.preventDefault=m,e.stopPropagation=o;break}var q=e.clientX+i,r=e.clientY+f;return c.call(d,e,q,r)};return b!==e&&a.addEventListener(b,f,!1),a.addEventListener(e,f,!1),function(){return b!==e&&a.removeEventListener(b,f,!1),a.removeEventListener(e,f,!1),!0}}:e.doc.attachEvent?function(a,b,c,d){var f=function(a){a=a||e.win.event;var b=k("y"),f=k("x"),g=a.clientX+f,h=a.clientY+b;return a.preventDefault=a.preventDefault||l,a.stopPropagation=a.stopPropagation||n,c.call(d,a,g,h)};a.attachEvent("on"+b,f);var g=function(){return a.detachEvent("on"+b,f),!0};return g}:void 0}(),q=[],r=function(c){for(var d,e=c.clientX,f=c.clientY,g=k("y"),i=k("x"),j=q.length;j--;){if(d=q[j],h){for(var l,m=c.touches&&c.touches.length;m--;)if(l=c.touches[m],l.identifier==d.el._drag.id||d.el.node.contains(l.target)){e=l.clientX,f=l.clientY,(c.originalEvent?c.originalEvent:c).preventDefault();break}}else c.preventDefault();var n=d.el.node;a._.glob,n.nextSibling,n.parentNode,n.style.display,e+=i,f+=g,b("snap.drag.move."+d.el.id,d.move_scope||d.el,e-d.el._drag.x,f-d.el._drag.y,e,f,c)}},s=function(c){a.unmousemove(r).unmouseup(s);for(var d,e=q.length;e--;)d=q[e],d.el._drag={},b("snap.drag.end."+d.el.id,d.end_scope||d.start_scope||d.move_scope||d.el,c);q=[]},t=i.length;t--;)!function(b){a[b]=f[b]=function(c,d){return a.is(c,"function")&&(this.events=this.events||[],this.events.push({name:b,f:c,unbind:p(this.shape||this.node||e.doc,b,c,d||this)})),this},a["un"+b]=f["un"+b]=function(a){for(var c=this.events||[],d=c.length;d--;)if(c[d].name==b&&(c[d].f==a||!a))return c[d].unbind(),c.splice(d,1),!c.length&&delete this.events,this;return this}}(i[t]);f.hover=function(a,b,c,d){return this.mouseover(a,c).mouseout(b,d||c)},f.unhover=function(a,b){return this.unmouseover(a).unmouseout(b)};var u=[];f.drag=function(c,d,e,f,g,h){function i(i,j,k){(i.originalEvent||i).preventDefault(),this._drag.x=j,this._drag.y=k,this._drag.id=i.identifier,!q.length&&a.mousemove(r).mouseup(s),q.push({el:this,move_scope:f,start_scope:g,end_scope:h}),d&&b.on("snap.drag.start."+this.id,d),c&&b.on("snap.drag.move."+this.id,c),e&&b.on("snap.drag.end."+this.id,e),b("snap.drag.start."+this.id,g||f||this,j,k,i)}if(!arguments.length){var j;return this.drag(function(a,b){this.attr({transform:j+(j?"T":"t")+[a,b]})},function(){j=this.transform().local})}return this._drag={},u.push({el:this,start:i}),this.mousedown(i),this},f.undrag=function(){for(var c=u.length;c--;)u[c].el==this&&(this.unmousedown(u[c].start),u.splice(c,1),b.unbind("snap.drag.*."+this.id));return!u.length&&a.unmousemove(r).unmouseup(s),this}}),d.plugin(function(a,c,d){var e=(c.prototype,d.prototype),f=/^\s*url\((.+)\)/,g=String,h=a._.$;a.filter={},e.filter=function(b){var d=this;"svg"!=d.type&&(d=d.paper);var e=a.parse(g(b)),f=a._.id(),i=(d.node.offsetWidth,d.node.offsetHeight,h("filter"));return h(i,{id:f,filterUnits:"userSpaceOnUse"}),i.appendChild(e.node),d.defs.appendChild(i),new c(i)},b.on("snap.util.getattr.filter",function(){b.stop();var c=h(this.node,"filter");if(c){var d=g(c).match(f);return d&&a.select(d[1])}}),b.on("snap.util.attr.filter",function(d){if(d instanceof c&&"filter"==d.type){b.stop();var e=d.node.id;e||(h(d.node,{id:d.id}),e=d.id),h(this.node,{filter:a.url(e)})}d&&"none"!=d||(b.stop(),this.node.removeAttribute("filter"))}),a.filter.blur=function(b,c){null==b&&(b=2);var d=null==c?b:[b,c];return a.format('<feGaussianBlur stdDeviation="{def}"/>',{def:d})},a.filter.blur.toString=function(){return this()},a.filter.shadow=function(b,c,d,e){return e=e||"#000",null==d&&(d=4),"string"==typeof d&&(e=d,d=4),null==b&&(b=0,c=2),null==c&&(c=b),e=a.color(e),a.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>',{color:e,dx:b,dy:c,blur:d})
},a.filter.shadow.toString=function(){return this()},a.filter.grayscale=function(b){return null==b&&(b=1),a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>',{a:.2126+.7874*(1-b),b:.7152-.7152*(1-b),c:.0722-.0722*(1-b),d:.2126-.2126*(1-b),e:.7152+.2848*(1-b),f:.0722-.0722*(1-b),g:.2126-.2126*(1-b),h:.0722+.9278*(1-b)})},a.filter.grayscale.toString=function(){return this()},a.filter.sepia=function(b){return null==b&&(b=1),a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>',{a:.393+.607*(1-b),b:.769-.769*(1-b),c:.189-.189*(1-b),d:.349-.349*(1-b),e:.686+.314*(1-b),f:.168-.168*(1-b),g:.272-.272*(1-b),h:.534-.534*(1-b),i:.131+.869*(1-b)})},a.filter.sepia.toString=function(){return this()},a.filter.saturate=function(b){return null==b&&(b=1),a.format('<feColorMatrix type="saturate" values="{amount}"/>',{amount:1-b})},a.filter.saturate.toString=function(){return this()},a.filter.hueRotate=function(b){return b=b||0,a.format('<feColorMatrix type="hueRotate" values="{angle}"/>',{angle:b})},a.filter.hueRotate.toString=function(){return this()},a.filter.invert=function(b){return null==b&&(b=1),a.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>',{amount:b,amount2:1-b})},a.filter.invert.toString=function(){return this()},a.filter.brightness=function(b){return null==b&&(b=1),a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>',{amount:b})},a.filter.brightness.toString=function(){return this()},a.filter.contrast=function(b){return null==b&&(b=1),a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>',{amount:b,amount2:.5-b/2})},a.filter.contrast.toString=function(){return this()}}),d});
function gaga(a, b, c, d, e, f, g) {
  if (typeof ga === "function") {
    ga(a, b, c, d, e, f, g)
  }
}
"use strict"

function newChar () {
  var newCard = document.querySelector('.js-new-card')
  var firstInput = newCard.querySelector('.first-input')
  newCard.classList.add('overlay__char-new--create')
  firstInput.focus()
}

function createChar (evt) {
  if (evt) {
    evt.preventDefault()
  }
  var el = this
  var newCard = document.querySelector('.overlay__char-new--create')
  var newCharNameEl = el.parentNode.querySelector('.js-new-char-name')
  var newCharName = newCharNameEl.value

  newCard.classList.remove('overlay__char-new--create')
  var personnageActuel = newCharName
  if (!personnageActuel) { return }
  if (!currentUser.cc) { currentUser.cc = {} }
  if (!currentUser.cc.personnageActuel) { currentUser.cc.personnageActuel = personnageActuel }
  if (!currentUser.cc.personnages) { currentUser.cc.personnages = {} }
  currentUser.cc.personnages[personnageActuel] = window.hash.get()
  Object.assign(currentUser.cc.personnages, personnages)

  updateDbUser(currentUser)
    .then(function (json) {
      currentUser._rev = json.rev
      // return json
      gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'New', eventLabel: 'Save new character' })
    })
    .catch(function (err) {
      consolelog('err', err)
    })
  manageCharacters()
}

function deleteChar () {
  var el = this
  var disposible = el.parentNode.parentNode.querySelector('.overlay__char-name').innerHTML
  delete currentUser.cc.personnages[disposible]

  updateDbUser(currentUser)
    .then(function (json) {
      currentUser._rev = json.rev
      // return json
      gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Delete', eventLabel: 'Delete character' })
    })
    .catch(function (err) {
      consolelog('err', err)
    })
  manageCharacters()
}

function saveChar () {
  // var saveBtn = document.querySelector('.save-btn')
  // saveBtn.classList.remove('save--enabled')
  var personnageActuel = currentUser.cc.personnageActuel

  if (!myUsername || !currentUser) { return }
  if (!currentUser) { return }
  if (!personnageActuel) { return }
  if (!currentUser.cc) { currentUser.cc = {} }
  if (!currentUser.cc.personnageActuel) { currentUser.cc.personnageActuel = personnageActuel }
  if (!currentUser.cc.personnages) { currentUser.cc.personnages = {} }

  currentUser.cc.personnages[personnageActuel] = window.hash.get()

  Object.assign(currentUser.cc.personnages, personnages)

  updateDbUser(currentUser)
    .then(function (json) {
      currentUser._rev = json.rev
      // return json
      gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Save', eventLabel: 'Save character' })
    })
    /*
    .catch(function (err) {
      consolelog('err', err)
    })
    */
}
"use strict"

// NO GLOBALS
// USES DOM

function changeClipPathOnEyes (id) {
  var svgContainer = document.querySelector('#svg1 .character-container')
  var eyeRight = svgContainer.querySelector('#eye_right')
  var eyeLeft = svgContainer.querySelector('#eye_left')
  if (eyeRight && eyeLeft) {
    eyeRight.setAttribute('clip-path', 'url(' + id + '--right)')
    eyeLeft.setAttribute('clip-path', 'url(' + id + '--left)')
  }
}

function applyClipPath (cc) {
  setTimeout(function () {
    changeClipPathOnEyes('#eyes_' + cc.choices.emotion)
  }, 150)
}
"use strict"

// ONLY USES hash() FROM GLOBALS
// USES DOM

function defaultEyeColor (cc, skinColor) {
  var eyeColorDict = {
    '#ffdfc4': '#6F918A', // Grey
    '#f0d5be': '#FF6600', // Amber
    '#eeceb3': '#A0892C', // Hazel
    '#e1b899': '#784421', // Light Brown
    '#e5c298': '#784421', // Light Brown
    '#ffdcb2': '#784421', // Light Brown
    '#e5b887': '#784421', // Light Brown
    '#e5a073': '#784421', // Light Brown
    '#e79e6d': '#784421', // Light Brown
    '#db9065': '#784421', // Light Brown
    '#ce967c': '#784421', // Light Brown
    '#c67856': '#784421', // Light Brown
    '#ba6c49': '#784421', // Light Brown
    '#a57257': '#784421', // Light Brown
    '#f0c8c9': '#37ABC8', // Blue
    '#dda8a0': '#AAD400', // Green
    '#b97c6d': '#552200', // Brown
    '#a8756c': '#552200', // Brown
    '#ad6452': '#552200', // Brown
    '#5c3836': '#552200', // Brown
    '#cb8442': '#552200', // Brown
    '#bd723c': '#552200', // Brown
    '#704139': '#552200', // Brown
    '#a3866a': '#552200' // Brown
  }
  const irisColor = eyeColorDict[skinColor]
  cc.choices.irisColor = irisColor
  hash.add({ irisColor })
}

function defaultHairColor (cc, skinColor) {
  var hairColorDict = {
    '#ffdfc4': '#803300', // Light brown
    '#f0d5be': '#803300', // Light brown
    '#eeceb3': '#803300', // Light brown
    '#e1b899': '#1a1a1a', // Black
    '#e5c298': '#1a1a1a', // Black
    '#ffdcb2': '#1a1a1a', // Black
    '#e5b887': '#1a1a1a', // Black
    '#e5a073': '#1a1a1a', // Black
    '#e79e6d': '#1a1a1a', // Black
    '#db9065': '#1a1a1a', // Black
    '#ce967c': '#1a1a1a', // Black
    '#c67856': '#1a1a1a', // Black
    '#ba6c49': '#1a1a1a', // Black
    '#a57257': '#1a1a1a', // Black
    '#f0c8c9': '#ffcc00', // Blond
    '#dda8a0': '#ff6600', // Red
    '#b97c6d': '#1a1a1a', // Black
    '#a8756c': '#1a1a1a', // Black
    '#ad6452': '#1a1a1a', // Black
    '#5c3836': '#1a1a1a', // Black
    '#cb8442': '#1a1a1a', // Black
    '#bd723c': '#1a1a1a', // Black
    '#704139': '#1a1a1a', // Black
    '#a3866a': '#1a1a1a' // Black
  }
  const hairColor = hairColorDict[skinColor]
  cc.choices.hairColor = hairColor
  hash.add({ hairColor })
}
function shadeColor (color, percent) {
  var num = parseInt(color.slice(1), 16); var amt = Math.round(2.55 * percent); var R = (num >> 16) + amt; var G = (num >> 8 & 0x00FF) + amt; var B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}

function ColorLuminance (hex, lum) {
  // validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, '')
  if (hex.length < 6) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  lum = lum || 0
  // convert to decimal and change luminosity
  var rgb = '#'; var c; var i
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16)
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16)
    rgb += ('00' + c).substr(c.length)
  }
  return rgb
}

function colorizeByClass (elClassName, color) {
  var elementList = document.querySelectorAll(('.' + elClassName))
  var elementListLength = elementList.length
  var elCounter = elementListLength
  while (elCounter--) {
    elementList[elementListLength - (elCounter + 1)].style.fill = color
  }
}

function colorSkin (color) {
  colorizeByClass('upperlip', shadeColor(color, -10))
  colorizeByClass('lowerlip', shadeColor(color, 10))
}

function colorElement (el) {
  var id = el.id.split('_')
  var section = id[0]
  var item = id[1]
  var newColor
  var newColorBeta
  var newColorGamma
  var newColorDelta
  var newColorEpsilon
  var colorPrefix = 'alpha'
  var lipstickColor

  if (section === 'eyeballs') { section = 'iris' }

  newColor = c.choices[section + 'Color']
  newColorBeta = c.choices[section + 'Color-bet']
  newColorGamma = c.choices[section + 'Color-gam']
  newColorDelta = c.choices[section + 'Color-del']
  newColorEpsilon = c.choices[section + 'Color-eps']

  if ((processSection(section, item) === 'skin' || processSection(section, item) === 'mouth') && c.choices.skinColor != undefined) {
    el = colorElementLoop(el, 'skin', c.choices.skinColor)
  } else if (processSection(section, item) === 'hair') {
    el = colorElementLoop(el, 'alpha', c.choices.hairColor)
  }

  if (newColor != undefined) {
    el = colorElementLoop(el, colorPrefix, newColor, false)
    if (section === 'mouth') {
      el = colorElementLoop(el, 'lips', newColor, true)
    }
  }

  if (newColorBeta != undefined) {
    el = colorElementLoop(el, 'beta', newColorBeta, false)
  }
  if (newColorGamma != undefined) {
    el = colorElementLoop(el, 'gamma', newColorGamma, false)
  }
  if (newColorDelta != undefined) {
    el = colorElementLoop(el, 'delta', newColorDelta, false)
  }
  if (newColorEpsilon != undefined) {
    el = colorElementLoop(el, 'epsilon', newColorEpsilon, false)
  }
  return el
}

function colorElementLoop (el, colorPrefix, newColor, lipstickFlag) {
  var colorContrasts = ['dark', 'light']
  var contrastCounter = colorContrasts.length
  var colorSuffixes = ['er', 'est']
  var suffixCounter
  var childrenList
  var counter
  var colorList = getColorList(newColor)
  var colorListIndex
  var colorPair
  var classPrefix = '.'

  if (lipstickFlag) {
    classPrefix = '.lips.'
  }

  childrenList = el.querySelectorAll('.' + colorPrefix)
  counter = childrenList.length

  if (colorPrefix === 'lips') {
    colorPrefix = 'skin'
  }

  if (counter > 0) {
    colorListIndex = 3
    colorPair = getColorPair(colorList, colorListIndex)
    while (counter--) {
      childrenList[counter] = applyColorToChild(childrenList[counter], colorPair)
    }
  }

  while (contrastCounter--) {
    childrenList = el.querySelectorAll(classPrefix + colorPrefix + '--' + colorContrasts[contrastCounter])
    counter = childrenList.length

    if (counter > 0) {
      if (colorContrasts[contrastCounter] === 'light') { colorListIndex = 4 }
      if (colorContrasts[contrastCounter] === 'dark') { colorListIndex = 2 }

      colorPair = getColorPair(colorList, colorListIndex)

      while (counter--) {
        childrenList[counter] = applyColorToChild(childrenList[counter], colorPair)
      }
    }

    suffixCounter = colorSuffixes.length

    while (suffixCounter--) {
      childrenList = el.querySelectorAll('.' + colorPrefix + '--' + colorContrasts[contrastCounter] + colorSuffixes[suffixCounter])
      counter = childrenList.length

      if (counter > 0) {
        if (colorContrasts[contrastCounter] + colorSuffixes[suffixCounter] === 'darkest') { colorListIndex = 0 }
        if (colorContrasts[contrastCounter] + colorSuffixes[suffixCounter] === 'darker') { colorListIndex = 1 }
        if (colorContrasts[contrastCounter] + colorSuffixes[suffixCounter] === 'lighter') { colorListIndex = 5 }
        if (colorContrasts[contrastCounter] + colorSuffixes[suffixCounter] === 'lightest') { colorListIndex = 6 }

        colorPair = getColorPair(colorList, colorListIndex)

        while (counter--) {
          childrenList[counter] = applyColorToChild(childrenList[counter], colorPair)
        }
      }
    }
  }
  return el
}

function applyColorToChild (child, colorPair) {
  if (child.style.fill != 'none' && child.style.fill != '') { child.style.fill = colorPair[0] }
  if (child.style.stroke != 'none' && child.style.stroke != '') { child.style.stroke = colorPair[1] }
  return child
}

function getColorPair (colorList, colorListIndex) {
  var fillColor = colorList[colorListIndex]
  var strokeColor
  var colorPair = []
  colorPair.push(fillColor)

  if (colorListIndex - 2 < 0) {
    strokeColor = colorList[0]
  } else {
    strokeColor = colorList[colorListIndex - 2]
  }
  colorPair.push(strokeColor)
  return colorPair
}

function getColorList (newColor) {
  // TODO Allow user to customize color contrast.
  var colorMultiplyer = 10 // Color contrast.
  var colorList = []
  colorList.push(shadeColor(newColor, -1 * (3 * colorMultiplyer)))
  colorList.push(shadeColor(newColor, -1 * (2 * colorMultiplyer)))
  colorList.push(shadeColor(newColor, -1 * colorMultiplyer))
  colorList.push(newColor)
  colorList.push(shadeColor(newColor, colorMultiplyer))
  colorList.push(shadeColor(newColor, (2 * colorMultiplyer)))
  colorList.push(shadeColor(newColor, (3 * colorMultiplyer)))
  return colorList
}

function getColorClassPrefix (id) {
  var prefix
  var sectionPallette = document.querySelector('.section-pallette')

  if (sectionPallette.querySelector('input:checked')) {
    prefix = sectionPallette.querySelector('input:checked').value
  } else if (id === 'body' || id === 'body_head' || id === 'ears' || id === 'nose' || id === 'age' || id === 'eyes' || id === 'freckles' || id === 'sockets') {
    prefix = 'skin'
  } else {
    prefix = 'alpha'
  }
  return prefix
}

function colorize (formId, _color) {
  var multiLayer = getMultiLayer()
  var skinLayers = getSkinLayers()
  var colorMultiplyer = 10 // Color contrast. TODO Move to user controls.
  var forms = window.forms
  var id = formId
  var affectedList = []

  var colorLight = shadeColor(_color, colorMultiplyer)
  var colorLighter = shadeColor(_color, (2 * colorMultiplyer))
  var colorLightest = shadeColor(_color, (3 * colorMultiplyer))
  var colorDark = shadeColor(_color, -1 * colorMultiplyer)
  var colorDarker = shadeColor(_color, -1 * (2 * colorMultiplyer))
  var colorDarkest = shadeColor(_color, -1 * (3 * colorMultiplyer))

  var classPrefix = getColorClassPrefix(formId)
  var palletteButton = document.querySelector('.section-pallette input[type="radio"]:checked+label')

  var classLightest = '--lightest'
  var classLighter = '--lighter'
  var classLight = '--light'
  var classDark = '--dark'
  var classDarker = '--darker'
  var classDarkest = '--darkest'

  var seperator = ' .'

  if (palletteButton) {
    palletteButton.style.background = _color
  }

  for (var f in forms) {
    var form = Object.keys(forms[f])

    for (var x in form) {
      // is x = to id?
      // if so, cycle through each element
      if (form[x].toLowerCase() === id) {
        // Figure out which form to look in to find this id
        // Cycle through each option
        var capitalId = id.replace(/^[a-z]/, function (m) { return m.toUpperCase() })
        // If the id is body, than the list will be of all 'skin' layers
        if (classPrefix === 'skin' && (id === 'body' || id === 'body_head' || id === 'ears' || id === 'nose' || id === 'age' || id === 'eyes' || id === 'freckles' || id === 'sockets')) {
          affectedList = skinLayers
          var myKey = 'skinColor'
          // classPrefix = "skin";
        } else if (id === 'facialhair' || id === 'hair') {
          affectedList = getHairLayers()
          var myKey = 'hairColor'
        } else if (id === 'iris') {
          affectedList = ['eyeballs_default']
          var myKey = 'irisColor'
        } else {
          affectedList = []
          var myKey = id + 'Color'
          if (classPrefix != 'skin' && classPrefix != 'alpha' && classPrefix != 'lips') {
            myKey = myKey + '-' + classPrefix.slice(0, 3)
          }
          if (myKey === 'irisColor' || myKey === 'browsColor' || myKey === 'lashesColor' || myKey === 'socketsColor' || myKey === 'mouthColor') {
            for (i in forms[0].Emotion) {
              var tmpId = forms[0].Emotion[i]
              if (tmpId != '') {
                affectedList.push(id + '_' + tmpId)
              }
            }
            if (myKey === 'mouthColor') {
              classPrefix = 'skin'
            }
          } else {
            for (i in forms[f][capitalId]) {
              var tmpId = forms[f][capitalId][i]
              if (tmpId != '') {
                affectedList.push(id + '_' + tmpId)
              }
            }
          }
        }
        // Look at the affected list
        // If one of those is in the multiLayer array
        // Then take it out and replace it with the layers that need to be there
        origList = affectedList
        affectedList = getAffectedListFromOrig(origList, multiLayer)
        var myValue = _color.toString()
        var obj = new Array()
        obj[myKey] = myValue
        hash.add(obj)
        modCharacter(myKey, myValue)

        for (n in affectedList) {
          fullId = '#' + affectedList[n]
          if (id === 'mouth') {
            seperator = ' .lips.'
          }
          var alphaNodes = document.querySelectorAll(fullId + seperator + classPrefix)
          var alphaLightNodes = document.querySelectorAll(fullId + seperator + classPrefix + classLight)
          var alphaLighterNodes = document.querySelectorAll(fullId + seperator + classPrefix + classLighter)
          var alphaLightestNodes = document.querySelectorAll(fullId + seperator + classPrefix + classLightest)
          var alphaDarkNodes = document.querySelectorAll(fullId + seperator + classPrefix + classDark)
          var alphaDarkerNodes = document.querySelectorAll(fullId + seperator + classPrefix + classDarker)
          var alphaDarkestNodes = document.querySelectorAll(fullId + seperator + classPrefix + classDarkest)
          var alphaNodesCounter = alphaNodes.length
          var alphaLightNodesCounter = alphaLightNodes.length
          var alphaLighterNodesCounter = alphaLighterNodes.length
          var alphaLightestNodesCounter = alphaLightestNodes.length
          var alphaDarkNodesCounter = alphaDarkNodes.length
          var alphaDarkerNodesCounter = alphaDarkerNodes.length
          var alphaDarkestNodesCounter = alphaDarkestNodes.length

          while (alphaNodesCounter--) {
            colorPaths(alphaNodes[alphaNodesCounter], _color, colorDarker)
          }
          while (alphaLightNodesCounter--) {
            colorPaths(alphaLightNodes[alphaLightNodesCounter], colorLight, colorDark)
          }
          while (alphaLighterNodesCounter--) {
            colorPaths(alphaLighterNodes[alphaLighterNodesCounter], colorLighter, _color)
          }
          while (alphaLightestNodesCounter--) {
            colorPaths(alphaLightestNodes[alphaLightestNodesCounter], colorLightest, colorLight)
          }
          while (alphaDarkNodesCounter--) {
            colorPaths(alphaDarkNodes[alphaDarkNodesCounter], colorDark, colorDarker)
          }
          while (alphaDarkerNodesCounter--) {
            colorPaths(alphaDarkerNodes[alphaDarkerNodesCounter], colorDarker, colorDarkest)
          }
          while (alphaDarkestNodesCounter--) {
            colorPaths(alphaDarkestNodes[alphaDarkestNodesCounter], colorDarkest, colorDarkest)
          }
        }
      }
    }
  }
}

function colorPaths (node, _color, colorDarker) {
  if (node.style.fill != 'none' && node.style.fill != '') {
    node.style.fill = _color
  }
  if (node.style.stroke != 'none' && node.style.stroke != '') {
    node.style.stroke = colorDarker
  }
}

function getAffectedListFromOrig (origList, multiLayer) {
  var affectedList = []
  var layerCount
  for (a in origList) {
    layerCount = isInMultiLayerArray(origList[a], multiLayer)
    if (layerCount > 0) {
        for (var i = 1; i <= layerCount; i++) {
          idOf = origList[a] + '_' + i + '_of_' + layerCount
          affectedList.push(idOf)
        }
    } else {
    affectedList.push(origList[a])
    }
  }
  return affectedList
}

function replacementStyle (json, newColor) {
  var newStyle = json.style
  var replacement = ''
  for (n in Object.keys(newStyle)) {
    var currentKey = Object.keys(newStyle)[n]

    if (currentKey === 'fill') {
      if (newStyle[currentKey] != 'none') {
        if (json.style['stroke-width'] === undefined) {
          var currentValue = ColorLuminance(newColor, -0.12)
        } else {
          var currentValue = newColor
        }
      } else {
        var currentValue = newStyle[currentKey]
      }
    } else if (currentKey === 'stroke') {
      if (newStyle[currentKey] != 'none') {
        if (json.style['stroke-width'] != undefined) {
          var currentValue = ColorLuminance(newColor, -0.2)
        }
      } else {
        var currentValue = newStyle[currentKey]
      }
    } else {
      var currentValue = newStyle[currentKey]
    }
    var keyVal = 	currentKey + ': ' + currentValue + '; '
    replacement = replacement.concat(keyVal)
  }
  return replacement
}
function addColorPicker () {
  var section = document.querySelector('.section--selected').innerHTML.toLowerCase()
  getColor(section)
}

function hideColorPicker () {
  var colorPicker = document.querySelector('.colorpicker-wrapper')
  if (colorPicker && !colorPicker.classList.contains('section--hide')) {
    colorPicker.classList.add('section--hide')
  }
}

function getPallette (sectionId) {
  var pallette = {}
  var files = []
  var counter
  var el
  var emotions
  var colorClasses = ['skin', 'lips', 'alpha', 'beta', 'gamma', 'delta', 'epsilon']
  var classCounter

  if (sectionId === 'body') {
    files = getAllBodyLayers()
  } else if (sectionId === 'mouth') {
    emotions = getSectionLayersList('emotion')
    counter = emotions.length
    while (counter--) {
      files.push(sectionId + '_' + emotions[counter])
    }
  } else {
    files = getSectionLayersList(sectionId)
    files = replaceMultilayer(files, sectionId)
  }

  counter = files.length

  while (counter--) {
    classCounter = colorClasses.length

    while (classCounter--) {
      el = document.querySelector('#svg1 .character-container #' + files[counter] + ' .' + colorClasses[classCounter])
      if (el != null && el.style != null && el.style.fill != null) {
        pallette[colorClasses[classCounter]] = el.style.fill
      }
    }
  }
  drawPallette(pallette)
}

function drawPallette (pallette) {
  var container = document.querySelector('.section-pallette')
  var node
  var label
  var keys = Object.keys(pallette)
  var counter = keys.length

  while (counter--) {
    node = document.createElement('INPUT')
    label = document.createElement('LABEL')
    label.setAttribute('for', 'btn-' + [keys[counter]])
    node.type = 'radio'
    node.id = 'btn-' + [keys[counter]]
    node.name = 'btn-pallette'
    node.value = [keys[counter]]
    node.setAttribute('checked', 'checked')
    node.classList = [keys[counter]]
    label.style.background = pallette[keys[counter]]
    container.appendChild(node)
    container.appendChild(label)
  }

  // TODO Add event listeners to each colored div, allowing user to choose which color they edit.
  // Make sure the color refreshes when changing the colorpicker
}

function getColor (sectionId) {
  clearPicker()
  var id = sectionId
  var slide = document.getElementById('slide')
  var picker = document.getElementById('picker')
  var section = document.querySelector('.section-id')
  // var wrapper = document.querySelector('.colorpicker-wrapper')

  section.innerHTML = id
  getPallette(sectionId)

  try {
    ColorPicker(
      slide,
      picker,
      function (hex, hsv, rgb) {
        colorize(id, hex)
      })
  } catch (error) {
    console.error(error)
  }
}

function emptyPicker () {
  var wrapper = document.querySelector('.colorpicker-wrapper')
  wrapper.innerHTML = ''
}

function clearPicker () {
  var wrapper = document.querySelector('.colorpicker-wrapper')
  wrapper.innerHTML = '<div class="colorpicker-controls"><span class="section-id"></span><div class="section-pallette"></div></div><div class="colorpicker-align"><div id="picker" style="background-color:rgb(255,0,0);"></div><div id="slide"></div></div>'
}
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

function parseFormCookie() {
  const pairs = document.cookie.split(/; */)
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]
    let eq_idx = pair.indexOf('=')
    if ((eq_idx < 0) || (pair.substr(0, eq_idx).trim() !== "form")) continue
    let val = pair.substr(++eq_idx, pair.length).trim()
    if ('"' == val[0]) val = val.slice(1, -1)
    return JSON.parse(decodeURIComponent(val).split(".").slice(0, -1).join("."))
  }
  return {}
}
"use strict"

// closeAllOverlays() function is only GLOBAL used
// USES DOM

function rollCredits (evt) {
  if (evt) {
    evt.preventDefault()
  }

  var overlay = document.querySelector('.js-credits')

  closeAllOverlays()

  overlay.classList.add('overlay--show')
  overlay.addEventListener('click', closeCredits, true)

  setTimeout(closeAllOverlays, 52000)
}

function closeCredits (evt) {
  var overlay = document.querySelector('.js-credits')
  var target = evt.target
  var credits

  if (target === overlay) {
    credits = document.querySelector('.overlay--show')
    if (credits) {
      credits.classList.remove('overlay--show')
    }
  }
}

// Content for Credits located in index.html
function svgTo (type, svg, filename) {
  return fetch(`/convert/${type}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      // px: 666,
      svg: svg,
    })
  })
  .then(function (res) { return res.blob() })
  .then(function (blob) {
    const a = document.createElement("a")
    const objectUrl = URL.createObjectURL(blob)
    a.href = objectUrl
    a.download = filename
    a.click()
    return objectUrl
  })
  .then(function (ou) {
    URL.revokeObjectURL(ou)
  })
  .catch(console.error)
}

function svgToPng (svg, filename) {
  return svgTo("png", svg, filename)
}

function svgToPdf (svg, filename) {
  return svgTo("pdf", svg, filename)
}

function getDownloadViewBox () {
  var viewBoxValue
  var cameraViewContainer = document.querySelector('.camera-view input:checked + label svg')
  if (cameraViewContainer) {
    viewBoxValue = cameraViewContainer.getAttribute('viewBox')
  } else {
    viewBoxValue = '10 10 540 540'
  }
  return viewBoxValue
}

function getSVG () {
  var viewBoxValue = getDownloadViewBox()
  var text = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  id="character" width="560" height="560" viewBox="' + viewBoxValue + '">\n'
  text+='<defs> Copyright (c) 2014-2020 Frederic Guimont, all rights reserved \n <a href="https://creativecommons.org/licenses/by-nc/2.0/">Distributed under the Creative Commons CC-BY-NC license</a> \n Commercial license available to patrons on https://www.patreon.com/charactercreator \n You can recreate this character using this URL: <!--'+window.location.href+'--></defs> \n'
  var svgRaw = document.getElementById('svg1').childNodes
  var svgNodes
  var svgString
  var event

  purgeHiddenLayers()

  // This previous version of the text contains all svg files shown and hidden
  // It will need to be filtered to keep only the layers needed for our purpose
  if (currentUser && currentUser.cc.personnageActuel !== '') {
    filename = currentUser.cc.personnageActuel + '.svg'
  }

  svgNodes = Array.prototype.slice.call(svgRaw)

  svgNodes.forEach(function (item) {
    // This removes only useless layers and allows us to o the next test.
    if (item.innerHTML && (!item.style || !item.style.opacity || item.style.opacity != 0)) {
      svgString = '<g id="' + item.id + '">' + item.innerHTML + '</g>'
      text += svgString
    }
  })

  text += '</svg>'
  return text
}

function download (ev) {
  ev.preventDefault()

  gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Download', eventLabel: 'Download SVG file of character' })
  // TODO make the filename the character's name if possible.
  var filename = c.choices.name || 'my_character.svg'
  var pom
  var text = getSVG()
  // TODO Copy the URL before it is erased by the download function.

  const format = document.querySelector("input[name=download-format]:checked").value

  if (format === "png") {
    filename = c.choices.name || 'my_character.png'
    return svgToPng(text, filename)
      .then(function () {
        caboose()
      })
  }

  if (format === "pdf") {
    filename = c.choices.name || 'my_character.pdf'
    return svgToPdf(text, filename)
      .then(function () {
        caboose()
      })
  }

  pom = document.createElement('a')
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
  pom.setAttribute('download', filename)

  if (document.createEvent) {
    event = document.createEvent('MouseEvents')
    event.initEvent('click', true, true)
    pom.dispatchEvent(event)
  } else {
    pom.click()
  }
  caboose()
}
function initEyes () {
  // consolelog('initEyes')

  var svgContainer = document.querySelector('#svg1')
  var characterHead = document.querySelector('#body_head_default')
  var eyeSockets = document.querySelector('#eyes_neutral')
  var eyeLeftSocket = document.querySelector('#eye_left')
  var eyeRightSocket = document.querySelector('#eye_right')
  var eyeLeft = document.querySelector('#eyeball_left')
  var eyeRight = document.querySelector('#eyeball_right')
  var characterHeadCenter = {}
  var eyeRightCenter = {}
  var eyeLeftCenter = {}
  var scaleMod, focus

  // consolelog('svgContainer', svgContainer)

  init()

  function init () {
    // consolelog('svgContainer', svgContainer)
    // consolelog('characterHead', characterHead)
    var propotionalPlacement = 0.4243902439
    var svgContainerPos = getPosition(svgContainer)
    var characterHeadPos = characterHead.getBoundingClientRect()
    var eyeLeftPos = eyeLeft.getBoundingClientRect()
    var eyeRightPos = eyeRight.getBoundingClientRect()
    scaleMod = characterHeadPos.width / 41
    // alohaLogoCenter.x = logoContainerPos.x + (logoContainerPos.width/2);
    characterHeadCenter.y = svgContainerPos.y + (characterHeadPos.height * propotionalPlacement) // propotional placement of eyes.
    eyeRightCenter.x = eyeRightPos.x + (eyeRightPos.width / 2)
    eyeLeftCenter.x = eyeLeftPos.x + (eyeLeftPos.width / 2)
  }

  // Mouse movement
  document.onmousemove = handleMouseMove

  function centerGaze () {
    // consolelog('centerGaze')
    eyeRight.style.transform = 'scale(1, 1)'
    eyeLeft.style.transform = 'scale(1, 1)'
    eyeSockets.style.transform = 'translateY(0)'
    eyeLeftSocket.style.transform = 'translateX(0)'
    eyeRightSocket.style.transform = 'translateX(0)'
  }

  function handleMouseMove (event) {
    var mod = 0.08333333333
    var eventDoc, doc, body, diffXLeft, diffXRight, diffY, diffXLeftAbs, diffXRightAbs, diffYabs, newXRight, newXLeft, newY, modX, modXLeft, modXRight, modY, newWidth, newWidthLeft, newWidthRight, newHeight

    event = event || window.event // IE-ism

    // If pageX/Y aren't available and clientX/Y are, calculate pageX/Y.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
      eventDoc = (event.target && event.target.ownerDocument) || document
      doc = eventDoc.documentElement
      body = eventDoc.body

      event.pageX = event.clientX +
          (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
          (doc && doc.clientLeft || body && body.clientLeft || 0)
      event.pageY = event.clientY +
          (doc && doc.scrollTop || body && body.scrollTop || 0) -
          (doc && doc.clientTop || body && body.clientTop || 0)
    }

    // diffX = event.pageX - alohaLogoCenter.x;
    diffXRight = event.pageX - eyeRightCenter.x
    diffXLeft = event.pageX - eyeLeftCenter.x
    diffY = event.pageY - characterHeadCenter.y

    diffXLeftAbs = diffXLeft < 0 ? diffXLeft * -1 : diffXLeft
    diffXRightAbs = diffXRight < 0 ? diffXRight * -1 : diffXRight
    diffYabs = diffY < 0 ? diffY * -1 : diffY

    if (diffXRightAbs > diffYabs) {
      if (diffXRight > (3 * scaleMod)) { newXRight = 3 } else if (diffXRight < (-3 * scaleMod)) { newXRight = -3 } else { newXRight = (diffXRight / scaleMod) }
      newY = 3 * diffYabs / diffXRightAbs
      if (diffY < 0) { newY = newY * -1 }
    } else {
      if (diffY > 0) { newY = 3 } else { newY = -3 }
      newXRight = 3 * diffXRightAbs / diffYabs
      if (diffXRight < 0) { newXRight = newXRight * -1 }
    }
    //
    if (diffXLeftAbs > diffYabs) {
      if (diffXLeft > 0) { newXLeft = 3 } else { newXLeft = -3 }
      newY = 3 * diffYabs / diffXLeftAbs
      if (diffY < 0) { newY = newY * -1 }
    } else {
      if (diffY > 0) { newY = 3 } else { newY = -3 }
      newXLeft = 3 * diffXLeftAbs / diffYabs
      if (diffXLeft < 0) { newXLeft = newXLeft * -1 }
    }

    if (newXLeft < 0) { modXLeft = newXLeft * -1 } else { modXLeft = newXLeft }
    if (newXRight < 0) { modXRight = newXRight * -1 } else { modXRight = newXRight }
    if (newY < 0) { modY = newY * -1 } else { modY = newY }

    newHeight = 1 - (modY * mod)
    newWidth = 1 - (modX * mod)
    newWidthRight = 1 - (modXRight * mod)
    newWidthLeft = 1 - (modXLeft * mod)

    if (diffY < 0) {
      if (newXRight < 0) {
        newXRight = newXRight + (newY * -2 / 3)
        if (newXRight > 0) { newXRight = 0 }
      }
      if (newXLeft > 0) {
        newXLeft = newXLeft - (newY * -2 / 3)
        if (newXLeft < 0) { newXLeft = 0 }
      }
    }

    // eyeRight.style.transform = "scale(" + newWidth + ", " + newHeight + ")";
    // eyeLeft.style.transform = "scale(" + newWidth + ", " + newHeight + ")";
    // eyeSockets.style.transform = "translateY(" + newY + "px)";

    eyeLeft.style.transform = 'translateX(' + newXLeft + 'px)'
    eyeRight.style.transform = 'translateX(' + newXRight + 'px)'

    clearTimeout(focus)
    focus = setTimeout(centerGaze, 1500)
  }
}
function createForm (sex, forms) {
  var svgContent = ''
  var itemsThumbsContent = document.querySelector('#content_1')

  itemsThumbsContent.innerHTML = ''

  var sex = sex || c.choices.sex
  var forms = forms || window.forms
  var sectionNames = ['Head', 'Accessories', 'Torso', 'Body', 'Legs', 'Feet']
  var sectionHtml = '<h2 class="sidebar__title"><svg class="icon"><use xlink:href="#icon-coathanger"></use></svg>Categories</h2>'

  sectionHtml += '<ul class="section__list">'

  for (var f in forms) {
    var formContainer = document.querySelector('#content_1')
    var newHtml = ''
    var selcount = 0

    sectionHtml += '<section class="accordeon__section-label"><span class="accordeon__section-title"><svg class="icon"><use xlink:href="#' + getIconId(sectionNames[f], sex) + '"></use></svg><span class="accordeon__section-title__text">' + sectionNames[f] + '</span></span><div class="accordeon__svg-container section-btn--hide"><svg width="1em" height="1em"><use xlink:href="#accordeon_btn"/></svg></div></section><div class="accordeon__content section--hide">'

    var formsLength = forms.length
    var formCounter = formsLength

    for (var x in forms[f]) {
      sectionHtml += '    <a class="section__link"><li class="sbl__option" tabindex="0">' + x + '</li></a>'
      var sectionTitle = x
      var t = sectionTitle.toLowerCase()
      newHtml += '    <div class="Row options__container options__' + t + '"><span class="svg__section__title">' + t + '</span><div class="thumbnails__container">'
      var xsel = hash.get(t)
      var options = forms[f][x].map(function (d, i) {
        var tempId = '#' + t + '_' + d
        var multiLayer = window.multiLayer
        var sections = getSectionsFromIdMultiLayer(multiLayer, tempId)

        if (t === 'emotion') {
          var sections = []
          var emotions = GetEmotionGetLayers(d)
          for (emo in emotions) {
            var newEmo = '#' + emotions[emo] + '_' + d
            sections.push(newEmo)
          };
        }

        var viewBox = getViewBox(t, d)

        // consolelog('t', t)
        // consolelog('d', d)

        if (d === '') { svgContent = '<use xlink:href="#icon-none"></use>' } else { svgContent = '' }
        newHtml += '    <div class="option__container option__' + t + '_' + d + '" tabindex="0"><svg viewBox="' + viewBox + '" class="svg__option ' + t + '_' + d + '">' + svgContent + '</svg><span class="option__label">' + d + '</span></div>'
      }).join('\n')

      var defaultValue = hash.get(x)

      if (defaultValue !== undefined) {
        var defval = 'selected="' + defaultValue + '" '
      } else {
        var defval = ''
      }

      htagc = x.toLowerCase() + 'Color'
      var hashColor = hash.get(htagc)

      if (hashColor !== undefined) {
        var colorValue = hashColor
      } else {
        var colorValue = '#ffffff'
      }
      newHtml += '    </div>'
      newHtml += '</div>'
      selcount++
      // consolelog('newHtml', newHtml)
    }
    sectionHtml += '</div>'
    var htmlObject = document.createElement('div')
    htmlObject.innerHTML = newHtml
    formContainer.appendChild(htmlObject)
  }

  sectionHtml += '</ul>'
  var sectionContainer = document.querySelector('#sidebar-left')
  var sectionList = document.createElement('div')

  sectionList.innerHTML = sectionHtml
  sectionContainer.innerHTML = ''
  sectionContainer.appendChild(sectionList)

  var sidebarLeftOptions = document.querySelectorAll('.sbl__option')
  var optionThumbnails = document.querySelectorAll('.option__container')
  var sectionButtons = document.querySelectorAll('.accordeon__section-label')
  var sectionColor = document.querySelectorAll('.section__color')

  addEventListenerList(sidebarLeftOptions, 'mouseover', showThumbOptions)
  addEventListenerList(sidebarLeftOptions, 'focus', showThumbOptions)
  addEventListenerList(sidebarLeftOptions, 'click', openThumbs)
  addEventListenerList(optionThumbnails, 'click', changeOption)
  addEventListenerList(sectionButtons, 'click', toggleSection)
  addEventListenerList(sectionColor, 'click', addColorPicker)
}

function getSectionsFromIdMultiLayer (multiLayer, tempId) {
  var sections = []
  var layerCount = isInMultiLayerArray(tempId.slice(1), multiLayer)
  if (layerCount > 0) {
    for (var i = 1; i <= layerCount; i++) {
      newLayer = tempId + '_' + i + '_of_' + layerCount
      sections.push(newLayer)
    }
  } else {
    sections = [tempId]
  }
  return sections
}

function getSectionLayersList (section) {
  var sex = c.choices.sex
  var formList
  var formCounter
  var itemList

  section = capitalizeFirstLetter(section)

  if (sex === 'm') {
    formList = window.maleFormList
  } else {
    formList = window.femaleFormList
  }

  formCounter = formList.length
  while (formCounter--) {
    if (section in formList[formCounter]) {
      itemList = formList[formCounter][section]
    }
  }
  return itemList
}

function replaceMultilayer (layersList, section) {
  var multiLayer = getMultiLayer()
  var sex = c.choices.sex
  var counter = layersList.length
  var multiLayer = getMultiLayer()
  var multiCounter
  var fullList = []
  var currentItem
  var currentQty
  var currentIndex
  var qtyCounter

  if (section != undefined) {
    while (counter--) {
      if (layersList[counter] != '') {
        fullList.push(section + '_' + layersList[counter])
      }
    }
  } else {
    counter = layersList.length
    while (counter--) {
      if (layersList[counter].slice(-1) != '_') {
        fullList.push(layersList[counter])
      }
    }
  }
  multiCounter = multiLayer.length

  while (multiCounter--) {
    currentItem = multiLayer[multiCounter][0]
    if (fullList.includes(currentItem)) {
      currentIndex = fullList.indexOf(currentItem)
      fullList.splice(currentIndex, 1)
      currentQty = multiLayer[multiCounter][1]
      qtyCounter = currentQty
      while (qtyCounter--) {
        fullList.push(currentItem + '_' + (qtyCounter + 1) + '_of_' + currentQty)
      }
    }
  }
  return fullList
}

function loadSectionLayers (section, layersList, callback, callbackLoopFlag) {
  var tempLayerList = []
  var layerCounter
  layerCounter = layersList.length

  if (section === 'emotion') {
    while (layerCounter--) {
      tempLayerList = tempLayerList.concat(fromEmotionGetLayers(layersList[layerCounter]))
    }
    layersList = tempLayerList
  } else if (section === 'pupils') {
    layersList = ['eyeballs_default']
  } else if (section === 'body') {
    while (layerCounter--) {
      tempLayerList = tempLayerList.concat(bodyTypesToLayers(layersList[layerCounter]))
    }
    layersList = tempLayerList
  } else {
    layersList = replaceMultilayer(layersList, section)
  }
  loadFilesFromList(layersList, callback, callbackLoopFlag)
}

function getPositionDir (layer) {
  // Apply the right subfolder when loading files
  var positionDir
  var sex = c.choices.sex

  if (sex === 'm' && ((window.maleBody.bodyBack && window.maleBody.bodyBack.indexOf(layer) > -1 )  || (window.maleBody.bodyMiddle && window.maleBody.bodyMiddle.indexOf(layer) > -1 )  || (window.maleBody.bodyFront && window.maleBody.bodyFront.indexOf(layer) > -1 )  || (window.maleBody.bodyOver && window.maleBody.bodyOver.indexOf(layer) > -1 ))) {
    positionDir = window.maleBodyPositionFolder + '/'
  } else if (sex === 'm' && ((window.maleHead.headBack && window.maleHead.headBack.indexOf(layer) > -1 )  || (window.maleHead.headMiddle && window.maleHead.headMiddle.indexOf(layer) > -1 ) || (window.maleHead.headFront && window.maleHead.headFront.indexOf(layer) > -1 ) || (window.maleHead.headOver && window.maleHead.headOver.indexOf(layer) > -1 ))) {
    positionDir = 'head_front_default/'
  } else if (sex === 'f' && ((window.femaleBody.bodyBack && window.femaleBody.bodyBack.indexOf(layer) > -1 ) || (window.femaleBody.bodyMiddle && window.femaleBody.bodyMiddle.indexOf(layer) > -1 ) || (window.femaleBody.bodyFront && window.femaleBody.bodyFront.indexOf(layer) > -1 ) || (window.femaleBody.bodyOver && window.femaleBody.bodyOver.indexOf(layer) > -1 ))) {
    positionDir = window.femaleBodyPositionFolder + '/'
  } else if (sex === 'f' && ((window.femaleHead.headBack && window.femaleHead.headBack.indexOf(layer) > -1 ) || (window.femaleHead.headMiddle && window.femaleHead.headMiddle.indexOf(layer) > -1 ) || (window.femaleHead.headFront && window.femaleHead.headFront.indexOf(layer) > -1 ) || (window.femaleHead.headOver && window.femaleHead.headOver.indexOf(layer) > -1 ))) {
    positionDir = 'head_front_default/'
  }
  return positionDir
}

function loadFilesFromList (layersList, callback, callbackLoopFlag) {
  var layerDirectory
  var sex = c.choices.sex
  var file
  var layerID
  var counter
  var layers
  var positionDir

  if (sex === 'm') {
    layerDirectory = 'layer/male/'
    layers = window.layersMale
  } else {
    layerDirectory = 'layer/female/'
    layers = window.layersFemale
  }

  counter = layersList.length

  while (counter--) {
    layerID = layersList[counter]

    if (layers.indexOf(layerID) === -1) {
      continue
    }

    positionDir = getPositionDir(layerID)
    consolelog('positionDir', positionDir)
    file = layerDirectory + positionDir + layerID + '.svg'

    fetch(file).then(function (response) {
      return response.text()
    }).then(function (text) {
      var htmlObject = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      var svgObject
      var pupilShape
      var layerID
      var layerIDArray
      var nextLayerSibling
      var svgContainer = document.querySelector('#svg1 .character-container')
      var outline = svgContainer.querySelector('#outline')
      htmlObject.innerHTML = text
      svgObject = htmlObject.querySelector('g')

      if (callbackLoopFlag) {
        svgObject.style.opacity = 0
        svgObject.style.pointerEvents = 'none'
      }
      svgObject = colorElement(svgObject)
      layerID = svgObject.id

      if (layerID === 'eyeballs_default') {
        pupilShape = getPupilShape()
        svgObject = showPupilObject(svgObject, pupilShape)
      }
      layerIDArray = layerID.split('_')
      nextLayerSibling = findNextLayerInDom(layerID)
      if ((svgContainer.querySelector('#' + layerID)) === null) {
        if (nextLayerSibling != null) {
          nextLayerSibling.parentNode.insertBefore(svgObject, nextLayerSibling)
        } else {
          if (outline) {
            outline.parentNode.insertBefore(svgObject, outline)
          } else {
            document.querySelector('#svg1 .character-container').appendChild(svgObject)
          }
        }
      }
      return svgObject
    }).then(function (svgObject) {
      var iris
      if (callback && typeof callback === 'function' && callbackLoopFlag) {
        iris = svgObject.querySelector('#eyeball_right')
        if (iris) {
          svgObject = iris
        }
        callback(svgObject)
      }
    })
  }
}

function getPupilShape () {
  return c.choices.pupils || 'round'
}

function addEventListenerList (list, event, fn) {
  var listLength = list.length
  var listCounter = listLength
  var i
  while (listCounter--) {
    i = listLength - listCounter - 1
    list[i].addEventListener(event, fn, false)
  }
}

function closeSections (exception) {
  var sectionButtons = document.querySelectorAll('.accordeon__section-label')
  var displayButtons = document.querySelectorAll('.accordeon__svg-container')
  var i = sectionButtons.length

  while (i--) {
    var section = sectionButtons[i]

    if (section !== exception && section.parentNode.parentNode.parentNode.classList.contains('sidebar-left')) {
      var button = displayButtons[i]
      var sectionContent = section.nextSibling

      if (sectionContent.classList === undefined && sectionContent.nextSibling.classList != undefined) {
        sectionContent = sectionContent.nextSibling
      }
      if (!sectionContent.classList.contains('section--hide')) {
        sectionContent.classList.toggle('section--hide')
      }
      if (!button.classList.contains('section-btn--hide')) {
        button.classList.toggle('section-btn--hide')
      }
    }
  }
}

function toggleSection (ev) {
  var el = ev.target
  var sectionLabel
  var elChild
  var parent = getParent(el, '.accordeon__section-label')
  elChild = parent.querySelector('.accordeon__section-title__text')

  if (elChild != null) {
    sectionLabel = elChild.innerHTML
    sectionZoom(sectionLabel)
  }

  var _ = this

  if (this.parentNode.parentNode.parentNode.classList.contains('sidebar-left')) {
    closeSections(_)
  };
  removeAlert(_)
  showSection(_)
}

function showSection (_) {
  var sectionContent = _.nextSibling
  var maxHeight
  var displayButton

  if (sectionContent.classList === undefined && sectionContent.nextSibling.classList != undefined) {
    sectionContent = sectionContent.nextSibling
  }
  maxHeight = sectionContent.clientHeight
  displayButton = _.querySelector('.accordeon__svg-container')

  if (sectionContent.classList.contains('accordeon__content')) {
    if (sectionContent.classList.contains('section--hide')) {
    } else {
      sectionContent.style.maxHeight = maxHeight
    };
    sectionContent.classList.toggle('section--hide')
    displayButton.classList.toggle('section-btn--hide')
  }
}

function removeAlert (_) {
  var alert = document.querySelector('.alert')
  if (alert != null) {
    alert.classList.remove('alert')
  }
  if (_.classList.contains('alert')) {
    _.classList.remove('alert')
  };
}

function changeOption () {
  var category = this.parentNode.parentNode.firstChild.innerHTML
  var userChoice = this.lastChild.innerHTML
  var colors = document.querySelector('.colorpicker-wrapper').previousSibling
  if (colors.classList === undefined && colors.previousSibling.classList != undefined) {
    colors = colors.previousSibling
  }
  show(userChoice, category)
  colors.classList.add('alert')
}

function getIconId (sectionName, sex) {
  var iconDictMale = {
    Head: 'icon-face',
    Accessories: 'icon-glasses',
    Torso: 'icon-shirt',
    Body: 'icon-underwear',
    Legs: 'icon-pants',
    Feet: 'icon-shoes'
  }
  var iconDictFemale = {
    Head: 'icon-face',
    Accessories: 'icon-glasses',
    Torso: 'icon-shirt',
    Body: 'icon-underwear',
    Legs: 'icon-dress',
    Feet: 'icon-shoes'
  }
  if (sex === 'f') {
    return iconDictFemale[sectionName]
  } else if (sex === 'm') {
    return iconDictMale[sectionName]
  } else {
    return 'icon-face'
  }
}
var maleForm1 = {
  Body_head: ['default', 'diamond', 'heart', 'oblong', 'oval', 'round', 'square', 'triangle'],
  Ears: ['default', 'elven', 'pointed', 'outstretched', 'plugged', 'unplugged'],
  Iris: ['default'],
  Pupils: ['round', 'feline', 'star'],
  Nose: ['default', 'pointed', 'roman', 'strong', 'syrid'],
  Mouth: [''],
  Facialhair: ['', 'beard_boxed', 'beard_ducktail', 'beard_guru', 'beard_intelectual', 'beard_rap', 'beard_raw', 'chinpuff', 'goatee', 'goatee_raw', 'moustache', 'moustache_dali', 'moustache_thick', 'muttonchops', 'muttonchops_friendly', 'soulpatch', 'winnfield'],
  Hair: ['', 'afro', 'balding', 'balding_crazy', 'balding_crown', 'crewcut', 'down', 'emo', 'spider', 'gelled', 'wavy', 'manga', 'mohawk', 'wild', 'wreckingball'],
  Freckles: ['', 'medium'],
  Emotion: ['neutral', 'alertness', 'amusement', 'anger', 'anxiety', 'aversion', 'betrayal', 'caged', 'concern', 'cruel', 'dejection', 'desperation', 'disdain', 'disgust', 'eeww', 'fear', 'grief', 'horror', 'indignation', 'joy', 'laughing', 'melancholy', 'omg', 'outrage', 'pain', 'rage', 'revulsion', 'sadness', 'satisfaction', 'shock', 'sterness', 'surprise', 'terror', 'wonder', 'wtf']
}
var maleForm2 = {
  Smoke: ['', 'blunt', 'cigar', 'cigarette', 'filter', 'pipe_subgenius'],
  Earings: ['', 'gold_rings', 'gold_ring_right', 'gold_ring_left'],
  Hat: ['', 'baseball', 'berret', 'berret_badge', 'bucket', 'cap', 'chinese_farmer', 'country', 'cowboy', 'crown_gold_spheres', 'fedora', 'football', 'fox-ears', 'jester', 'top', 'motorcycle', 'police', 'scumbag', 'helmet_vietnam', 'tuque', 'turban', 'strainer', 'magritte', 'xmas'],
  Horns: ['', 'devil', 'large'],
  Mask: ['', /* 'arrow', */ 'guy_fawkes', 'robin', 'horse', 'hospital', 'phantom', 'stormtrooper', 'jason', 'cat'],
  Glasses: ['', 'alien', 'designer', 'fpv', 'goggles', 'google', 'hipster', 'kurt', 'neon', 'oakley', 'rayban', 'round', 'visor', 'wayrafer'],
  Eyepatch: ['', 'left', 'right'],
  Headband: ['', 'medium', 'tied'],
  Necklace: ['', 'chain', 'dogtags', 'stethoscope'],
  Warpaint: ['', 'clawmarks', 'football', 'stripe'],
  Earpiece: ['', 'microphone', 'neurolink', 'scouter']
}
var maleForm3 = {
  Shirt: ['', 'tanktop', 'colar', 'kurta', 'tshirt', 'turtleneck'],
  Tie: ['', 'neck', 'bolo', 'bow'],
  Vest: ['', 'vest', 'lined', 'insulated', 'mandarin', 'u-neck', 'yellow', '3-button_asymmetric', '6-button_asymmetric', '2x4-button_double-breasted', '2x5-button_double-breasted', '2x2-button_double-breasted', '2x3-button_double-breasted', '5-button_basic', '6-button_basic', '3-button_basic', '4-button_basic', '3-pocket', '4-pocket', 'no-pockets', '2-lower-pockets', 'shawl_round', 'shawl_pointed', 'peak', 'notched'/*, 'no-collar'*/],
  Button: ['', 'heart', 'peace', 'smile'],
  Holster: ['', 'revolver_chest', 'revolver_hip'],
  Shoulderpads: ['', 'artillery', 'general', 'plated', 'spikes'],
  Scarf: ['', 'parisian_knot', 'twice_around', 'four_in_hand', 'reverse_drape_cross', 'reverse_drape_tuck', 'fake_knot', 'reverse_drape', 'chest_warmer', 'overhand', 'once_around', 'drape']
}
var maleForm4 = {
  Body: ['default', 'athletic', 'veiny', 'android-00'],
  Scar: ['', 'horizontal_neck', 'horizontal_nose', 'vertical_heart', 'vertical_left', 'vertical_right'],
  Tatoo: ['', 'aum_chest', 'aum_left', 'aum_right', 'chaos_chest', 'chaos_left', 'chaos_right'],
  Suit: ['', 'borat', 'wetsuit'],
  Jacket: ['', 'suit', 'suit_open'],
  Coat: ['', 'biker', 'fall_long', 'lab', 'trench', 'scientist', 'snowboard', 'varsity'],
  Cloak: ['', 'default', 'dracula'],
  Armband: ['', 'bandage_left', 'bandage_right'],
  Watch: ['', 'generic', 'sinn'],
  Gloves: ['', 'boxing', 'lab', 'motorcycle'],
  Wings: ['', 'angel', 'devil', 'fairy', 'skeleton'],
  Pet: ['', 'feline', 'raven', 'rat', 'canine', 'siamese_cat', 'gerbil', 'chicken', 'fox', 'vulture', 'parrot', 'doge']
}
var maleForm5 = {
  Underwear: ['', 'plain', 'boxers'],
  Pants: ['', 'cargo', 'suit', 'jeans', 'jeans_rolled', 'leather', 'snowboard'],
  Belt: ['', 'cargo', 'default', 'bullet', 'ring', 'straps', 'utility', 'leather'],
  Kneepads: ['', 'skate']
}
var maleForm6 = {
  Socks: ['', 'socks'],
  Shoes: ['', 'cowboy', 'hightops', 'leather', 'loafers', 'flip-flops', 'moon']
}

var femaleForm1 = {
  Body_head: ['default', 'heart', 'oblong', 'oval', 'round', 'square', 'diamond', 'triangle'],
  Ears: ['default', 'elven', 'pointed', 'outstretched', 'plugged', 'unplugged'],
  Iris: ['default'],
  Pupils: ['round', 'feline', 'star'],
  Nose: ['default', 'pointed', 'roman', 'strong', 'syrid'],
  Mouth: [''],
  Hair: ['', 'afro', 'bangs', 'down', 'flowing', 'manga', 'mohawk', 'pigtails', 'ponytail', 'short', 'short_slick', 'starlet', 'odango', 'emo', 'punky', 'spider', 'wreckingball'],
  Freckles: ['', 'medium'],
  Emotion: ['neutral', 'default', 'alertness', 'amusement', 'anger', 'aversion', 'dejection', 'disdain', 'disgust', 'grief', 'indignation', 'joy', 'laughter', 'melancholy', 'rage', 'sadness', 'sterness', 'surprise', 'shock', 'wonder']
}
var femaleForm2 = {
  Smoke: ['', 'blunt', 'cigar', 'cigarette', 'filter', 'pipe_subgenius'],
  Makeup: ['', 'blush', 'clawmarks', 'gothic_eyeliner', 'stripe', 'warpaint'],
  Earings: ['', 'bells', 'death_drop', 'double-drop', 'gold_rings', 'gold_ring_right', 'gold_ring_left', 'lightning', 'triangle_mobile'],
  Eyepatch: ['', 'left', 'right'],
  Glasses: ['', 'alien', 'designer', 'fpv', 'goggles', 'google', 'hipster', 'kurt', 'neon', 'oakley', 'rayban', 'round', 'visor', 'wayrafer'],
  Headband: ['', 'medium', 'tied'],
  Hat: ['', 'baseball', 'beach', 'berret_badge', 'bucket', 'chinese_farmer', 'country', 'cowboy', 'crown_gold_spheres', 'football', 'fox-ears', 'top', 'waitress', 'police', 'scumbag', 'helmet_vietnam', 'tiara', 'strainer', 'magritte', 'motorcycle', 'tuque', 'cap', 'xmas'],
  Mask: ['', /* 'arrow', */ 'guy_fawkes', 'horse', 'hospital', 'phantom', 'stormtrooper', 'jason', 'cat'],
  Horns: ['', 'devil'],
  Earpiece: ['', 'microphone', 'neurolink', 'scouter'],
  Veil: ['', 'al-amira', 'hijab', 'khimar', 'niqab', 'shayla']
}
var femaleForm3 = {
  Collar: ['', 'egyptian', 'leather', 'metal'],
  Necklace: ['', 'dogtags', 'heart', 'perl', 'princess', 'stethoscope', 'squared-circle'],
  Bra: ['', 'bow', 'grid', 'sports'],
  Top: ['', 'asymetric', 'loop', 'tank', 'tube_v'],
  Shirt: ['', 'sweat'],
  Button: ['', 'heart', 'peace', 'smile'],
  Shoulderpads: ['', 'artillery', 'general', 'plated', 'spikes'],
  Scarf: ['', 'chest_warmer', 'parisian_knot', 'twice_around', 'four_in_hand', 'reverse_drape_cross', 'reverse_drape_tuck', 'fake_knot', 'reverse_drape', 'overhand', 'once_around', 'drape']
}
var femaleForm4 = {
  Body: ['default', 'athletic', 'veiny', 'android-00'],
  Tatoo: ['', 'chaos_chest', 'chaos_left', 'chaos_right', 'tribal_face', 'archeopteryx_left'],
  Nails: ['short', 'long', 'claws'],
  Holster: ['', 'revolver_chest', 'revolver_hip', 'revolver_thigh'],
  Suit: ['', 'asymetric', 'bands', 'onepiece', 'wetsuit'],
  Blouse: ['', 'cherry'],
  Dress: ['', 'accolade', 'bobafett', 'casual', 'corset', 'chinatown', 'suit', 'waitress', 'short', 'cheerleader', 'japanese_pleat', 'parisian_fall', 'german_expression', 'zig_zag', 'zip'],
  Coat: ['', 'biker', 'lab', 'winter_furcollar', 'winter_tubecollar'],
  Armband: ['', 'bandage_left', 'bandage_right', 'egyptian_left', 'egyptian_right'],
  Bracelet: ['', 'band_right', 'band_left', 'egyptian_right', 'egyptian_left', 'ornamental_right', 'ornamental_left', 'perl_right', 'perl_left', 'rings_left', 'rings_right', 'wonder_left', 'wonder_right'],
  Gloves: ['', 'silk_fingerless_striped'],
  Pet: ['', 'feline', 'raven', 'rat', 'canine', 'siamese_cat', 'gerbil', 'chicken', 'fox', 'vulture', 'parrot', 'doge'],
  Vest: ['', 'yellow'],
  Cloak: ['', 'dracula'],
  Wings: ['', 'angel', 'devil', 'fairy', 'skeleton']
}
var femaleForm5 = {
  Underwear: ['', 'boyshorts', 'plain', 'string', 'tanga', 'thong'],
  Shorts: ['', 'bikini', 'short'],
  Skirt: ['', 'a-line', 'draped', 'school_short', 'school', 'school_long'/*, 'tube' */],
  Pants: ['', 'cargo', 'yoga', 'yoga_torn', 'jeans', 'jeans_rolled', 'jeans_torn', 'jeans_bellbottoms'],
  Belt: ['', 'bullet', 'utility', 'satchel'],
  Kneepads: ['', 'skate']
}
var femaleForm6 = {
  Leggings: ['', 'fishnet', 'regular', 'striped', 'torn'],
  Shoes: ['', 'cowboy', 'flip-flops', 'hightops', 'highheels', 'moon', 'plateforms', 'sandals_roman']
}

// Color Pallettes
var skinTones = ['#FFDFC4', '#F0D5BE', '#EECEB3', '#E1B899', '#E5C298', '#FFDCB2', '#E5B887', '#E5A073', '#E79E6D', '#DB9065', '#CE967C', '#C67856', '#BA6C49', '#A57257', '#F0C8C9', '#DDA8A0', '#B97C6D', '#A8756C', '#AD6452', '#5C3836', '#CB8442', '#BD723C', '#704139', '#A3866A']
var fabricPallette = ['#25282f', '#494a52', '#323346', '#6f7581', '#c3c3c5', '#ece9ec', '#f3e3d4', '#434d71', '#f4e2c1', '#ba855e', '#b19f92', '#9e9888','#AFE5F2','#56B2C4','#19345B','#D14519','#990629','#139DB3','#90A6D1','#B88FC9','#BAE0A8','#EDD2F3','#928074','#F9CFA4','#F0EEA3','#856CAE','#92A3D7','#5F6B6B','#BEE9C5','#EDDBB5','#8E592D','#A59387','#97907D','#B5B6B8','#ECEAED','#F1E1CA','#2D3858','#525460','#242635','#29272A','#242829','#5D5752','#756452','#947A5A','#BB9563','#C6AE8F','#C5BBAF','#E0DCD6','#FCFCFC','#223241','#382911','#9E815B','#7D7C78','#9D9D9D','#1F303F','#303929','#09131D','#A47F50','#80020B','#8387A0','#FBE9EB','#C0DAEC']
var layerDirectoryFemale = 'layer/female/'
var layerDirectoryMale = 'layer/male/'

function countItems (list) {
  let sum = 1
  for (const r in list) {
    // filter(Boolean) filters out "" cases
    sum *= list[r].filter(Boolean).length || 1
  }
  return sum
}

var maleTotal = countItems(maleForm1) * countItems(maleForm2) * countItems(maleForm3) * countItems(maleForm4) * countItems(maleForm5) * countItems(maleForm6) * skinTones.length;
var femaleTotal = countItems(femaleForm1) * countItems(femaleForm2) * countItems(femaleForm3) * countItems(femaleForm4) * countItems(femaleForm5) * countItems(femaleForm6) * skinTones.length;
consolelog('Hey ! welcome, you have  ' + (maleTotal + femaleTotal) + ' possibilities')

window.maleFormList = [maleForm1, maleForm2, maleForm3, maleForm4, maleForm5, maleForm6]
window.femaleFormList = [femaleForm1, femaleForm2, femaleForm3, femaleForm4, femaleForm5, femaleForm6]
"use strict"

// NO GLOBALS
// USES DOM

const hamburger = () => document.querySelector('#horizontal').classList.toggle('hide')
"use strict"

// NO GLOBALS
// USES DOM

function getParent (el, sel) {
  if ((el.matches || el.matchesSelector).call(el, sel)) {
    return el
  };
  while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el, sel)));
  return el
}

const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1)

function rgb2hex (rgb) {
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i)
  return (rgb && rgb.length === 4) ? '#' +
  ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
  ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
  ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) : ''
}

function getPosition (el) {
  var x = 0
  var y = 0

  while (el) {
    if (el.tagName != 'BODY') {
      // for all other non-BODY elements
      x += (el.offsetLeft - el.scrollLeft + el.clientLeft)
      y += (el.offsetTop - el.scrollTop + el.clientTop)
    }

    el = el.offsetParent
  }
  return { x, y }
}

function purgeHiddenLayers () {
  var option = document.querySelector('#content_1 .selected--option')
  if (!option) { return }
  var section = option.classList[2].slice(9)
  var thumbsSVG = document.querySelectorAll('#content_1 .selected--option svg')
  var svg = document.querySelector('#svg1 #character-container')
  var counter = thumbsSVG.length
  var currentSVG
  var layersList = []
  var mutlilayerList = []
  while (counter--) {
    layersList.push(thumbsSVG[counter].classList[1])
  }
  layersList = replaceMultilayer(layersList)
  counter = layersList.length
  while (counter--) {
    currentSVG = svg.querySelector('#' + layersList[counter])
    if (currentSVG != null && currentSVG.style.opacity === '0') {
      svg.removeChild(currentSVG)
    }
  }
}

function showPupilObject (object, shape) {
  var pupils = object.querySelectorAll('.pupil')
  var shown = object.querySelectorAll('.pupil--' + shape)
  var counter = pupils.length
  while (counter--) {
    // pupils[counter].style
    if (pupils[counter].classList.contains('pupil--' + shape)) {
      pupils[counter].style.opacity = 1
    } else {
      pupils[counter].style.opacity = 0
    }
  }
  return object
}

function clearCharacter () {
  var svgContainer = document.querySelector('#svg1 .character-container')
  // Clear only what's in .current-character
  var toBeRemovedList = document.querySelectorAll('#svg1 .character-container > g')
  var counter = toBeRemovedList.length
  while (counter--) {
    if (toBeRemovedList[counter].id != 'male_silhouette' && toBeRemovedList[counter].id != 'female_silhouette') {
      svgContainer.removeChild(toBeRemovedList[counter])
    }
  }
}

function resetCharacterTemplate () {
  var characterSVG = document.querySelector('#svg1 .character-container')
  // Reset only what's in .current-character
  var elements = characterSVG.querySelectorAll('*')
  var elementsLength = elements.length
  var elementsCounter = elementsLength
  while (elementsCounter--) {
    if (elements[elementsCounter].style.opacity !== 0) {
      elements[elementsCounter].style.opactiy = '0'
      selements[elementsCounter].style.pointerEvents = 'none'
    }
  }
}

function findNextLayerInDom (item) {
  var sex = c.choices.sex
  var svgContainer = document.querySelector('#svg1 .character-container')
  // TODO search within .current-character
  var nextLayerSibling = null
  var layers
  var amountLayers
  var itemPosition
  if (sex === 'm') {
    layers = window.layersMale
  } else {
    layers = window.layersFemale
  }
  amountLayers = layers.length
  itemPosition = layers.indexOf(item)
  while (nextLayerSibling === null) {
    nextLayerSibling = svgContainer.querySelector('#' + layers[itemPosition + 1])
    if (itemPosition > amountLayers) {
      return
    }
    ++itemPosition
  }
  return nextLayerSibling
}

function bodyTypesToLayers (type) {
  var layers = []

  layers.push('body_torso_' + type)
  layers.push('body_leg_left_' + type)
  layers.push('body_leg_right_' + type)
  layers.push('body_foot_left')
  layers.push('body_foot_right')
  layers.push('body_arm_left_' + type)
  layers.push('body_arm_right_' + type)
  layers.push('body_forearm_left_' + type)
  layers.push('body_forearm_right_' + type)
  layers.push('body_hand_left')
  layers.push('body_hand_right')

  return layers
}

function onAllLoaded () {
  var zoomContainer = document.querySelector('.zoom-container')
  var maleSilhouette = document.getElementById('male_silhouette')
  var femaleSilhouette = document.getElementById('female_silhouette')
  var sideBarRight = document.querySelector('.sidebar-right')
  var sideBarLeft = document.querySelector('.sidebar-left')
  var downloadBtn = document.querySelector('#downloadButton')
  var characterSex
  var hashSex = hash.get('sex')

  if (hashSex) {
    characterSex = hashSex
  } else {
    characterSex = window.sex
  }

  if (!downloadBtn.classList.contains('.enabled')) {
    downloadBtn.addEventListener('click', showDownloadOptions, false)
    downloadBtn.classList.add('enabled')
  }

  femaleSilhouette.style.opacity = '0'
  maleSilhouette.style.opacity = '0'

  createForm(characterSex, forms)

  sideBarLeft.classList.add('visible')
  // sideBarRight.classList.add('visible');

  revealCharacter()

  zoomContainer.classList.add('zoom-container--show')
}

function processSection (section, item) {
  if (section === 'body' || section === 'ears' || section === 'nose' || section === 'eyes' || section === 'age' || section === 'freckles' || section === 'sockets' || section === 'scar' || section === 'wings' && item === 'devil') {
    section = 'skin'
  }
  if (section === 'mouth') {
    if (hash.get('mouthColor') != undefined) {
      section = 'mouth'
    } else {
      section = 'skin'
    }
  }
  if (section === 'facialhair' || section === 'brows') {
    section = 'hair'
  }
  return section
}

function onEachLoaded (frag, fileName) {
  var myLayer = fileName
  var seen

  if (toBeShown.indexOf(myLayer.split('/')[2].split('.')[0]) > -1) {
    seen = 1
  } else { seen = 0 };
  // Get the section, then the color
  var section = myLayer.split('/')[2].split('_')[0]
  var item = myLayer.split('/')[2].split('_')[1].split('.')[0]
  section = processSection(section, item)

  frag.select('*').attr({ opacity: seen })
}

function choicesToList (c) {
  var layersList = []
  var sex = c.choices.sex
  var counter = Object.keys(c.choices).length
  var keyChoice
  var valueChoice
  var layerChoice
  while (counter--) {
    keyChoice = Object.keys(c.choices)[counter]
    if (keyChoice.slice(-5) != 'Color' && keyChoice.slice(-9, -4) != 'Color') {
      valueChoice = c.choices[keyChoice]
      layerChoice = keyChoice + '_' + valueChoice
    }
  }
  return layersList
}

function choicesToLayers (c, multiLayer) {
  var selectedLayers = []
  var emotionLayers = fromEmotionGetLayers(c.choices.emotion)
  var choiceLayers = []
  var layersLength = emotionLayers.length
  var layersNum = emotionLayers.length
  var counter
  var tmpList
  var bodyType
  var bodyTypeList
  var bodyTypeCounter

  for (var index in c.choices) {
    if (index.slice(-5) != 'Color') {
      if (index + '_' + c.choices[index] === 'body_athletic' || index + '_' + c.choices[index] === 'body_default' || index + '_' + c.choices[index] === 'body_veiny' || index + '_' + c.choices[index] === 'body_android-00') {
        bodyType = c.choices[index]
        bodyTypeList = bodyTypesToLayers(bodyType)
        bodyTypeCounter = bodyTypeList.length
        while (bodyTypeCounter--) {
          choiceLayers.push(bodyTypeList[bodyTypeCounter])
        }
      } else {
        choiceLayers.push(index + '_' + c.choices[index])
      }
    }
  }

  for (var cl in choiceLayers) {
    if (choiceLayers[cl].slice(0, 7) === 'emotion') {
      tmpList = fromEmotionGetLayers(choiceLayers[cl].split('_')[1])
      counter = tmpList.length
      while (counter--) {
        selectedLayers.push(tmpList[counter])
      }
    } else {
      tmpList = getSectionsFromIdMultiLayer(multiLayer, '#' + choiceLayers[cl])
      counter = tmpList.length
      while (counter--) {
        selectedLayers.push(tmpList[counter].slice(1))
      }
    }
  };
  // Add layers to be shown when creating a new character.
  if (c.choices.sex === 'f') {
    selectedLayers.push('nails_short_1_of_2', 'nails_short_2_of_2')
  };
  // Make sure the eyeballs are included.
  if (selectedLayers.indexOf('eyeballs_default') < 0) {
    selectedLayers.push('eyeballs_default')
  }
  return selectedLayers
};

function fromEmotionGetLayers (emotion) {
  var facialEpressionLayers = []
  var modElement = ''
  var faceElements = ['brows', 'eyes', 'mouth', 'lashes', 'sockets']
  var faceElLength = faceElements.length
  var faceElNum = faceElLength
  var faceCount

  while (faceElNum--) {
    faceCount = (faceElLength - faceElNum - 1)
    modElement = faceElements[faceCount] + '_' + emotion
    facialEpressionLayers.push(modElement)
  }
  return facialEpressionLayers
};
// Change sex of character from male to female or vice versa.
function trans (sex) {
  if (c.choices.sex === sex) { return }
  var characterSVG = document.querySelector('#svg1 .character-container')
  characterSVG.classList.add('character--hide')
  hash.add({ sex: sex })
  hash.add({ emotion: 'neutral' }) // Female and Male templates have different set of emotions at this time.
  // ^ Should really check to see if the emotion doesn't exist before forcing a change to neutral.
  if (currentUser && currentUser.cc && currentUser.cc.personnages && currentUser.personnageActuel) {
    currentUser.cc.personnages[personnageActuel].sex = sex
  }
  window.sex = sex
  buildCharacter(resetForms)
}

// TODO change setTimeout to promises.
function buildCharacter (callback) {
  var characterSVG = document.querySelector('#svg1')
  setTimeout(function () {
    zoomFull()
    clearForms()
    clearCharacter()
    interpretHash()
    setTimeout(function () {
      characterSVG.classList.remove('character--hide')
      callback()
    }, 500)
  }, 500)
}

function hideForms () {
  hideSidebarLeft()
  hideSidebarRight()
}

function clearForms () {
  clearSidebarLeft()
  clearSidebarRight()
}

function resetForms () {
  hideForms()
  // TODO The following function should be a callback or a response to a promise.
  createForm()
  showSidebarLeft()
}

function Character (choices) {
  this.choices = choices || {
    emotion: 'neutral',
    body: 'default', // Or 'default' or 'veiny'.
    eyeballs: 'default',
    skinColor: this.skinTone, // '#ffd5d5', // Or some random skin color from
    hairColor: '#ffe680', // Or random from list of hair colors',
    irisColor: '#2ad4ff', // Or some random eye color
    underwear: 'plain', // or random, whatever.
    underwearColor: '#f2f2f2' // Or random from a list of fabrics',
  }
  this.choices.emotion = this.choices.emotion || 'neutral'
  this.choices.body = this.choices.body || 'default'
  // this.choices.lips = this.choices.lips || 'default';
  if (this.skinTone) {
    this.choices.skinColor = this.skinTone
  }
  this.choices.hairColor = this.choices.hairColor || '#ffe680'
  this.choices.irisColor = this.choices.irisColor || '#2ad4ff'
  this.choices.underwear = this.choices.underwear || 'plain'
  this.choices.underwearColor = this.choices.underwearColor || '#f2f2f2'

  choices = this.choices
  if (!choices.body_head) {
    choices.body_head = 'default'
  }
  if (!choices.ears) {
    choices.ears = 'default'
  }
  if (!choices.nose) {
    choices.nose = 'default'
  }
};

function modCharacter (myKey, myValue) {
  // look in c.choices to see if the key is already there
  if (myKey in c.choices) {
    delete c.choices[myKey]
  };
  if (myKey === 'brows' || myKey === 'eyes' || myKey === 'lashes' || myKey === 'sockets') {
    return
  }
  // If there, modify the value
  // if not, add it in, with the value
  // if the value is '', then delete the key from the object,
  if (myValue != '') {
    c.choices[myKey] = myValue
  };
  if (currentUser && currentUser.cc && currentUser.cc.personnages && currentUser.cc.personnageActuel) {
    currentUser.cc.personnages[currentUser.cc.personnageActuel][myKey] = myValue
  }
};

function createCharacter () {
  document.getElementById(sex + 'Button').checked = true
  // Draw the essential stuff
  // Draw stuff from the hash
  var forms = [form1, form2, form3]
  var layerCount
  for (var lot in forms) {
    for (var x in forms[lot]) {
      var sectionTitle = x
      var t = sectionTitle.toLowerCase()
      var xsel = hash.get(t)
      if (xsel !== undefined) {
        var id = '#' + t + '_' + xsel
        layerCount = isInMultiLayerArray(id.slice(1), multiLayer)
        if (layerCount > 0) {
            for (var i = 1; i <= layerCount; i++) {
              idOf = id + '_' + i + '_of_' + layerCount
              viewport.selectAll(idOf).attr({
                opacity: 1
              })
            }
        } else {
          viewport.selectAll(id).attr({
            opacity: 1
          })
        }
      }
    }
  }
}

function GetEmotionGetLayers (option) {
  var faceElements = ['brows', 'eyes', 'mouth', 'lashes', 'sockets']
  return faceElements
};

function getOptionsLogic (section) {
  var forms = window.forms
  var section = capitalizeFirstLetter(section)
  for (i in forms) {
    options = forms[i][section]
    if (options != undefined) {
      return options
    }
  }
}

function show (userChoice, category) {
  var multiLayer = getMultiLayer()
  if (typeof (category) === 'string') {
    var sections = [category]
  } else {
    var sections = [category.split(' ')[1]]
  };
  var selectedOption = userChoice
  var options = getOptionsLogic(sections[0])
  var obj = new Array()
  var id = '#' + sections[0] + '_' + selectedOption
  obj[category] = userChoice
  if (userChoice === '') {
    modCharacter(category, userChoice)
    hash.remove(category)
  } else {
    modCharacter(category, userChoice)
    hash.add(obj)
  }

  // if (currentUser) triggerSaveBtn()

  if (sections[0] === 'emotion') {
    modCharacter(sections[0], selectedOption)
    gaga('send', 'event', 'menu', 'select', id)
    sections = [] // Reset the sections layer so it doesn't contain 'emotion', as it isn't a layer in itself.
    var emotions = GetEmotionGetLayers(selectedOption)
    for (emo in emotions) {
      var newEmo = emotions[emo]
      sections.push(newEmo)
    }
  };
  displaySections(sections, options, selectedOption, multiLayer)
}

function displaySections (sections, options, selectedOption, multiLayer) {
  for (section in sections) {
    options.forEach(function (d, i) {
      var id = '#' + sections[section] + '_' + d
      if (selectedOption != '' && d === selectedOption) {
        sectionShow(multiLayer, id)

        if (sections[section] === 'brows' || sections[section] === 'eyes' || sections[section] === 'mouth' || sections[section] === 'lashes' || sections[section] === 'sockets') {
          modCharacter(sections[section], selectedOption)
        } else {
          var obj = new Array()
          obj[sections[section]] = selectedOption
          hash.add(obj)
          modCharacter(sections[section], selectedOption)
          gaga('send', 'event', 'menu', 'select', id)
        }
      } else {
        for (lyr in multiLayer) {
          sectionHide(multiLayer, id)
        }
      }
    })
  }
}

function sectionShow (multiLayer, id) {
  var pupilShape
  var svgContainer = document.querySelector('#svg1')
  var layerCount

  if (id === '#iris_default') { return };

  layerCount = isInMultiLayerArray(id.slice(1), multiLayer)

  if (id.slice(1, 7) === 'pupils') {
    pupilShape = id.slice(1).split('_')[1]
    showPupils(pupilShape)
  } else if (id.slice(1, 5) === 'body' && id.slice(6, 10) != 'head') {
    var idList = id.split('_')
    var bodySuffix = idList[idList.length - 1]
    var bodyLayers = getBodyLayers(bodySuffix)
    var bodyLayersCounter = bodyLayers.length

    while (bodyLayersCounter--) {
      idOf = '#' + bodyLayers[bodyLayersCounter]
      svgContainer.querySelector(idOf).style.opacity = 1
      svgContainer.querySelector(idOf).style.pointerEvents = 'auto'
    }
  } else {
    if (layerCount > 0) {
      for (var i = 1; i <= layerCount; i++) {
        idOf = id + '_' + i + '_of_' + layerCount
        sectionToHide = svgContainer.querySelector(idOf)
        if (sectionToHide != null) {
          sectionToHide.style.opacity = 1
          sectionToHide.style.pointerEvents = 'auto'
        }
      }
    } else {
      svgContainer.querySelector(id).style.opacity = 1
      svgContainer.querySelector(id).style.pointerEvents = 'auto'
    }
  }

  if (id.slice(1).split('_')[0] === 'eyes') {
    changeClipPathOnEyes(id)
  }
}

function getBodyLayers (bodySuffix) {
  var bodyLayers = []

  bodyLayers.push('body_torso_' + bodySuffix)
  bodyLayers.push('body_arm_right_' + bodySuffix)
  bodyLayers.push('body_arm_left_' + bodySuffix)
  bodyLayers.push('body_forearm_right_' + bodySuffix)
  bodyLayers.push('body_forearm_left_' + bodySuffix)
  bodyLayers.push('body_leg_right_' + bodySuffix)
  bodyLayers.push('body_leg_left_' + bodySuffix)

  return bodyLayers
}

function getAllBodyLayers () {
  var layers = getSectionLayersList('body')
  var counter = layers.length
  var bodyParts
  var files = []

  while (counter--) {
    bodyParts = getBodyLayers(layers[counter])
    files = files.concat(bodyParts)
  }
  return files
}

function showPupils (pupilShape) {
  var svg = document.querySelector('#svg1 .character-container')
  var pupils = svg.querySelectorAll('.pupil')
  var counter = pupils.length

  while (counter--) {
    if (pupils[counter].classList.contains('pupil--' + pupilShape)) {
      pupils[counter].style.opacity = 1
      pupils[counter].style.pointerEvents = 'auto'
    } else {
      pupils[counter].style.opacity = 0
      pupils[counter].style.pointerEvents = 'none'
    }
  }
}

function sectionHide (multiLayer, id) {
  var svgContainer = document.querySelector('#svg1')
  var sectionToHide
  var layerCount = isInMultiLayerArray(id.slice(1), multiLayer)
  if (layerCount > 0) {
    for (var i = 1; i <= layerCount; i++) {
      idOf = id + '_' + i + '_of_' + layerCount
      sectionToHide = svgContainer.querySelector(idOf)
      if (sectionToHide != null) {
        sectionToHide.style.opacity = 0
        sectionToHide.style.pointerEvents = 'none'
      }
    }
  } else if (id.slice(1, 5) === 'body' && id.slice(6, 10) != 'head') {
    var idList = id.split('_')
    var bodySuffix = idList[idList.length - 1]
    var bodyLayers = getBodyLayers(bodySuffix)
    var bodyLayersCounter = bodyLayers.length

    while (bodyLayersCounter--) {
      idOf = '#' + bodyLayers[bodyLayersCounter]
      svgContainer.querySelector(idOf).style.opacity = 0
      svgContainer.querySelector(idOf).style.pointerEvents = 'none'
    }
  } else {
    sectionToHide = svgContainer.querySelector(id)

    if (sectionToHide != null) {
      sectionToHide.style.opacity = 0
      sectionToHide.style.pointerEvents = 'none'
    }
  };
}
var myUsername = false
var currentUser = false
var personnages = {}
var personnageActuel = false

var fetchDb = (function () {
  var baseOpts = {
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  var binary = ['get', 'delete', 'head']
  var ternary = ['post', 'put']

  var fetchDb = function (path, body, method) {
    var url = '/api/' + path
    var opts = {}
    if (!method && typeof body === 'string') {
      method = body
      body = false
    }
    if (body) {
      opts.body = JSON.stringify(body)
      opts.method = 'post'
    }
    if (method) {
      opts.method = method
    }
    if (typeof window.fetch === 'function') {
      return window.fetch(url, Object.assign(opts, baseOpts))
    }
  }

  binary.forEach(function (m) { fetchDb[m] = function (path) { return fetchDb(path, m) } })
  ternary.forEach(function (m) { fetchDb[m] = function (path, body) { return fetchDb(path, body, m) } })
  fetchDb.reject = function (resp, message) {
    var err = new Error(message || resp.statusText)
    err.statusText = resp.statusText
    err.status = resp.status
    err.url = resp.url
    return Promise.reject(err)
  }
  return fetchDb
}())

function deleteDbSession () {
  return fetchDb.delete('session')
    .then(function (resp) {
      return resp.json()
    })
}

function getDbSession () {
  return fetchDb.reject({}, 'Not connected')
}

function getDbUser (username) {
  return fetchDb('users/' + username)
    .then(function (resp) {
      return resp.json()
    })
}

function updateDbUser (user) {
  return fetchDb.post('users', user)
    .then(function (resp) {
      if (resp.ok) {
        return resp.json()
      }
      if (resp.status === 409) {
        return fetchDb.reject(resp, 'Not saving, _rev fields don\'t match')
      }
      if (resp.status === 404) {
        loginMenu()
        return fetchDb.reject(resp, 'Not logged in.')
      }
      return fetchDb.reject(resp)
    })
}

function loginDbUser (username, password) {
  return fetchDb.post('session', {
    name: username,
    password: password
  })
    .then(function (resp) {
      if (resp.status === 200) { return resp.json() }
      if (resp.status === 401) {
        determineErrorMessage(username)
        // return resp.json();
        return fetchDb.reject(resp)
      }
      return fetchDb.reject(resp)
    })
}

function determineErrorMessage (username) {
  var currentOverlay = document.querySelector('.overlay--show')
  if (currentOverlay.classList.contains('js-login')) {
    showErrorUsernamePasswordMismatch()
  }
  if (currentOverlay.classList.contains('js-register')) {
    showErrorUsernameTaken(username)
  }
}

function showErrorUsernamePasswordMismatch () {
  var currentOverlay = document.querySelector('.overlay--show')
  var errorBox = currentOverlay.querySelector('.overlay__error')
  var errorText = errorBox.querySelector('.overlay__error__text')
  var errorMsg = 'Sorry, username/password mismatch. Please try again.'
  clearInputFields()
  errorText.innerHTML = errorMsg
  errorBox.classList.add('overlay__error--show')
}

function createDbUser (username, password, email) {
  return fetchDb.post('users', {
    _id: 'org.couchdb.user:' + username,
    roles: [],
    type: 'user',
    name: username,
    password: password,
    email: email,
    createdAt: new Date().toISOString(),
    cc: {
      personnages: {},
      personnageActuel: false
    }
  })
    .then(function (resp) {
      if (resp.status === 201) { return resp.json() }
      if (resp.status === 409) {
        showErrorUsernameTaken(username)
        return resp.json()
      }
      return fetchDb.reject(resp)
    })
}

function showErrorUsernameTaken (username) {
  var currentOverlay = document.querySelector('.overlay--show')
  var errorBox = currentOverlay.querySelector('.overlay__error')
  var errorText = errorBox.querySelector('.overlay__error__text')
  var errorMsg = 'Username "' + username + '" is already taken. Try another.'
  errorText.innerHTML = errorMsg
  errorBox.classList.add('overlay__error--show')
  clearInputUsername()
}

function whoami (ev) {
  ev.preventDefault()
  var overlay = document.querySelector('.js-character-list')
  var closeBtn = overlay.querySelector('.close-btn')
  closeAllOverlays()
  overlay.classList.add('overlay--show')
  overlay.addEventListener('click', closeOverlay, true)
  closeBtn.addEventListener('click', closeOverlay, false)
}

// TODO Return app to its initial state
function logout (ev) {
  ev.preventDefault()
  deleteDbSession()
    .then(function (json) {
      currentUser = false
      personnages = {}
      personnageActuel = false
      myUsername = false
    })
    .catch(function (err) {
      consolelog('err4', err)
    })
  logoutUI()
}

function login (evt) {
  evt.preventDefault()
  var event = evt
  var username = event.target.children[0].lastElementChild.value
  var password = event.target.children[1].lastElementChild.value
  var login = document.querySelector('.overlay--show')

  if (!username || !password) return

  loginDbUser(username, password)
    .then(function () {
      myUsername = username
      return getDbUser(username)
    })
    .then(function (user) {
      currentUser = user
      var u = currentUser.cc.personnages[currentUser.cc.personnageActuel]
      var r
      var t = []
      for (r in u) {
        t.push(encodeURIComponent(r) + '=' + encodeURIComponent(u[r]))
      }
      clearInputFields()
      login.classList.remove('overlay--show')
      manageCharacters()
      gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'login', eventLabel: 'Successful login' })
    })
    .catch(function (err) {
      consolelog('err3', err)
    })
}

function inheritNewCharacter () {
  var newCharModal = document.querySelector('.js-login-new-character')
  var hasHash = hash.get('sex')
  var continueBtn = document.querySelector('.js-continue-character')
  var loadBtn = document.querySelector('.js-load-character')
  if (!hasHash) {
    // TODO check to see if there is a currentCharacter, and if so, load it.
    return
  }
  loadBtn.addEventListener('click', loadCharacter, false)
  continueBtn.addEventListener('click', continueNewCharacter, false)
  newCharModal.classList.add('overlay--show')
  newCharModal.addEventListener('click', closeNewCharacterOverlay, false)
}

function continueNewCharacter (evt) {
  evt.preventDefault()
  var newCharModal = document.querySelector('.overlay--show')
  var nameCharModal = document.querySelector('.js-name-character')
  var createBtn = nameCharModal.querySelector('.overlay__char-create-btn')
  newCharModal.classList.remove('overlay--show')
  // TODO open modal to ask for character name and save it before proceeding.
  createBtn.addEventListener('click', requestNewCharacterName)
  nameCharModal.classList.add('overlay--show')
}

function requestNewCharacterName (evt) {
  evt.preventDefault()
  var nameCharModal = document.querySelector('.overlay--show')
  if (nameCharModal) {
    nameCharModal.classList.remove('overlay--show')
  }
}

function loadCharacter (evt) {
  var characterSVG = document.querySelector('#svg1')
  var newCharModal = document.querySelector('.overlay--show')
  evt.preventDefault()
  hash.clear()
  clearCharacter()
  hashCharacter()
  startup()
  // setHashTrigger()
  setTimeout(function () {
    characterSVG.classList.remove('character--hide')
    if (newCharModal) {
      newCharModal.classList.remove('overlay--show')
    }
  }, 500)
}

function closeNewCharacterOverlay (evt) {
  var overlay = document.querySelector('.js-login-new-character')
  var target = evt.target
  if (target === overlay) {
    var modal = document.querySelector('.overlay--show')
    if (modal) {
      modal.classList.remove('overlay--show')
    }
  }
}

function switchCharacter (evt) {
  evt.preventDefault()
  var choices
  var characterListUI = document.querySelector('.js-character-list')
  var characterSVG = document.querySelector('#svg1')
  var newCard = this.parentNode.parentNode
  var newChar = newCard.querySelector('.overlay__char-name').innerHTML
  var oldCard = document.querySelector('.overlay__char--current')
  var currentClass = characterSVG.getAttribute('class')
  var newClass = currentClass + ' ' + 'character--hide'
  var charGender = currentUser.cc.personnages[newChar].sex
  if (currentClass === '') {
    if (charGender === 'f') {
      currentClass = 'select-female'
    }
    if (charGender === 'm') {
      currentClass = 'select-male'
    }
    newClass = currentClass
  }
  if (oldCard) {
    oldCard.classList.remove('overlay__char--current')
  }
  newCard.classList.add('overlay__char--current')
  currentUser.cc.personnageActuel = newChar
  characterListUI.classList.remove('overlay--show')
  characterSVG.setAttribute('class', newClass)

  updateDbUser(currentUser)
    .then(function (json) {
      currentUser._rev = json.rev
      return json
    })
    .then(function (json) {
      window.sex = currentUser.cc.personnages[newChar].sex
      choices = currentUser.cc.personnages[newChar]
      c = new Character(choices)
      hash.clear()
      setTimeout(function () {
        clearCharacter()
        hashCharacter()
        // setHashTrigger()
      }, 500)
      gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Edit', eventLabel: 'Edit existing character' })
    })
    .catch(function (err) {
      consolelog('err', err)
    })
}

function revealCharacter () {
  var characterSVG = document.querySelector('#svg1')
  characterSVG.classList.remove('character--hide')
}

function manageCharacters () {
  var charUI = document.querySelector('.js-character-list')
  var userTitle = charUI.querySelector('.overlay__title')
  var charCard = charUI.querySelector('.overlay__char-card--orig')
  var charList = Object.keys(currentUser.cc.personnages)
  var charNum = charList.length
  var charContainer = charUI.querySelector('.overlay__container--char-list')
  var charCurrent = currentUser.cc.personnageActuel
  var usernameButton = document.querySelector('#usernameButton')
  var usernameText = usernameButton.querySelector('.menu-text')
  var pageWrap = document.querySelector('#pagewrap')
  var editBtns
  var editBtnsNum
  var delBtns
  var delBtnsNum
  // var saveBtn = document.querySelector('.save-btn')
  var newBtn = charUI.querySelector('.overlay__char-new-btn')
  var createBtn = charUI.querySelector('.overlay__char-create-btn')
  var charName

  resetCharacters()
  while (charNum--) {
    charName = charList[charNum]
    var newCard = charCard.cloneNode(true)
    var charNameCard = newCard.querySelector('.overlay__char-name')
    newCard.classList.remove('overlay__char-card--orig')
    if (charName === charCurrent) {
      newCard.classList.add('overlay__char--current')
    }
    charNameCard.innerHTML = charName
    charContainer.appendChild(newCard)
  }
  editBtns = charUI.querySelectorAll('.overlay__char-edit')
  editBtnsNum = editBtns.length
  while (editBtnsNum--) {
    editBtns[editBtnsNum].addEventListener('click', switchCharacter)
  }
  delBtns = charUI.querySelectorAll('.overlay__char-delete')
  delBtnsNum = delBtns.length
  while (delBtnsNum--) {
    delBtns[delBtnsNum].addEventListener('click', deleteChar)
  }
  userTitle.innerHTML = currentUser.name
  usernameText.innerHTML = currentUser.name
  pageWrap.classList.add('logged')
  // saveBtn.addEventListener('click', saveChar, true)
  newBtn.addEventListener('click', newChar, true)
  createBtn.addEventListener('click', createChar, true)
}

function resetCharacters () {
  var charUI = document.querySelector('.js-character-list')
  var charCards = charUI.querySelectorAll('.overlay__char-card:not(.overlay__char-card--orig):not(.overlay__char-new)')
  Array.prototype.forEach.call(charCards, function (node) {
    node.parentNode.removeChild(node)
  })
}

function registerMenu () {
  var loginMenu = document.querySelector('.js-login')
  var overlay = document.querySelector('.js-register')
  var registerForm = document.querySelector('#register-form')
  var firstInput = overlay.querySelector('.first-input')
  var closeBtn = overlay.querySelector('.close-btn')

  if (loginMenu.classList.contains('overlay--show')) {
    loginMenu.classList.remove('overlay--show')
  }

  closeAllOverlays()
  overlay.classList.add('overlay--show')
  registerForm.addEventListener('submit', register, true)
  overlay.addEventListener('click', closeRegister, true)
  firstInput.focus()
  closeBtn.addEventListener('click', closeOverlay, false)
}

function closeRegister (evt) {
  var overlay = document.querySelector('.js-register')
  var cancelBtn = overlay.querySelector('.cancel-btn')
  var target = evt.target

  if (target === overlay || target === cancelBtn) {
    var register = document.querySelector('.overlay--show')
    if (register) {
      clearInputFields()
      register.classList.remove('overlay--show')
    }
  }
}

function register (evt) {
  evt.preventDefault()
  var event = evt
  var email = event.target.children[0].lastElementChild.value
  var username = event.target.children[1].lastElementChild.value
  var password = event.target.children[2].lastElementChild.value
  var register = document.querySelector('.overlay--show')

  if (!username || !password || !email) return

  createDbUser(username, password, email)
    .then(function () {
      return loginDbUser(username, password)
    })
    .then(function (json) {
      return username
    })
    .then(getDbUser)
    .then(function (user) {
      currentUser = user
      manageCharacters()
      register.classList.remove('overlay--show')
      gaga('send', 'event', { eventCategory: 'Conversion', eventAction: 'Register', eventLabel: 'Successfuly Registered account' })
    })
    .catch(function (err) {
      consolelog('register err', err)
    })
}

getDbSession()
  .then(getDbUser)
  .then(function (user) {
    var r
    var t = []
    myUsername = user.name
    currentUser = user
    if (user.cc && user.cc.personnages &&
      user.cc.personnageActuel &&
      user.cc.personnages[user.cc.personnageActuel]
    ) {
      personnages = user.cc.personnages
      personnageActuel = user.cc.personnageActuel

      for (r in user.cc.personnages[user.cc.personnageActuel]) {
        t.push(
          encodeURIComponent(r) + '=' +
          encodeURIComponent(user.cc.personnages[user.cc.personnageActuel][r])
        )
      }
    }
    manageCharacters()
  })
  .catch(function (err) {
    consolelog('getDbSession error', err)
  })

/*
function setHashTrigger () {
  window.addEventListener('hashchange', triggerSaveBtn, false)
}

function triggerSaveBtn () {
  var saveBtn = document.querySelector('.save-btn')
  if (saveBtn) {
    saveBtn.classList.add('save--enabled')
  }
}
*/

/*
function logOut () {
  // TODO Return app to its initial state.
}
*/
"use strict"

window.maleBodyPositionFolder = 'body_front_swaying'
window.femaleBodyPositionFolder = 'body_front_hand-on-hip'

const femaleHead = fetch('./layer/female/head_front_default/layers.json')
.then(function (res) {
  return res.json()
})
.catch(console.error)

const femaleBody = fetch('./layer/female/' + window.femaleBodyPositionFolder + '/layers.json')
.then(function (res) {
  return res.json()
})
.catch(console.error)

const maleHead = fetch('./layer/male/head_front_default/layers.json')
.then(function (res) {
  return res.json()
})
.catch(console.error)

const maleBody = fetch('./layer/male/' + window.maleBodyPositionFolder + '/layers.json')
.then(function (res) {
  return res.json()
})
.catch(console.error)

Promise.all([maleHead, maleBody])
  .then(function([maleHead, maleBody]) {
    window.layersMale = assembleLayers(maleBody, maleHead, window.maleBodyPositionFolder, 'head_front_default')
    window.maleHead = maleHead
    window.maleBody = maleBody
  })

Promise.all([femaleHead, femaleBody])
  .then(function([femaleHead, femaleBody]) {
    window.layersFemale  = assembleLayers(femaleBody, femaleHead, window.femaleBodyPositionFolder, 'head_front_default')
    window.femaleHead = femaleHead
    window.femaleBody = femaleBody
  })

function assembleLayers (bodyObject, headObject, bodyPosition, headPosition) {
  var layers = []
  var sourceLayers =[]
  var counter
  if (bodyObject.bodyBack) {
    counter = bodyObject.bodyBack.length
    total = counter
    while (counter--) {
      layers.push(bodyObject.bodyBack[total - (counter + 1)])
    }
  }
  if (headObject.headBack) {
    counter = headObject.headBack.length
    total = counter
    while (counter--) {
      layers.push(headObject.headBack[total - (counter + 1)])
    }
  }
  if (bodyObject.bodyMiddle) {
    counter = bodyObject.bodyMiddle.length
    total = counter
    while (counter--) {
      layers.push(bodyObject.bodyMiddle[total - (counter + 1)])
    }
  }
  if (headObject.headMiddle) {
    counter = headObject.headMiddle.length
    total = counter
    while (counter--) {
      layers.push(headObject.headMiddle[total - (counter + 1)])
    }
  }
  if (bodyObject.bodyFront) {
    counter = bodyObject.bodyFront.length
    total = counter
    while (counter--) {
      layers.push(bodyObject.bodyFront[total - (counter + 1)])
    }
  }
  if (headObject.headFront) {
    counter = headObject.headFront.length
    total = counter
    while (counter--) {
      layers.push(headObject.headFront[total - (counter + 1)])
    }
  }
  if (bodyObject.bodyOver) {
    counter = bodyObject.bodyOver.length
    total = counter
    while (counter--) {
      layers.push(bodyObject.bodyOver[total - (counter + 1)])
    }
  }
  if (headObject.headOver) {
    counter = headObject.headOver.length
    total = counter
    while (counter--) {
      layers.push(headObject.headOver[total - (counter + 1)])
    }
  }
  return layers
}

window.onload = function () {
  var c // Main variable to hold user choices and preferences
  var aboutBtn = document.querySelector('#aboutButton')
  var faqBtn = document.querySelector('#faqButton')
  var shopBtn = document.querySelector('#shopButton')
  var whoBtn = document.querySelector('#whoButton')
  var logoutBtn = document.querySelector('#logoutButton')
  var loginBtn = document.querySelector('#loginButton')
  var registerBtn = document.querySelector('#registerButton')
  var registerLink = document.querySelector('.js-register-link')
  var creditsBtn = document.querySelector('#creditsButton')
  var hamburgerBtn = document.querySelector('.hamburger-btn')
  var zoomBtn = document.querySelector('#zoomLevel')
  var maleSilhouette = document.getElementById('male_silhouette')
  var femaleSilhouette = document.getElementById('female_silhouette')
  var rightSidebar = document.querySelector('#sidebar')
  var rightSidebarClone = rightSidebar.cloneNode(true)
  var svgContainer = document.querySelector('#svg1')
  var patreonLink = document.querySelector('#patreonButton')
  var patreonBtn = document.querySelector('#patreon-btn')
  var braveAffiliateBtn = document.querySelector('#brave-affiliate-btn')
  var newCharBtn = document.querySelector('#new-char-btn')
  // var saveCharToCloudBtn = document.querySelector('#save-char-to-cloud-btn')
  var loadCharBtn = document.querySelector('#load-char-btn')
  var nightModeBtn = document.querySelector('#nightModeButton')
  var bigRedBtn = document.querySelector('#bigRedButton')
  var downloadBtn = document.querySelector('#proceed-download')
  var homeBtn = document.querySelector('.site-title')

  if (homeBtn && typeof gotoNewChar === 'function') { homeBtn.addEventListener('click', gotoNewChar, false) }
  if (aboutBtn && typeof showAbout === 'function') { aboutBtn.addEventListener('click', showAbout, false) }
  if (faqBtn && typeof showFAQ === 'function') { faqBtn.addEventListener('click', showFAQ, false) }
  if (shopBtn && typeof showShop === 'function') { shopBtn.addEventListener('click', showShop, false) }
  if (whoBtn && typeof whoami === 'function') { whoBtn.addEventListener('click', whoami, false) }
  if (logoutBtn && typeof logout === 'function') { logoutBtn.addEventListener('click', logout, false) }
  if (loginBtn && typeof loginMenu === 'function') { loginBtn.addEventListener('click', loginMenu, false) }
  if (registerBtn && typeof registerMenu === 'function') { registerBtn.addEventListener('click', registerMenu, false) }
  if (registerLink && typeof registerMenu === 'function') { registerLink.addEventListener('click', registerMenu, false) }
  if (creditsBtn && typeof rollCredits === 'function') { creditsBtn.addEventListener('click', rollCredits, false) }
  if (hamburgerBtn && typeof hamburger === 'function') { hamburgerBtn.addEventListener('click', hamburger, false) }
  if (zoomBtn && typeof viewBoxZoom === 'function') { zoomBtn.addEventListener('change', viewBoxZoom, false) }
  if (maleSilhouette && typeof selectMale === 'function') { maleSilhouette.addEventListener('click', selectMale, false) }
  if (femaleSilhouette && typeof selectFemale === 'function') { femaleSilhouette.addEventListener('click', selectFemale, false) }
  if (svgContainer && typeof clickSelect === 'function') { svgContainer.addEventListener('click', clickSelect, false) }
  if (svgContainer && typeof layerHighlight === 'function') { svgContainer.addEventListener('mouseover', layerHighlight, false) }
  if (patreonLink && typeof tattle === 'function') { patreonLink.addEventListener('click', tattle, false) }
  if (patreonBtn && typeof gotoPatreon === 'function') { patreonBtn.addEventListener('click', gotoPatreon, false) }
  if (braveAffiliateBtn && typeof gotoBrave === 'function') { braveAffiliateBtn.addEventListener('click', gotoBrave, false) }
  if (newCharBtn && typeof gotoNewChar === 'function') { newCharBtn.addEventListener('click', gotoNewChar, false) }
  // if (saveCharToCloudBtn && typeof saveCharToCloud === 'function') { saveCharToCloudBtn.addEventListener('click', saveCharToCloud, false) }
  if (loadCharBtn && typeof gotoLoadChar === 'function') { loadCharBtn.addEventListener('click', gotoLoadChar, false) }
  if (nightModeBtn && typeof switchNightMode === 'function') { nightModeBtn.addEventListener('click', switchNightMode, false) }
  if (bigRedBtn && typeof createDecentRandomCharacter === 'function') { bigRedBtn.addEventListener('click', createDecentRandomCharacter, false) }
  if (downloadBtn && typeof download === 'function') { downloadBtn.addEventListener('click', download, false) }

  // checkNightMode()
  startup()
}

/*
function saveCharToCloud (ev) {
  preventDefault(ev)
  // consolelog('saveCharToCloud')
  // Close current modal
  // Check if user is logged in
  // Check if this character already exists in the cast
  // If not, prompt to name the character in the cast modal
}
*/

function checkNightMode () {
  var body = document.querySelector('BODY')
  var checkBox = document.querySelector('#nightModeBox')

  if (checkBox.checked && !body.classList.contains('night')) {
    body.classList.toggle('night')
  }
}

function switchNightMode (ev) {
  // document.documentElement.setAttribute('data-theme', 'lighttheme');
  gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Dark/Light', eventLabel: 'Switch between Dark mode and Light mode' })
  ev.preventDefault()
  var body = document.querySelector('BODY')
  hamburger()

  if (body.classList === '') {
    document.documentElement.setAttribute('data-theme', 'darktheme')
  } else if (body.classList === 'night') {
    document.documentElement.setAttribute('data-theme', 'lighttheme')
  }
  body.classList.toggle('night')
}

function tattle () {
  gaga('send', 'event', { eventCategory: 'Conversion', eventAction: 'Navbar | Patreon', eventLabel: 'Open Patreon page from the Navbar/Hamburger menu.' })
}

function gotoPatreon (evt) {
  if (evt) {
    evt.preventDefault()
  }
  gaga('send', 'event', { eventCategory: 'Conversion', eventAction: 'Caboose | Patreon', eventLabel: 'Open Patreon page from Caboose modal.' })
  closeAllOverlays()
  setTimeout(function () { window.open('https://www.patreon.com/charactercreator') }, 500)
}

function gotoBrave (evt) {
  if (evt) {
    evt.preventDefault()
  }
  gaga('send', 'event', { eventCategory: 'Conversion', eventAction: 'Caboose | Brave', eventLabel: 'Open Brave Browser page from Caboose modal.' })
  closeAllOverlays()
  // consolelog('brave')
  setTimeout(function () { window.open('https://brave.com/cha553') }, 500)
}

function gotoNewChar (evt) {
  if (evt) {
    evt.preventDefault()
  }
  gaga('send', 'event', { eventCategory: 'Conversion', eventAction: 'Caboose | New character', eventLabel: 'Reset to new character from Caboose.' })
  closeAllOverlays()
  window.location.hash ='';
  setTimeout(function () {
    resetCharacter()
  }, 500)
}

function resetCharacter () {
  var choices = []
  // Hide menus.
  hideMenus()
  // Fade out SVG.
  fadeOutSVG()
  // Remove all groups.
  removeGroups()
  // Zoom out in case we were zoomed in.
  zoomFull()
  // reset silhouettes
  resetSilhouettes()
  // Clean hash.
  // Fade in SVG.
  // Clear 'c' variable.
  c = new Character(choices)
  setTimeout(function () { fadeInSVG() }, 300)
  // launch anew.
  relaunch()
}

function relaunch () {
  male = document.querySelector('#male_silhouette')
  female = document.querySelector('#female_silhouette')
  male.style.opacity = '1'
  female.style.opacity = '1'
}

function removeGroups () {
  var svgContainer = document.querySelector('#svg1 #character-container')
  var groups = svgContainer.querySelectorAll('#svg1 #character-container > g')
  var counter = groups.length

  while (counter--) {
    if (groups[counter].id != 'female_silhouette' && groups[counter].id != 'male_silhouette') {
      svgContainer.removeChild(groups[counter])
    }
  }
}

function hideMenus () {
  var menus = document.querySelectorAll('.sidebar.visible')
  var counter = menus.length

  while (counter--) {
    menus[counter].classList.remove('visible')
  }
}

function fadeOutSVG () {
  var svgContainer = document.querySelector('#svg1')
  var characterShadow = svgContainer.querySelector('.character-shadow.shine')
  var downloadBtn = document.querySelector('#downloadButton.enabled')

  if (characterShadow) {
    characterShadow.classList.remove('shine')
  }

  if (downloadBtn) {
    downloadBtn.classList.remove('enabled')
    downloadBtn.removeEventListener('click', download)
  }
  svgContainer.classList.add('character--hide')
}

function fadeInSVG () {
  var svgContainer = document.querySelector('#svg1')
  svgContainer.classList.remove('character--hide')
}

function resetSilhouettes () {
  var defaultColor = 'currentColor'
  var svgContainer = document.querySelector('#svg1')
  var maleSilhouette = svgContainer.querySelector('#path_male')
  var femaleSilhouette = svgContainer.querySelector('#path_female')
  var silhouetteRemaining

  if (svgContainer.classList.contains('select-female')) {
    silhouette = svgContainer.querySelector('#female_silhouette')
    silhouetteRemaining = svgContainer.querySelector('#male_silhouette')
  } else if (svgContainer.classList.contains('select-male')) {
    silhouette = svgContainer.querySelector('#male_silhouette')
    silhouetteRemaining = svgContainer.querySelector('#female_silhouette')
  }
  svgContainer.classList = ''
  maleSilhouette.style.fill = defaultColor
  femaleSilhouette.style.fill = defaultColor

  if (maleSilhouette && typeof selectMale === 'function') { maleSilhouette.addEventListener('click', selectMale, false) }
  if (femaleSilhouette && typeof selectFemale === 'function') { femaleSilhouette.addEventListener('click', selectFemale, false) }
}

function gotoLoadChar (evt) {
  if (evt) {
    evt.preventDefault()
  }
  closeAllOverlays()
}

// The 'caboose' is the modal at the end of the character creation process.
function caboose () {
  var overlay = document.querySelector('.js-caboose')
  var closeBtn = overlay.querySelector('.close-btn')

  closeAllOverlays()

  overlay.classList.add('overlay--show')
  overlay.addEventListener('click', closeOverlay, true)
  closeBtn.addEventListener('click', closeOverlay, false)
}

function layerHighlight (ev) {
  var el = getGroupParent(ev.target)
  if (!el) return
  var masks = document.querySelectorAll('#contour use')
  var masksLen = masks.length

  if (masks[0].getAttribute('xlink:href') === el.id) {

  } else if (el.id === 'svg1') {
    while (masksLen--) {
      masks[masksLen].setAttribute('xlink:href', '')
    }
  } else {
    while (masksLen--) {
      masks[masksLen].setAttribute('xlink:href', '#' + el.id)
    }
  }
}

/*
function getViewBoxOnClick () {
  // return '10 50 540 540'
  var viewBox = '10 50 540 540'
  var svgContainer = document.querySelector('#svg1')
  // consolelog('SVG1', svgContainer.viewBox)
  // consolelog('SVG1', svgContainer.viewBox.baseVal)
  // consolelog(el.getBoundingClientRect())
  return viewBox
}
*/

function clickSelect (ev) {
  var el = getGroupParent(ev.target)
  // TODO check if style selection screen, return
  var formSection
  var sectionList = document.querySelectorAll('section.accordeon__section-label')
  var isClosed
  var sectionLabel
  var prefix
  var prefixIndex
  var itemButtonList
  var itemButton
  // var faceContainer = document.querySelector('.face-styles');

  // Don't take the click while in the style selection screen.
  // if (faceContainer.style.opacity === '1') {return}

  if (c.choices.sex === undefined) { return }

  prefix = fromItemGetPrefix(el.id)
  formSection = fromPrefixGetFormSection(prefix)

  if (prefix === 'svg1') {
    zoomFull()
    return
  }

  // toggleSection
  // Check to see if the section is already open in sidebarRight
  // If not open, close all sections and open it.
  // Same thing for item thumbnails, if not open, open them.
  if (formSection > -1) {
    sectionLabel = sectionList[formSection].querySelector('.accordeon__section-title__text').innerHTML
    sectionZoom(sectionLabel)
    isClosed = sectionList[formSection].nextSibling.classList.contains('section--hide')
    closeSections(sectionList[formSection])

    if (isClosed) {
      showSection(sectionList[formSection])
    }
    // Get Prefix Index;
    prefixIndex = getSectionButton(formSection, prefix)

    if (prefixIndex > -1) {
      itemButtonList = sectionList[formSection].nextSibling.querySelectorAll('li.sbl__option')
      itemButton = itemButtonList[prefixIndex]
      hideColorPicker()
      openThumbsLogic(itemButton)
    }
  }
}

function getSectionButton (formSection, prefix) {
  var keyCounter = 0
  if (c.choices.sex === 'm') {
    formList = window.maleFormList
  } else {
    formList = window.femaleFormList
  }
  for (key in formList[formSection]) {
    if (prefix === key.toLowerCase()) {
      return keyCounter
    }
    ++keyCounter
  }
  return -1
}

function getLayers () {
  var layers

  if (c.choices.sex === 'm') {
    layers = window.layersMale
  } else if (c.choices.sex === 'f') {
    layers = window.layersFemale
  } else {
    return document.querySelector('#svg1 #character-container')
  }

  return layers
}

function getGroupParent (el) {
  var layers = getLayers()
  if (!layers.indexOf) return
  while (layers.indexOf(el.id) === -1 && el.tagName != 'svg') {
    el = el.parentNode
  }
  return el
}

function getMultiLayer () {
  var multiLayer = []
  var layers = getLayers()
  var counter = layers.length
  var singleArray
  var layerCount

  while (counter--) {
    layerCount = isMultiLayer(layers[counter])
    if (layerCount > 0) {
      singleArray = []
      singleArray.push(layers[counter].slice(0, -7))
      singleArray.push(layerCount)
      multiLayer.push(singleArray)
    }
  }
  return multiLayer
}

function isMultiLayer (layer) {
  if (layer.slice(-6, -1) === '1_of_') {
    return parseInt(layer.slice(-1), 10)
  } else {
    return 0
  }
}

function isInMultiLayerArray (id, multiLayer) {
  for (entry in multiLayer) {
      if (id === multiLayer[entry][0]) {
        return multiLayer[entry][1]
      }
  }
  return 0
}

function getHairLayers () {
  var hairLayers = []
  var layers = getLayers()
  var counter = layers.length

  while (counter--) {
    if (layers[counter].slice(0, 5) === 'hair_' || layers[counter].slice(0, 11) === 'facialhair_' || layers[counter].slice(0, 6) === 'brows_' || layers[counter].slice(0, 7) === 'lashes_') {
      hairLayers.push(layers[counter])
    }
  }
  return hairLayers
}

function getSkinLayers () {
  var skinLayers = []
  var layers = getLayers()
  var counter = layers.length

  while (counter--) {
    if (layers[counter].slice(0, 5) === 'body_' || layers[counter].slice(0, 5) === 'ears_' || layers[counter].slice(0, 5) === 'nose_' || layers[counter].slice(0, 9) === 'freckles_' || layers[counter].slice(0, 5) === 'scar_' || layers[counter].slice(0, 11) === 'wings_devil' || layers[counter].slice(0, 6) === 'mouth_' || layers[counter].slice(0, 8) === 'sockets_') {
      skinLayers.push(layers[counter])
    }
  }

  return skinLayers
}

function fromItemGetPrefix (id) {
  // consolelog('fromItemGetPrefix', id)
  var idList = id.split('_')
  var prefix

  if (idList[0] === 'body' && idList[1] === 'head') {
    prefix = 'body_head'
  } else {
    prefix = idList[0]
  }
  return prefix
}

function fromPrefixGetFormSection (prefix) {
  // consolelog('prefix', prefix)
  // var item
  var formSection
  var counterForm
  // var counterSection
  var formList

  if (c.choices.sex === 'm') {
    formList = window.maleFormList
  } else {
    formList = window.femaleFormList
  }
  // consolelog('formList', formList)

  while (formSection === undefined) {
    counterForm = formList.length

    while (counterForm--) {
      for (key in formList[counterForm]) {
        if (key.toLowerCase() === prefix) { formSection = counterForm }
      }
    }
    if (formSection === undefined) { formSection = -1 }
  }
  return formSection
}

function startup () {
  var choices

  if (currentUser && currentUser.cc && currentUser.cc.personnages && currentUser.cc.personnageActuel) {
    choices = currentUser.cc.personnages[currentUser.cc.personnageActuel]
  }
  window.c = new Character(choices)
  interpretHash()
}

function launch () {
  c.choices.sex = hash.get('sex')
  var sex = c.choices.sex
  var multiLayer = getMultiLayer()
  var hairLayers = getHairLayers()
  var skinLayers = getSkinLayers()

  if (sex === 'm') {
    var form1 = maleForm1
    var form2 = maleForm2
    var form3 = maleForm3
    var form4 = maleForm4
    var form5 = maleForm5
    var form6 = maleForm6
    var layerDirectory = layerDirectoryMale
  } else {
    var form1 = femaleForm1
    var form2 = femaleForm2
    var form3 = femaleForm3
    var form4 = femaleForm4
    var form5 = femaleForm5
    var form6 = femaleForm6
    var layerDirectory = layerDirectoryFemale
  }
  window.forms = [form1, form2, form3, form4, form5, form6]
  // Get all the hash key/value pairs and include them in the c.choices object
  // Go through all the forms
  parseHash(forms, skinLayers, hairLayers) // Hashed elements are added in the character object
  choicesToList(c)

  const toBeShown = choicesToLayers(c, multiLayer)
  Promise.resolve().then(function () { loadFilesFromList(toBeShown) }).then(function () { onAllLoaded() }).then(function () { applyClipPath(c) })
}

function displayPallette () {
  var hashSkinColor = hash.get('skinColor')

  if (hashSkinColor != undefined) {
    launch()
    // consolelog('hashSkinColor', hashSkinColor);
    // colorCutout(hashSkinColor);
    // presentFaceStyles();
  } else {
    chooseSkinColor()
  }
}

function chooseSkinColor () {
  // find 'skinTones' in global.js
  var gmenu = document.querySelector('.skin-color__container')

  if (!gmenu.firstChild) {
    for (color in skinTones) {
      var newColor = skinTones[color]
      var node = document.createElement('LI')
      node.className = 'skin-tone'
      node.style.cssText = 'background-color:' + newColor + ';'
      gmenu.appendChild(node)
      node.onclick = colorCutout
      node.onmouseover = colorOnHover
    };
  }
  gmenu.classList.add('skin-color__container--show')
}

function defaultPupilShape () {
  c.choices.pupils = 'round'
  hash.add({ pupils: 'round' })
}

function colorOnHover () {
  var malePath = document.getElementById('path_male')
  var femalePath = document.getElementById('path_female')
  var newTone = this.style.backgroundColor
  femalePath.style.fill = newTone
  malePath.style.fill = newTone
}

function colorSilhouette () {
  var malePath = document.getElementById('path_male')
  var femalePath = document.getElementById('path_female')
  var newTone = hash.get('skinColor')
  femalePath.style.fill = newTone
  malePath.style.fill = newTone
  femalePath.style.pointerEvents = 'none'
  malePath.style.pointerEvents = 'none'
}

function colorCutout (newColor) {
  var rgb = this.style.backgroundColor
  var newColor = rgb2hex(rgb)
  var colorCards = document.getElementsByClassName('.skin-tone')
  var maleSilhouette = document.getElementById('male_silhouette')
  var femaleSilhouette = document.getElementById('female_silhouette')
  var lg = document.getElementsByClassName('lg')
  var obj = new Array()
  obj.skinColor = newColor
  var gmenu = document.querySelector('.skin-color__container')

  gmenu.classList.remove('skin-color__container--show')
  hash.add(obj)
  defaultEyeColor(c, newColor)
  defaultHairColor(c, newColor)
  defaultPupilShape()

  gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Color', eventLabel: 'Select color' })

  addDecency()
  addTopicalItem()

  // Uncomment the following for prod
  setTimeout(function () {
    launch()
  }, 300)
  // Uncomment the following to work on anime style
  // presentFaceStyles();
}

function selectMale (event) {
  c.choices.sex = 'm'
  var maleRadioBtn = document.querySelector('#mButton')
  var mainSVG = document.querySelector('#svg1')
  var maleSilhouette = document.querySelector('#male_silhouette')
  var femaleSilhouette = document.querySelector('#female_silhouette')
  var shadow = document.querySelector('.character-shadow')
  // Remove event listener to female silhouette.
  femaleSilhouette.removeEventListener('click', selectFemale)

  if (maleRadioBtn) {
    maleRadioBtn.checked = true
  }
  if (maleSilhouette) {
    maleSilhouette.removeEventListener('click', selectMale, false)
  }
  hash.add({ sex: 'm' })
  var malePath = document.getElementById('path_male')

  mainSVG.classList.add('select-male')
  shadow.classList.add('shine')

  if (event) {
    gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Male', eventLabel: 'Select male template' })
  }

  setTimeout(function () {
    displayPallette()
  }, 350)
}

function addTopicalItem () {
  // hash.add({ mask: 'hospital' });
}

function addDecency () {
  var sex = c.choices.sex
  if (sex === 'm') {
    // TODO add underwear here.
  } else if (sex === 'f') {
    // TODO add underwear here.
    hash.add({ bra: 'bow' })
  }
}

function selectFemale (event) {
  c.choices.sex = 'f'
  var femaleRadioBtn = document.querySelector('#fButton')
  var mainSVG = document.querySelector('#svg1')
  var maleSilhouette = document.querySelector('#male_silhouette')
  var femaleSilhouette = document.querySelector('#female_silhouette')
  var shadow = document.querySelector('.character-shadow')

  maleSilhouette.removeEventListener('click', selectMale)

  if (femaleRadioBtn) {
    femaleRadioBtn.checked = true
  }
  if (femaleSilhouette) {
    femaleSilhouette.removeEventListener('click', selectFemale, false)
  }
  hash.add({ sex: 'f' })
  var femaleSilhouette = document.getElementById('female_silhouette')
  var femalePath = document.getElementById('path_female')
  mainSVG.classList.add('select-female')
  shadow.classList.add('shine')

  if (event) {
    gaga('send', 'event', { eventCategory: 'Navigation', eventAction: 'Female', eventLabel: 'Select female template' })
  }

  setTimeout(function () {
    displayPallette()
  }, 350)
}

function presentFaceStyles () {
  var sex = c.choices.sex
  // consolelog('sex', sex)
  // consolelog('presentFaceStyles')
  var faceWestern
  var faceAnime
  var faceContainer = document.querySelector('.face-styles')
  // var faceStyle = faceContainer.querySelector('STYLE')
  // consolelog('faceContainer', faceStyle)

  //   if (c.choices.faceStyle) {
  //     launch();
  //     return;
  //   }

  colorSilhouette()
  zoomTwoFaces()

  var hideWestern
  var hideAnime

  if (sex === 'm') {
    faceWestern = document.querySelector('.male-face-western-style')
    faceAnime = document.querySelector('.male-face-anime-style')
    hideWestern = document.querySelector('.female-face-anime-style')
    hideAnime = document.querySelector('.female-face-anime-style')
  } else {
    faceWestern = document.querySelector('.female-face-western-style')
    faceAnime = document.querySelector('.female-face-anime-style')
    hideWestern = document.querySelector('.male-face-western-style')
    hideAnime = document.querySelector('.male-face-anime-style')
  }
  // female-face-anime-style
  // TODO Color the eyes and eyebrows to fit with the skin tone.

  // TODO Transform Translate horizontaly to make both styles visible.

  hideWestern.classList.add('inactive-vector')
  hideAnime.classList.add('inactive-vector')
  faceWestern.classList.add('active-vector')
  faceAnime.classList.add('active-vector')
  faceWestern.style.opacity = 1
  faceAnime.style.opacity = 1
  faceWestern.style.transform = 'translateX(-23px)'
  faceAnime.style.transform = 'translateX(23px)'
  faceContainer.style.opacity = 1

  // TODO: Add event listener to both face styles;

  // launch();
}

function selectStyleWestern () {
  // consolelog('selectStyleWestern')

  // TODO Transform Translate horizontaly to match face on head;

  // launch();
}

function selectStyleAnime () {
  // consolelog('selectStyleAnime')

  // TODO Transform Translate horizontaly to match face on head;

  // launch();
}
"use strict"

function closeAllOverlays () {
  var overlays = document.querySelectorAll('.overlay--show')
  var counter = overlays.length

  while (counter--) {
    overlays[counter].classList.remove('overlay--show')
  }
}

function showAbout (ev) {
  ev.preventDefault()
  var overlay = document.querySelector('.js-about')
  var closeBtn = overlay.querySelector('.close-btn')
  hamburger()
  closeAllOverlays()
  overlay.classList.add('overlay--show')
  overlay.addEventListener('click', closeOverlay, true)
  closeBtn.addEventListener('click', closeOverlay, false)
}

function showFAQ (ev) {
  ev.preventDefault()
  var overlay = document.querySelector('.js-faq')
  var closeBtn = overlay.querySelector('.close-btn')
  hamburger()
  closeAllOverlays()
  overlay.classList.add('overlay--show')
  overlay.addEventListener('click', closeOverlay, true)
  closeBtn.addEventListener('click', closeOverlay, false)
}

/*
function showShop (ev) {
  ev.preventDefault()
  var overlay = document.querySelector('.js-shop')
  // consolelog('url', upload())
  var closeBtn = overlay.querySelector('.close-btn')
  hamburger()
  closeAllOverlays()
  overlay.classList.add('overlay--show')
  overlay.addEventListener('click', closeOverlay, true)
  closeBtn.addEventListener('click', closeOverlay, false)
}
*/

function showDownloadOptions (ev) {
  ev.preventDefault()
  var overlay = document.querySelector('.js-download-options')
  var closeBtn = overlay.querySelector('.close-btn')
  hamburger()
  closeAllOverlays()
  overlay.classList.add('overlay--show')
  overlay.addEventListener('click', closeOverlay, true)
  closeBtn.addEventListener('click', closeOverlay, false)
}

function logoutUI () {
  var pageWrap = document.querySelector('.logged')
  if (pageWrap) {
    pageWrap.classList.remove('logged')
    resetCharacters()
  }
}

function loginMenu (evt) {
  if (evt) {
    evt.preventDefault()
  }
  var overlay = document.querySelector('.js-login')
  var loginForm = document.querySelector('#login-form')
  var firstInput = overlay.querySelector('.first-input')
  var closeBtn = overlay.querySelector('.close-btn')
  closeAllOverlays()
  overlay.classList.add('overlay--show')
  loginForm.addEventListener('submit', login, true)
  overlay.addEventListener('click', closeLogin, true)
  firstInput.focus()
  closeBtn.addEventListener('click', closeOverlay, false)
}

function closeLogin (evt) {
  var overlay = document.querySelector('.js-login')
  var cancelBtn = overlay.querySelector('.cancel-btn')
  var target = evt.target
  if (target === overlay || target === cancelBtn) {
    var login = document.querySelector('.overlay--show')
    if (login) {
      clearInputFields()
      login.classList.remove('overlay--show')
    }
  }
}

function closeOverlay (evt) {
  var overlay = document.querySelector('.overlay--show')
  if (overlay === null) { return };
  var cancelBtn = overlay.querySelector('.cancel-btn')
  var closeBtn = overlay.querySelector('.close-btn')
  var target = evt.target
  if (target === overlay || target === cancelBtn || target === closeBtn) {
    if (overlay) {
      hideNewCharacterInputField()
      overlay.classList.remove('overlay--show')
    }
  }
}

function hideNewCharacterInputField () {
  var overlay = document.querySelector('.overlay--show')
  var newField = overlay.querySelector('.overlay__char-new--create')
  if (newField) {
    clearInputFields()
    newField.classList.remove('overlay__char-new--create')
  }
}

function clearInputFields () {
  var currentOverlay = document.querySelector('.overlay--show')
  var inputList = currentOverlay.querySelectorAll('input')
  var inputListLength = inputList.length
  var errorField = currentOverlay.querySelector('.overlay__error--show')
  while (inputListLength--) {
    inputList[inputListLength].value = ''
  }
  if (errorField) {
    errorField.classList.remove('overlay__error--show')
  }
}

function clearInputUsername () {
  var currentOverlay = document.querySelector('.overlay--show')
  var inputUsername = currentOverlay.querySelectorAll('.overlay__input__username')
  inputUsername[0].value = ''
}
"use strict"

function parseHash (forms, skinLayers, hairLayers) {
  newParseHash()
  var formsLength = forms.length
  var formsCounter = formsLength
  var hashColor
  var hashColorBeta
  var hashColorGamma
  var hashColorDelta
  var hashColorEpsilon

  while (formsCounter--) {
    var f = formsLength - formsCounter - 1
    for (var x in forms[f]) {
      var section = x.toLowerCase()
      if (section === 'pupils') {
        modCharacter(section, hashData)
      }
      if (section === 'brows' || section === 'eyes' || section === 'mouth' || section === 'lashes' || section === 'sockets') {
        var hashData = hash.get('emotion')
        if (hashData === undefined) {
          hashData = 'neutral'
        }
      } else {
        var hashData = hash.get(section)
      }
      var id = section + '_' + hashData
      if (hashData != undefined) {
        modCharacter(section, hashData)
        // gaga('send', 'event', 'hash', 'select', id);
      } else if (section === 'brows' || section === 'eyes' || section === 'mouth' || section === 'lashes' || section === 'sockets') {
        modCharacter(section, 'neutral')
      };
      if (id in skinLayers || section === 'body') {
        section = 'skin'
      } else if (id in hairLayers || section === 'hair') { section = 'hair' }

      hashColor = hash.get(section + 'Color')
      hashColorBeta = hash.get(section + 'Color-bet')
      hashColorGamma = hash.get(section + 'Color-gam')
      hashColorDelta = hash.get(section + 'Color-del')
      hashColorEpsilon = hash.get(section + 'Color-eps')

      if (hashColor != undefined && hashColor != '') {
        modCharacter(section + 'Color', hashColor)
        // gaga('send', 'event', 'hash', 'color', section+'_'+hashColor );
      };
      if (hashColorBeta != undefined && hashColorBeta != '') {
        modCharacter(section + 'Color-bet', hashColorBeta)
        // gaga('send', 'event', 'hash', 'color', section+'_'+hashColor );
      };
      if (hashColorGamma != undefined && hashColorGamma != '') {
        modCharacter(section + 'Color-gam', hashColorGamma)
        // gaga('send', 'event', 'hash', 'color', section+'_'+hashColor );
      };
      if (hashColorDelta != undefined && hashColorDelta != '') {
        modCharacter(section + 'Color-del', hashColorDelta)
        // gaga('send', 'event', 'hash', 'color', section+'_'+hashColor );
      };
      if (hashColorEpsilon != undefined && hashColorEpsilon != '') {
        modCharacter(section + 'Color-eps', hashColorEpsilon)
        // gaga('send', 'event', 'hash', 'color', section+'_'+hashColor );
      };
    };
  };
};

function newParseHash () {
  var hashDict = hash.get()
  var keys = Object.keys(hashDict)
  var key
  for (key in hashDict) {
    if (hashDict[key] === '') { hash.remove(key) }
  }
  if (hashDict.irisColor != '') {
    modCharacter('irisColor', hashDict.irisColor)
  }
}

function hashCharacter () {
  var u = currentUser.cc.personnages[currentUser.cc.personnageActuel]
  var r
  var t = []
  for (r in u) {
    t.push(encodeURIComponent(r) + '=' + encodeURIComponent(u[r]))
  }
  if (t.length) {
    personnageActuelToHash(currentUser)
  }
}

function personnageActuelToHash (currentUser) {
  var personnageActuel = currentUser.cc.personnageActuel
  var personnageActuelData
  var itemsList
  var currentCount
  var myKey
  var myValue
  var hashArgs = {}

  if (personnageActuel && personnageActuel !== '') {
    personnageActuelData = currentUser.cc.personnages[personnageActuel]
    itemsList = Object.keys(personnageActuelData)
    itemsListLength = itemsList.length
    itemsListCounter = itemsListLength
    while (itemsListCounter--) {
      currentCount = itemsListLength - itemsListCounter - 1
      myKey = itemsList[currentCount]
      myValue = personnageActuelData[itemsList[currentCount]]
      hashArgs[myKey] = myValue
      hash.add(hashArgs)
    }
    clearCharacter()
    interpretHash()
  }
}

function interpretHash () {
  var hashSex = hash.get('sex')
  if (hashSex === 'm') {
    selectMale()
  } else if (hashSex === 'f') {
    selectFemale()
  }
}
function createDecentRandomCharacter () {
    var sex
    var skinTone

    hideTutorial()
    gaga('send', 'event', { eventCategory: 'Secret function', eventAction: 'smartRandomSingle()', eventLabel: 'Secret Patreon reveal for new random function.' })
    hash.clear()
    resetCharacter()

    sex = getRandomSex()
    skinTone = getRandomSkinTone()

    defaultEyeColor(c, skinTone)
    defaultHairColor(c, skinTone)
    defaultPupilShape()

    if (sex === 'f') {
      dressFemaleRandom()
    } else {
      dressMaleRandom()
    }
}

function getRandomSex () {
  // Choose the sex at random (50/50)
    var roll
    var sex

    roll = Math.floor((Math.random() * 100))

    if (roll <= 50) { sex = 'f' } else { sex = 'm' }

    return sex
}

function getRandomSkinTone () {
  var roll
  var skinTone
  var skinToneList = ['#FFDFC4', '#F0D5BE', '#EECEB3', '#E1B899', '#E5C298', '#FFDCB2', '#E5B887', '#E5A073', '#E79E6D', '#DB9065', '#CE967C', '#C67856', '#BA6C49', '#A57257', '#F0C8C9', '#DDA8A0', '#B97C6D', '#A8756C', '#AD6452', '#5C3836', '#CB8442', '#BD723C', '#704139', '#A3866A']
  var obj = new Array()

  roll = Math.floor((Math.random() * skinToneList.length))
  skinTone = obj.skinColor = skinToneList[roll].toLowerCase()
  hash.add(obj)

  return skinTone
}

function getRandomFabricColor () {
  var roll
  var fabColor
  // var fabColorList

  roll = Math.floor((Math.random() * fabColorList.length))
  fabColor = fabricPallette[roll]

  return fabColor
}

function getForms (sex) {
  var forms

  if (sex === 'f') {
    selectFemale()
    var form1 = femaleForm1
    var form2 = femaleForm2
    var form3 = femaleForm3
    var form4 = femaleForm4
    var form5 = femaleForm5
    var form6 = femaleForm6
  } else {
    selectMale()
    var form1 = maleForm1
    var form2 = maleForm2
    var form3 = maleForm3
    var form4 = maleForm4
    var form5 = maleForm5
    var form6 = maleForm6
  }
  forms = [form1, form2, form3, form4, form5, form6]

  return forms
}

function dressFemaleRandom () {
  hideTutorial()
  var forms = getForms('f')
  var chanceDict = {
    // 'button' : 2,
      belt: 25,
      bracelet: 50,
      coat: 15,
      collar: 5,
      dress: 33,
      earings: 50,
      earpiece: 5,
      eyepatch: 10,
      glasses: 60,
      hat: 10,
      holster: 5,
      horns: 3,
      kneepads: 5,
      leggings: 25,
      makeup: 80,
      mask: 5,
      necklace: 25,
      pet: 20,
      scarf: 10,
      shirt: 15,
      shoulderpads: 5,
      smoke: 25,
      suit: 5,
      veil: 5,
      vest: 3,
      warpaint: 5,
      wings: 5
  }
  var options
  var randomItem
  var obj
  var topList = ['shirt', 'top', 'blouse']
  var bottomList = ['pants', 'skirt']
  var topChoice
  var fabColorCounter = fabricPallette.length
  var fabRoll = Math.floor((Math.random() * fabColorCounter))
  var fabColor = fabricPallette[fabRoll]

  // Determine if wearing a dress or a top/bottom combination

  if ( Math.floor((Math.random() * 100)) <= chanceDict.dress) {
    // If wearing a dress
    obj = new Array()
    options = forms[3].Dress.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['dress'] = randomItem
    hash.add(obj)
    // change color
    obj = new Array()
    obj['dressColor'] = fabColor
    hash.add(obj)
    // Add necklace
    if ( Math.floor((Math.random() * 100)) <= chanceDict.necklace) {
      obj = new Array()
      options = forms[2].Necklace.slice(1)
      randomItem = options[Math.floor((Math.random() * options.length))]
      obj['necklace'] = randomItem
      hash.add(obj)
    }
  } else {
    // If wearing a top/bottom combo

    // Choose from shirts, tops and blouses
    topChoice = topList[Math.floor((Math.random() * topList.length))]

    if (topChoice === 'shirt') {
      obj = new Array()
      options = forms[2].Shirt.slice(1)
      randomItem = options[Math.floor((Math.random() * options.length))]
      obj['shirt'] = randomItem
      hash.add(obj)
      // change color
      obj = new Array()
      obj['shirtColor'] = fabColor
      hash.add(obj)
    } else if (topChoice === 'top') {
      obj = new Array()
      options = forms[2].Top.slice(1)
      randomItem = options[Math.floor((Math.random() * options.length))]
      obj['top'] = randomItem
      hash.add(obj)
      obj = new Array()
      obj['topColor'] = fabColor
      hash.add(obj)
    } else {
      obj = new Array()
      options = forms[3].Blouse.slice(1)
      randomItem = options[Math.floor((Math.random() * options.length))]
      obj['blouse'] = randomItem
      hash.add(obj)
      obj = new Array()
      obj['blouseColor'] = fabColor
      hash.add(obj)
    }
    // Choose from skirts, pants or shorts
    bottomChoice = bottomList[Math.floor((Math.random() * bottomList.length))]

    if (bottomChoice === 'pants') {
      obj = new Array()
      options = forms[4].Pants.slice(1)
      randomItem = options[Math.floor((Math.random() * options.length))]
      obj['pants'] = randomItem
      hash.add(obj)
      obj = new Array()
      obj['pantsColor'] = fabColor
      hash.add(obj)
    } else if (bottomChoice === 'skirt') {
      obj = new Array()
      options = forms[4].Skirt.slice(1)
      randomItem = options[Math.floor((Math.random() * options.length))]
      obj['skirt'] = randomItem
      hash.add(obj)
      obj = new Array()
      obj['skirtColor'] = fabColor
      hash.add(obj)
    }
  }

  // Choose if wearing a hat
  if ( Math.floor((Math.random() * 100)) <= chanceDict.hat) {
    obj = new Array()
    options = forms[1].Hat.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['hat'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['hatColor'] = fabColor
    hash.add(obj)
  } else {
    // Choose hair style depending on hat
    obj = new Array()
    options = forms[0].Hair.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['hair'] = randomItem
    hash.add(obj)
  }
  // Choose Glasses
  if ( Math.floor((Math.random() * 100)) <= chanceDict.glasses) {
    obj = new Array()
    options = forms[1].Glasses.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['glasses'] = randomItem
    hash.add(obj)
  }
  // Add earrings
  if ( Math.floor((Math.random() * 100)) <= chanceDict.earings) {
    obj = new Array()
    options = forms[1].Earings.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['earings'] = randomItem
    hash.add(obj)
  }

  // Add bracelets, bandages and other accessories
  if ( Math.floor((Math.random() * 100)) <= chanceDict.bracelet) {
    obj = new Array()
    options = forms[3].Bracelet.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['bracelet'] = randomItem
    hash.add(obj)
  }

  // Add smoke accessories
  if ( Math.floor((Math.random() * 100)) <= chanceDict.smoke) {
    obj = new Array()
    options = forms[1].Smoke.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['smoke'] = randomItem
    hash.add(obj)
  }

  if ( Math.floor((Math.random() * 100)) <= chanceDict.bracelet) {
    obj = new Array()
    options = forms[3].Bracelet.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['bracelet'] = randomItem
    hash.add(obj)
  }
  // Shoulderpads
  if ( Math.floor((Math.random() * 100)) <= chanceDict.shoulderpads) {
    obj = new Array()
    options = forms[2].Shoulderpads.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['shoulderpads'] = randomItem
    hash.add(obj)
    // obj = new Array()
    // obj['shoulderpadsColor'] = fabColor
    // hash.add(obj)
  }

  // Add leggings
  if ( Math.floor((Math.random() * 100)) <= chanceDict.leggings) {
    obj = new Array()
    options = forms[5].Leggings.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['leggings'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['leggingsColor'] = fabColor
    hash.add(obj)
  }

  // Choose shoes
  obj = new Array()
  options = forms[5].Shoes.slice(1)
  randomItem = options[Math.floor((Math.random() * options.length))]
  obj['shoes'] = randomItem
  hash.add(obj)
  obj = new Array()
  obj['shoesColor'] = fabColor
  hash.add(obj)

  // coat
  if ( Math.floor((Math.random() * 100)) <= chanceDict.coat) {
    obj = new Array()
    options = forms[3].Coat.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['coat'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['coatColor'] = fabColor
    hash.add(obj)
  }
  // collar
  if ( Math.floor((Math.random() * 100)) <= chanceDict.collar) {
    obj = new Array()
    options = forms[2].Collar.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['collar'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['collarColor'] = fabColor
    hash.add(obj)
  }
  // earpiece
  if ( Math.floor((Math.random() * 100)) <= chanceDict.earpiece) {
    obj = new Array()
    options = forms[1].Earpiece.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['earpiece'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['earpieceColor'] = fabColor
    hash.add(obj)
  }
  // eyepatch
  if ( Math.floor((Math.random() * 100)) <= chanceDict.eyepatch) {
    obj = new Array()
    options = forms[1].Eyepatch.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['eyepatch'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['eyepatchColor'] = fabColor
    hash.add(obj)
  }
  // holster
  if ( Math.floor((Math.random() * 100)) <= chanceDict.holster) {
    obj = new Array()
    options = forms[3].Holster.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['holster'] = randomItem
    hash.add(obj)
    // obj = new Array()
    // obj['holsterColor'] = fabColor
    // hash.add(obj)
  }
  // horns
  if ( Math.floor((Math.random() * 100)) <= chanceDict.horns) {
    obj = new Array()
    options = forms[1].Horns.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['horns'] = randomItem
    hash.add(obj)
    // obj = new Array()
    // obj['hornsColor'] = fabColor
    // hash.add(obj)
  }
  // kneepads
  if ( Math.floor((Math.random() * 100)) <= chanceDict.kneepads) {
    obj = new Array()
    options = forms[4].Kneepads.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['kneepads'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['kneepadsColor'] = fabColor
    hash.add(obj)
  }
  // makeup
  if ( Math.floor((Math.random() * 100)) <= chanceDict.makeup) {
    obj = new Array()
    options = forms[1].Makeup.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['makeup'] = randomItem
    hash.add(obj)
    // obj = new Array()
    // obj['makeupColor'] = fabColor
    // hash.add(obj)
  }
  // mask
  // if ( Math.floor((Math.random() * 100)) <= chanceDict.mask) {
  //   obj = new Array()
  //   options = forms[1].Mask.slice(1)
  //   randomItem = options[Math.floor((Math.random() * options.length))]
  //   obj['mask'] = randomItem
  //   hash.add(obj)
  //   // obj = new Array()
  //   // obj['maskColor'] = fabColor
  //   // hash.add(obj)
  // }
  // pet
  // if ( Math.floor((Math.random() * 100)) <= chanceDict.pet) {
  //   obj = new Array()
  //   options = forms[3].Pet.slice(1)
  //   console.log('pet', options)
  //   randomItem = options[Math.floor((Math.random() * options.length))]
  //   obj['pet'] = randomItem
  //   hash.add(obj)
  //   console.log('randomItem', randomItem)
  //   obj = new Array()
  //   obj['petColor'] = fabColor
  //   hash.add(obj)
  // }
  // scarf
  if ( Math.floor((Math.random() * 100)) <= chanceDict.scarf) {
    obj = new Array()
    options = forms[2].Scarf.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['scarf'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['scarfColor'] = fabColor
    hash.add(obj)
  }
  // suit
  // if ( Math.floor((Math.random() * 100)) <= chanceDict.suit) {
  //   obj = new Array()
  //   options = forms[3].Suit.slice(1)
  //   console.log('suit', options)
  //   randomItem = options[Math.floor((Math.random() * options.length))]
  //   obj['suit'] = randomItem
  //   hash.add(obj)
  //   console.log('randomItem', randomItem)
  //   obj = new Array()
  //   obj['suitColor'] = fabColor
  //   hash.add(obj)
  // }
  // tie
  // if ( Math.floor((Math.random() * 100)) <= chanceDict.tie) {
  //   obj = new Array()
  //   options = forms[2].Tie.slice(1)
  //   console.log('tie', options)
  //   randomItem = options[Math.floor((Math.random() * options.length))]
  //   obj['tie'] = randomItem
  //   hash.add(obj)
  //   console.log('randomItem', randomItem)
  //   obj = new Array()
  //   obj['tieColor'] = fabColor
  //   hash.add(obj)
  // }
  // veil
  if ( Math.floor((Math.random() * 100)) <= chanceDict.veil) {
    obj = new Array()
    options = forms[1].Veil.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['veil'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['veilColor'] = fabColor
    hash.add(obj)
  }
  // warpaint
  if ( Math.floor((Math.random() * 100)) <= chanceDict.warpaint) {
    obj = new Array()
    options = forms[1].warpaint.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['warpaint'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['warpaintColor'] = fabColor
    hash.add(obj)
  }
  // wings
  if ( Math.floor((Math.random() * 100)) <= chanceDict.wings) {
    obj = new Array()
    options = forms[3].Wings.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['wings'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['wingsColor'] = fabColor
    hash.add(obj)
  }
  // ==============================================================================

  launch()
}

function dressMaleRandom () {
  hideTutorial()

  var forms = getForms('m')
  var chanceDict = {
    // 'button' : 2,
    belt: 33,
    coat: 15,
    collar: 5,
    earings: 10,
    earpiece: 5,
    eyepatch: 10,
    facialhair: 50,
    glasses: 60,
    hat: 25,
    holster: 5,
    horns: 3,
    jacket: 33,
    kneepads: 5,
    mask: 5,
    necklace: 50,
    pet: 20,
    scarf: 10,
    shirt: 95,
    shoulderpads: 5,
    smoke: 25,
    socks: 50,
    suit: 5,
    tie: 15,
    vest: 33,
    warpaint: 5,
    watch: 75,
    wings: 5
  }
  var options
  var randomItem
  var obj
  var fabColorCounter = fabricPallette.length
  var fabRoll = Math.floor((Math.random() * fabColorCounter))
  var fabColor = fabricPallette[fabRoll]

  // Choose from shirts
  obj = new Array()
  options = forms[2].Shirt.slice(1)
  randomItem = options[Math.floor((Math.random() * options.length))]
  obj['shirt'] = randomItem
  hash.add(obj)
  obj = new Array()
  obj['shirtColor'] = fabColor
  hash.add(obj)
  // Choose from pants
  obj = new Array()
  options = forms[4].Pants.slice(1)
  randomItem = options[Math.floor((Math.random() * options.length))]
  obj['pants'] = randomItem
  hash.add(obj)
  obj = new Array()
  obj['pantsColor'] = fabColor
  hash.add(obj)
  // Add belt
  if ( Math.floor((Math.random() * 100)) <= chanceDict.belt) {
    obj = new Array()
    options = forms[4].Belt.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['belt'] = randomItem
    hash.add(obj)
  }
  // Vest
  if ( Math.floor((Math.random() * 100)) <= chanceDict.vest) {
    obj = new Array()
    options = forms[2].Vest.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['vest'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['vestColor'] = fabColor
    hash.add(obj)
  }
  // Jacket
  if ( Math.floor((Math.random() * 100)) <= chanceDict.jacket) {
    obj = new Array()
    options = forms[3].Jacket.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['jacket'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['jacketColor'] = fabColor
    hash.add(obj)
  }
  // Choose if wearing a hat
  if ( Math.floor((Math.random() * 100)) <= chanceDict.hat) {
    obj = new Array()
    options = forms[1].Hat.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['hat'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['hatColor'] = fabColor
    hash.add(obj)
  } else {
    // Choose hair style depending on hat
    obj = new Array()
    options = forms[0].Hair.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['hair'] = randomItem
    hash.add(obj)
  }

  // Choose Facialhair
  if ( Math.floor((Math.random() * 100)) <= chanceDict.facialhair) {
    obj = new Array()
    options = forms[0].Facialhair.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['facialhair'] = randomItem
    hash.add(obj)
  }

  // Choose Glasses
  if ( Math.floor((Math.random() * 100)) <= chanceDict.glasses) {
    obj = new Array()
    options = forms[1].Glasses.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['glasses'] = randomItem
    hash.add(obj)
  }
  // Add earrings if that's the case
  if ( Math.floor((Math.random() * 100)) <= chanceDict.earings) {
    obj = new Array()
    options = forms[1].Earings.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['earings'] = randomItem
    hash.add(obj)
  }
  // Add watch, bracelet, bandages and other accessories
  if ( Math.floor((Math.random() * 100)) <= chanceDict.watch) {
    obj = new Array()
    options = forms[3].Watch.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['watch'] = randomItem
    hash.add(obj)
  }
  // Add smoke accessories
  if ( Math.floor((Math.random() * 100)) <= chanceDict.smoke) {
    obj = new Array()
    options = forms[1].Smoke.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['smoke'] = randomItem
    hash.add(obj)
  }
  // Shoulderpads
  if ( Math.floor((Math.random() * 100)) <= chanceDict.shoulderpads) {
    obj = new Array()
    options = forms[2].Shoulderpads.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['shoulderpads'] = randomItem
    hash.add(obj)
    // obj = new Array()
    // obj['shoulderpadsColor'] = fabColor
    // hash.add(obj)
  }

  // Add socks
  if ( Math.floor((Math.random() * 100)) <= chanceDict.socks) {
    obj = new Array()
    options = forms[5].Socks.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['socks'] = randomItem
    hash.add(obj)
  }
  // Choose shoes
  obj = new Array()
  options = forms[5].Shoes.slice(1)
  randomItem = options[Math.floor((Math.random() * options.length))]
  obj['shoes'] = randomItem
  hash.add(obj)
  // obj = new Array()
  // obj['shoesColor'] = fabColor
  // hash.add(obj)

  // coat
  if ( Math.floor((Math.random() * 100)) <= chanceDict.coat) {
    obj = new Array()
    options = forms[3].Coat.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['coat'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['coatColor'] = fabColor
    hash.add(obj)
  }
  // earpiece
  if ( Math.floor((Math.random() * 100)) <= chanceDict.earpiece) {
    obj = new Array()
    options = forms[1].Earpiece.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['earpiece'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['earpieceColor'] = fabColor
    hash.add(obj)
  }
  // eyepatch
  if ( Math.floor((Math.random() * 100)) <= chanceDict.eyepatch) {
    obj = new Array()
    options = forms[1].Eyepatch.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['eyepatch'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['eyepatchColor'] = fabColor
    hash.add(obj)
  }
  // holster
  if ( Math.floor((Math.random() * 100)) <= chanceDict.holster) {
    obj = new Array()
    options = forms[3].Holster.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['holster'] = randomItem
    hash.add(obj)
  }
  // horns
  if ( Math.floor((Math.random() * 100)) <= chanceDict.horns) {
    obj = new Array()
    options = forms[1].Horns.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['horns'] = randomItem
    hash.add(obj)
  }
  // kneepads
  if ( Math.floor((Math.random() * 100)) <= chanceDict.kneepads) {
    obj = new Array()
    options = forms[4].Kneepads.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['kneepads'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['kneepadsColor'] = fabColor
    hash.add(obj)
  }
  // mask
  // if ( Math.floor((Math.random() * 100)) <= chanceDict.mask) {
  //   obj = new Array()
  //   options = forms[1].Mask.slice(1)
  //   randomItem = options[Math.floor((Math.random() * options.length))]
  //   obj['mask'] = randomItem
  //   hash.add(obj)
  //   // obj = new Array()
  //   // obj['maskColor'] = fabColor
  //   // hash.add(obj)
  // }
  // pet
  // if ( Math.floor((Math.random() * 100)) <= chanceDict.pet) {
  //   obj = new Array()
  //   options = forms[3].Pet.slice(1)
  //   console.log('pet', options)
  //   randomItem = options[Math.floor((Math.random() * options.length))]
  //   obj['pet'] = randomItem
  //   hash.add(obj)
  //   console.log('randomItem', randomItem)
  //   obj = new Array()
  //   obj['petColor'] = fabColor
  //   hash.add(obj)
  // }
  // scarf
  if ( Math.floor((Math.random() * 100)) <= chanceDict.scarf) {
    obj = new Array()
    options = forms[2].Scarf.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['scarf'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['scarfColor'] = fabColor
    hash.add(obj)
  }
  // suit
  // if ( Math.floor((Math.random() * 100)) <= chanceDict.suit) {
  //   obj = new Array()
  //   options = forms[3].Suit.slice(1)
  //   console.log('suit', options)
  //   randomItem = options[Math.floor((Math.random() * options.length))]
  //   obj['suit'] = randomItem
  //   hash.add(obj)
  //   console.log('randomItem', randomItem)
  //   obj = new Array()
  //   obj['suitColor'] = fabColor
  //   hash.add(obj)
  // }
  // tie
  if ( Math.floor((Math.random() * 100)) <= chanceDict.tie) {
    obj = new Array()
    options = forms[2].Tie.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['tie'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['tieColor'] = fabColor
    hash.add(obj)
  }
  // warpaint
  if ( Math.floor((Math.random() * 100)) <= chanceDict.warpaint) {
    obj = new Array()
    options = forms[1].warpaint.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['warpaint'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['warpaintColor'] = fabColor
    hash.add(obj)
  }
  // wings
  if ( Math.floor((Math.random() * 100)) <= chanceDict.wings) {
    obj = new Array()
    options = forms[3].Wings.slice(1)
    randomItem = options[Math.floor((Math.random() * options.length))]
    obj['wings'] = randomItem
    hash.add(obj)
    obj = new Array()
    obj['wingsColor'] = fabColor
    hash.add(obj)
  }

  launch()
}
"use strict"

// NO GLOBALS
// USES DOM

const showSidebarLeft = () => document.querySelector('#sidebar-left').classList.add('visible')

const hideSidebarLeft = () => document.querySelector('#sidebar-left').classList.remove('visible')

const clearSidebarLeft = () => document.querySelector('#sidebar-left').innerHTML = ''

const showSidebarRight = () => document.querySelector('#sidebar').classList.add('visible')

const hideSidebarRight = () => document.querySelector('#sidebar').classList.remove('visible')

function clearSidebarRight () {
  document.querySelector('#content_1').innerHTML = ''
  document.querySelector('#sidebar').classList.remove('visible')
}
// Functions for the thumbnails in the right sidebar.

function openThumbs () {
  hideColorPicker()
  openThumbsLogic(this)
}

/*
function calcViewBox (svgObject) {
  // TODO Calculate the view Box automatically to make creating new items easier
  var viewBox
  // var rect = svgObject.getBoundingClientRect()

  // Figure out whether height or width is larger
  // recalculate smallest of the two to be the same size as the largest
  // take the difference between largest and smallest and divide by two
  // Take away that amount from starting point of smallest side (x or y)
  // Make the width/height the same.

  // consolelog('svgObject', svgObject)
  // consolelog('rect', rect)

  return viewBox
}
*/

function openThumbsLogic (_) {
  var section = _.innerHTML
  var layersList = getSectionLayersList(section)
  var sectionLowerCase = section.toLowerCase()
  var previousSelection = document.querySelector('.section--selected')

  if (sectionLowerCase === 'iris' || sectionLowerCase === 'pupils') {
    sectionLowerCase = 'eyeballs'
    layersList = ['default']
  }

  if (previousSelection != null) {
    purgeHiddenLayers()
    previousSelection.classList.remove('section--selected')
  };

  loadSectionLayers(sectionLowerCase, layersList, populateThumbs, true)
  showThumbOptions(_)
  _.classList.add('section--selected')

  var thumbSection = document.querySelector('.widget')
  var thumbSectionBtn = thumbSection.previousSibling
  var sidebarLeft = document.querySelector('#sidebar-left')
  var sidebarRight = document.querySelector('.sidebar-right')

  if (thumbSectionBtn.classList === undefined && thumbSectionBtn.previousSibling.classList != undefined) {
    thumbSectionBtn = thumbSectionBtn.previousSibling
  }
  thumbSectionBtn = thumbSectionBtn.querySelector('.accordeon__svg-container')

  if (thumbSectionBtn.classList.contains('section-btn--hide')) {
    thumbSectionBtn.classList.toggle('section-btn--hide')
  }

  if (thumbSection.classList.contains('section--hide')) {
    thumbSection.classList.toggle('section--hide')
  }

  if (sidebarLeft.classList.contains('cherry')) {
    sidebarLeft.classList.remove('cherry')
    sidebarRight.classList.add('visible')
  }
  sidebarRight.classList.add('visible')
}

function populateThumbs (svgObject) {
  var emotion = (document.querySelector('#content_1 .selected--option').classList[2] === 'options__emotion')
  var thumbObject = svgObject.cloneNode(true)
  var layerID = thumbObject.id
  var groupTotal
  var groupRank
  var parentEl
  var groupInPlace
  var counter
  var loopRank
  var splitArray
  var openedDrawer
  var pupilShape
  var pupilShapeList = ['round', 'feline', 'star']
  var counter = pupilShapeList.length
  // var viewBox = calcViewBox(svgObject);
  thumbObject.style.opacity = 1

  if (layerID.slice(-5, -1) === '_of_') {
    groupRank = parseInt(layerID.slice(-6, -5))

    groupTotal = parseInt(layerID.slice(-1))
    layerID = layerID.slice(0, -7)
    parentEl = document.querySelector('#content_1 .' + layerID)
    if (groupRank === groupTotal || !parentEl.firstChild) {
      parentEl.appendChild(thumbObject)
    } else if (groupTotal === 2) {
      parentEl.insertBefore(thumbObject, parentEl.firstChild)
    } else {
      groupInPlace = parentEl.childNodes
      counter = groupInPlace.length
      while (counter--) {
        loopRank = parseInt(groupInPlace[counter].id.slice(-6, -5))
        if (loopRank > groupRank) {
          parentEl.insertBefore(thumbObject, groupInPlace[counter])
        }
      }
      if (groupRank > groupInPlace[groupInPlace.length - 1].id.slice(-6, -5)) {
        document.querySelector('#content_1 .' + layerID).appendChild(thumbObject)
      }
    }
  } else if (emotion) {
    splitArray = layerID.split('_')
    if (layerID != 'eyeballs_default') {
      document.querySelector('#content_1 ' + '.emotion_' + splitArray[splitArray.length - 1]).appendChild(thumbObject)
    }
  } else if (layerID.slice(0, 4) === 'body' && layerID.slice(5, 9) != 'head') {
    // consolelog('layerID', layerID)
    if (layerID.slice(-5) === 'fault') {
      document.querySelector('#content_1 .' + 'body_default').appendChild(thumbObject)
    } else if (layerID.slice(-5) === 'letic') {
      document.querySelector('#content_1 .' + 'body_athletic').appendChild(thumbObject)
    } else if (layerID.slice(-5) === 'veiny') {
      document.querySelector('#content_1 .' + 'body_veiny').appendChild(thumbObject)
    } else if (layerID.slice(-5) === 'id-00') {
      document.querySelector('#content_1 .' + 'body_android-00').appendChild(thumbObject)
    }
  } else {
    if (layerID === 'eyeball_right') {
      openedDrawer = document.querySelector('.selected--option').classList
      if (openedDrawer.contains('options__iris')) {
        pupilShape = getPupilShape()
        thumbObject = showPupilObject(thumbObject, pupilShape)
        layerID = 'iris_default'
        document.querySelector('#content_1 .' + layerID).appendChild(thumbObject)
      }
      if (openedDrawer.contains('options__pupils')) {
        while (counter--) {
          pupilObject = showPupilObject(thumbObject, pupilShapeList[counter]).cloneNode(true)
          document.querySelector('#content_1 .pupils_' + pupilShapeList[counter]).appendChild(pupilObject)
        }
      }
    } else {
      document.querySelector('#content_1 .' + layerID).appendChild(thumbObject)
    }
  }
}

function showThumbOptions (_) {
  var _ = _.target || _
  var showOptionThumbs = document.querySelector('.options__' + _.innerHTML.toLowerCase())
  var allOptions = document.querySelectorAll('.options__container')
  var i = allOptions.length
  var sectionSelected = document.querySelector('.section--selected')
  if (sectionSelected === null) {
    while (i--) {
      allOptions[i].classList.remove('selected--option')
    }
    showOptionThumbs.classList.add('selected--option')
  };
}

function showTutorial (step) {
  var el = document.querySelector('.tutorial__' + step)
  hideTutorial()
  el.classList.add('tutorial__show')
  tutorialPosition(step)
}

function hideTutorial () {
  console.log('hiding')
  var el = document.querySelector('.tutorial__show')
  if (el) {
    el.classList.remove('tutorial__show')
  }
}

function tutorialPosition (step) {
  var el = document.querySelector('.tutorial__' + step)
  var bbox = el.getBoundingClientRect()
  var w = window.innerWidth
  var h = window.innerHeight
  var gmenu
  var sideBarRight = document.querySelector('.sidebar-right')
  var sideBarLeft = document.querySelector('.sidebar-left')
  var sideBarLeftBBox
  var randomBtn
  var horizontalMenu

  if (step === 'sex') {
    el.style.top = (h/3) * 2 + 'px'
    el.style.left = (w/2) - (bbox.width / 2) + 'px'
  }
  if (step === 'skin') {
    gmenu = document.querySelector('.skin-color__container')
    el.style.top = (gmenu.getBoundingClientRect().top - bbox.height - 20) + 'px'
    el.style.left = (w/2) - (bbox.width / 2) + 'px'
  }
  if (step === 'category') {
    sideBarLeftBBox = sideBarLeft.getBoundingClientRect()
    el.style.top = (sideBarLeftBBox.bottom - bbox.height) + 'px'
    el.style.left = (sideBarLeftBBox.right + 10) + 'px'
  }
  if (step === 'items') {
    sideBarRightBBox = sideBarRight.getBoundingClientRect()
    el.style.top = (sideBarRightBBox.bottom - bbox.height) + 'px'
    el.style.left = (sideBarRightBBox.x - bbox.width - 20) + 'px'
  }
  if (step === 'colors') {
    sideBarRightBBox = sideBarRight.getBoundingClientRect()
    el.style.top = sideBarRightBBox.top + 'px'
    el.style.left = (sideBarRightBBox.x - bbox.width - 20) + 'px'
  }
  if (step === 'random') {
    randomBtn = document.querySelector('.bigRedBtn')
    el.style.top = (randomBtn.getBoundingClientRect().top - bbox.height - 20) + 'px'
    el.style.left = (w/2) - (bbox.width / 2) + 'px'
  }
  if (step === 'register') {
    // Check the screen size to see if there's a hamburger menu
    // If no hamburger menu, then point to the top right menu
    if (w < 992) {
      horizontalMenu = document.querySelector('.icon-hamburger')
      el.style.top = (horizontalMenu.getBoundingClientRect().bottom + 20) + 'px'
      el.style.left = w - (bbox.width / 2) + 'px'
    } else {
      horizontalMenu = document.querySelector('#horizontal')
      el.style.top = (horizontalMenu.getBoundingClientRect().bottom + 20) + 'px'
      el.style.left = w - (bbox.width / 2) + 'px'
    }
  }
}

function getViewBox (t, d) {
  var id = t + '_' + d
  var sex = c.choices.sex
  if (sex === 'm') {
    var idDict = {
      armband_bandage_right: '181 235 81 81',
      armband_bandage_left: '296 239 81 81',
      smoke_blunt: '282 135 20 20',
      body_athletic: '65 130 430 430',
      smoke_cigarette: '259 132 23 23',
      coat_biker: '160 124 230 230',
      coat_varsity: '160 124 230 230',
      coat_snowboard: '160 124 230 230',
      coat_fall_long: '130 124 290 290',
      coat_lab: '130 124 290 290',
      coat_trench: '130 124 290 290',
      earings_gold_rings: '258 113 46 46',
      earings_gold_ring_right: '258 130 11 11',
      earings_gold_ring_left: '292 130 11 11',
      earpiece_neurolink: '257 107 40 40',
      earpiece_scouter: '252 117 30 30',
      ears_plugged: '254 122 20 20',
      ears_unplugged: '254 121 20 20',
      smoke_filter: '199 112 82 82',
      glasses_fpv: '250 97 64 64',
      gloves_boxing: '191 283 73 73',
      gloves_lab: '191 283 73 73',
      hat_football: '243 86 80 80',
      hat_helmet_vietnam: '243 86 80 80',
      hat_jester: '208 54 140 140',
      hat_motorcycle: '243 86 80 80',
      hat_tuque: '243 85 80 80',
      hair_mohawk: '243 45 80 80',
      holster_revolver_hip: '220 240 130 130',
      horns_large: '235 58 90 90',
      kneepads_skate: '222 345 116 116',
      mask_horse: '233 80 100 100',
      mask_robin: '261 108 40 40',
      necklace_chain: '241 140 80 80',
      pet_canine: '82 403 150 150',
      pet_chicken: '45 403 150 150',
      pet_doge: '341 349 200 200',
      pet_feline: '381 439 128 128',
      pet_fox: '42 393 150 150',
      pet_gerbil: '125 475 64 64',
      pet_parrot: '203 116 80 80',
      pet_raven: '50 439 128 128',
      pet_rat: '300 439 128 128',
      pet_siamese_cat: '42 393 150 150',
      pet_vulture: '281 349 180 180',
      scar_horizontal_neck: '265 139 32 32',
      scar_horizontal_nose: '264 115 32 32',
      scar_vertical_heart: '249 164 64 64',
      scar_vertical_left: '264 110 32 32',
      scar_vertical_right: '264 110 32 32',
      scarf_drape: '185 140 190 190',
      shirt_kurta: '120 134 310 310',
      suit_borat: '189 150 181 181',
      tatoo_aum_chest: '248 165 64 64',
      tatoo_aum_left: '298 157 64 64',
      tatoo_aum_right: '198 154 64 64',
      tatoo_chaos_chest: '248 169 64 64',
      tatoo_chaos_left: '298 164 64 64',
      tatoo_chaos_right: '198 164 64 64',
      underwear_boxers: '224 258 120 120'
    }
    var sectionDict = {
      age: '261 109 40 40',
      belt: '185 135 190 190',
      body: '65 130 430 430',
      body_head: '249 95 64 64',
      button: '295 187 23 23',
      cloak: '0 0 560 560',
      coat: '95 134 360 360',
      earpiece: '280 125 25 25',
      ears: '254 120 20 20',
      earings: '256 87 50 50',
      emotion: '259 113 42 42',
      eyepatch: '261 109 40 40',
      facialhair: '261 124 40 40',
      freckles: '261 109 40 40',
      glasses: '261 109 40 40',
      gloves: '206 308 40 40',
      hat: '241 70 80 80',
      hair: '243 80 80 80',
      headband: '241 90 80 80',
      holster: '215 150 130 130',
      horns: '256 87 50 50',
      iris: '271.72 125.05 4 4',
      jacket: '170 130 220 220',
      mask: '243 93 80 80',
      necklace: '241 140 80 80',
      nose: '265 115 32 32',
      pants: '130 244 290 290',
      pupils: '271.72 125.05 4 4',
      scarf: '185 120 190 190',
      shirt: '190 140 190 190',
      shoes: '210 442 120 120',
      shoulderpads: '207 120 150 150',
      smoke: '252 132 32 32',
      socks: '210 442 120 120',
      suit: '65 130 430 430',
      tie: '241 140 80 80',
      underwear: '228 238 120 120',
      veil: '207 97 150 150',
      vest: '185 135 190 190',
      watch: '331 302 25 25',
      warpaint: '261 109 40 40',
      wings: '110 -30 350 350'
    }
  } else if (sex === 'f') {
    var idDict = {
      armband_bandage_right: '186 238 81 81',
      armband_bandage_left: '301 229 81 81',
      armband_egyptian_right: '221 205 38 38',
      armband_egyptian_left: '313 206 38 38',
      smoke_blunt: '283 147 20 20',
      body_athletic: '65 130 430 430',
      bracelet_wonder_right: '190 258 58 58',
      bracelet_wonder_left: '313 234 58 58',
      bracelet_band_right: '198 299 24 24',
      bracelet_band_left: '322 272 24 24',
      bracelet_egyptian_right: '190 258 58 58',
      bracelet_egyptian_left: '313 234 58 58',
      bracelet_ornamental_right: '200 294 24 24',
      bracelet_ornamental_left: '326 270 24 24',
      bracelet_perl_right: '198 299 24 24',
      bracelet_perl_left: '322 272 24 24',
      bracelet_rings_right: '192 271 43 43',
      bracelet_rings_left: '318 254 43 43',
      smoke_cigarette: '264 146 20 20',
      coat_lab: '125 140 280 280',
      coat_winter_tubecollar: '125 120 280 280',
      collar_egyptian: '240 143 75 75',
      collar_leather: '263 150 35 35',
      collar_metal: '250 146 59 59',
      dress_bobafett: '160 165 230 230',
      dress_corset: '175 180 200 200',
      dress_japanese_pleat: '105 140 340 340',
      dress_parisian_fall: '105 160 340 340',
      dress_german_expression: '75 160 400 400',
      dress_short: '175 180 200 200',
      dress_suit: '175 140 200 200',
      dress_waitress: '160 140 230 230',
      earings_gold_ring_left: '289 141 20 20',
      earpiece_neurolink: '257 118 41 41',
      earpiece_scouter: '253 126 30 30',
      smoke_filter: '203 117 81 81',
      glasses_fpv: '252 109 64 64',
      gloves_silk_fingerless_striped: '180 268 68 68',
      hat_football: '243 98 80 80',
      hat_helmet_vietnam: '243 98 80 80',
      hat_motorcycle: '243 98 80 80',
      hat_tiara: '262 98 40 40',
      hat_tuque: '243 97 80 80',
      hair_afro: '243 80 80 80',
      hair_mohawk: '243 57 80 80',
      holster_revolver_hip: '213 245 130 130',
      holster_revolver_thigh: '213 285 130 130',
      mask_horse: '233 92 100 100',
      mask_robin: '261 120 40 40',
      necklace_dogtags: '256 167 45 45',
      necklace_stethoscope: '237 154 70 70',
      'necklace_squared-circle': '237 166 77 77',
      pet_canine: '82 403 150 150',
      pet_chicken: '45 403 150 150',
      pet_doge: '341 349 200 200',
      pet_feline: '381 439 128 128',
      pet_fox: '42 393 150 150',
      pet_gerbil: '125 475 64 64',
      pet_parrot: '275 126 80 80',
      pet_raven: '50 439 128 128',
      pet_rat: '300 439 128 128',
      pet_siamese_cat: '42 393 150 150',
      pet_vulture: '281 349 180 180',
      scar_horizontal_neck: '265 139 32 32',
      scar_horizontal_nose: '264 115 32 32',
      scar_vertical_heart: '249 164 64 64',
      scar_vertical_left: '264 110 32 32',
      scar_vertical_right: '264 110 32 32',
      scarf_drape: '185 140 190 190',
      skirt_draped: '179 249 181 181',
      suit_asymetric: '175 140 200 200',
      suit_bands: '161 162 234 234',
      suit_onepiece: '175 140 200 200',
      tatoo_archeopteryx_left: '282 173 64 64',
      tatoo_aum_chest: '248 165 64 64',
      tatoo_aum_left: '298 157 64 64',
      tatoo_aum_right: '198 154 64 64',
      tatoo_chaos_chest: '248 175 48 48',
      tatoo_chaos_left: '298 170 48 48',
      tatoo_chaos_right: '210 164 48 48',
      tatoo_tribal_face: '258 105 50 50',
      top_tank: '215 165 120 120',
      top_tube_v: '223 170 120 120',
      underwear_boxers: '224 258 120 120'
    }
    var sectionDict = {
      age: '261 121 40 40',
      armband: '313 206 38 38',
      belt: '175 185 190 190',
      blouse: '173 159 205 205',
      body: '65 130 430 430',
      body_head: '249 107 64 64',
      bra: '220 160 100 100',
      bracelet: '316 252 48 48',
      button: '281 198 23 23',
      coat: '125 79 280 280',
      collar: '255 160 48 48',
      dress: '160 150 230 230',
      earpiece: '280 137 25 25',
      earings: '257 141 20 20',
      ears: '254 130 20 20',
      emotion: '261 125 42 42',
      eyepatch: '261 121 40 40',
      facialhair: '261 124 40 40',
      glasses: '263 121 40 40',
      gloves: '206 308 40 40',
      hat: '241 82 80 80',
      hair: '243 92 80 80',
      headband: '241 102 80 80',
      holster: '215 150 130 130',
      horns: '257 99 50 50',
      iris: '274.125 137.55 3.2 3.2',
      jacket: '170 130 220 220',
      kneepads: '237 369 77 77',
      leggings: '136 305 260 260',
      makeup: '267.5 123 30 30',
      mask: '243 105 80 80',
      nails: '200 327 25 25',
      necklace: '255 160 48 48',
      nose: '265 127 32 32',
      pants: '130 244 290 290',
      pupils: '274.125 137.55 3.2 3.2',
      scarf: '185 120 190 190',
      shirt: '190 140 190 190',
      shoes: '225 442 120 120',
      shorts: '215 245 120 120',
      skirt: '190 220 180 180',
      shoulderpads: '207 100 150 150',
      smoke: '255 144 32 32',
      socks: '225 442 120 120',
      suit: '80 130 400 400',
      tie: '241 140 80 80',
      top: '225 160 100 100',
      underwear: '232 258 90 90',
      veil: '207 97 150 150',
      vest: '185 135 190 190',
      wings: '110 -30 350 350'
    }
  }
  if (idDict[id] && d != '') {
    return idDict[id]
  } else if (sectionDict[t] && d != '') {
    return sectionDict[t]
  } else {
    return '0 0 560 560'
  }
}
function isLandscape () {
  var w = window
  var d = document
  var e = d.documentElement
  var g = d.getElementsByTagName('body')[0]
  var x = w.innerWidth || e.clientWidth || g.clientWidth
  var y = w.innerHeight || e.clientHeight || g.clientHeight
  var isLandscape
  if (x > y) { isLandscape = true } else { isLandscape = false }
  return isLandscape
}

function zoomIn () {
  var sex = c.choices.sex
  var newViewBox
  shape = document.getElementById(('svg1'))
  if (sex == 'm') {
    newViewBox = '140 73 290 290'
  } else {
    newViewBox = '225 86 110 110'
  }
  animateZoom(newViewBox)
}

function zoomOut () {
  var sex = c.choices.sex
  shape = document.getElementById(('svg1'))
  animateZoom(newViewBox)
}

function zoomFace () {
  var landscape = isLandscape() // TODO change newViewBox is in landscape mode.
  var sex = c.choices.sex
  var newViewBox
  shape = document.getElementById(('svg1'))
  // TODO Consider size of window where rezooming.
  if (sex == 'm') {
    newViewBox = '242.6 99 80 80'
  } else {
    newViewBox = '243 109 80 80'
  }
  animateZoom(newViewBox)
}

function zoomTwoFaces () {
  var landscape = isLandscape() // TODO change newViewBox is in landscape mode.
  var sex = c.choices.sex
  var newViewBox
  shape = document.getElementById(('svg1'))
  // TODO Consider size of window where rezooming.
  if (sex == 'm') {
    newViewBox = '242.6 90 80 80'
  } else {
    newViewBox = '243 100 80 80'
  }
  // consolelog('sex', sex)
  animateZoom(newViewBox)
}

function zoomTorso () {
  var sex = c.choices.sex
  var newViewBox
  shape = document.getElementById(('svg1'))// var =  "svg1" or "lg_face", etc.
  if (sex == 'm') {
    newViewBox = '204 85 150 150'
  } else {
    newViewBox = '207 97 150 150'
  }
  animateZoom(newViewBox)
}

function zoomBody () {
  var sex = c.choices.sex
  var newViewBox
  shape = document.getElementById(('svg1'))
  if (sex == 'm') {
    newViewBox = '136 73 290 290'
  } else {
    newViewBox = '140 84 290 290'
  }
  animateZoom(newViewBox)
}

function zoomFull () {
  var sex = c.choices.sex
  var newViewBox
  shape = document.getElementById(('svg1'))
  newViewBox = '10 50 540 540'
  animateZoom(newViewBox)
}

function viewBoxZoom (ev) {
  var zoomLevel = ev.target.value
  if (zoomLevel == 3) {
    zoomFace()
  } else if (zoomLevel == 2) {
    zoomTorso()
  } else if (zoomLevel == 1) {
    zoomBody()
  } else if (zoomLevel == 0) {
    zoomFull()
  }
}

function sectionZoom (sectionLabel) {
  var zoomInput = document.querySelector('#zoomLevel')
  if (sectionLabel === 'Head') { zoomInput.value = 3; zoomFace() }
  if (sectionLabel === 'Accessories') { zoomInput.value = 3; zoomFace() }
  if (sectionLabel === 'Torso') { zoomInput.value = 2; zoomTorso() }
  if (sectionLabel === 'Body') { zoomInput.value = 1; zoomBody() }
  if (sectionLabel === 'Legs') { zoomInput.value = 0; zoomFull() }
  if (sectionLabel === 'Feet') { zoomInput.value = 0; zoomFull() }
}

function animateZoom (newViewBox) {
  var characterSVG = document.querySelector('#svg1')
  var currentViewBox = characterSVG.viewBox.baseVal
  var globalID
  var animationDuration = 350 // Duration of animation in milliseconds;
  var startTime = Date.now()
  var currentTime
  var timeElapsed
  var xOld = currentViewBox.x
  var yOld = currentViewBox.y
  var widthOld = currentViewBox.width
  var heightOld = currentViewBox.height
  var xDiff
  var yDiff
  var widthDiff
  var heightDiff
  var multiplyer
  var xNew
  var yNew
  var widthNew
  var heightNew
  var animateViewBox

  if (newViewBox != '10 50 540 540' && !characterSVG.classList.contains('zoomed')) {
    characterSVG.classList.add('zoomed')
  } else if (newViewBox === '10 50 540 540' && characterSVG.classList.contains('zoomed')) {
    characterSVG.classList.remove('zoomed')
  }

  newViewBox = newViewBox.split(' ')

  xDiff = newViewBox[0] - currentViewBox.x
  yDiff = newViewBox[1] - currentViewBox.y
  widthDiff = newViewBox[2] - currentViewBox.width
  heightDiff = newViewBox[3] - currentViewBox.height

  function repeatOften () {
    currentTime = Date.now()
    timeElapsed = currentTime - startTime
    multiplyer = timeElapsed / animationDuration

    if (multiplyer > 1) { multiplyer = 1 };
    xNew = xOld + (xDiff * multiplyer)
    yNew = yOld + (yDiff * multiplyer)
    widthNew = widthOld + (widthDiff * multiplyer)
    heightNew = heightOld + (heightDiff * multiplyer)
    animateViewBox = xNew + ' ' + yNew + ' ' + widthNew + ' ' + heightNew

    characterSVG.setAttribute('viewBox', animateViewBox)

    if (timeElapsed >= animationDuration) {
      cancelAnimationFrame(globalID)
      return
    }
    globalID = requestAnimationFrame(repeatOften)
  }
  globalID = requestAnimationFrame(repeatOften)
}
