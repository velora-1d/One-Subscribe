import { useEffect } from 'react'

export default function ThemeToggle() {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.style.colorScheme = 'light'
    window.localStorage.setItem('theme', 'light')
  }, [])

  return null
}
