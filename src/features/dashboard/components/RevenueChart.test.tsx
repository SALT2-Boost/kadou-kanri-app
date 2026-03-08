import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RevenueChart from './RevenueChart';

vi.mock('../hooks', () => ({
  useMonthlyRevenue: vi.fn(() => ({
    data: [
      {
        month: '2026-03-01',
        confirmed: 1200,
        proposed: 400,
        draft: 300,
      },
    ],
    isLoading: false,
  })),
}));

vi.mock('recharts', async () => {
  const React = await import('react');

  const mockComponent =
    (name: string) =>
    ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <div data-testid={name} data-props={JSON.stringify(props)}>
        {children}
      </div>
    );

  return {
    ResponsiveContainer: mockComponent('ResponsiveContainer'),
    BarChart: mockComponent('BarChart'),
    Bar: mockComponent('Bar'),
    XAxis: mockComponent('XAxis'),
    YAxis: mockComponent('YAxis'),
    CartesianGrid: mockComponent('CartesianGrid'),
    Tooltip: mockComponent('Tooltip'),
    Legend: mockComponent('Legend'),
    LabelList: mockComponent('LabelList'),
  };
});

describe('RevenueChart', () => {
  it('売上軸とグラフ余白に、金額が切れない設定を渡す', () => {
    render(<RevenueChart />);

    const yAxisProps = JSON.parse(screen.getByTestId('YAxis').getAttribute('data-props') ?? '{}');
    const chartProps = JSON.parse(
      screen.getByTestId('BarChart').getAttribute('data-props') ?? '{}',
    );

    expect(yAxisProps.width).toBeGreaterThanOrEqual(64);
    expect(chartProps.margin.left).toBeGreaterThanOrEqual(8);
    expect(chartProps.margin.right).toBeGreaterThanOrEqual(16);
  });
});
