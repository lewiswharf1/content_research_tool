import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Outlier Content Tracker</CardTitle>
            <Badge variant="secondary">v0.1</Badge>
          </div>
          <CardDescription>
            Research and track high-performing content across the web.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Stack is wired up. Frontend, Tailwind, and shadcn/ui are all running.
          </p>
          <Button className="w-full">Get Started</Button>
        </CardContent>
      </Card>
    </div>
  )
}
