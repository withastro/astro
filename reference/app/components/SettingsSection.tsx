interface Field {
  label: string
  value: string | boolean
  type: 'text' | 'email' | 'password' | 'select' | 'toggle'
}

interface SettingsSectionProps {
  title: string
  description: string
  fields: Field[]
}

export function SettingsSection({ title, description, fields }: SettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {description}
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-3 border-b last:border-0"
          >
            <div>
              <label className="text-sm font-medium">{field.label}</label>
            </div>
            <div className="flex items-center">
              {field.type === 'toggle' ? (
                <div className={`
                  w-11 h-6 rounded-full transition-colors
                  ${field.value ? 'bg-primary' : 'bg-muted'}
                  relative cursor-pointer
                `}>
                  <div className={`
                    absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform
                    ${field.value ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {typeof field.value === 'string' ? field.value : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 