import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerfDebugPanel } from '@/components/PerfDebugPanel';
import { perfBus } from '@/utils/perfBus';

describe('<PerfDebugPanel />', () => {
  beforeEach(() => {
    perfBus.reset();
  });

  it('renders nothing when not visible', () => {
    const { container } = render(<PerfDebugPanel visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the panel container when visible', () => {
    render(<PerfDebugPanel visible={true} refreshIntervalMs={1_000} />);
    const panel = screen.getByTestId('perf-debug-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('aria-label', 'Performance debug panel');
    expect(panel.textContent).toContain('Shift+F4');
  });
});
