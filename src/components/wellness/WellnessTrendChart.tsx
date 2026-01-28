'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface WellnessTrendChartProps {
  data: {
    dates: string[];
    sleep: number[];
    fatigue: number[];
    stress: number[];
    mood: number[];
  };
  className?: string;
}

export function WellnessTrendChart({ data, className }: WellnessTrendChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
        },
      },
      zoom: {
        enabled: true,
      },
    },
    colors: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 3,
    },
    xaxis: {
      categories: data.dates,
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#374151',
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => value.toFixed(1),
      },
    },
  };

  const series = [
    {
      name: 'Sono',
      data: data.sleep,
    },
    {
      name: 'Fadiga',
      data: data.fatigue,
    },
    {
      name: 'Stress',
      data: data.stress,
    },
    {
      name: 'Humor',
      data: data.mood,
    },
  ];

  return (
    <div className={className}>
      <Chart options={options} series={series} type="line" height={350} />
    </div>
  );
}