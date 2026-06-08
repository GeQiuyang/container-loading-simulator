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
        <CardContent>
          <Button className="w-full">开始使用</Button>
        </CardContent>
      </Card>
    </main>
  );
}
