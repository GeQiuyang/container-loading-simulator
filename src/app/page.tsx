import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Container Loading Simulator</CardTitle>
          <CardDescription>3D 集装箱装载可视化与优化系统</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" asChild>
            <Link href="/containers">Container Management</Link>
          </Button>
          <Button className="w-full" variant="outline" asChild>
            <Link href="/cargo-items">Cargo Item Management</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
