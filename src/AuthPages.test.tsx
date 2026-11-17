import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProfileEditor, RegisterPage } from './AuthPages'
import * as client from './lib/api'

function renderRegister() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><RegisterPage /></MemoryRouter></QueryClientProvider>)
}

describe('registration form', () => {
  it('validates password confirmation before contacting the API', async () => {
    const register = vi.spyOn(client.api, 'register')
    renderRegister()
    fireEvent.change(screen.getByLabelText('Tên hiển thị'), { target: { value: 'Linh Tran' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'linh@example.test' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'long-password-123' } })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: 'different-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu xác nhận chưa khớp.')
    expect(register).not.toHaveBeenCalled()
    register.mockRestore()
  })
})

describe('developer profile form', () => {
  it('requires a controlled skill selection before sending a profile', async () => {
    const skills = vi.spyOn(client.api, 'skills').mockResolvedValue([{ id: 'skill-java', slug: 'java', name: 'Java' }])
    const createProfile = vi.spyOn(client.api, 'createProfile')
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><ProfileEditor existing={null} /></MemoryRouter></QueryClientProvider>)
    await screen.findByRole('checkbox', { name: 'Java' })
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Java mentor' } })
    fireEvent.change(screen.getByLabelText('Giới thiệu'), { target: { value: 'I teach Java with small projects.' } })
    fireEvent.change(screen.getByLabelText('Cách bạn hướng dẫn'), { target: { value: 'Practice first.' } })
    fireEvent.change(screen.getByLabelText('Thời gian sẵn sàng'), { target: { value: 'Weekends' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Hãy chọn ít nhất một kỹ năng.')
    expect(createProfile).not.toHaveBeenCalled()
    skills.mockRestore()
    createProfile.mockRestore()
  })
})
