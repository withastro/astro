import { ResponsiveContainer, Sankey, Tooltip } from "recharts"
import { Card } from "../ui/Card"

interface FunnelNode {
  name: string
  value: number
  color?: string
}

interface FunnelLink {
  source: number
  target: number
  value: number
}

interface ConversionFunnelProps {
  data: {
    nodes: FunnelNode[]
    links: FunnelLink[]
  }
  title?: string
  height?: number
}

export function ConversionFunnel({
  data,
  title = "Conversion Funnel",
  height = 400
}: ConversionFunnelProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            node={{
              nodePadding: 50,
              nodeWidth: 10,
              nodeRadius: 5
            }}
            link={{
              stroke: "#374151"
            }}
            width={960}
            height={500}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null

                const node = payload[0].payload
                if (!node) return null

                return (
                  <div className="rounded-lg bg-white p-3 shadow-lg">
                    <p className="font-medium">{node.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {node.value.toLocaleString()} users
                    </p>
                    {node.payload && node.payload.conversionRate && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {node.payload.conversionRate}% conversion rate
                      </p>
                    )}
                  </div>
                )
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {data.nodes.map((node, index) => (
          <div key={index} className="text-center">
            <p className="text-sm font-medium">{node.name}</p>
            <p className="text-2xl font-semibold">{node.value.toLocaleString()}</p>
            {index > 0 && data.links[index - 1] && (
              <p className="text-sm text-muted-foreground">
                {((data.links[index - 1].value / data.links[index - 1].source) * 100).toFixed(1)}%
                conversion
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
} 