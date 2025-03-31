import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface CampaignMetrics {
  platform: "Google Ads" | "Bing Ads" | "Facebook Ads" | "LinkedIn Ads" | "Reddit Ads"
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  conversionRate: number
  cost: number
  revenue: number
  roas: number
}

interface CampaignComparisonProps {
  data: CampaignMetrics[]
  metric?: keyof Omit<CampaignMetrics, "platform">
  title?: string
}

export function CampaignComparison({
  data,
  metric = "roas",
  title = "Campaign Performance Comparison"
}: CampaignComparisonProps) {
  const formatValue = (value: number, key: keyof Omit<CampaignMetrics, "platform">) => {
    switch (key) {
      case "ctr":
      case "conversionRate":
        return `${value.toFixed(2)}%`
      case "cpc":
      case "cost":
      case "revenue":
        return `$${value.toFixed(2)}`
      case "roas":
        return value.toFixed(2)
      default:
        return value.toLocaleString()
    }
  }

  const getMetricLabel = (key: keyof Omit<CampaignMetrics, "platform">) => {
    const labels: Record<keyof Omit<CampaignMetrics, "platform">, string> = {
      impressions: "Impressions",
      clicks: "Clicks",
      ctr: "CTR",
      cpc: "CPC",
      conversions: "Conversions",
      conversionRate: "Conv. Rate",
      cost: "Cost",
      revenue: "Revenue",
      roas: "ROAS"
    }
    return labels[key]
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div className="mb-6 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="platform" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => formatValue(value, metric)}
              labelStyle={{ color: "black" }}
            />
            <Bar
              dataKey={metric}
              fill="currentColor"
              className="fill-primary/80"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Impressions</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>CTR</TableHead>
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
              <TableRow key={row.platform}>
                <TableCell className="font-medium">{row.platform}</TableCell>
                <TableCell>{formatValue(row.impressions, "impressions")}</TableCell>
                <TableCell>{formatValue(row.clicks, "clicks")}</TableCell>
                <TableCell>{formatValue(row.ctr, "ctr")}</TableCell>
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