import { Check } from "lucide-react"

interface Step {
  id: string | number
  title: string
  description?: string
  status: 'completed' | 'current' | 'upcoming'
}

interface StepperProps {
  steps: Step[]
  orientation?: 'horizontal' | 'vertical'
  onStepClick?: (stepId: string | number) => void
}

export function Stepper({
  steps,
  orientation = 'horizontal',
  onStepClick
}: StepperProps) {
  const isVertical = orientation === 'vertical'

  return (
    <div
      className={`
        ${isVertical ? 'flex-col space-y-4' : 'flex items-center space-x-4'}
      `}
    >
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed'
        const isCurrent = step.status === 'current'
        const isClickable = onStepClick && (isCompleted || isCurrent)

        return (
          <div
            key={step.id}
            className={`
              flex ${isVertical ? 'items-start' : 'flex-col items-center'}
              ${index !== steps.length - 1 ? 'flex-1' : ''}
            `}
          >
            <div className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`
                  relative flex h-8 w-8 items-center justify-center rounded-full
                  ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                  ${isCurrent ? 'border-2 border-primary bg-primary/10' : ''}
                  ${!isCompleted && !isCurrent ? 'border-2 border-muted bg-background' : ''}
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className={isCurrent ? 'text-primary' : 'text-muted-foreground'}>
                    {index + 1}
                  </span>
                )}
              </button>

              {index !== steps.length - 1 && (
                <div
                  className={`
                    ${isVertical ? 'h-full w-px ml-4 mt-8' : 'h-px w-full mt-4'}
                    ${isCompleted ? 'bg-primary' : 'bg-border'}
                  `}
                />
              )}
            </div>

            <div
              className={`
                ${isVertical ? 'ml-4' : 'mt-2'}
                ${isClickable ? 'cursor-pointer' : ''}
              `}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              <div className={`
                text-sm font-medium
                ${isCurrent ? 'text-primary' : ''}
                ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}
              `}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 