'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface PerformanceRadarChartProps {
  data: {
    categories: string[];
    athlete: number[];
    teamAverage?: number[];
  };
  className?: string;
}

export function PerformanceRadarChart({ data, className }: PerformanceRadarChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'radar',
      toolbar: {
        show: false,
      },
    },
    colors: ['#3b82f6', '#94a3b8'],
    stroke: {
      width: 2,
    },
    fill: {
      opacity: 0.2,
    },
    markers: {
      size: 4,
      hover: {
        size: 6,
      },
    },
    xaxis: {
      categories: data.categories,
      labels: {
        style: {
          colors: Array(data.categories.length).fill('#6b7280'),
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      show: false,
      min: 0,
      max: 10,
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: '#374151',
      },
    },
    tooltip: {
      y: {
        formatter: (value) => value.toFixed(1),
      },
    },
  };

  const series = [
    {
      name: 'Atleta',
      data: data.athlete,
    },
    ...(data.teamAverage
      ? [
          {
            name: 'Média da Equipe',
            data: data.teamAverage,
          },
        ]
      : []),
  ];

  return (
    <div className={className}>
      <Chart options={options} series={series} type="radar" height={400} />
    </div>
  );
}