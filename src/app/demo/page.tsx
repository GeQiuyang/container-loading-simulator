'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { CargoItem3D } from '@/types/viewer';

const LoadingPlanViewer = dynamic(
  () => import('@/components/loading-plan-viewer'),
  { ssr: false }
);

const initialContainer = { length: 12.03, width: 2.35, height: 2.38 };

const initialItems: CargoItem3D[] = [
  {
    id: '1', name: '大型设备 A', length: 3, width: 1.5, height: 1.8, weight: 2000,
    positionX: 0.2, positionY: 0.2, positionZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '2', name: '中型箱 B', length: 2, width: 1.2, height: 1.2, weight: 800,
    positionX: 3.5, positionY: 0.3, positionZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '3', name: '中型箱 C', length: 2, width: 1.2, height: 1.2, weight: 800,
    positionX: 3.5, positionY: 1.15, positionZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '4', name: '长管 D', length: 4, width: 0.5, height: 0.6, weight: 500,
    positionX: 6, positionY: 0.1, positionZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '5', name: '方形托盘 E', length: 1.5, width: 1.5, height: 1.5, weight: 1200,
    positionX: 8, positionY: 0.4, positionZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '6', name: '小件 F', length: 1, width: 0.8, height: 1.5, weight: 350,
    positionX: 10.2, positionY: 0.2, positionZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '7', name: '二层货物 G', length: 2.5, width: 1.2, height: 0.5, weight: 600,
    positionX: 0.2, positionY: 0.2, positionZ: 1.8,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '8', name: '二层货物 H', length: 2, width: 1, height: 0.8, weight: 450,
    positionX: 3.5, positionY: 0.3, positionZ: 1.2,
    rotationX: 0, rotationY: 0, rotationZ: 0,
  },
  {
    id: '9', name: '旋转件 I', length: 1.5, width: 1, height: 0.8, weight: 300,
    positionX: 9.5, positionY: 1, positionZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 45,
  },
];

export default function DemoPage() {
  const [items, setItems] = useState<CargoItem3D[]>(initialItems);

  const handleItemsChange = useCallback((newItems: CargoItem3D[]) => {
    setItems(newItems);
  }, []);

  const handleReset = useCallback(() => {
    setItems(initialItems);
  }, []);

  const handleAddItem = useCallback(() => {
    const newItem: CargoItem3D = {
      id: `new-${Date.now()}`,
      name: `新货物 ${items.length + 1}`,
      length: 1 + Math.random() * 2,
      width: 0.5 + Math.random() * 1.5,
      height: 0.5 + Math.random() * 1.5,
      weight: 100 + Math.random() * 900,
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
    };
    setItems((prev) => [...prev, newItem]);
  }, [items.length]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">3D 交互式装载演示</h1>
          <p className="text-muted-foreground">
            40GP 集装箱 (12.03×2.35×2.38m) — 拖拽货物试试！
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddItem}
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
          >
            + 添加货物
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            重置
          </button>
          <Link
            href="/"
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            返回首页
          </Link>
        </div>
      </div>

      <LoadingPlanViewer
        container={initialContainer}
        items={items}
        interactive
        onItemsChange={handleItemsChange}
      />

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">操作指南：</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>点击</strong>货物 → 蓝色高亮选中</li>
          <li><strong>拖拽</strong>货物 → 在集装箱地面移动</li>
          <li><strong>滚轮</strong>（拖拽时）→ 调整货物 Z 轴高度（堆叠）</li>
          <li><strong>拖到集装箱外</strong> → 货物变红 → 松手移除</li>
          <li><strong>重叠时</strong> → 橙色碰撞高亮</li>
          <li>工具栏可切换 <strong>吸附网格</strong> 和 <strong>容器约束</strong></li>
          <li>关闭「Constrain」后才能拖出集装箱删除货物</li>
        </ul>
      </div>

      {/* Item list */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 font-medium">
          货物清单 ({items.length})
        </div>
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-4">名称</th>
                <th className="py-2 px-4">尺寸 (m)</th>
                <th className="py-2 px-4">位置 (x, y, z)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                if (!item) return null;
                return (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4 font-mono text-xs">
                    {item.length.toFixed(2)}×{item.width.toFixed(2)}×{item.height.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 font-mono text-xs">
                    ({item.positionX.toFixed(2)}, {item.positionY.toFixed(2)},{' '}
                    {item.positionZ.toFixed(2)})
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
