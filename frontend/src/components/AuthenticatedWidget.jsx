import React from 'react'
import { useAuth } from '../context/AuthContext'
import ChatWidget from './ChatWidget'

export default function AuthenticatedWidget(){
  const { isAuthenticated } = useAuth()
  if(!isAuthenticated) return null
  return <ChatWidget />
}
