import { AlertTriangle, Brain, Lightbulb, Target, TrendingUp, Zap } from "lucide-react"
import { Card } from "../ui/Card"

interface Insight {
  type: "opportunity" | "risk" | "trend" | "action" | "prediction" | "anomaly"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  confidence: number
  metrics?: {
    label: string
    value: string | number
    change?: number
  }[]
  recommendations?: string[]
  source: string
}

interface AIMarketingInsightsProps {
  insights: Insight[]
  title?: string
}

export function AIMarketingInsights({
  insights,
  title = "AI Marketing Insights"
}: AIMarketingInsightsProps) {
  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "opportunity":
        return <Lightbulb className="h-5 w-5 text-green-500" />
      case "risk":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "trend":
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case "action":
        return <Target className="h-5 w-5 text-purple-500" />
      case "prediction":
        return <Brain className="h-5 w-5 text-amber-500" />
      case "anomaly":
        return <Zap className="h-5 w-5 text-orange-500" />
    }
  }

  const getImpactColor = (impact: Insight["impact"]) => {
    switch (impact) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-amber-500"
      case "low":
        return "text-green-500"
    }
  }

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(0)}%`
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4" />
          <span>AI-powered insights</span>
        </div>
      </div>

      <div className="space-y-6">
        {insights.map((insight, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-4">
              <div className="mt-1">{getInsightIcon(insight.type)}</div>
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">{insight.title}</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={getImpactColor(insight.impact)}>
                      {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                    </span>
                    <span className="text-muted-foreground">
                      {formatConfidence(insight.confidence)} confidence
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{insight.description}</p>

                {insight.metrics && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {insight.metrics.map((metric, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                        <p className="text-lg font-medium">{metric.value}</p>
                        {metric.change && (
                          <p
                            className={`text-sm ${
                              metric.change >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {metric.change >= 0 ? "+" : ""}
                            {metric.change.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {insight.recommendations && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium">Recommendations:</p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {insight.recommendations.map((recommendation, idx) => (
                        <li key={idx}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 text-xs text-muted-foreground">
                  Source: {insight.source}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
} 