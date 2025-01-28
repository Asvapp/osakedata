"use client"

import { useEffect, useState } from 'react'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

interface User {
 uid: string
 name: string
 email: string
 createdAt: string
 lastLogin: string
 admin?: boolean
 disabled: boolean
 favorites?: string[]
}

export default function UserPage() {
 const params = useParams()
 const userId = params.userId as string
 const [user, setUser] = useState<User | null>(null)
 const [loading, setLoading] = useState(true)
 const router = useRouter()

 useEffect(() => {
   const fetchUser = async () => {
     try {
       const userDoc = await getDoc(doc(db, "users", userId))
       if (userDoc.exists()) {
         setUser({ uid: userDoc.id, ...userDoc.data() } as User)
       }
     } catch (error) {
       console.error("Error fetching user:", error)
     } finally {
       setLoading(false)
     }
   }

   fetchUser()
 }, [userId])

 const toggleAdmin = async () => {
   if (!user) return
   try {
     await updateDoc(doc(db, "users", user.uid), {
       admin: !user.admin
     })
     setUser({ ...user, admin: !user.admin })
   } catch (error) {
     console.error("Error updating admin status:", error)
   }
 }

 const toggleAccess = async () => {
   if (!user) return
   try {
     await updateDoc(doc(db, "users", user.uid), {
       disabled: !user.disabled
     })
     setUser({ ...user, disabled: !user.disabled })
   } catch (error) {
     console.error("Error updating access status:", error)
   }
 }

 const deleteUser = async () => {
    if (!user) return
    if (window.confirm("Haluatko varmasti poistaa tämän käyttäjän?")) {
      try {
        // Kokeillaan ensin poistaa Authenticationista ja katsotaan vastaus
        const response = await fetch(`/api/deleteUser?userId=${user.uid}`, {
          method: 'DELETE'
        })
        
        const data = await response.json()
        console.log("Authentication delete response:", data)
  
        if (!response.ok) {
          throw new Error(`Failed to delete from Authentication: ${data.error}`)
        }
  
        // Sitten Firestore
        console.log("Deleting from Firestore...")
        await deleteDoc(doc(db, "users", user.uid))
        console.log("Deleted from Firestore")
        
        router.push('/admin')
      } catch (error) {
        console.error("Error deleting user:", error)
        alert("Virhe käyttäjän poistamisessa: " + error)
      }
    }
  }

 if (loading) return <div className="p-4">Ladataan käyttäjän tietoja...</div>
 if (!user) return <div className="p-4">Käyttäjää ei löytynyt</div>

 return (
   <div className="p-4">
     <div className="flex justify-between items-center mb-6">
       <Link href="/admin" className="text-blue-600 hover:underline">
         ← Takaisin
       </Link>
       <h1 className="text-2xl font-bold">Käyttäjän tiedot</h1>
       <div className="w-20"></div>
     </div>

     <div className="bg-white rounded-lg shadow p-6 space-y-6">
       <div className="grid grid-cols-2 gap-4">
         <div>
           <h2 className="font-semibold text-gray-600">Nimi</h2>
           <p>{user.name}</p>
         </div>
         <div>
           <h2 className="font-semibold text-gray-600">Sähköposti</h2>
           <p>{user.email}</p>
         </div>
         <div>
           <h2 className="font-semibold text-gray-600">Liittynyt</h2>
           <p>{new Date(user.createdAt).toLocaleDateString('fi-FI')}</p>
         </div>
         <div>
           <h2 className="font-semibold text-gray-600">Viimeisin kirjautuminen</h2>
           <p>{new Date(user.lastLogin).toLocaleDateString('fi-FI')}</p>
         </div>
         <div>
           <h2 className="font-semibold text-gray-600">Admin-oikeudet</h2>
           <p>{user.admin ? "Kyllä" : "Ei"}</p>
         </div>
         <div>
           <h2 className="font-semibold text-gray-600">Tila</h2>
           <p className={user.disabled ? "text-red-600" : "text-green-600"}>
             {user.disabled ? "Estetty" : "Aktiivinen"}
           </p>
         </div>
         <div>
           <h2 className="font-semibold text-gray-600">Suosikit</h2>
           <p>{user.favorites?.join(", ") || "Ei suosikkeja"}</p>
         </div>
       </div>

       <div className="flex gap-4 pt-6 border-t">
         <button
           onClick={toggleAdmin}
           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
         >
           {user.admin ? "Poista admin-oikeudet" : "Lisää admin-oikeudet"}
         </button>
         
         <button
           onClick={toggleAccess}
           className={`px-4 py-2 ${user.disabled ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded`}
         >
           {user.disabled ? "Aktivoi käyttäjä" : "Estä käyttäjä"}
         </button>

         <button
           onClick={deleteUser}
           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
         >
           Poista käyttäjä
         </button>
       </div>
     </div>
   </div>
 )
}