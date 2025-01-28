"use client"

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'

interface User {
  uid: string
  name: string
  email: string
  createdAt: string
  admin?: boolean
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"))
        const usersData = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User))
        setUsers(usersData)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) return <div className="p-4">Ladataan käyttäjiä...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Käyttäjähallinta</h1>
      
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">Nimi</th>
              <th className="px-6 py-3 text-left">Sähköposti</th>
              <th className="px-6 py-3 text-left">Liittynyt</th>
              <th className="px-6 py-3 text-left">Admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/admin/${user.uid}`} className="hover:underline">
                    {user.name}
                  </Link>
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  {new Date(user.createdAt).toLocaleDateString('fi-FI')}
                </td>
                <td className="px-6 py-4">
                  {user.admin ? "Kyllä" : "Ei"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}