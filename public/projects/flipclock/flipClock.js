/**
 * FlipClock — jQuery flip-digit countdown / clock
 * Organized: bootstrap → config → features → layout → markup → time API → tick engine
 */
(function ($, window) {
	"use strict";

	// -------------------------------------------------------------------------
	// Module helpers (no DOM)
	// -------------------------------------------------------------------------

	/** Strip ":" and parse as integer (e.g. "23:59:59" → 235959) */
	function timeStringToComparableInt(timeStr) {
		return parseInt(String(timeStr).replace(/:/g, ""), 10);
	}

	/** Inverse of {@link timeStringToComparableInt} for 4-digit MM:SS faces (pads to 4 digits). */
	function comparableIntToMmSsString(t) {
		var n = Math.max(0, Math.min(5959, parseInt(String(t), 10) || 0));
		var s = String(n);
		while (s.length < 4) {
			s = "0" + s;
		}
		return s.slice(0, 2) + ":" + s.slice(2, 4);
	}

	/** Prep step 5…1 → `00:05`…`00:01` on the flip clock. */
	function prepStepToMmSs(seconds) {
		var sec = Math.max(1, Math.min(5, seconds | 0));
		return "00:" + (sec < 10 ? "0" + sec : String(sec));
	}

	var transitionSupportComputed = false;
	var transitionSupport = false;

	function getTransitionSupport() {
		if (!transitionSupportComputed) {
			transitionSupportComputed = true;
			var body = document.body || document.documentElement;
			var style = body.style;
			transitionSupport = style.transition !== undefined || style.WebkitTransition !== undefined || style.MozTransition !== undefined || style.MsTransition !== undefined || style.OTransition !== undefined;
		}
		return transitionSupport;
	}

	// -------------------------------------------------------------------------
	// Constructor
	// -------------------------------------------------------------------------

	/**
	 * @param {Object} options — merged with defaults via createConfig
	 * @constructor
	 */
	function FlipClock(options) {
		this.tickInterval = false;
		/** True while the 5s prep countdown runs (before the main interval starts). */
		this.prepCountdownActive = false;
		this.digitSelectors = [];
		this.options = this.createConfig(options);
		this.init();
	}

	// -------------------------------------------------------------------------
	// Configuration
	// -------------------------------------------------------------------------

	FlipClock.prototype.createConfig = function (options) {
		return $.extend({}, this.getDefaultConfig(), options);
	};

	FlipClock.prototype.getDefaultConfig = function () {
		return {
			tickDuration: 1000,
			isCountdown: false,
			startTime: "23:59:51",
			maxTime: "23:59:59",
			minTime: "00:00:00",
			containerElement: $(".container"),
			segmentSelectorPrefix: "flipclock-",
			face: {
				hours: { maxValue: 23 },
				minutes: { maxValue: 59 },
				seconds: { maxValue: 59 },
			},
		};
	};

	// -------------------------------------------------------------------------
	// Feature detection
	// -------------------------------------------------------------------------

	FlipClock.prototype.initFeatureDetection = function () {
		if (typeof $.support === "undefined") {
			$.support = {};
		}
		$.support.transition = getTransitionSupport();
	};

	/**
	 * @param {string} feature — e.g. "transition"
	 * @returns {boolean}
	 */
	FlipClock.prototype.isFeatureSupported = function (feature) {
		if (!feature || typeof $.support === "undefined") {
			return false;
		}
		return $.support[feature] === true;
	};

	// -------------------------------------------------------------------------
	// Lifecycle & layout
	// -------------------------------------------------------------------------

	FlipClock.prototype.init = function () {
		var container = this.options.containerElement;
		container.empty();

		if (this.tickInterval !== false) {
			clearInterval(this.tickInterval);
			this.tickInterval = false;
		}

		this.appendMarkupToContainer();
		this.setDimensions();
		this.setupFallbacks();
		this.start();
	};

	FlipClock.prototype.setupFallbacks = function () {
		this.initFeatureDetection();
		var container = this.options.containerElement;
		var firstFlip = $("ul.flip li:first-child", container);

		if (this.isFeatureSupported("transition")) {
			firstFlip.css("z-index", 2);
		} else {
			firstFlip.css("z-index", 3);
			$("ul.flip:nth-child(2n+2):not(:last-child)", container).addClass("nth-child-2np2-notlast");
		}
	};

	FlipClock.prototype.setDimensions = function () {
		var container = this.options.containerElement;
		var el = container[0];
		var flipHeight = container.height();
		var flipWidth = flipHeight / 1.5;

		if (el && el.style) {
			el.style.setProperty("--fc-flip-h", flipHeight + "px");
			el.style.setProperty("--fc-flip-w", flipWidth + "px");
		}

		$("ul.flip", container)
			.css({
				width: flipWidth,
				fontSize: flipHeight - 10 + "px",
			})
			.find("li")
			.css({
				lineHeight: flipHeight + "px",
			});
	};

	// -------------------------------------------------------------------------
	// Markup: segments & digits
	// -------------------------------------------------------------------------

	FlipClock.prototype.createSegment = function (faceSegmentGroupName) {
		var faceSegmentGroup = this.options.face[faceSegmentGroupName];
		var addons = ["-ten", "-one"];
		var prefix = this.options.segmentSelectorPrefix;
		var rounded = Math.ceil(faceSegmentGroup.maxValue / 10);

		if (faceSegmentGroup.maxValue / 10 > 1) {
			return [
				{ selector: prefix + faceSegmentGroupName + addons[0], ticks: rounded },
				{ selector: prefix + faceSegmentGroupName + addons[1], ticks: 10 },
			];
		}
		return [{ selector: prefix + faceSegmentGroupName + addons[1], ticks: 10 }];
	};

	FlipClock.prototype.appendMarkupToContainer = function () {
		var baseZIndex = 0;
		var container = this.options.containerElement;
		var face = this.options.face;

		for (var faceSegmentGroup in face) {
			if (!Object.prototype.hasOwnProperty.call(face, faceSegmentGroup)) {
				continue;
			}
			face[faceSegmentGroup].segments = this.createSegment(faceSegmentGroup);
			var segments = face[faceSegmentGroup].segments;

			for (var i = 0; i < segments.length; i++) {
				var faceSegmentElement = this.createFaceSegment(segments[i]);
				this.digitSelectors.push(segments[i].selector);
				container.append(faceSegmentElement);
				faceSegmentElement.data("face-segment-group", faceSegmentGroup);
				faceSegmentElement.addClass(faceSegmentGroup);
				faceSegmentElement.css("z-index", baseZIndex++);
			}
		}

		this.digitSelectors.reverse();
	};

	FlipClock.prototype.createFaceSegment = function (faceSegment) {
		var faceElement = $("<ul>", { class: "flip " + faceSegment.selector });
		for (var i = 0; i < faceSegment.ticks; i++) {
			faceElement.append(this.createFaceDigit(i));
		}
		return faceElement;
	};

	FlipClock.prototype.createFaceDigit = function (digit) {
		var inner = '<div class="shadow"></div><div class="inn">' + digit + "</div>";
		var span = '<div class="up">' + inner + "</div>" + '<div class="down">' + inner + "</div>";
		return "<li data-digit=" + digit + " ><span>" + span + "</span></li>";
	};

	// -------------------------------------------------------------------------
	// Public clock API
	// -------------------------------------------------------------------------

	/**
	 * @param {boolean} [resumeOnly] — if true, keep the current face state (use after pause). If false/omitted, snap display to `startTime` (initial run / full restart).
	 */
	FlipClock.prototype.start = function (resumeOnly) {
		if (!resumeOnly) {
			this.setToTime(this.options.startTime);
		}
		var self = this;
		this.tickInterval = setInterval(function () {
			self.tick();
		}, this.options.tickDuration);
	};

	FlipClock.prototype.stop = function () {
		clearInterval(this.tickInterval);
		this.tickInterval = false;
	};

	FlipClock.prototype.resetDigits = function () {
		var container = this.options.containerElement;
		container.removeClass("play");

		for (var i = 0; i < this.digitSelectors.length; i++) {
			var sel = this.getDigitSelectorByIndex(i);
			var active = $(sel + ".current", container);
			var all = $(sel, container);
			var first = $(sel + ":first-child", container);

			all.eq(0).addClass("clockFix");
			all.removeClass("current");
			first.addClass("current");
			all.removeClass("previous");
			active.addClass("previous");
		}

		container.addClass("play");
	};

	FlipClock.prototype.setToTime = function (time) {
		var timeArray = time.replace(/:/g, "").split("").reverse();
		var container = this.options.containerElement;

		container.removeClass("play");

		for (var i = 0; i < this.digitSelectors.length; i++) {
			var sel = this.getDigitSelectorByIndex(i);
			var $col = $(sel, container);
			$col.removeClass("current previous countdownFix clockFix");
			var di = parseInt(timeArray[i], 10);
			if (Number.isNaN(di)) {
				di = 0;
			}
			$col.eq(di).addClass("current");
		}

		container.addClass("play");
	};

	FlipClock.prototype.setFaceSegmentGroupMaxValue = function (segmentGroupName) {
		var self = this;
		var container = this.options.containerElement;
		var group = this.getFaceSegmentGroupDom(segmentGroupName);

		group.each(function (idx) {
			container.removeClass("play");
			var maxValue = self.options.face[segmentGroupName].maxValue.toString().split("");
			$(this).find("li.current").removeClass("current");
			$(this)
				.find('li[data-digit="' + maxValue[idx] + '"]')
				.addClass("current");
			container.addClass("play");
		});
	};

	FlipClock.prototype.tick = function () {
		this.doTick(0);
	};

	// -------------------------------------------------------------------------
	// Time queries & selectors
	// -------------------------------------------------------------------------

	FlipClock.prototype.getCurrentTime = function () {
		var currentTime = [];
		$("li.current", this.options.containerElement).each(function () {
			currentTime.push($(this).data("digit"));
		});
		return parseInt(currentTime.join(""), 10);
	};

	FlipClock.prototype.getDigitSelectorByIndex = function (digitIndex) {
		return "ul." + this.digitSelectors[digitIndex] + " li";
	};

	FlipClock.prototype.getFaceSegmentGroupNameByDigitElement = function (digitElement) {
		return digitElement.parent().data("face-segment-group");
	};

	FlipClock.prototype.getFaceSegmentByDigitElement = function (digitElement) {
		return this.options.face[this.getFaceSegmentGroupNameByDigitElement(digitElement)];
	};

	FlipClock.prototype.getFaceSegmentGroupDom = function (segmentGroupName) {
		return $("." + segmentGroupName, this.options.containerElement);
	};

	FlipClock.prototype.getCurrentDigitDom = function (segmentGroupName) {
		return $("." + segmentGroupName + " li.current", this.options.containerElement);
	};

	FlipClock.prototype.getCurrentFaceSegmentGroupValue = function (digitElement) {
		var segmentGroupName = this.getFaceSegmentGroupNameByDigitElement(digitElement);
		var values = [];
		this.getCurrentDigitDom(segmentGroupName).each(function (idx) {
			values[idx] = $(this).data("digit");
		});
		return values.join("");
	};

	FlipClock.prototype.isMaxTimeReached = function () {
		return this.getCurrentTime() >= timeStringToComparableInt(this.options.maxTime);
	};

	FlipClock.prototype.isMinTimeReached = function () {
		return this.getCurrentTime() <= timeStringToComparableInt(this.options.minTime);
	};

	// -------------------------------------------------------------------------
	// Tick engine
	// -------------------------------------------------------------------------

	FlipClock.prototype.doTick = function (digitIndex) {
		var opts = this.options;
		var container = opts.containerElement;
		var isDown = opts.isCountdown === true;
		var pseudoSelector = isDown ? ":first-child" : ":last-child";
		var digitSel = this.getDigitSelectorByIndex(digitIndex);
		var activeDigit = $(digitSel + ".current", container);
		var nextDigit;

		if (opts.isCountdown === false && this.isMaxTimeReached()) {
			this.resetDigits();
			return;
		}

		container.removeClass("play");

		if (!activeDigit.length) {
			if (isDown) {
				activeDigit = $(digitSel + ":last-child", container);
				nextDigit = activeDigit.prev("li");
			} else {
				activeDigit = $(digitSel, container).eq(0);
				nextDigit = activeDigit.next("li");
			}
			activeDigit.addClass("previous").removeClass("current");
			nextDigit.addClass("current");
		} else if (activeDigit.is(pseudoSelector)) {
			$(digitSel, container).removeClass("previous");

			if (isDown && this.isMinTimeReached()) {
				this.stop();
				opts.containerElement.trigger("flipclock:countdown-complete");
				return;
			}

			activeDigit.addClass("previous").removeClass("current");

			if (isDown) {
				activeDigit.addClass("countdownFix");
				activeDigit = $(digitSel + ":last-child", container);
			} else {
				activeDigit = $(digitSel, container).eq(0);
				activeDigit.addClass("clockFix");
			}

			activeDigit.addClass("current");

			if (this.digitSelectors[digitIndex + 1] !== undefined) {
				this.doTick(digitIndex + 1);
			}
		} else {
			$(digitSel, container).removeClass("previous");
			activeDigit.addClass("previous").removeClass("current");
			nextDigit = isDown ? activeDigit.prev("li") : activeDigit.next("li");
			nextDigit.addClass("current");
		}

		var group = this.getFaceSegmentByDigitElement(activeDigit);
		if (this.getCurrentFaceSegmentGroupValue(activeDigit) > group.maxValue) {
			this.setFaceSegmentGroupMaxValue(this.getFaceSegmentGroupNameByDigitElement(activeDigit));
		}

		container.addClass("play");
		this.cleanZIndexFix(activeDigit, this.digitSelectors[digitIndex]);
	};

	FlipClock.prototype.cleanZIndexFix = function (activeDigit, selector) {
		var container = this.options.containerElement;
		if (this.options.isCountdown === true) {
			var fix = $("." + selector + " .countdownFix", container);
			if (fix.length > 0 && !fix.hasClass("previous") && !fix.hasClass("current")) {
				fix.removeClass("countdownFix");
			}
		} else {
			activeDigit.siblings().removeClass("clockFix");
		}
	};

	// -------------------------------------------------------------------------
	// Export & page bootstrap
	// -------------------------------------------------------------------------

	window.FlipClock = FlipClock;

	// -------------------------------------------------------------------------
	// Preset timers (CRUD + optional sync of flipClock.json via dev server)
	// -------------------------------------------------------------------------

	var PRESET_STORAGE_KEY = "flipclock-preset-timers-v1";
	var ACTIVE_PRESET_ID_STORAGE_KEY = "flipclock-active-preset-id-v1";
	var PRESET_SLIDER_THUMBS_KEY = "flipclock-preset-slider-thumbs-v1";
	var PRESET_TRACK_MAX_KEY = "flipclock-preset-track-max-v1";
	var FLIPCLOCK_COUNTER_PCT_KEY = "flipclock-counter-pct-v1";
	var FLIPCLOCK_SOUNDS_KEY = "flipclock-sounds-v1";
	var FLIPCLOCK_SOUND_NAMES_KEY = "flipclock-sound-filenames-v1";
	var FLIPCLOCK_SOUND_SOURCE_KEY = "flipclock-sound-source-v1";
	var FLIPCLOCK_SOUND_PRELOADED_KEY = "flipclock-sound-preloaded-v1";
	var SOUNDS_MANIFEST_URL = "sounds/manifest.json";
	var FLIPCLOCK_APP_BG_KEY = "flipclock-app-bg-v1";
	var PRESET_JSON_FILE = "flipClock.json";
	/** Keys for Timer settings → Sounds (must match `data-sound-kind` in HTML). */
	var PRESET_SOUND_KINDS = ["start", "pause", "finish"];

	var TRACK_MAX_MIN = 10;
	var TRACK_MAX_MAX = 60;
	var TRACK_MAX_STEP = 5;

	function snapTrackMaxMinutes(n) {
		var x = Number(n);
		if (Number.isNaN(x)) {
			return TRACK_MAX_MIN;
		}
		x = Math.min(TRACK_MAX_MAX, Math.max(TRACK_MAX_MIN, x));
		var steps = Math.round((x - TRACK_MAX_MIN) / TRACK_MAX_STEP);
		var snapped = TRACK_MAX_MIN + steps * TRACK_MAX_STEP;
		return Math.min(TRACK_MAX_MAX, Math.max(TRACK_MAX_MIN, snapped));
	}

	function loadPresetTrackMax() {
		try {
			var raw = localStorage.getItem(PRESET_TRACK_MAX_KEY);
			if (raw === null) {
				return TRACK_MAX_MIN;
			}
			var n = Number(raw);
			if (Number.isNaN(n)) {
				return TRACK_MAX_MIN;
			}
			return snapTrackMaxMinutes(n);
		} catch (e) {
			return TRACK_MAX_MIN;
		}
	}

	var presetTrackMaxMinutes = loadPresetTrackMax();

	function getPresetTrackMax() {
		return presetTrackMaxMinutes;
	}

	var COUNTER_SIZE_MIN = 5;
	var COUNTER_SIZE_MAX = 95;
	var COUNTER_SIZE_STEP = 5;
	/** Matches `$preset-counter-thumb-half` / 20px thumb in `flipClock.scss`. */
	var COUNTER_SIZE_RAIL_PAD_PX = 10;
	var COUNTER_SIZE_THUMB_PX = 20;

	function snapCounterSizePct(n) {
		var x = Number(n);
		if (Number.isNaN(x)) {
			return snapCounterSizePct(12);
		}
		x = Math.min(COUNTER_SIZE_MAX, Math.max(COUNTER_SIZE_MIN, x));
		var steps = Math.round((x - COUNTER_SIZE_MIN) / COUNTER_SIZE_STEP);
		var snapped = COUNTER_SIZE_MIN + steps * COUNTER_SIZE_STEP;
		return Math.min(COUNTER_SIZE_MAX, Math.max(COUNTER_SIZE_MIN, snapped));
	}

	function setCounterRangeFillPct(inputEl, value) {
		if (!inputEl) {
			return;
		}
		var rail = inputEl.closest && inputEl.closest(".preset-counter-size-rail");
		if (!rail || !rail.style) {
			return;
		}
		var minAttr = parseInt(inputEl.getAttribute("min"), 10);
		var maxAttr = parseInt(inputEl.getAttribute("max"), 10);
		var min = Number.isNaN(minAttr) ? COUNTER_SIZE_MIN : minAttr;
		var max = Number.isNaN(maxAttr) ? COUNTER_SIZE_MAX : maxAttr;
		var v = Number(value);
		if (Number.isNaN(v)) {
			v = min;
		}
		v = Math.min(max, Math.max(min, v));
		var rw = rail.getBoundingClientRect().width;
		var span = max - min;
		var t = span > 0 ? (v - min) / span : 0;
		var thumbCenter = COUNTER_SIZE_RAIL_PAD_PX + COUNTER_SIZE_THUMB_PX / 2 + t * (rw - 2 * COUNTER_SIZE_RAIL_PAD_PX - COUNTER_SIZE_THUMB_PX);
		var fillW = Math.max(0, thumbCenter - COUNTER_SIZE_RAIL_PAD_PX);
		rail.style.setProperty("--preset-counter-fill-width", fillW + "px");
	}

	/** Refills both counter-size and track-max range inputs (same `.preset-counter-size-*` component). */
	function refreshPresetCounterSizeRangeFills() {
		var ids = ["flipclock-counter-size", "flipclock-preset-track-max"];
		for (var ii = 0; ii < ids.length; ii++) {
			var el = document.getElementById(ids[ii]);
			if (!el) {
				continue;
			}
			var v = parseInt(el.value, 10);
			if (Number.isNaN(v)) {
				continue;
			}
			setCounterRangeFillPct(el, v);
		}
	}

	/**
	 * Max-minutes track: rebuild tick dots from the range input’s min/max/step (any values).
	 * Sets inline `left: calc(2×pad + t×(100% − 4×pad))` (same geometry as SCSS / setCounterRangeFillPct) so layout works
	 * while the settings panel is hidden and avoids `var(--tick-t)` inside `calc()` quirks in some engines.
	 */
	var TRACK_MAX_TICK_PAD_PX = 10;

	function rebuildTrackMaxTicks(wrap) {
		if (!wrap) {
			wrap = document.querySelector(".preset-counter-size-wrap--track-max .preset-counter-size-ticks");
		}
		if (!wrap) {
			return;
		}
		var rail = wrap.closest && wrap.closest(".preset-counter-size-rail");
		var input = rail && rail.querySelector("input.preset-counter-size-input[type=range]");
		if (!input) {
			return;
		}
		var min = parseFloat(input.getAttribute("min"));
		var max = parseFloat(input.getAttribute("max"));
		var step = parseFloat(input.getAttribute("step"));
		if (Number.isNaN(min) || Number.isNaN(max)) {
			return;
		}
		if (Number.isNaN(step) || step <= 0) {
			step = 1;
		}
		wrap.innerHTML = "";
		var span0 = max - min;
		var nSteps = Math.max(0, Math.floor((max - min) / step + 1e-9));
		var pad = TRACK_MAX_TICK_PAD_PX;
		var innerPct = "(100% - " + 4 * pad + "px)";
		var i;
		for (i = 0; i <= nSteps; i++) {
			var v = min + i * step;
			if (v > max + 1e-9) {
				break;
			}
			v = Math.round(v * 1000) / 1000;
			var t = span0 > 0 ? (v - min) / span0 : 0;
			var span = document.createElement("span");
			span.className = "preset-counter-size-tick";
			span.style.left = "calc(" + 2 * pad + "px + " + t + " * " + innerPct + ")";
			span.setAttribute("data-value", String(v));
			span.setAttribute("aria-hidden", "true");
			wrap.appendChild(span);
		}
	}

	/** One span.preset-counter-size-tick per snap stop per rail; min/max/step from that rail’s range input (counter % only). Track-max ticks: skip here — `#preset-settings-frame` is hidden at load (0-width rail); **`rebuildTrackMaxTicks`** runs when Timer settings opens. */
	function initPresetCounterSizeTicks() {
		var wraps = document.querySelectorAll(".preset-counter-size-ticks");
		for (var wi = 0; wi < wraps.length; wi++) {
			var wrap = wraps[wi];
			if (wrap.closest && wrap.closest(".preset-counter-size-wrap--track-max")) {
				continue;
			}
			if (wrap.querySelector(".preset-counter-size-tick")) {
				continue;
			}
			var rail = wrap.closest && wrap.closest(".preset-counter-size-rail");
			var input = rail && rail.querySelector("input.preset-counter-size-input[type=range]");
			if (!input) {
				continue;
			}
			var min = parseInt(input.getAttribute("min"), 10);
			var max = parseInt(input.getAttribute("max"), 10);
			var step = parseInt(input.getAttribute("step"), 10) || 1;
			if (Number.isNaN(min) || Number.isNaN(max)) {
				continue;
			}
			for (var v = min; v <= max; v += step) {
				var span = document.createElement("span");
				span.className = "preset-counter-size-tick";
				span.setAttribute("data-value", String(v));
				span.setAttribute("aria-hidden", "true");
				wrap.appendChild(span);
			}
		}
	}

	function loadCounterSizePct() {
		try {
			var raw = localStorage.getItem(FLIPCLOCK_COUNTER_PCT_KEY);
			if (raw === null) {
				return snapCounterSizePct(12);
			}
			var n = Number(raw);
			if (Number.isNaN(n)) {
				return snapCounterSizePct(12);
			}
			return snapCounterSizePct(Math.round(n));
		} catch (e) {
			return snapCounterSizePct(12);
		}
	}

	function applyCounterSizePct(pct, clock) {
		try {
			document.documentElement.style.setProperty("--flipclock-counter-pct", String(pct));
		} catch (e) {
			/* ignore */
		}
		if (clock && typeof clock.setDimensions === "function") {
			clock.setDimensions();
		}
	}

	function loadSoundsFromStorage() {
		try {
			var raw = localStorage.getItem(FLIPCLOCK_SOUNDS_KEY);
			if (raw === null || raw === "") {
				return {};
			}
			var data = JSON.parse(raw);
			if (!data || typeof data !== "object") {
				return {};
			}
			return data;
		} catch (e) {
			return {};
		}
	}

	function saveSoundsToStorage(obj) {
		try {
			localStorage.setItem(FLIPCLOCK_SOUNDS_KEY, JSON.stringify(obj));
		} catch (e) {
			window.alert("Could not save sounds (storage may be full). Try shorter files or clear other site data.");
		}
	}

	function loadSoundNamesFromStorage() {
		try {
			var raw = localStorage.getItem(FLIPCLOCK_SOUND_NAMES_KEY);
			if (raw === null || raw === "") {
				return {};
			}
			var data = JSON.parse(raw);
			if (!data || typeof data !== "object") {
				return {};
			}
			return data;
		} catch (e) {
			return {};
		}
	}

	function saveSoundNamesToStorage(obj) {
		try {
			localStorage.setItem(FLIPCLOCK_SOUND_NAMES_KEY, JSON.stringify(obj));
		} catch (e) {
			/* ignore */
		}
	}

	function loadSoundSourceFromStorage() {
		try {
			var raw = localStorage.getItem(FLIPCLOCK_SOUND_SOURCE_KEY);
			if (raw === "preloaded" || raw === "upload") {
				return raw;
			}
		} catch (e) {
			/* ignore */
		}
		return "upload";
	}

	function saveSoundSourceToStorage(mode) {
		try {
			if (mode === "preloaded" || mode === "upload") {
				localStorage.setItem(FLIPCLOCK_SOUND_SOURCE_KEY, mode);
			}
		} catch (e) {
			/* ignore */
		}
	}

	function emptyPreloadedSoundSelections() {
		var o = {};
		for (var i = 0; i < PRESET_SOUND_KINDS.length; i++) {
			o[PRESET_SOUND_KINDS[i]] = "";
		}
		return o;
	}

	function loadPreloadedSoundSelectionsFromStorage() {
		var empty = emptyPreloadedSoundSelections();
		try {
			var raw = localStorage.getItem(FLIPCLOCK_SOUND_PRELOADED_KEY);
			if (raw === null || raw === "") {
				return empty;
			}
			var data = JSON.parse(raw);
			if (!data || typeof data !== "object") {
				return empty;
			}
			for (var j = 0; j < PRESET_SOUND_KINDS.length; j++) {
				var k = PRESET_SOUND_KINDS[j];
				if (typeof data[k] === "string") {
					empty[k] = data[k];
				}
			}
			return empty;
		} catch (e) {
			return empty;
		}
	}

	function savePreloadedSoundSelectionsToStorage(obj) {
		try {
			localStorage.setItem(FLIPCLOCK_SOUND_PRELOADED_KEY, JSON.stringify(obj));
		} catch (e) {
			/* ignore */
		}
	}

	/**
	 * Base URL for resolving `sounds/...` paths. Strips a trailing slash from the path so
	 * `http://host/flipClock/` does not resolve `sounds/x` to `http://host/flipClock/sounds/x` (404);
	 * without the slash, resolution matches `flipClock.html` + sibling `sounds/` → `/sounds/x`.
	 */
	function baseHrefForSoundRelativeUrl() {
		if (typeof URL === "undefined" || typeof location === "undefined" || !location.href) {
			return typeof location !== "undefined" ? location.href : "";
		}
		try {
			var u = new URL(location.href);
			if (u.pathname.length > 1 && /\/$/.test(u.pathname)) {
				u.pathname = u.pathname.replace(/\/+$/, "") || "/";
			}
			return u.href;
		} catch (e) {
			return location.href;
		}
	}

	/** URL for a file under `sounds/` (path segments encoded). */
	function preloadedFilenameToSoundUrl(filename) {
		if (typeof filename !== "string" || filename.length === 0) {
			return null;
		}
		var raw = filename.trim();
		if (raw.length === 0) {
			return null;
		}
		if (typeof raw.normalize === "function") {
			try {
				raw = raw.normalize("NFC");
			} catch (e) {
				/* ignore */
			}
		}
		var parts = raw.split("/").filter(function (p) {
			return p.length > 0;
		});
		if (parts.length === 0) {
			return null;
		}
		var enc = parts.map(encodeURIComponent).join("/");
		var rel = "sounds/" + enc;
		try {
			if (typeof URL !== "undefined" && typeof location !== "undefined" && location.href) {
				return new URL(rel, baseHrefForSoundRelativeUrl()).href;
			}
		} catch (e2) {
			/* ignore */
		}
		return rel;
	}

	function resolveSoundUrlForKind(kind) {
		var src = loadSoundSourceFromStorage();
		if (src === "preloaded") {
			var sel = loadPreloadedSoundSelectionsFromStorage();
			var fn = sel[kind];
			return preloadedFilenameToSoundUrl(fn);
		}
		var sounds = loadSoundsFromStorage();
		var url = sounds[kind];
		return typeof url === "string" && url.length > 0 ? url : null;
	}

	function assignFileToInput(input, file) {
		if (!input || !file) {
			return false;
		}
		try {
			var dt = new DataTransfer();
			dt.items.add(file);
			input.files = dt.files;
			return true;
		} catch (e) {
			return false;
		}
	}

	function syncPresetFileDropFromInput(input) {
		if (!input) {
			return;
		}
		var $drop = $(input).closest(".preset-file-drop");
		if (!$drop.length) {
			return;
		}
		var $label = $drop.find("[data-file-label]");
		var $btn = $drop.find(".preset-file-drop__btn");
		var kind = $(input).attr("data-sound-kind");
		var isBg = $(input).hasClass("preset-settings-file--bg");
		var hasFile = false;
		var displayName = "";
		if (kind) {
			var sounds = loadSoundsFromStorage();
			var url = sounds[kind];
			hasFile = typeof url === "string" && url.length > 0;
			if (hasFile) {
				var names = loadSoundNamesFromStorage();
				displayName = names[kind] || "Audio file";
			}
		} else if (isBg) {
			var st = loadAppBgStateFromStorage();
			hasFile = !!(st && st.dataUrl);
			if (hasFile) {
				displayName = (st.fileName && String(st.fileName)) || "Background image";
			}
		}
		$label.text(hasFile ? displayName : "No file selected");
		$btn.text(hasFile ? "Clear" : "Upload");
		var ctx = $drop.closest(".preset-settings-upload-row").find(".preset-settings-upload-row__label").first().text() || "file";
		$btn.attr("aria-label", hasFile ? "Clear " + ctx : "Upload " + ctx);
	}

	function syncAllPresetFileDrops() {
		$(".preset-file-drop__input.preset-settings-file").each(function () {
			syncPresetFileDropFromInput(this);
		});
	}

	/** Tiny silent WAV — played once after user gesture so browsers allow later HTMLAudio playback (e.g. finish sound without a click). */
	var FLIPCLOCK_SILENT_WAV =
		"data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=";

	var flipClockAudioUnlockDone = false;
	/** Shared Web Audio context (prep beeps + unlock). */
	var flipClockSharedAudioContext = null;

	/**
	 * Wall time for one full digit flip (ms). Must match `flipClock.scss` stacked halves:
	 * `$anim-delay-stack` + `$anim-flip` → 0.5s + 0.5s. Used only for prep beep timing (not in `doTick`).
	 */
	var FLIPCLOCK_PREP_FLIP_MS = 1000;
	/** Extra ms after full flip duration if `animationend` never fires (slow devices, reduced motion). */
	var FLIPCLOCK_PREP_FLIP_FALLBACK_PAD_MS = 400;
	/**
	 * Countdown `setInterval` must tick **after** the stacked CSS flip finishes (~1000ms). 50ms buffer avoids
	 * `removeClass("play")` mid-animation on the main timer (same torn-digit glitch as prep).
	 */
	var FLIPCLOCK_COUNTDOWN_TICK_BUFFER_MS = 50;

	function getFlipClockSharedAudioContext() {
		if (flipClockSharedAudioContext) {
			return flipClockSharedAudioContext;
		}
		try {
			var Ctx = window.AudioContext || window.webkitAudioContext;
			if (!Ctx) {
				return null;
			}
			flipClockSharedAudioContext = new Ctx();
			return flipClockSharedAudioContext;
		} catch (e) {
			return null;
		}
	}

	/** Short sine beep for prep countdown (one per second). */
	function playPrepCountdownBeep() {
		var ctx = getFlipClockSharedAudioContext();
		if (!ctx) {
			return;
		}
		if (ctx.state === "suspended" && typeof ctx.resume === "function") {
			ctx.resume().catch(function () {});
		}
		try {
			var t0 = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, t0);
			gain.gain.setValueAtTime(0.0001, t0);
			gain.gain.linearRampToValueAtTime(0.2, t0 + 0.01);
			gain.gain.linearRampToValueAtTime(0.0001, t0 + 0.09);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t0);
			osc.stop(t0 + 0.1);
		} catch (e) {
			/* ignore */
		}
	}

	function flipClockUnlockHtmlAudioIfNeeded() {
		if (flipClockAudioUnlockDone) {
			return;
		}
		flipClockAudioUnlockDone = true;
		try {
			var a = new Audio(FLIPCLOCK_SILENT_WAV);
			a.volume = 0;
			var p = a.play();
			if (p && typeof p.catch === "function") {
				p.catch(function () {});
			}
		} catch (e) {
			/* ignore */
		}
		try {
			var ctx = getFlipClockSharedAudioContext();
			if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
				ctx.resume().catch(function () {});
			}
		} catch (e2) {
			/* ignore */
		}
	}

	function playFlipClockSound(kind) {
		var url = resolveSoundUrlForKind(kind);
		if (!url || typeof url !== "string") {
			return;
		}
		try {
			var a = new Audio();
			if ("playsInline" in a) {
				a.playsInline = true;
			}
			try {
				a.setAttribute("playsinline", "");
			} catch (eAttr) {
				/* ignore */
			}
			a.preload = "auto";
			a.volume = 1;
			var run = function () {
				var p = a.play();
				if (p && typeof p.catch === "function") {
					p.catch(function () {});
				}
			};
			var done = false;
			var tryPlay = function () {
				if (done) {
					return;
				}
				done = true;
				run();
			};
			a.addEventListener("canplay", tryPlay, { once: true });
			a.addEventListener(
				"error",
				function () {
					done = true;
				},
				{ once: true },
			);
			a.src = url;
			a.load();
			if (typeof a.readyState === "number" && a.readyState >= 2) {
				tryPlay();
			}
		} catch (e) {
			/* ignore */
		}
	}

	var PRESET_COLOR_SWATCHES = [
		{ hex: "#ffffff", label: "White" },
		{ hex: "#cccccc", label: "Light gray" },
		{ hex: "#888888", label: "Gray" },
		{ hex: "#333333", label: "Dark gray" },
		{ hex: "#000000", label: "Black" },
		{ hex: "#127c02", label: "Green" },
		{ hex: "#1e5a8c", label: "Blue" },
		{ hex: "#6b2d9c", label: "Purple" },
		{ hex: "#c41e3a", label: "Red" },
		{ hex: "#e6a800", label: "Amber" },
		{ hex: "#0d7377", label: "Teal" },
		{ hex: "#ff6b35", label: "Orange" },
	];

	function normalizeHexColor(hex) {
		var s = String(hex == null ? "" : hex).trim();
		if (/^#[0-9A-Fa-f]{6}$/.test(s)) {
			return s.toLowerCase();
		}
		if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
			var h = s.slice(1);
			return ("#" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]).toLowerCase();
		}
		return "#ffffff";
	}

	/** WCAG relative luminance (0–1); higher = lighter. @param {string} hex Normalized #rrggbb */
	function relativeLuminanceFromHex(hex) {
		var h = normalizeHexColor(hex);
		var r = parseInt(h.slice(1, 3), 16) / 255;
		var g = parseInt(h.slice(3, 5), 16) / 255;
		var b = parseInt(h.slice(5, 7), 16) / 255;
		function lin(c) {
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		}
		return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
	}

	/**
	 * Digit + colon colors for preset background (light bg → dark text).
	 * @param {string} hex Normalized #rrggbb
	 */
	function flipDigitContrastFromBgHex(hex) {
		var L = relativeLuminanceFromHex(hex);
		if (L > 0.55) {
			return {
				fg: "#000000",
				textShadow: "0 1px 0 rgba(255, 255, 255, 0.35)",
				colonFg: "#000000",
				colonTextShadow: "0 1px 2px rgba(255, 255, 255, 0.45)",
			};
		}
		return {
			fg: "#cccccc",
			textShadow: "0 1px 2px #000",
			colonFg: "#ffffff",
			colonTextShadow: "1px 1px 3px rgba(0, 0, 0, 0.6)",
		};
	}

	/**
	 * Sets or clears `--flip-digit-bg` and matching contrast vars on `.countdown`.
	 * @param {jQuery} $cd
	 * @param {string | null} hex Preset color or null to clear
	 */
	function applyCounterContrastFromPresetColor($cd, hex) {
		var el = $cd[0];
		if (!el || !el.style) {
			return;
		}
		if (hex == null) {
			el.style.removeProperty("--flip-digit-bg");
			el.style.removeProperty("--flip-digit-fg");
			el.style.removeProperty("--flip-digit-text-shadow");
			el.style.removeProperty("--flip-colon-fg");
			el.style.removeProperty("--flip-colon-text-shadow");
			return;
		}
		var norm = normalizeHexColor(hex);
		var c = flipDigitContrastFromBgHex(norm);
		$cd.css({
			"--flip-digit-bg": norm,
			"--flip-digit-fg": c.fg,
			"--flip-digit-text-shadow": c.textShadow,
			"--flip-colon-fg": c.colonFg,
			"--flip-colon-text-shadow": c.colonTextShadow,
		});
	}

	function generatePresetId() {
		return "preset-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
	}

	/** @param {number} mins */
	function minutesToStartTime(mins) {
		var total = Math.max(0, Number(mins) || 0);
		var m = Math.floor(total);
		var s = Math.round((total - m) * 60);
		if (s >= 60) {
			m += Math.floor(s / 60);
			s = s % 60;
		}
		if (m > 99) {
			m = 99;
			s = 59;
		}
		var mm = m < 10 ? "0" + m : String(m);
		var ss = s < 10 ? "0" + s : String(s);
		return mm + ":" + ss;
	}

	function normalizePreset(raw) {
		var maxM = getPresetTrackMax();
		return {
			id: raw.id || generatePresetId(),
			name: String(raw.name || "").trim() || "Untitled",
			color: normalizeHexColor(raw.color),
			minutes: snapPresetMinutesToStep(Number(raw.minutes) || 0, maxM),
			rounds: Math.min(10, Math.max(1, Math.round(Number(raw.rounds) || 1))),
			intervalMinutes: snapPresetMinutesToStep(Number(raw.intervalMinutes) || 0, maxM),
		};
	}

	/** Display minutes for preset summary (matches slider / table semantics). */
	function formatPresetMinuteLabel(n) {
		var v = Number(n);
		if (v !== v) {
			return "—";
		}
		var maxM = getPresetTrackMax();
		var step = getPresetMinuteSliderStep(maxM);
		if (step >= 1) {
			return String(Math.round(v)) + " min";
		}
		var s = v % 1 === 0 ? String(v) : v.toFixed(1);
		return s + " min";
	}

	function loadPresetsFromStorage() {
		try {
			var raw = localStorage.getItem(PRESET_STORAGE_KEY);
			if (raw === null) {
				return null;
			}
			var data = JSON.parse(raw);
			if (data && Array.isArray(data.presets)) {
				return data.presets.map(normalizePreset);
			}
		} catch (e) {
			return null;
		}
		return null;
	}

	function savePresetsToStorage(presets) {
		var payload = { version: 1, presets: presets };
		localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(payload));
	}

	function loadActivePresetIdFromStorage() {
		try {
			var raw = localStorage.getItem(ACTIVE_PRESET_ID_STORAGE_KEY);
			if (raw === null || raw === "") {
				return null;
			}
			return String(raw);
		} catch (e) {
			return null;
		}
	}

	function saveActivePresetIdToStorage(id) {
		try {
			if (id == null || id === "") {
				localStorage.removeItem(ACTIVE_PRESET_ID_STORAGE_KEY);
			} else {
				localStorage.setItem(ACTIVE_PRESET_ID_STORAGE_KEY, String(id));
			}
		} catch (e) {
			/* ignore quota */
		}
	}

	function loadSliderThumbsFromStorage() {
		try {
			var raw = localStorage.getItem(PRESET_SLIDER_THUMBS_KEY);
			if (raw === null) {
				return null;
			}
			var data = JSON.parse(raw);
			if (!data || typeof data !== "object") {
				return null;
			}
			return {
				minutes: Number(data.minutes),
				intervalMinutes: Number(data.intervalMinutes),
				rounds: Number(data.rounds),
			};
		} catch (e) {
			return null;
		}
	}

	function normalizeSliderThumbState(data) {
		if (!data) {
			return null;
		}
		var maxM = getPresetTrackMax();
		var m = Math.min(maxM, Math.max(0, Number(data.minutes)));
		if (Number.isNaN(m)) {
			m = 5;
		}
		m = snapPresetMinutesToStep(m, maxM);
		var i = Math.min(maxM, Math.max(0, Number(data.intervalMinutes)));
		if (Number.isNaN(i)) {
			i = 0;
		}
		i = snapPresetMinutesToStep(i, maxM);
		var r = Math.min(10, Math.max(1, Math.round(Number(data.rounds))));
		if (Number.isNaN(r)) {
			r = 1;
		}
		return { minutes: m, intervalMinutes: i, rounds: r };
	}

	/** Track max ≤ 30 → 0.5 min steps; &gt; 30 → 5 min steps (duration / interval). */
	var PRESET_MINUTE_STEP_THRESHOLD = 30;
	var PRESET_MINUTE_STEP_FINE = 0.5;
	var PRESET_MINUTE_STEP_COARSE = 5;

	function getPresetMinuteSliderStep(maxM) {
		var m = Number(maxM);
		if (Number.isNaN(m)) {
			return PRESET_MINUTE_STEP_FINE;
		}
		return m > PRESET_MINUTE_STEP_THRESHOLD ? PRESET_MINUTE_STEP_COARSE : PRESET_MINUTE_STEP_FINE;
	}

	function snapPresetMinutesToStep(v, maxM) {
		var step = getPresetMinuteSliderStep(maxM);
		var max = Math.max(0, Number(maxM) || 0);
		var x = Number(v);
		if (Number.isNaN(x)) {
			x = 0;
		}
		x = Math.min(max, Math.max(0, x));
		var snapped = Math.round(x / step) * step;
		snapped = Math.round(snapped * 1000) / 1000;
		return Math.min(max, Math.max(0, snapped));
	}

	/** Duration / interval legend & cluster (matches active step for current track max). */
	function formatPresetMinuteSliderLabel(v, maxM) {
		var n = snapPresetMinutesToStep(v, maxM);
		var step = getPresetMinuteSliderStep(maxM);
		if (step >= 1) {
			return String(Math.round(n));
		}
		if (n % 1 === 0) {
			return String(n);
		}
		return n.toFixed(1);
	}

	/** Match `.preset-minutes-slider` `--thumbs-too-close` (percent of track). */
	var PRESET_SLIDER_OVERLAP_THRESH_PCT = 5;
	/** Base thumb fills (same order as duration / interval / rounds inputs). */
	var PRESET_THUMB_RGB = [
		[3, 102, 214],
		[201, 120, 26],
		[124, 58, 237],
	];

	function presetSliderCompleted01(el, minV, maxV) {
		var v = Number(el.value);
		if (Number.isNaN(v)) {
			return 0;
		}
		return ((v - minV) / (maxV - minV)) * 100;
	}

	function presetSumRgbToHex(rgbList) {
		var r = 0;
		var g = 0;
		var b = 0;
		for (var s = 0; s < rgbList.length; s++) {
			var c = rgbList[s];
			r += c[0];
			g += c[1];
			b += c[2];
		}
		r = Math.min(255, r);
		g = Math.min(255, g);
		b = Math.min(255, b);
		function byteHex(n) {
			var h = n.toString(16);
			return h.length < 2 ? "0" + h : h;
		}
		return "#" + byteHex(r) + byteHex(g) + byteHex(b);
	}

	function presetContrastTextOnRgb(r, g, b) {
		var L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return L > 0.55 ? "#111" : "#fff";
	}

	function saveSliderThumbsToStorage(mEl, iEl, rEl) {
		if (!mEl || !iEl || !rEl) {
			return;
		}
		try {
			var payload = {
				minutes: Number(mEl.value),
				intervalMinutes: Number(iEl.value),
				rounds: Number(rEl.value),
			};
			localStorage.setItem(PRESET_SLIDER_THUMBS_KEY, JSON.stringify(payload));
		} catch (e) {
			// ignore quota / private mode
		}
	}

	/** Loads flipClock.json: presets, optional app background, optional sounds (see `applySoundsFromJsonRoot`). */
	function fetchPresetTimersDocument() {
		return $.getJSON(PRESET_JSON_FILE)
			.then(function (data) {
				var presets = [];
				if (data && Array.isArray(data.presets)) {
					presets = data.presets.map(normalizePreset);
				}
				var bg = null;
				if (data && typeof data.appBackgroundDataUrl === "string" && data.appBackgroundDataUrl.indexOf("data:image/") === 0) {
					bg = data.appBackgroundDataUrl;
				}
				return { presets: presets, appBackgroundDataUrl: bg, jsonRoot: data || null };
			})
			.fail(function () {
				return { presets: [], appBackgroundDataUrl: null, jsonRoot: null };
			});
	}

	function normalizeSoundDataUrlFromDoc(s) {
		if (typeof s !== "string" || s.indexOf("data:audio/") !== 0) {
			return null;
		}
		return s;
	}

	/** Reads optional sound mode, preloaded filenames, and `sounds` / `soundFileNames` from flipClock.json (first-run seed). */
	function applySoundsFromJsonRoot(root) {
		if (!root || typeof root !== "object") {
			return;
		}
		if (root.soundSource === "preloaded" || root.soundSource === "upload") {
			saveSoundSourceToStorage(root.soundSource);
		}
		if (root.soundPreloaded && typeof root.soundPreloaded === "object") {
			var merged = loadPreloadedSoundSelectionsFromStorage();
			for (var pi = 0; pi < PRESET_SOUND_KINDS.length; pi++) {
				var pk = PRESET_SOUND_KINDS[pi];
				var pfn = root.soundPreloaded[pk];
				if (typeof pfn === "string") {
					merged[pk] = pfn;
				}
			}
			savePreloadedSoundSelectionsToStorage(merged);
		}
		if (loadSoundSourceFromStorage() === "preloaded") {
			return;
		}
		var sounds = {};
		if (root.sounds && typeof root.sounds === "object") {
			for (var i = 0; i < PRESET_SOUND_KINDS.length; i++) {
				var k = PRESET_SOUND_KINDS[i];
				var u = normalizeSoundDataUrlFromDoc(root.sounds[k]);
				if (u) {
					sounds[k] = u;
				}
			}
		}
		if (Object.keys(sounds).length === 0) {
			return;
		}
		saveSoundsToStorage(sounds);
		var names = {};
		if (root.soundFileNames && typeof root.soundFileNames === "object") {
			for (var j = 0; j < PRESET_SOUND_KINDS.length; j++) {
				var kk = PRESET_SOUND_KINDS[j];
				if (!sounds[kk]) {
					continue;
				}
				var fn = root.soundFileNames[kk];
				if (typeof fn === "string" && fn.length > 0) {
					names[kk] = fn;
				}
			}
		}
		if (Object.keys(names).length > 0) {
			saveSoundNamesToStorage(names);
		}
	}

	var warnedPresetSave404 = false;

	/** Max width/height (px) for background image after resize (long edge). */
	var BG_OPTIMIZE_MAX_EDGE = 1920;
	var BG_JPEG_QUALITY = 0.82;
	var BG_WEBP_QUALITY = 0.78;

	function dataUrlToBlob(dataUrl) {
		var m = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
		if (!m) {
			return null;
		}
		try {
			var binStr = window.atob(m[2]);
			var len = binStr.length;
			var arr = new Uint8Array(len);
			for (var i = 0; i < len; i++) {
				arr[i] = binStr.charCodeAt(i);
			}
			return new Blob([arr], { type: m[1] });
		} catch (e) {
			return null;
		}
	}

	function loadImageElementFromFile(file, callback) {
		var url = URL.createObjectURL(file);
		var img = new window.Image();
		img.onload = function () {
			URL.revokeObjectURL(url);
			callback(img);
		};
		img.onerror = function () {
			URL.revokeObjectURL(url);
			callback(null);
		};
		img.src = url;
	}

	function encodeCanvasToBlob(canvas, callback) {
		var jpegQ = BG_JPEG_QUALITY;
		var webpQ = BG_WEBP_QUALITY;
		if (!canvas.toBlob) {
			var du = canvas.toDataURL("image/jpeg", jpegQ);
			callback(dataUrlToBlob(du));
			return;
		}
		canvas.toBlob(
			function (webpBlob) {
				if (webpBlob && webpBlob.size > 0) {
					callback(webpBlob);
					return;
				}
				canvas.toBlob(
					function (jpegBlob) {
						if (jpegBlob && jpegBlob.size > 0) {
							callback(jpegBlob);
							return;
						}
						var du2 = canvas.toDataURL("image/jpeg", jpegQ);
						callback(dataUrlToBlob(du2));
					},
					"image/jpeg",
					jpegQ,
				);
			},
			"image/webp",
			webpQ,
		);
	}

	/**
	 * Resize (max edge), re-encode WebP or JPEG for smaller files, then invoke callback(err, blob).
	 */
	function optimizeImageFileForBackground(file, callback) {
		if (!file || !file.type || file.type.indexOf("image/") !== 0) {
			callback(new Error("Not an image"));
			return;
		}
		var maxEdge = BG_OPTIMIZE_MAX_EDGE;
		function drawAndEncode(drawable, w, h) {
			var scale = Math.min(1, maxEdge / Math.max(w, h));
			var cw = Math.max(1, Math.round(w * scale));
			var ch = Math.max(1, Math.round(h * scale));
			var canvas = document.createElement("canvas");
			canvas.width = cw;
			canvas.height = ch;
			var ctx = canvas.getContext("2d");
			if (!ctx) {
				if (typeof drawable.close === "function") {
					drawable.close();
				}
				callback(new Error("Canvas unsupported"));
				return;
			}
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, cw, ch);
			try {
				ctx.drawImage(drawable, 0, 0, cw, ch);
			} catch (err) {
				if (typeof drawable.close === "function") {
					drawable.close();
				}
				callback(err);
				return;
			}
			if (typeof drawable.close === "function") {
				drawable.close();
			}
			encodeCanvasToBlob(canvas, function (blob) {
				if (!blob || blob.size === 0) {
					callback(new Error("Could not encode image"));
					return;
				}
				callback(null, blob);
			});
		}
		if (typeof createImageBitmap === "function") {
			createImageBitmap(file, { imageOrientation: "from-image" })
				.then(function (bitmap) {
					drawAndEncode(bitmap, bitmap.width, bitmap.height);
				})
				.catch(function () {
					createImageBitmap(file)
						.then(function (bitmap) {
							drawAndEncode(bitmap, bitmap.width, bitmap.height);
						})
						.catch(function () {
							loadImageElementFromFile(file, function (img) {
								if (!img) {
									callback(new Error("Could not load image"));
									return;
								}
								drawAndEncode(img, img.naturalWidth, img.naturalHeight);
							});
						});
				});
			return;
		}
		loadImageElementFromFile(file, function (img) {
			if (!img) {
				callback(new Error("Could not load image"));
				return;
			}
			drawAndEncode(img, img.naturalWidth, img.naturalHeight);
		});
	}

	function blobToDataUrlString(blob, callback) {
		var r = new FileReader();
		r.onload = function () {
			callback(typeof r.result === "string" ? r.result : "");
		};
		r.onerror = function () {
			callback("");
		};
		r.readAsDataURL(blob);
	}

	function loadAppBgStateFromStorage() {
		try {
			var raw = localStorage.getItem(FLIPCLOCK_APP_BG_KEY);
			if (raw === null || raw === "") {
				return null;
			}
			var o = JSON.parse(raw);
			if (!o || typeof o !== "object") {
				return null;
			}
			if (typeof o.dataUrl === "string" && o.dataUrl.indexOf("data:image/") === 0) {
				var out = { dataUrl: o.dataUrl };
				if (typeof o.fileName === "string" && o.fileName.trim() !== "") {
					out.fileName = o.fileName.trim();
				}
				return out;
			}
			return null;
		} catch (e) {
			return null;
		}
	}

	function getAppBackgroundDataUrlForSync() {
		var st = loadAppBgStateFromStorage();
		if (st && typeof st.dataUrl === "string" && st.dataUrl.indexOf("data:image/") === 0) {
			return st.dataUrl;
		}
		return null;
	}

	function cssUrlTokenForBg(pathOrDataUrl) {
		if (typeof pathOrDataUrl !== "string" || pathOrDataUrl === "") {
			return "none";
		}
		if (pathOrDataUrl.indexOf("data:") === 0) {
			return "url(" + JSON.stringify(pathOrDataUrl) + ")";
		}
		var resolved = pathOrDataUrl;
		try {
			resolved = new URL(pathOrDataUrl, window.location.href).href;
		} catch (e) {
			/* keep relative */
		}
		return "url(" + JSON.stringify(resolved) + ")";
	}

	function applyAppBackgroundState(state) {
		var body = document.body;
		if (!body) {
			return;
		}
		if (!state) {
			body.classList.remove("flipclock-custom-bg");
			body.style.removeProperty("--flipclock-bg-image");
			return;
		}
		var token = cssUrlTokenForBg(state.dataUrl);
		if (token === "none") {
			body.classList.remove("flipclock-custom-bg");
			body.style.removeProperty("--flipclock-bg-image");
			return;
		}
		body.classList.add("flipclock-custom-bg");
		body.style.setProperty("--flipclock-bg-image", token);
	}

	function persistAppBgState(state) {
		try {
			if (!state) {
				localStorage.removeItem(FLIPCLOCK_APP_BG_KEY);
				return;
			}
			localStorage.setItem(FLIPCLOCK_APP_BG_KEY, JSON.stringify(state));
		} catch (e) {
			window.alert("Could not save background (storage may be full). Try a smaller image.");
		}
	}

	/** Writes flipClock.json in the app root when served via `npm run dev` (BrowserSync middleware). Includes optional appBackgroundDataUrl; sounds as data URLs when source is Upload, else soundPreloaded paths. No-op if fetch fails (e.g. file:// or static host without the endpoint). */
	function syncPresetJsonToProjectFile(presets) {
		var doc = { version: 1, presets: presets };
		var bg = getAppBackgroundDataUrlForSync();
		if (bg) {
			doc.appBackgroundDataUrl = bg;
		}
		var soundSource = loadSoundSourceFromStorage();
		doc.soundSource = soundSource;
		if (soundSource === "preloaded") {
			var pre = loadPreloadedSoundSelectionsFromStorage();
			var preOut = {};
			for (var si = 0; si < PRESET_SOUND_KINDS.length; si++) {
				var sk = PRESET_SOUND_KINDS[si];
				if (typeof pre[sk] === "string" && pre[sk].length > 0) {
					preOut[sk] = pre[sk];
				}
			}
			if (Object.keys(preOut).length > 0) {
				doc.soundPreloaded = preOut;
			}
		} else {
			var sounds = loadSoundsFromStorage();
			if (sounds && typeof sounds === "object" && Object.keys(sounds).length > 0) {
				doc.sounds = sounds;
			}
			var soundNames = loadSoundNamesFromStorage();
			if (soundNames && typeof soundNames === "object" && Object.keys(soundNames).length > 0) {
				doc.soundFileNames = soundNames;
			}
		}
		var payload = JSON.stringify(doc, null, 2);
		if (typeof fetch !== "function") {
			return;
		}
		fetch("/__flipclock__/save-preset-timers", {
			method: "POST",
			headers: { "Content-Type": "application/json; charset=utf-8" },
			body: payload,
			credentials: "same-origin",
		})
			.then(function (res) {
				if (res && res.status === 404 && !warnedPresetSave404) {
					warnedPresetSave404 = true;
					console.warn("[FlipClock] flipClock.json sync failed (404). Page origin: " + (typeof location !== "undefined" ? location.origin : "?") + ". Use the exact Local: URL from npm run dev (BrowserSync + bs-config.js). If port 3000 is busy, BrowserSync uses 3001, 3002, … — a bookmark to :3000 may hit a different app without POST /__flipclock__/save-preset-timers.");
				}
			})
			.catch(function () {});
	}

	function presetActionIcon(kind) {
		if (kind === "apply") {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
		}
		if (kind === "edit") {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
		}
		if (kind === "delete") {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
		}
		return "";
	}

	/**
	 * @param {FlipClock} clock
	 * @returns {function(): void}
	 */
	var TOOLBAR_ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="8 5 8 19 19 12 8 5"/></svg>';
	var TOOLBAR_ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';

	/** Ms of no pointer/touch/keyboard activity before chrome dims again while the countdown runs. */
	var FLIPCLOCK_CHROME_IDLE_MS = 3000;

	/**
	 * While the countdown is running, dims `.flipclock-toolbar` and `.active-preset` until the user
	 * interacts (pointer, touch, or keyboard); after **{@link FLIPCLOCK_CHROME_IDLE_MS}** with no
	 * interaction, chrome fades dim again until the next interaction or `flipclock:countdown-complete`.
	 * @param {FlipClock} clock
	 * @returns {function(): void}
	 */
	function initFlipClockChromeDimming(clock) {
		var userRevealedChrome = false;
		var chromeIdleTimer = null;
		var $toolbar = $(".flipclock-toolbar");
		var $activePreset = $("#active-preset");

		function clockIsActiveForChromeDim() {
			return clock.tickInterval !== false || clock.prepCountdownActive === true;
		}

		function clearChromeIdleTimer() {
			if (chromeIdleTimer !== null) {
				window.clearTimeout(chromeIdleTimer);
				chromeIdleTimer = null;
			}
		}

		function scheduleChromeDimAfterIdle() {
			clearChromeIdleTimer();
			chromeIdleTimer = window.setTimeout(function () {
				chromeIdleTimer = null;
				if (!clockIsActiveForChromeDim()) {
					return;
				}
				userRevealedChrome = false;
				applyChromeDim();
			}, FLIPCLOCK_CHROME_IDLE_MS);
		}

		function applyChromeDim() {
			var running = clockIsActiveForChromeDim();
			if (!running) {
				clearChromeIdleTimer();
				userRevealedChrome = false;
			}
			var dim = running && !userRevealedChrome;
			$toolbar.toggleClass("flipclock-chrome-dimmed", dim);
			$activePreset.toggleClass("flipclock-chrome-dimmed", dim);
		}

		function onInteractionRevealChrome() {
			if (!clockIsActiveForChromeDim()) {
				return;
			}
			userRevealedChrome = true;
			applyChromeDim();
			scheduleChromeDimAfterIdle();
		}

		$(document).on("mousemove.flipclockChromeDim keydown.flipclockChromeDim", onInteractionRevealChrome);
		document.addEventListener(
			"touchstart",
			function flipclockTouchRevealChrome() {
				onInteractionRevealChrome();
			},
			{ passive: true, capture: true },
		);
		document.addEventListener(
			"touchmove",
			function flipclockTouchMoveRevealChrome() {
				onInteractionRevealChrome();
			},
			{ passive: true, capture: true },
		);

		$(".countdown").on("flipclock:countdown-complete.flipclockChromeDim", function () {
			userRevealedChrome = false;
			clearChromeIdleTimer();
			applyChromeDim();
		});

		return applyChromeDim;
	}

	/**
	 * @param {FlipClock} clock
	 * @param {function(): void} [onAfterToolbarRefresh] — e.g. sync toolbar/active-preset dimming
	 */
	/** Ms after which a paused/stopped timer shows local wall time (HH:MM) and hides the toolbar. */
	var FLIPCLOCK_IDLE_WALL_CLOCK_MS = 10000;

	function initFlipClockToolbar(clock, onAfterToolbarRefresh) {
		var $playPause = $("#clock-play-pause-btn");
		var $reset = $("#clock-reset-btn");
		var $toolbar = $(".flipclock-toolbar");
		var $activePresetIdle = $("#active-preset");
		var prepTimeoutId = null;
		/** Clears prep flip `animationend` listener + fallback timer (see `beginPrepCountdown`). */
		var prepFlipCleanup = null;
		/** Snapshot of `MM:SS` to restore after prep (or if prep is cancelled). */
		var prepResumeTimeStr = null;

		var becameInactiveAt = null;
		var idleWallClockActive = false;
		var idleWallClockTickId = null;
		/** Last pointer time while wall-clock idle (toolbar + active-preset revealed); after {@link FLIPCLOCK_IDLE_WALL_CLOCK_MS} with no activity, both fade off again. */
		var lastIdleToolbarPointerAt = null;
		/** Snapshot of round time when entering idle wall-clock mode (restored on Play / Presets unless cleared). */
		var pausedTimeBeforeIdleWallClock = null;

		function getLocalTimeHhMmString() {
			var d = new Date();
			var h = d.getHours();
			var m = d.getMinutes();
			return (h < 10 ? "0" + h : String(h)) + ":" + (m < 10 ? "0" + m : String(m));
		}

		function exitIdleWallClockMode(restorePausedFace) {
			if (!idleWallClockActive) {
				return;
			}
			if (idleWallClockTickId !== null) {
				window.clearInterval(idleWallClockTickId);
				idleWallClockTickId = null;
			}
			$toolbar.removeClass("flipclock-idle-clock");
			$activePresetIdle.removeClass("flipclock-idle-clock");
			lastIdleToolbarPointerAt = null;
			var snap = pausedTimeBeforeIdleWallClock;
			pausedTimeBeforeIdleWallClock = null;
			idleWallClockActive = false;
			if (restorePausedFace !== false && snap !== null) {
				clock.setToTime(snap);
			}
		}

		function enterIdleWallClockMode() {
			if (clock.tickInterval !== false || clock.prepCountdownActive) {
				return;
			}
			if (idleWallClockActive) {
				return;
			}
			pausedTimeBeforeIdleWallClock = comparableIntToMmSsString(clock.getCurrentTime());
			idleWallClockActive = true;
			lastIdleToolbarPointerAt = null;
			clock.setToTime(getLocalTimeHhMmString());
			$toolbar.addClass("flipclock-idle-clock");
			$activePresetIdle.addClass("flipclock-idle-clock");
			idleWallClockTickId = window.setInterval(function () {
				if (clock.tickInterval !== false || clock.prepCountdownActive) {
					exitIdleWallClockMode(false);
					return;
				}
				if (!idleWallClockActive) {
					return;
				}
				clock.setToTime(getLocalTimeHhMmString());
			}, 60000);
		}

		function pollIdleWallClock() {
			if (clock.tickInterval !== false || clock.prepCountdownActive) {
				becameInactiveAt = null;
				exitIdleWallClockMode(false);
				return;
			}
			if (idleWallClockActive) {
				if (
					!$toolbar.hasClass("flipclock-idle-clock") &&
					lastIdleToolbarPointerAt !== null &&
					Date.now() - lastIdleToolbarPointerAt >= FLIPCLOCK_IDLE_WALL_CLOCK_MS
				) {
					$toolbar.addClass("flipclock-idle-clock");
					$activePresetIdle.addClass("flipclock-idle-clock");
				}
				return;
			}
			if (becameInactiveAt === null) {
				return;
			}
			if (Date.now() - becameInactiveAt < FLIPCLOCK_IDLE_WALL_CLOCK_MS) {
				return;
			}
			enterIdleWallClockMode();
		}

		clock.exitIdleWallClockMode = exitIdleWallClockMode;

		/**
		 * While wall-clock idle, pointer motion restores full opacity on `.flipclock-toolbar` and `.active-preset`
		 * and records activity so both can fade off again after {@link FLIPCLOCK_IDLE_WALL_CLOCK_MS} with no further pointer input.
		 */
		function onIdleWallClockPointerActivity() {
			if (!idleWallClockActive) {
				return;
			}
			lastIdleToolbarPointerAt = Date.now();
			$toolbar.removeClass("flipclock-idle-clock");
			$activePresetIdle.removeClass("flipclock-idle-clock");
		}

		$(document).on("mousemove.flipclockIdleToolbarReveal", onIdleWallClockPointerActivity);
		document.addEventListener(
			"touchstart",
			function flipclockIdleToolbarTouchReveal() {
				onIdleWallClockPointerActivity();
			},
			{ passive: true, capture: true },
		);
		document.addEventListener(
			"touchmove",
			function flipclockIdleToolbarTouchMoveReveal() {
				onIdleWallClockPointerActivity();
			},
			{ passive: true, capture: true },
		);

		function clearPrepSchedule() {
			if (typeof prepFlipCleanup === "function") {
				prepFlipCleanup();
				prepFlipCleanup = null;
			}
			if (prepTimeoutId !== null) {
				window.clearTimeout(prepTimeoutId);
				prepTimeoutId = null;
			}
		}

		function cancelPrepCountdown() {
			if (!clock.prepCountdownActive) {
				return;
			}
			clearPrepSchedule();
			clock.prepCountdownActive = false;
			if (prepResumeTimeStr) {
				clock.setToTime(prepResumeTimeStr);
				prepResumeTimeStr = null;
			}
		}

		/** Exposed so preset apply / reset paths can clear prep without duplicating logic. */
		clock.cancelPrepCountdown = cancelPrepCountdown;

		function finishPrepAndStartTimer() {
			clearPrepSchedule();
			clock.prepCountdownActive = false;
			var resume = prepResumeTimeStr;
			prepResumeTimeStr = null;
			if (resume) {
				clock.setToTime(resume);
			}
			clock.start(true);
			playFlipClockSound("start");
			refresh();
		}

		function beginPrepCountdown() {
			cancelPrepCountdown();
			prepResumeTimeStr = comparableIntToMmSsString(clock.getCurrentTime());
			clock.prepCountdownActive = true;
			var step = 0;
			function runStep() {
				if (!clock.prepCountdownActive) {
					return;
				}
				if (step >= 5) {
					finishPrepAndStartTimer();
					return;
				}
				var n = 5 - step;
				clock.setToTime(prepStepToMmSs(n));
				step++;
				/**
				 * Wait until the CSS flip **finishes** before beep + next `setToTime`. A fixed delay or rAF could
				 * still call `removeClass("play")` mid-animation and leave mismatched top/bottom halves (see flip
				 * `flip-turn-down` / `flip-turn-up`). Debounce coalesces multiple digit columns.
				 */
				var root = clock.options.containerElement[0];
				var settled = false;
				var debounceTimer = null;
				function prepChainDone() {
					if (settled || !clock.prepCountdownActive) {
						return;
					}
					settled = true;
					if (root) {
						root.removeEventListener("animationend", onPrepFlipAnimEnd, true);
					}
					if (debounceTimer !== null) {
						window.clearTimeout(debounceTimer);
						debounceTimer = null;
					}
					if (prepTimeoutId !== null) {
						window.clearTimeout(prepTimeoutId);
						prepTimeoutId = null;
					}
					prepFlipCleanup = null;
					playPrepCountdownBeep();
					runStep();
				}
				function schedulePrepChainDoneAfterPaint() {
					var raf =
						typeof window.requestAnimationFrame === "function"
							? window.requestAnimationFrame.bind(window)
							: function (cb) {
									window.setTimeout(cb, 0);
								};
					raf(function () {
						raf(function () {
							prepChainDone();
						});
					});
				}
				function onPrepFlipAnimEnd(ev) {
					var name = ev && ev.animationName ? String(ev.animationName) : "";
					if (name.indexOf("flip-turn-down") === -1) {
						return;
					}
					if (debounceTimer !== null) {
						window.clearTimeout(debounceTimer);
					}
					debounceTimer = window.setTimeout(function () {
						debounceTimer = null;
						schedulePrepChainDoneAfterPaint();
					}, 0);
				}
				prepFlipCleanup = function prepFlipCleanupFn() {
					if (settled) {
						return;
					}
					settled = true;
					if (root) {
						root.removeEventListener("animationend", onPrepFlipAnimEnd, true);
					}
					if (debounceTimer !== null) {
						window.clearTimeout(debounceTimer);
						debounceTimer = null;
					}
					if (prepTimeoutId !== null) {
						window.clearTimeout(prepTimeoutId);
						prepTimeoutId = null;
					}
					prepFlipCleanup = null;
				};
				if (root) {
					root.addEventListener("animationend", onPrepFlipAnimEnd, true);
				}
				prepTimeoutId = window.setTimeout(function () {
					if (settled || !clock.prepCountdownActive) {
						return;
					}
					schedulePrepChainDoneAfterPaint();
				}, FLIPCLOCK_PREP_FLIP_MS + FLIPCLOCK_PREP_FLIP_FALLBACK_PAD_MS);
			}
			runStep();
		}

		function refresh() {
			var running = clock.tickInterval !== false || clock.prepCountdownActive === true;
			if (running) {
				becameInactiveAt = null;
				exitIdleWallClockMode(false);
				$playPause.html(TOOLBAR_ICON_PAUSE).attr("aria-label", "Pause").addClass("is-playing");
			} else {
				becameInactiveAt = Date.now();
				$playPause.html(TOOLBAR_ICON_PLAY).attr("aria-label", "Play").removeClass("is-playing");
			}
			if (typeof onAfterToolbarRefresh === "function") {
				onAfterToolbarRefresh();
			}
		}

		clock.stop();
		refresh();

		window.setInterval(pollIdleWallClock, 1000);

		$playPause.on("click", function () {
			flipClockUnlockHtmlAudioIfNeeded();
			exitIdleWallClockMode(true);
			if (clock.tickInterval !== false) {
				clock.stop();
				playFlipClockSound("pause");
			} else if (clock.prepCountdownActive) {
				cancelPrepCountdown();
				playFlipClockSound("pause");
			} else {
				beginPrepCountdown();
			}
			refresh();
		});

		$reset.on("click", function () {
			cancelPrepCountdown();
			exitIdleWallClockMode(false);
			clock.stop();
			clock.setToTime(clock.options.startTime);
			refresh();
		});

		return refresh;
	}

	/**
	 * @param {FlipClock} clock
	 * @param {function(): void} refreshToolbar
	 */
	function initPresetTimers(clock, refreshToolbar) {
		var presets = [];
		var editingId = null;
		var activePresetId = loadActivePresetIdFromStorage();

		var $activePreset = $("#active-preset");
		var $activeName = $("#active-preset-name");
		var $activeDur = $("#active-preset-duration");
		var $activeInt = $("#active-preset-interval");
		var $activeRounds = $("#active-preset-rounds");

		function setActivePresetUi(p) {
			var $cd = $(".countdown");
			if (!p) {
				activePresetId = null;
				saveActivePresetIdToStorage(null);
				applyCounterContrastFromPresetColor($cd, null);
				$activePreset.attr("hidden", "hidden").attr("aria-hidden", "true");
				return;
			}
			activePresetId = p.id;
			saveActivePresetIdToStorage(p.id);
			applyCounterContrastFromPresetColor($cd, p.color);
			$activePreset.removeAttr("hidden").attr("aria-hidden", "false");
			$activeName.text(p.name);
			$activeDur.text(formatPresetMinuteLabel(p.minutes));
			$activeInt.text(formatPresetMinuteLabel(p.intervalMinutes));
			$activeRounds.text(String(p.rounds));
		}

		function syncActivePresetFromList() {
			if (!activePresetId) {
				return;
			}
			for (var i = 0; i < presets.length; i++) {
				if (presets[i].id === activePresetId) {
					setActivePresetUi(presets[i]);
					return;
				}
			}
			activePresetId = null;
			setActivePresetUi(null);
		}

		var $modal = $("#preset-modal");
		var $panel = $modal.find(".preset-modal__panel");
		var $presetModalHeader = $modal.find(".preset-modal__header");
		var $list = $("#preset-list-body");
		var $form = $("#preset-form");
		var $name = $("#preset-name");
		var $color = $("#preset-color");
		var $swatches = $("#preset-color-swatches");
		var $colorPopover = $("#preset-color-popover");
		var $colorTrigger = $("#preset-color-trigger");
		var $colorSwatchPreview = $colorTrigger.find(".preset-color-trigger__swatch");
		var $colorNative = $("#preset-color-native");
		var $colorHex = $("#preset-color-hex");

		function setPresetColorUi(hex) {
			var c = normalizeHexColor(hex);
			$color.val(c);
			$colorSwatchPreview.css("background-color", c);
			$colorNative.val(c);
			$colorHex.val(c);
			$swatches.find(".preset-color-swatch").each(function () {
				var $b = $(this);
				var hc = String($b.attr("data-color")).toLowerCase();
				var on = hc === c.toLowerCase();
				$b.toggleClass("is-selected", on).attr("aria-pressed", on ? "true" : "false");
			});
		}

		function openColorPopover() {
			$colorPopover.removeAttr("hidden");
			$colorTrigger.attr("aria-expanded", "true");
		}

		function closeColorPopover() {
			$colorPopover.attr("hidden", "hidden");
			$colorTrigger.attr("aria-expanded", "false");
		}

		function buildPresetColorSwatches() {
			$swatches.empty();
			for (var i = 0; i < PRESET_COLOR_SWATCHES.length; i++) {
				var s = PRESET_COLOR_SWATCHES[i];
				var $b = $("<button>", {
					type: "button",
					class: "preset-color-swatch",
					"data-color": s.hex,
					"aria-label": s.label,
					"aria-pressed": s.hex === PRESET_COLOR_SWATCHES[0].hex ? "true" : "false",
					css: { backgroundColor: s.hex },
				});
				if (s.hex === PRESET_COLOR_SWATCHES[0].hex) {
					$b.addClass("is-selected");
				}
				$swatches.append($b);
			}
			$swatches.on("click", ".preset-color-swatch", function (e) {
				e.preventDefault();
				setPresetColorUi($(this).attr("data-color"));
				closeColorPopover();
			});
		}

		buildPresetColorSwatches();
		setPresetColorUi("#ffffff");

		$colorNative.on("input change", function () {
			setPresetColorUi($(this).val());
		});

		$colorHex.on("blur", function () {
			var v = String($(this).val() || "").trim();
			if (v.length > 0 && v.charAt(0) !== "#") {
				v = "#" + v;
			}
			setPresetColorUi(v);
		});

		$colorHex.on("keydown", function (e) {
			if (e.key === "Enter") {
				e.preventDefault();
				$(this).blur();
			}
		});

		$colorTrigger.on("click", function (e) {
			e.stopPropagation();
			if ($colorPopover.is("[hidden]")) {
				openColorPopover();
			} else {
				closeColorPopover();
			}
		});

		$(document).on("mousedown.presetColorPop", function (e) {
			if ($colorPopover.is("[hidden]")) {
				return;
			}
			var $t = $(e.target);
			if ($t.closest("#preset-color-popover").length || $t.closest("#preset-color-trigger").length) {
				return;
			}
			closeColorPopover();
		});

		var $minutes = $("#preset-minutes");
		var $interval = $("#preset-interval");
		var $rounds = $("#preset-rounds");
		var $minutesSlider = $("#preset-minutes-slider");
		var $legendMinutes = $("#preset-legend-minutes");
		var $legendInterval = $("#preset-legend-interval");
		var $legendRounds = $("#preset-legend-rounds");
		var $sliderClusterOut = $("#preset-slider-cluster");
		var $sliderOutputs = $minutesSlider.find("> output.preset-minutes-slider__output:not(.preset-minutes-slider__output--cluster)");

		/** Rounds: range input is 0–10 so the thumb matches tick positions; value snapped to whole 1–10 for storage. */
		function snapRoundsToWhole(rEl) {
			var n = Math.round(Number(rEl.value));
			if (Number.isNaN(n)) {
				n = 1;
			}
			n = Math.min(10, Math.max(1, n));
			var s = String(n);
			if (rEl.value !== s) {
				rEl.value = s;
			}
			return s;
		}

		function syncPresetMultiSlider() {
			var mEl = $minutes[0];
			var iEl = $interval[0];
			var rEl = $rounds[0];
			var wrap = $minutesSlider[0];
			if (!mEl || !iEl || !rEl || !wrap) {
				return;
			}
			var minV = 0;
			var maxM = getPresetTrackMax();
			var minuteStep = getPresetMinuteSliderStep(maxM);
			var stepStr = String(minuteStep);
			$minutes.attr("step", stepStr);
			$interval.attr("step", stepStr);
			mEl.setAttribute("step", stepStr);
			iEl.setAttribute("step", stepStr);
			var mSnap = snapPresetMinutesToStep(mEl.value, maxM);
			var iSnap = snapPresetMinutesToStep(iEl.value, maxM);
			if (String(mSnap) !== String(mEl.value)) {
				mEl.value = String(mSnap);
			}
			if (String(iSnap) !== String(iEl.value)) {
				iEl.value = String(iSnap);
			}
			var r = snapRoundsToWhole(rEl);
			var m = mEl.value;
			var i = iEl.value;
			wrap.style.setProperty("--value-a", m);
			wrap.style.setProperty("--value-b", i);
			wrap.style.setProperty("--value-c", r);
			wrap.style.setProperty("--text-value-a", JSON.stringify(m));
			wrap.style.setProperty("--text-value-b", JSON.stringify(i));
			wrap.style.setProperty("--text-value-c", JSON.stringify(r));

			var maxRoundsTrack = 10;
			wrap.style.setProperty("--min", String(minV));
			wrap.style.setProperty("--max", String(maxM));
			wrap.style.setProperty("--step", stepStr);
			wrap.style.setProperty("--rounds-min", "0");
			wrap.style.setProperty("--rounds-max", String(maxRoundsTrack));
			var pos = [presetSliderCompleted01(mEl, minV, maxM), presetSliderCompleted01(iEl, minV, maxM), presetSliderCompleted01(rEl, minV, maxRoundsTrack)];
			var parent = [0, 1, 2];
			function ufFind(x) {
				if (parent[x] !== x) {
					parent[x] = ufFind(parent[x]);
				}
				return parent[x];
			}
			function ufUnion(a, b) {
				var pa = ufFind(a);
				var pb = ufFind(b);
				if (pa !== pb) {
					parent[pa] = pb;
				}
			}
			var ti;
			var tj;
			for (ti = 0; ti < 3; ti++) {
				for (tj = ti + 1; tj < 3; tj++) {
					if (Math.abs(pos[ti] - pos[tj]) < PRESET_SLIDER_OVERLAP_THRESH_PCT) {
						ufUnion(ti, tj);
					}
				}
			}
			var groups = {};
			for (ti = 0; ti < 3; ti++) {
				var root = ufFind(ti);
				if (!groups[root]) {
					groups[root] = [];
				}
				groups[root].push(ti);
			}
			var mergedGroup = null;
			for (var gk in groups) {
				if (groups.hasOwnProperty(gk) && groups[gk].length >= 2) {
					mergedGroup = groups[gk].slice();
					break;
				}
			}
			var clips = ["none", "none", "none"];
			if (mergedGroup) {
				mergedGroup.sort(function (a, b) {
					if (pos[a] !== pos[b]) {
						return pos[a] - pos[b];
					}
					return a - b;
				});
				if (mergedGroup.length === 2) {
					clips[mergedGroup[0]] = "inset(0 50% 0 0)";
					clips[mergedGroup[1]] = "inset(0 0 0 50%)";
				} else if (mergedGroup.length === 3) {
					clips[mergedGroup[0]] = "inset(0 66.666% 0 0)";
					clips[mergedGroup[1]] = "inset(0 33.333% 0 33.333%)";
					clips[mergedGroup[2]] = "inset(0 0 0 66.666%)";
				}
			}
			wrap.style.setProperty("--thumb-clip-1", clips[0]);
			wrap.style.setProperty("--thumb-clip-2", clips[1]);
			wrap.style.setProperty("--thumb-clip-3", clips[2]);

			var els = [mEl, iEl, rEl];
			var clusterAria = [];
			var clusterVisibleLabel = "";
			if (mergedGroup && mergedGroup.length >= 2) {
				var sumR = 0;
				var sumG = 0;
				var sumB = 0;
				for (ti = 0; ti < mergedGroup.length; ti++) {
					var gi = mergedGroup[ti];
					var c = PRESET_THUMB_RGB[gi];
					sumR += c[0];
					sumG += c[1];
					sumB += c[2];
					var partLabel = gi === 2 ? r : formatPresetMinuteSliderLabel(els[gi].value, maxM);
					clusterAria.push(["Duration", "Interval", "Rounds"][gi] + " " + partLabel);
				}
				sumR = Math.min(255, sumR);
				sumG = Math.min(255, sumG);
				sumB = Math.min(255, sumB);
				var clusterBg = presetSumRgbToHex(
					mergedGroup.map(function (ix) {
						return PRESET_THUMB_RGB[ix];
					}),
				);
				var clusterFg = presetContrastTextOnRgb(sumR, sumG, sumB);
				// One visible number: leftmost thumb on the track (mergedGroup is sorted by position).
				var leftGi = mergedGroup[0];
				clusterVisibleLabel = leftGi === 2 ? r : formatPresetMinuteSliderLabel(els[leftGi].value, maxM);
				// Horizontal position 0–1: same scale as `pos[]` / native thumbs (minutes vs 0–10 rounds).
				wrap.style.setProperty("--cluster-pos-01", String(pos[leftGi] / 100));
				wrap.style.setProperty("--cluster-label-bg", clusterBg);
				wrap.style.setProperty("--cluster-label-fg", clusterFg);
			} else {
				wrap.style.removeProperty("--cluster-pos-01");
				wrap.style.removeProperty("--cluster-label-bg");
				wrap.style.removeProperty("--cluster-label-fg");
			}

			if ($sliderOutputs.length) {
				$sliderOutputs.removeClass("preset-minutes-slider__output--suppressed");
				if (mergedGroup && mergedGroup.length >= 2) {
					for (ti = 0; ti < mergedGroup.length; ti++) {
						$sliderOutputs.eq(mergedGroup[ti]).addClass("preset-minutes-slider__output--suppressed");
					}
				}
			}
			if ($sliderClusterOut.length) {
				if (mergedGroup && mergedGroup.length >= 2 && clusterAria.length) {
					$sliderClusterOut.removeAttr("hidden");
					$sliderClusterOut.attr("aria-hidden", "false");
					$sliderClusterOut.attr("aria-label", clusterAria.join(", "));
					$sliderClusterOut.text(clusterVisibleLabel);
				} else {
					$sliderClusterOut.attr("hidden", "hidden");
					$sliderClusterOut.attr("aria-hidden", "true");
					$sliderClusterOut.removeAttr("aria-label");
					$sliderClusterOut.text("");
				}
			}

			mEl.setAttribute("aria-valuenow", m);
			mEl.setAttribute("aria-valuemax", String(maxM));
			mEl.setAttribute("aria-valuetext", m + " min");
			iEl.setAttribute("aria-valuenow", i);
			iEl.setAttribute("aria-valuemax", String(maxM));
			iEl.setAttribute("aria-valuetext", i + " min");
			rEl.setAttribute("aria-valuenow", r);
			rEl.setAttribute("aria-valuemin", "1");
			rEl.setAttribute("aria-valuemax", "10");
			rEl.setAttribute("aria-valuetext", r + " rounds");
			if ($legendMinutes.length) {
				$legendMinutes.text(formatPresetMinuteSliderLabel(m, maxM));
			}
			if ($legendInterval.length) {
				$legendInterval.text(formatPresetMinuteSliderLabel(i, maxM));
			}
			if ($legendRounds.length) {
				$legendRounds.text(r);
			}
			// Recalculate tick stripe / min-max labels when --max etc. change (avoids stale gradient in some browsers).
			void wrap.offsetHeight;
			saveSliderThumbsToStorage(mEl, iEl, rEl);
		}

		function applyTrackMaxToSliders() {
			var n = presetTrackMaxMinutes;
			var stepStr = String(getPresetMinuteSliderStep(n));
			$minutes.attr({ max: n, step: stepStr, "aria-valuemax": n });
			$interval.attr({ max: n, step: stepStr, "aria-valuemax": n });
			var mv = snapPresetMinutesToStep(Number($minutes.val()) || 0, n);
			var iv = snapPresetMinutesToStep(Number($interval.val()) || 0, n);
			$minutes.val(String(mv));
			$interval.val(String(iv));
			syncPresetMultiSlider();
		}

		$minutes.add($interval).add($rounds).on("input change", syncPresetMultiSlider);

		// Rounds: DOM min=0 keeps the thumb on the same 0–10 tick scale; stored minimum is 1 (tick 1). Block keys that would land on 0.
		$rounds.on("keydown", function (e) {
			var el = this;
			if (e.key === "Home") {
				e.preventDefault();
				el.value = "1";
				syncPresetMultiSlider();
				return;
			}
			var v = Number(el.value);
			if (v <= 1 && (e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "PageDown")) {
				e.preventDefault();
			}
		});
		var savedThumbs = loadSliderThumbsFromStorage();
		var normalizedThumbs = normalizeSliderThumbState(savedThumbs);
		if (normalizedThumbs) {
			$minutes.val(String(normalizedThumbs.minutes));
			$interval.val(String(normalizedThumbs.intervalMinutes));
			$rounds.val(String(normalizedThumbs.rounds));
		}
		applyTrackMaxToSliders();
		var $editId = $("#preset-edit-id");
		var $saveBtn = $("#preset-save-btn");
		var $resetEdit = $("#preset-form-reset");
		var $openBtn = $("#preset-open-btn");
		var $settingsFrame = $("#preset-settings-frame");
		/** Single source of truth for Timer settings visibility (do not rely on `[hidden]` alone — browsers / jQuery can disagree). Set only in open/closePresetSettings. */
		var PRESET_SETTINGS_EXPANDED_ATTR = "data-settings-expanded";

		function isPresetTimerSettingsExpanded() {
			if ($settingsFrame.attr(PRESET_SETTINGS_EXPANDED_ATTR) === "true") {
				return true;
			}
			var el = $settingsFrame[0];
			return !!(el && !el.hasAttribute("hidden"));
		}

		var $settingsOpenBtn = $("#preset-settings-open-btn");
		var $counterSize = $("#flipclock-counter-size");
		var $counterSizeOut = $("#flipclock-counter-size-out");
		var $trackMax = $("#flipclock-preset-track-max");
		var $trackMaxOut = $("#flipclock-preset-track-max-out");

		function closePresetSettings() {
			$settingsFrame.removeAttr(PRESET_SETTINGS_EXPANDED_ATTR);
			$settingsFrame.attr("hidden", "hidden").attr("aria-hidden", "true");
			$settingsOpenBtn.attr("aria-expanded", "false");
		}

		/** @param {{ focus?: boolean }} [opts] Pass `{ focus: false }` to show the frame without moving focus (e.g. after Add/Save preset). */
		function openPresetSettings(opts) {
			opts = opts || {};
			var shouldFocusTrack = opts.focus !== false;
			closeColorPopover();
			$settingsFrame.attr(PRESET_SETTINGS_EXPANDED_ATTR, "true");
			$settingsFrame.removeAttr("hidden").attr("aria-hidden", "false");
			$settingsOpenBtn.attr("aria-expanded", "true");
			var tmOpen = snapTrackMaxMinutes(presetTrackMaxMinutes);
			$trackMax.val(String(tmOpen)).attr("aria-valuenow", String(tmOpen));
			$trackMaxOut.text(tmOpen + " min");
			setCounterRangeFillPct($trackMax[0], tmOpen);
			// Rail width is 0 while the frame is hidden; rebuild ticks after layout when visible.
			requestAnimationFrame(function () {
				requestAnimationFrame(function () {
					rebuildTrackMaxTicks();
					setCounterRangeFillPct($trackMax[0], Number($trackMax.val()) || tmOpen);
				});
			});
			var pctOpen = loadCounterSizePct();
			$counterSize.val(String(pctOpen)).attr("aria-valuenow", String(pctOpen));
			$counterSizeOut.text(pctOpen + "%");
			if (shouldFocusTrack) {
				setTimeout(function () {
					$trackMax.trigger("focus");
				}, 0);
			}
			setCounterRangeFillPct($counterSize[0], $counterSize.val());
			refreshTimerSoundSettingsUi();
		}

		function togglePresetSettings() {
			if (isPresetTimerSettingsExpanded()) {
				closePresetSettings();
			} else {
				openPresetSettings();
			}
		}

		function finalizePresetTrackMaxChange() {
			for (var pi = 0; pi < presets.length; pi++) {
				presets[pi] = normalizePreset(presets[pi]);
			}
			savePresetsToStorage(presets);
			syncPresetJsonToProjectFile(presets);
			renderList();
			syncActivePresetFromList();
		}

		$settingsOpenBtn.on("click", function (e) {
			e.stopPropagation();
			togglePresetSettings();
		});
		$trackMax.on("input", function () {
			var raw = Number($(this).val());
			var v = snapTrackMaxMinutes(raw);
			if (v !== raw) {
				$(this).val(String(v));
			}
			$(this).attr("aria-valuenow", String(v));
			if (v === presetTrackMaxMinutes) {
				$trackMaxOut.text(v + " min");
				setCounterRangeFillPct(this, v);
				return;
			}
			presetTrackMaxMinutes = v;
			try {
				localStorage.setItem(PRESET_TRACK_MAX_KEY, String(v));
			} catch (e) {
				/* ignore */
			}
			applyTrackMaxToSliders();
			$trackMaxOut.text(v + " min");
			setCounterRangeFillPct(this, v);
		});
		$trackMax.on("change", function () {
			var v = snapTrackMaxMinutes(Number($(this).val()));
			$(this).val(String(v));
			$(this).attr("aria-valuenow", String(v));
			presetTrackMaxMinutes = v;
			try {
				localStorage.setItem(PRESET_TRACK_MAX_KEY, String(v));
			} catch (e) {
				/* ignore */
			}
			applyTrackMaxToSliders();
			$trackMaxOut.text(v + " min");
			setCounterRangeFillPct(this, v);
			finalizePresetTrackMaxChange();
		});
		$(".preset-settings-file").on("change", function () {
			var input = this;
			var kind = $(input).attr("data-sound-kind");
			var file = input.files && input.files[0];
			if (kind) {
				if (!file) {
					syncPresetFileDropFromInput(input);
					return;
				}
				var reader = new FileReader();
				reader.onload = function () {
					var sounds = loadSoundsFromStorage();
					sounds[kind] = reader.result;
					saveSoundsToStorage(sounds);
					var names = loadSoundNamesFromStorage();
					names[kind] = file.name;
					saveSoundNamesToStorage(names);
					input.value = "";
					syncPresetFileDropFromInput(input);
					syncPresetJsonToProjectFile(presets);
				};
				reader.readAsDataURL(file);
				return;
			}
			if ($(input).hasClass("preset-settings-file--bg")) {
				if (!file || !file.type || file.type.indexOf("image/") !== 0) {
					input.value = "";
					syncPresetFileDropFromInput(input);
					return;
				}
				optimizeImageFileForBackground(file, function (err, blob) {
					if (err || !blob) {
						window.alert(err && err.message ? err.message : "Could not process the image.");
						input.value = "";
						syncPresetFileDropFromInput(input);
						return;
					}
					blobToDataUrlString(blob, function (dataUrl) {
						if (typeof dataUrl !== "string" || !dataUrl) {
							window.alert("Could not save background.");
							input.value = "";
							syncPresetFileDropFromInput(input);
							return;
						}
						persistAppBgState({ dataUrl: dataUrl, fileName: file.name });
						applyAppBackgroundState({ dataUrl: dataUrl });
						syncPresetJsonToProjectFile(presets);
						input.value = "";
						syncPresetFileDropFromInput(input);
					});
				});
			}
		});
		$settingsFrame.on("click", ".preset-file-drop__btn", function (e) {
			e.preventDefault();
			var $drop = $(this).closest(".preset-file-drop");
			var input = $drop.find(".preset-file-drop__input")[0];
			if (!input) {
				return;
			}
			var kind = $(input).attr("data-sound-kind");
			var isBg = $(input).hasClass("preset-settings-file--bg");
			var hasFile = false;
			if (kind) {
				var soundsChk = loadSoundsFromStorage();
				var urlChk = soundsChk[kind];
				hasFile = typeof urlChk === "string" && urlChk.length > 0;
			} else if (isBg) {
				var stChk = loadAppBgStateFromStorage();
				hasFile = !!(stChk && stChk.dataUrl);
			}
			if (hasFile) {
				if (kind) {
					var soundsDel = loadSoundsFromStorage();
					delete soundsDel[kind];
					saveSoundsToStorage(soundsDel);
					var namesDel = loadSoundNamesFromStorage();
					delete namesDel[kind];
					saveSoundNamesToStorage(namesDel);
					input.value = "";
					syncPresetFileDropFromInput(input);
					syncPresetJsonToProjectFile(presets);
				} else {
					persistAppBgState(null);
					applyAppBackgroundState(null);
					syncPresetJsonToProjectFile(presets);
					input.value = "";
					syncPresetFileDropFromInput(input);
				}
			} else {
				input.click();
			}
		});
		$settingsFrame.on("dragover", ".preset-file-drop__zone", function (e) {
			e.preventDefault();
			e.stopPropagation();
			$(this).addClass("preset-file-drop__zone--dragover");
		});
		$settingsFrame.on("dragleave", ".preset-file-drop__zone", function (e) {
			var rel = e.relatedTarget;
			if (rel && this.contains(rel)) {
				return;
			}
			$(this).removeClass("preset-file-drop__zone--dragover");
		});
		$settingsFrame.on("drop", ".preset-file-drop__zone", function (e) {
			e.preventDefault();
			e.stopPropagation();
			var zone = this;
			$(zone).removeClass("preset-file-drop__zone--dragover");
			var input = $(zone).find(".preset-file-drop__input")[0];
			if (!input || !e.originalEvent || !e.originalEvent.dataTransfer) {
				return;
			}
			var dropped = e.originalEvent.dataTransfer.files;
			if (!dropped || !dropped.length) {
				return;
			}
			var droppedFile = dropped[0];
			var kindDrop = $(input).attr("data-sound-kind");
			var isBgDrop = $(input).hasClass("preset-settings-file--bg");
			if (kindDrop) {
				if (droppedFile.type && droppedFile.type.indexOf("audio/") !== 0) {
					return;
				}
			} else if (isBgDrop) {
				if (droppedFile.type && droppedFile.type.indexOf("image/") !== 0) {
					return;
				}
			} else {
				return;
			}
			if (assignFileToInput(input, droppedFile)) {
				$(input).trigger("change");
			}
		});

		function applyTimerSoundSourceUi() {
			var mode = loadSoundSourceFromStorage();
			var $pre = $("#preset-sound-source-preloaded-btn");
			var $up = $("#preset-sound-source-upload-btn");
			var $panelPre = $("#preset-settings-sounds-preloaded-panel");
			var $panelUp = $("#preset-settings-sounds-upload-panel");
			if (!$pre.length || !$up.length || !$panelPre.length || !$panelUp.length) {
				return;
			}
			var isPre = mode === "preloaded";
			$pre.attr("aria-selected", isPre ? "true" : "false");
			$up.attr("aria-selected", isPre ? "false" : "true");
			$pre.attr("tabindex", isPre ? "0" : "-1");
			$up.attr("tabindex", isPre ? "-1" : "0");
			if (isPre) {
				$panelPre.removeAttr("hidden");
				$panelUp.attr("hidden", "hidden");
			} else {
				$panelPre.attr("hidden", "hidden");
				$panelUp.removeAttr("hidden");
			}
		}

		function populatePreloadedSoundSelects(fileList) {
			var files = Array.isArray(fileList) ? fileList.slice() : [];
			var cur = loadPreloadedSoundSelectionsFromStorage();
			for (var psi = 0; psi < PRESET_SOUND_KINDS.length; psi++) {
				var skind = PRESET_SOUND_KINDS[psi];
				var $sel = $("#preset-sound-preloaded-" + skind);
				if (!$sel.length) {
					continue;
				}
				$sel.empty();
				$sel.append($("<option>", { value: "", text: "— None —" }));
				for (var fi = 0; fi < files.length; fi++) {
					var fn = files[fi];
					$sel.append($("<option>", { value: fn, text: fn }));
				}
				var val = cur[skind];
				if (val && files.indexOf(val) >= 0) {
					$sel.val(val);
				} else {
					$sel.val("");
				}
			}
		}

		function fetchSoundsManifestAndPopulate() {
			$.ajax({
				url: SOUNDS_MANIFEST_URL,
				dataType: "json",
				cache: false,
			})
				.done(function (data) {
					var files = data && Array.isArray(data.files) ? data.files : [];
					populatePreloadedSoundSelects(files);
				})
				.fail(function () {
					populatePreloadedSoundSelects([]);
				});
		}

		function refreshTimerSoundSettingsUi() {
			applyTimerSoundSourceUi();
			fetchSoundsManifestAndPopulate();
		}

		function initTimerSoundSettingsUi() {
			applyTimerSoundSourceUi();
			fetchSoundsManifestAndPopulate();
			$("#preset-sound-source-preloaded-btn").on("click", function () {
				saveSoundSourceToStorage("preloaded");
				refreshTimerSoundSettingsUi();
				syncPresetJsonToProjectFile(presets);
			});
			$("#preset-sound-source-upload-btn").on("click", function () {
				saveSoundSourceToStorage("upload");
				applyTimerSoundSourceUi();
				syncAllPresetFileDrops();
				syncPresetJsonToProjectFile(presets);
			});
			$settingsFrame.on("change", ".preset-settings-sound-preloaded-select", function () {
				var pkind = $(this).attr("data-sound-kind");
				if (!pkind) {
					return;
				}
				var nextSel = loadPreloadedSoundSelectionsFromStorage();
				nextSel[pkind] = String($(this).val() || "");
				savePreloadedSoundSelectionsToStorage(nextSel);
				syncPresetJsonToProjectFile(presets);
			});
		}

		syncAllPresetFileDrops();
		initTimerSoundSettingsUi();
		$counterSize.on("input", function () {
			var raw = Number($(this).val());
			var v = snapCounterSizePct(raw);
			if (v !== raw) {
				$(this).val(String(v));
			}
			$counterSizeOut.text(v + "%");
			$(this).attr("aria-valuenow", String(v));
			setCounterRangeFillPct(this, v);
			try {
				localStorage.setItem(FLIPCLOCK_COUNTER_PCT_KEY, String(v));
			} catch (e) {
				/* ignore */
			}
			applyCounterSizePct(v, clock);
		});
		$counterSize.on("change", function () {
			var v = snapCounterSizePct(Number($(this).val()));
			$(this).val(String(v));
			$counterSizeOut.text(v + "%");
			$(this).attr("aria-valuenow", String(v));
			setCounterRangeFillPct(this, v);
			try {
				localStorage.setItem(FLIPCLOCK_COUNTER_PCT_KEY, String(v));
			} catch (e) {
				/* ignore */
			}
			applyCounterSizePct(v, clock);
		});

		function presetRowGradient(hex) {
			var c = normalizeHexColor(hex);
			return "linear-gradient(to top, " + c + " 0%, transparent 100%)";
		}

		function reorderPresetsByDrag(dragId, dropId) {
			if (!dragId || !dropId || dragId === dropId) {
				return;
			}
			var fromIdx = -1;
			var toIdx = -1;
			for (var i = 0; i < presets.length; i++) {
				if (presets[i].id === dragId) {
					fromIdx = i;
				}
				if (presets[i].id === dropId) {
					toIdx = i;
				}
			}
			if (fromIdx < 0 || toIdx < 0) {
				return;
			}
			var item = presets.splice(fromIdx, 1)[0];
			var insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
			presets.splice(insertAt, 0, item);
			savePresetsToStorage(presets);
			syncPresetJsonToProjectFile(presets);
			renderList();
		}

		function renderList() {
			$list.empty();
			$list.off(".presetDrag").off(".presetTouchReorder");
			if (presets.length === 0) {
				$list.append($("<tr>").append($("<td>", { colspan: 5, class: "preset-table__empty" }).text("No presets yet. Add one below.")));
				syncActivePresetFromList();
				return;
			}
			for (var i = 0; i < presets.length; i++) {
				var p = presets[i];
				var $tr = $("<tr>", {
					class: "preset-table__row",
					draggable: true,
					"data-preset-id": p.id,
					title: "Drag or slide on row to reorder · " + p.color,
				});
				$tr.css("background", presetRowGradient(p.color));
				$tr.append($("<td>").text(p.name));
				$tr.append($("<td>").text(String(p.minutes)));
				$tr.append($("<td>").text(String(p.intervalMinutes)));
				$tr.append($("<td>").text(String(p.rounds)));
				var $actions = $("<td>", { class: "preset-table__actions" });
				$actions.append(
					$("<button>", {
						type: "button",
						class: "preset-icon-btn",
						"data-id": p.id,
						"data-action": "apply",
						"aria-label": "Apply preset",
						title: "Apply",
						html: presetActionIcon("apply"),
					}),
				);
				$actions.append(
					$("<button>", {
						type: "button",
						class: "preset-icon-btn",
						"data-id": p.id,
						"data-action": "edit",
						"aria-label": "Edit preset",
						title: "Edit",
						html: presetActionIcon("edit"),
					}),
				);
				$actions.append(
					$("<button>", {
						type: "button",
						class: "preset-icon-btn preset-icon-btn--danger",
						"data-id": p.id,
						"data-action": "delete",
						"aria-label": "Delete preset",
						title: "Delete",
						html: presetActionIcon("delete"),
					}),
				);
				$tr.append($actions);
				$list.append($tr);
			}

			$list.on("dragstart.presetDrag", "tr.preset-table__row", function (e) {
				var ev = e.originalEvent;
				var id = $(this).attr("data-preset-id");
				if (ev.dataTransfer) {
					ev.dataTransfer.setData("application/x-preset-id", id);
					ev.dataTransfer.effectAllowed = "move";
				}
				$(this).addClass("preset-table__row--dragging");
			});
			$list.on("dragend.presetDrag", "tr.preset-table__row", function () {
				$(this).removeClass("preset-table__row--dragging");
			});
			$list.on("dragover.presetDrag", "tr.preset-table__row", function (e) {
				e.preventDefault();
				var ev = e.originalEvent;
				if (ev.dataTransfer) {
					ev.dataTransfer.dropEffect = "move";
				}
			});
			$list.on("drop.presetDrag", "tr.preset-table__row", function (e) {
				e.preventDefault();
				var ev = e.originalEvent;
				var dragId = ev.dataTransfer ? ev.dataTransfer.getData("application/x-preset-id") : "";
				var dropId = $(this).attr("data-preset-id");
				reorderPresetsByDrag(dragId, dropId);
			});

			// Touch: HTML5 drag often fails on mobile; slide a row onto another to reorder.
			$list.on("touchstart.presetTouchReorder", "tr.preset-table__row", function (e) {
				var oev = e.originalEvent;
				if (!oev.touches || oev.touches.length !== 1) {
					return;
				}
				if ($(e.target).closest("button, a, input, label, .preset-icon-btn").length) {
					return;
				}
				var $tr = $(this);
				var dragId = $tr.attr("data-preset-id");
				var x0 = oev.touches[0].clientX;
				var y0 = oev.touches[0].clientY;
				var dragging = false;
				var threshold = 14;

				function onTouchMove(ev) {
					var t = ev.touches[0];
					var dx = Math.abs(t.clientX - x0);
					var dy = Math.abs(t.clientY - y0);
					if (!dragging && dx + dy > threshold) {
						dragging = true;
						$tr.addClass("preset-table__row--dragging");
					}
					if (dragging) {
						ev.preventDefault();
					}
				}

				function onTouchEnd(ev) {
					document.removeEventListener("touchmove", onTouchMove, { passive: false });
					document.removeEventListener("touchend", onTouchEnd);
					document.removeEventListener("touchcancel", onTouchEnd);
					if (ev.type === "touchcancel") {
						$tr.removeClass("preset-table__row--dragging");
						return;
					}
					var t = ev.changedTouches && ev.changedTouches[0];
					if (dragging && t) {
						var el = document.elementFromPoint(t.clientX, t.clientY);
						var dropTr = el && el.closest ? el.closest("tr.preset-table__row[data-preset-id]") : null;
						if (dropTr) {
							var dropId = dropTr.getAttribute("data-preset-id");
							reorderPresetsByDrag(dragId, dropId);
						}
					}
					$tr.removeClass("preset-table__row--dragging");
				}

				document.addEventListener("touchmove", onTouchMove, { passive: false });
				document.addEventListener("touchend", onTouchEnd);
				document.addEventListener("touchcancel", onTouchEnd);
			});

			syncActivePresetFromList();
		}

		var PRESET_PANEL_DRAG_PAD = 16;

		function clampPresetPanelPosition(left, top) {
			var el = $panel[0];
			var w = el.offsetWidth;
			var h = el.offsetHeight;
			var vw = window.innerWidth;
			var vh = window.innerHeight;
			var pad = PRESET_PANEL_DRAG_PAD;
			var maxL = vw - w - pad;
			var maxT = vh - h - pad;
			if (maxL < pad) {
				maxL = pad;
			}
			if (maxT < pad) {
				maxT = pad;
			}
			left = Math.min(Math.max(pad, left), maxL);
			top = Math.min(Math.max(pad, top), maxT);
			return { left: Math.round(left), top: Math.round(top) };
		}

		function centerPresetModalPanel() {
			var el = $panel[0];
			var w = el.offsetWidth;
			var vw = window.innerWidth;
			var pad = PRESET_PANEL_DRAG_PAD;
			var left = (vw - w) / 2;
			var top = pad;
			var c = clampPresetPanelPosition(left, top);
			$panel.css({
				left: c.left + "px",
				top: c.top + "px",
				right: "auto",
				bottom: "auto",
				margin: "0",
				transform: "none",
			});
		}

		var presetModalPanelDrag = null;

		function applyPresetModalPanelDrag(clientX, clientY) {
			if (!presetModalPanelDrag) {
				return;
			}
			var dx = clientX - presetModalPanelDrag.startX;
			var dy = clientY - presetModalPanelDrag.startY;
			var left = presetModalPanelDrag.origLeft + dx;
			var top = presetModalPanelDrag.origTop + dy;
			var c = clampPresetPanelPosition(left, top);
			$panel.css({ left: c.left + "px", top: c.top + "px" });
		}

		function endPresetModalPanelDrag() {
			if (!presetModalPanelDrag) {
				return;
			}
			presetModalPanelDrag = null;
			$presetModalHeader.removeClass("preset-modal__header--dragging");
			$(document).off(".presetModalPanelDrag");
			document.removeEventListener("touchmove", onPresetModalPanelTouchMove, { passive: false });
			document.removeEventListener("touchend", onPresetModalPanelTouchEnd);
			document.removeEventListener("touchcancel", onPresetModalPanelTouchEnd);
		}

		function onPresetModalPanelTouchMove(e) {
			if (!presetModalPanelDrag || presetModalPanelDrag.touchId === undefined) {
				return;
			}
			var t = null;
			for (var i = 0; i < e.touches.length; i++) {
				if (e.touches[i].identifier === presetModalPanelDrag.touchId) {
					t = e.touches[i];
					break;
				}
			}
			if (!t) {
				return;
			}
			e.preventDefault();
			applyPresetModalPanelDrag(t.clientX, t.clientY);
		}

		function onPresetModalPanelTouchEnd(e) {
			if (!presetModalPanelDrag || presetModalPanelDrag.touchId === undefined) {
				return;
			}
			var ended = false;
			for (var j = 0; j < e.changedTouches.length; j++) {
				if (e.changedTouches[j].identifier === presetModalPanelDrag.touchId) {
					ended = true;
					break;
				}
			}
			if (!ended) {
				return;
			}
			endPresetModalPanelDrag();
		}

		$presetModalHeader.on("mousedown.presetModalPanelDrag", function (e) {
			if (e.button !== 0) {
				return;
			}
			if ($(e.target).closest("button, a, input, select, textarea, label").length) {
				return;
			}
			e.preventDefault();
			var rect = $panel[0].getBoundingClientRect();
			presetModalPanelDrag = {
				startX: e.clientX,
				startY: e.clientY,
				origLeft: rect.left,
				origTop: rect.top,
			};
			$presetModalHeader.addClass("preset-modal__header--dragging");
			$(document).on("mousemove.presetModalPanelDrag", function (ev) {
				applyPresetModalPanelDrag(ev.clientX, ev.clientY);
			});
			$(document).on("mouseup.presetModalPanelDrag", endPresetModalPanelDrag);
		});

		$presetModalHeader.on("touchstart.presetModalPanelDrag", function (e) {
			if ($(e.target).closest("button, a, input, select, textarea, label").length) {
				return;
			}
			if (e.touches.length !== 1) {
				return;
			}
			var t = e.touches[0];
			var rect = $panel[0].getBoundingClientRect();
			presetModalPanelDrag = {
				startX: t.clientX,
				startY: t.clientY,
				origLeft: rect.left,
				origTop: rect.top,
				touchId: t.identifier,
			};
			$presetModalHeader.addClass("preset-modal__header--dragging");
			document.addEventListener("touchmove", onPresetModalPanelTouchMove, { passive: false });
			document.addEventListener("touchend", onPresetModalPanelTouchEnd);
			document.addEventListener("touchcancel", onPresetModalPanelTouchEnd);
		});

		$(window).on("resize.presetModalPanel", function () {
			if ($modal.is("[hidden]")) {
				return;
			}
			var cur = $panel[0].getBoundingClientRect();
			var c = clampPresetPanelPosition(cur.left, cur.top);
			$panel.css({ left: c.left + "px", top: c.top + "px" });
		});

		function openModal() {
			closeColorPopover();
			$modal.removeAttr("hidden").attr("aria-hidden", "false");
			$openBtn.attr("aria-expanded", "true");
			renderList();
			setTimeout(function () {
				$name.trigger("focus");
			}, 0);
			requestAnimationFrame(function () {
				centerPresetModalPanel();
				refreshPresetCounterSizeRangeFills();
			});
		}

		function closeModal() {
			closeColorPopover();
			savePresetsToStorage(presets);
			syncPresetJsonToProjectFile(presets);
			$modal.attr("hidden", "hidden").attr("aria-hidden", "true");
			$openBtn.attr("aria-expanded", "false");
		}

		function resetForm() {
			editingId = null;
			$editId.val("");
			$name.val("");
			$minutes.val("5");
			$interval.val("0");
			$rounds.val("1");
			syncPresetMultiSlider();
			setPresetColorUi("#ffffff");
			closeColorPopover();
			$saveBtn.text("Add preset");
			$resetEdit.attr("hidden", "hidden");
		}

		function startEdit(id) {
			var p = null;
			for (var i = 0; i < presets.length; i++) {
				if (presets[i].id === id) {
					p = presets[i];
					break;
				}
			}
			if (!p) {
				return;
			}
			editingId = id;
			$editId.val(id);
			$name.val(p.name);
			setPresetColorUi(p.color);
			$minutes.val(p.minutes);
			$interval.val(p.intervalMinutes);
			$rounds.val(p.rounds);
			syncPresetMultiSlider();
			$saveBtn.text("Save changes");
			$resetEdit.removeAttr("hidden");
		}

		function applyPreset(p) {
			if (typeof clock.exitIdleWallClockMode === "function") {
				clock.exitIdleWallClockMode(false);
			}
			clock.cancelPrepCountdown();
			var mmss = minutesToStartTime(p.minutes);
			clock.stop();
			clock.options.startTime = mmss;
			clock.setToTime(mmss);
			setActivePresetUi(p);
			refreshToolbar();
		}

		function tryRestoreActivePresetFromStorage() {
			var id = loadActivePresetIdFromStorage();
			if (!id) {
				setActivePresetUi(null);
				return;
			}
			for (var i = 0; i < presets.length; i++) {
				if (presets[i].id === id) {
					applyPreset(presets[i]);
					return;
				}
			}
			saveActivePresetIdToStorage(null);
			setActivePresetUi(null);
		}

		// Initial load: localStorage wins if key exists; else seed from flipClock.json
		var stored = loadPresetsFromStorage();
		if (stored !== null) {
			presets = stored;
			renderList();
			tryRestoreActivePresetFromStorage();
		} else {
			fetchPresetTimersDocument().then(function (doc) {
				presets = doc.presets;
				savePresetsToStorage(presets);
				if (doc.appBackgroundDataUrl) {
					persistAppBgState({ dataUrl: doc.appBackgroundDataUrl });
					applyAppBackgroundState({ dataUrl: doc.appBackgroundDataUrl });
				}
				if (doc.jsonRoot) {
					applySoundsFromJsonRoot(doc.jsonRoot);
				}
				syncPresetJsonToProjectFile(presets);
				renderList();
				tryRestoreActivePresetFromStorage();
				syncAllPresetFileDrops();
				refreshTimerSoundSettingsUi();
			});
		}

		$("#active-preset-clear").on("click", function () {
			clock.cancelPrepCountdown();
			if (typeof clock.exitIdleWallClockMode === "function") {
				clock.exitIdleWallClockMode(true);
			}
			setActivePresetUi(null);
			refreshToolbar();
		});

		$openBtn.on("click", function () {
			if (typeof clock.exitIdleWallClockMode === "function") {
				clock.exitIdleWallClockMode(true);
			}
			refreshToolbar();
			openModal();
		});

		$modal.find("[data-preset-close]").on("click", function () {
			closeModal();
		});

		$(document).on("keydown.presetModal", function (e) {
			if (e.key !== "Escape" || $modal.is("[hidden]")) {
				return;
			}
			if (isPresetTimerSettingsExpanded()) {
				closePresetSettings();
				e.preventDefault();
				return;
			}
			if (!$colorPopover.is("[hidden]")) {
				closeColorPopover();
				e.preventDefault();
				return;
			}
			closeModal();
		});

		$list.on("click", function (e) {
			var $btn = $(e.target).closest("button[data-action]");
			if (!$btn.length) {
				return;
			}
			var id = $btn.attr("data-id");
			var action = $btn.attr("data-action");
			if (action === "delete") {
				if (window.confirm("Delete this preset?")) {
					presets = presets.filter(function (p) {
						return p.id !== id;
					});
					savePresetsToStorage(presets);
					syncPresetJsonToProjectFile(presets);
					renderList();
					if (editingId === id) {
						resetForm();
					}
				}
				return;
			}
			if (action === "edit") {
				startEdit(id);
				return;
			}
			if (action === "apply") {
				for (var i = 0; i < presets.length; i++) {
					if (presets[i].id === id) {
						applyPreset(presets[i]);
						closeModal();
						break;
					}
				}
			}
		});

		function commitPresetForm() {
			var name = String($name.val() || "").trim();
			if (!name) {
				$name.trigger("focus");
				return;
			}
			var timerSettingsWereOpen = isPresetTimerSettingsExpanded();
			var entry = normalizePreset({
				id: editingId || generatePresetId(),
				name: name,
				color: $color.val(),
				minutes: $minutes.val(),
				intervalMinutes: $interval.val(),
				rounds: $rounds.val(),
			});
			if (editingId) {
				for (var i = 0; i < presets.length; i++) {
					if (presets[i].id === editingId) {
						presets[i] = entry;
						break;
					}
				}
			} else {
				presets.push(entry);
			}
			savePresetsToStorage(presets);
			syncPresetJsonToProjectFile(presets);
			resetForm();
			renderList();
			if (timerSettingsWereOpen) {
				window.setTimeout(function () {
					openPresetSettings({ focus: false });
				}, 0);
			}
		}

		$saveBtn.on("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			commitPresetForm();
		});

		$form.on("submit", function (e) {
			e.preventDefault();
			e.stopPropagation();
			commitPresetForm();
			return false;
		});

		$name.on("keydown", function (e) {
			if (e.key === "Enter") {
				e.preventDefault();
				commitPresetForm();
			}
		});

		$("#preset-form-reset").on("click", function () {
			resetForm();
		});
	}

	$(function () {
		document.addEventListener("click", flipClockUnlockHtmlAudioIfNeeded, { once: true, capture: true });
		document.addEventListener("touchstart", flipClockUnlockHtmlAudioIfNeeded, { once: true, capture: true, passive: true });
		document.addEventListener("keydown", flipClockUnlockHtmlAudioIfNeeded, { once: true, capture: true });

		initPresetCounterSizeTicks();
		applyAppBackgroundState(loadAppBgStateFromStorage());
		var pct0 = loadCounterSizePct();
		applyCounterSizePct(pct0, null);
		var clock = new FlipClock({
			isCountdown: true,
			startTime: "05:05",
			tickDuration: FLIPCLOCK_PREP_FLIP_MS + FLIPCLOCK_COUNTDOWN_TICK_BUFFER_MS,
			containerElement: $(".countdown"),
			face: {
				minutes: { maxValue: 59 },
				seconds: { maxValue: 59 },
			},
		});
		window.flipClockInstance = clock;
		clock.setDimensions();
		$(window).on("resize.flipclockCounter", function () {
			if (window.flipClockInstance && typeof window.flipClockInstance.setDimensions === "function") {
				window.flipClockInstance.setDimensions();
			}
			refreshPresetCounterSizeRangeFills();
		});
		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", function () {
				if (window.flipClockInstance && typeof window.flipClockInstance.setDimensions === "function") {
					window.flipClockInstance.setDimensions();
				}
				refreshPresetCounterSizeRangeFills();
			});
		}
		var applyChromeDim = initFlipClockChromeDimming(clock);
		var refreshToolbar = initFlipClockToolbar(clock, applyChromeDim);
		$(".countdown").on("flipclock:countdown-complete", function () {
			playFlipClockSound("finish");
			refreshToolbar();
		});
		initPresetTimers(clock, refreshToolbar);
		var $counterSizeInit = $("#flipclock-counter-size");
		var $counterSizeOutInit = $("#flipclock-counter-size-out");
		if ($counterSizeInit.length) {
			$counterSizeInit.val(String(pct0)).attr("aria-valuenow", String(pct0));
			$counterSizeOutInit.text(pct0 + "%");
			setCounterRangeFillPct($counterSizeInit[0], pct0);
		}
		var $trackMaxInit = $("#flipclock-preset-track-max");
		var $trackMaxOutInit = $("#flipclock-preset-track-max-out");
		if ($trackMaxInit.length) {
			var tm0 = snapTrackMaxMinutes(presetTrackMaxMinutes);
			presetTrackMaxMinutes = tm0;
			try {
				localStorage.setItem(PRESET_TRACK_MAX_KEY, String(tm0));
			} catch (e) {
				/* ignore */
			}
			$trackMaxInit.val(String(tm0)).attr("aria-valuenow", String(tm0));
			$trackMaxOutInit.text(tm0 + " min");
			setCounterRangeFillPct($trackMaxInit[0], tm0);
		}
	});
})(jQuery, window);
