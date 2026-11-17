import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>)
}

describe('marketplace discovery foundation', () => {
  it('renders Vietnamese learning requests and filters them by search', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /Học code theo cách/ })).toBeInTheDocument()
    expect(screen.getByText('Mình muốn hiểu React hooks qua một project nhỏ')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: /Tìm theo kỹ năng/ }), { target: { value: 'Spring' } })
    expect(screen.getByText('Review giúp lộ trình học backend với Spring Boot')).toBeInTheDocument()
    expect(screen.queryByText('Mình muốn hiểu React hooks qua một project nhỏ')).not.toBeInTheDocument()
  })

  it('announces an empty result and lets a learner save a request', () => {
    renderApp()
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu yêu cầu' })[0])
    expect(screen.getByRole('button', { name: 'Bỏ lưu yêu cầu' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(screen.getByRole('textbox', { name: /Tìm theo kỹ năng/ }), { target: { value: 'Rust' } })
    expect(screen.getByText('Chưa tìm thấy yêu cầu phù hợp')).toBeInTheDocument()
  })
})
