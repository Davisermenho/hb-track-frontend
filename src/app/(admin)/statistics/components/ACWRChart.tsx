/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import type { ACWRDataPoint } from '@/lib/api/statistics';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ACWRChartProps {
  data: ACWRDataPoint[];
}

export default function ACWRChart({ data }: ACWRChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
      </div>
    );
  }

  // Prepare chart data
  const categories = data.map(d => {
    const date = new Date(d.date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  const loadData = data.map(d => d.load);
  const acwrData = data.map(d => d.acwr_ratio);

  // Calculate overtraining and optimal zones
  const overtrainingLine = data.map(() => 1.5);
  const optimalZoneUpper = data.map(() => 1.5);
  const optimalZoneLower = data.map(() => 0.8);

  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 400,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: 'transparent',
    },
    colors: ['#FB6514', '#10B981', '#3B82F6', '#8B5CF6'],
    stroke: {
      width: [0, 2, 2, 2],
      curve: 'smooth',
      dashArray: [0, 0, 5, 5],
    },
    fill: {
      type: ['solid', 'solid', 'solid', 'solid'],
      opacity: [0.85, 1, 0.3, 0.3],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      labels: {
        colors: '#6B7280',
      },
      markers: {
        size: 6,
        offsetX: 0,
        offsetY: 0,
      },
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px',
        },
        rotate: -45,
        rotateAlways: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: [
      {
        title: {
          text: 'Carga',
          style: {
            color: '#6B7280',
            fontSize: '12px',
            fontWeight: 500,
          },
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
          formatter: (value) => Math.round(value).toString(),
        },
        min: 0,
        max: 1200,
      },
      {
        opposite: true,
        title: {
          text: 'ACWR',
          style: {
            color: '#6B7280',
            fontSize: '12px',
            fontWeight: 500,
          },
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
          formatter: (value) => value.toFixed(1),
        },
        min: 0,
        max: 2,
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'light',
      y: [
        {
          formatter: (value) => `${Math.round(value)} unidades`,
        },
        {
          formatter: (value) => value.toFixed(2),
        },
        {
          formatter: () => 'Sobrecarga',
        },
        {
          formatter: () => 'Zona Ótima',
        },
      ],
    },
    annotations: {
      yaxis: [
        {
          y: 1.5,
          y2: 2,
          yAxisIndex: 1,
          fillColor: '#FEE2E2',
          opacity: 0.3,
          borderColor: 'transparent',
          label: {
            text: 'Sobrecarga',
            style: {
              color: '#DC2626',
              fontSize: '10px',
            },
            position: 'right',
            offsetY: -5,
          },
        },
        {
          y: 0.8,
          y2: 1.5,
          yAxisIndex: 1,
          fillColor: '#D1FAE5',
          opacity: 0.2,
          borderColor: 'transparent',
          label: {
            text: 'Zona Ótima',
            style: {
              color: '#059669',
              fontSize: '10px',
            },
            position: 'right',
            offsetY: 20,
          },
        },
        {
          y: 0,
          y2: 0.8,
          yAxisIndex: 1,
          fillColor: '#FEF3C7',
          opacity: 0.3,
          borderColor: 'transparent',
          label: {
            text: 'Subcarga',
            style: {
              color: '#D97706',
              fontSize: '10px',
            },
            position: 'right',
            offsetY: 50,
          },
        },
      ],
    },
  };

  const series = [
    {
      name: 'Carga',
      type: 'column',
      data: loadData,
    },
    {
      name: 'ACWR',
      type: 'line',
      data: acwrData,
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          ACWR - Relação Carga Aguda/Crônica
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Monitoramento da carga de treinamento e risco de lesão
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
        <Chart
          options={options}
          series={series}
          type="line"
          height={400}
        />
      </div>

      {/* Legend Info */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-400 mb-1">
            Subcarga (&lt; 0.8)
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            Risco de descondicionamento
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs font-medium text-green-800 dark:text-green-400 mb-1">
            Zona Ótima (0.8 - 1.5)
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">
            Carga ideal para adaptação
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-xs font-medium text-red-800 dark:text-red-400 mb-1">
            Sobrecarga (&gt; 1.5)
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            Risco elevado de lesão
          </p>
        </div>
      </div>
    </div>
  );
}
