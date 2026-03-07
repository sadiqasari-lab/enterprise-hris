"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: any
}

interface ModuleStat {
  label: string
  value: string
  hint?: string
}

interface ModuleAction {
  title: string
  description: string
  status?: 'Ready' | 'Operational' | 'In Progress'
}

interface ModulePageProps {
  title: string
  description: string
  navigation: NavItem[]
  userInfo: {
    name: string
    role: string
  }
  stats?: ModuleStat[]
  actions?: ModuleAction[]
}

const statusVariant: Record<string, any> = {
  Ready: 'secondary',
  Operational: 'success',
  'In Progress': 'warning',
}

export function ModulePage({
  title,
  description,
  navigation,
  userInfo,
  stats = [],
  actions = [],
}: ModulePageProps) {
  return (
    <DashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="hover-lift">
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl">{stat.value}</CardTitle>
                </CardHeader>
                {stat.hint && (
                  <CardContent>
                    <p className="text-xs text-gray-500">{stat.hint}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
              Module Connected
            </CardTitle>
            <CardDescription className="text-green-700">
              This route is fully wired and available in live navigation.
            </CardDescription>
          </CardHeader>
        </Card>

        {actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Functions</CardTitle>
              <CardDescription>Current module capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actions.map((action) => (
                  <div
                    key={action.title}
                    className="flex items-center justify-between border rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                    {action.status && (
                      <Badge variant={statusVariant[action.status] || 'secondary'}>
                        {action.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
