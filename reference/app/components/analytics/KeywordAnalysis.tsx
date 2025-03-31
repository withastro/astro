import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts"
import { Card } from "../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface KeywordMetrics {
  keyword: string
  impressions: number
  clicks: number
  ctr: number
  position: number
  cpc: number
  conversions: number
  conversionRate: number
  cost: number
  revenue: number
  roas: number
}

interface KeywordAnalysisProps {
  data: KeywordMetrics[]
  title?: string
  xAxis?: keyof Omit<KeywordMetrics, "keyword">
  yAxis?: keyof Omit<KeywordMetrics, "keyword">
  bubbleSize?: keyof Omit<KeywordMetrics, "keyword">
}

export function KeywordAnalysis({
  data,
  title = "Keyword Performance Analysis",
  xAxis = "cpc",
  yAxis = "conversionRate",
  bubbleSize = "clicks"
}: KeywordAnalysisProps) {
  const formatValue = (value: number, key: keyof Omit<KeywordMetrics, "keyword">) => {
    switch (key) {
      case "ctr":
      case "conversionRate":
        return `${value.toFixed(2)}%`
      case "cpc":
      case "cost":
      case "revenue":
        return `$${value.toFixed(2)}`
      case "position":
        return value.toFixed(1)
      case "roas":
        return value.toFixed(2)
      default:
        return value.toLocaleString()
    }
  }

  const getAxisLabel = (key: keyof Omit<KeywordMetrics, "keyword">) => {
    const labels: Record<keyof Omit<KeywordMetrics, "keyword">, string> = {
      impressions: "Impressions",
      clicks: "Clicks",
      ctr: "CTR (%)",
      position: "Avg. Position",
      cpc: "CPC ($)",
      conversions: "Conversions",
      conversionRate: "Conv. Rate (%)",
      cost: "Cost ($)",
      revenue: "Revenue ($)",
      roas: "ROAS"
    }
    return labels[key]
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div className="mb-6 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
            <XAxis
              type="number"
              dataKey={xAxis}
              name={getAxisLabel(xAxis)}
              unit={xAxis === "cpc" || xAxis === "cost" || xAxis === "revenue" ? "$" : ""}
            />
            <YAxis
              type="number"
              dataKey={yAxis}
              name={getAxisLabel(yAxis)}
              unit={yAxis === "ctr" || yAxis === "conversionRate" ? "%" : ""}
            />
            <ZAxis
              type="number"
              dataKey={bubbleSize}
              range={[50, 400]}
              name={getAxisLabel(bubbleSize)}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => {
                if (!payload || !payload.length) return null

                const data = payload[0].payload as KeywordMetrics
                return (
                  <div className="rounded-lg bg-white p-3 shadow-lg">
                    <p className="font-medium">{data.keyword}</p>
                    <p className="text-sm text-muted-foreground">
                      {getAxisLabel(xAxis)}: {formatValue(data[xAxis], xAxis)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getAxisLabel(yAxis)}: {formatValue(data[yAxis], yAxis)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getAxisLabel(bubbleSize)}: {formatValue(data[bubbleSize], bubbleSize)}
                    </p>
                  </div>
                )
              }}
            />
            <Scatter
              data={data}
              fill="currentColor"
              className="fill-primary/80"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Impressions</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>CPC</TableHead>
              <TableHead>Conv.</TableHead>
              <TableHead>Conv. Rate</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.keyword}>
                <TableCell className="font-medium">{row.keyword}</TableCell>
                <TableCell>{formatValue(row.impressions, "impressions")}</TableCell>
                <TableCell>{formatValue(row.clicks, "clicks")}</TableCell>
                <TableCell>{formatValue(row.ctr, "ctr")}</TableCell>
                <TableCell>{formatValue(row.position, "position")}</TableCell>
                <TableCell>{formatValue(row.cpc, "cpc")}</TableCell>
                <TableCell>{formatValue(row.conversions, "conversions")}</TableCell>
                <TableCell>{formatValue(row.conversionRate, "conversionRate")}</TableCell>
                <TableCell>{formatValue(row.cost, "cost")}</TableCell>
                <TableCell>{formatValue(row.revenue, "revenue")}</TableCell>
                <TableCell>{formatValue(row.roas, "roas")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
} 