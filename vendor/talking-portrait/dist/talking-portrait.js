// src/types.ts
var e = [
	"closed",
	"small",
	"open",
	"wide"
], t = 128, n = 80, r = {
	lipColor: "#b8505a",
	innerColor: "#2a0f18",
	teethColor: "#f4efe6",
	tongueColor: "#d96a7a",
	outlineColor: "#1a0a10"
};
function i(e) {
	let t = { ...r };
	for (let [n, r] of Object.entries(e ?? {})) r !== void 0 && (t[n] = r);
	return t;
}
function a(e) {
	return [
		e.lipColor,
		e.innerColor,
		e.teethColor,
		e.tongueColor,
		e.outlineColor
	].map((e) => (e ?? "none").replace("#", "")).join("-");
}
function o(e, t) {
	return `tp-mouth:${a(i(t))}:${e}`;
}
function s(t, n) {
	let r = i(n), a = {};
	for (let n of e) {
		let e = o(n, r);
		if (a[n] = e, t.textures.exists(e)) continue;
		let i = t.textures.createCanvas(e, 128, 80);
		i && (c(i.getContext(), n, r), i.refresh());
	}
	return a;
}
function c(e, t, n) {
	let r = i(n);
	switch (e.clearRect(0, 0, 128, 80), e.lineJoin = "round", e.lineCap = "round", t) {
		case "closed":
			l(e, 64, 40, r);
			break;
		case "small":
			u(e, 64, 40, 17, 8, 5, r, !1);
			break;
		case "open":
			u(e, 64, 40, 27, 17, 6, r, !0);
			break;
		case "wide": u(e, 64, 42, 40, 25, 6, r, !0);
	}
}
function l(e, t, n, r) {
	let i = () => {
		e.beginPath(), e.moveTo(t - 34, n), e.bezierCurveTo(t - 17, n - 10, t - 6, n - 9, t, n - 6), e.bezierCurveTo(t + 6, n - 9, t + 17, n - 10, t + 34, n), e.quadraticCurveTo(t, n + 15, t - 34, n), e.closePath();
	};
	r.outlineColor && (i(), e.lineWidth = 5, e.strokeStyle = r.outlineColor, e.stroke()), i(), e.fillStyle = r.lipColor, e.fill(), e.beginPath(), e.moveTo(t - 34 + 2, n), e.quadraticCurveTo(t, n + 4, t + 34 - 2, n), e.lineWidth = 2.5, e.strokeStyle = r.outlineColor ?? r.innerColor, e.stroke(), d(e, t, n + 6, 34 * .35);
}
function u(e, t, n, r, i, a, o, s) {
	let c = () => {
		e.beginPath(), e.ellipse(t, n, r + a, i + a, 0, 0, Math.PI * 2);
	};
	o.outlineColor && (c(), e.lineWidth = 5, e.strokeStyle = o.outlineColor, e.stroke()), c(), e.fillStyle = o.lipColor, e.fill(), e.save(), e.beginPath(), e.ellipse(t, n, r, i, 0, 0, Math.PI * 2), e.fillStyle = o.innerColor, e.fill(), e.clip(), s && o.tongueColor && (e.beginPath(), e.ellipse(t, n + i * .85, r * .62, i * .55, 0, 0, Math.PI * 2), e.fillStyle = o.tongueColor, e.fill()), s && o.teethColor && (e.fillStyle = o.teethColor, e.fillRect(t - r, n - i, r * 2, i * .42)), e.restore(), o.outlineColor && (e.beginPath(), e.ellipse(t, n, r, i, 0, 0, Math.PI * 2), e.lineWidth = 1.5, e.strokeStyle = o.outlineColor, e.stroke()), d(e, t, n + i + a * .5, r * .35);
}
function d(e, t, n, r) {
	e.beginPath(), e.moveTo(t - r, n), e.quadraticCurveTo(t, n + 1.5, t + r, n), e.lineWidth = 2, e.strokeStyle = "rgba(255,255,255,0.35)", e.stroke();
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/typeof.js
function f(e) {
	"@babel/helpers - typeof";
	return f = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, f(e);
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/toPrimitive.js
function p(e, t) {
	if (f(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (f(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/toPropertyKey.js
function m(e) {
	var t = p(e, "string");
	return f(t) == "symbol" ? t : t + "";
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/defineProperty.js
function h(e, t, n) {
	return (t = m(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
// src/TalkingPortrait.ts
var g = {
	x: .5,
	y: .66,
	width: .22,
	rotation: 0
};
function _(e) {
	return parseInt(e.replace("#", "").slice(0, 6), 16);
}
var v = class {
	constructor(e, t) {
		h(this, "scene", void 0), h(this, "container", void 0), h(this, "content", void 0), h(this, "base", void 0), h(this, "eyesClosedImg", void 0), h(this, "lids", void 0), h(this, "mouthImg", void 0), h(this, "width", void 0), h(this, "height", void 0), h(this, "fit", void 0), h(this, "mouthOpts", {}), h(this, "mouthKeys", null), h(this, "blinkOpts", {}), h(this, "eyesClosedKey", void 0), h(this, "shape", "closed"), h(this, "sheet", null), h(this, "talkingNow", !1), h(this, "closeTimer", null), h(this, "baseScale", 1), h(this, "baseW", 0), h(this, "baseH", 0), h(this, "blinkTimer", null), h(this, "breatheTween", null), h(this, "driver", null), h(this, "destroyed", !1), h(this, "onShutdown", () => this.destroy()), this.scene = e, this.width = t.width, this.height = t.height, this.fit = t.fit ?? "cover", this.container = e.make.container({
			x: t.x,
			y: t.y
		}, !1), t.depth !== void 0 && this.container.setDepth(t.depth), this.content = e.make.container({
			x: 0,
			y: this.height / 2
		}, !1), this.base = e.make.sprite({
			x: 0,
			y: -this.height / 2,
			key: "__DEFAULT"
		}, !1).setVisible(!1), this.eyesClosedImg = e.make.image({
			x: 0,
			y: -this.height / 2,
			key: "__DEFAULT"
		}, !1).setVisible(!1), this.lids = e.make.graphics({}, !1).setVisible(!1), this.mouthImg = e.make.image({
			x: 0,
			y: 0,
			key: "__DEFAULT"
		}, !1).setVisible(!1), this.content.add([
			this.base,
			this.eyesClosedImg,
			this.lids,
			this.mouthImg
		]), this.container.add(this.content), this.container.once("destroy", () => this.cleanup()), e.events.once("shutdown", this.onShutdown), this.eyesClosedKey = t.layers?.eyesClosed, this.configure({
			mouth: t.mouth,
			blink: t.blink
		}), t.textureKey ? this.setTexture(t.textureKey, t.frame) : this.layout(), this.setBreathing(t.breathe ?? .008);
	}
	attach(e) {
		return e ? e.add(this.container) : this.scene.add.existing(this.container), this;
	}
	detach() {
		let e = this.container.parentContainer;
		return e ? e.remove(this.container) : this.container.removeFromDisplayList(), this;
	}
	setPosition(e, t) {
		return this.container.setPosition(e, t), this;
	}
	setVisible(e) {
		return this.container.setVisible(e), e || (this.driver?.idle(), this.setTalking(!1)), this;
	}
	get visible() {
		return this.container.visible;
	}
	setSize(e, t) {
		return this.width = e, this.height = t, this.content.setY(t / 2), this.base.setY(-t / 2), this.eyesClosedImg.setY(-t / 2), this.layout(), this;
	}
	setTexture(e, t, n) {
		return this.leaveSheet(), n && ("eyesClosed" in n && (this.eyesClosedKey = n.eyesClosed), this.configure(n)), this.base.setTexture(e, t).setVisible(!0), this.layout(), this;
	}
	setSpriteSheet(e) {
		if (this.destroyed) return this;
		this.leaveSheet();
		let t = this.scene.textures.get(e.key);
		e.frameWidth && e.frameHeight && y(t, e.frameWidth, e.frameHeight);
		let n = this.base.anims, r = `${e.key}#idle`, i = `${e.key}#talk`;
		for (let [t, a] of [[r, e.idle], [i, e.talk]]) n.exists(t) && n.remove(t), n.create({
			key: t,
			frames: a.frames.map((t) => typeof t == "object" ? {
				key: e.key,
				...t
			} : {
				key: e.key,
				frame: t
			}),
			frameRate: a.frameRate ?? 8,
			repeat: -1
		});
		this.sheet = {
			key: e.key,
			idle: r,
			talk: i,
			closeHold: e.closeHold ?? 160
		}, this.talkingNow = !1, this.shape = "closed";
		let a = e.idle.frames[0];
		return this.base.setTexture(e.key, typeof a == "object" ? a.frame : a).setVisible(!0), this.mouthImg.setVisible(!1), this.showLids(!1), this.layout(), this.scheduleBlink(), this.base.play(r), this;
	}
	get hasSpriteSheet() {
		return !!this.sheet;
	}
	get talking() {
		return this.talkingNow;
	}
	setTalking(e) {
		return this.closeTimer?.remove(), this.closeTimer = null, !this.sheet || this.destroyed || e === this.talkingNow || (this.talkingNow = e, this.base.play(e ? this.sheet.talk : this.sheet.idle, !0)), this;
	}
	configure(e) {
		return e.mouth ? (this.mouthOpts = { ...e.mouth }, this.mouthKeys = e.mouth.sheet ? null : s(this.scene, e.mouth.style)) : !this.mouthKeys && !this.mouthOpts.sheet && (this.mouthKeys = s(this.scene)), e.blink && (this.blinkOpts = { ...e.blink }), this.layout(), this.scheduleBlink(), this;
	}
	get mouth() {
		return this.shape;
	}
	setMouth(e) {
		if (this.shape = e, this.destroyed) return this;
		if (this.sheet) return e === "closed" ? this.talkingNow && !this.closeTimer && (this.closeTimer = this.scene.time.delayedCall(this.sheet.closeHold, () => {
			this.closeTimer = null, this.setTalking(!1);
		})) : this.setTalking(!0), this;
		let t = this.mouthOpts.sheet;
		return t ? this.mouthImg.setTexture(t.key, t.frames[e]) : this.mouthKeys && this.mouthImg.setTexture(this.mouthKeys[e]), this.mouthImg.setVisible(e !== "closed" || this.mouthOpts.showClosed !== !1), this.scaleMouth(), this;
	}
	claim(e) {
		this.driver && this.driver !== e && this.driver.idle(), this.driver = e;
	}
	release(e) {
		this.driver === e && (this.driver = null);
	}
	idle() {
		return this.driver?.idle(), this.setMouth("closed"), this.setTalking(!1), this;
	}
	blink() {
		if (this.destroyed || !this.canBlink()) return;
		let e = this.blinkOpts.duration ?? 130;
		this.showLids(!0), this.scene.time.delayedCall(e, () => this.showLids(!1));
	}
	setBreathing(e) {
		return this.breatheTween?.remove(), this.breatheTween = null, this.content.setScale(1), e && e > 0 && (this.breatheTween = this.scene.tweens.add({
			targets: this.content,
			scaleY: 1 + e,
			scaleX: 1 + e * .3,
			duration: 1900,
			yoyo: !0,
			repeat: -1,
			ease: "Sine.easeInOut"
		})), this;
	}
	destroy() {
		this.destroyed || (this.container.destroy(), this.cleanup());
	}
	cleanup() {
		if (this.destroyed) return;
		this.destroyed = !0, this.scene.events.off("shutdown", this.onShutdown);
		let e = this.driver;
		this.driver = null, e?.destroy(), this.blinkTimer?.remove(), this.blinkTimer = null, this.breatheTween?.remove(), this.breatheTween = null, this.closeTimer?.remove(), this.closeTimer = null;
	}
	leaveSheet() {
		this.sheet && (this.closeTimer?.remove(), this.closeTimer = null, this.base.stop(), this.sheet = null, this.talkingNow = !1);
	}
	toLocal(e, t) {
		return {
			x: (e - .5) * this.baseW * this.baseScale,
			y: -this.height / 2 + (t - .5) * this.baseH * this.baseScale
		};
	}
	layout() {
		let e = this.base.visible && this.base.frame && this.base.texture.key !== "__DEFAULT", t = e ? this.base.frame.realWidth : this.width, n = e ? this.base.frame.realHeight : this.height;
		this.baseW = t, this.baseH = n;
		let r = this.width / t, i = this.height / n;
		this.baseScale = this.fit === "cover" ? Math.max(r, i) : Math.min(r, i), e && (this.applyFit(this.base), this.eyesClosedKey && this.scene.textures.exists(this.eyesClosedKey) && (this.eyesClosedImg.setTexture(this.eyesClosedKey), this.applyFit(this.eyesClosedImg)));
		let a = {
			...g,
			...this.mouthOpts
		}, o = this.toLocal(a.x, a.y);
		this.mouthImg.setPosition(o.x, o.y).setRotation(a.rotation), this.sheet || this.setMouth(this.shape), this.lids.visible && this.drawLids();
	}
	applyFit(e) {
		let t = e.frame.realWidth, n = e.frame.realHeight, r = this.fit === "cover" ? Math.max(this.width / t, this.height / n) : Math.min(this.width / t, this.height / n);
		e.setScale(r);
		let i = Math.min(t, this.width / r), a = Math.min(n, this.height / r);
		e.setCrop((t - i) / 2, (n - a) / 2, i, a);
	}
	scaleMouth() {
		let e = {
			...g,
			...this.mouthOpts
		}.width * this.baseW * this.baseScale, t = this.mouthOpts.sheet ? this.mouthImg.frame.realWidth : 128;
		this.mouthImg.setScale(e / t);
	}
	canBlink() {
		return this.sheet || this.blinkOpts.enabled === !1 ? !1 : !!this.eyesClosedKey && this.scene.textures.exists(this.eyesClosedKey) || (this.blinkOpts.eyes?.length ?? 0) > 0;
	}
	scheduleBlink() {
		if (this.blinkTimer?.remove(), this.blinkTimer = null, this.destroyed || !this.canBlink()) return;
		let e = this.blinkOpts.minInterval ?? 2200, t = Math.max(e, this.blinkOpts.maxInterval ?? 5200);
		this.blinkTimer = this.scene.time.delayedCall(e + Math.random() * (t - e), () => {
			this.blink(), Math.random() < (this.blinkOpts.doubleChance ?? .15) && this.scene.time.delayedCall((this.blinkOpts.duration ?? 130) * 2.2, () => this.blink()), this.scheduleBlink();
		});
	}
	showLids(e) {
		this.destroyed || (this.eyesClosedKey && this.scene.textures.exists(this.eyesClosedKey) ? (this.eyesClosedImg.setVisible(e && this.base.visible), this.lids.setVisible(!1)) : (this.lids.setVisible(e), e && this.drawLids()));
	}
	drawLids() {
		let e = this.lids;
		e.clear();
		let t = _(this.blinkOpts.lidColor ?? "#c98d6b"), n = _(this.blinkOpts.lashColor ?? "#1a0a10"), r = this.baseW * this.baseScale;
		for (let i of this.blinkOpts.eyes ?? []) this.drawLid(e, i, r, t, n);
	}
	drawLid(e, t, n, r, i) {
		let a = (t.width ?? .1) * n, o = (t.height ?? (t.width ?? .1) * .6) * n, s = this.toLocal(t.x, t.y);
		e.fillStyle(r, 1), e.fillEllipse(s.x, s.y, a * 1.15, o * 1.2);
		let c = [];
		for (let e = 0; e <= 10; e++) {
			let t = e / 10;
			c.push({
				x: s.x - a / 2 + a * t,
				y: s.y + o * .12 + Math.sin(t * Math.PI) * o * .22
			});
		}
		e.lineStyle(Math.max(1.5, a * .08), i, 1), e.strokePoints(c, !1, !1);
	}
};
function y(e, t, n) {
	let r = e.source[0];
	if (!r) return;
	let i = Math.floor(r.width / t), a = Math.floor(r.height / n);
	for (let r = 0; r < i * a; r++) {
		let a = e.has(String(r)) ? e.get(r) : null;
		a && a.width === t && a.height === n || (a && e.remove(String(r)), e.add(r, 0, r % i * t, Math.floor(r / i) * n, t, n));
	}
}
// src/timing.ts
var b = {
	",": 2.5,
	";": 3,
	":": 3,
	".": 6,
	"!": 6,
	"?": 6,
	"…": 8
};
function x(e) {
	return b[e] ?? 0;
}
function S(e, t, n = !0) {
	let r = 1e3 / Math.max(1, t), i = [], a = 0;
	for (let t = 0; t < e.length; t++) if (i.push(a), a += r, n) {
		let n = e[t], i = e[t + 1];
		i && x(i) && x(n) || (a += x(n) * r);
	}
	return {
		times: i,
		total: a
	};
}
function C(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] <= t ? n = i + 1 : r = i;
	}
	return n;
}
// src/TypewriterMouth.ts
function w(e) {
	let t = e.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
	return !t || x(e) ? "closed" : t === "a" ? "wide" : t === "e" || t === "o" ? "open" : t === "i" || t === "y" || t === "u" ? "small" : t === "m" || t === "b" || t === "p" ? "closed" : /[0-9]/.test(t) ? "open" : /[a-z]/.test(t) || /\s/.test(t) ? "small" : "closed";
}
function T(e) {
	switch (e) {
		case "wide": return "open";
		case "open": return "small";
		case "small": return "open";
		default: return "closed";
	}
}
var E = class {
	constructor(e, t = {}) {
		h(this, "face", void 0), h(this, "opts", void 0), h(this, "times", []), h(this, "text", ""), h(this, "total", 0), h(this, "start", 0), h(this, "lastChange", -Infinity), h(this, "lastPulse", -Infinity), h(this, "mode", "off"), h(this, "resolve", null), h(this, "listening", !1), h(this, "destroyed", !1), h(this, "tick", () => {
			let e = this.now();
			if (this.mode === "manual") {
				e - this.lastPulse > this.opts.closeAfter && this.idle();
				return;
			}
			let t = e - this.start;
			if (t >= this.total) {
				this.idle();
				return;
			}
			if (e - this.lastChange < this.opts.minHold) return;
			let n = Math.max(0, C(this.times, t) - 1);
			this.apply(w(this.text[n] ?? ""), e);
		}), this.face = e, this.opts = {
			cps: 28,
			minHold: 75,
			pauses: !0,
			closeAfter: 140,
			...t
		};
	}
	get speaking() {
		return this.mode !== "off";
	}
	get cps() {
		return this.opts.cps;
	}
	set cps(e) {
		this.opts.cps = e;
	}
	speak(e, t = {}) {
		if (this.destroyed) return Promise.resolve();
		this.finish();
		let n = S(e, t.cps ?? this.opts.cps, this.opts.pauses);
		return this.text = e, this.times = n.times, this.total = n.total, this.start = this.now(), this.lastChange = -Infinity, this.mode = "auto", this.face.claim(this), this.listen(!0), new Promise((e) => this.resolve = e);
	}
	pulse(e) {
		if (this.destroyed) return;
		this.mode !== "manual" && (this.finish(), this.mode = "manual", this.face.claim(this), this.listen(!0));
		let t = this.now();
		this.lastPulse = t, t - this.lastChange >= this.opts.minHold && this.apply(w(e), t);
	}
	idle() {
		this.mode !== "off" && (this.finish(), this.face.setMouth("closed"));
	}
	destroy() {
		this.destroyed || (this.idle(), this.destroyed = !0, this.face.release(this));
	}
	now() {
		return this.face.scene.time.now;
	}
	finish() {
		this.mode = "off", this.listen(!1);
		let e = this.resolve;
		this.resolve = null, e?.();
	}
	listen(e) {
		let t = this.face.scene.events;
		e && !this.listening && t.on("update", this.tick), !e && this.listening && t.off("update", this.tick), this.listening = e;
	}
	apply(e, t) {
		let n = this.face.mouth, r = e === n && e !== "closed" ? T(e) : e;
		r !== n && this.face.setMouth(r), this.lastChange = t;
	}
}, D = class {
	constructor(e, t = {}) {
		h(this, "face", void 0), h(this, "opts", void 0), h(this, "times", []), h(this, "total", 0), h(this, "start", 0), h(this, "active", !1), h(this, "resolve", null), h(this, "destroyed", !1), h(this, "tick", () => {
			let e = this.face.scene.time.now - this.start;
			if (e >= this.total) {
				this.idle();
				return;
			}
			if (this.opts.pauseGap === Infinity) return;
			let t = C(this.times, e), n = this.times[t - 1] ?? 0, r = this.times[t] ?? this.total;
			this.face.setTalking(r - n <= this.opts.pauseGap);
		}), this.face = e, this.opts = {
			cps: 28,
			pauses: !0,
			pauseGap: Infinity,
			...t
		};
	}
	get speaking() {
		return this.active;
	}
	get cps() {
		return this.opts.cps;
	}
	set cps(e) {
		this.opts.cps = e;
	}
	speak(e, t = {}) {
		if (this.destroyed) return Promise.resolve();
		this.finish();
		let n = S(e, t.cps ?? this.opts.cps, this.opts.pauses);
		return this.times = n.times, this.total = n.total, this.start = this.face.scene.time.now, this.active = !0, this.face.claim(this), this.face.scene.events.on("update", this.tick), this.face.setTalking(!0), new Promise((e) => this.resolve = e);
	}
	talk() {
		this.destroyed || (this.finish(), this.face.claim(this), this.face.setTalking(!0));
	}
	idle() {
		this.finish(), this.face.setTalking(!1);
	}
	destroy() {
		this.destroyed || (this.idle(), this.destroyed = !0, this.face.release(this));
	}
	finish() {
		this.active && this.face.scene.events.off("update", this.tick), this.active = !1;
		let e = this.resolve;
		this.resolve = null, e?.();
	}
}, O = "@beer-digital/lipsync-engine";
async function k(e) {
	if (e === null) return null;
	if (e && e !== "auto") return e;
	try {
		let e = await import(
			/* @vite-ignore */
			O
);
		return e.LipSyncEngine ? e : null;
	} catch {
		return null;
	}
}
function A(e) {
	let t = e.shape?.open ?? (e.viseme === "sil" ? 0 : (e.intensity ?? 0) * .6), n = e.shape?.width ?? .5, r = e.shape?.round ?? 0;
	return t < .08 ? "closed" : t < .3 || r > .7 ? "small" : t > .7 && n >= .55 ? "wide" : "open";
}
var j = class e {
	constructor(e, t, n, r) {
		h(this, "face", void 0), h(this, "element", void 0), h(this, "buffer", void 0), h(this, "opts", void 0), h(this, "ctx", null), h(this, "analyser", null), h(this, "engine", null), h(this, "bufferSource", null), h(this, "timeData", null), h(this, "freqData", null), h(this, "level", 0), h(this, "lastChange", -Infinity), h(this, "playing", !1), h(this, "resolve", null), h(this, "listening", !1), h(this, "destroyed", !1), h(this, "sensitivity", void 0), h(this, "minHold", void 0), h(this, "tick", () => {
			if (!this.analyser || !this.timeData || !this.freqData || !this.ctx) {
				let e = this.face.scene.time.now;
				this.push(Math.floor(e / 110) % 3 == 0 ? "small" : Math.floor(e / 110) % 3 == 1 ? "open" : "closed");
				return;
			}
			this.analyser.getFloatTimeDomainData(this.timeData);
			let e = 0;
			for (let t = 0; t < this.timeData.length; t++) e += this.timeData[t] * this.timeData[t];
			let t = Math.sqrt(e / this.timeData.length) * this.sensitivity;
			this.level += (t - this.level) * (t > this.level ? .6 : .25), this.analyser.getByteFrequencyData(this.freqData);
			let n = this.ctx.sampleRate / this.analyser.fftSize, r = 0, i = 0;
			for (let e = 1; e < this.freqData.length; e++) {
				let t = e * n;
				t < 1e3 ? r += this.freqData[e] : t > 2500 && t < 7e3 && (i += this.freqData[e]);
			}
			let a = i > r * .9, o = Math.min(1, this.level * 6), s;
			s = o < .08 ? "closed" : o < .25 || a ? "small" : o < .55 ? "open" : "wide", this.push(s);
		}), this.face = e, this.element = t, this.buffer = n, this.opts = r, this.sensitivity = r.sensitivity ?? 1, this.minHold = r.minHold ?? 70;
	}
	static async fromUrl(t, n, r = {}) {
		let i = new Audio();
		return i.crossOrigin = "anonymous", i.preload = "auto", i.src = n, e.fromElement(t, i, r);
	}
	static async fromElement(t, n, r = {}) {
		let i = new e(t, n, null, r);
		r.volume !== void 0 && (n.volume = r.volume);
		let a = await k(r.lipsync);
		if (a) try {
			let e = new a.LipSyncEngine({ ...r.lipsyncOptions });
			return await e.init(), e.attachElement(n), e.on("viseme", (e) => i.push(A(e))), i.engine = e, i;
		} catch (e) {
			console.warn("[talking-portrait] lipsync-engine indisponible, analyseur intégré utilisé", e);
		}
		return i.setupAnalyser((e) => e.createMediaElementSource(n)), i;
	}
	static fromBuffer(t, n, r = {}) {
		let i = new e(t, null, n, r);
		return i.setupAnalyser(null), i;
	}
	get speaking() {
		return this.playing;
	}
	async speak() {
		if (this.destroyed) return;
		this.stopPlayback(), this.face.claim(this), this.playing = !0, this.level = 0, this.lastChange = -Infinity;
		let e = new Promise((e) => this.resolve = e);
		try {
			if (this.ctx?.state === "suspended" && await this.ctx.resume(), this.element) this.element.currentTime = 0, this.element.onended = () => this.idle(), this.engine?.startAnalysis(), await this.element.play();
			else if (this.buffer && this.ctx && this.analyser) {
				let e = this.ctx.createBufferSource();
				e.buffer = this.buffer;
				let t = this.analyser;
				if (this.opts.volume !== void 0) {
					let e = this.ctx.createGain();
					e.gain.value = this.opts.volume, e.connect(this.analyser), t = e;
				}
				e.connect(t), e.onended = () => {
					this.bufferSource === e && this.idle();
				}, this.bufferSource = e, e.start();
			} else this.idle();
		} catch (e) {
			console.warn("[talking-portrait] lecture audio impossible", e), this.idle();
		}
		return this.playing && !this.engine && this.listen(!0), e;
	}
	idle() {
		this.playing && this.stopPlayback(), this.playing = !1, this.listen(!1), this.destroyed || this.face.setMouth("closed");
		let e = this.resolve;
		this.resolve = null, e?.();
	}
	destroy() {
		this.destroyed || (this.idle(), this.destroyed = !0, this.engine?.stopAnalysis?.(), this.engine?.destroy?.(), this.engine = null, this.element && (this.element.onended = null), this.opts.context || this.ctx?.close().catch(() => void 0), this.face.release(this));
	}
	setupAnalyser(e) {
		try {
			let t = window.AudioContext ?? window.webkitAudioContext;
			if (!this.opts.context && !t) return;
			let n = this.opts.context ?? new t(), r = n.createAnalyser();
			r.fftSize = 1024, r.smoothingTimeConstant = .3, r.connect(n.destination), e?.(n).connect(r), this.ctx = n, this.analyser = r, this.timeData = new Float32Array(r.fftSize), this.freqData = new Uint8Array(r.frequencyBinCount);
		} catch (e) {
			console.warn("[talking-portrait] WebAudio indisponible, battement simple", e), this.ctx = null, this.analyser = null;
		}
	}
	stopPlayback() {
		if (this.element && (this.element.pause(), this.engine?.stopAnalysis?.()), this.bufferSource) {
			let e = this.bufferSource;
			this.bufferSource = null;
			try {
				e.stop();
			} catch {}
		}
	}
	listen(e) {
		let t = this.face.scene.events;
		e && !this.listening && t.on("update", this.tick), !e && this.listening && t.off("update", this.tick), this.listening = e;
	}
	push(e) {
		if (!this.playing || this.destroyed) return;
		let t = this.face.scene.time.now;
		t - this.lastChange < this.minHold || e === this.face.mouth || (this.face.setMouth(e), this.lastChange = t);
	}
};
// src/typewrite.ts
function M(e, t, n = {}) {
	let r = e.scene, i = e.style.wordWrapWidth ? e.getWrappedText(t).join("\n") : t, { times: a, total: o } = S(i, n.cps ?? 30, n.pauses ?? !0), s = r.time.now, c = 0, l = !1, u, d = new Promise((e) => u = e), f = (t) => {
		l || (l = !0, r.events.off("update", p), t && e.active && e.setText(i), u(t));
	}, p = () => {
		if (!e.active) return f(!1);
		let t = r.time.now - s, l = C(a, t);
		if (l !== c) {
			for (let e = c; e < l; e++) n.onChar?.(i[e], e);
			c = l, e.setText(i.slice(0, l));
		}
		t >= o && f(!0);
	};
	return e.setText(""), i.length ? r.events.on("update", p) : f(!0), {
		done: d,
		get finished() {
			return l;
		},
		skip: () => f(!0),
		stop: () => f(!1)
	};
}
export { j as AudioMouth, e as MOUTH_SHAPES, n as MOUTH_TEX_H, t as MOUTH_TEX_W, D as SpriteTalk, v as TalkingPortrait, E as TypewriterMouth, c as drawMouth, s as ensureMouthTextures, o as mouthTextureKey, S as revealTimeline, w as shapeForChar, A as shapeFromViseme, M as typewrite };

//# sourceMappingURL=talking-portrait.js.map