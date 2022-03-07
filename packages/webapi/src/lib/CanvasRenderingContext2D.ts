import type { HTMLCanvasElement } from './HTMLCanvasElement'
import type { OffscreenCanvas } from './OffscreenCanvas'

import * as _ from './utils'
import { ImageData } from './ImageData'

export class CanvasRenderingContext2D {
	get canvas(): HTMLCanvasElement | OffscreenCanvas | null {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'canvas').canvas
	}

	get direction(): 'ltr' | 'rtl' | 'inherit' {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'direction')
			.direction
	}

	get fillStyle(): string {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'fillStyle')
			.fillStyle
	}

	get filter(): string {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'filter').filter
	}

	get globalAlpha(): number {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'globalAlpha')
			.globalAlpha
	}

	get globalCompositeOperation(): string {
		return _.internalsOf(
			this,
			'CanvasRenderingContext2D',
			'globalCompositeOperation'
		).globalCompositeOperation
	}

	get font(): string {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'font').font
	}

	get imageSmoothingEnabled(): boolean {
		return _.internalsOf(
			this,
			'CanvasRenderingContext2D',
			'imageSmoothingEnabled'
		).imageSmoothingEnabled
	}

	get imageSmoothingQuality(): 'low' | 'medium' | 'high' {
		return _.internalsOf(
			this,
			'CanvasRenderingContext2D',
			'imageSmoothingQuality'
		).imageSmoothingQuality
	}

	get lineCap(): 'butt' | 'round' | 'square' {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'lineCap').lineCap
	}

	get lineDashOffset(): number {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'lineDashOffset')
			.lineDashOffset
	}

	get lineJoin(): 'bevel' | 'round' | 'miter' {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'lineJoin').lineJoin
	}

	get lineWidth(): number {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'lineWidth')
			.lineWidth
	}

	get miterLimit(): number {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'miterLimit')
			.miterLimit
	}

	get strokeStyle(): string {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'strokeStyle')
			.strokeStyle
	}

	get shadowOffsetX(): number {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'shadowOffsetX')
			.shadowOffsetX
	}

	get shadowOffsetY(): number {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'shadowOffsetY')
			.shadowOffsetY
	}

	get shadowBlur(): number {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'shadowBlur')
			.shadowBlur
	}

	get shadowColor(): string {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'shadowColor')
			.shadowColor
	}

	get textAlign(): 'left' | 'right' | 'center' | 'start' | 'end' {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'textAlign')
			.textAlign
	}

	get textBaseline():
		| 'top'
		| 'hanging'
		| 'middle'
		| 'alphabetic'
		| 'ideographic'
		| 'bottom' {
		return _.internalsOf(this, 'CanvasRenderingContext2D', 'textBaseline')
			.textBaseline
	}

	arc() {}
	arcTo() {}
	beginPath() {}
	bezierCurveTo() {}
	clearRect() {}
	clip() {}
	closePath() {}

	createImageData(width: number, height: number): void
	createImageData(imagedata: ImageData): void

	createImageData(arg0: number | ImageData, arg1?: void | number) {
		/** Whether ImageData is provided. */
		const hasData = _.__object_isPrototypeOf(ImageData.prototype, arg0)

		const w = hasData ? (arg0 as ImageData).width : (arg0 as number)
		const h = hasData ? (arg0 as ImageData).height : (arg1 as number)
		const d = hasData
			? (arg0 as ImageData).data
			: new Uint8ClampedArray(w * h * 4)

		return new ImageData(d, w, h)
	}

	createLinearGradient() {}
	createPattern() {}
	createRadialGradient() {}
	drawFocusIfNeeded() {}
	drawImage() {}
	ellipse() {}
	fill() {}
	fillRect() {}
	fillText() {}
	getContextAttributes() {}
	getImageData() {}
	getLineDash() {}
	getTransform() {}
	isPointInPath() {}
	isPointInStroke() {}
	lineTo() {}
	measureText() {}
	moveTo() {}
	putImageData() {}
	quadraticCurveTo() {}
	rect() {}
	resetTransform() {}
	restore() {}
	rotate() {}
	save() {}
	scale() {}
	setLineDash() {}
	setTransform() {}
	stroke() {}
	strokeRect() {}
	strokeText() {}
	transform() {}
	translate() {}
}

_.allowStringTag(CanvasRenderingContext2D)

export const __createCanvasRenderingContext2D = (
	canvas: EventTarget
): CanvasRenderingContext2D => {
	const renderingContext2D = Object.create(
		CanvasRenderingContext2D.prototype
	) as CanvasRenderingContext2D

	_.INTERNALS.set(renderingContext2D, {
		canvas,
		direction: 'inherit',
		fillStyle: '#000',
		filter: 'none',
		font: '10px sans-serif',
		globalAlpha: 0,
		globalCompositeOperation: 'source-over',
		imageSmoothingEnabled: false,
		imageSmoothingQuality: 'high',
		lineCap: 'butt',
		lineDashOffset: 0.0,
		lineJoin: 'miter',
		lineWidth: 1.0,
		miterLimit: 10.0,
		shadowBlur: 0,
		shadowColor: '#000',
		shadowOffsetX: 0,
		shadowOffsetY: 0,
		strokeStyle: '#000',
		textAlign: 'start',
		textBaseline: 'alphabetic',
	})

	return renderingContext2D
}

/** Returns whether the value is an instance of ImageData. */
const isImageData = <T>(value: T) =>
	(Object(value).data instanceof Uint8ClampedArray) as T extends ImageData
		? true
		: false
