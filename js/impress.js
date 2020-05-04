(function(document, window) {
	"use strict";
	var lib;
	var pfx = (function() {
		var style = document.createElement("dummy").style,
			prefixes = "Webkit Moz O ms Khtml".split(" "),
			memory = {};
		return function(prop) {
			if (typeof memory[prop] === "undefined") {
				var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1),
					props = (prop + " " + prefixes.join(ucProp + " ") + ucProp).split(" ");
				memory[prop] = null;
				for (var i in props) {
					if (style[props[i]] !== undefined) {
						memory[prop] = props[i];
						break
					}
				}
			}
			return memory[prop]
		}
	})();
	var validateOrder = function(order, fallback) {
		var validChars = "xyz";
		var returnStr = "";
		if (typeof order === "string") {
			for (var i in order.split("")) {
				if (validChars.indexOf(order[i]) >= 0) {
					returnStr += order[i];
					validChars = validChars.split(order[i]).join("")
				}
			}
		}
		if (returnStr) {
			return returnStr
		} else if (fallback !== undefined) {
			return fallback
		} else {
			return "xyz"
		}
	};
	var css = function(el, props) {
		var key, pkey;
		for (key in props) {
			if (props.hasOwnProperty(key)) {
				pkey = pfx(key);
				if (pkey !== null) {
					el.style[pkey] = props[key]
				}
			}
		}
		return el
	};
	var translate = function(t) {
		return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) "
	};
	var rotate = function(r, revert) {
		var order = r.order ? r.order : "xyz";
		var css = "";
		var axes = order.split("");
		if (revert) {
			axes = axes.reverse()
		}
		for (var i = 0; i < axes.length; i++) {
			css += " rotate" + axes[i].toUpperCase() + "(" + r[axes[i]] + "deg)"
		}
		return css
	};
	var scale = function(s) {
		return " scale(" + s + ") "
	};
	var computeWindowScale = function(config) {
		var hScale = window.innerHeight / config.height,
			wScale = window.innerWidth / config.width,
			scale = hScale > wScale ? wScale : hScale;
		if (config.maxScale && scale > config.maxScale) {
			scale = config.maxScale
		}
		if (config.minScale && scale < config.minScale) {
			scale = config.minScale
		}
		return scale
	};
	var body = document.getElementById("impress-container");
	var impressSupported = (pfx("perspective") !== null) && (body.classList) && (body.dataset);
	if (!impressSupported) {
		body.className += " impress-not-supported "
	}
	var roots = {};
	var preInitPlugins = [];
	var preStepLeavePlugins = [];
	var defaults = {
		width: 1024,
		height: 768,
		maxScale: 1,
		minScale: 0,
		perspective: 1000,
		transitionDuration: 1000
	};
	var empty = function() {
		return false
	};
	var impress = window.impress = function(rootId) {
		if (!impressSupported) {
			return {
				init: empty,
				goto: empty,
				prev: empty,
				next: empty,
				swipe: empty,
				tear: empty,
				lib: {}
			}
		}
		rootId = rootId || "impress";
		if (roots["impress-root-" + rootId]) {
			return roots["impress-root-" + rootId]
		}
		lib = initLibraries(rootId);
		body.classList.remove("impress-not-supported");
		body.classList.add("impress-supported");
		var stepsData = {};
		var activeStep = null;
		var currentState = null;
		var steps = null;
		var config = null;
		var windowScale = null;
		var root = lib.util.byId(rootId);
		var canvas = document.createElement("div");
		var initialized = false;
		var lastEntered = null;
		var onStepEnter = function(step) {
			if (lastEntered !== step) {
				lib.util.triggerEvent(step, "impress:stepenter");
				lastEntered = step
			}
			lib.util.triggerEvent(step, "impress:steprefresh")
		};
		var onStepLeave = function(currentStep, nextStep) {
			if (lastEntered === currentStep) {
				lib.util.triggerEvent(currentStep, "impress:stepleave", {
					next: nextStep
				});
				lastEntered = null
			}
		};
		var initStep = function(el, idx) {
			var data = el.dataset,
				step = {
					translate: {
						x: lib.util.toNumber(data.x),
						y: lib.util.toNumber(data.y),
						z: lib.util.toNumber(data.z)
					},
					rotate: {
						x: lib.util.toNumber(data.rotateX),
						y: lib.util.toNumber(data.rotateY),
						z: lib.util.toNumber(data.rotateZ || data.rotate),
						order: validateOrder(data.rotateOrder)
					},
					scale: lib.util.toNumber(data.scale, 1),
					transitionDuration: lib.util.toNumber(data.transitionDuration, config.transitionDuration),
					el: el
				};
			if (!el.id) {
				el.id = "step-" + (idx + 1)
			}
			stepsData["impress-" + el.id] = step;
			css(el, {
				position: "absolute",
				transform: "translate(-50%,-50%)" + translate(step.translate) + rotate(step.rotate) + scale(step.scale),
				transformStyle: "preserve-3d"
			})
		};
		var initAllSteps = function() {
			steps = lib.util.$$(".step", root);
			steps.forEach(initStep)
		};
		var init = function() {
			if (initialized) {
				return
			}
			execPreInitPlugins(root);
			var meta = lib.util.$("meta[name='viewport']") || document.createElement("meta");
			meta.content = "width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no";
			if (meta.parentNode !== document.head) {
				meta.name = "viewport";
				document.head.appendChild(meta)
			}
			var rootData = root.dataset;
			config = {
				width: lib.util.toNumber(rootData.width, defaults.width),
				height: lib.util.toNumber(rootData.height, defaults.height),
				maxScale: lib.util.toNumber(rootData.maxScale, defaults.maxScale),
				minScale: lib.util.toNumber(rootData.minScale, defaults.minScale),
				perspective: lib.util.toNumber(rootData.perspective, defaults.perspective),
				transitionDuration: lib.util.toNumber(rootData.transitionDuration, defaults.transitionDuration)
			};
			windowScale = computeWindowScale(config);
			lib.util.arrayify(root.childNodes).forEach(function(el) {
				canvas.appendChild(el)
			});
			root.appendChild(canvas);
			document.documentElement.style.height = "100%";
			css(body, {
				height: "100%",
				overflow: "hidden"
			});
			var rootStyles = {
				position: "absolute",
				transformOrigin: "top left",
				transition: "all 0s ease-in-out",
				transformStyle: "preserve-3d"
			};
			css(root, rootStyles);
			css(root, {
				top: "50%",
				left: "50%",
				perspective: (config.perspective / windowScale) + "px",
				transform: scale(windowScale)
			});
			css(canvas, rootStyles);
			body.classList.remove("impress-disabled");
			body.classList.add("impress-enabled");
			initAllSteps();
			currentState = {
				translate: {
					x: 0,
					y: 0,
					z: 0
				},
				rotate: {
					x: 0,
					y: 0,
					z: 0,
					order: "xyz"
				},
				scale: 1
			};
			initialized = true;
			lib.util.triggerEvent(root, "impress:init", {
				api: roots["impress-root-" + rootId]
			})
		};
		var getStep = function(step) {
			if (typeof step === "number") {
				step = step < 0 ? steps[steps.length + step] : steps[step]
			} else if (typeof step === "string") {
				step = lib.util.byId(step)
			}
			return (step && step.id && stepsData["impress-" + step.id]) ? step : null
		};
		var stepEnterTimeout = null;
		var goto = function(el, duration, reason, origEvent) {
			reason = reason || "goto";
			origEvent = origEvent || null;
			if (!initialized) {
				return false
			}
			initAllSteps();
			if (!(el = getStep(el))) {
				return false
			}
			window.scrollTo(0, 0);
			var step = stepsData["impress-" + el.id];
			duration = (duration !== undefined ? duration : step.transitionDuration);
			if (activeStep && activeStep !== el) {
				var event = {
					target: activeStep,
					detail: {}
				};
				event.detail.next = el;
				event.detail.transitionDuration = duration;
				event.detail.reason = reason;
				if (origEvent) {
					event.origEvent = origEvent
				}
				if (execPreStepLeavePlugins(event) === false) {
					return false
				}
				el = event.detail.next;
				step = stepsData["impress-" + el.id];
				duration = event.detail.transitionDuration
			}
			if (activeStep) {
				activeStep.classList.remove("active");
				body.classList.remove("impress-on-" + activeStep.id)
			}
			el.classList.add("active");
			body.classList.add("impress-on-" + el.id);
			var target = {
				rotate: {
					x: -step.rotate.x,
					y: -step.rotate.y,
					z: -step.rotate.z,
					order: step.rotate.order
				},
				translate: {
					x: -step.translate.x,
					y: -step.translate.y,
					z: -step.translate.z
				},
				scale: 1 / step.scale
			};
			var zoomin = target.scale >= currentState.scale;
			duration = lib.util.toNumber(duration, config.transitionDuration);
			var delay = (duration / 2);
			if (el === activeStep) {
				windowScale = computeWindowScale(config)
			}
			var targetScale = target.scale * windowScale;
			if (activeStep && activeStep !== el) {
				onStepLeave(activeStep, el)
			}
			css(root, {
				perspective: (config.perspective / targetScale) + "px",
				transform: scale(targetScale),
				transitionDuration: duration + "ms",
				transitionDelay: (zoomin ? delay : 0) + "ms"
			});
			css(canvas, {
				transform: rotate(target.rotate, true) + translate(target.translate),
				transitionDuration: duration + "ms",
				transitionDelay: (zoomin ? 0 : delay) + "ms"
			});
			if (currentState.scale === target.scale || (currentState.rotate.x === target.rotate.x && currentState.rotate.y === target.rotate.y && currentState.rotate.z === target.rotate.z && currentState.translate.x === target.translate.x && currentState.translate.y === target.translate.y && currentState.translate.z === target.translate.z)) {
				delay = 0
			}
			currentState = target;
			activeStep = el;
			window.clearTimeout(stepEnterTimeout);
			stepEnterTimeout = window.setTimeout(function() {
				onStepEnter(activeStep)
			}, duration + delay);
			return el
		};
		var prev = function(origEvent) {
			var prev = steps.indexOf(activeStep) - 1;
			prev = prev >= 0 ? steps[prev] : steps[steps.length - 1];
			return goto(prev, undefined, "prev", origEvent)
		};
		var next = function(origEvent) {
			var next = steps.indexOf(activeStep) + 1;
			next = next < steps.length ? steps[next] : steps[0];
			return goto(next, undefined, "next", origEvent)
		};
		var interpolate = function(a, b, k) {
			return a + (b - a) * k
		};
		var swipe = function(pct) {
			if (Math.abs(pct) > 1) {
				return
			}
			var event = {
				target: activeStep,
				detail: {}
			};
			event.detail.swipe = pct;
			event.detail.transitionDuration = config.transitionDuration;
			var idx;
			if (pct < 0) {
				idx = steps.indexOf(activeStep) + 1;
				event.detail.next = idx < steps.length ? steps[idx] : steps[0];
				event.detail.reason = "next"
			} else if (pct > 0) {
				idx = steps.indexOf(activeStep) - 1;
				event.detail.next = idx >= 0 ? steps[idx] : steps[steps.length - 1];
				event.detail.reason = "prev"
			} else {
				return
			}
			if (execPreStepLeavePlugins(event) === false) {
				return false
			}
			var nextElement = event.detail.next;
			var nextStep = stepsData["impress-" + nextElement.id];
			var nextScale = nextStep.scale * windowScale;
			var k = Math.abs(pct);
			var interpolatedStep = {
				translate: {
					x: interpolate(currentState.translate.x, -nextStep.translate.x, k),
					y: interpolate(currentState.translate.y, -nextStep.translate.y, k),
					z: interpolate(currentState.translate.z, -nextStep.translate.z, k)
				},
				rotate: {
					x: interpolate(currentState.rotate.x, -nextStep.rotate.x, k),
					y: interpolate(currentState.rotate.y, -nextStep.rotate.y, k),
					z: interpolate(currentState.rotate.z, -nextStep.rotate.z, k),
					order: k < 0.7 ? currentState.rotate.order : nextStep.rotate.order
				},
				scale: interpolate(currentState.scale * windowScale, nextScale, k)
			};
			css(root, {
				perspective: config.perspective / interpolatedStep.scale + "px",
				transform: scale(interpolatedStep.scale),
				transitionDuration: "0ms",
				transitionDelay: "0ms"
			});
			css(canvas, {
				transform: rotate(interpolatedStep.rotate, true) + translate(interpolatedStep.translate),
				transitionDuration: "0ms",
				transitionDelay: "0ms"
			})
		};
		var tear = function() {
			lib.gc.teardown();
			delete roots["impress-root-" + rootId]
		};
		lib.gc.addEventListener(root, "impress:init", function() {
			steps.forEach(function(step) {
				step.classList.add("future")
			});
			lib.gc.addEventListener(root, "impress:stepenter", function(event) {
				event.target.classList.remove("past");
				event.target.classList.remove("future");
				event.target.classList.add("present")
			}, false);
			lib.gc.addEventListener(root, "impress:stepleave", function(event) {
				event.target.classList.remove("present");
				event.target.classList.add("past")
			}, false)
		}, false);
		lib.gc.addEventListener(root, "impress:init", function() {
			var lastHash = "";
			lib.gc.addEventListener(root, "impress:stepenter", function(event) {
				window.location.hash = lastHash = "#/" + event.target.id
			}, false);
			lib.gc.addEventListener(window, "hashchange", function() {
				if (window.location.hash !== lastHash) {
					goto(lib.util.getElementFromHash())
				}
			}, false);
			goto(lib.util.getElementFromHash() || steps[0], 0)
		}, false);
		body.classList.add("impress-disabled");
		return (roots["impress-root-" + rootId] = {
			init: init,
			goto: goto,
			next: next,
			prev: prev,
			swipe: swipe,
			tear: tear,
			lib: lib
		})
	};
	impress.supported = impressSupported;
	var libraryFactories = {};
	impress.addLibraryFactory = function(obj) {
		for (var libname in obj) {
			if (obj.hasOwnProperty(libname)) {
				libraryFactories[libname] = obj[libname]
			}
		}
	};
	var initLibraries = function(rootId) {
		var lib = {};
		for (var libname in libraryFactories) {
			if (libraryFactories.hasOwnProperty(libname)) {
				if (lib[libname] !== undefined) {
					throw "impress.js ERROR: Two libraries both tried to use libname: " + libname;
				}
				lib[libname] = libraryFactories[libname](rootId)
			}
		}
		return lib
	};
	impress.addPreInitPlugin = function(plugin, weight) {
		weight = parseInt(weight) || 10;
		if (weight <= 0) {
			throw "addPreInitPlugin: weight must be a positive integer";
		}
		if (preInitPlugins[weight] === undefined) {
			preInitPlugins[weight] = []
		}
		preInitPlugins[weight].push(plugin)
	};
	var execPreInitPlugins = function(root) {
		for (var i = 0; i < preInitPlugins.length; i++) {
			var thisLevel = preInitPlugins[i];
			if (thisLevel !== undefined) {
				for (var j = 0; j < thisLevel.length; j++) {
					thisLevel[j](root)
				}
			}
		}
	};
	impress.addPreStepLeavePlugin = function(plugin, weight) {
		weight = parseInt(weight) || 10;
		if (weight <= 0) {
			throw "addPreStepLeavePlugin: weight must be a positive integer";
		}
		if (preStepLeavePlugins[weight] === undefined) {
			preStepLeavePlugins[weight] = []
		}
		preStepLeavePlugins[weight].push(plugin)
	};
	var execPreStepLeavePlugins = function(event) {
		for (var i = 0; i < preStepLeavePlugins.length; i++) {
			var thisLevel = preStepLeavePlugins[i];
			if (thisLevel !== undefined) {
				for (var j = 0; j < thisLevel.length; j++) {
					if (thisLevel[j](event) === false) {
						return false
					}
				}
			}
		}
	}
})(document, window);
(function(document, window) {
	"use strict";
	var roots = [];
	var rootsCount = 0;
	var startingState = {
		roots: []
	};
	var libraryFactory = function(rootId) {
		if (roots[rootId]) {
			return roots[rootId]
		}
		var elementList = [];
		var eventListenerList = [];
		var callbackList = [];
		recordStartingState(rootId);
		var pushElement = function(element) {
			elementList.push(element)
		};
		var appendChild = function(parent, element) {
			parent.appendChild(element);
			pushElement(element)
		};
		var pushEventListener = function(target, type, listenerFunction) {
			eventListenerList.push({
				target: target,
				type: type,
				listener: listenerFunction
			})
		};
		var addEventListener = function(target, type, listenerFunction) {
			target.addEventListener(type, listenerFunction);
			pushEventListener(target, type, listenerFunction)
		};
		var pushCallback = function(callback) {
			callbackList.push(callback)
		};
		pushCallback(function(rootId) {
			resetStartingState(rootId)
		});
		var teardown = function() {
			var i;
			for (i = callbackList.length - 1; i >= 0; i--) {
				callbackList[i](rootId)
			}
			callbackList = [];
			for (i = 0; i < elementList.length; i++) {
				elementList[i].parentElement.removeChild(elementList[i])
			}
			elementList = [];
			for (i = 0; i < eventListenerList.length; i++) {
				var target = eventListenerList[i].target;
				var type = eventListenerList[i].type;
				var listener = eventListenerList[i].listener;
				target.removeEventListener(type, listener)
			}
		};
		var lib = {
			pushElement: pushElement,
			appendChild: appendChild,
			pushEventListener: pushEventListener,
			addEventListener: addEventListener,
			pushCallback: pushCallback,
			teardown: teardown
		};
		roots[rootId] = lib;
		rootsCount++;
		return lib
	};
	window.impress.addLibraryFactory({
		gc: libraryFactory
	});
	var recordStartingState = function(rootId) {
		startingState.roots[rootId] = {};
		startingState.roots[rootId].steps = [];
		var steps = document.getElementById(rootId).querySelectorAll(".step");
		for (var i = 0; i < steps.length; i++) {
			var el = steps[i];
			startingState.roots[rootId].steps.push({
				el: el,
				id: el.getAttribute("id")
			})
		}
		if (rootsCount === 0) {
			startingState.body = {};
			if (document.body.classList.contains("impress-not-supported")) {
				startingState.body.impressNotSupported = true
			} else {
				startingState.body.impressNotSupported = false
			}
			var metas = document.head.querySelectorAll("meta");
			for (i = 0; i < metas.length; i++) {
				var m = metas[i];
				if (m.name === "viewport") {
					startingState.meta = m.content
				}
			}
		}
	};
	var resetStartingState = function(rootId) {
		document.body.classList.remove("impress-enabled");
		document.body.classList.remove("impress-disabled");
		var root = document.getElementById(rootId);
		var activeId = root.querySelector(".active").id;
		document.body.classList.remove("impress-on-" + activeId);
		document.documentElement.style.height = "";
		document.body.style.height = "";
		document.body.style.overflow = "";
		var steps = root.querySelectorAll(".step");
		for (var i = 0; i < steps.length; i++) {
			steps[i].classList.remove("future");
			steps[i].classList.remove("past");
			steps[i].classList.remove("present");
			steps[i].classList.remove("active");
			steps[i].style.position = "";
			steps[i].style.transform = "";
			steps[i].style["transform-style"] = ""
		}
		root.style.position = "";
		root.style["transform-origin"] = "";
		root.style.transition = "";
		root.style["transform-style"] = "";
		root.style.top = "";
		root.style.left = "";
		root.style.transform = "";
		steps = startingState.roots[rootId].steps;
		var step;
		while (step = steps.pop()) {
			if (step.id === null) {
				step.el.removeAttribute("id")
			} else {
				step.el.setAttribute("id", step.id)
			}
		}
		delete startingState.roots[rootId];
		var canvas = root.firstChild;
		var canvasHTML = canvas.innerHTML;
		root.innerHTML = canvasHTML;
		if (roots[rootId] !== undefined) {
			delete roots[rootId];
			rootsCount--
		}
		if (rootsCount === 0) {
			document.body.classList.remove("impress-supported");
			if (startingState.body.impressNotSupported) {
				document.body.classList.add("impress-not-supported")
			}
			var metas = document.head.querySelectorAll("meta");
			for (i = 0; i < metas.length; i++) {
				var m = metas[i];
				if (m.name === "viewport") {
					if (startingState.meta !== undefined) {
						m.content = startingState.meta
					} else {
						m.parentElement.removeChild(m)
					}
				}
			}
		}
	}
})(document, window);
(function(document, window) {
	"use strict";
	var roots = [];
	var libraryFactory = function(rootId) {
		if (roots[rootId]) {
			return roots[rootId]
		}
		var $ = function(selector, context) {
			context = context || document;
			return context.querySelector(selector)
		};
		var $$ = function(selector, context) {
			context = context || document;
			return arrayify(context.querySelectorAll(selector))
		};
		var arrayify = function(a) {
			return [].slice.call(a)
		};
		var byId = function(id) {
			return document.getElementById(id)
		};
		var getElementFromHash = function() {
			return byId(window.location.hash.replace(/^#\/?/, ""))
		};
		var getUrlParamValue = function(parameter) {
			var chunk = window.location.search.split(parameter + "=")[1];
			var value = chunk && chunk.split("&")[0];
			if (value !== "") {
				return value
			}
		};
		var throttle = function(fn, delay) {
			var timer = null;
			return function() {
				var context = this,
					args = arguments;
				window.clearTimeout(timer);
				timer = window.setTimeout(function() {
					fn.apply(context, args)
				}, delay)
			}
		};
		var toNumber = function(numeric, fallback) {
			return isNaN(numeric) ? (fallback || 0) : Number(numeric)
		};
		var triggerEvent = function(el, eventName, detail) {
			var event = document.createEvent("CustomEvent");
			event.initCustomEvent(eventName, true, true, detail);
			el.dispatchEvent(event)
		};
		var lib = {
			$: $,
			$$: $$,
			arrayify: arrayify,
			byId: byId,
			getElementFromHash: getElementFromHash,
			throttle: throttle,
			toNumber: toNumber,
			triggerEvent: triggerEvent,
			getUrlParamValue: getUrlParamValue
		};
		roots[rootId] = lib;
		return lib
	};
	window.impress.addLibraryFactory({
		util: libraryFactory
	})
})(document, window);
(function(document) {
	"use strict";
	var autoplayDefault = 0;
	var currentStepTimeout = 0;
	var api = null;
	var timeoutHandle = null;
	var root = null;
	var util;
	document.addEventListener("impress:init", function(event) {
		util = event.detail.api.lib.util;
		api = event.detail.api;
		root = event.target;
		var data = root.dataset;
		var autoplay = util.getUrlParamValue("impress-autoplay") || data.autoplay;
		if (autoplay) {
			autoplayDefault = util.toNumber(autoplay, 0)
		}
		var toolbar = document.querySelector("#impress-toolbar");
		if (toolbar) {
			addToolbarButton(toolbar)
		}
		api.lib.gc.pushCallback(function() {
			clearTimeout(timeoutHandle)
		})
	}, false);
	document.addEventListener("impress:autoplay:pause", function(event) {
		status = "paused";
		reloadTimeout(event)
	}, false);
	document.addEventListener("impress:autoplay:play", function(event) {
		status = "playing";
		reloadTimeout(event)
	}, false);
	var reloadTimeout = function(event) {
		var step = event.target;
		currentStepTimeout = util.toNumber(step.dataset.autoplay, autoplayDefault);
		if (status === "paused") {
			setAutoplayTimeout(0)
		} else {
			setAutoplayTimeout(currentStepTimeout)
		}
	};
	document.addEventListener("impress:stepenter", function(event) {
		reloadTimeout(event)
	}, false);
	document.addEventListener("impress:substep:enter", function(event) {
		reloadTimeout(event)
	}, false);
	var setAutoplayTimeout = function(timeout) {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle)
		}
		if (timeout > 0) {
			timeoutHandle = setTimeout(function() {
				api.next()
			}, timeout * 1000)
		}
		setButtonText()
	};
	var status = "not clicked";
	var toolbarButton = null;
	var makeDomElement = function(html) {
		var tempDiv = document.createElement("div");
		tempDiv.innerHTML = html;
		return tempDiv.firstChild
	};
	var toggleStatus = function() {
		if (currentStepTimeout > 0 && status !== "paused") {
			status = "paused"
		} else {
			status = "playing"
		}
	};
	var getButtonText = function() {
		if (currentStepTimeout > 0 && status !== "paused") {
			return "||"
		} else {
			return "&#9654;"
		}
	};
	var setButtonText = function() {
		if (toolbarButton) {
			var buttonWidth = toolbarButton.offsetWidth;
			var buttonHeight = toolbarButton.offsetHeight;
			toolbarButton.innerHTML = getButtonText();
			if (!toolbarButton.style.width) {
				toolbarButton.style.width = buttonWidth + "px"
			}
			if (!toolbarButton.style.height) {
				toolbarButton.style.height = buttonHeight + "px"
			}
		}
	};
	var addToolbarButton = function(toolbar) {
		var html = '<button id="impress-autoplay-playpause" title="Autoplay" class="impress-autoplay">' + getButtonText() + "</button>";
		toolbarButton = makeDomElement(html);
		toolbarButton.addEventListener("click", function() {
			toggleStatus();
			if (status === "playing") {
				if (autoplayDefault === 0) {
					autoplayDefault = 7
				}
				if (currentStepTimeout === 0) {
					currentStepTimeout = autoplayDefault
				}
				setAutoplayTimeout(currentStepTimeout)
			} else if (status === "paused") {
				setAutoplayTimeout(0)
			}
		});
		util.triggerEvent(toolbar, "impress:toolbar:appendChild", {
			group: 10,
			element: toolbarButton
		})
	}
})(document);
(function(document) {
	"use strict";
	var canvas = null;
	var blackedOut = false;
	var util = null;
	var root = null;
	var api = null;
	var css = function(el, props) {
		var key, pkey;
		for (key in props) {
			if (props.hasOwnProperty(key)) {
				pkey = pfx(key);
				if (pkey !== null) {
					el.style[pkey] = props[key]
				}
			}
		}
		return el
	};
	var pfx = (function() {
		var style = document.createElement("dummy").style,
			prefixes = "Webkit Moz O ms Khtml".split(" "),
			memory = {};
		return function(prop) {
			if (typeof memory[prop] === "undefined") {
				var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1),
					props = (prop + " " + prefixes.join(ucProp + " ") + ucProp).split(" ");
				memory[prop] = null;
				for (var i in props) {
					if (style[props[i]] !== undefined) {
						memory[prop] = props[i];
						break
					}
				}
			}
			return memory[prop]
		}
	})();
	var removeBlackout = function() {
		if (blackedOut) {
			css(canvas, {
				display: "block"
			});
			blackedOut = false;
			util.triggerEvent(root, "impress:autoplay:play", {})
		}
	};
	var blackout = function() {
		if (blackedOut) {
			removeBlackout()
		} else {
			css(canvas, {
				display: (blackedOut = !blackedOut) ? "none" : "block"
			});
			blackedOut = true;
			util.triggerEvent(root, "impress:autoplay:pause", {})
		}
	};
	document.addEventListener("impress:init", function(event) {
		api = event.detail.api;
		util = api.lib.util;
		root = event.target;
		canvas = root.firstElementChild;
		var gc = api.lib.gc;
		var util = api.lib.util;
		gc.addEventListener(document, "keydown", function(event) {
			if( window.is_edit || window.is_style ) return;
			if (event.keyCode === 66 || event.keyCode === 190) {
				event.preventDefault();
				if (!blackedOut) {
					blackout()
				} else {
					removeBlackout()
				}
			}
		}, false);
		gc.addEventListener(document, "keyup", function(event) {
			if( window.is_edit || window.is_style ) return;
			if (event.keyCode === 66 || event.keyCode === 190) {
				event.preventDefault()
			}
		}, false)
	}, false);
	document.addEventListener("impress:stepleave", function() {
		removeBlackout()
	}, false)
})(document);
(function(document, window) {
	"use strict";
	var preInit = function() {
		if (window.markdown) {
			var markdownDivs = document.querySelectorAll(".markdown");
			for (var idx = 0; idx < markdownDivs.length; idx++) {
				var element = markdownDivs[idx];
				var dialect = element.dataset.markdownDialect;
				var slides = element.textContent.split(/^-----$/m);
				var i = slides.length - 1;
				element.innerHTML = markdown.toHTML(slides[i], dialect);
				var id = null;
				if (element.id) {
					id = element.id;
					element.id = ""
				}
				i--;
				while (i >= 0) {
					var newElement = element.cloneNode(false);
					newElement.innerHTML = markdown.toHTML(slides[i]);
					element.parentNode.insertBefore(newElement, element);
					element = newElement;
					i--
				}
				if (id !== null) {
					element.id = id
				}
			}
		}
		if (window.hljs) {
			hljs.initHighlightingOnLoad()
		}
		if (window.mermaid) {
			mermaid.initialize({
				startOnLoad: true
			})
		}
	};
	impress.addPreInitPlugin(preInit, 1)
})(document, window);
(function(document) {
	"use strict";
	var root;
	var api;
	document.addEventListener("impress:init", function(event) {
		root = event.target;
		api = event.detail.api;
		var gc = api.lib.gc;
		var selectors = ["input", "textarea", "select", "[contenteditable=true]"];
		for (var selector of selectors) {
			var elements = document.querySelectorAll(selector);
			if (!elements) {
				continue
			}
			for (var i = 0; i < elements.length; i++) {
				var e = elements[i];
				gc.addEventListener(e, "keydown", function(event) {
					if( window.is_edit || window.is_style ) return;
					event.stopPropagation()
				});
				gc.addEventListener(e, "keyup", function(event) {
					if( window.is_edit || window.is_style ) return;
					event.stopPropagation()
				})
			}
		}
	}, false);
	document.addEventListener("impress:stepleave", function() {
		document.activeElement.blur()
	}, false)
})(document);
(function(document) {
	"use strict";

	function enterFullscreen() {
		var elem = document.documentElement;
		if (!document.fullscreenElement) {
			elem.requestFullscreen()
		}
	}

	function exitFullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen()
		}
	}
	document.addEventListener("impress:init", function(event) {
		var api = event.detail.api;
		var root = event.target;
		var gc = api.lib.gc;
		var util = api.lib.util;
		gc.addEventListener(document, "keydown", function(event) {
			if( window.is_edit || window.is_style ) return;
			if ( event.code === "F4" ) {
                event.preventDefault();
                enterFullscreen();
                util.triggerEvent( root.querySelector( ".active" ), "impress:steprefresh" );
            }

            // 27 (Escape) is sent by presentation remote controllers
            if ( event.key === "Escape" || event.key === "F4" ) {
                event.preventDefault();
                exitFullscreen();
                util.triggerEvent( root.querySelector( ".active" ), "impress:steprefresh" );
            }
        }, false );
		util.triggerEvent(document, "impress:help:add", {
			command: "F4 / ESC",
			text: "Fullscreen: Enter / Exit",
			row: 200
		})
	}, false)
})(document);
(function(document, window) {
	"use strict";
	var lib;
	document.addEventListener("impress:init", function(event) {
		lib = event.detail.api.lib
	}, false);
	var isNumber = function(numeric) {
		return !isNaN(numeric)
	};
	var goto = function(event) {
		if ((!event) || (!event.target)) {
			return
		}
		var data = event.target.dataset;
		var steps = document.querySelectorAll(".step");
		if (data.gotoKeyList !== undefined && data.gotoNextList !== undefined && event.origEvent !== undefined && event.origEvent.key !== undefined) {
			var keylist = data.gotoKeyList.split(" ");
			var nextlist = data.gotoNextList.split(" ");
			if (keylist.length !== nextlist.length) {
				window.console.log("impress goto plugin: data-goto-key-list and data-goto-next-list don't match:");
				window.console.log(keylist);
				window.console.log(nextlist)
			} else {
				var index = keylist.indexOf(event.origEvent.key);
				if (index >= 0) {
					var next = nextlist[index];
					if (isNumber(next)) {
						event.detail.next = steps[next];
						event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
						return
					} else {
						var newTarget = document.getElementById(next);
						if (newTarget && newTarget.classList.contains("step")) {
							event.detail.next = newTarget;
							event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
							return
						} else {
							window.console.log("impress goto plugin: " + next + " is not a step in this impress presentation.")
						}
					}
				}
			}
		}
		if (isNumber(data.gotoNext) && event.detail.reason === "next") {
			event.detail.next = steps[data.gotoNext];
			event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
			return
		}
		if (data.gotoNext && event.detail.reason === "next") {
			var newTarget = document.getElementById(data.gotoNext);
			if (newTarget && newTarget.classList.contains("step")) {
				event.detail.next = newTarget;
				event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
				return
			} else {
				window.console.log("impress goto plugin: " + data.gotoNext + " is not a step in this impress presentation.")
			}
		}
		if (isNumber(data.gotoPrev) && event.detail.reason === "prev") {
			event.detail.next = steps[data.gotoPrev];
			event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
			return
		}
		if (data.gotoPrev && event.detail.reason === "prev") {
			var newTarget = document.getElementById(data.gotoPrev);
			if (newTarget && newTarget.classList.contains("step")) {
				event.detail.next = newTarget;
				event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
				return
			} else {
				window.console.log("impress goto plugin: " + data.gotoPrev + " is not a step in this impress presentation.")
			}
		}
		if (isNumber(data.goto)) {
			event.detail.next = steps[data.goto];
			event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
			return
		}
		if (data.goto) {
			var newTarget = document.getElementById(data.goto);
			if (newTarget && newTarget.classList.contains("step")) {
				event.detail.next = newTarget;
				event.detail.transitionDuration = lib.util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration);
				return
			} else {
				window.console.log("impress goto plugin: " + data.goto + " is not a step in this impress presentation.")
			}
		}
	};
	impress.addPreStepLeavePlugin(goto)
})(document, window);
(function(document, window) {
	"use strict";
	var rows = [];
	var timeoutHandle;
	var triggerEvent = function(el, eventName, detail) {
		var event = document.createEvent("CustomEvent");
		event.initCustomEvent(eventName, true, true, detail);
		el.dispatchEvent(event)
	};
	var renderHelpDiv = function() {
		var helpDiv = document.getElementById("impress-help");
		if (helpDiv) {
			var html = [];
			for (var row in rows) {
				for (var arrayItem in row) {
					html.push(rows[row][arrayItem])
				}
			}
			if (html) {
				helpDiv.innerHTML = "<table>\n" + html.join("\n") + "</table>\n"
			}
		}
	};
	var toggleHelp = function() {
		var helpDiv = document.getElementById("impress-help");
		if (!helpDiv) {
			return
		}
		if (helpDiv.style.display === "block") {
			helpDiv.style.display = "none"
		} else {
			helpDiv.style.display = "block";
			window.clearTimeout(timeoutHandle)
		}
	};
	document.addEventListener("keyup", function(event) {
		if( window.is_edit || window.is_style ) return;
		if (event.keyCode === 72 || event.keyCode === 191) {
			event.preventDefault();
			toggleHelp()
		}
	}, false);
	document.addEventListener("impress:help:add", function(e) {
		var rowIndex = e.detail.row;
		if (typeof rows[rowIndex] !== "object" || !rows[rowIndex].isArray) {
			rows[rowIndex] = []
		}
		rows[e.detail.row].push("<tr><td><strong>" + e.detail.command + "</strong></td><td>" + e.detail.text + "</td></tr>");
		renderHelpDiv()
	});
	document.addEventListener("impress:init", function(e) {
		renderHelpDiv();
		var helpDiv = document.getElementById("impress-help");
		if (helpDiv) {
			helpDiv.style.display = "block";
			timeoutHandle = window.setTimeout(function() {
				var helpDiv = document.getElementById("impress-help");
				helpDiv.style.display = "none"
			}, 7000);
			var api = e.detail.api;
			api.lib.gc.pushCallback(function() {
				window.clearTimeout(timeoutHandle);
				helpDiv.style.display = "";
				helpDiv.innerHTML = "";
				rows = []
			})
		}
		triggerEvent(document, "impress:help:add", {
			command: "H",
			text: "Show this help",
			row: 0
		})
	})
})(document, window);
(function(document, window) {
	'use strict';
	var triggerEvent = function(el, eventName, detail) {
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent(eventName, true, true, detail);
		el.dispatchEvent(event)
	};
	var lang;
	switch (navigator.language) {
		case 'de':
			lang = {
				'noNotes': '<div class="noNotes">Keine Notizen hierzu</div>',
				'restart': 'Neustart',
				'clickToOpen': 'Klicken um Sprecherkonsole zu öffnen',
				'prev': 'zurück',
				'next': 'weiter',
				'loading': 'initalisiere',
				'ready': 'Bereit',
				'moving': 'in Bewegung',
				'useAMPM': false
			};
			break;
		case 'en':
		default:
			lang = {
				'noNotes': '<div class="noNotes">No notes for this step</div>',
				'restart': 'Restart',
				'clickToOpen': 'Click to open speaker console',
				'prev': 'Prev',
				'next': 'Next',
				'loading': 'Loading',
				'ready': 'Ready',
				'moving': 'Moving',
				'useAMPM': false
			};
			break
	}
	const preViewDefaultFactor = 0.7;
	const preViewMinimumFactor = 0.5;
	const preViewGap = 4;
	const consoleTemplate = '<!DOCTYPE html><html id="impressconsole"><head>{{cssStyle}}{{cssLink}}</head><body><div id="console"><div id="views"><iframe id="slideView" scrolling="no"></iframe><iframe id="preView" scrolling="no"></iframe><div id="blocker"></div></div><div id="notes"></div></div><div id="controls"> <div id="prev"><a  href="#" onclick="impress().prev(); return false;" />{{prev}}</a></div><div id="next"><a  href="#" onclick="impress().next(); return false;" />{{next}}</a></div><div id="clock">--:--</div><div id="timer" onclick="timerReset()">00m 00s</div><div id="status">{{loading}}</div></div></body></html>';
	var cssFileOldDefault = 'css/impressConsole.css';
	var cssFile = undefined;
	var cssFileIframeOldDefault = 'css/iframe.css';
	var cssFileIframe = undefined;
	var allConsoles = {};
	var zeroPad = function(i) {
		return (i < 10 ? '0' : '') + i
	};
	var impressConsole = window.impressConsole = function(rootId) {
		rootId = rootId || 'impress';
		if (allConsoles[rootId]) {
			return allConsoles[rootId]
		}
		var root = document.getElementById(rootId);
		var consoleWindow = null;
		var nextStep = function() {
			var classes = '';
			var nextElement = document.querySelector('.active');
			while (!nextElement.nextElementSibling && nextElement.parentNode) {
				nextElement = nextElement.parentNode
			}
			nextElement = nextElement.nextElementSibling;
			while (nextElement) {
				classes = nextElement.attributes['class'];
				if (classes && classes.value.indexOf('step') !== -1) {
					consoleWindow.document.getElementById('blocker').innerHTML = lang.next;
					return nextElement
				}
				if (nextElement.firstElementChild) {
					nextElement = nextElement.firstElementChild
				} else {
					while (!nextElement.nextElementSibling && nextElement.parentNode) {
						nextElement = nextElement.parentNode
					}
					nextElement = nextElement.nextElementSibling
				}
			}
			consoleWindow.document.getElementById('blocker').innerHTML = lang.restart;
			return document.querySelector('.step')
		};
		var onStepLeave = function() {
			if (consoleWindow) {
				var newNotes = document.querySelector('.active').querySelector('.notes');
				if (newNotes) {
					newNotes = newNotes.innerHTML
				} else {
					newNotes = lang.noNotes
				}
				consoleWindow.document.getElementById('notes').innerHTML = newNotes;
				var baseURL = document.URL.substring(0, document.URL.search('#/'));
				var slideSrc = baseURL + '#' + document.querySelector('.active').id;
				var preSrc = baseURL + '#' + nextStep().id;
				var slideView = consoleWindow.document.getElementById('slideView');
				if (slideView.src !== slideSrc) {
					slideView.src = slideSrc
				}
				var preView = consoleWindow.document.getElementById('preView');
				if (preView.src !== preSrc) {
					preView.src = preSrc
				}
				consoleWindow.document.getElementById('status').innerHTML = '<span class="moving">' + lang.moving + '</span>'
			}
		};
		var onStepEnter = function() {
			if (consoleWindow) {
				var newNotes = document.querySelector('.active').querySelector('.notes');
				if (newNotes) {
					newNotes = newNotes.innerHTML
				} else {
					newNotes = lang.noNotes
				}
				var notes = consoleWindow.document.getElementById('notes');
				notes.innerHTML = newNotes;
				notes.scrollTop = 0;
				var baseURL = document.URL.substring(0, document.URL.search('#/'));
				var slideSrc = baseURL + '#' + document.querySelector('.active').id;
				var preSrc = baseURL + '#' + nextStep().id;
				var slideView = consoleWindow.document.getElementById('slideView');
				if (slideView.src !== slideSrc) {
					slideView.src = slideSrc
				}
				var preView = consoleWindow.document.getElementById('preView');
				if (preView.src !== preSrc) {
					preView.src = preSrc
				}
				consoleWindow.document.getElementById('status').innerHTML = '<span  class="ready">' + lang.ready + '</span>'
			}
		};
		var onSubstep = function(event) {
			if (consoleWindow) {
				if (event.detail.reason === 'next') {
					onSubstepShow()
				}
				if (event.detail.reason === 'prev') {
					onSubstepHide()
				}
			}
		};
		var onSubstepShow = function() {
			var slideView = consoleWindow.document.getElementById('slideView');
			triggerEventInView(slideView, 'impress:substep:show')
		};
		var onSubstepHide = function() {
			var slideView = consoleWindow.document.getElementById('slideView');
			triggerEventInView(slideView, 'impress:substep:hide')
		};
		var triggerEventInView = function(frame, eventName, detail) {
			var event = frame.contentDocument.createEvent('CustomEvent');
			event.initCustomEvent(eventName, true, true, detail);
			frame.contentDocument.dispatchEvent(event)
		};
		var spaceHandler = function() {
			var notes = consoleWindow.document.getElementById('notes');
			if (notes.scrollTopMax - notes.scrollTop > 20) {
				notes.scrollTop = notes.scrollTop + notes.clientHeight * 0.8
			} else {
				window.impress().next()
			}
		};
		var timerReset = function() {
			consoleWindow.timerStart = new Date()
		};
		var clockTick = function() {
			var now = new Date();
			var hours = now.getHours();
			var minutes = now.getMinutes();
			var seconds = now.getSeconds();
			var ampm = '';
			if (lang.useAMPM) {
				ampm = (hours < 12) ? 'AM' : 'PM';
				hours = (hours > 12) ? hours - 12 : hours;
				hours = (hours === 0) ? 12 : hours
			}
			var clockStr = zeroPad(hours) + ':' + zeroPad(minutes) + ':' + zeroPad(seconds) + ' ' + ampm;
			consoleWindow.document.getElementById('clock').firstChild.nodeValue = clockStr;
			seconds = Math.floor((now - consoleWindow.timerStart) / 1000);
			minutes = Math.floor(seconds / 60);
			seconds = Math.floor(seconds % 60);
			consoleWindow.document.getElementById('timer').firstChild.nodeValue = zeroPad(minutes) + 'm ' + zeroPad(seconds) + 's';
			if (!consoleWindow.initialized) {
				consoleWindow.document.getElementById('slideView').contentWindow.scrollTo(0, 0);
				consoleWindow.document.getElementById('preView').contentWindow.scrollTo(0, 0);
				consoleWindow.initialized = true
			}
		};
		var registerKeyEvent = function(keyCodes, handler, window) {
			if (window === undefined) {
				window = consoleWindow
			}
			window.document.addEventListener('keydown', function(event) {
				if( window.is_edit || window.is_style ) return;
				if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey && keyCodes.indexOf(event.keyCode) !== -1) {
					event.preventDefault()
				}
			}, false);
			window.document.addEventListener('keyup', function(event) {
				if( window.is_edit || window.is_style ) return;
				if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey && keyCodes.indexOf(event.keyCode) !== -1) {
					handler();
					event.preventDefault()
				}
			}, false)
		};
		var consoleOnLoad = function() {
			var slideView = consoleWindow.document.getElementById('slideView');
			var preView = consoleWindow.document.getElementById('preView');
			slideView.contentDocument.body.classList.add('impress-console');
			preView.contentDocument.body.classList.add('impress-console');
			if (cssFileIframe !== undefined) {
				slideView.contentDocument.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" type="text/css" href="' + cssFileIframe + '">');
				preView.contentDocument.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" type="text/css" href="' + cssFileIframe + '">')
			}
			slideView.addEventListener('load', function() {
				slideView.contentDocument.body.classList.add('impress-console');
				if (cssFileIframe !== undefined) {
					slideView.contentDocument.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" type="text/css" href="' + cssFileIframe + '">')
				}
			});
			preView.addEventListener('load', function() {
				preView.contentDocument.body.classList.add('impress-console');
				if (cssFileIframe !== undefined) {
					preView.contentDocument.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" type="text/css" href="' + cssFileIframe + '">')
				}
			})
		};
		var open = function() {
			if (top.isconsoleWindow) {
				return
			}
			if (consoleWindow && !consoleWindow.closed) {
				consoleWindow.focus()
			} else {
				consoleWindow = window.open('', 'impressConsole');
				if (consoleWindow == null) {
					var message = document.createElement('div');
					message.id = 'impress-console-button';
					message.style.position = 'fixed';
					message.style.left = 0;
					message.style.top = 0;
					message.style.right = 0;
					message.style.bottom = 0;
					message.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
					var clickStr = 'var x = document.getElementById(\'impress-console-button\');x.parentNode.removeChild(x);var r = document.getElementById(\'' + rootId + '\');impress(\'' + rootId + '\').lib.util.triggerEvent(r, \'impress:console:open\', {})';
					var styleStr = 'margin: 25vh 25vw;width:50vw;height:50vh;';
					message.innerHTML = '<button style="' + styleStr + '" onclick="' + clickStr + '">' + lang.clickToOpen + '</button>';
					document.body.appendChild(message);
					return
				}
				var cssLink = '';
				if (cssFile !== undefined) {
					cssLink = '<link rel="stylesheet" type="text/css" media="screen" href="' + cssFile + '">'
				}
				consoleWindow.document.open();
				consoleWindow.document.write(consoleTemplate.replace('{{cssStyle}}', cssStyleStr()).replace('{{cssLink}}', cssLink).replace(/{{.*?}}/gi, function(x) {
					return lang[x.substring(2, x.length - 2)]
				}));
				consoleWindow.document.title = 'Speaker Console (' + document.title + ')';
				consoleWindow.impress = window.impress;
				consoleWindow.isconsoleWindow = true;
				consoleWindow.onload = consoleOnLoad;
				consoleWindow.timerStart = new Date();
				consoleWindow.timerReset = timerReset;
				consoleWindow.clockInterval = setInterval(allConsoles[rootId].clockTick, 1000);
				registerKeyEvent([33, 37, 38], window.impress().prev);
				registerKeyEvent([34, 39, 40], window.impress().next);
				registerKeyEvent([32], spaceHandler);
				registerKeyEvent([82], timerReset);
				consoleWindow.onbeforeunload = function() {
					clearInterval(consoleWindow.clockInterval)
				};
				onStepEnter();
				consoleWindow.initialized = false;
				consoleWindow.document.close();
				window.onresize = resize;
				consoleWindow.onresize = resize;
				return consoleWindow
			}
		};
		var resize = function() {
			var slideView = consoleWindow.document.getElementById('slideView');
			var preView = consoleWindow.document.getElementById('preView');
			var ratio = window.innerHeight / window.innerWidth;
			var views = consoleWindow.document.getElementById('views');
			var delta = slideView.offsetWidth - slideView.clientWidth;
			var slideViewWidth = (views.clientWidth - delta);
			var slideViewHeight = Math.floor(slideViewWidth * ratio);
			var preViewTop = slideViewHeight + preViewGap;
			var preViewWidth = Math.floor(slideViewWidth * preViewDefaultFactor);
			var preViewHeight = Math.floor(slideViewHeight * preViewDefaultFactor);
			if (views.clientHeight - delta < preViewTop + preViewHeight) {
				preViewHeight = views.clientHeight - delta - preViewTop;
				preViewWidth = Math.floor(preViewHeight / ratio)
			}
			if (preViewWidth <= Math.floor(slideViewWidth * preViewMinimumFactor)) {
				slideViewWidth = (views.clientWidth - delta);
				slideViewHeight = Math.floor((views.clientHeight - delta - preViewGap) / (1 + preViewMinimumFactor));
				preViewTop = slideViewHeight + preViewGap;
				preViewWidth = Math.floor(slideViewWidth * preViewMinimumFactor);
				preViewHeight = views.clientHeight - delta - preViewTop
			}
			slideView.style.width = slideViewWidth + 'px';
			slideView.style.height = slideViewHeight + 'px';
			preView.style.top = preViewTop + 'px';
			preView.style.width = preViewWidth + 'px';
			preView.style.height = preViewHeight + 'px'
		};
		var _init = function(cssConsole, cssIframe) {
			if (cssConsole !== undefined) {
				cssFile = cssConsole
			} else if (root.dataset.consoleCss !== undefined) {
				cssFile = root.dataset.consoleCss
			}
			if (cssIframe !== undefined) {
				cssFileIframe = cssIframe
			} else if (root.dataset.consoleCssIframe !== undefined) {
				cssFileIframe = root.dataset.consoleCssIframe
			}
			root.addEventListener('impress:stepleave', onStepLeave);
			root.addEventListener('impress:stepenter', onStepEnter);
			root.addEventListener('impress:substep:stepleaveaborted', onSubstep);
			root.addEventListener('impress:substep:show', onSubstepShow);
			root.addEventListener('impress:substep:hide', onSubstepHide);
			window.onunload = function() {
				if (consoleWindow && !consoleWindow.closed) {
					consoleWindow.close()
				}
			};
			registerKeyEvent([80], open, window);
			if (root.dataset.consoleAutolaunch === 'true') {
				open()
			}
		};
		var init = function(cssConsole, cssIframe) {
			if ((cssConsole === undefined || cssConsole === cssFileOldDefault) && (cssIframe === undefined || cssIframe === cssFileIframeOldDefault)) {
				window.console.log('impressConsole().init() is deprecated. impressConsole is now initialized automatically when you call impress().init().')
			}
			_init(cssConsole, cssIframe)
		};
		root.addEventListener('impress:console:open', function() {
			open()
		});
		root.addEventListener('impress:console:registerKeyEvent', function(event) {
			registerKeyEvent(event.detail.keyCodes, event.detail.handler, event.detail.window)
		});
		allConsoles[rootId] = {
			init: init,
			open: open,
			clockTick: clockTick,
			registerKeyEvent: registerKeyEvent,
			_init: _init
		};
		return allConsoles[rootId]
	};
	document.addEventListener('impress:init', function(event) {
		impressConsole(event.target.id)._init();
		triggerEvent(document, 'impress:help:add', {
			command: 'P',
			text: 'Presenter console',
			row: 10
		})
	});
	var cssStyleStr = function() {
		return `<style>#impressconsole body{background-color:rgb(255,255,255);padding:0;margin:0;font-family:verdana,arial,sans-serif;font-size:2vw}#impressconsole div#console{position:absolute;top:0.5vw;left:0.5vw;right:0.5vw;bottom:3vw;margin:0}#impressconsole div#views,#impressconsole div#notes{position:absolute;top:0;bottom:0}#impressconsole div#views{left:0;right:50vw;overflow:hidden}#impressconsole div#blocker{position:absolute;right:0;bottom:0}#impressconsole div#notes{left:50vw;right:0;overflow-x:hidden;overflow-y:auto;padding:0.3ex;background-color:rgb(255,255,255);border:solid 1px rgb(120,120,120)}#impressconsole div#notes.noNotes{color:rgb(200,200,200)}#impressconsole div#notes p{margin-top:0}#impressconsole iframe{position:absolute;margin:0;padding:0;left:0;border:solid 1px rgb(120,120,120)}#impressconsole iframe#slideView{top:0;width:49vw;height:49vh}#impressconsole iframe#preView{opacity:0.7;top:50vh;width:30vw;height:30vh}#impressconsole div#controls{margin:0;position:absolute;bottom:0.25vw;left:0.5vw;right:0.5vw;height:2.5vw;background-color:rgb(255,255,255);background-color:rgba(255,255,255,0.6)}#impressconsole div#prev,div#next{}#impressconsole div#prev a,#impressconsole div#next a{display:block;border:solid 1px rgb(70,70,70);border-radius:0.5vw;font-size:1.5vw;padding:0.25vw;text-decoration:none;background-color:rgb(220,220,220);color:rgb(0,0,0)}#impressconsole div#prev a:hover,#impressconsole div#next a:hover{background-color:rgb(245,245,245)}#impressconsole div#prev{float:left}#impressconsole div#next{float:right}#impressconsole div#status{margin-left:2em;margin-right:2em;text-align:center;float:right}#impressconsole div#clock{margin-left:2em;margin-right:2em;text-align:center;float:left}#impressconsole div#timer{margin-left:2em;margin-right:2em;text-align:center;float:left}#impressconsole span.moving{color:rgb(255,0,0)}#impressconsole span.ready{color:rgb(0,128,0)}</style>`
	}
})(document, window);
(function(document, window) {
	"use strict";
	var root, api, gc, attributeTracker;
	attributeTracker = [];
	var enhanceMediaNodes, enhanceMedia, removeMediaClasses, onStepenterDetectImpressConsole, onStepenter, onStepleave, onPlay, onPause, onEnded, getMediaAttribute, teardown;
	document.addEventListener("impress:init", function(event) {
		root = event.target;
		api = event.detail.api;
		gc = api.lib.gc;
		enhanceMedia();
		gc.pushCallback(teardown)
	}, false);
	teardown = function() {
		var el, i;
		removeMediaClasses();
		for (i = 0; i < attributeTracker.length; i += 1) {
			el = attributeTracker[i];
			el.node.removeAttribute(el.attr)
		}
		attributeTracker = []
	};
	getMediaAttribute = function(attributeName, nodes) {
		var attrName, attrValue, i, node;
		attrName = "data-media-" + attributeName;
		for (i = 0; i < nodes.length; i += 1) {
			node = nodes[i];
			if (node.hasAttribute(attrName)) {
				attrValue = node.getAttribute(attrName);
				if (attrValue === "" || attrValue === "true") {
					return true
				} else {
					return false
				}
			}
		}
		return undefined
	};
	onPlay = function(event) {
		var type = event.target.nodeName.toLowerCase();
		document.body.classList.add("impress-media-" + type + "-playing");
		document.body.classList.remove("impress-media-" + type + "-paused")
	};
	onPause = function(event) {
		var type = event.target.nodeName.toLowerCase();
		document.body.classList.add("impress-media-" + type + "-paused");
		document.body.classList.remove("impress-media-" + type + "-playing")
	};
	onEnded = function(event) {
		var type = event.target.nodeName.toLowerCase();
		document.body.classList.remove("impress-media-" + type + "-playing");
		document.body.classList.remove("impress-media-" + type + "-paused")
	};
	removeMediaClasses = function() {
		var type, types;
		types = ["video", "audio"];
		for (type in types) {
			document.body.classList.remove("impress-media-" + types[type] + "-playing");
			document.body.classList.remove("impress-media-" + types[type] + "-paused")
		}
	};
	enhanceMediaNodes = function() {
		var i, id, media, mediaElement, type;
		media = root.querySelectorAll("audio, video");
		for (i = 0; i < media.length; i += 1) {
			type = media[i].nodeName.toLowerCase();
			mediaElement = media[i];
			id = mediaElement.getAttribute("id");
			if (id === undefined || id === null) {
				mediaElement.setAttribute("id", "media-" + type + "-" + i);
				attributeTracker.push({
					"node": mediaElement,
					"attr": "id"
				})
			}
			gc.addEventListener(mediaElement, "play", onPlay);
			gc.addEventListener(mediaElement, "playing", onPlay);
			gc.addEventListener(mediaElement, "pause", onPause);
			gc.addEventListener(mediaElement, "ended", onEnded)
		}
	};
	enhanceMedia = function() {
		var steps, stepElement, i;
		enhanceMediaNodes();
		steps = document.getElementsByClassName("step");
		for (i = 0; i < steps.length; i += 1) {
			stepElement = steps[i];
			gc.addEventListener(stepElement, "impress:stepenter", onStepenter);
			gc.addEventListener(stepElement, "impress:stepleave", onStepleave)
		}
	};
	onStepenterDetectImpressConsole = function() {
		return {
			"preview": (window.frameElement !== null && window.frameElement.id === "preView"),
			"slideView": (window.frameElement !== null && window.frameElement.id === "slideView")
		}
	};
	onStepenter = function(event) {
		var stepElement, media, mediaElement, i, onConsole, autoplay;
		if ((!event) || (!event.target)) {
			return
		}
		stepElement = event.target;
		removeMediaClasses();
		media = stepElement.querySelectorAll("audio, video");
		for (i = 0; i < media.length; i += 1) {
			mediaElement = media[i];
			onConsole = onStepenterDetectImpressConsole();
			autoplay = getMediaAttribute("autoplay", [mediaElement, stepElement, root]);
			if (autoplay && !onConsole.preview) {
				if (onConsole.slideView) {
					mediaElement.muted = true
				}
				mediaElement.play()
			}
		}
	};
	onStepleave = function(event) {
		var stepElement, media, i, mediaElement, autoplay, autopause, autostop;
		if ((!event || !event.target)) {
			return
		}
		stepElement = event.target;
		media = event.target.querySelectorAll("audio, video");
		for (i = 0; i < media.length; i += 1) {
			mediaElement = media[i];
			autoplay = getMediaAttribute("autoplay", [mediaElement, stepElement, root]);
			autopause = getMediaAttribute("autopause", [mediaElement, stepElement, root]);
			autostop = getMediaAttribute("autostop", [mediaElement, stepElement, root]);
			if (autostop === undefined && autopause === undefined) {
				autostop = autoplay
			}
			if (autopause || autostop) {
				mediaElement.pause();
				if (autostop) {
					mediaElement.currentTime = 0
				}
			}
		}
		removeMediaClasses()
	}
})(document, window);
(function(document) {
	"use strict";
	var getNextStep = function(el) {
		var steps = document.querySelectorAll(".step");
		for (var i = 0; i < steps.length; i++) {
			if (steps[i] === el) {
				if (i + 1 < steps.length) {
					return steps[i + 1]
				} else {
					return steps[0]
				}
			}
		}
	};
	var getPrevStep = function(el) {
		var steps = document.querySelectorAll(".step");
		for (var i = steps.length - 1; i >= 0; i--) {
			if (steps[i] === el) {
				if (i - 1 >= 0) {
					return steps[i - 1]
				} else {
					return steps[steps.length - 1]
				}
			}
		}
	};
	document.addEventListener("impress:init", function(event) {
		var body = document.body;
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			body.classList.add("impress-mobile")
		}
		var api = event.detail.api;
		api.lib.gc.pushCallback(function() {
			document.body.classList.remove("impress-mobile");
			var prev = document.getElementsByClassName("prev")[0];
			var next = document.getElementsByClassName("next")[0];
			if (typeof prev !== "undefined") {
				prev.classList.remove("prev")
			}
			if (typeof next !== "undefined") {
				next.classList.remove("next")
			}
		})
	});
	document.addEventListener("impress:stepenter", function(event) {
		var oldprev = document.getElementsByClassName("prev")[0];
		var oldnext = document.getElementsByClassName("next")[0];
		var prev = getPrevStep(event.target);
		prev.classList.add("prev");
		var next = getNextStep(event.target);
		next.classList.add("next");
		if (typeof oldprev !== "undefined") {
			oldprev.classList.remove("prev")
		}
		if (typeof oldnext !== "undefined") {
			oldnext.classList.remove("next")
		}
	})
})(document);
(function(document, window) {
	"use strict";
	var timeout = 3;
	var timeoutHandle;
	var hide = function() {
		document.body.classList.add("impress-mouse-timeout")
	};
	var show = function() {
		if( window.is_edit || window.is_style ) return;
		if (timeoutHandle) {
			window.clearTimeout(timeoutHandle)
		}
		document.body.classList.remove("impress-mouse-timeout");
		timeoutHandle = window.setTimeout(hide, timeout * 1000)
	};
	document.addEventListener("impress:init", function(event) {
		var api = event.detail.api;
		var gc = api.lib.gc;
		gc.addEventListener(document, "mousemove", show);
		gc.addEventListener(document, "click", show);
		gc.addEventListener(document, "touch", show);
		show();
		gc.pushCallback(function() {
			window.clearTimeout(timeoutHandle);
			document.body.classList.remove("impress-mouse-timeout")
		})
	}, false)
})(document, window);
(function(document) {
	"use strict";
	document.addEventListener("impress:init", function(event) {
		var api = event.detail.api;
		var gc = api.lib.gc;
		var util = api.lib.util;
		var isNavigationEvent = function(event) {
			if (event.altKey || event.ctrlKey || event.metaKey) {
				return false
			}
			if (event.keyCode === 9) {
				return true
			}
			if (event.shiftKey) {
				return false
			}
			if ((event.keyCode >= 32 && event.keyCode <= 34) || (event.keyCode >= 37 && event.keyCode <= 40)) {
				return true
			}
		};
		gc.addEventListener(document, "keydown", function(event) {
			if( window.is_edit || window.is_style ) return;
			if (isNavigationEvent(event)) {
				event.preventDefault()
			}
		}, false);
		gc.addEventListener(document, "keyup", function(event) {
			if( window.is_edit || window.is_style ) return;
			if (isNavigationEvent(event)) {
				if (event.shiftKey) {
					switch (event.keyCode) {
						case 9:
							api.prev();
							break
					}
				} else {
					switch (event.keyCode) {
						case 33:
						case 37:
						case 38:
							api.prev(event);
							break;
						case 9:
						case 32:
						case 34:
						case 39:
						case 40:
							api.next(event);
							break
					}
				}
				event.preventDefault()
			}
		}, false);
		gc.addEventListener(document, "click", function(event) {
			if( window.is_edit || window.is_style ) return;
			var target = event.target;
			try {
				while ((target.tagName !== "A") && (target !== document.documentElement)) {
					target = target.parentNode
				}
				if (target.tagName === "A") {
					var href = target.getAttribute("href");
					if (href && href[0] === "#") {
						target = document.getElementById(href.slice(1))
					}
				}
				if (api.goto(target)) {
					event.stopImmediatePropagation();
					event.preventDefault()
				}
			} catch (err) {
				if (err instanceof TypeError && err.message === "target is null") {
					return
				}
				throw err;
			}
		}, false);
		gc.addEventListener(document, "click", function(event) {
			if( window.is_edit || window.is_style ) return;
			var target = event.target;
			try {
				while (!(target.classList.contains("step") && !target.classList.contains("active")) && (target !== document.documentElement)) {
					target = target.parentNode
				}
				if (api.goto(target)) {
					event.preventDefault()
				}
			} catch (err) {
				if (err instanceof TypeError && err.message === "target is null") {
					return
				}
				throw err;
			}
		}, false);
		util.triggerEvent(document, "impress:help:add", {
			command: "Left &amp;Right",
			text: "Previous &amp;Next step",
			row: 1
		})
	}, false)
})(document);
(function(document) {
	'use strict';
	var toolbar;
	var api;
	var root;
	var steps;
	var hideSteps = [];
	var prev;
	var select;
	var next;
	var triggerEvent = function(el, eventName, detail) {
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent(eventName, true, true, detail);
		el.dispatchEvent(event)
	};
	var makeDomElement = function(html) {
		var tempDiv = document.createElement('div');
		tempDiv.innerHTML = html;
		return tempDiv.firstChild
	};
	var selectOptionsHtml = function() {
		var options = '';
		for (var i = 0; i < steps.length; i++) {
			if (hideSteps.indexOf(steps[i]) < 0) {
				options = options + '<option value="' + steps[i].id + '">' + steps[i].id + '</option>\n'
			}
		}
		return options
	};
	var addNavigationControls = function(event) {
		api = event.detail.api;
		var gc = api.lib.gc;
		root = event.target;
		steps = root.querySelectorAll('.step');
		var prevHtml = '<button id="impress-navigation-ui-prev" title="Previous" class="impress-navigation-ui">&lt;</button>';
		var selectHtml = '<select id="impress-navigation-ui-select" title="Go to" class="impress-navigation-ui">\n' + selectOptionsHtml() + '</select>';
		var nextHtml = '<button id="impress-navigation-ui-next" title="Next" class="impress-navigation-ui">&gt;</button>';
		prev = makeDomElement(prevHtml);
		prev.addEventListener('click', function() {
			if( window.is_edit || window.is_style ) return;
			api.prev()
		});
		select = makeDomElement(selectHtml);
		select.addEventListener('change', function(event) {
			api.goto(event.target.value)
		});
		gc.addEventListener(root, 'impress:steprefresh', function(event) {
			steps = root.querySelectorAll('.step');
			select.innerHTML = '\n' + selectOptionsHtml();
			select.value = event.target.id
		});
		next = makeDomElement(nextHtml);
		next.addEventListener('click', function() {
			if( window.is_edit || window.is_style ) return;
			api.next()
		});
		triggerEvent(toolbar, 'impress:toolbar:appendChild', {
			group: 0,
			element: prev
		});
		triggerEvent(toolbar, 'impress:toolbar:appendChild', {
			group: 0,
			element: select
		});
		triggerEvent(toolbar, 'impress:toolbar:appendChild', {
			group: 0,
			element: next
		})
	};
	document.addEventListener('impress:navigation-ui:hideStep', function(event) {
		if( window.is_edit || window.is_style ) return;
		hideSteps.push(event.target);
		if (select) {
			select.innerHTML = selectOptionsHtml()
		}
	}, false);
	document.addEventListener('impress:init', function(event) {
		toolbar = document.querySelector('#impress-toolbar');
		if (toolbar) {
			addNavigationControls(event)
		}
	}, false)
})(document);
(function(document) {
	"use strict";
	var root;
	var stepids = [];
	var getSteps = function() {
		stepids = [];
		var steps = root.querySelectorAll(".step");
		for (var i = 0; i < steps.length; i++) {
			stepids[i + 1] = steps[i].id
		}
	};
	document.addEventListener("impress:init", function(event) {
		root = event.target;
		getSteps();
		var gc = event.detail.api.lib.gc;
		gc.pushCallback(function() {
			stepids = [];
			if (progressbar) {
				progressbar.style.width = ""
			}
			if (progress) {
				progress.innerHTML = ""
			}
		})
	});
	var progressbar = document.querySelector("div.impress-progressbar div");
	var progress = document.querySelector("div.impress-progress");
	if (null !== progressbar || null !== progress) {
		document.addEventListener("impress:stepleave", function(event) {
			updateProgressbar(event.detail.next.id)
		});
		document.addEventListener("impress:steprefresh", function(event) {
			getSteps();
			updateProgressbar(event.target.id)
		})
	}

	function updateProgressbar(slideId) {
		var slideNumber = stepids.indexOf(slideId);
		if (null !== progressbar) {
			var width = 100 / (stepids.length - 1) * (slideNumber);
			progressbar.style.width = width.toFixed(2) + "%"
		}
		if (null !== progress) {
			progress.innerHTML = slideNumber + "/" + (stepids.length - 1)
		}
	}
})(document);
(function(document, window) {
	"use strict";
	var startingState = {};
	var toNumber = function(numeric, fallback) {
		return isNaN(numeric) ? (fallback || 0) : Number(numeric)
	};
	var toNumberAdvanced = function(numeric, fallback) {
		if (typeof numeric !== "string") {
			return toNumber(numeric, fallback)
		}
		var ratio = numeric.match(/^([+-]*[\d\.]+)([wh])$/);
		if (ratio == null) {
			return toNumber(numeric, fallback)
		} else {
			var value = parseFloat(ratio[1]);
			var multiplier = ratio[2] === "w" ? window.innerWidth : window.innerHeight;
			return value * multiplier
		}
	};
	var computeRelativePositions = function(el, prev) {
		var data = el.dataset;
		if (!prev) {
			prev = {
				x: 0,
				y: 0,
				z: 0,
				relative: {
					x: 0,
					y: 0,
					z: 0
				}
			}
		}
		if (data.relTo) {
			var ref = document.getElementById(data.relTo);
			if (ref) {
				if (el.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_PRECEDING) {
					prev.x = toNumber(ref.getAttribute("data-x"));
					prev.y = toNumber(ref.getAttribute("data-y"));
					prev.z = toNumber(ref.getAttribute("data-z"));
					prev.relative = {}
				} else {
					window.console.error("impress.js rel plugin: Step \"" + data.relTo + "\" is not defined *before* the current step. Referencing is limited to previously defined steps. Please check your markup. Ignoring data-rel-to attribute of this step. Have a look at the documentation for how to create relative positioning to later shown steps with the help of the goto plugin.")
				}
			} else {
				window.console.warn("impress.js rel plugin: \"" + data.relTo + "\" is not a valid step in this impress.js presentation. Please check your markup. Ignoring data-rel-to attribute of this step.")
			}
		}
		var step = {
			x: toNumber(data.x, prev.x),
			y: toNumber(data.y, prev.y),
			z: toNumber(data.z, prev.z),
			relative: {
				x: toNumberAdvanced(data.relX, prev.relative.x),
				y: toNumberAdvanced(data.relY, prev.relative.y),
				z: toNumberAdvanced(data.relZ, prev.relative.z)
			}
		};
		if (data.x !== undefined) {
			step.relative.x = 0
		}
		if (data.y !== undefined) {
			step.relative.y = 0
		}
		if (data.z !== undefined) {
			step.relative.z = 0
		}
		step.x = step.x + step.relative.x;
		step.y = step.y + step.relative.y;
		step.z = step.z + step.relative.z;
		return step
	};
	var rel = function(root) {
		var steps = root.querySelectorAll(".step");
		var prev;
		startingState[root.id] = [];
		for (var i = 0; i < steps.length; i++) {
			var el = steps[i];
			startingState[root.id].push({
				el: el,
				x: el.getAttribute("data-x"),
				y: el.getAttribute("data-y"),
				z: el.getAttribute("data-z"),
				relX: el.getAttribute("data-rel-x"),
				relY: el.getAttribute("data-rel-y"),
				relZ: el.getAttribute("data-rel-z")
			});
			var step = computeRelativePositions(el, prev);
			el.setAttribute("data-x", step.x);
			el.setAttribute("data-y", step.y);
			el.setAttribute("data-z", step.z);
			prev = step
		}
	};
	window.impress.addPreInitPlugin(rel);
	document.addEventListener("impress:init", function(event) {
		var root = event.target;
		event.detail.api.lib.gc.pushCallback(function() {
			var steps = startingState[root.id];
			var step;
			while (step = steps.pop()) {
				if (step.relX !== null) {
					if (step.x === null) {
						step.el.removeAttribute("data-x")
					} else {
						step.el.setAttribute("data-x", step.x)
					}
				}
				if (step.relY !== null) {
					if (step.y === null) {
						step.el.removeAttribute("data-y")
					} else {
						step.el.setAttribute("data-y", step.y)
					}
				}
				if (step.relZ !== null) {
					if (step.z === null) {
						step.el.removeAttribute("data-z")
					} else {
						step.el.setAttribute("data-z", step.z)
					}
				}
			}
			delete startingState[root.id]
		})
	}, false)
})(document, window);
(function(document, window) {
	"use strict";
	document.addEventListener("impress:init", function(event) {
		var api = event.detail.api;
		api.lib.gc.addEventListener(window, "resize", api.lib.util.throttle(function() {
			api.goto(document.querySelector(".step.active"), 500)
		}, 250), false)
	}, false)
})(document, window);
(function(document, window) {
	"use strict";
	var util;
	document.addEventListener("impress:init", function(event) {
		util = event.detail.api.lib.util
	}, false);
	var getNextStep = function(el) {
		var steps = document.querySelectorAll(".step");
		for (var i = 0; i < steps.length; i++) {
			if (steps[i] === el) {
				if (i + 1 < steps.length) {
					return steps[i + 1]
				} else {
					return steps[0]
				}
			}
		}
	};
	var getPrevStep = function(el) {
		var steps = document.querySelectorAll(".step");
		for (var i = steps.length - 1; i >= 0; i--) {
			if (steps[i] === el) {
				if (i - 1 >= 0) {
					return steps[i - 1]
				} else {
					return steps[steps.length - 1]
				}
			}
		}
	};
	var skip = function(event) {
		if ((!event) || (!event.target)) {
			return
		}
		if (event.detail.next.classList.contains("skip")) {
			if (event.detail.reason === "next") {
				event.detail.next = getNextStep(event.detail.next);
				skip(event)
			} else if (event.detail.reason === "prev") {
				event.detail.next = getPrevStep(event.detail.next);
				skip(event)
			}
			event.detail.transitionDuration = util.toNumber(event.detail.next.dataset.transitionDuration, event.detail.transitionDuration)
		}
	};
	window.impress.addPreStepLeavePlugin(skip, 1)
})(document, window);
(function(document, window) {
	"use strict";
	var stop = function(event) {
		if ((!event) || (!event.target)) {
			return
		}
		if (event.target.classList.contains("stop")) {
			if (event.detail.reason === "next") {
				return false
			}
		}
	};
	window.impress.addPreStepLeavePlugin(stop, 2)
})(document, window);
(function(document, window) {
	"use strict";
	var triggerEvent = function(el, eventName, detail) {
		var event = document.createEvent("CustomEvent");
		event.initCustomEvent(eventName, true, true, detail);
		el.dispatchEvent(event)
	};
	var activeStep = null;
	document.addEventListener("impress:stepenter", function(event) {
		activeStep = event.target
	}, false);
	var substep = function(event) {
		if ((!event) || (!event.target)) {
			return
		}
		var step = event.target;
		var el;
		if (event.detail.reason === "next") {
			el = showSubstepIfAny(step);
			if (el) {
				triggerEvent(step, "impress:substep:stepleaveaborted", {
					reason: "next",
					substep: el
				});
				triggerEvent(step, "impress:substep:enter", {
					reason: "next",
					substep: el
				});
				return false
			}
		}
		if (event.detail.reason === "prev") {
			el = hideSubstepIfAny(step);
			if (el) {
				triggerEvent(step, "impress:substep:stepleaveaborted", {
					reason: "prev",
					substep: el
				});
				triggerEvent(step, "impress:substep:leave", {
					reason: "prev",
					substep: el
				});
				return false
			}
		}
	};
	var showSubstepIfAny = function(step) {
		var substeps = step.querySelectorAll(".substep");
		var visible = step.querySelectorAll(".substep-visible");
		if (substeps.length > 0) {
			return showSubstep(substeps, visible)
		}
	};
	var showSubstep = function(substeps, visible) {
		if (visible.length < substeps.length) {
			for (var i = 0; i < substeps.length; i++) {
				substeps[i].classList.remove("substep-active")
			}
			var el = substeps[visible.length];
			el.classList.add("substep-visible");
			el.classList.add("substep-active");
			return el
		}
	};
	var hideSubstepIfAny = function(step) {
		var substeps = step.querySelectorAll(".substep");
		var visible = step.querySelectorAll(".substep-visible");
		if (substeps.length > 0) {
			return hideSubstep(visible)
		}
	};
	var hideSubstep = function(visible) {
		if (visible.length > 0) {
			var current = -1;
			for (var i = 0; i < visible.length; i++) {
				if (visible[i].classList.contains("substep-active")) {
					current = i
				}
				visible[i].classList.remove("substep-active")
			}
			if (current > 0) {
				visible[current - 1].classList.add("substep-active")
			}
			var el = visible[visible.length - 1];
			el.classList.remove("substep-visible");
			return el
		}
	};
	window.impress.addPreStepLeavePlugin(substep, 1);
	document.addEventListener("impress:stepenter", function(event) {
		var step = event.target;
		var visible = step.querySelectorAll(".substep-visible");
		for (var i = 0; i < visible.length; i++) {
			visible[i].classList.remove("substep-visible")
		}
	}, false);
	document.addEventListener("impress:substep:show", function() {
		showSubstepIfAny(activeStep)
	}, false);
	document.addEventListener("impress:substep:hide", function() {
		hideSubstepIfAny(activeStep)
	}, false)
})(document, window);
(function(document, window) {
	"use strict";
	var startX = 0;
	var lastX = 0;
	var lastDX = 0;
	var threshold = window.innerWidth / 20;
	document.addEventListener("touchstart", function(event) {
		lastX = startX = event.touches[0].clientX
	});
	document.addEventListener("touchmove", function(event) {
		var x = event.touches[0].clientX;
		var diff = x - startX;
		lastDX = lastX - x;
		lastX = x;
		window.impress().swipe(diff / window.innerWidth)
	});
	document.addEventListener("touchend", function() {
		var totalDiff = lastX - startX;
		if (Math.abs(totalDiff) > window.innerWidth / 5 && (totalDiff * lastDX) <= 0) {
			if (totalDiff > window.innerWidth / 5 && lastDX <= 0) {
				window.impress().prev()
			} else if (totalDiff < -window.innerWidth / 5 && lastDX >= 0) {
				window.impress().next()
			}
		} else if (Math.abs(lastDX) > threshold) {
			if (lastDX < -threshold) {
				window.impress().prev()
			} else if (lastDX > threshold) {
				window.impress().next()
			}
		} else {
			window.impress().goto(document.querySelector("#impress .step.active"))
		}
	});
	document.addEventListener("touchcancel", function() {
		window.impress().goto(document.querySelector("#impress .step.active"))
	})
})(document, window);
(function(document) {
	"use strict";
	var toolbar = document.getElementById("impress-toolbar");
	var groups = [];
	var getGroupElement = function(index) {
		var id = "impress-toolbar-group-" + index;
		if (!groups[index]) {
			groups[index] = document.createElement("span");
			groups[index].id = id;
			var nextIndex = getNextGroupIndex(index);
			if (nextIndex === undefined) {
				toolbar.appendChild(groups[index])
			} else {
				toolbar.insertBefore(groups[index], groups[nextIndex])
			}
		}
		return groups[index]
	};
	var getNextGroupIndex = function(index) {
		var i = index + 1;
		while (!groups[i] && i < groups.length) {
			i++
		}
		if (i < groups.length) {
			return i
		}
	};
	if (toolbar) {
		toolbar.addEventListener("impress:toolbar:appendChild", function(e) {
			var group = getGroupElement(e.detail.group);
			group.appendChild(e.detail.element)
		});
		toolbar.addEventListener("impress:toolbar:insertBefore", function(e) {
			toolbar.insertBefore(e.detail.element, e.detail.before)
		});
		toolbar.addEventListener("impress:toolbar:removeWidget", function(e) {
			toolbar.removeChild(e.detail.remove)
		});
		document.addEventListener("impress:init", function(event) {
			var api = event.detail.api;
			api.lib.gc.pushCallback(function() {
				toolbar.innerHTML = "";
				groups = []
			})
		})
	}
})(document);