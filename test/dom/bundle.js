(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const css_1 = require("./css");
const node_1 = require("./node");
const util_1 = require("./util");
/**
 * Align element to target element by specified position.
 * Note that this mathod will always cause reflow.
 * @param el The element to align, it's position should be fixed or absolute.
 * @param target The target element to align to.
 * @param position The position that aligning according to, `[Y of el][X of el]-[Y of target][X of target]` or `[Touch][Align]` or `[Touch]`.
 * @param options Additional options.
 */
function align(el, target, position, options = {}) {
    new Aligner(el, target, position, options).align();
}
exports.align = align;
class Aligner {
    constructor(el, target, position, options = {}) {
        this.x = 0;
        this.y = 0;
        this.el = el;
        this.target = target;
        this.trangle = options.trangle || null;
        this.position = this.parseAlignPosition(position);
        this.canShrinkInY = !!options.canShrinkInY;
        this.direction = this.getDirection();
        this.margin = this.parseMargin(options.margin || 0);
        this.targetRect = this.getExtendedRectFromMargin();
        this.w = this.el.offsetWidth;
        if (this.canShrinkInY) {
            this.h = this.getNaturalHeight();
        }
        else {
            this.h = this.el.offsetHeight;
        }
    }
    align() {
        if (util_1.getClosestFixedElement(this.target)) {
            css_1.setStyle(this.el, 'position', 'fixed');
        }
        let anchor1 = this.getFixedAnchor(this.w, this.h, this.position[0]);
        let anchor2 = this.getAbsoluteAnchor(this.targetRect, this.position[1]);
        this.y = anchor2[1] - anchor1[1];
        let overflowYSet = this.alignVertical();
        //if scrollbar appeared, width of el may change
        if (overflowYSet) {
            this.w = this.el.offsetWidth;
            anchor1 = this.getFixedAnchor(this.w, this.h, this.position[0]);
        }
        this.x = anchor2[0] - anchor1[0];
        this.alignHerizontal();
        //handle trangle position
        if (this.trangle) {
            this.alignTrangle();
        }
        //if is not fixed, minus coordinates relative to offsetParent
        if (getComputedStyle(this.el).position !== 'fixed' && this.target !== document.body && this.target !== document.documentElement) {
            var offsetParent = this.el.offsetParent;
            if (offsetParent) {
                var parentRect = offsetParent.getBoundingClientRect();
                this.x -= parentRect.left + css_1.getNumeric(offsetParent, 'borderLeftWidth');
                this.y -= parentRect.top + css_1.getNumeric(offsetParent, 'borderTopWidth');
            }
        }
        css_1.setStyle(this.el, {
            left: Math.round(this.x),
            top: Math.round(this.y),
        });
    }
    /**
     * Full type is `[tbc][lrc]-[tbc][lrc]`, means `[Y of el][X of el]-[Y of target][X of target]`.
     * Shorter type should be `[Touch][Align]` or `[Touch]`.
     * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align el to the top-center of target.
     * E.g.: `tl` is short for `bl-tl`, which means align el to the top-left of target.
     * E.g.: `lt` is short for `tr-tl`, which means align el to the left-top of target.
     */
    parseAlignPosition(position) {
        const ALIGN_POS_OPPOSITE = {
            t: 'b',
            b: 't',
            c: 'c',
            l: 'r',
            r: 'l',
        };
        if (!/^(?:[tbc][lrc]-[tbc][lrc]|[tbclr]-[tbclr]|[tbc][lrc]|[tbclr])/.test(position)) {
            throw `"${position}" is not a valid position`;
        }
        if (position.length === 1) {
            //t -> bc-tc
            if ('tb'.includes(position)) {
                position = ALIGN_POS_OPPOSITE[position] + 'c-' + position + 'c';
            }
            //l -> cr-cl
            //c -> cc-cc
            else {
                position = 'c' + ALIGN_POS_OPPOSITE[position] + '-c' + position;
            }
        }
        else if (position.length === 2) {
            //tl -> bl-tl
            if ('tb'.includes(position[0])) {
                position = ALIGN_POS_OPPOSITE[position[0]] + position[1] + '-' + position;
            }
            //lt -> tr-tl
            else {
                position = position[1] + ALIGN_POS_OPPOSITE[position[0]] + '-' + position[1] + position[0];
            }
        }
        let posArray = position.split('-');
        return [this.completeAlignPosition(posArray[0]), this.completeAlignPosition(posArray[1])];
    }
    completeAlignPosition(pos) {
        if (pos.length === 1) {
            pos = 'tb'.includes(pos) ? pos + 'c' : 'c' + pos;
        }
        return pos;
    }
    /** top [right] [bottom] [left] -> [t, r, b, l]. */
    parseMargin(margin) {
        if (typeof margin === 'number') {
            margin = [margin];
        }
        margin[0] = margin[0] || 0;
        margin[1] = margin[1] !== undefined ? margin[1] || 0 : margin[0];
        margin[2] = margin[2] !== undefined ? margin[2] || 0 : margin[0];
        margin[3] = margin[3] !== undefined ? margin[3] || 0 : margin[1];
        return margin;
    }
    getDirection() {
        return {
            top: this.position[0].includes('b') && this.position[1].includes('t'),
            right: this.position[0].includes('l') && this.position[1].includes('r'),
            bottom: this.position[0].includes('t') && this.position[1].includes('b'),
            left: this.position[0].includes('r') && this.position[1].includes('l'),
        };
    }
    getExtendedRectFromMargin() {
        let rect = node_1.getRect(this.target);
        if (this.trangle) {
            if (this.direction.top || this.direction.bottom) {
                this.margin[0] += this.trangle.offsetHeight;
                this.margin[2] += this.trangle.offsetHeight;
            }
            if (this.direction.left || this.direction.right) {
                this.margin[1] += this.trangle.offsetWidth;
                this.margin[3] += this.trangle.offsetWidth;
            }
        }
        if (this.direction.top || this.direction.bottom) {
            rect.top -= this.margin[0];
            rect.height += this.margin[0] + this.margin[2];
            rect.bottom = rect.top + rect.height;
        }
        if (this.direction.left || this.direction.right) {
            rect.left -= this.margin[3];
            rect.width += this.margin[1] + this.margin[3];
            rect.right = rect.left + rect.width;
        }
        return rect;
    }
    /**
     * When el can be scrolled, if we just expend it to test its natural height, it's scrolled position will lost.
     * So we get `scrollHeight - clientHeight` as a diff and add it to it's current height as it's natural height.
     * May not el but child is scrolled.
     */
    getNaturalHeight() {
        let h = this.el.offsetHeight;
        let diffHeight = this.el.scrollHeight - this.el.clientHeight;
        if (diffHeight === 0) {
            diffHeight = Math.max(...[...this.el.children].map(child => child.scrollHeight - child.clientHeight));
        }
        if (diffHeight > 0) {
            h = h + diffHeight;
        }
        else {
            css_1.setStyle(this.el, 'height', '');
            h = this.el.offsetHeight;
        }
        return h;
    }
    /** get fixed anchor position in viewport */
    getFixedAnchor(w, h, anchor) {
        let x = anchor.includes('l') ? 0 : anchor.includes('r') ? w : w / 2;
        let y = anchor.includes('t') ? 0 : anchor.includes('b') ? h : h / 2;
        return [x, y];
    }
    //get absolute anchor position in scrolling page
    getAbsoluteAnchor(rect, anchor) {
        let x = anchor.includes('l') ? 0 : anchor.includes('r') ? rect.width : rect.width / 2;
        let y = anchor.includes('t') ? 0 : anchor.includes('b') ? rect.height : rect.height / 2;
        x += rect.left;
        y += rect.top;
        return [x, y];
    }
    alignVertical() {
        let dh = document.documentElement.clientHeight;
        let spaceTop = this.targetRect.top;
        let spaceBottom = dh - this.targetRect.bottom;
        let overflowYSet = false;
        let y = this.y;
        if (this.direction.top && y < 0 && spaceTop < spaceBottom) {
            y = this.targetRect.bottom;
            this.direction.top = false;
            this.direction.bottom = true;
        }
        else if (y + this.h > dh && spaceTop > spaceBottom) {
            y = this.targetRect.top - this.h;
            this.direction.top = true;
            this.direction.bottom = false;
        }
        if (y < 0) {
            y = 0;
            if (this.canShrinkInY) {
                css_1.setStyle(this.el, 'height', spaceTop);
                overflowYSet = true;
            }
        }
        else if (y + this.h > dh) {
            if (this.canShrinkInY) {
                css_1.setStyle(this.el, 'height', spaceBottom);
                overflowYSet = true;
            }
        }
        this.y = y;
        return overflowYSet;
    }
    alignHerizontal() {
        let dw = document.documentElement.clientWidth;
        let spaceLeft = this.targetRect.left;
        let spaceRight = dw - this.targetRect.right;
        let x = this.x;
        if (this.direction.left && x < 0 && spaceLeft < spaceRight) {
            x = this.targetRect.right;
            this.direction.left = false;
            this.direction.right = true;
        }
        else if (this.direction.right && x > dw - this.w && spaceLeft > spaceRight) {
            x = this.targetRect.left - this.w;
            this.direction.left = true;
            this.direction.right = false;
        }
        if (x < 0) {
            x = 0;
        }
        else if (x + this.w > dw) {
            x = dw - this.w;
        }
        this.x = x;
    }
    alignTrangle() {
        let swapX = false;
        let swapY = false;
        let trangle = this.trangle;
        if (this.direction.top || this.direction.bottom) {
            let tx;
            if (this.w >= this.targetRect.width) {
                tx = this.targetRect.left + this.targetRect.width / 2 - this.x - trangle.offsetWidth / 2;
            }
            else {
                tx = this.w / 2 - trangle.offsetWidth / 2;
            }
            css_1.setStyle(trangle, { left: tx });
            let tTop = css_1.getNumeric(trangle, 'top');
            let tBottom = css_1.getNumeric(trangle, 'bottom');
            if (tTop < 0 && this.direction.top) {
                swapY = true;
                css_1.setStyle(trangle, { top: 'auto', bottom: tTop });
            }
            if (tBottom < 0 && this.direction.bottom) {
                swapY = true;
                css_1.setStyle(trangle, { top: tBottom, bottom: 'auto' });
            }
        }
        if (this.direction.left || this.direction.right) {
            let ty;
            if (this.h >= this.targetRect.height) {
                ty = this.targetRect.top + this.targetRect.height / 2 - this.y - trangle.offsetHeight / 2;
            }
            else {
                ty = this.h / 2 - trangle.offsetHeight / 2;
            }
            css_1.setStyle(trangle, { top: ty });
            let tLeft = css_1.getNumeric(trangle, 'left');
            let tRight = css_1.getNumeric(trangle, 'right');
            if (tLeft < 0 && this.direction.left) {
                swapX = true;
                css_1.setStyle(trangle, { left: 'auto', right: tLeft });
            }
            if (tRight < 0 && this.direction.right) {
                swapX = true;
                css_1.setStyle(trangle, { left: tRight, right: 'auto' });
            }
        }
        if (swapX || swapY) {
            let transform = '';
            if (swapX) {
                transform += 'rotateY(180deg)';
            }
            if (swapY) {
                transform += swapX ? ' ' : '';
                transform += 'rotateX(180deg)';
            }
            css_1.setStyle(trangle, 'transform', transform);
        }
        else {
            css_1.setStyle(trangle, 'transform', '');
        }
    }
}
exports.Aligner = Aligner;
/**
 * Align element to a mouse event.
 * @param el A fixed position element to align.
 * @param event A mouse event to align to.
 * @param offset `[x, y]` offset to adjust align position.
 */
function alignToEvent(el, event, offset = [0, 0]) {
    let isFixed = css_1.getStyle(el, 'position') === 'fixed';
    if (!isFixed) {
        throw new Error('Element must be "fixed" position when using "alignByEvent"');
    }
    let dw = document.documentElement.clientWidth;
    let dh = document.documentElement.clientHeight;
    let w = el.offsetWidth;
    let h = el.offsetHeight;
    let ex = event.clientX;
    let ey = event.clientY;
    let x = ex + offset[0];
    let y = ey + offset[1];
    if (x + w > dw) {
        x = ex - w;
    }
    if (y + h > dh) {
        y = ey - h;
    }
    css_1.setStyle(el, {
        left: Math.round(x),
        top: Math.round(y),
    });
}
exports.alignToEvent = alignToEvent;
},{"./css":3,"./node":8,"./util":13}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const css_1 = require("./css");
const util_1 = require("./util");
const DEFAULT_ANIMATION_DURATION = 200;
const DEFAULT_ANIMATION_EASING = 'ease-out';
const animationElementMap = new WeakMap();
const CUBIC_BEZIER_EASINGS = {
    //BASE
    'ease': [0.250, 0.100, 0.250, 1.000],
    'ease-in': [0.420, 0.000, 1.000, 1.000],
    'ease-out': [0.000, 0.000, 0.580, 1.000],
    'ease-in-out': [0.420, 0.000, 0.580, 1.000],
    //EASE IN
    'ease-in-quad': [0.550, 0.085, 0.680, 0.530],
    'ease-in-cubic': [0.550, 0.055, 0.675, 0.190],
    'ease-in-quart': [0.895, 0.030, 0.685, 0.220],
    'ease-in-quint': [0.755, 0.050, 0.855, 0.060],
    'ease-in-sine': [0.470, 0.000, 0.745, 0.715],
    'ease-in-expo': [0.950, 0.050, 0.795, 0.035],
    'ease-in-circ': [0.600, 0.040, 0.980, 0.335],
    'ease-in-back': [0.600, -0.280, 0.735, 0.045],
    //EASE OUT
    'ease-out-quad': [0.250, 0.460, 0.450, 0.940],
    'ease-out-cubic': [0.215, 0.610, 0.355, 1.000],
    'ease-out-quart': [0.165, 0.840, 0.440, 1.000],
    'ease-out-quint': [0.230, 1.000, 0.320, 1.000],
    'ease-out-sine': [0.390, 0.575, 0.565, 1.000],
    'ease-out-expo': [0.190, 1.000, 0.220, 1.000],
    'ease-out-circ': [0.075, 0.820, 0.165, 1.000],
    'ease-out-back': [0.175, 0.885, 0.320, 1.275],
    //EASE IN OUT
    'ease-in-out-quad': [0.455, 0.030, 0.515, 0.955],
    'ease-in-out-cubic': [0.645, 0.045, 0.355, 1.000],
    'ease-in-out-quart': [0.770, 0.000, 0.175, 1.000],
    'ease-in-out-quint': [0.860, 0.000, 0.070, 1.000],
    'ease-in-out-sine': [0.445, 0.050, 0.550, 0.950],
    'ease-in-out-expo': [1.000, 0.000, 0.000, 1.000],
    'ease-in-out-circ': [0.785, 0.135, 0.150, 0.860],
    'ease-in-out-back': [0.680, -0.550, 0.265, 1.550],
};
const easingFns = {
    linear: function (x) {
        return x;
    }
};
function getEasingFunction(name) {
    if (name === 'linear') {
        return easingFns[name];
    }
    else {
        return easingFns[name] = getCubicBezierEasingFunction(name);
    }
}
exports.getEasingFunction = getEasingFunction;
/**
F(t)  = (1-t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2(1-t)^2 * P2 + t^3 * P3, t in [0, 1]
Cx(t) = 3t(1-t)^2 * x1 + 3t^2(1-t) * x2 + t^3
        = (3x1 - 3x2 + 1) * t^3 + (-6x1 + 3x2) * t^2 + 3x1 * t

Cx(t) = x
        => (3x1 - 3x2 + 1) * t^3 + (-6x1 + 3x2) * t^2 + 3x1 * t = x

Cy(t) = 3t(1-t)^2 * y1 + 3t^2(1-t) * y2 + t^3 = y

For any x between [0, 1], got t from Cx(t), then got y from Cy(t).
*/
function getCubicBezierEasingFunction(name) {
    let [x1, y1, x2, y2] = CUBIC_BEZIER_EASINGS[name];
    let a = 3 * x1 - 3 * x2 + 1;
    let b = -6 * x1 + 3 * x2;
    let c = 3 * x1;
    let ay = 3 * y1 - 3 * y2 + 1;
    let by = -6 * y1 + 3 * y2;
    let cy = 3 * y1;
    return function (x) {
        if (x === 0) {
            return 0;
        }
        else if (x === 1) {
            return 1;
        }
        let d = -x;
        let t1 = 0;
        let t2 = 1;
        let t = (t1 + t2) / 2;
        while (t2 - t1 > 0.0001) {
            let v = ((a * t + b) * t + c) * t + d;
            if (v < 0) {
                t1 = t;
            }
            else {
                t2 = t;
            }
            t = (t1 + t2) / 2;
        }
        return ((ay * t + by) * t + cy) * t;
    };
}
function startIntervalAnimation(duration = DEFAULT_ANIMATION_DURATION, easing = DEFAULT_ANIMATION_EASING, onInterval, onEnd) {
    let startTimestamp = performance.now();
    let easingFn = getEasingFunction(easing);
    let frameId = 0;
    let runNextFrame = () => {
        frameId = requestAnimationFrame((timestamp) => {
            let timeDiff = timestamp - startTimestamp;
            let x = timeDiff / duration;
            if (x >= 1) {
                frameId = 0;
                onInterval(1);
                if (onEnd) {
                    onEnd(true);
                }
            }
            else {
                let y = easingFn(x);
                onInterval(y);
                runNextFrame();
            }
        });
    };
    runNextFrame();
    return () => {
        if (frameId) {
            cancelAnimationFrame(frameId);
            if (onEnd) {
                onEnd(false);
            }
        }
    };
}
/**
 * Animate numberic style property or `scrollLeft` and `scrollTop` using interval.
 * @param el The element to animate.
 * @param property The style property or `scrollLeft` and `scrollTop`.
 * @param startValue The start value.
 * @param endValue  The end value.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
function animateProperty(el, property, startValue, endValue, duration, easing = DEFAULT_ANIMATION_EASING) {
    let stop;
    let promise = new Promise((resolve) => {
        stop = startIntervalAnimation(duration, easing, (y) => {
            let value = startValue + (endValue - startValue) * y;
            if (property === 'scrollTop' || property === 'scrollLeft') {
                el[property] = value;
            }
            else {
                css_1.setStyle(el, property, value);
            }
        }, resolve);
    });
    return {
        promise,
        stop,
    };
}
exports.animateProperty = animateProperty;
/**
 * Animate numberic style property or `scrollLeft` and `scrollTop` using interval.
 * @param el The element to animate.
 * @param property The style property or `scrollLeft` and `scrollTop`.
 * @param startValue The start value.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
function animatePropertyFrom(el, property, startValue, duration, easing = DEFAULT_ANIMATION_EASING) {
    let endValue;
    if (property === 'scrollTop' || property === 'scrollLeft') {
        endValue = el[property];
    }
    else {
        endValue = css_1.getNumeric(el, property);
    }
    return animateProperty(el, property, startValue, endValue, duration, easing);
}
exports.animatePropertyFrom = animatePropertyFrom;
/**
 * Animate numberic style property or `scrollLeft` and `scrollTop` using interval.
 * @param el The element to animate.
 * @param property The style property or `scrollLeft` and `scrollTop`.
 * @param endValue The end value.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
function animatePropertyTo(el, property, endValue, duration, easing = DEFAULT_ANIMATION_EASING) {
    let startValue;
    if (property === 'scrollTop' || property === 'scrollLeft') {
        startValue = el[property];
    }
    else {
        startValue = css_1.getNumeric(el, property);
    }
    return animateProperty(el, property, startValue, endValue, duration, easing);
}
exports.animatePropertyTo = animatePropertyTo;
/**
 * Animate by a function using interval.
 * @param fn The function which will got a current state number value as argument.
 * @param startValue The start value.
 * @param endValue  The end value.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
function animateByFunction(fn, startValue, endValue, duration, easing = DEFAULT_ANIMATION_EASING) {
    let stop;
    let promise = new Promise((resolve) => {
        stop = startIntervalAnimation(duration, easing, (y) => {
            fn(startValue + (endValue - startValue) * y);
        }, resolve);
    });
    return {
        promise,
        stop,
    };
}
exports.animateByFunction = animateByFunction;
/**
 * Execute standard web animation on element. After animation end, the state of element will go back to the start state.
 * @param el The element to execute web animation.
 * @param startFrame The start frame.
 * @param endFrame The end frame.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
function animate(el, startFrame, endFrame, duration = DEFAULT_ANIMATION_DURATION, easing = DEFAULT_ANIMATION_EASING) {
    if (!el.animate) {
        return Promise.resolve();
    }
    stopAnimation(el);
    startFrame = util_1.normativeStyleObject(startFrame);
    endFrame = util_1.normativeStyleObject(endFrame);
    let cubicEasing = getAnimationEasing(easing);
    let animation = el.animate([startFrame, endFrame], {
        easing: cubicEasing,
        duration,
    });
    animationElementMap.set(el, animation);
    return new Promise((resolve) => {
        animation.addEventListener('finish', () => {
            animationElementMap.delete(el);
            resolve(true);
        }, false);
        animation.addEventListener('cancel', () => {
            animationElementMap.delete(el);
            resolve(false);
        }, false);
    });
}
exports.animate = animate;
function getAnimationEasing(easing) {
    return CUBIC_BEZIER_EASINGS.hasOwnProperty(easing)
        ? 'cubic-bezier(' + CUBIC_BEZIER_EASINGS[easing].join(', ') + ')'
        : easing;
}
/** The default style of element, which is not 0 */
const DEFAULT_STYLE = {
    transform: 'none'
};
/**
 * Execute standard web animation on element.
 * @param el The element to execute web animation.
 * @param startFrame The start frame.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
function animateFrom(el, startFrame, duration = DEFAULT_ANIMATION_DURATION, easing = DEFAULT_ANIMATION_EASING) {
    let endFrame = {};
    let style = getComputedStyle(el);
    for (let name in startFrame) {
        endFrame[name] = style[name] || DEFAULT_STYLE[name] || '0';
    }
    return animate(el, startFrame, endFrame, duration, easing);
}
exports.animateFrom = animateFrom;
/**
 * Execute standard web animation on element. After animation end, the state of element will be the specified end state.
 * @param el The element to execute web animation.
 * @param endFrame The end frame.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
async function animateTo(el, endFrame, duration = DEFAULT_ANIMATION_DURATION, easing = DEFAULT_ANIMATION_EASING) {
    let startFrame = {};
    let style = getComputedStyle(el);
    for (let name in endFrame) {
        startFrame[name] = style[name] || DEFAULT_STYLE[name] || '0';
    }
    await animate(el, startFrame, endFrame, duration, easing);
    css_1.setStyle(el, endFrame);
}
exports.animateTo = animateTo;
/**
 * Stop animation on element.
 * @param el The element to stop animation on.
 */
function stopAnimation(el) {
    let animation = animationElementMap.get(el);
    if (animation) {
        animation.cancel();
        animationElementMap.delete(el);
    }
}
exports.stopAnimation = stopAnimation;
},{"./css":3,"./util":13}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
/**
 * Get computed style value as number from element.
 * @param el The element to get numeric value.
 * @param property The property name in camer case, `backgroundColor` as example.
 */
function getNumeric(el, property) {
    let value = getStyle(el, property);
    return parseFloat(value) || 0;
}
exports.getNumeric = getNumeric;
/**
 * Get computed style value from element.
 * @param el The element to get style value.
 * @param property The property name in camer case, `backgroundColor` as example.
 */
function getStyle(el, property) {
    return getComputedStyle(el)[property];
}
exports.getStyle = getStyle;
function setStyle(el, property, value) {
    if (typeof property === 'object') {
        for (let prop of Object.keys(property)) {
            setStyle(el, prop, property[prop]);
        }
    }
    else {
        el.style.setProperty(property, util_1.normativeStyleValue(property, value));
    }
}
exports.setStyle = setStyle;
},{"./util":13}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const css_1 = require("./css");
/**
 * Set element draggable that it can be dragged by mouse.
 * @param el The element which will handle mouse event.
 * @param mover The element that moves with the mouse.
 */
function setDraggable(el, mover = el) {
    let relX;
    let relY;
    let minX;
    let minY;
    function onMouseDown(e) {
        let left = css_1.getNumeric(mover, 'left') || 0;
        let top = css_1.getNumeric(mover, 'top') || 0;
        let w = mover.offsetWidth;
        let h = mover.offsetHeight;
        let dw = document.documentElement.clientWidth;
        let dh = document.documentElement.clientHeight;
        relX = left - e.clientX;
        relY = top - e.clientY;
        minX = dw - w;
        minY = dh - h;
        css_1.setStyle(mover, 'willChange', 'top left');
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
    }
    function onMouseMove(e) {
        e.preventDefault();
        let x = relX + e.clientX;
        let y = relY + e.clientY;
        x = Math.min(Math.max(x, 0), minX);
        y = Math.min(Math.max(y, 0), minY);
        css_1.setStyle(mover, 'left', x);
        css_1.setStyle(mover, 'top', y);
    }
    function onMouseUp() {
        css_1.setStyle(mover, 'willChange', '');
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);
    }
    el.addEventListener('mousedown', onMouseDown, false);
    return function cancelMovable() {
        el.removeEventListener('mousedown', onMouseDown, false);
    };
}
exports.setDraggable = setDraggable;
},{"./css":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Download url as a file.
 * @param url The URL to download.
 * @param fileName The file name.
 */
function downloadURL(url, fileName) {
    let a = document.createElement('a');
    a.hidden = true;
    a.href = url;
    if (fileName) {
        a.download = fileName;
    }
    document.body.appendChild(a);
    a.click();
    a.remove();
}
exports.downloadURL = downloadURL;
/**
 * Download string as a file.
 * @param fileName The file name.
 * @param text The text to download.
 * @param mime The MIME type of file.
 */
function downloadText(fileName, text, type = 'text/plain') {
    let blob = new Blob([text], { type });
    let fs = new FileReader;
    fs.onload = () => {
        fs.onload = null;
        let a = document.createElement('a');
        a.download = fileName;
        a.href = fs.result;
        document.body.append(a);
        a.click();
        a.remove();
    };
    fs.readAsDataURL(blob);
}
exports.downloadText = downloadText;
/**
 * Select single files by `<input type="file">` match MIME type.
 * @param The MIME type of files.
 */
function selectFile(mime) {
    return selectFileOrFolder(mime, false, false);
}
exports.selectFile = selectFile;
/**
 * Select multiple files by `<input type="file">` match MIME type.
 * @param The MIME type of files.
 */
function selectMultipleFile(mime) {
    return selectFileOrFolder(mime, false, true);
}
exports.selectMultipleFile = selectMultipleFile;
/**
 * Select single folder by `<input type="file">` match MIME type.
 */
function selectFolder() {
    return selectFileOrFolder("*", true, false);
}
exports.selectFolder = selectFolder;
/**
 * Select multiple folder by `<input type="file">` match MIME type.
 */
function selectMultipleFolder() {
    return selectFileOrFolder("*", true, true);
}
exports.selectMultipleFolder = selectMultipleFolder;
function selectFileOrFolder(mime, isFolder, isMultiple) {
    return new Promise((resolve) => {
        let input = document.createElement('input');
        input.type = 'file';
        input.hidden = true;
        input.accept = mime;
        input.multiple = isMultiple;
        if (isFolder) {
            input.setAttribute('directory', '');
            input.setAttribute('webkitdirectory', '');
        }
        input.onchange = () => {
            if (input.files) {
                resolve(isMultiple ? [...input.files] : input.files[0] || null);
            }
            else {
                resolve(null);
            }
        };
        function onDomFocus() {
            document.removeEventListener('focus', onDomFocus, false);
            input.onchange = null;
            input.remove();
        }
        document.addEventListener('focus', onDomFocus, false);
        document.body.appendChild(input);
        input.click();
    });
}
/**
 * Get files from transfoer in drop event. Only supported by Chrome.
 * @param transfer The ` DataTransfer` object from drop event.
 */
async function getFilesFromTransfer(transfer) {
    let transferFiles = [...transfer.files];
    let files = [];
    if (transfer.items && typeof DataTransferItem === 'function' && (DataTransferItem.prototype.hasOwnProperty('getAsEntry') || DataTransferItem.prototype.webkitGetAsEntry)) {
        let items = [...transfer.items].filter(item => item.kind === 'file');
        try {
            for (let item of items) {
                let entry = item.hasOwnProperty('getAsEntry') ? item.getAsEntry() : item.webkitGetAsEntry();
                files.push(...await readFilesFromEntry(entry));
            }
        }
        catch (err) {
            files = transferFiles;
        }
    }
    //can only read files
    else {
        files = transferFiles;
    }
    return files;
}
exports.getFilesFromTransfer = getFilesFromTransfer;
async function readFilesFromEntry(entry) {
    let files = [];
    return new Promise(async (resolve, reject) => {
        if (!entry) {
            resolve();
        }
        else if (entry.isFile) {
            entry.file((file) => {
                file.path = file.path || entry.fullPath;
                files.push(file);
                resolve(files);
            }, reject);
        }
        else if (entry.isDirectory) {
            let reader = entry.createReader();
            try {
                while (true) {
                    let filesInFolder = await readFilesFromDirectoryReader(reader);
                    files.push(...filesInFolder);
                    if (!filesInFolder.length) {
                        break;
                    }
                }
            }
            catch (err) {
                reject(err);
            }
            resolve(files);
        }
    });
}
function readFilesFromDirectoryReader(reader) {
    return new Promise((resolve, reject) => {
        let files = [];
        //readEntries API can only read at most 100 files each time, so if reader isn't completed, still read it.
        reader.readEntries(async (entries) => {
            if (entries && entries.length) {
                try {
                    for (let entry of entries) {
                        files.push(...await readFilesFromEntry(entry));
                    }
                }
                catch (err) {
                    reject(err);
                }
                resolve(files);
            }
            else {
                resolve(files);
            }
        }, reject);
    });
}
},{}],6:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./css"));
__export(require("./node"));
__export(require("./align"));
__export(require("./scroll"));
__export(require("./animate"));
__export(require("./draggable"));
__export(require("./pan"));
__export(require("./mouse-leave"));
__export(require("./file"));
__export(require("./query"));
__export(require("./storage"));
__export(require("./watch"));
},{"./align":1,"./animate":2,"./css":3,"./draggable":4,"./file":5,"./mouse-leave":7,"./node":8,"./pan":9,"./query":10,"./scroll":11,"./storage":12,"./watch":14}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Call callback after mouse leaves all of the elements. It's very usefull to handle mouse hover event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback.
 * @param callback The callback to call after mouse leaves all the elements.
 */
function onMouseLeaveAll(elOrs, callback, ms = 200) {
    return bindMouseLeaveAll(false, elOrs, callback, ms);
}
exports.onMouseLeaveAll = onMouseLeaveAll;
/**
 * Call callback after mouse leaves all of the elements only for once, its very usefull to handle mouse event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback.
 * @param callback The callback to call after mouse leaves all the elements.
 */
function onceMouseLeaveAll(elOrs, callback, ms = 200) {
    return bindMouseLeaveAll(true, elOrs, callback, ms);
}
exports.onceMouseLeaveAll = onceMouseLeaveAll;
function bindMouseLeaveAll(isOnce, elOrs, callback, ms) {
    let els = Array.isArray(elOrs) ? elOrs : [elOrs];
    let mouseIn = false;
    let ended = false;
    let timer = null;
    function onMouseEnter() {
        mouseIn = true;
        clear();
    }
    function onMouseLeave() {
        mouseIn = false;
        clear();
        timer = setTimeout(function () {
            timer = null;
            if (!mouseIn) {
                flush();
            }
        }, ms);
    }
    function clear() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }
    function flush() {
        if (ended) {
            return;
        }
        if (isOnce) {
            cancel();
        }
        callback();
    }
    function cancel() {
        if (timer) {
            clearTimeout(timer);
        }
        for (let el of els) {
            el.removeEventListener('mouseenter', onMouseEnter, false);
            el.removeEventListener('mouseleave', onMouseLeave, false);
        }
        ended = true;
    }
    for (let el of els) {
        el.addEventListener('mouseenter', onMouseEnter, false);
        el.addEventListener('mouseleave', onMouseLeave, false);
    }
    return cancel;
}
},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const css_1 = require("./css");
/**
 * Returns the index of node in it' node silbings.
 * @param el The node.
 */
function nodeIndex(el) {
    if (el.parentNode) {
        let i = 0;
        for (let child of el.parentNode.childNodes) {
            if (child === el) {
                return i;
            }
            i++;
        }
    }
    return -1;
}
exports.nodeIndex = nodeIndex;
/**
 * Returns the index of element in it' element silbings.
 * @param el The node.
 */
function elementIndex(el) {
    if (el.parentNode) {
        let i = 0;
        for (let child of el.parentNode.children) {
            if (child === el) {
                return i;
            }
            i++;
        }
    }
    return -1;
}
exports.elementIndex = elementIndex;
/**
 * Returns inner width of element, which equals `clientWidth - paddingWidths` or `width - paddingWidths - scrollbarWidth`. Note that this may cause page reflow.
 * @param el The element to get width.
 */
function innerWidth(el) {
    let w = el.clientWidth;
    if (w) {
        return el.clientWidth - css_1.getNumeric(el, 'paddingLeft') - css_1.getNumeric(el, 'paddingRight');
    }
    else {
        return 0;
    }
}
exports.innerWidth = innerWidth;
/**
 * Returns inner height of element, which equals `clientHeight - paddingHeights` or `height - paddingHeights - scrollbarHeight`. Note that this may cause page reflow.
 * @param el The element to get height.
 */
function innerHeight(el) {
    let h = el.clientHeight;
    if (h) {
        return h - css_1.getNumeric(el, 'paddingTop') - css_1.getNumeric(el, 'paddingBottom');
    }
    else {
        return 0;
    }
}
exports.innerHeight = innerHeight;
/**
 * Returns outer width of element, which equals `offsetWidth + marginWidths`. Note that this may cause page reflow.
 * @param el The element to get width.
 */
function outerWidth(el) {
    let w = el.offsetWidth;
    if (w) {
        return w + css_1.getNumeric(el, 'marginLeft') + css_1.getNumeric(el, 'marginRight');
    }
    else {
        return 0;
    }
}
exports.outerWidth = outerWidth;
/**
 * Returns inner height of element, which equals `offsetHeight + marginHeights`. Note that this may cause page reflow.
 * @param el The element to get height.
 */
function outerHeight(el) {
    let h = el.offsetHeight;
    if (h) {
        return h + css_1.getNumeric(el, 'marginTop') + css_1.getNumeric(el, 'marginBottom');
    }
    else {
        return 0;
    }
}
exports.outerHeight = outerHeight;
/**
 * Returns an object like `getBoundingClientRect`, the didderence is it always returns the visible part for `<html>`. Note that this may cause page reflow.
 * @param el The element to get rect size.
 */
function getRect(el) {
    if (el === document.documentElement) {
        let dw = document.documentElement.clientWidth;
        let dh = document.documentElement.clientHeight;
        return {
            top: 0,
            right: dw,
            bottom: dh,
            left: 0,
            width: dw,
            height: dh,
        };
    }
    else {
        let rect = el.getBoundingClientRect();
        return {
            bottom: rect.bottom,
            height: rect.height,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            width: rect.width,
        };
    }
}
exports.getRect = getRect;
//returns if has enough intersection with viewport
//percentage supports negative value
/**
 * Check if element is visible in current viewport. Note that this may cause page reflow.
 * @param el The element to check if is in view.
 * @param percentage Specify how much percentage of el size implies in view.
 */
function isInview(el, percentage = 0.5) {
    let dw = document.documentElement.clientWidth;
    let dh = document.documentElement.clientHeight;
    let box = getRect(el);
    let xIntersect = Math.min(dw, box.right) - Math.max(0, box.left);
    let yIntersect = Math.min(dh, box.bottom) - Math.max(0, box.top);
    return xIntersect / Math.min(box.width, dw) > percentage
        && yIntersect / Math.min(box.height, dh) > percentage;
}
exports.isInview = isInview;
},{"./css":3}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const css_1 = require("./css");
/**
 * Handle pan event on mobile devices.
 * @param el The element to bind pan event.
 * @param callback The callback to call when pan event emitted, accept one argument diection to be `'l' | 'r' | 't' | 'b'`.
 */
function onPan(el, callback) {
    let startX;
    let startY;
    function onTouchStart(e) {
        css_1.setStyle(el, 'transition', 'none');
        startX = e.changedTouches[0].pageX;
        startY = e.changedTouches[0].pageY;
        document.addEventListener('touchmove', onTouchMove, false);
        document.addEventListener('touchend', onTouchEnd, false);
    }
    function onTouchMove(e) {
        let x = e.changedTouches[0].pageX;
        let y = e.changedTouches[0].pageY;
        let movedX = x - startX;
        let movedY = y - startY;
        if (Math.abs(movedX / movedY) > 1) {
            e.preventDefault();
            css_1.setStyle(el, 'transform', `translateX(${movedX}px)`);
        }
    }
    function onTouchEnd(e) {
        css_1.setStyle(el, { transition: '', transform: '' });
        document.removeEventListener('touchmove', onTouchMove, false);
        document.removeEventListener('touchend', onTouchEnd, false);
        let x = e.changedTouches[0].pageX;
        let y = e.changedTouches[0].pageY;
        let movedX = x - startX;
        let movedY = y - startY;
        if (Math.abs(movedX / movedY) > 1 && Math.abs(movedX) > 20) {
            e.preventDefault();
            if (movedX > 0) {
                callback('l');
            }
            else {
                callback('r');
            }
        }
        else if (Math.abs(movedX / movedY) < 1 && Math.abs(movedY) > 20) {
            e.preventDefault();
            if (movedY > 0) {
                callback('b');
            }
            else {
                callback('t');
            }
        }
    }
    el.addEventListener('touchstart', onTouchStart, false);
    return function cancelPan() {
        el.removeEventListener('touchstart', onTouchStart, false);
    };
}
exports.onPan = onPan;
},{"./css":3}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parse URL search part to a query parameter object.
 * @param url The url to parse query parameter.
 */
function parseQuery(url) {
    let match = url.match(/\?(.+)/);
    let pieces = match ? match[1].split('&') : [];
    let q = {};
    for (let piece of pieces) {
        let [key, value] = piece.split('=');
        if (key) {
            value = decodeURIComponent(value || '');
            q[key] = value;
        }
    }
    return q;
}
exports.parseQuery = parseQuery;
/**
 * Build URL and query parameter object to a new URL.
 * @param url The base url.
 * @param query The query parameter object.
 */
function useQuery(url, query) {
    let hasQuery = url.includes('?');
    if (typeof query === 'string') {
        return url + (hasQuery ? '&' : '?') + query;
    }
    else if (query && typeof query === 'object') {
        for (let key in query) {
            let value = encodeURIComponent(query[key]);
            url += (hasQuery ? '&' : '?') + key + '=' + value;
            hasQuery = true;
        }
    }
    return url;
}
exports.useQuery = useQuery;
},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const animate_1 = require("./animate");
/**
 * Returns if element can scroll.
 * @param el The element to check scrolling. Note that this method may cause reflow.
 */
function isContentOverflow(el) {
    return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
}
exports.isContentOverflow = isContentOverflow;
let scrollBarWidth = null;
/**
 * Get scroll bar width. after first running, the returned value will keep unchanged.
 * Note that this method will cause page reflow for the first time.
 */
function getScrollbarWidth() {
    if (scrollBarWidth !== null) {
        return scrollBarWidth;
    }
    let div = document.createElement('div');
    div.style.cssText = 'width:100px; height:100px; overflow:scroll; position:absolute; left:-100px; top:-100px;';
    document.body.append(div);
    scrollBarWidth = div.offsetWidth - div.clientWidth;
    div.remove();
    return scrollBarWidth;
}
exports.getScrollbarWidth = getScrollbarWidth;
/**
 * Find the closest scroll wrapper, which may have `overflow: auto / scroll`. Note that this method may cause reflow.
 *  */
function getClosestScrollWrapper(el) {
    while (el
        && el.scrollWidth <= el.clientWidth
        && el.scrollHeight <= el.clientHeight) {
        el = el.parentElement;
    }
    return el;
}
exports.getClosestScrollWrapper = getClosestScrollWrapper;
/**
 * Scroll scrollbars in closest scroll wrapper for minimal distance to let element enter into the viewport area. Returns if scrolled.
 * @param el The element you want to see.
 * @param gap Keep a little distance from the element's edge to the viewport's edge.
 * @param duration If specified, will run an animation when scrolling.
 * @param easing The animation esing.
 */
function scrollToView(el, gap = 0, duration = 0, easing = 'ease-out') {
    let wrapper = getClosestScrollWrapper(el);
    if (!wrapper) {
        return false;
    }
    let direction = getScrollDirection(wrapper);
    if (!direction) {
        return false;
    }
    if (direction === 'y') {
        let oldScrollY = wrapper.scrollTop;
        let newScrollY = 0;
        let offsetY = getScrollOffset(el, wrapper, direction);
        //need to scroll for pxs to top edges align
        let topOffset = offsetY - gap - oldScrollY;
        //need to scroll for pxs to bottom edges align
        let botOffset = offsetY + el.offsetHeight + gap - wrapper.clientHeight - oldScrollY;
        //needs to scroll up
        if (topOffset < 0 && botOffset < 0) {
            newScrollY = Math.max(topOffset, botOffset) + oldScrollY;
        }
        //needs to scroll down
        else if (botOffset > 0 && topOffset > 0) {
            newScrollY = Math.min(botOffset, topOffset) + oldScrollY;
        }
        if (newScrollY !== oldScrollY) {
            if (duration) {
                animate_1.animatePropertyTo(wrapper, 'scrollTop', newScrollY, duration, easing);
            }
            else {
                wrapper.scrollTop = newScrollY;
            }
            return true;
        }
    }
    if (direction === 'x') {
        let offsetX = getScrollOffset(el, wrapper, direction);
        let scrollX = wrapper.scrollLeft;
        let newScrollX = 0;
        let startOffset = offsetX - gap - scrollX;
        let endOffset = offsetX + el.offsetWidth + gap - scrollX - wrapper.clientWidth;
        if (startOffset < 0 && endOffset < 0 || el.offsetWidth > wrapper.clientWidth) {
            newScrollX = Math.max(0, offsetX - gap);
        }
        else if (endOffset > 0 && startOffset > 0) {
            newScrollX = Math.min(wrapper.scrollWidth, offsetX + el.offsetWidth + gap) - wrapper.clientWidth;
        }
        if (newScrollX !== scrollX) {
            if (duration) {
                animate_1.animatePropertyTo(wrapper, 'scrollLeft', newScrollX, duration, easing);
            }
            else {
                wrapper.scrollLeft = newScrollX;
            }
            return true;
        }
    }
    return false;
}
exports.scrollToView = scrollToView;
/**
 * Returns the scroll direction of scroll wrapper, may be `'x' | 'y' | ''`.
 * @param wrapper The element to get scroll direction.
 */
function getScrollDirection(wrapper) {
    let direction = '';
    if (wrapper.scrollHeight > wrapper.clientHeight) {
        direction = 'y';
    }
    else if (wrapper.scrollWidth > wrapper.clientWidth) {
        direction = 'x';
    }
    return direction;
}
exports.getScrollDirection = getScrollDirection;
/**
 * Get element's position in it's scroll wrapper's scroll area,
 * which also means the scroll wrapper's scrollTop when when top edges align.
 * This value is not affected by current scroll position.
 * @param el The element to test offset.
 * @param wrapper The scroll wrapper.
 * @param direction The scroll direction, `'x' | 'y'`.
 */
function getScrollOffset(el, wrapper, direction) {
    let prop = direction === 'x' ? 'offsetLeft' : 'offsetTop';
    let parent = el.offsetParent;
    let y = el[prop];
    if (!parent || parent === wrapper) { }
    else if (parent.contains(wrapper)) {
        y -= wrapper[prop];
    }
    else {
        while (parent.offsetParent && parent.offsetParent !== wrapper) {
            parent = parent.offsetParent;
            y += parent[prop];
        }
    }
    return y;
}
exports.getScrollOffset = getScrollOffset;
/**
 * Scroll scrollbars to let element in the top of the viewport area. Returns if scrolled.
 * @param el The element you want to see.
 * @param gap Keep a little distance from the element's edge to the viewport's edge.
 * @param duration If specified, will run an animation when scrolling.
 * @param easing The animation esing.
 */
function scrollToTop(el, gap = 0, duration = 0, easing = 'ease-out') {
    let wrapper = getClosestScrollWrapper(el);
    if (!wrapper) {
        return false;
    }
    let offsetY = getScrollOffset(el, wrapper, 'y');
    let oldScrollY = wrapper.scrollTop;
    let newScrollY = Math.max(0, offsetY - gap);
    if (newScrollY !== oldScrollY) {
        if (duration) {
            animate_1.animatePropertyTo(wrapper, 'scrollTop', newScrollY, duration, easing);
        }
        else {
            wrapper.scrollTop = newScrollY;
        }
        return true;
    }
    return false;
}
exports.scrollToTop = scrollToTop;
},{"./animate":2}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JSONStorage {
    constructor() {
        this.prefix = '_fdom_';
        this.expireSuffix = '_expires_';
        this.supported = null;
    }
    /**
     * Test if storage is supported. Will return false in private mode.
     */
    isSupported() {
        if (this.supported !== null) {
            return this.supported;
        }
        try {
            let key = this.prefix + 'test_supported';
            localStorage[key] = 1;
            delete localStorage[key];
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Test if has set key.
     * @param key
     */
    has(key) {
        if (!this.isSupported()) {
            return null;
        }
        key = this.prefix + key;
        return key in localStorage;
    }
    /**
     * Get json data from key.
     * @param key The string type key.
     */
    get(key) {
        if (!this.isSupported()) {
            return null;
        }
        key = this.prefix + key;
        let value = localStorage[key];
        if (value && typeof value === 'string') {
            try {
                value = JSON.parse(value);
                let expires = localStorage[key + this.expireSuffix];
                if (expires && expires < Date.now()) {
                    delete localStorage[key];
                    delete localStorage[key + this.expireSuffix];
                    return null;
                }
                else {
                    return value;
                }
            }
            catch (err) {
                return null;
            }
        }
        else {
            return null;
        }
    }
    /**
     * Cache json data in key. Returns if cached.
     * @param key The string type key.
     * @param value The json data to cache.
     * @param expires An optional expire time in second.
     */
    set(key, value, expires) {
        if (!this.isSupported()) {
            return null;
        }
        key = this.prefix + key;
        localStorage[key] = JSON.stringify(value);
        if (expires && expires > 0) {
            localStorage[key + this.expireSuffix] = Date.now() + expires * 1000;
        }
        return true;
    }
    /**
     * Delete cached json data in key. Returns if deleted.
     * @param key The string type key.
     */
    delete(key) {
        if (!this.isSupported()) {
            return null;
        }
        key = this.prefix + key;
        delete localStorage[key + this.expireSuffix];
        return delete localStorage[key];
    }
}
exports.storage = new JSONStorage();
},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function normativeStyleValue(property, value) {
    if (typeof value === 'number' && /(?:width|height|left|right|top|bottom|size)$/i.test(property)) {
        value = value + 'px';
    }
    else {
        value = value.toString();
    }
    return value;
}
exports.normativeStyleValue = normativeStyleValue;
function normativeStyleObject(styleObject) {
    for (let property of Object.keys(styleObject)) {
        styleObject[property] = normativeStyleValue(property, styleObject[property]);
    }
    return styleObject;
}
exports.normativeStyleObject = normativeStyleObject;
function getClosestFixedElement(el) {
    while (el && el !== document.documentElement) {
        if (getComputedStyle(el).position === 'fixed') {
            break;
        }
        el = el.parentElement;
    }
    return el === document.documentElement ? null : el;
}
exports.getClosestFixedElement = getClosestFixedElement;
},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
exports.WATCH_STATE_FN = {
    show(el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0;
    },
    hide(el) {
        return el.offsetWidth === 0 && el.offsetHeight === 0;
    },
    inview(el) {
        return node_1.isInview(el);
    },
    outview(el) {
        return !node_1.isInview(el);
    },
    size(el) {
        return {
            width: el.clientWidth,
            height: el.clientHeight,
        };
    },
    rect(el) {
        return node_1.getRect(el);
    },
};
exports.watchInterval = 20;
/**
 * Watch specified state. Returns a cancel function. Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type The state to watch, can be `'show' | 'hide' | 'inview' | 'outview' | 'size' | 'rect'`.
 * @param callback The callback to call when state changed.
 * @param immediate If is true, call callback immediately with current state`.
 */
function watch(el, type, callback, immediate = false) {
    return bindWatch(false, false, el, type, callback, immediate);
}
exports.watch = watch;
/**
 * Watch specified state until it changed. Returns a cancel function. Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type The state to watch, can be `'show' | 'hide' | 'inview' | 'outview' | 'size' | 'rect'`.
 * @param callback The callback to call when state changed.
 */
function watchOnce(el, type, callback) {
    return bindWatch(true, false, el, type, callback, false);
}
exports.watchOnce = watchOnce;
/**
 * Watch specified state until it becomes true. Returns a cancel function. Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type The state to watch, can be `'show' | 'hide' | 'inview' | 'outview'`.
 * @param callback The callback to call when state becomes true.
 */
function watchUntil(el, type, callback) {
    return bindWatch(true, true, el, type, callback, false);
}
exports.watchUntil = watchUntil;
function bindWatch(isOnce, untilTrue, el, type, callback, immediate) {
    let getState = exports.WATCH_STATE_FN[type];
    let oldState;
    let intervalId = null;
    let observer = null;
    if (!getState) {
        throw new Error(`Failed to watch, type "${type}" is not supported`);
    }
    if (untilTrue || immediate) {
        oldState = getState(el);
        if (oldState && untilTrue || immediate) {
            callback(oldState);
        }
    }
    if (untilTrue && oldState) {
        return unwatch;
    }
    if (type === 'size' && typeof (window.ResizeObserver) === 'function') {
        observer = new window.ResizeObserver(onResize);
        observer.observe(el);
    }
    else if ((type === 'inview' || type === 'outview') && typeof IntersectionObserver === 'function') {
        observer = new IntersectionObserver(onInviewChange);
        observer.observe(el);
    }
    else {
        oldState = getState(el);
        intervalId = setInterval(() => {
            let newState = getState(el);
            onChange(newState);
        }, exports.watchInterval);
    }
    function onResize(entries) {
        for (let { contentRect } of entries) {
            onChange({
                width: contentRect.width,
                height: contentRect.height
            });
        }
    }
    function onInviewChange(entries) {
        for (let { intersectionRatio } of entries) {
            let newState = type === 'inview' ? intersectionRatio > 0 : intersectionRatio === 0;
            onChange(newState);
        }
    }
    function onChange(newState) {
        if (!valueOrObjectEqual(newState, oldState)) {
            callback(oldState = newState);
            if (isOnce || untilTrue && newState) {
                unwatch();
            }
        }
    }
    function unwatch() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        else if (observer) {
            observer.unobserve(el);
        }
    }
    return unwatch;
}
function valueOrObjectEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
        return false;
    }
    let keysA = Object.keys(a);
    let keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (let key of keysA) {
        if (!b.hasOwnProperty(key)) {
            return false;
        }
        let valueA = a[key];
        let valueB = b[key];
        if (valueA !== valueB) {
            return false;
        }
    }
    return true;
}
},{"./node":8}],15:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./lib"));
__export(require("./dom"));
},{"./dom":6,"./lib":22}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Add items to array, for each item in items, will push into array if is not exist in array.
 * @param array The array to add items.
 * @param items The items to add to array.
 */
function add(array, ...items) {
    for (let item of items) {
        if (!array.includes(item)) {
            array.push(item);
        }
    }
    return array;
}
exports.add = add;
/**
 * Remove items from array, returns the actual removed items.
 * @param array The array to remove items.
 * @param items The items to remove from array.
 */
function remove(array, ...items) {
    let removed = [];
    for (let item of items) {
        let index = array.indexOf(item);
        if (index > -1) {
            removed.push(...array.splice(index, 1));
        }
    }
    return removed;
}
exports.remove = remove;
/**
 * Remove items match `fn` from array, returns the removed items.
 * @param array The array to remove items.
 * @param fn The function which returns boolean values to determinae whether to remove item.
 */
function removeFirst(array, fn) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (fn(array[i], i)) {
            return array.splice(i, 1)[0];
        }
    }
    return undefined;
}
exports.removeFirst = removeFirst;
/**
 * Remove items match `fn` from array, returns the removed items.
 * @param array The array to remove items.
 * @param fn The function which returns boolean values to determinae whether to remove item.
 */
function removeWhere(array, fn) {
    let removed = [];
    for (let i = array.length - 1; i >= 0; i--) {
        if (fn(array[i], i)) {
            removed.unshift(...array.splice(i, 1));
        }
    }
    return removed;
}
exports.removeWhere = removeWhere;
/**
 * Returns a new array which has been removed duplicate items.
 * @param array The array to remove duplicate items.
 */
function unique(array) {
    let set = new Set();
    for (let item of array) {
        set.add(item);
    }
    return [...set.values()];
}
exports.unique = unique;
/**
 * Creates an array of unique values from given arrays.
 * @param arrays The arrays to get union from.
 */
function union(...arrays) {
    let set = new Set();
    for (let array of arrays) {
        for (let item of array) {
            set.add(item);
        }
    }
    return [...set.values()];
}
exports.union = union;
/**
 * Creates an array of unique values that are included in all given arrays.
 * @param arrays The arrays to get intersection from.
 */
function intersect(...arrays) {
    let map = new Map();
    let interset = [];
    for (let array of arrays) {
        for (let item of array) {
            map.set(item, (map.get(item) || 0) + 1);
        }
    }
    for (let [item, count] of map.entries()) {
        if (count === arrays.length) {
            interset.push(item);
        }
    }
    return interset;
}
exports.intersect = intersect;
/**
 * Creates an array from given array but exclude items in excludeArrays.
 * @param array The array to include items.
 * @param excludeArrays The arrays to exclude items from.
 */
function difference(array, ...excludeArrays) {
    let set = new Set();
    for (let item of array) {
        set.add(item);
    }
    for (let difArray of excludeArrays) {
        for (let item of difArray) {
            set.delete(item);
        }
    }
    return [...set.values()];
}
exports.difference = difference;
class Order {
    /**
     * Create an order rule, used in `orderBy`, and can also be used to binary search from or binary insert into array with object type items
     * @param orders Rest arguments of type `key` or `OrderFunction` which will return a `key`, or [`key` / `OrderFunction`, `OrderDirection`].
     */
    constructor(firstOrder, ...orders) {
        this.orders = [];
        for (let order of [firstOrder, ...orders]) {
            if (['string', 'number', 'function'].includes(typeof order)) {
                this.orders.push([order, 1]);
            }
            else if (Array.isArray(order) && ['string', 'number', 'function'].includes(typeof order[0])) {
                this.orders.push([order[0], order[1] === -1 || order[1] === 'desc' ? -1 : 1]);
            }
            else {
                throw new Error(JSON.stringify(orders) + ' doesn\'t specify any valid key or order.');
            }
        }
    }
    sortArray(array) {
        array.sort((a, b) => this.compare(a, b));
    }
    compare(a, b) {
        for (let [keyOrFn, order] of this.orders) {
            let ai;
            let bi;
            if (typeof keyOrFn === 'function') {
                ai = keyOrFn(a);
                bi = keyOrFn(b);
            }
            else {
                ai = a[keyOrFn];
                bi = b[keyOrFn];
            }
            if (ai < bi) {
                return -order;
            }
            if (ai > bi) {
                return order;
            }
            if (ai !== bi) {
                return ai === null || ai === undefined ? -order : order;
            }
        }
        return 0;
    }
    binaryInsert(array, item) {
        let index = this.binaryFindIndexToInsert(array, item);
        array.splice(index, 0, item);
        return array;
    }
    binaryFindIndexToInsert(array, item) {
        if (array.length === 0) {
            return 0;
        }
        let compareResult = this.compare(item, array[0]);
        if (compareResult === 0 || compareResult === -1) {
            return 0;
        }
        if (array.length === 1) {
            return 1;
        }
        compareResult = this.compare(item, array[array.length - 1]);
        if (compareResult === 0) {
            return array.length - 1;
        }
        if (compareResult === 1) {
            return array.length;
        }
        let start = 0;
        let end = array.length - 1;
        while (end - start > 1) {
            let center = Math.floor((end + start) / 2);
            let compareResult = this.compare(item, array[center]);
            if (compareResult === 0) {
                return center;
            }
            else if (compareResult === -1) {
                end = center;
            }
            else {
                start = center;
            }
        }
        return end;
    }
    binaryFindIndex(array, item) {
        let index = this.binaryFindIndexToInsert(array, item);
        if (index < array.length && this.compare(item, array[index]) === 0) {
            return index;
        }
        return -1;
    }
}
exports.Order = Order;
function orderBy(array, order, ...orders) {
    order = order instanceof Order ? order : new Order(order, ...orders);
    order.sortArray(array);
    return array;
}
exports.orderBy = orderBy;
/**
 * Create a map object composed of `[key, value]` touples that returned from fn.
 * @param array The array to generate map object.
 * @param fn The function to return `[key, value]` tuple for each item.
 */
//Compar to map, object has same performance, and is more convinent to use, but will lose number key type.
function indexBy(array, fn) {
    let index = {};
    for (let i = 0, len = array.length; i < len; i++) {
        let item = array[i];
        let [key, value] = fn(item, i);
        index[key] = value;
    }
    return index;
}
exports.indexBy = indexBy;
/**
 * Create a map object composed of keys generated from `keyOrFn` and original values.
 * @param array The array to generate key map object.
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 */
function keyBy(array, keyOrFn) {
    let index = {};
    for (let item of array) {
        let key;
        if (typeof keyOrFn === 'function') {
            key = keyOrFn(item);
        }
        else {
            key = item[keyOrFn];
        }
        index[key] = item;
    }
    return index;
}
exports.keyBy = keyBy;
/**
 * Creates a map object composed of keys generated from the results of running each element of collecti
 * @param array The array to group by.
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 */
function groupBy(array, keyOrFn) {
    let index = {};
    for (let item of array) {
        let key;
        if (typeof keyOrFn === 'function') {
            key = keyOrFn(item);
        }
        else {
            key = item[keyOrFn];
        }
        let group = index[key] || (index[key] = []);
        group.push(item);
    }
    return index;
}
exports.groupBy = groupBy;
/**
 * Group and aggregate items in array by aggregate function
 * @param array The array to aggregate.
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 * @param aggregateFn The aggregate function which accepts grouped items and key as arguments, and returns aggregate value.
 */
function aggregate(array, keyOrFn, aggregateFn) {
    let index = groupBy(array, keyOrFn);
    return indexBy(Object.keys(index), (key) => {
        return [key, aggregateFn(index[key], key)];
    });
}
exports.aggregate = aggregate;
/**
 * Returns the length of the array.
 * @param array The array to count length.
 */
//can't use `array: unknown` here, or it will cause `Item` in `aggregate` was inferred as `unknown` and make `CanSortKeys<Item>` not work.
function count(array) {
    return array.length;
}
exports.count = count;
/**
 * Returns the sum of the array items.
 * @param array The array of numbers.
 */
function sum(array) {
    return array.reduce((v1, v2) => v1 + v2, 0);
}
exports.sum = sum;
/**
 * Returns the average value of the array items. returns 0 if no items in array.
 * @param array The array of numbers.
 */
function avg(array) {
    if (array.length === 0) {
        return 0;
    }
    return sum(array) / array.length;
}
exports.avg = avg;
/**
 * Returns the maximun value of the array items. returns -Infinity if no items in array.
 * @param array The array of numbers.
 */
function max(array) {
    return Math.max(...array);
}
exports.max = max;
/**
 * Returns the maximun value of the array items. returns Infinity if no items in array.
 * @param array The array of numbers.
 */
function min(array) {
    return Math.min(...array);
}
exports.min = min;
},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const duration_1 = require("./duration");
exports.dateUnits = 'yMdhms';
/**
 * Get one of the date value by the unit type.
 * @param date The date object to get value from.
 * @param unit The unit type, must be one of `'y', 'M', 'd', 'h', 'm', 's'`.
 */
function getDateByUnit(date, unit) {
    switch (unit) {
        case 'y':
            return date.getFullYear();
        case 'M':
            return date.getMonth();
        case 'd':
            return date.getDate();
        case 'h':
            return date.getHours();
        case 'm':
            return date.getMinutes();
        case 's':
            return date.getSeconds();
        default:
            throw new Error(`"${unit}" is not a valid date unit`);
    }
}
exports.getDateByUnit = getDateByUnit;
/**
 * Set one of the date value by the unit type.
 * @param date The date object to set value.
 * @param value The date value to set.
 * @param unit The unit type, must be one of `'y', 'M', 'd', 'h', 'm', 's'`.
 */
function setDateByUnit(date, value, unit) {
    switch (unit) {
        case 'y':
            return date.setFullYear(value);
        case 'M':
            return date.setMonth(value);
        case 'd':
            return date.setDate(value);
        case 'h':
            return date.setHours(value);
        case 'm':
            return date.setMinutes(value);
        case 's':
            return date.setSeconds(value);
        default:
            throw new Error(`"${unit}" is not a valid date unit`);
    }
}
exports.setDateByUnit = setDateByUnit;
/**
 * Returns if date values from year to seconds are associated with a real existed date.
 * @param y Year count.
 * @param M Month count.
 * @param d Date count.
 * @param h Hour count.
 * @param m Minute count.
 * @param s Second count.
 */
function isValidDate(y, M, d = 1, h = 0, m = 0, s = 0) {
    let date = new Date(y, M, d, h, m, s);
    return y === date.getFullYear() &&
        M === date.getMonth() &&
        d === date.getDate() &&
        h === date.getHours() &&
        m === date.getMinutes() &&
        s === date.getSeconds();
}
exports.isValidDate = isValidDate;
/**
 * Returns if the year of date is a leap year, which contains 366 days.
 * @param date The date to test.
 */
function isLeapYear(date) {
    let year = date.getFullYear();
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
exports.isLeapYear = isLeapYear;
/**
 * Returns the days in the year from a date, which is 366 for leap year, 355 otherwise.
 * @param date The date to get days from.
 */
function getDaysOfYear(date) {
    return isLeapYear(date) ? 366 : 365;
}
exports.getDaysOfYear = getDaysOfYear;
/**
 * Returns the days in the month from a date, which betweens 28-31.
 * @param date The date to get days from.
 */
function getDaysOfMonth(date) {
    let d = new Date(date.getTime());
    d.setDate(32);
    return 32 - d.getDate();
}
exports.getDaysOfMonth = getDaysOfMonth;
/**
 * Clone a date. Can specified `units` to partly clone.
 * @param date The date to clone, default value is current date.
 * @param units The units to partly clone.
 */
function cloneDate(date = new Date(), units = exports.dateUnits) {
    let dateValues = [...exports.dateUnits].map(unit => {
        if (units.includes(unit)) {
            return getDateByUnit(date, unit);
        }
        else {
            return unit === 'd' ? 1 : 0;
        }
    });
    return new Date(dateValues[0], dateValues[1], dateValues[2], dateValues[3], dateValues[4], dateValues[5]);
}
exports.cloneDate = cloneDate;
/**
 * Add duration string to a date and returns a new date.
 * @param date The date to add duration.
 * @param duration The duration string to add to date.
 */
function addDurationToDate(date, duration) {
    let isMinus = duration[0] === '-';
    if (isMinus) {
        duration = duration.slice(1);
    }
    let flag = isMinus ? -1 : 1;
    let o = duration_1.parseDurationToObject(duration);
    let newDate = new Date(date);
    for (let unit of Object.keys(o)) {
        let value = getDateByUnit(newDate, unit) + o[unit] * flag;
        setDateByUnit(newDate, value, unit);
    }
    return newDate;
}
exports.addDurationToDate = addDurationToDate;
/**
 * Returns a formatted date string.
 * @param date The date to format.
 * @param format The date format, default value is `'yyyy/MM/dd hh:mm:ss'`.
 */
function formatDate(date, format = 'yyyy/MM/dd hh:mm:ss') {
    return format.replace(/y+|M+|d+|h+|m+|s+/g, m0 => {
        let unit = m0[0];
        let value = getDateByUnit(date, unit[0]);
        if (unit === 'M') {
            value += 1;
        }
        return String(value).padStart(m0.length, '0');
    });
}
exports.formatDate = formatDate;
/**
 * Returns a short type formatted date string.
 * @param date The date to format.
 * @param format The format object to use, default value is `{y: 'yyyy/MM/dd hh:mm', M: 'MM/dd hh:mm', h: 'hh:mm'}`.
 */
function formatToShort(date, format = { y: 'yyyy/MM/dd hh:mm', M: 'MM/dd hh:mm', h: 'hh:mm' }) {
    let now = new Date();
    let hasDifferentUnit = false;
    let matchFormat = Object.values(format)[0];
    for (let unit of exports.dateUnits) {
        hasDifferentUnit = hasDifferentUnit || getDateByUnit(date, unit) !== getDateByUnit(now, unit);
        matchFormat = format[unit] || matchFormat;
        if (hasDifferentUnit) {
            break;
        }
    }
    return formatDate(date, matchFormat);
}
exports.formatToShort = formatToShort;
},{"./duration":18}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("./string");
const date_1 = require("./date");
const DATE_UNIT_SECONDS = {
    y: 365 * 24 * 60 * 60,
    M: 30 * 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
    d: 24 * 60 * 60,
    h: 60 * 60,
    m: 60,
    s: 1,
};
/**
 * Parse duration string like `1h1m` or `01:01:00` to object `{y, M, d, h, m, s}`.
 * @param duration string like `1h1m` or `01:01:00`.
 */
function parseDurationToObject(duration) {
    let o = {
        y: 0,
        M: 0,
        d: 0,
        h: 0,
        m: 0,
        s: 0,
    };
    if (duration.includes(':')) {
        let [h, m, s] = string_1.subMatches(duration, /(?:(\d\d):)?(\d\d):(\d\d(?:\.\d+)?)/).map(v => Number(v) || 0);
        o.h = h;
        o.m = m;
        o.s = s;
    }
    else {
        let matches = string_1.subMatches(duration, /(\d+(?:\.\d+)?) ?([yMwdhms])/g);
        for (let [count, unit] of matches) {
            o[unit] = Number(count);
        }
    }
    return o;
}
exports.parseDurationToObject = parseDurationToObject;
/**
 * Parse duration string like `1h1m` or `01:01:00` to second count.
 * @param duration string like `1h1m` or `01:01:00`.
 */
function parseDurationToSeconds(duration) {
    let o = parseDurationToObject(duration);
    let seconds = 0;
    for (let unit of Object.keys(o)) {
        let count = o[unit];
        seconds += count * DATE_UNIT_SECONDS[unit];
    }
    return seconds;
}
exports.parseDurationToSeconds = parseDurationToSeconds;
/**
 * Parse second count to duration object `{y, M, d, h, m, s}`.
 * @param seconds The second count.
 * @param units The unit to use when parsing, default value is `yMdhms`.
 */
function parseSecondsToDurationObject(seconds, units = date_1.dateUnits) {
    let o = {
        y: 0,
        M: 0,
        d: 0,
        h: 0,
        m: 0,
        s: 0,
    };
    for (let unit of units) {
        let unitValue = DATE_UNIT_SECONDS[unit];
        let count = Math.floor(seconds / unitValue);
        if (count > 0) {
            o[unit] = count;
            seconds = seconds % unitValue;
        }
    }
    return o;
}
exports.parseSecondsToDurationObject = parseSecondsToDurationObject;
/**
 * Format second count to duration string like `1h1m`.
 * @param units Date unit types like `yMdhms`. Can only specify partial date units like `Md`.
 * @param maxOutputUnitCount Maximun unit count of the duration string. E.g., sepcify to `2` to output like `1y1M`, `1M1d`, `1d1h`, `1s`.
 */
function formatSecondsToDuration(seconds, units = date_1.dateUnits, maxOutputUnitCount = units.length) {
    let o = parseSecondsToDurationObject(seconds, units);
    let duration = '';
    let outputUnitCount = 0;
    for (let unit of Object.keys(o)) {
        let count = o[unit];
        if (count > 0) {
            duration += count + unit;
            outputUnitCount++;
        }
        if (outputUnitCount >= maxOutputUnitCount) {
            break;
        }
    }
    return duration;
}
exports.formatSecondsToDuration = formatSecondsToDuration;
/**
 * Format second count to time string like `01:01:01`.
 * @param seconds The second count.
 */
function formatSecondsToTime(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor(seconds % 3600 / 60) || 0;
    let s = Math.floor(seconds % 60) || 0;
    return (h ? String(h).padStart(2, '0') + ':' : '')
        + String(m).padStart(2, '0') + ':'
        + String(s).padStart(2, '0');
}
exports.formatSecondsToTime = formatSecondsToTime;
},{"./date":17,"./string":26}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** An event emitter to listen and emit events. */
class Emitter {
    constructor() {
        this._events = {};
    }
    /**
     * Register listener for specified event name.
     * @param name The event name.
     * @param handler The event handler.
     * @param scope The scope will be binded to handler.
     */
    on(name, handler, scope) {
        let events = this._events[name] || (this._events[name] = []);
        events.push({
            handler,
            scope,
            once: false,
        });
    }
    /**
     * Register listener for specified event name for only once.
     * @param name The event name.
     * @param handler The event handler.
     * @param scope The scope will be binded to handler.
     */
    once(name, handler, scope) {
        let events = this._events[name] || (this._events[name] = []);
        events.push({
            handler,
            scope,
            once: true
        });
    }
    /**
     * Stop listening specified event.
     * @param name The event name.
     * @param handler The event handler, only matched listener will be removed.
     * @param scope The scope binded to handler. If provided, remove listener only when scope match.
     */
    off(name, handler, scope) {
        let events = this._events[name];
        if (events) {
            for (let i = events.length - 1; i >= 0; i--) {
                let event = events[i];
                if (event.handler === handler && (!scope || event.scope === scope)) {
                    events.splice(i, 1);
                }
            }
        }
    }
    /**
     * Check if registered listener for specified event.
     * @param name The event name.
     * @param handler The event handler. If provided, will also check if the handler match.
     * @param scope The scope binded to handler. If provided, will additionally check if the scope match.
     */
    hasListener(name, handler, scope) {
        let events = this._events[name];
        if (!handler) {
            return !!events && events.length > 0;
        }
        else if (events && handler) {
            for (let i = 0, len = events.length; i < len; i++) {
                let event = events[i];
                if (event.handler === handler && (!scope || event.scope === scope)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Emit specified event with followed arguments.
     * @param name The event name.
     * @param args The arguments that will be passed to event handlers.
     */
    emit(name, ...args) {
        let events = this._events[name];
        if (events) {
            for (let i = 0; i < events.length; i++) {
                let event = events[i];
                //the handler may call off, so must remove it before handling
                if (event.once === true) {
                    events.splice(i--, 1);
                }
                event.handler.apply(event.scope, args);
            }
        }
    }
    /** Remove all event slisteners */
    removeAllListeners() {
        this._events = {};
    }
}
exports.Emitter = Emitter;
},{}],20:[function(require,module,exports){
"use strict";
/*Polyfill for parts of ECMAScript 2017+, which is not widely supported by modern browsers*/
if (!String.prototype.padStart) {
    Object.defineProperty(String.prototype, 'padStart', {
        value: function (length, fillString) {
            let len = this.length;
            let lenPad = fillString.length;
            if (length < len || !lenPad) {
                return String(this);
            }
            else {
                let repeatCount = Math.floor((length - len) / lenPad);
                let additionStr = fillString.slice(0, length - len - repeatCount * lenPad);
                return fillString.repeat(repeatCount) + additionStr + this;
            }
        }
    });
}
if (!String.prototype.padEnd) {
    Object.defineProperty(String.prototype, 'padEnd', {
        value: function (length, fillString) {
            let len = this.length;
            let lenPad = fillString.length;
            if (length < len || !lenPad) {
                return String(this);
            }
            else {
                let repeatCount = Math.floor((length - len) / lenPad);
                let additionStr = fillString.slice(0, length - len - repeatCount * lenPad);
                return this + fillString.repeat(repeatCount) + additionStr;
            }
        }
    });
}
//still a proposal, but I love it.
if (!RegExp.escape) {
    Object.defineProperty(RegExp, 'escape', {
        value: function (source) {
            return source.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        }
    });
}
},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimedFunction {
    constructor(fn, ms) {
        this.id = null;
        /** Returns if the timed function been canceled. */
        this.canceled = false;
        this.fn = fn;
        this.ms = ms;
    }
}
exports.TimedFunction = TimedFunction;
class WrappedTimedFunction extends TimedFunction {
    constructor(fn, ms) {
        super(fn, ms);
        this.wrapped = this.wrap();
    }
}
exports.WrappedTimedFunction = WrappedTimedFunction;
class Timeout extends TimedFunction {
    /**
     * Just like setTimeout, call `fn` after `ms` millisecons.
     * @param fn The function to call later.
     * @param ms The timeout time in millisecons.
     */
    constructor(fn, ms) {
        super(fn, ms);
        this.reset();
    }
    /** Restart timeout, although it was been called. always returns true. */
    reset() {
        if (this.id) {
            clearTimeout(this.id);
        }
        this.id = setTimeout(this.onTimeout.bind(this), this.ms);
        return true;
    }
    onTimeout() {
        this.id = null;
        this.fn();
    }
    /** Call deferred function immediately if it wasn't been called and returns true. otherwise returns false. */
    flush() {
        if (!this.id) {
            return false;
        }
        clearTimeout(this.id);
        this.id = null;
        this.fn();
        return true;
    }
    /** Cancel deferred function, returns if it was canceled before been called. */
    cancel() {
        if (!this.id) {
            return false;
        }
        clearTimeout(this.id);
        this.id = null;
        return true;
    }
}
/**
 * Just like setTimeout, call `fn` after `ms` millisecons.
 * @param fn The function to call later.
 * @param ms The timeout time in millisecons.
 */
function timeout(fn, ms = 0) {
    return new Timeout(fn, ms);
}
exports.timeout = timeout;
class Interval extends TimedFunction {
    /**
     * Just like setInterval, call `fn` every `ms` millisecons.
     * @param fn The function to call.
     * @param ms The interval time in millisecons.
     */
    constructor(fn, ms) {
        super(fn, ms);
        this.reset();
    }
    /** Restart interval, although it was been canceled. always returns true. */
    reset() {
        if (this.id) {
            clearInterval(this.id);
        }
        this.id = setInterval(this.onInterval.bind(this), this.ms);
        return true;
    }
    onInterval() {
        this.fn();
    }
    /** Call interval function immediately if it wasn't been canceled and returns true. otherwise returns false. */
    flush() {
        if (!this.id) {
            return false;
        }
        this.fn();
        this.reset();
        return true;
    }
    /** Cancel interval function, returns if it was canceled before been called. */
    cancel() {
        if (!this.id) {
            return false;
        }
        clearInterval(this.id);
        this.id = null;
        return true;
    }
}
/**
 * Just like setInterval, call `fn` every `ms` millisecons.
 * @param fn The function to call.
 * @param ms The interval time in millisecons.
 */
function interval(fn, ms) {
    return new Interval(fn, ms);
}
exports.interval = interval;
class Throttle extends WrappedTimedFunction {
    /**
     * Throttle function calls, call returned function twice in `ms` millisecons will only call `fn` for once. Returns a new function.
     * @param fn The function to throttle.
     * @param ms The time period in which only at most one call allowed.
     */
    constructor(fn, ms) {
        super(fn, ms);
    }
    wrap() {
        let me = this;
        return function (...args) {
            if (me.canceled) {
                me.fn.apply(this, args);
                return;
            }
            if (!me.id) {
                me.id = setTimeout(me.onTimeout.bind(me), me.ms);
                me.fn.apply(this, args);
            }
        };
    }
    onTimeout() {
        this.id = null;
    }
    /** Reset throttle timeout, function will be called immediately next time. Will restart throttle if been canceled. */
    reset() {
        if (this.id) {
            clearTimeout(this.id);
            this.id = null;
        }
        this.canceled = false;
        return true;
    }
    /** Do nothing, always return false. */
    flush() {
        return false;
    }
    /** Cancel throttle, function will be called without limit. Returns true if is not canceled before. */
    cancel() {
        if (this.canceled) {
            return false;
        }
        this.canceled = true;
        return true;
    }
}
/**
 * Throttle function calls, call returned function twice in `ms` millisecons will only call `fn` for once. Returns a new function.
 * @param fn The function to throttle.
 * @param ms The time period in which only at most one call allowed.
 */
function throttle(fn, ms) {
    return new Throttle(fn, ms);
}
exports.throttle = throttle;
class SmoothThrottle extends WrappedTimedFunction {
    /**
     * Throttle function calls like `throttle`, but will calls `fn` lazily and smooth. Returns a new function.
     * @param fn The function to throttle.
     * @param ms The time period in which only at most one call allowed.
     */
    constructor(fn, ms) {
        super(fn, ms);
        this.lastArgs = null;
        this.lastThis = null;
        this.wrapped = this.wrap();
    }
    wrap() {
        let me = this;
        return function (...args) {
            if (me.canceled) {
                me.fn.apply(this, args);
                return;
            }
            me.lastArgs = args;
            me.lastThis = this;
            if (!me.id) {
                me.id = setTimeout(me.onTimeout.bind(me), me.ms);
            }
        };
    }
    onTimeout() {
        if (this.lastArgs) {
            this.fn.apply(this.lastThis, this.lastArgs);
            this.lastArgs = null;
            this.lastThis = null;
            this.id = setTimeout(this.onTimeout.bind(this), this.ms);
        }
        else {
            this.id = null;
        }
    }
    /** Reset throttle timeout and discard deferred call, Will restart throttle if been canceled. */
    reset() {
        if (this.id) {
            clearTimeout(this.id);
            this.id = null;
        }
        this.lastArgs = null;
        this.lastThis = null;
        this.canceled = false;
        return true;
    }
    /** Call function immediately if there is a deferred call, and restart throttle timeout. */
    flush() {
        if (this.lastArgs) {
            this.id = setTimeout(this.onTimeout.bind(this), this.ms);
            this.fn.apply(this.lastThis, this.lastArgs);
            this.lastArgs = null;
            this.lastThis = null;
            return true;
        }
        return false;
    }
    /** Cancel throttle, function will be called without limit. Returns true if is not canceled before. */
    cancel() {
        if (this.canceled) {
            return false;
        }
        this.canceled = true;
        return true;
    }
}
/**
 * Throttle function calls like `throttle`, but will call `fn` lazily and smooth. Returns a new function.
 * @param fn The function to throttle.
 * @param ms The time period in which only at most one call allowed.
 */
function smoothThrottle(fn, ms) {
    return new SmoothThrottle(fn, ms);
}
exports.smoothThrottle = smoothThrottle;
class Debounce extends WrappedTimedFunction {
    /**
     * Debounce function calls, call returned function for the second time in timeout period that specified by `ms` will not call `fn`. Will restart the timeout every time calling return function. Returns a new function.
     * @param fn The function to debounce.
     * @param ms The timeout in milliseconds.
     */
    constructor(fn, ms) {
        super(fn, ms);
        this.lastArgs = null;
        this.lastThis = null;
        this.wrapped = this.wrap();
    }
    wrap() {
        let me = this;
        return function (...args) {
            if (me.canceled) {
                me.fn.apply(this, args);
                return;
            }
            if (me.id) {
                clearTimeout(me.id);
            }
            me.id = setTimeout(me.onTimeout.bind(me), me.ms);
            me.lastArgs = args;
            me.lastThis = this;
        };
    }
    onTimeout() {
        this.id = null;
        if (this.lastArgs) {
            this.fn.apply(this.lastThis, this.lastArgs);
            this.lastArgs = null;
            this.lastThis = null;
        }
    }
    /** Reset debounce timeout and discard deferred call. Will restart debounce if been canceled. */
    reset() {
        if (this.id) {
            clearTimeout(this.id);
            this.id = null;
        }
        this.lastArgs = null;
        this.lastThis = null;
        return true;
    }
    /** Call function immediately there is a deferred call, and restart debounce timeout. */
    flush() {
        if (this.id) {
            clearTimeout(this.id);
            this.id = 0;
        }
        if (this.lastArgs) {
            this.fn.apply(this.lastThis, this.lastArgs);
            this.lastArgs = null;
            this.lastThis = null;
            return true;
        }
        return false;
    }
    /** Cancel debounce, function will be called without limit. Returns true if is not canceled before. */
    cancel() {
        if (this.canceled) {
            return false;
        }
        this.canceled = true;
        return true;
    }
}
/**
 * Debounce function calls, call returned function for the second time in timeout period that specified by `ms` will not call `fn`. Will restart the timeout every time calling return function. Returns a new function.
 * @param fn The function to debounce.
 * @param ms The timeout in milliseconds.
 */
function debounce(fn, ms) {
    return new Debounce(fn, ms);
}
exports.debounce = debounce;
},{}],22:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
require("./es-polyfill");
__export(require("./object"));
__export(require("./array"));
__export(require("./string"));
__export(require("./number"));
__export(require("./function"));
__export(require("./time"));
__export(require("./duration"));
__export(require("./date"));
__export(require("./emitter"));
__export(require("./queue"));
},{"./array":16,"./date":17,"./duration":18,"./emitter":19,"./es-polyfill":20,"./function":21,"./number":23,"./object":24,"./queue":25,"./string":26,"./time":27}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Like the opposite of toFixed, but it supports both positive and negative power, and always returns a number.
 * @param number The number to fix.
 * @param power The power that the number will correct to.
 */
function toPower(number, power = 0) {
    let maxPower = Math.floor(Math.log(number) / Math.log(10));
    power = Math.min(maxPower, power);
    if (power > 0) {
        let n = Math.pow(10, power);
        return Math.round(number / n) * n;
    }
    //this can avoid the `0.1 + 0.2 != 0.3`
    else {
        let n = Math.pow(10, -power);
        return Math.round(number * n) / n;
    }
}
exports.toPower = toPower;
/**
 * Like a % b, but always returns positive number.
 * @param number The number to calculate modulo.
 * @param modulo The modulo of number.
 */
function mod(number, modulo) {
    return (number % modulo + Math.abs(modulo)) % modulo;
}
exports.mod = mod;
/**
 * Returns a new number which is constrained in a range.
 * @param number The number to constrain.
 * @param min The minimum number.
 * @param max The maximum number.
 */
function constrain(number, min, max) {
    if (min > max) {
        [min, max] = [max, min];
    }
    if (number < min) {
        number = min;
    }
    else if (number > max) {
        number = max;
    }
    return number;
}
exports.constrain = constrain;
},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Assign values from source to target.
 * @param target The target that the sources assigned to.
 * @param sources The sources that will assigned to target by order.
 * @param keys If `keys` is specified, only values whose key in it can be assigned.
 */
function assign(target, source, keys = Object.keys(source)) {
    for (let key of keys) {
        let value = source[key];
        if (value !== undefined) {
            target[key] = value;
        }
    }
    return target;
}
exports.assign = assign;
//2x~3x faster than JSON methods, see https://jsperf.com/deep-clone-vs-json-clone
/**
 * Deeply clone an object or value
 * @param source The source to be clone.
 * @param deep Max deep to clone
 */
function deepClone(source, deep = 10) {
    if (typeof source !== 'object' || !source || deep === 0) {
        return source;
    }
    if (Array.isArray(source)) {
        return source.map(value => {
            if (typeof value !== 'object' || !value) {
                return value;
            }
            else {
                return deepClone(value, deep - 1);
            }
        });
    }
    else {
        let cloned = {};
        for (let key of Object.keys(source)) {
            let value = source[key];
            cloned[key] = deepClone(value, deep - 1);
        }
        return cloned;
    }
}
exports.deepClone = deepClone;
//1x faster than JSON methods, see https://jsperf.com/deep-equal-vs-json-compare
/**
 * Deeply compare two objects or values
 * @param a left one
 * @param b right one
 * @param deep Max deep to compare
 */
function deepEqual(a, b, deep = 10) {
    if (a === b) {
        return true;
    }
    if (deep === 0) {
        return false;
    }
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
        return false;
    }
    if (a.constructor !== b.constructor) {
        return false;
    }
    let keysA = Object.keys(a);
    let keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (let key of keysA) {
        if (!b.hasOwnProperty(key)) {
            return false;
        }
        let valueA = a[key];
        let valueB = b[key];
        if (!deepEqual(valueA, valueB, deep - 1)) {
            return false;
        }
    }
    return true;
}
exports.deepEqual = deepEqual;
},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_1 = require("./object");
const array_1 = require("./array");
const emitter_1 = require("./emitter");
var QueueState;
(function (QueueState) {
    /** Tasks handling not started. */
    QueueState[QueueState["Pending"] = 0] = "Pending";
    /** Any task is running. */
    QueueState[QueueState["Running"] = 1] = "Running";
    /** Been paused. */
    QueueState[QueueState["Paused"] = 2] = "Paused";
    /** All tasks finshed. */
    QueueState[QueueState["Finish"] = 3] = "Finish";
    /** Aborted because of error or by user. */
    QueueState[QueueState["Aborted"] = 4] = "Aborted";
})(QueueState = exports.QueueState || (exports.QueueState = {}));
class Queue extends emitter_1.Emitter {
    constructor(options) {
        super();
        /** Specify how many tasks to run simultaneously. */
        this.concurrency = 10;
        /** If true, will run tasks from head of the queue. */
        this.fifo = true;
        /** If true, will continue handling tasks when error occurs. */
        this.continueOnError = false;
        /**
         * How many times to retry after tasks failed.
         * if one task's retry times execeed, it will never automatically retry, but you can still retry all items by calling `retry()` manually.
         * Setting this option to values `> 0` implies `continueOnError` is true.
         */
        this.maxRetryTimes = 0;
        /** The task array which will be passed to handler in order. */
        this.tasks = [];
        /** Returns current working state. */
        this.state = QueueState.Pending;
        this.seed = 1;
        this.handledCount = 0;
        this.runningItems = [];
        this.failedItems = [];
        this.resumePromise = null;
        this.resumeResolve = null;
        this.handler = options.handler;
        if (options.tasks) {
            this.tasks.push(...options.tasks);
        }
        object_1.assign(this, options, ['concurrency', 'fifo', 'continueOnError', 'maxRetryTimes']);
    }
    /** Returns the tount of total tasks, included handled and unhandled and failed. */
    getTotalCount() {
        return this.getHandledCount() + this.getUnhandledCount() + this.getFailedCount();
    }
    /** Returns the count of handled tasks. */
    getHandledCount() {
        return this.handledCount;
    }
    /** Returns the count of unhandled tasks, not include failed tasks. */
    getUnhandledCount() {
        return this.tasks.length + this.getRunningCount();
    }
    /** Returns the count of running tasks. */
    getRunningCount() {
        return this.runningItems.length;
    }
    /** Returns the count of failed tasks. */
    getFailedCount() {
        return this.failedItems.length;
    }
    /** Returns the unhandled tasks. */
    getUnhandledTasks() {
        return [...this.getRunningTasks(), ...this.tasks];
    }
    /** Returns the running tasks. */
    getRunningTasks() {
        return this.runningItems.map(v => v.task);
    }
    /** Returns the failed tasks. */
    getFailedTasks() {
        return this.failedItems.map(v => v.task);
    }
    /** Start handling tasks. Will emit `finish` event in next tick if no task to run. Returns if true queue started. */
    start() {
        if (this.state === QueueState.Paused) {
            this.resume();
        }
        else if (this.tasks.length > 0) {
            this.state = QueueState.Running;
            this.mayHandleNextTask();
        }
        else {
            Promise.resolve().then(() => this.onFinish());
        }
        return this.state === QueueState.Running;
    }
    /** Pause handling tasks, running tasks will not aborted, but will not emit task events until `resume()`. Returns if paused from running state. */
    pause() {
        if (this.state !== QueueState.Running) {
            return false;
        }
        this.state = QueueState.Paused;
        this.resumePromise = new Promise(resolve => {
            this.resumeResolve = () => {
                this.resumeResolve = null;
                this.resumePromise = null;
                resolve();
            };
        });
        this.emit('pause');
        return true;
    }
    /** Resume handling tasks. Returns if resumed from paused state. */
    resume() {
        if (this.state !== QueueState.Paused) {
            return false;
        }
        this.state = QueueState.Running;
        if (this.resumeResolve) {
            this.resumeResolve();
        }
        this.emit('resume');
        this.mayHandleNextTask();
        return true;
    }
    mayHandleNextTask() {
        //state may change after in event handler, so we need to test state here.
        if (this.state !== QueueState.Running) {
            return;
        }
        while (this.getRunningCount() < this.concurrency && this.tasks.length > 0) {
            let task = this.fifo ? this.tasks.shift() : this.tasks.pop();
            this.handleItem({
                id: this.seed++,
                task,
                retriedTimes: 0,
                abort: null
            });
        }
        if (this.maxRetryTimes > 0 && this.getRunningCount() < this.concurrency && this.failedItems.length) {
            for (let i = 0; i < this.failedItems.length; i++) {
                let item = this.failedItems[i];
                if (item.retriedTimes < this.maxRetryTimes) {
                    item.retriedTimes++;
                    this.failedItems.splice(i--, 1);
                    this.handleItem(item);
                    if (this.getRunningCount() >= this.concurrency) {
                        break;
                    }
                }
            }
        }
        if (this.getRunningCount() === 0) {
            this.onFinish();
        }
    }
    handleItem(item) {
        let { task } = item;
        let onItemFinish = this.onItemFinish.bind(this, item);
        let onItemError = this.onItemError.bind(this, item);
        this.runningItems.push(item);
        let value = this.handler(task);
        if (value && typeof value === 'object' && value.promise instanceof Promise && typeof value.abort === 'function') {
            value.promise.then(onItemFinish, onItemError);
            item.abort = value.abort;
        }
        else if (value instanceof Promise) {
            value.then(onItemFinish, onItemError);
        }
        else {
            Promise.resolve().then(() => onItemFinish(value));
        }
    }
    async onItemFinish(item, value) {
        await this.prepareItem(item);
        if (!this.removeFromRunning(item)) {
            return;
        }
        this.handledCount++;
        if (this.state === QueueState.Running) {
            this.emit('taskfinish', item.task, value);
            this.mayHandleNextTask();
        }
    }
    async onItemError(item, err) {
        await this.prepareItem(item);
        if (!this.removeFromRunning(item)) {
            return;
        }
        this.failedItems.push(item);
        this.emit('error', item.task, err);
        if (!this.continueOnError && this.maxRetryTimes === 0) {
            this.onFatalError(err);
        }
        else {
            this.mayHandleNextTask();
        }
    }
    async prepareItem(item) {
        item.abort = null;
        if (this.resumePromise) {
            await this.resumePromise;
        }
    }
    removeFromRunning(item) {
        let index = this.runningItems.findIndex(v => v.id === item.id);
        if (index > -1) {
            this.runningItems.splice(index, 1);
            return true;
        }
        return false;
    }
    onFinish() {
        if (this.state === QueueState.Pending || this.state === QueueState.Running) {
            this.state = QueueState.Finish;
            this.emit('finish');
        }
    }
    onFatalError(err) {
        this.abort(err);
    }
    /** Retry all failed tasks immediately, ignore their retried times count. Returns if has failed tasks and queue started. */
    retry() {
        let hasFailedTasks = this.getFailedCount() > 0;
        if (hasFailedTasks) {
            this.tasks.push(...this.getFailedTasks());
            this.failedItems = [];
        }
        let started = this.start();
        return started && hasFailedTasks;
    }
    /**
     * Abort queue and all running tasks. After aborted, queue ca still be started by calling `start()`.
     * Returns if queue was successfully aborted.
     */
    abort(err = 'manually') {
        if (!(this.state === QueueState.Running || this.state === QueueState.Paused)) {
            return false;
        }
        this.state = QueueState.Aborted;
        this.failedItems.push(...this.runningItems);
        this.abortRunningItems();
        this.emit('abort', err);
        return true;
    }
    abortRunningItems() {
        this.runningItems.map(item => this.abortItem(item));
        this.runningItems = [];
    }
    abortItem(item) {
        let { task, abort } = item;
        if (abort) {
            abort();
        }
        this.emit('taskabort', task);
    }
    /** End queue, abort all running tasks and clear all tasks and handling records. */
    clear() {
        if (!(this.state === QueueState.Running || this.state === QueueState.Paused)) {
            return false;
        }
        this.state = QueueState.Finish;
        this.tasks = [];
        this.failedItems = [];
        this.handledCount = 0;
        this.abortRunningItems();
        if (this.resumeResolve) {
            this.resumeResolve();
        }
        return true;
    }
    /** Push tasks to queue. */
    push(...tasks) {
        this.tasks.push(...tasks);
        if (this.state === QueueState.Finish) {
            this.start();
        }
        this.mayHandleNextTask();
    }
    /** Unshift tasks to queue. */
    unshift(...items) {
        this.tasks.unshift(...items);
        if (this.state === QueueState.Finish) {
            this.start();
        }
        this.mayHandleNextTask();
    }
    /** Find first matched task. */
    find(fn) {
        let item = this.runningItems.find(item => fn(item.task));
        if (item) {
            return item.task;
        }
        item = this.failedItems.find(item => fn(item.task));
        if (item) {
            return item.task;
        }
        let task = this.tasks.find(task => fn(task));
        if (task) {
            return task;
        }
        return undefined;
    }
    /** Remove tasks, note that it's O(m * n) algorithm */
    remove(...tasks) {
        let removed = [];
        for (let task of tasks) {
            let index = this.runningItems.findIndex(item => item.task === task);
            if (index > -1) {
                this.abortItem(this.runningItems.splice(index, 1)[0]);
                removed.push(task);
            }
            else {
                index = this.failedItems.findIndex(item => item.task === task);
                if (index > -1) {
                    this.failedItems.splice(index, 1);
                    removed.push(task);
                }
            }
            if (index === -1) {
                index = this.tasks.findIndex(v => v === task);
                if (index > -1) {
                    tasks.splice(index, 1);
                    removed.push(task);
                }
            }
        }
        this.mayHandleNextTask();
        return removed;
    }
    /** Remove all matched tasks */
    removeWhere(fn) {
        let removed = [];
        let runningItems = array_1.removeWhere(this.runningItems, item => fn(item.task));
        runningItems.forEach(item => this.abortItem(item));
        removed.push(...runningItems.map(item => item.task));
        removed.push(...array_1.removeWhere(this.failedItems, item => fn(item.task)).map(item => item.task));
        removed.push(...array_1.removeWhere(this.tasks, task => fn(task)));
        this.mayHandleNextTask();
        return removed;
    }
}
exports.Queue = Queue;
/**
 * Run tasks in queue, returns a promise which will be resolved after finished.
 * @param tasks The task array which will be passed to handler in order.
 * @param handler The handler to handle each task.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
function queueEach(tasks, handler, concurrency) {
    return new Promise((resolve, reject) => {
        let q = new Queue({
            concurrency,
            tasks,
            handler
        });
        q.on('finish', resolve);
        q.on('error', reject);
        q.start();
    });
}
exports.queueEach = queueEach;
/**
 * Run tasks in queue, returns a promise which will be resolved with returned values from handler after finished.
 * @param tasks The task array which will be passed to handler in order.
 * @param handler The handler to handle each task. It should returns a value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
function queueMap(tasks, handler, concurrency) {
    return new Promise((resolve, reject) => {
        let values = [];
        let indexedTasks = tasks.map((task, index) => ({ task, index }));
        let q = new Queue({
            concurrency,
            tasks: indexedTasks,
            handler: async ({ task, index }) => {
                values[index] = await handler(task);
            }
        });
        q.on('finish', () => resolve(values));
        q.on('error', reject);
        q.start();
    });
}
exports.queueMap = queueMap;
/**
 * Run tasks in queue, returns a promise which will be resolved if some tasks match handler.
 * @param tasks The task array which will be passed to handler in order.
 * @param handler The handler to handle each task. It should returns a boolean value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
function queueSome(tasks, handler, concurrency) {
    return new Promise((resolve, reject) => {
        let q = new Queue({
            concurrency,
            tasks,
            handler
        });
        q.on('taskfinish', (_task, value) => {
            if (value) {
                resolve(true);
                q.clear();
            }
        });
        q.on('finish', () => resolve(false));
        q.on('error', reject);
        q.start();
    });
}
exports.queueSome = queueSome;
/**
 * Run tasks in queue, returns a promise which will be resolved if every tasks match handler.
 * @param tasks The task array which will be passed to handler in order.
 * @param handler The handler to handle each task. It should returns a boolean value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
function queueEvery(tasks, handler, concurrency) {
    return queueSome(tasks, async (task) => !(await handler(task)), concurrency).then(value => !value);
}
exports.queueEvery = queueEvery;
},{"./array":16,"./emitter":19,"./object":24}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//replace $0 to matches[0], $1 to matches[1]...
function replaceMatchTags(template, match) {
    return template.replace(/\$(?:([$&\d])|<(\w+)>)/g, (_m0, m1, m2) => {
        if (m2) {
            return match.groups ? match.groups[m2] || '' : '';
        }
        else if (m1 === '$') {
            return '$';
        }
        else if (m1 === '&') {
            return match[0];
        }
        else {
            return typeof match[m1] === 'string' ? match[m1] : '';
        }
    });
}
/**
 * Select sub matches from `string` by `re`, then format a `template` with sub matches. returns the format result or results.
 * @param string The string to select sub matches.
 * @param re The RegExp to execute on string.
 * @param template Replace `$i` or `$<name>` to corresponding match.
 */
function select(string, re, template) {
    if (re.global) {
        let match;
        let matches = [];
        while (match = re.exec(string)) {
            matches.push(replaceMatchTags(template, match));
        }
        return matches;
    }
    else {
        let match = string.match(re);
        if (match) {
            return replaceMatchTags(template, match);
        }
        else {
            return '';
        }
    }
}
exports.select = select;
/**
 * Returns specified index of sub match in `string` by executing `re`. Returns an array when `re` is global.
 * @param string The string to select sub match.
 * @param re The RegExp to execute on string.
 * @param index Select the sub match in the index from each match result or results.
 */
function subMatchAt(string, re, index = 0) {
    if (re.global) {
        let match;
        let matches = [];
        while (match = re.exec(string)) {
            matches.push(match[index] || '');
        }
        return matches;
    }
    else {
        let match = string.match(re);
        if (match) {
            return match[index] || '';
        }
        else {
            return '';
        }
    }
}
exports.subMatchAt = subMatchAt;
/**
 * Returns all sub matches in `string` by executing `re`. Returns an array that includes sub matches when `re` is global.
 * @param string The string to select sub matches.
 * @param re The RegExp to execute on string.
 * @param sliceIndex Slice each match results from, specify to 0 to include whole match, 1 to only include sub matches.
 */
function subMatches(string, re, sliceIndex = 1) {
    if (re.global) {
        let match;
        let matches = [];
        while (match = re.exec(string)) {
            matches.push([...match].slice(sliceIndex));
        }
        return matches;
    }
    else {
        let match = string.match(re);
        if (match) {
            return [...match].slice(sliceIndex);
        }
        else {
            return [];
        }
    }
}
exports.subMatches = subMatches;
/**
 * Format string to replace placeholders `${key}` in `template` to `source[key]`. will keep the placeholders if no match found.
 * @param template String to format
 * @param source The data source.
 */
function format(template, source) {
    return template.replace(/\$\{(\w+)\}/g, (m0, m1) => {
        let value = source[m1];
        if (value === undefined) {
            value = m0;
        }
        return value;
    });
}
exports.format = format;
/**
 * Get the left part of string before substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
 */
function before(string, substring, greedy = false) {
    let index = string.indexOf(substring);
    if (index < 0) {
        return greedy ? string : '';
    }
    else {
        return string.slice(0, index);
    }
}
exports.before = before;
/**
 * Get the right part of string before substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
 */
function after(string, substring, greedy = false) {
    let index = string.indexOf(substring);
    if (index < 0) {
        return greedy ? string : '';
    }
    else {
        return string.slice(index + substring.length);
    }
}
exports.after = after;
/**
 * Get the left part of string before the last substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
 */
function beforeLast(string, substring, greedy = false) {
    let index = string.lastIndexOf(substring);
    if (index < 0) {
        return greedy ? string : '';
    }
    else {
        return string.slice(0, index);
    }
}
exports.beforeLast = beforeLast;
/**
 * Get the right part of string before the last substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
 */
function afterLast(string, substring, greedy = false) {
    let index = string.lastIndexOf(substring);
    if (index < 0) {
        return greedy ? string : '';
    }
    else {
        return string.slice(index + 1);
    }
}
exports.afterLast = afterLast;
/**
 * Uppercase the first character.
 * @param string The string to be capitalized.
 */
function capitalize(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
}
exports.capitalize = capitalize;
/**
 * Transform the string to camer case type.
 * @param string The string to transform.
 */
function toCamerCase(string) {
    return string.replace(/[-_][a-z]/g, m0 => m0[1].toUpperCase());
}
exports.toCamerCase = toCamerCase;
/**
 * Transform the string to dash case by spliting words with `-`.
 * @param string The string to transform.
 */
function toDashCase(string) {
    return string.replace(/[A-Z]+/g, (m0, index) => {
        if (index > 0) {
            return '-' + m0.toLowerCase();
        }
        else {
            return m0.toLowerCase();
        }
    });
}
exports.toDashCase = toDashCase;
},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns a promise which will be resolved after `ms` milliseconds.
 * @param ms The sleep time in milliseconds.
 */
function sleep(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
},{}],28:[function(require,module,exports){
"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test align', () => {
    it('align with positions t | b | c | l | r', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 't');
        assert.equal(ff.getNumeric(div, 'left'), 250);
        assert.equal(ff.getNumeric(div, 'top'), 100);
        ff.align(div, target, 'b');
        assert.equal(ff.getNumeric(div, 'left'), 250);
        assert.equal(ff.getNumeric(div, 'top'), 400);
        ff.align(div, target, 'c');
        assert.equal(ff.getNumeric(div, 'left'), 250);
        assert.equal(ff.getNumeric(div, 'top'), 250);
        ff.align(div, target, 'l');
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.equal(ff.getNumeric(div, 'top'), 250);
        ff.align(div, target, 'r');
        assert.equal(ff.getNumeric(div, 'left'), 400);
        assert.equal(ff.getNumeric(div, 'top'), 250);
        div.remove();
        target.remove();
    });
    it('align with positions tl | tr | bl | br | lt | lb | rt | rb', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'tl');
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.equal(ff.getNumeric(div, 'top'), 100);
        ff.align(div, target, 'tr');
        assert.equal(ff.getNumeric(div, 'left'), 300);
        assert.equal(ff.getNumeric(div, 'top'), 100);
        ff.align(div, target, 'bl');
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.equal(ff.getNumeric(div, 'top'), 400);
        ff.align(div, target, 'br');
        assert.equal(ff.getNumeric(div, 'left'), 300);
        assert.equal(ff.getNumeric(div, 'top'), 400);
        ff.align(div, target, 'lt');
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.equal(ff.getNumeric(div, 'top'), 200);
        ff.align(div, target, 'lb');
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.equal(ff.getNumeric(div, 'top'), 300);
        ff.align(div, target, 'rt');
        assert.equal(ff.getNumeric(div, 'left'), 400);
        assert.equal(ff.getNumeric(div, 'top'), 200);
        ff.align(div, target, 'rb');
        assert.equal(ff.getNumeric(div, 'left'), 400);
        assert.equal(ff.getNumeric(div, 'top'), 300);
        div.remove();
        target.remove();
    });
    it('other aligns', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'b-t');
        assert.equal(ff.getNumeric(div, 'left'), 250);
        assert.equal(ff.getNumeric(div, 'top'), 100);
        div.remove();
        target.remove();
    });
    it('align with positions in corners', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'br-tl');
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.equal(ff.getNumeric(div, 'top'), 100);
        ff.align(div, target, 'bl-tr');
        assert.equal(ff.getNumeric(div, 'left'), 400);
        assert.equal(ff.getNumeric(div, 'top'), 100);
        ff.align(div, target, 'tl-br');
        assert.equal(ff.getNumeric(div, 'left'), 400);
        assert.equal(ff.getNumeric(div, 'top'), 400);
        ff.align(div, target, 'tr-bl');
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.equal(ff.getNumeric(div, 'top'), 400);
        div.remove();
        target.remove();
    });
    it('should align to opposite place when not enough space', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 50px; top: 50px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'tl');
        assert.equal(ff.getNumeric(div, 'left'), 50);
        assert.equal(ff.getNumeric(div, 'top'), 250);
        ff.align(div, target, 'lt');
        assert.equal(ff.getNumeric(div, 'left'), 250);
        assert.equal(ff.getNumeric(div, 'top'), 50);
        target.style.cssText = 'position: fixed; right: 50px; bottom: 50px; width: 200px; height: 200px;';
        ff.align(div, target, 'br');
        assert.closeTo(ff.getNumeric(div, 'left'), ff.getRect(target).right - ff.getRect(div).width, 1);
        assert.closeTo(ff.getNumeric(div, 'top'), ff.getRect(target).top - ff.getRect(div).height, 1);
        ff.align(div, target, 'rb');
        assert.closeTo(ff.getNumeric(div, 'left'), ff.getRect(target).left - ff.getRect(div).width, 1);
        assert.closeTo(ff.getNumeric(div, 'top'), ff.getRect(target).bottom - ff.getRect(div).height, 1);
        div.remove();
        target.remove();
    });
    it('should align trangle', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        div.innerHTML = '<div style="position: absolute; width: 20px; height: 20px; left: 0; bottom: -20px;"></div>';
        let trangle = div.firstElementChild;
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'tl', { trangle });
        assert.equal(ff.getNumeric(div, 'top'), 80);
        assert.equal(ff.getNumeric(trangle, 'left'), 40);
        ff.align(div, target, 'br', { trangle });
        assert.equal(ff.getNumeric(div, 'top'), 420);
        assert.equal(ff.getNumeric(trangle, 'left'), 40);
        assert.equal(ff.getNumeric(trangle, 'top'), -20);
        trangle.style.left = '-20px';
        ff.align(div, target, 'lt', { trangle });
        assert.equal(ff.getNumeric(div, 'left'), 80);
        assert.equal(ff.getNumeric(trangle, 'top'), 40);
        assert.equal(ff.getNumeric(trangle, 'right'), -20);
        ff.align(div, target, 'rb', { trangle });
        assert.equal(ff.getNumeric(div, 'left'), 420);
        assert.equal(ff.getNumeric(trangle, 'top'), 40);
        div.remove();
        target.remove();
    });
    it('should align trangle to the middle of target when target is smaller than el', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 200px; height: 200px;';
        div.innerHTML = '<div style="position: absolute; width: 20px; height: 20px; left: 0; bottom: -20px;"></div>';
        let trangle = div.firstElementChild;
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 300px; top: 300px; width: 100px; height: 100px;';
        document.body.append(div, target);
        ff.align(div, target, 'tl', { trangle });
        assert.equal(ff.getNumeric(div, 'top'), 80);
        assert.equal(ff.getNumeric(trangle, 'left'), 40);
        assert.equal(trangle.style.transform, '');
        ff.align(div, target, 'br', { trangle });
        assert.equal(ff.getNumeric(div, 'top'), 420);
        assert.equal(ff.getNumeric(trangle, 'left'), 140);
        assert.equal(ff.getNumeric(trangle, 'top'), -20);
        assert.equal(trangle.style.transform, 'rotateX(180deg)');
        trangle.style.top = '-20px';
        trangle.style.bottom = '';
        ff.align(div, target, 'tl', { trangle });
        assert.equal(trangle.style.transform, 'rotateX(180deg)');
        trangle.style.top = '-20px';
        trangle.style.bottom = '';
        ff.align(div, target, 'br', { trangle });
        assert.equal(trangle.style.transform, '');
        trangle.style.left = '-20px';
        ff.align(div, target, 'lt', { trangle });
        assert.equal(ff.getNumeric(div, 'left'), 80);
        assert.equal(ff.getNumeric(trangle, 'top'), 40);
        assert.equal(ff.getNumeric(trangle, 'right'), -20);
        assert.equal(trangle.style.transform, 'rotateY(180deg)');
        trangle.style.left = '-20px';
        trangle.style.right = '';
        ff.align(div, target, 'rb', { trangle });
        assert.equal(ff.getNumeric(div, 'left'), 420);
        assert.equal(ff.getNumeric(trangle, 'top'), 140);
        assert.equal(trangle.style.transform, '');
        div.remove();
        target.remove();
    });
    it('should set overflow when el is too high and canOverflowY set', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; overflow: auto;';
        div.innerHTML = '<div style="width: 100px; height: 1000px;"></div>';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'tl', { canShrinkInY: true });
        assert.equal(ff.getNumeric(div, 'top'), 400);
        assert.isBelow(ff.getNumeric(div, 'height'), 1000);
        div.scrollTop = 100;
        ff.align(div, target, 'br', { canShrinkInY: true });
        assert.equal(ff.getNumeric(div, 'top'), 400);
        assert.isBelow(ff.getNumeric(div, 'height'), 1000);
        assert.equal(div.scrollTop, 100);
        div.remove();
        target.remove();
    });
    it('should set overflow when el is too high and canOverflowY set and will align top', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; overflow: auto;';
        div.innerHTML = '<div style="width: 100px; height: 1000px;"></div>';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; bottom: 100px; right: 100px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'tl', { canShrinkInY: true });
        assert.equal(ff.getNumeric(div, 'top'), 0);
        assert.isBelow(ff.getNumeric(div, 'height'), 1000);
        div.scrollTop = 100;
        ff.align(div, target, 'br', { canShrinkInY: true });
        assert.equal(ff.getNumeric(div, 'top'), 0);
        assert.isBelow(ff.getNumeric(div, 'height'), 1000);
        assert.equal(div.scrollTop, 100);
        div.remove();
        target.remove();
    });
    it('should throw when position is not correct', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        assert.throw(() => ff.align(div, target, 'tll'));
        div.remove();
        target.remove();
    });
    it('should align when el is absolute position', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: absolute; width: 100px; height: 100px; left: 100px; top: 100px;';
        div.innerHTML = '<div style="position: absolute; width: 100px; height: 100px;"></div>';
        let child = div.firstElementChild;
        let target = document.createElement('div');
        target.style.cssText = 'position: absolute; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(child, target, 'tl');
        assert.equal(ff.getNumeric(child, 'left'), 100);
        assert.equal(ff.getNumeric(child, 'top'), 0);
        div.remove();
        target.remove();
    });
    it('should add margin', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        let target = document.createElement('div');
        target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;';
        document.body.append(div, target);
        ff.align(div, target, 'tl', { margin: 20 });
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.equal(ff.getNumeric(div, 'top'), 80);
        div.remove();
        target.remove();
    });
    it('should align event', () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        document.body.append(div);
        let event = new MouseEvent('mousedown', {
            clientX: 100,
            clientY: 100,
        });
        ff.alignToEvent(div, event, [10, 10]);
        assert.equal(ff.getNumeric(div, 'left'), 110);
        assert.equal(ff.getNumeric(div, 'top'), 110);
        div.remove();
    });
});
},{"../../../src":15}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test animate', () => {
    it('animateProperty', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0';
        document.body.append(div);
        let d = Date.now();
        await ff.animateProperty(div, 'left', 0, 100, 100).promise;
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.closeTo(Date.now() - d, 100, 50);
        d = Date.now();
        await ff.animatePropertyTo(div, 'left', 200, 100).promise;
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.closeTo(Date.now() - d, 100, 50);
        d = Date.now();
        await ff.animatePropertyFrom(div, 'left', 100, 100).promise;
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.closeTo(Date.now() - d, 100, 50);
        assert.isBelow(ff.getEasingFunction('ease-in')(0.5), ff.getEasingFunction('linear')(0.5));
        assert.isAbove(ff.getEasingFunction('ease-out')(0.5), ff.getEasingFunction('linear')(0.5));
        div.remove();
    });
    it('animateByFunction', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0';
        document.body.append(div);
        let d = Date.now();
        await ff.animateByFunction((value) => { ff.setStyle(div, 'left', value); }, 0, 100, 100).promise;
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.closeTo(Date.now() - d, 100, 50);
        d = Date.now();
        await ff.animateByFunction((value) => { ff.setStyle(div, 'left', value); }, 100, 200, 100).promise;
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.closeTo(Date.now() - d, 100, 50);
        d = Date.now();
        await ff.animateByFunction((value) => { ff.setStyle(div, 'left', value); }, 200, 100, 100).promise;
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.closeTo(Date.now() - d, 100, 50);
        div.remove();
    });
    it('animate', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0';
        document.body.append(div);
        let d = Date.now();
        await ff.animate(div, { left: 0 }, { left: 100 }, 100);
        assert.equal(ff.getNumeric(div, 'left'), 0);
        assert.closeTo(Date.now() - d, 100, 50);
        d = Date.now();
        await ff.animateTo(div, { left: 200 }, 100);
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.closeTo(Date.now() - d, 100, 50);
        d = Date.now();
        await ff.animateFrom(div, { left: 100 }, 100);
        assert.equal(ff.getNumeric(div, 'left'), 200);
        assert.closeTo(Date.now() - d, 100, 50);
        div.remove();
    });
});
},{"../../../src":15}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test css', () => {
    it('getNumeric', () => {
        assert.equal(ff.getNumeric(document.body, 'width'), parseFloat(getComputedStyle(document.body).width));
        assert.equal(ff.getNumeric(document.body, 'display'), 0);
    });
    it('setCSS', () => {
        let div = document.createElement('div');
        document.body.appendChild(div);
        ff.setStyle(div, 'width', '1000px');
        assert.equal(div.style.width, '1000px');
        ff.setStyle(div, { width: 1200, height: 100 });
        assert.equal(div.style.width, '1200px');
        assert.equal(div.style.height, '100px');
        div.remove();
    });
});
},{"../../../src":15}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test draggable', () => {
    it('setDraggable', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;';
        document.body.append(div);
        ff.setDraggable(div);
        let mouseDownEvent = new MouseEvent('mousedown', {
            clientX: 50,
            clientY: 50,
        });
        div.dispatchEvent(mouseDownEvent);
        let mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            clientX: 150,
            clientY: 150,
        });
        div.dispatchEvent(mouseMoveEvent);
        assert.equal(ff.getNumeric(div, 'left'), 100);
        assert.equal(ff.getNumeric(div, 'top'), 100);
        mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            clientX: -50,
            clientY: -50,
        });
        div.dispatchEvent(mouseMoveEvent);
        assert.equal(ff.getNumeric(div, 'left'), 0);
        assert.equal(ff.getNumeric(div, 'top'), 0);
        let mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
        });
        div.dispatchEvent(mouseUpEvent);
        div.remove();
    });
});
},{"../../../src":15}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Works like jest.fn */
function fn(handler = function () { }) {
    let calls = [];
    let returns = [];
    function mockFn(...args) {
        calls.push(args);
        let returned = handler.call(this, ...args);
        returns.push(returned);
        return returned;
    }
    mockFn.mock = {
        calls,
        returns,
    };
    return mockFn;
}
exports.fn = fn;
},{}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const helper = require("./helper");
const assert = chai.assert;
let mouseEnter = (el) => {
    let event = new MouseEvent('mouseenter');
    el.dispatchEvent(event);
};
let mouseLeave = (el) => {
    let event = new MouseEvent('mouseleave');
    el.dispatchEvent(event);
};
describe('Test onMouseLeaveAll', () => {
    it('onMouseLeaveAll', async () => {
        let fn = helper.fn();
        let div1 = document.createElement('div');
        div1.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;';
        document.body.append(div1);
        let div2 = document.createElement('div');
        div2.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;';
        document.body.append(div2);
        ff.onMouseLeaveAll([div1, div2], fn);
        mouseEnter(div1);
        await ff.sleep(100);
        mouseLeave(div1);
        await ff.sleep(100);
        mouseEnter(div2);
        await ff.sleep(100);
        mouseLeave(div2);
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 0);
        await new Promise(resolve => setTimeout(resolve, 150));
        assert.equal(fn.mock.calls.length, 1);
        div1.remove();
        div2.remove();
    });
    it('onceMouseLeaveAll', async () => {
        let calledTimes = 0;
        let fn = () => {
            calledTimes++;
        };
        let div1 = document.createElement('div');
        div1.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;';
        document.body.append(div1);
        ff.onceMouseLeaveAll([div1], fn);
        mouseEnter(div1);
        mouseLeave(div1);
        await new Promise(resolve => setTimeout(resolve, 200));
        assert.equal(calledTimes, 1);
        await new Promise(resolve => setTimeout(resolve, 200));
        assert.equal(calledTimes, 1);
        div1.remove();
    });
});
},{"../../../src":15,"./helper":32}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test node', () => {
    it('nodeIndex & elementIndex', () => {
        assert.equal(ff.nodeIndex(document.body), [...document.documentElement.childNodes].indexOf(document.body));
        assert.equal(ff.elementIndex(document.body), [...document.documentElement.children].indexOf(document.body));
    });
    it('innerWidth & innerHeight', () => {
        let div = document.createElement('div');
        div.style.cssText = 'width: 1000px; height: 100px; margin: 10px; padding: 10px;';
        document.body.appendChild(div);
        assert.equal(ff.innerWidth(div), 980);
        assert.equal(ff.innerHeight(div), 80);
        div.style.overflow = 'scroll';
        assert.equal(ff.innerWidth(div), 980 - ff.getScrollbarWidth());
        assert.equal(ff.innerHeight(div), 80 - ff.getScrollbarWidth());
        div.remove();
    });
    it('outerWidth & outerHeight', () => {
        let div = document.createElement('div');
        div.style.cssText = 'width: 1000px; height: 100px; margin: 10px; padding: 10px;';
        document.body.appendChild(div);
        assert.equal(ff.outerWidth(div), 1020);
        assert.equal(ff.outerHeight(div), 120);
        div.remove();
    });
    it('getRect', () => {
        document.body.style.height = '120%';
        let rect = document.body.getBoundingClientRect();
        let rectObj = {
            bottom: rect.bottom,
            height: rect.height,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            width: rect.width,
        };
        assert.deepEqual(ff.getRect(document.body), rectObj);
        assert.deepEqual(ff.getRect(document.documentElement).width, document.documentElement.clientWidth);
        assert.deepEqual(ff.getRect(document.documentElement).height, document.documentElement.clientHeight);
        document.body.style.height = '';
    });
    it('isInview', () => {
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0';
        document.body.appendChild(div);
        assert.equal(ff.isInview(div), true);
        div.style.top = 'calc(100%)';
        assert.equal(ff.isInview(div), false);
        div.style.top = 'calc(100% - 50px)';
        assert.equal(ff.isInview(div, 0.4), true);
        assert.equal(ff.isInview(div, 0.6), false);
        div.remove();
    });
});
},{"../../../src":15}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test query', () => {
    it('parseQuery', () => {
        assert.deepEqual(ff.parseQuery('http://www.example.com?a=b&c=d&e='), {
            a: 'b',
            c: 'd',
            e: ''
        });
    });
    it('useQuery', () => {
        assert.deepEqual(ff.useQuery('http://www.example.com', { a: 'b' }), 'http://www.example.com?a=b');
        assert.deepEqual(ff.useQuery('http://www.example.com?a=b', { c: 'd', e: '' }), 'http://www.example.com?a=b&c=d&e=');
    });
});
},{"../../../src":15}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test scroll', () => {
    it('hasScrollbar', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        div.innerHTML = '<div style="height: 200px;"></div>';
        document.body.append(div);
        assert.equal(ff.isContentOverflow(div), true);
        div.innerHTML = '';
        assert.equal(ff.isContentOverflow(div), false);
        div.remove();
    });
    it('getClosestScroller', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        div.innerHTML = '<div style="height: 200px;"></div>';
        document.body.append(div);
        assert.equal(ff.getClosestScrollWrapper(div), div);
        assert.equal(ff.getClosestScrollWrapper(div.firstElementChild), div);
        div.remove();
    });
    it('scrollIntoView when content is not very high', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px; overflow: auto;';
        div.innerHTML = `
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
		`;
        document.body.append(div);
        ff.scrollToView(div.children[3]);
        assert.equal(div.scrollTop, 100);
        ff.scrollToView(div.children[1]);
        assert.equal(div.scrollTop, 50);
        div.remove();
    });
    it('scrollIntoView when content is very high', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px; overflow: auto;';
        div.innerHTML = `
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
		`;
        document.body.append(div);
        ff.scrollToView(div.lastElementChild);
        assert.equal(div.scrollTop, 400);
        ff.scrollToView(div.firstElementChild);
        assert.equal(div.scrollTop, 100);
        div.remove();
    });
    it('getScrollDirection', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        document.body.append(div);
        div.innerHTML = `<div style="width: 200px; height: 100px;"></div>`;
        assert.equal(ff.getScrollDirection(div), 'x');
        div.innerHTML = `<div style="width: 100px; height: 200px;"></div>`;
        assert.equal(ff.getScrollDirection(div), 'y');
        div.remove();
    });
    it('getScrollOffset', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px;';
        document.body.append(div);
        div.innerHTML = `<div style="width: 200px; height: 100px;"></div>`;
        div.scrollLeft = 100;
        assert.equal(ff.getScrollOffset(div.firstElementChild, div, 'x'), 0);
        div.remove();
    });
    it('scrollToTop', async () => {
        let div = document.createElement('div');
        div.style.cssText = 'position: fixed; width: 100px; height: 100px; overflow: auto;';
        div.innerHTML = `
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
		`;
        document.body.append(div);
        ff.scrollToTop(div.lastElementChild);
        assert.equal(div.scrollTop, 400);
        ff.scrollToTop(div.firstElementChild);
        assert.equal(div.scrollTop, 0);
        div.remove();
    });
});
},{"../../../src":15}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const assert = chai.assert;
describe('Test storage', () => {
    it('storage', () => {
        assert.equal(ff.storage.isSupported(), true);
        assert.equal(ff.storage.set('a', 'b'), true);
        assert.equal(ff.storage.get('a'), 'b');
        assert.equal(ff.storage.has('a'), true);
        assert.equal(ff.storage.delete('a'), true);
        assert.equal(ff.storage.has('a'), false);
    });
});
},{"../../../src":15}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ff = require("../../../src");
const helper = require("./helper");
const assert = chai.assert;
describe('Test watch', () => {
    it('watch immediate', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0';
        document.body.append(div);
        let cancelWatch = ff.watch(div, 'show', fn, true);
        assert.equal(fn.mock.calls.length, 1);
        div.remove();
        cancelWatch();
    });
    it('watch show', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0; display: none';
        document.body.append(div);
        let cancelWatch = ff.watch(div, 'show', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.display = 'block';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.equal(fn.mock.calls[0][0], true);
        div.style.display = 'none';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 2);
        assert.equal(fn.mock.calls[1][0], false);
        div.remove();
        cancelWatch();
    });
    it('watch show once', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0; display: none';
        document.body.append(div);
        let cancelWatch = ff.watchOnce(div, 'show', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.display = 'block';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.equal(fn.mock.calls[0][0], true);
        div.style.display = 'none';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        div.remove();
        cancelWatch();
    });
    it('watch until and trigger immediate', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0';
        document.body.append(div);
        let cancelWatch = ff.watchUntil(div, 'show', fn);
        assert.equal(fn.mock.calls.length, 1);
        div.remove();
        cancelWatch();
    });
    it('watch until', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0; display: none';
        document.body.append(div);
        let cancelWatch = ff.watchUntil(div, 'show', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.display = 'block';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.equal(fn.mock.calls[0][0], true);
        div.style.display = 'none';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        div.remove();
        cancelWatch();
    });
    it('watch hide', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;';
        document.body.append(div);
        let cancelWatch = ff.watch(div, 'hide', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.display = 'none';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.equal(fn.mock.calls[0][0], true);
        div.remove();
        cancelWatch();
    });
    it('watch inview', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: -100px; top: -100px;';
        document.body.append(div);
        let cancelWatch = ff.watch(div, 'inview', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.left = '0';
        div.style.top = '0';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.equal(fn.mock.calls[0][0], true);
        div.remove();
        cancelWatch();
    });
    it('watch outview', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;';
        document.body.append(div);
        let cancelWatch = ff.watch(div, 'outview', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.left = '-100px';
        div.style.top = '-100px';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.equal(fn.mock.calls[0][0], true);
        div.remove();
        cancelWatch();
    });
    it('watch size', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;';
        document.body.append(div);
        let cancelWatch = ff.watch(div, 'size', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.width = '200px';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.deepEqual(fn.mock.calls[0][0], { width: 200, height: 100 });
        div.style.height = '200px';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 2);
        assert.deepEqual(fn.mock.calls[1][0], { width: 200, height: 200 });
        div.remove();
        cancelWatch();
    });
    it('watch rect', async () => {
        let fn = helper.fn();
        let div = document.createElement('div');
        div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;';
        document.body.append(div);
        let cancelWatch = ff.watch(div, 'rect', fn);
        assert.equal(fn.mock.calls.length, 0);
        div.style.width = '200px';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 1);
        assert.deepEqual(fn.mock.calls[0][0].width, 200);
        div.style.height = '200px';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 2);
        assert.deepEqual(fn.mock.calls[1][0].height, 200);
        div.style.left = '100px';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 3);
        assert.deepEqual(fn.mock.calls[2][0].left, 100);
        div.style.top = '100px';
        await ff.sleep(100);
        assert.equal(fn.mock.calls.length, 4);
        assert.deepEqual(fn.mock.calls[3][0].top, 100);
        div.remove();
        cancelWatch();
    });
});
},{"../../../src":15,"./helper":32}]},{},[28,29,30,31,33,34,35,36,37,38])
//# sourceMappingURL=bundle.js.map
