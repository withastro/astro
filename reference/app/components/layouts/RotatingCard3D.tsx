import { ReactNode, useRef, useState } from "react"
import { Card } from "../ui/card"

interface RotatingCard3DProps {
  front: ReactNode
  back: ReactNode
  className?: string
  depth?: number
  rotationSpeed?: number
}

export function RotatingCard3D({
  front,
  back,
  className = "",
  depth = 20,
  rotationSpeed = 0.15
}: RotatingCard3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (y - centerY) * rotationSpeed
    const rotateY = (centerX - x) * rotationSpeed

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  const handleClick = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div
      ref={cardRef}
      className={`group perspective-[1000px] ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        className="relative transition-transform duration-500 [transform-style:preserve-3d]"
        style={{
          transform: `
            rotateX(${rotation.x}deg)
            rotateY(${rotation.y}deg)
            ${isFlipped ? "rotateY(180deg)" : ""}
          `
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{
            transform: `translateZ(${depth}px)`,
          }}
        >
          <Card className="h-full w-full">
            {front}
          </Card>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            transform: `rotateY(180deg) translateZ(${depth}px)`,
          }}
        >
          <Card className="h-full w-full">
            {back}
          </Card>
        </div>

        {/* Edge effect */}
        <div
          className="absolute inset-x-0 bottom-0 h-full origin-bottom bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            transform: `rotateX(90deg) translateZ(${depth}px) translateY(${depth}px)`,
          }}
        />
      </div>

      {/* Shadow */}
      <div
        className="absolute inset-0 -z-10 translate-y-4 scale-[0.95] rounded-2xl bg-black/20 blur-xl transition-transform duration-500 group-hover:scale-100"
        style={{
          transform: `
            scale(0.95)
            translateY(${depth}px)
            rotateX(${rotation.x * 0.5}deg)
            rotateY(${rotation.y * 0.5}deg)
          `,
        }}
      />
    </div>
  )
} 