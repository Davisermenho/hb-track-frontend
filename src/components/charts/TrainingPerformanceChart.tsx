'use client'

/**
 * Gráfico de Performance em Treinos (R1)
 *
 * Exibe tendências de carga interna, presença e fadiga ao longo do tempo
 */

import dynamic from 'next/dynamic'
import { TrainingPerformanceTrend } from '../../types/reports'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface TrainingPerformanceChartProps {
  data: TrainingPerformanceTrend[]
}

export default function TrainingPerformanceChart({
  data,
}: TrainingPerformanceChartProps) {
  const categories = data.map((item) =>
    new Date(item.period_start).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  )

  const attendanceData = data.map((item) => item.avg_attendance_rate)
  const loadData = data.map((item) => item.avg_internal_load || 0)

  const options: any = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ['#3b82f6', '#10b981'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#64748b',
        },
      },
    },
    yaxis: [
      {
        title: {
          text: 'Taxa de Presença (%)',
          style: {
            color: '#3b82f6',
          },
        },
        labels: {
          style: {
            colors: '#3b82f6',
          },
        },
      },
      {
        opposite: true,
        title: {
          text: 'Carga Interna',
          style: {
            color: '#10b981',
          },
        },
        labels: {
          style: {
            colors: '#10b981',
          },
        },
      },
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  }

  const series = [
    {
      name: 'Taxa de Presença (%)',
      data: attendanceData,
    },
    {
      name: 'Carga Interna Média',
      data: loadData,
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Tendências de Performance em Treinos
      </h3>
      <Chart
        options={options}
        series={series}
        type="line"
        height={350}
      />
    </div>
  )
}
