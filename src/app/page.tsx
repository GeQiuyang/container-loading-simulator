import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PipeCalculatorCard from '@/components/pipe-calculator-card';

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Container Loading Simulator</h1>
        <p className="text-muted-foreground">3D 集装箱装载可视化与优化系统</p>
      </div>

      {/* Pipe stacking calculator — core feature module */}
      <PipeCalculatorCard />

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3D 交互式装载演示</CardTitle>
            <CardDescription>
              Three.js 3D 视图 — 拖拽货物、碰撞检测、堆叠调整
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/demo">进入演示 →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">空心导管装载 (3D)</CardTitle>
            <CardDescription>
              全屏 3D 视图 — 交互式拖拽、碰撞检测、堆叠调整
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/demo/pipes">进入 3D 视图 →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Container Management</CardTitle>
            <CardDescription>管理集装箱规格、尺寸及属性</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/containers">进入管理 →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cargo Item Management</CardTitle>
            <CardDescription>管理货物条目、尺寸及重量信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/cargo-items">进入管理 →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loading Plans</CardTitle>
            <CardDescription>查看和管理装载方案</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/loading-plans">查看方案 →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
